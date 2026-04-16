"use client";

import { CalendarDays, Home as HomeIcon, Palette, Percent, Scissors, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  SALON_TREATMENTS,
  TREATMENT_CATEGORIES,
  type TreatmentCategory,
} from "@/lib/treatments/catalog";

function CategoryIcon({ category }: { category: TreatmentCategory }) {
  const cls = "h-7 w-7 text-[var(--premium-gold)]";
  if (category === "Cortes y peinado") return <Scissors className={cls} strokeWidth={1.9} />;
  if (category === "Color") return <Palette className={cls} strokeWidth={1.9} />;
  return <Sparkles className={cls} strokeWidth={1.9} />;
}

export default function TreatmentsPage() {
  const [activeCategory, setActiveCategory] = useState<TreatmentCategory>("Cortes y peinado");

  const filteredServices = useMemo(
    () => SALON_TREATMENTS.filter((service) => service.category === activeCategory),
    [activeCategory],
  );

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <main className="mx-auto w-full max-w-md px-4 pt-6 pb-24">
        <header className="mb-4 text-center">
          <h1 className="text-[34px] leading-none font-heading">Servicios</h1>
        </header>

        <p className="mb-3 text-center text-[11px] leading-relaxed text-[var(--soft-gray)]/85">
          En todos los servicios el lavado está incluido. Keratina y tratamiento aminoácidos incluyen
          también el peinado.
        </p>

        <section className="mb-2 flex items-center gap-2 overflow-x-auto pb-1">
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

        <section className="grid grid-cols-2 gap-3">
          {filteredServices.map((service) => (
            <article
              key={service.id}
              className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#1a1a1a] shadow-[0_8px_22px_rgba(0,0,0,0.45)]"
            >
              <div className="relative h-32 shrink-0 overflow-hidden bg-[#141414]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(228,202,105,0.22),transparent_46%),linear-gradient(135deg,#191919_0%,#131313_58%,#0f0f0f_100%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />
                <div className="relative z-10 flex h-full items-center justify-center">
                  <CategoryIcon category={service.category} />
                </div>
                <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-16 bg-gradient-to-b from-transparent to-[#1a1a1a]" />
              </div>

              <div className="relative z-10 -mt-2 flex min-h-0 flex-1 flex-col px-3 pt-0 pb-3">
                <h2 className="text-[17px] leading-tight font-heading">{service.name}</h2>
                <p className="mt-1 line-clamp-3 text-[11px] leading-tight text-[var(--soft-gray)]/80">
                  {service.description}
                </p>
                <p className="mt-1 text-[10px] tracking-[0.08em] text-[var(--soft-gray)]/65">
                  Duración: {service.durationLabel}
                </p>

                <div className="mt-auto pt-2">
                  <Link
                    href={`/turnos?treatment=${encodeURIComponent(service.name)}`}
                    className="flex h-8 w-full items-center justify-center rounded-full bg-gradient-to-r from-[var(--accent-orange)] to-[var(--premium-gold)] text-[14px] font-medium text-white"
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
          <Link href="/tratamientos" className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <Sparkles className="h-5 w-5 text-[var(--premium-gold)]" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--premium-gold)]">
              Tratamientos
            </span>
          </Link>
          <Link href="/turnos" className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[var(--soft-gray)]/80">
            <CalendarDays className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em]">Turnos</span>
          </Link>
          <Link href="/promociones" className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[var(--soft-gray)]/80">
            <Percent className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em]">Promos</span>
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
