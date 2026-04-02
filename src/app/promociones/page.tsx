"use client";

import { CalendarDays, Home as HomeIcon, Percent, Sparkles, User } from "lucide-react";
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
  imageUrl: string;
  category: TreatmentCategory;
};

const promos: Promo[] = [
  {
    id: "servicio-completo",
    title: "Servicio completo",
    subtitle: "Color + lavado + corte + peinado",
    details: "1 h 30 min · Todo en una visita.",
    imageUrl:
      "https://images.unsplash.com/photo-1560066987-138a9a6e6fd4?auto=format&fit=crop&w=900&q=80",
    category: "Cortes y peinado",
  },
  {
    id: "balayage-promo",
    title: "Balayage",
    subtitle: "Luz natural",
    details: "2 h · Consultá tonos y mantenimiento.",
    imageUrl:
      "https://images.unsplash.com/photo-1633681926022-84c122e8b9d3?auto=format&fit=crop&w=900&q=80",
    category: "Color",
  },
  {
    id: "keratina-promo",
    title: "Keratina",
    subtitle: "Brillo y alisado",
    details: "1 h · Incluye peinado.",
    imageUrl:
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=900&q=80",
    category: "Tratamiento",
  },
  {
    id: "corte-dama-promo",
    title: "Corte Dama",
    subtitle: "Estilo y forma",
    details: "30 min · Lavado incluido.",
    imageUrl:
      "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=900&q=80",
    category: "Cortes y peinado",
  },
];

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
              className="relative h-40 overflow-hidden rounded-2xl border border-white/8 bg-[#1a1a1a] shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
            >
              <img
                src={promo.imageUrl}
                alt={promo.title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-[#f1e8d8]/35 to-[#f1e8d8]/85" />

              <div className="relative z-10 ml-auto flex h-full w-[53%] flex-col px-3 py-2.5">
                <h2 className="text-[28px] leading-none font-heading text-[#1b1916]">{promo.title}</h2>
                <p className="mt-1 text-[11px] text-[#2c2922]/80">{promo.subtitle}</p>
                <p className="mt-1 text-[11px] leading-tight text-[#2c2922]/90">{promo.details}</p>
                <div className="mt-auto pt-2">
                  <Link
                    href={`/turnos?treatment=${encodeURIComponent(promo.title)}`}
                    className="flex h-8 w-full items-center justify-center rounded-full bg-gradient-to-r from-[var(--accent-orange)] to-[var(--premium-gold)] text-[13px] font-medium text-white"
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
