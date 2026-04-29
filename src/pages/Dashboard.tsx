import { useState, useEffect, useRef } from 'react';
import { format, addDays, subDays, addWeeks, subWeeks, isSameDay, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, LogOut, Car, Calendar as CalendarIcon, FileClock, BarChart3 } from 'lucide-react';
import { ref as dbRef, onValue } from 'firebase/database';
import { toast } from 'sonner';
import { rtdb } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Appointment, AppointmentStatus, STATUS_LABELS } from '../types';
import AppointmentCard from '../components/AppointmentCard';
import AppointmentModal from '../components/AppointmentModal';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'PLANNING' | 'A_PREVOIR' | 'STATISTIQUES'>('PLANNING');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AppointmentStatus>('ALL');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    isFirstLoad.current = true;
    
    // Listen to Firebase RTDB "appointments" path continuously without dependency filtering
    const appointmentsRef = dbRef(rtdb, 'appointments');
    const unsubscribe = onValue(appointmentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Map RTDB data to our Appointment type
        let apptsList = Object.keys(data).map(key => {
          const apt = data[key];
          return {
            id: key,
            clientName: apt.customerName || apt.clientName || 'Inconnu',
            clientPhone: apt.customerPhone || apt.clientPhone || '',
            vehicleModel: apt.vehicleModel || 'Inconnu',
            licensePlate: apt.licensePlate || '',
            date: apt.date || '',
            startTime: apt.time || apt.startTime || '',
            status: apt.status || 'PREVU',
            notes: apt.service ? `Formule : ${apt.service}\n${apt.notes || ''}` : (apt.notes || ''),
            addedBy: apt.addedBy || 'client',
            createdAt: apt.createdAt || Date.now(),
            updatedAt: apt.updatedAt || Date.now()
          } as Appointment;
        });

        apptsList.sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          if (!a.startTime && !b.startTime) return 0;
          if (!a.startTime) return 1;
          if (!b.startTime) return -1;
          return a.startTime.localeCompare(b.startTime);
        });

        setAllAppointments(apptsList);
      } else {
        setAllAppointments([]);
      }
      isFirstLoad.current = false;
    });

    return () => unsubscribe();
  }, []);

  // Derived arrays
  const planningAppointments = allAppointments.filter(a => {
    if (!a.date) return false;
    const startDate = viewMode === 'day' ? selectedDate : startOfWeek(selectedDate, { weekStartsOn: 1 });
    const endDate = viewMode === 'day' ? selectedDate : endOfWeek(selectedDate, { weekStartsOn: 1 });
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');
    if (viewMode === 'day') return a.date === startDateStr;
    return a.date >= startDateStr && a.date <= endDateStr;
  });

  const aPrevoirAppointments = allAppointments.filter(a => a.date === '');

  const handlePrevDay = () => setSelectedDate(prev => viewMode === 'day' ? subDays(prev, 1) : subWeeks(prev, 1));
  const handleNextDay = () => setSelectedDate(prev => viewMode === 'day' ? addDays(prev, 1) : addWeeks(prev, 1));
  const handleToday = () => setSelectedDate(new Date());

  const openAddModal = () => {
    setEditingAppointment(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsModalOpen(true);
  };

  // Stats generation
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayTotal = allAppointments.filter(a => a.date === todayStr).length;
  const todayWashed = allAppointments.filter(a => a.date === todayStr && a.status === 'TERMINE').length;
  const todayRemaining = todayTotal - todayWashed;

  // Chart data: last 7 days
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const label = format(d, 'eee d', { locale: fr });
    const washed = allAppointments.filter(a => a.date === dateStr && a.status === 'TERMINE').length;
    const total = allAppointments.filter(a => a.date === dateStr).length;
    return { name: label, 'Lavés': washed, 'Total': total };
  });

  return (
    <div className="flex h-screen flex-col bg-slate-50 font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 shrink-0 bg-slate-900 border-b border-slate-700 text-white flex items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="VEVA Logo" className="w-10 h-10 rounded object-cover shadow-sm bg-slate-800 border border-slate-700" />
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold tracking-tight">VEVA AUTOMOBILE</h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest">Gestion Lavage Pro</p>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-sm font-medium">Live Update</span>
          </div>
          <div className="hidden sm:block h-8 w-px bg-slate-700"></div>
          <div className="flex items-center gap-2 ml-2">
            {user?.email === 'leartshabija@gmail.com' && (
              <button
                onClick={() => window.location.href = '/admin'}
                className="rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Admin
              </button>
            )}
            <button
              onClick={logout}
              className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 hover:bg-slate-600 transition-colors"
              aria-label="Se déconnecter"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Navigation Tabs (Mobile: Top Scroll, Desktop: Top of Sidebar) */}
        <div className="md:hidden flex gap-2 overflow-x-auto p-4 scrollbar-hide bg-white border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('PLANNING')}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === 'PLANNING' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 bg-slate-50 border border-slate-200'}`}
          >
            <CalendarIcon className="w-4 h-4" />
            Planning
          </button>
          <button 
            onClick={() => setActiveTab('A_PREVOIR')}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === 'A_PREVOIR' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 bg-slate-50 border border-slate-200'}`}
          >
            <FileClock className="w-4 h-4" />
            À Prévoir
            {aPrevoirAppointments.length > 0 && (
              <span className="ml-1 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">{aPrevoirAppointments.length}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('STATISTIQUES')}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === 'STATISTIQUES' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 bg-slate-50 border border-slate-200'}`}
          >
            <BarChart3 className="w-4 h-4" />
            Statistiques
          </button>
        </div>

        {/* Sidebar - Desktop only */}
        <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 p-6 flex-col gap-8 shrink-0 overflow-y-auto">
          <nav className="flex flex-col gap-2 border-b border-slate-100 pb-6">
            <button 
              onClick={() => setActiveTab('PLANNING')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-sm transition-colors ${activeTab === 'PLANNING' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <CalendarIcon className="w-5 h-5" />
              Planning
            </button>
            <button 
              onClick={() => setActiveTab('A_PREVOIR')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg font-bold text-sm transition-colors ${activeTab === 'A_PREVOIR' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-3">
                <FileClock className="w-5 h-5" />
                À Prévoir
              </div>
              {aPrevoirAppointments.length > 0 && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${activeTab === 'A_PREVOIR' ? 'bg-blue-200' : 'bg-slate-100 text-slate-500'}`}>
                  {aPrevoirAppointments.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('STATISTIQUES')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-sm transition-colors ${activeTab === 'STATISTIQUES' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <BarChart3 className="w-5 h-5" />
              Statistiques
            </button>
          </nav>

          <button
            onClick={openAddModal}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Ajouter Véhicule
          </button>

          {(activeTab === 'PLANNING' || activeTab === 'A_PREVOIR') && (
            <nav className="flex flex-col gap-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Filtres d'état</p>
              <button 
                onClick={() => setStatusFilter('ALL')}
                className={`flex items-center justify-between px-3 py-2 rounded-md font-medium text-sm transition-colors ${statusFilter === 'ALL' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <span>Tous les lavages</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusFilter === 'ALL' ? 'bg-blue-200' : 'bg-slate-100 text-slate-500'}`}>
                  {(activeTab === 'PLANNING' ? planningAppointments : aPrevoirAppointments).length}
                </span>
              </button>
              {(Object.entries(STATUS_LABELS) as [AppointmentStatus, string][]).map(([key, label]) => {
                const count = (activeTab === 'PLANNING' ? planningAppointments : aPrevoirAppointments).filter(a => a.status === key).length;
                if (count === 0 && statusFilter !== key) return null;
                return (
                  <button 
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    className={`flex items-center justify-between px-3 py-2 rounded-md font-medium text-sm transition-colors ${statusFilter === key ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span>{label}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusFilter === key ? 'bg-blue-200' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </aside>

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto flex flex-col gap-4 sm:gap-6 relative pb-24 sm:pb-8">
          {activeTab === 'PLANNING' && (
            <>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-slate-800">Planning</h2>
                  <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                    <button 
                      onClick={() => setViewMode('day')}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${viewMode === 'day' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Jour
                    </button>
                    <button 
                      onClick={() => setViewMode('week')}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${viewMode === 'week' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Semaine
                    </button>
                  </div>
                </div>
                
                <div className="flex bg-white rounded-lg border border-slate-200 p-1 items-center shadow-sm w-fit">
                  <button onClick={handlePrevDay} className="px-2 py-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="flex flex-col items-center px-4 min-w-[140px]">
                    <button onClick={handleToday} className="text-sm font-semibold text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                      {viewMode === 'day' 
                        ? format(selectedDate, 'dd MMM yyyy', { locale: fr })
                        : `${format(startOfWeek(selectedDate, {weekStartsOn:1}), 'dd MMM')} - ${format(endOfWeek(selectedDate, {weekStartsOn:1}), 'dd MMM yyyy', { locale: fr })}`
                      }
                    </button>
                    {viewMode === 'day' && isSameDay(selectedDate, new Date()) && (
                      <span className="text-[10px] uppercase font-bold text-blue-500">Aujourd'hui</span>
                    )}
                  </div>
                  <button onClick={handleNextDay} className="px-2 py-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'A_PREVOIR' && (
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">À Prévoir</h2>
                <p className="text-sm text-slate-500 mt-1">Véhicules en attente de planification</p>
              </div>
            </div>
          )}

          {/* Mobile Filter Pills (Only for PLANNING and A_PREVOIR) */}
          {(activeTab === 'PLANNING' || activeTab === 'A_PREVOIR') && (
            <div className="md:hidden flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
              <button 
                onClick={() => setStatusFilter('ALL')}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
              >
                Tous
              </button>
              {(Object.entries(STATUS_LABELS) as [AppointmentStatus, string][]).map(([key, label]) => {
                const count = (activeTab === 'PLANNING' ? planningAppointments : aPrevoirAppointments).filter(a => a.status === key).length;
                if (count === 0 && statusFilter !== key) return null;
                return (
                  <button 
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${statusFilter === key ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* List Content */}
          {(activeTab === 'PLANNING' || activeTab === 'A_PREVOIR') && (
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-0">
              <div className="grid grid-cols-[60px_1fr] sm:grid-cols-[100px_1fr] bg-slate-50 border-b border-slate-200 shrink-0">
                <div className="p-3 text-xs font-bold text-slate-400 text-center">{activeTab === 'PLANNING' ? 'HEURE' : 'DATE'}</div>
                <div className="p-3 text-xs font-bold text-slate-400 border-l border-slate-200 pl-4 sm:pl-6">DÉTAILS DU VÉHICULE & CLIENT</div>
              </div>
              
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {(activeTab === 'PLANNING' ? planningAppointments : aPrevoirAppointments).filter(a => statusFilter === 'ALL' || a.status === statusFilter).length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                    <div className="mb-4 rounded-full bg-slate-50 border border-slate-100 p-4">
                      <Car className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-500">Aucun véhicule</h3>
                    <p className="mt-1 text-sm text-slate-400">Rien à afficher avec ces filtres.</p>
                  </div>
                ) : activeTab === 'PLANNING' && viewMode === 'week' ? (
                  // Group by day for week view
                  Object.entries(
                    planningAppointments.filter(a => statusFilter === 'ALL' || a.status === statusFilter).reduce((groups, appt) => {
                      if (!groups[appt.date]) groups[appt.date] = [];
                      groups[appt.date].push(appt);
                      return groups;
                    }, {} as Record<string, Appointment[]>)
                  ).map(([dateStr, dayAppointments]) => (
                    <div key={dateStr} className="flex flex-col border-b border-slate-100 last:border-0">
                      <div className="bg-slate-50 px-4 sm:px-6 py-2 border-b border-slate-100 sticky top-0 z-10 shadow-sm flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-700 capitalize">
                          {format(parseISO(dateStr), 'EEEE d MMMM', { locale: fr })}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {dayAppointments.length} lavage{dayAppointments.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div>
                        {dayAppointments.map((appointment) => (
                          <AppointmentCard 
                            key={appointment.id} 
                            appointment={appointment} 
                            onClick={() => openEditModal(appointment)}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  (activeTab === 'PLANNING' ? planningAppointments : aPrevoirAppointments)
                    .filter(a => statusFilter === 'ALL' || a.status === statusFilter)
                    .map((appointment) => (
                    <AppointmentCard 
                      key={appointment.id} 
                      appointment={appointment} 
                      onClick={() => openEditModal(appointment)}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'STATISTIQUES' && (
            <div className="flex-1 flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Total aujourd'hui</p>
                  <p className="text-3xl font-bold text-slate-800">{todayTotal}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Lavés (Terminés)</p>
                  <p className="text-3xl font-bold text-green-600">{todayWashed}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">À faire (ou annulés)</p>
                  <p className="text-3xl font-bold text-blue-600">{todayRemaining}</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1 min-h-[300px]">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Évolution sur 7 jours</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                    <RechartsTooltip 
                      cursor={{fill: '#F8FAFC'}}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="Total" fill="#CBD5E1" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="Lavés" fill="#16A34A" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Floating Action Button (Mobile) */}
          {activeTab !== 'STATISTIQUES' && (
            <div className="md:hidden fixed bottom-6 right-6 z-20">
              <button
                onClick={openAddModal}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition-transform active:scale-95"
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>
          )}
        </main>
      </div>

      {isModalOpen && (
        <AppointmentModal
          isOpen={isModalOpen}
          initialDate={selectedDate}
          appointment={editingAppointment}
          defaultToPlan={activeTab === 'A_PREVOIR'}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
