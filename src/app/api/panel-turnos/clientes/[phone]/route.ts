import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { serializePanelClientVisit } from "@/lib/panel/client-serialize";
import { canonicalPhoneDigitsAR } from "@/lib/customer/phone-canonical-ar";
import { getDb } from "@/lib/mongodb";
import { verifyPanelCookie } from "@/lib/panel-turnos-auth";
import { listReservationsByPhoneDigits } from "@/lib/reservations/admin-queries";
import { ensureReservationIndexes } from "@/lib/reservations/service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ phone: string }> }) {
  const cookieStore = await cookies();
  if (!verifyPanelCookie(cookieStore.get("panel_turnos_auth")?.value)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { phone: phoneParam } = await context.params;
  const phoneDigits = decodeURIComponent(phoneParam).trim();
  const canonical = canonicalPhoneDigitsAR(phoneDigits) || phoneDigits;

  if (!canonical || canonical.length < 8) {
    return NextResponse.json({ error: "Teléfono inválido." }, { status: 400 });
  }

  try {
    const db = await getDb();
    await ensureReservationIndexes(db);
    const visits = await listReservationsByPhoneDigits(db, canonical);
    if (visits.length === 0) {
      return NextResponse.json({ error: "Clienta no encontrada." }, { status: 404 });
    }

    const latest = visits[0];
    return NextResponse.json({
      client: {
        phoneDigits: latest.customerPhoneDigits ?? canonical,
        customerName: latest.customerName.trim() || "Cliente",
        customerPhone: latest.customerPhone.trim() || canonical,
        visitCount: visits.length,
      },
      visits: visits.map(serializePanelClientVisit),
    });
  } catch (e) {
    console.error("[api/panel-turnos/clientes/[phone] GET]", e);
    return NextResponse.json({ error: "No se pudo cargar la ficha." }, { status: 500 });
  }
}
