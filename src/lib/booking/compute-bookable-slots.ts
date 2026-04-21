import type { Db, ObjectId } from "mongodb";
import { ObjectId as ObjectIdCtor } from "mongodb";

import { buildCapGetterForDate } from "@/lib/booking/agenda-blocks";
import { getAvailableTimesForDate, filterSlotsServiceEndsOnOrBeforeClose } from "@/lib/booking/salon-availability";
import { getPublicBookableTimeSlots } from "@/lib/booking/public-slot-lead";
import { filterPublicSlotsByTreatmentRules } from "@/lib/booking/treatment-slot-rules";
import { filterSlotsBySalonCapacity, loadBusyIntervalsMs } from "@/lib/booking/slot-overlap";
import { findSalonTreatmentById } from "@/lib/treatments/catalog";

export type BookingSlotScope = "public" | "panel";

/**
 * Horarios elegibles para un día y tratamiento (plantilla + reglas de servicio + solapes con DB).
 */
export async function computeBookableSlots(
  db: Db,
  params: {
    dateKey: string;
    treatmentId: string;
    now: Date;
    scope: BookingSlotScope;
    /** Al reprogramar, excluir esta reserva del cómputo de ocupación. */
    excludeReservationHexId?: string | null;
  },
): Promise<string[]> {
  const treatment = findSalonTreatmentById(params.treatmentId.trim());
  if (!treatment) return [];

  let excludeId: ObjectId | undefined;
  const ex = params.excludeReservationHexId?.trim();
  if (ex && /^[a-f0-9]{24}$/i.test(ex)) {
    try {
      excludeId = new ObjectIdCtor(ex);
    } catch {
      excludeId = undefined;
    }
  }

  let slots =
    params.scope === "public"
      ? getPublicBookableTimeSlots(params.dateKey, params.now)
      : getAvailableTimesForDate(params.dateKey);

  slots = filterSlotsServiceEndsOnOrBeforeClose(slots, treatment.durationMinutes);
  slots = filterPublicSlotsByTreatmentRules(treatment.id, slots);
  const busy = await loadBusyIntervalsMs(db, params.dateKey, excludeId);
  const capGetter = await buildCapGetterForDate(db, params.dateKey);
  return filterSlotsBySalonCapacity(slots, params.dateKey, treatment.durationMinutes, busy, capGetter);
}
