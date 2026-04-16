"use client";

import { CalendarDays, Home as HomeIcon, Palette, Percent, Scissors, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  TREATMENT_CATEGORIES,
  type TreatmentCategory,
} from "@/lib/treatments/catalog";

type Promo = {
  id: string;
  title: string;
  subtitle: string;
  details: string;
  category: TreatmentCategory;
};

const promos: Promo[] = [
  {
    id: "servicio-completo",
    title: "Servicio completo",
    subtitle: "Color + lavado + corte + peinado",
    details: "1 h 30 min · Todo en una visita.",
    category: "Cortes y peinado",
  },
  {
    id: "balayage-promo",
    title: "Balayage",
    subtitle: "Luz natural",
    details: "2 h · Consultá tonos y mantenimiento.",
    category: "Color",
  },
  {
    id: "keratina-promo",
    title: "Keratina",
    subtitle: "Brillo y alisado",
    details: "1 h · Incluye peinado.",
    category: "Tratamiento",
  },
  {
    id: "corte-dama-promo",
    title: "Corte Dama",
    subtitle: "Estilo y forma",
    details: "30 min · Lavado incluido.",
    category: "Cortes y peinado",
  },
];

function CategoryIcon({ category }: { category: TreatmentCategory }) {
  const cls = "h-8 w-8 text-[var(--premium-gold)]";
  if (category === "Cortes y peinado") return <Scissors className={cls} strokeWidth={1.9} />;
  if (category === "Color") return <Palette className={cls} strokeWidth={1.9} />;
  return <Sparkles className={cls} strokeWidth={1.9} />;
}

export default function PromotionsPage() {
  const [activeCategory, setActiveCategory] = useState<TreatmentCategory>("Cortes y peinado");

  const filteredPromos = useMemo(
    () => promos.filter((promo) => promo.category === activeCategory),
    [activeCategory],
  );

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <main className="mx-auto w-full max-w-md px-4 pt-6 pb-24">
        <header className="mb-4 text-center">
          <h1 className="text-[34px] leading-none font-heading">Promociones</h1>
        </header>

        <section className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
          {TREATMENT_CATEGORIES.map((category) => {
            const isActive = category === activeCategory;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-[#2a2a2a] text-[var(--soft-gray)]"
                    : "bg-transparent text-[var(--soft-gray)]/70"
                }`}
              >
                {category}
              </button>
            );
          })}
        </section>

        <section className="space-y-3">
          {filteredPromos.map((promo) => (
            <article
              key={promo.id}
              className="relative overflow-hidden rounded-2xl border border-white/8 bg-[#1a1a1a] shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
            >
              <div className="absolute inset-0 grid grid-cols-[47%_53%]">
                <div className="relative flex min-h-[148px] flex-col overflow-hidden border-r border-white/6 bg-[#141414]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_16%,rgba(228,202,105,0.22),transparent_44%),linear-gradient(135deg,#191919_0%,#111111_62%,#0e0e0e_100%)]" />
                  <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-2">
                    <CategoryIcon category={promo.category} />
                    <span className="text-[10px] tracking-[0.12em] text-[var(--soft-gray)]/68">
                      PROMO
                    </span>
                  </div>
                </div>
                <div className="min-h-[148px] bg-[linear-gradient(180deg,#f4ecdd_0%,#eadfc9_100%)]" />
              </div>

              <div className="relative z-10 ml-auto flex w-[53%] flex-col px-3 py-3">
                <h2 className="text-[22px] leading-tight font-heading text-[#1b1916] sm:text-[26px]">
                  {promo.title}
                </h2>
                <p className="mt-1 text-[11px] text-[#2c2922]/80">{promo.subtitle}</p>
                <p className="mt-1 text-[11px] leading-tight text-[#2c2922]/90">{promo.details}</p>
                <div className="mt-3">
                  <Link
                    href={`/turnos?treatment=${encodeURIComponent(promo.title)}`}
                    className="flex h-9 w-full items-center justify-center rounded-full bg-gradient-to-r from-[var(--accent-orange)] to-[var(--premium-gold)] text-[13px] font-medium text-white"
                  >
                    Reservar
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>

      <nav className="fixed right-0 bottom-0 left-0 z-30">
        <div className="flex w-full items-center justify-between border-t border-white/8 bg-black/60 px-4 py-2.5 backdrop-blur-[16px]">
          <Link href="/" className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <HomeIcon className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.9} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--soft-gray)]/80">
              Inicio
            </span>
          </Link>
          <Link href="/tratamientos" className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[var(--soft-gray)]/80">
            <Sparkles className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em]">Tratamientos</span>
          </Link>
          <Link href="/turnos" className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[var(--soft-gray)]/80">
            <CalendarDays className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em]">Turnos</span>
          </Link>
          <Link href="/promociones" className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <Percent className="h-5 w-5 text-[var(--premium-gold)]" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--premium-gold)]">Promos</span>
          </Link>
          <Link href="/perfil" className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[var(--soft-gray)]/80">
            <User className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em]">Perfil</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
