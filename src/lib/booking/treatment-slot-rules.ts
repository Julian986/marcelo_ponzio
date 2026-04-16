/**
 * Reglas de agenda indicadas por el salón (reserva pública).
 * Horarios base: `salon-availability.ts`.
 */

/** Inicio del turno hasta las 14:00 inclusive (string HH:mm para comparar con slots). */
export const REFLEJOS_BALAYAGE_LATEST_START = "14:00";

const TREATMENT_IDS_START_NO_LATER_THAN_14 = new Set<string>([
  "balayage",
  "reflejos-gorra",
  "reflejos-papel-retoque",
  "reflejos-papel-completo",
  "color-retoque-reflejos",
]);

export const KERATINA_ONLY_TIME_LOCAL = "15:30";

export function treatmentRequiresStartNoLaterThan14(treatmentId: string): boolean {
  return TREATMENT_IDS_START_NO_LATER_THAN_14.has(treatmentId);
}

export function treatmentIsKeratinaOnly1530(treatmentId: string): boolean {
  return treatmentId === "keratina";
}

/** Recibe slots ya filtrados por día y reglas de “hoy” (p. ej. `getPublicBookableTimeSlots`). */
export function filterPublicSlotsByTreatmentRules(
  treatmentId: string | undefined,
  slots: string[],
): string[] {
  if (!treatmentId) return slots;
  if (treatmentIsKeratinaOnly1530(treatmentId)) {
    return slots.filter((t) => t === KERATINA_ONLY_TIME_LOCAL);
  }
  if (treatmentRequiresStartNoLaterThan14(treatmentId)) {
    return slots.filter((t) => t <= REFLEJOS_BALAYAGE_LATEST_START);
  }
  return slots;
}
