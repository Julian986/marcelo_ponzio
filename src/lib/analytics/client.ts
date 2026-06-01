/**
 * Cliente GA4 (gtag.js) — pageviews y envío de eventos.
 * Activo en producción, o en desarrollo con NEXT_PUBLIC_GA_DEBUG=true.
 */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";

/** Mismo nombre que métricas server-side de sesión WhatsApp. */
export const GA_EVENT_CUSTOMER_SESSION_START = "customer_session_start";

const GA_DEBUG = process.env.NEXT_PUBLIC_GA_DEBUG === "true";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function isAnalyticsEnabled(): boolean {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID) return false;
  if (typeof window.gtag !== "function") return false;
  return process.env.NODE_ENV === "production" || GA_DEBUG;
}

export function isAnalyticsDebugMode(): boolean {
  return GA_DEBUG && Boolean(GA_MEASUREMENT_ID);
}

/**
 * Registra un pageview (SPA). Incluir query si aplica: `/turnos?treatment=Color`.
 */
export function pageview(url: string): void {
  if (!isAnalyticsEnabled()) return;
  const page_path = url.startsWith("/") ? url : `/${url}`;
  window.gtag!("config", GA_MEASUREMENT_ID, {
    page_path,
    page_location: typeof window !== "undefined" ? `${window.location.origin}${page_path}` : undefined,
  });
}

/** Envío directo a gtag (event name = `action`). */
export function sendAnalyticsEvent(
  action: string,
  params?: Record<string, unknown>,
): void {
  if (!isAnalyticsEnabled()) return;
  window.gtag!("event", action, params ?? {});
}

/** @deprecated Usar `sendAnalyticsEvent` o `trackEvent` desde `./track`. */
export function event(action: string, params?: Record<string, unknown>): void {
  sendAnalyticsEvent(action, params);
}
