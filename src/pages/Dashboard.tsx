import { useState, useEffect, useRef } from 'react';
import { format, addDays, subDays, addWeeks, subWeeks, isSameDay, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, LogOut, Car } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorUtils';
import { useAuth } from '../contexts/AuthContext';
import { Appointment, AppointmentStatus, STATUS_LABELS } from '../types';
import AppointmentCard from '../components/AppointmentCard';
import AppointmentModal from '../components/AppointmentModal';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AppointmentStatus>('ALL');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    isFirstLoad.current = true;
    const startDate = viewMode === 'day' ? selectedDate : startOfWeek(selectedDate, { weekStartsOn: 1 });
    const endDate = viewMode === 'day' ? selectedDate : endOfWeek(selectedDate, { weekStartsOn: 1 });
    
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');

    const q = viewMode === 'day' 
      ? query(collection(db, 'appointments'), where('date', '==', startDateStr))
      : query(collection(db, 'appointments'), where('date', '>=', startDateStr), where('date', '<=', endDateStr));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Handle Toast Notifications
        if (!isFirstLoad.current) {
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as Appointment;
            if (change.type === 'added') {
              toast.success(`Nouveau lavage : ${data.vehicleModel}`);
            } else if (change.type === 'modified') {
              toast.info(`Lavage mis à jour : ${data.vehicleModel}`);
            } else if (change.type === 'removed') {
              toast.error(`Lavage annulé/supprimé : ${data.vehicleModel}`);
            }
          });
        }
        
        const appts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
        appts.sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          if (!a.startTime && !b.startTime) return 0;
          if (!a.startTime) return 1;
          if (!b.startTime) return -1;
          return a.startTime.localeCompare(b.startTime);
        });
        setAppointments(appts);
        
        isFirstLoad.current = false;
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'appointments');
      }
    );

    return () => unsubscribe();
  }, [selectedDate, viewMode]);

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

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop only */}
        <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 p-6 flex-col gap-8 shrink-0 overflow-y-auto">
          <button
            onClick={openAddModal}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Ajouter Véhicule
          </button>

          <nav className="flex flex-col gap-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Filtres d'état</p>
            <button 
              onClick={() => setStatusFilter('ALL')}
              className={`flex items-center justify-between px-3 py-2 rounded-md font-medium text-sm transition-colors ${statusFilter === 'ALL' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <span>Tous les lavages</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusFilter === 'ALL' ? 'bg-blue-200' : 'bg-slate-100 text-slate-500'}`}>{appointments.length}</span>
            </button>
            {(Object.entries(STATUS_LABELS) as [AppointmentStatus, string][]).map(([key, label]) => {
              const count = appointments.filter(a => a.status === key).length;
              if (count === 0 && statusFilter !== key) return null; // Hide empty filters unless selected
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
        </aside>

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto flex flex-col gap-4 sm:gap-6 relative pb-24 sm:pb-8">
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
            
            {/* Date Selector */}
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

          {/* Mobile Filter Pills */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
            <button 
              onClick={() => setStatusFilter('ALL')}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
            >
              Tous
            </button>
            {(Object.entries(STATUS_LABELS) as [AppointmentStatus, string][]).map(([key, label]) => {
              const count = appointments.filter(a => a.status === key).length;
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

          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-0">
            <div className="grid grid-cols-[60px_1fr] sm:grid-cols-[100px_1fr] bg-slate-50 border-b border-slate-200 shrink-0">
              <div className="p-3 text-xs font-bold text-slate-400 text-center">HEURE</div>
              <div className="p-3 text-xs font-bold text-slate-400 border-l border-slate-200 pl-4 sm:pl-6">DÉTAILS DU VÉHICULE & CLIENT</div>
            </div>
            
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {appointments.filter(a => statusFilter === 'ALL' || a.status === statusFilter).length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                  <div className="mb-4 rounded-full bg-slate-50 border border-slate-100 p-4">
                    <Car className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-500">Aucun lavage prévu</h3>
                  <p className="mt-1 text-sm text-slate-400">La période est libre pour le moment.</p>
                </div>
              ) : viewMode === 'week' ? (
                // Group by day for week view
                Object.entries(
                  appointments.filter(a => statusFilter === 'ALL' || a.status === statusFilter).reduce((groups, appt) => {
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
                appointments.filter(a => statusFilter === 'ALL' || a.status === statusFilter).map((appointment) => (
                  <AppointmentCard 
                    key={appointment.id} 
                    appointment={appointment} 
                    onClick={() => openEditModal(appointment)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Floating Action Button (Mobile) */}
          <div className="md:hidden fixed bottom-6 right-6 z-20">
            <button
              onClick={openAddModal}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition-transform active:scale-95"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>
        </main>
      </div>

      {isModalOpen && (
        <AppointmentModal
          isOpen={isModalOpen}
          initialDate={selectedDate}
          appointment={editingAppointment}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
