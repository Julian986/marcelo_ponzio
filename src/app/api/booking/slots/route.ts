import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { computeBookableSlots } from "@/lib/booking/compute-bookable-slots";
import { getDb } from "@/lib/mongodb";
import { verifyPanelCookie } from "@/lib/panel-turnos-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dateKey = url.searchParams.get("dateKey")?.trim() ?? "";
  const treatmentId = url.searchParams.get("treatmentId")?.trim() ?? "";
  const scopeRaw = url.searchParams.get("scope")?.trim().toLowerCase() ?? "public";
  const scope = scopeRaw === "panel" ? "panel" : "public";
  const excludeReservationHexId =
    url.searchParams.get("excludeReservationHexId")?.trim() ??
    url.searchParams.get("excludeReservationId")?.trim() ??
    "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return NextResponse.json({ error: "Fecha inválida." }, { status: 400 });
  }
  if (!treatmentId) {
    return NextResponse.json({ error: "Falta el tratamiento." }, { status: 400 });
  }

  if (scope === "panel") {
    const cookieStore = await cookies();
    if (!verifyPanelCookie(cookieStore.get("panel_turnos_auth")?.value)) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }
  } else if (excludeReservationHexId) {
    return NextResponse.json({ error: "Parámetro no permitido." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const slots = await computeBookableSlots(db, {
      dateKey,
      treatmentId,
      now: new Date(),
      scope,
      excludeReservationHexId: scope === "panel" ? excludeReservationHexId || undefined : undefined,
    });
    return NextResponse.json({ slots });
  } catch (e) {
    console.error("[api/booking/slots]", e);
    return NextResponse.json({ error: "No se pudieron cargar los horarios." }, { status: 500 });
  }
}
