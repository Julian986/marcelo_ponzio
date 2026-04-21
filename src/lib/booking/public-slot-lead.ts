import { formatInTimeZone } from "date-fns-tz";

import { filterSlotsServiceEndsOnOrBeforeClose, getAvailableTimesForDate } from "@/lib/booking/salon-availability";
import { filterPublicSlotsByTreatmentRules } from "@/lib/booking/treatment-slot-rules";
import { findSalonTreatmentById } from "@/lib/treatments/catalog";

/** Agenda y “hoy” para reglas de reserva pública (Rosario = mismo offset que CABA). */
export const RESERVATION_TZ = "America/Argentina/Buenos_Aires";

const PUBLIC_MIN_LEAD_DAYS = 2;

export function argentinaTodayDateKey(now = new Date()): string {
  return formatInTimeZone(now, RESERVATION_TZ, "yyyy-MM-dd");
}

function minPublicBookableDateKey(now = new Date()): string {
  return formatInTimeZone(
    new Date(now.getTime() + PUBLIC_MIN_LEAD_DAYS * 24 * 60 * 60 * 1000),
    RESERVATION_TZ,
    "yyyy-MM-dd",
  );
}

/** Horarios visibles para usuarios web: solo desde 2 días en adelante. */
export function getPublicBookableTimeSlots(dateKey: string, now = new Date()): string[] {
  if (dateKey < minPublicBookableDateKey(now)) return [];
  const raw = getAvailableTimesForDate(dateKey);
  return raw;
}

/**
 * Reserva pública (sin DB): mínimo 2 días de anticipación, cierre vs duración del servicio,
 * reflejos/balayage / keratina.
 * Para solapes entre clientes usá `computeBookableSlots` + `/api/booking/slots`.
 */
export function getPublicBookableTimeSlotsForTreatment(
  treatmentId: string | undefined,
  dateKey: string,
  now = new Date(),
): string[] {
  let slots = getPublicBookableTimeSlots(dateKey, now);
  if (treatmentId) {
    const t = findSalonTreatmentById(treatmentId);
    if (t) {
      slots = filterSlotsServiceEndsOnOrBeforeClose(slots, t.durationMinutes);
    }
  }
  return filterPublicSlotsByTreatmentRules(treatmentId, slots);
}

/** Validación servidor para reserva pública (misma regla que UI). */
export function isPublicLeadTimeViolated(dateKey: string, startsAt: Date, now = new Date()): boolean {
  void startsAt;
  return dateKey < minPublicBookableDateKey(now);
}
