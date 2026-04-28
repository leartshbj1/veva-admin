import { useState, useEffect } from 'react';
import { X, Loader2, Calendar as CalendarIcon, Clock, Car, User, Phone, AlignLeft } from 'lucide-react';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorUtils';
import { useAuth } from '../contexts/AuthContext';
import { Appointment, AppointmentStatus, STATUS_LABELS } from '../types';

interface AppointmentModalProps {
  isOpen: boolean;
  initialDate: Date;
  appointment?: Appointment;
  onClose: () => void;
}

export default function AppointmentModal({ isOpen, initialDate, appointment, onClose }: AppointmentModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const isEditing = !!appointment;

  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    vehicleModel: '',
    licensePlate: '',
    date: format(initialDate, 'yyyy-MM-dd'),
    startTime: '',
    status: 'PREVU' as AppointmentStatus,
    notes: '',
  });

  useEffect(() => {
    if (appointment) {
      setFormData({
        clientName: appointment.clientName,
        clientPhone: appointment.clientPhone || '',
        vehicleModel: appointment.vehicleModel,
        licensePlate: appointment.licensePlate || '',
        date: appointment.date,
        startTime: appointment.startTime || '',
        status: appointment.status,
        notes: appointment.notes || '',
      });
    } else {
      setFormData(prev => ({ ...prev, date: format(initialDate, 'yyyy-MM-dd') }));
    }
  }, [appointment, initialDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      if (isEditing) {
        const ref = doc(db, 'appointments', appointment.id);
        const dataToUpdate = {
          ...formData, // Spread form fields
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        };
        await updateDoc(ref, dataToUpdate);
      } else {
        const id = crypto.randomUUID(); // Good enough for IDs
        const ref = doc(db, 'appointments', id);
        const newAppt = {
          ...formData,
          addedBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(ref, newAppt);
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, isEditing ? OperationType.UPDATE : OperationType.CREATE, 'appointments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end sm:justify-center bg-black/50 p-0 sm:p-4 transition-opacity">
      <div className="flex h-[90vh] w-full flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-lg overflow-hidden animate-in slide-in-from-bottom-full sm:zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
          </h2>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form id="appointment-form" onSubmit={handleSubmit} className="space-y-5">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="block w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 pl-10 text-sm focus:border-blue-600 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Heure (Optionnel)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Clock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    className="block w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 pl-10 text-sm focus:border-blue-600 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as AppointmentStatus })}
                className="block w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm focus:border-blue-600 focus:ring-blue-600 focus:outline-none"
              >
                {(Object.entries(STATUS_LABELS) as [AppointmentStatus, string][]).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="border-t border-gray-100 pt-4" />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Client</label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                <input
                  type="text"
                  required
                  placeholder="Nom du client"
                  value={formData.clientName}
                  onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                  className="block w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 pl-10 text-sm focus:border-blue-600 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Téléphone (Optionnel)</label>
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                <input
                  type="tel"
                  placeholder="06 12 34 56 78"
                  value={formData.clientPhone}
                  onChange={e => setFormData({ ...formData, clientPhone: e.target.value })}
                  className="block w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 pl-10 text-sm focus:border-blue-600 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4" />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Véhicule</label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Car className="h-4 w-4 text-gray-400" />
                  </div>
                <input
                  type="text"
                  required
                  placeholder="Marque / Modèle (ex: Peugeot 3008)"
                  value={formData.vehicleModel}
                  onChange={e => setFormData({ ...formData, vehicleModel: e.target.value })}
                  className="block w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 pl-10 text-sm focus:border-blue-600 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Immatriculation (Optionnel)</label>
              <input
                type="text"
                placeholder="AB-123-CD"
                value={formData.licensePlate}
                onChange={e => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                className="block w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm uppercase focus:border-blue-600 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes / Remarques</label>
               <div className="relative">
                 <div className="absolute top-3 left-0 flex items-center pl-3 pointer-events-none">
                    <AlignLeft className="h-4 w-4 text-gray-400" />
                  </div>
                <textarea
                  rows={3}
                  placeholder="Détails du lavage, options choisies, état du véhicule..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="block w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 pl-10 text-sm focus:border-blue-600 focus:ring-blue-600 focus:outline-none resize-none"
                />
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse rounded-b-2xl">
          <button
            type="submit"
            form="appointment-form"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 sm:w-auto shadow-sm"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Enregistrer' : 'Confirmer le lavage'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="mt-3 w-full rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors sm:mt-0 sm:mr-3 sm:w-auto shadow-sm tracking-wide"
          >
            Annuler
          </button>
        </div>

      </div>
    </div>
  );
}
