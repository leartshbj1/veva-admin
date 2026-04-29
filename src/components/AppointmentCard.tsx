import { Appointment, STATUS_CARD_STYLES, STATUS_BADGE_STYLES, STATUS_LABELS } from '../types';
import { cn } from '../lib/utils';
import { CheckCircle, XCircle } from 'lucide-react';
import { ref as dbRef, update } from 'firebase/database';
import { rtdb } from '../lib/firebase';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AppointmentCardProps {
  appointment: Appointment;
  onClick: () => void;
}

export default function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
  const handleStatusChange = async (e: React.MouseEvent, status: 'TERMINE' | 'ANNULE') => {
    e.stopPropagation();
    try {
      const rtdbRef = dbRef(rtdb, `appointments/${appointment.id}`);
      const updateData: any = {
        status,
        updatedAt: Date.now()
      };
      if (status === 'TERMINE' && !appointment.date) {
        updateData.date = format(new Date(), 'yyyy-MM-dd');
      }
      await update(rtdbRef, updateData);
    } catch (error) {
      console.error('Failed to change status', error);
    }
  };

  return (
    <div className="grid grid-cols-[60px_1fr] sm:grid-cols-[100px_1fr] group cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={onClick}>
      <div className="p-4 text-xs font-medium text-slate-400 text-center bg-slate-50 flex flex-col justify-center border-r sm:border-r-0 border-slate-100 sm:border-transparent">
        {!appointment.date ? (
          <span className="italic text-[10px] leading-tight">À planifier</span>
        ) : (
          appointment.startTime || '--:--'
        )}
      </div>
      <div className={cn(
        "p-4 sm:border-l border-slate-200 relative", 
        appointment.status === 'ANNULE' && "opacity-60 grayscale hover:grayscale-0 transition-all"
      )}>
        <div className={cn(
          "flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 sm:py-3 border rounded-xl gap-3 sm:gap-4 shadow-sm sm:shadow-none", 
          STATUS_CARD_STYLES[appointment.status]
        )}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-sm font-bold text-slate-900 uppercase truncate">{appointment.vehicleModel}</span>
              <span className={cn("text-[10px] px-2 py-0.5 rounded font-bold uppercase", STATUS_BADGE_STYLES[appointment.status])}>
                {STATUS_LABELS[appointment.status]}
              </span>
              {appointment.licensePlate && (
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-white/60 border border-black/5 text-slate-600 font-mono">
                  {appointment.licensePlate}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate">
              Client: <span className="font-medium">{appointment.clientName}</span>
              {appointment.clientPhone && (
                <> &bull; <a href={`tel:${appointment.clientPhone}`} className="hover:underline text-slate-600" onClick={(e) => e.stopPropagation()}>{appointment.clientPhone}</a></>
              )}
            </p>
          </div>
          
          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 mt-2 sm:mt-0">
            {appointment.notes && (
              <div className="flex items-center gap-2 text-slate-500 text-xs sm:italic max-w-[200px] break-words whitespace-pre-wrap sm:text-right">
                {appointment.notes}
              </div>
            )}
            
            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              {appointment.status !== 'TERMINE' && (
                <button 
                  onClick={(e) => handleStatusChange(e, 'TERMINE')}
                  className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                  title="Marquer comme terminé"
                >
                  <CheckCircle className="w-6 h-6 sm:w-5 sm:h-5" />
                </button>
              )}
              {appointment.status !== 'ANNULE' && (
                <button 
                  onClick={(e) => handleStatusChange(e, 'ANNULE')}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Annuler le rendez-vous"
                >
                  <XCircle className="w-6 h-6 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
