import type { Db } from "mongodb";

import { getAvailableTimesForDate, filterSlotsServiceEndsOnOrBeforeClose } from "@/lib/booking/salon-availability";
import { getPublicBookableTimeSlots } from "@/lib/booking/public-slot-lead";
import { filterPublicSlotsByTreatmentRules } from "@/lib/booking/treatment-slot-rules";
import {
  filterSlotsWithoutOverlap,
  loadBusyIntervalsMs,
} from "@/lib/booking/slot-overlap";
import { findSalonTreatmentById } from "@/lib/treatments/catalog";

export type BookingSlotScope = "public" | "panel";

/**
 * Horarios elegibles para un día y tratamiento (plantilla + reglas de servicio + solapes con DB).
 */
export async function computeBookableSlots(
  db: Db,
  params: { dateKey: string; treatmentId: string; now: Date; scope: BookingSlotScope },
): Promise<string[]> {
  const treatment = findSalonTreatmentById(params.treatmentId.trim());
  if (!treatment) return [];

  let slots =
    params.scope === "public"
      ? getPublicBookableTimeSlots(params.dateKey, params.now)
      : getAvailableTimesForDate(params.dateKey);

  slots = filterSlotsServiceEndsOnOrBeforeClose(slots, treatment.durationMinutes);
  slots = filterPublicSlotsByTreatmentRules(treatment.id, slots);
  const busy = await loadBusyIntervalsMs(db, params.dateKey);
  return filterSlotsWithoutOverlap(slots, params.dateKey, treatment.durationMinutes, busy);
}
