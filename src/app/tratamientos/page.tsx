import { Suspense } from "react";

import { TratamientosClient } from "./tratamientos-client";

export default function TreatmentsPage() {
  return (
    <Suspense>
      <TratamientosClient />
    </Suspense>
  );
}
