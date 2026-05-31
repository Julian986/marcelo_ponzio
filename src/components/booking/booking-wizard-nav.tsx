import { CalendarDays, Home as HomeIcon, Percent, Sparkles, User } from "lucide-react";
import Link from "next/link";

export function BookingWizardNav() {
  return (
    <nav className="flex items-center justify-around pt-2 pb-2">
      <Link href="/" className="group flex flex-col items-center gap-1 text-gray-400">
        <HomeIcon className="h-6 w-6 group-hover:text-[#B88E2F]" strokeWidth={1.5} />
        <span className="text-[10px] text-gray-500">Inicio</span>
      </Link>
      <Link href="/tratamientos" className="group flex flex-col items-center gap-1 text-gray-400">
        <Sparkles className="h-6 w-6 group-hover:text-[#B88E2F]" strokeWidth={1.5} />
        <span className="text-[10px] text-gray-500">Tratamientos</span>
      </Link>
      <Link href="/turnos" className="flex flex-col items-center gap-1 text-[#B88E2F]">
        <CalendarDays className="h-6 w-6 fill-[#B88E2F] stroke-[#B88E2F]" strokeWidth={1.5} />
        <span className="text-[10px] font-medium text-[#B88E2F]">Turnos</span>
      </Link>
      <Link href="/promociones" className="group flex flex-col items-center gap-1 text-gray-400">
        <Percent className="h-6 w-6 group-hover:text-[#B88E2F]" strokeWidth={1.5} />
        <span className="text-[10px] text-gray-500">Promos</span>
      </Link>
      <Link href="/perfil" className="group flex flex-col items-center gap-1 text-gray-400">
        <User className="h-6 w-6 group-hover:text-[#B88E2F]" strokeWidth={1.5} />
        <span className="text-[10px] text-gray-500">Perfil</span>
      </Link>
    </nav>
  );
}
