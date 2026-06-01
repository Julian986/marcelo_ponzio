"use client";

import { Palette, Scissors, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { TrackedLink } from "@/components/analytics/tracked-link";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { LightPageHeader } from "@/components/light-page-header";
import {
  SALON_TREATMENTS,
  TREATMENT_CATEGORIES,
  type TreatmentCategory,
} from "@/lib/treatments/catalog";

function CategoryIcon({ category }: { category: TreatmentCategory }) {
  const cls = "h-8 w-8 text-[#B88E2F]";
  if (category === "Cortes y peinado") return <Scissors className={cls} strokeWidth={1.9} />;
  if (category === "Color") return <Palette className={cls} strokeWidth={1.9} />;
  return <Sparkles className={cls} strokeWidth={1.9} />;
}

export function TratamientosClient() {
  const searchParams = useSearchParams();
  const fromPerfil = searchParams.get("from") === "perfil";
  const [activeCategory, setActiveCategory] = useState<TreatmentCategory>("Cortes y peinado");

  const filteredServices = useMemo(
    () => SALON_TREATMENTS.filter((service) => service.category === activeCategory),
    [activeCategory],
  );

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <main className="mx-auto w-full max-w-md px-5 pt-10 pb-28">
        <LightPageHeader
          title="Servicios"
          subtitle="Conocé nuestros tratamientos de lujo"
          backHref={fromPerfil ? "/perfil" : undefined}
          backLabel="Volver al perfil"
        />

        <p className="mb-5 text-[16px] leading-relaxed text-gray-600">
          En todos los servicios el lavado está incluido. Keratina y aminoácidos incluyen también el peinado.
        </p>

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

        <section className="grid grid-cols-2 gap-4">
          {filteredServices.map((service) => (
            <article
              key={service.id}
              className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-gray-50 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
            >
              <div className="relative flex h-28 shrink-0 items-center justify-center bg-[#F5F5F5]">
                <CategoryIcon category={service.category} />
              </div>

              <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-2">
                <h2 className="text-[17px] font-semibold leading-tight font-heading text-gray-900">{service.name}</h2>
                <p className="mt-1 line-clamp-3 text-[14px] leading-snug text-gray-500">{service.description}</p>
                <p className="mt-1 text-[13px] font-medium text-gray-400">Duración: {service.durationLabel}</p>

                <div className="mt-auto pt-3">
                  <TrackedLink
                    href={`/turnos?treatment=${encodeURIComponent(service.name)}`}
                    trackAction="reservar_turno"
                    trackLabel="tratamientos"
                    className="flex h-10 w-full items-center justify-center rounded-full bg-[#B88E2F] text-[15px] font-semibold text-white shadow-md transition active:scale-[0.98]"
                  >
                    Reservar
                  </TrackedLink>
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
