"use client";

import { Palette, Percent, Scissors, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { AppBottomNav } from "@/components/app-bottom-nav";
import { LightPageHeader } from "@/components/light-page-header";
import { TREATMENT_CATEGORIES, type TreatmentCategory } from "@/lib/treatments/catalog";

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
  const cls = "h-8 w-8 text-[#B88E2F]";
  if (category === "Cortes y peinado") return <Scissors className={cls} strokeWidth={1.9} />;
  if (category === "Color") return <Palette className={cls} strokeWidth={1.9} />;
  return <Sparkles className={cls} strokeWidth={1.9} />;
}

export function PromocionesClient() {
  const searchParams = useSearchParams();
  const fromPerfil = searchParams.get("from") === "perfil";
  const [activeCategory, setActiveCategory] = useState<TreatmentCategory>("Cortes y peinado");

  const filteredPromos = useMemo(
    () => promos.filter((promo) => promo.category === activeCategory),
    [activeCategory],
  );

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <main className="mx-auto w-full max-w-md px-5 pt-10 pb-28">
        <LightPageHeader
          title="Promociones"
          subtitle="Beneficios exclusivos para vos"
          backHref={fromPerfil ? "/perfil" : undefined}
          backLabel="Volver al perfil"
        />

        <section className="mb-5 flex items-center gap-2 overflow-x-auto pb-1">
          {TREATMENT_CATEGORIES.map((category) => {
            const isActive = category === activeCategory;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 rounded-full border px-4 py-2 text-[15px] font-medium transition-colors ${
                  isActive
                    ? "border-[#B88E2F] bg-[#B88E2F]/12 text-gray-900"
                    : "border-gray-200 bg-white text-gray-500"
                }`}
              >
                {category}
              </button>
            );
          })}
        </section>

        <section className="space-y-4">
          {filteredPromos.map((promo) => (
            <article
              key={promo.id}
              className="overflow-hidden rounded-[24px] border border-gray-50 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
            >
              <div className="flex gap-0">
                <div className="flex w-[38%] shrink-0 flex-col items-center justify-center gap-2 bg-[#F5F5F5] px-3 py-6">
                  <CategoryIcon category={promo.category} />
                  <span className="flex items-center gap-1 text-[11px] font-semibold tracking-wide text-[#B88E2F] uppercase">
                    <Percent className="h-3.5 w-3.5" strokeWidth={2} />
                    Promo
                  </span>
                </div>
                <div className="flex flex-1 flex-col justify-center px-4 py-4">
                  <h2 className="text-[22px] leading-tight font-heading font-bold text-gray-900">{promo.title}</h2>
                  <p className="mt-1 text-[15px] text-gray-600">{promo.subtitle}</p>
                  <p className="mt-1 text-[14px] text-gray-500">{promo.details}</p>
                  <div className="mt-4">
                    <Link
                      href={`/turnos?treatment=${encodeURIComponent(promo.title)}`}
                      className="flex h-10 w-full items-center justify-center rounded-full bg-[#B88E2F] text-[15px] font-semibold text-white shadow-md transition active:scale-[0.98]"
                    >
                      Reservar
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>

      <AppBottomNav />
    </div>
  );
}
