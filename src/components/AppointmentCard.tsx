import { Appointment, STATUS_CARD_STYLES, STATUS_BADGE_STYLES, STATUS_LABELS } from '../types';
import { cn } from '../lib/utils';

interface AppointmentCardProps {
  appointment: Appointment;
  onClick: () => void;
}

export default function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
  return (
    <div className="grid grid-cols-[60px_1fr] sm:grid-cols-[100px_1fr] group cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={onClick}>
      <div className="p-4 text-sm font-medium text-slate-400 text-center bg-slate-50 flex flex-col justify-center border-r sm:border-r-0 border-slate-100 sm:border-transparent">
        {appointment.startTime || '--:--'}
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
          
          {appointment.notes && (
            <div className="flex items-center gap-2 text-slate-500 text-xs sm:italic sm:max-w-xs break-words whitespace-pre-wrap shrink-0 sm:text-right">
              {appointment.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
