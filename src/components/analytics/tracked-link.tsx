"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { trackEvent } from "@/lib/analytics/track";
import type { AnalyticsEventCategory } from "@/lib/analytics/types";

type TrackedLinkProps = ComponentProps<typeof Link> & {
  trackAction: string;
  trackCategory?: AnalyticsEventCategory | string;
  trackLabel?: string;
};

/**
 * `Link` de Next con evento GA4 al hacer clic (no bloquea la navegación).
 */
export function TrackedLink({
  trackAction,
  trackCategory = "cta",
  trackLabel,
  onClick,
  ...props
}: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        trackEvent({
          action: trackAction,
          category: trackCategory,
          label: trackLabel,
        });
        onClick?.(e);
      }}
    />
  );
}
