import { cookies } from "next/headers";

import { verifyPanelCookie } from "@/lib/panel-turnos-auth";

import { PanelLogin } from "../../panel-login";
import { PanelClienteFichaClient } from "./panel-cliente-ficha-client";

export default async function PanelClienteFichaPage({ params }: { params: Promise<{ phone: string }> }) {
  const cookieStore = await cookies();
  if (!verifyPanelCookie(cookieStore.get("panel_turnos_auth")?.value)) {
    return <PanelLogin />;
  }

  const { phone } = await params;
  const phoneDigits = decodeURIComponent(phone).trim();

  return <PanelClienteFichaClient phoneDigits={phoneDigits} />;
}
