import { normalizePhoneDigits } from "@/lib/booking/salon-availability";

/**
 * Clave única para cruzar el mismo WhatsApp argentino aunque lo escriban con o sin +54 / 9 / espacios.
 * - Con país: 549… (móvil)
 * - Solo dígitos locales (8–10): se asume móvil y se antepone 549
 */
export function canonicalPhoneDigitsAR(raw: string): string {
  const d = normalizePhoneDigits(raw);
  if (!d) return "";

  if (d.startsWith("549")) return d;
  if (d.startsWith("54")) return d;

  if (d.length >= 8 && d.length <= 11) {
    return `549${d}`;
  }

  return d;
}

/** Valores a buscar en `customerPhoneDigits` (canónico + variantes viejas). */
export function customerPhoneDigitsQueryValues(canonical: string): string[] {
  const s = new Set<string>();
  if (canonical) s.add(canonical);
  if (canonical.startsWith("549") && canonical.length >= 11) {
    const rest = canonical.slice(3);
    s.add(rest);
    if (rest.length >= 10) s.add(rest.slice(-10));
  }
  return [...s];
}
