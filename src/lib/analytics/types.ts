/** Categorías habituales para informes GA4 (custom parameter `event_category`). */
export type AnalyticsEventCategory =
  | "cta"
  | "navigation"
  | "auth"
  | "appointments"
  | "billing";

export type TrackEventParams = {
  action: string;
  category: AnalyticsEventCategory | string;
  label?: string;
  value?: number;
} & Record<string, unknown>;
