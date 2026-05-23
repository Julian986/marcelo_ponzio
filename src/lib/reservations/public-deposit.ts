/**
 * Seña en reserva pública (Mercado Pago): todo el catálogo excepto corte, despuntado y peinados.
 * En combos, si algún servicio exige seña, el turno completo va por Mercado Pago.
 */
const NO_DEPOSIT_IDS = new Set([
  "corte-dama",
  "despuntado",
  "peinado-brushing",
  "peinado-ondas",
  "peinado-medio-recogido",
  "peinado-recogido",
]);

export function treatmentRequiresPublicDeposit(treatmentId: string): boolean {
  return !NO_DEPOSIT_IDS.has(treatmentId.trim());
}
