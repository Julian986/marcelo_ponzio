/**
 * Servicios para los que la reserva pública exige seña (Mercado Pago).
 * El resto se confirma al instante con `paymentStatus: not_required`.
 */
const IDS = [
  "peinado-recogido",
  "color-retoque-reflejos",
  "color-mechas-total",
  "mechas-contramechas",
  "balayage",
  "reflejos-gorra",
  "reflejos-papel-retoque",
  "reflejos-papel-completo",
  "barrido",
  "planchado",
  "keratina",
] as const;

const SET = new Set<string>(IDS);

export function treatmentRequiresPublicDeposit(treatmentId: string): boolean {
  return SET.has(treatmentId.trim());
}
