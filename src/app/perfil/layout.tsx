import type { ReactNode } from "react";

import { PerfilBottomNav } from "@/components/perfil/perfil-bottom-nav";

export default function PerfilLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#111111] text-white">
      {children}
      <PerfilBottomNav />
    </div>
  );
}
