/**
 * Re-export de analytics (compatibilidad con imports existentes `@/lib/gtag`).
 */
export {
  GA_EVENT_CUSTOMER_SESSION_START,
  GA_MEASUREMENT_ID,
  event,
  isAnalyticsEnabled,
  isAnalyticsDebugMode,
  pageview,
  sendAnalyticsEvent,
  trackEvent,
  trackNavClick,
  trackPanelClick,
  trackPerfilMenuClick,
  trackReservarTurno,
  trackWizardContinue,
} from "@/lib/analytics";
export type { AnalyticsEventCategory, TrackEventParams } from "@/lib/analytics";
