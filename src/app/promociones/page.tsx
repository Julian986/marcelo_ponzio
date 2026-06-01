import { Suspense } from "react";

import { PromocionesClient } from "./promociones-client";

export default function PromotionsPage() {
  return (
    <Suspense>
      <PromocionesClient />
    </Suspense>
  );
}
