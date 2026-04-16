import { formatInTimeZone } from "date-fns-tz";

import { filterSlotsServiceEndsOnOrBeforeClose, getAvailableTimesForDate } from "@/lib/booking/salon-availability";
import { filterPublicSlotsByTreatmentRules } from "@/lib/booking/treatment-slot-rules";
import { findSalonTreatmentById } from "@/lib/treatments/catalog";

/** Agenda y “hoy” para reglas de reserva pública (Rosario = mismo offset que CABA). */
export const RESERVATION_TZ = "America/Argentina/Buenos_Aires";

const PUBLIC_MIN_LEAD_MS = 60 * 60 * 1000;

/** Misma regla que `computeStartsAtUtc` en reservations/service (ART fijo UTC-3). */
function slotStartsAtUtcArt(dateKey: string, timeLocal: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !/^\d{2}:\d{2}$/.test(timeLocal)) {
    return null;
  }
  const d = new Date(`${dateKey}T${timeLocal}:00-03:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function argentinaTodayDateKey(now = new Date()): string {
  return formatInTimeZone(now, RESERVATION_TZ, "yyyy-MM-dd");
}

/** Horarios visibles para usuarios web: si es hoy en AR, solo slots con ≥ 60 min de anticipación. */
export function getPublicBookableTimeSlots(dateKey: string, now = new Date()): string[] {
  const raw = getAvailableTimesForDate(dateKey);
  if (dateKey !== argentinaTodayDateKey(now)) return raw;
  const cutoff = now.getTime() + PUBLIC_MIN_LEAD_MS;
  return raw.filter((timeLocal) => {
    const d = slotStartsAtUtcArt(dateKey, timeLocal);
    return d !== null && d.getTime() >= cutoff;
  });
}

/**
 * Reserva pública (sin DB): margen 60 min en “hoy”, cierre vs duración del servicio, reflejos/balayage / keratina.
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
  if (dateKey !== argentinaTodayDateKey(now)) return false;
  return startsAt.getTime() < now.getTime() + PUBLIC_MIN_LEAD_MS;
}
