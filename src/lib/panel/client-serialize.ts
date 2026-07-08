import type { ReservationDoc } from "@/lib/reservations/types";

export type PanelClientVisit = {
  id: string;
  treatmentName: string;
  category: string;
  dateKey: string;
  timeLocal: string;
  displayDate: string;
  reservationStatus: string;
  technicalNote: string | null;
};

export function serializePanelClientVisit(r: ReservationDoc): PanelClientVisit {
  return {
    id: r._id.toHexString(),
    treatmentName: r.treatmentName,
    category: r.category,
    dateKey: r.dateKey,
    timeLocal: r.timeLocal,
    displayDate: r.displayDate,
    reservationStatus: r.reservationStatus,
    technicalNote: r.technicalNote?.trim() ? r.technicalNote.trim() : null,
  };
}
