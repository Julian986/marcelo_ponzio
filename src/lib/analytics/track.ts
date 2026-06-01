import { sendAnalyticsEvent } from "@/lib/analytics/client";
import type { TrackEventParams } from "@/lib/analytics/types";

/**
 * Evento personalizado con categoría/etiqueta (compatible con informes tipo UA).
 */
export function trackEvent({
  action,
  category,
  label,
  value,
  ...rest
}: TrackEventParams): void {
  sendAnalyticsEvent(action, {
    event_category: category,
    ...(label !== undefined ? { event_label: label } : {}),
    ...(value !== undefined ? { value } : {}),
    ...rest,
  });
}

/** Clic en botón/enlace de reserva hacia `/turnos`. */
export function trackReservarTurno(location: string, extra?: Record<string, unknown>): void {
  trackEvent({
    action: "reservar_turno",
    category: "cta",
    label: location,
    ...extra,
  });
}

/** Clic en ítem de la barra inferior. */
export function trackNavClick(destination: string): void {
  trackEvent({
    action: "nav_click",
    category: "navigation",
    label: destination,
  });
}

/** Avance en el wizard de reserva (botón Continuar). */
export function trackWizardContinue(step: number): void {
  trackEvent({
    action: "wizard_continue",
    category: "appointments",
    label: `step_${step}`,
  });
}

/** Ítem del menú en /perfil (Mis turnos, Historial, etc.). */
export function trackPerfilMenuClick(item: string): void {
  trackEvent({
    action: "perfil_menu_click",
    category: "navigation",
    label: item,
  });
}

/** Acciones del panel de administración (/panel-turnos). Sin datos personales de clientas. */
export function trackPanelClick(
  action: string,
  label?: string,
  extra?: Record<string, unknown>,
): void {
  trackEvent({
    action,
    category: "panel",
    ...(label !== undefined ? { label } : {}),
    ...extra,
  });
}
