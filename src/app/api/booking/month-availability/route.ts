import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { buildSalonCalendarItems } from "@/lib/booking/salon-availability";
import { computeBookableSlots } from "@/lib/booking/compute-bookable-slots";
import { getDb } from "@/lib/mongodb";
import { verifyPanelCookie } from "@/lib/panel-turnos-auth";
import { findSalonTreatmentById } from "@/lib/treatments/catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const year = Number(url.searchParams.get("year"));
  const monthIndex = Number(url.searchParams.get("monthIndex"));
  const treatmentId = url.searchParams.get("treatmentId")?.trim() ?? "";
  const scopeRaw = url.searchParams.get("scope")?.trim().toLowerCase() ?? "public";
  const scope = scopeRaw === "panel" ? "panel" : "public";

  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Año inválido." }, { status: 400 });
  }
  if (!Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return NextResponse.json({ error: "Mes inválido (monthIndex 0–11)." }, { status: 400 });
  }
  if (!treatmentId) {
    return NextResponse.json({ error: "Falta el tratamiento." }, { status: 400 });
  }
  if (!findSalonTreatmentById(treatmentId)) {
    return NextResponse.json({ error: "Tratamiento inválido." }, { status: 400 });
  }

  if (scope === "panel") {
    const cookieStore = await cookies();
    if (!verifyPanelCookie(cookieStore.get("panel_turnos_auth")?.value)) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }
  }

  try {
    const db = await getDb();
    const now = new Date();
    const keys = buildSalonCalendarItems(year, monthIndex).map((d) => d.value);
    const entries = await Promise.all(
      keys.map(async (dateKey) => {
        const slots = await computeBookableSlots(db, {
          dateKey,
          treatmentId,
          now,
          scope,
        });
        return [dateKey, slots.length > 0] as const;
      }),
    );
    return NextResponse.json({ availability: Object.fromEntries(entries) });
  } catch (e) {
    console.error("[api/booking/month-availability]", e);
    return NextResponse.json({ error: "No se pudo calcular la disponibilidad." }, { status: 500 });
  }
}
