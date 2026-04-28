export type AppointmentStatus = 'PREVU' | 'EN_COURS' | 'PRET' | 'TERMINE' | 'ANNULE';

export const STATUS_CARD_STYLES: Record<AppointmentStatus, string> = {
  PREVU: 'border-blue-200 bg-blue-50/50',
  EN_COURS: 'border-amber-200 bg-amber-50',
  PRET: 'border-green-200 bg-green-50/50',
  TERMINE: 'border-slate-200 bg-white shadow-sm',
  ANNULE: 'border-red-200 bg-red-50',
};

export const STATUS_BADGE_STYLES: Record<AppointmentStatus, string> = {
  PREVU: 'bg-blue-100 text-blue-700',
  EN_COURS: 'bg-amber-100 text-amber-700',
  PRET: 'bg-green-100 text-green-700',
  TERMINE: 'bg-slate-100 text-slate-700',
  ANNULE: 'bg-red-100 text-red-700',
};

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PREVU: 'Prévu',
  EN_COURS: 'En cours',
  PRET: 'Prêt',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
};

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone?: string;
  vehicleModel: string;
  licensePlate?: string;
  date: string; // YYYY-MM-DD
  startTime?: string;
  status: AppointmentStatus;
  notes?: string;
  addedBy: string;
  updatedBy?: string;
  createdAt: number;
  updatedAt: number;
}
