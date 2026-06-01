"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import {
  GA_MEASUREMENT_ID,
  isAnalyticsDebugMode,
  pageview,
} from "@/lib/analytics/client";

function GoogleAnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;
    const qs = searchParams?.toString();
    const path = qs ? `${pathname}?${qs}` : pathname || "/";
    pageview(path);
  }, [pathname, searchParams]);

  return null;
}

function shouldLoadAnalyticsScripts(): boolean {
  if (!GA_MEASUREMENT_ID) return false;
  return process.env.NODE_ENV === "production" || isAnalyticsDebugMode();
}

/**
 * GA4 global: gtag.js + pageviews en cada cambio de ruta (App Router).
 */
export function GoogleAnalytics() {
  if (!shouldLoadAnalyticsScripts()) {
    return null;
  }

  const src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
  const debugMode = isAnalyticsDebugMode();

  return (
    <>
      <Script src={src} strategy="afterInteractive" />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            send_page_view: false${debugMode ? ",\n            debug_mode: true" : ""}
          });
        `}
      </Script>
      <Suspense fallback={null}>
        <GoogleAnalyticsPageView />
      </Suspense>
    </>
  );
}
