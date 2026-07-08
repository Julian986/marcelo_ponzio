import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/mongodb";
import { verifyPanelCookie } from "@/lib/panel-turnos-auth";
import { ensureReservationIndexes, setReservationTechnicalNote } from "@/lib/reservations/service";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  if (!verifyPanelCookie(cookieStore.get("panel_turnos_auth")?.value)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  const hex = id.trim();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const note =
    typeof body === "object" && body && "note" in body ? String((body as { note: unknown }).note ?? "") : "";

  try {
    const db = await getDb();
    await ensureReservationIndexes(db);
    const result = await setReservationTechnicalNote(db, hex, note);
    if ("error" in result) {
      const status = result.code === "NOT_FOUND" ? 404 : result.code === "TOO_LONG" ? 400 : 400;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/panel-turnos/reservations/[id]/nota PUT]", e);
    return NextResponse.json({ error: "No se pudo guardar la nota." }, { status: 500 });
  }
}
