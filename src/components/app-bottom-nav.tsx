"use client";

import { CalendarDays, Home as HomeIcon, Percent, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const GOLD = "#B88E2F";

const nav = [
  { href: "/", label: "Inicio", Icon: HomeIcon, match: (p: string) => p === "/" },
  { href: "/tratamientos", label: "Tratamientos", Icon: Sparkles, match: (p: string) => p.startsWith("/tratamientos") },
  { href: "/turnos", label: "Turnos", Icon: CalendarDays, match: (p: string) => p.startsWith("/turnos") },
  { href: "/promociones", label: "Promos", Icon: Percent, match: (p: string) => p.startsWith("/promociones") },
  { href: "/perfil", label: "Perfil", Icon: User, match: (p: string) => p.startsWith("/perfil") },
] as const;

export function AppBottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-100 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between px-4">
        {nav.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 ${active ? "" : "text-gray-400"}`}
              style={active ? { color: GOLD } : undefined}
            >
              <Icon
                className="h-6 w-6"
                strokeWidth={1.5}
                fill={active && href === "/turnos" ? GOLD : "none"}
                style={active ? { color: GOLD } : undefined}
              />
              <span className={`text-[10px] tracking-[0.06em] ${active ? "font-medium" : "font-normal text-gray-500"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
