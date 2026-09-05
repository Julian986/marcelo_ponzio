"use client";

import { ChevronDown, ChevronLeft } from "lucide-react";
import { useMemo, useState } from "react";

import {
  SALON_TREATMENT_CATEGORIES,
  SALON_TREATMENT_OPTIONS,
} from "@/lib/booking/salon-availability";
import type { TreatmentCategory } from "@/lib/treatments/catalog";
import type { ExperienceFamily } from "@/lib/treatments/experience-packages";

type BookingStepServicesProps = {
  selectedServiceIds: string[];
  onToggleTreatmentId: (id: string) => void;
  comboAlertText?: string | null;
  promoFamily?: ExperienceFamily | null;
};

function categoryOfFirstSelected(selectedServiceIds: string[]): TreatmentCategory | null {
  const firstId = selectedServiceIds[0];
  if (!firstId) return null;
  return SALON_TREATMENT_OPTIONS.find((option) => option.id === firstId)?.category ?? null;
}

function sortTreatmentsForPromo(
  treatments: typeof SALON_TREATMENT_OPTIONS,
  promoFamily?: ExperienceFamily | null,
) {
  if (!promoFamily) return treatments;
  return [...treatments].sort((a, b) => {
    const ae = a.experienceFamily === promoFamily ? 0 : a.experienceFamily ? 1 : 2;
    const be = b.experienceFamily === promoFamily ? 0 : b.experienceFamily ? 1 : 2;
    return ae - be;
  });
}

export function BookingStepServices({
  selectedServiceIds,
  onToggleTreatmentId,
  comboAlertText,
  promoFamily = null,
}: BookingStepServicesProps) {
  const [activeCategory, setActiveCategory] = useState<TreatmentCategory | null>(() => {
    if (promoFamily) return "Color";
    return categoryOfFirstSelected(selectedServiceIds);
  });

  const categoryTreatments = useMemo(() => {
    const list = activeCategory
      ? SALON_TREATMENT_OPTIONS.filter((option) => option.category === activeCategory)
      : [];
    return sortTreatmentsForPromo(list, promoFamily);
  }, [activeCategory, promoFamily]);

  const promoHint =
    promoFamily === "color-experience"
      ? "Color Experience: elegí Essential, Signature o Premium."
      : promoFamily === "balayage-experience"
        ? "Balayage Experience: elegí Essential, Signature o Premium."
        : null;

  if (activeCategory) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className="mb-2 flex cursor-pointer items-center gap-2 text-[16px] font-medium text-gray-600"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          Volver a categorías
        </button>

        {promoHint && activeCategory === "Color" ? (
          <p className="rounded-2xl border border-[#B88E2F]/35 bg-[#B88E2F]/10 px-4 py-3 text-center text-[15px] leading-snug text-gray-900">
            {promoHint}
          </p>
        ) : null}

        {comboAlertText ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-center text-[16px] text-gray-900">
            {comboAlertText}
          </div>
        ) : null}

        {categoryTreatments.map((treatment) => {
          const isSelected = selectedServiceIds.includes(treatment.id);
          const isPromoFocus = Boolean(promoFamily && treatment.experienceFamily === promoFamily);
          return (
            <button
              key={treatment.id}
              type="button"
              onClick={() => onToggleTreatmentId(treatment.id)}
              className={`flex w-full cursor-pointer flex-col rounded-[24px] border p-6 text-left shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all active:scale-[0.99] ${
                isSelected
                  ? "border-[#B88E2F] bg-[#B88E2F]/10 ring-2 ring-[#B88E2F]/20"
                  : isPromoFocus
                    ? "border-[#B88E2F]/40 bg-white"
                    : "border-gray-50 bg-white"
              }`}
            >
              {treatment.badge ? (
                <span className="mb-2 inline-flex w-fit rounded-full bg-[#B88E2F] px-3 py-1 text-[12px] font-semibold uppercase tracking-wide text-white">
                  {treatment.badge}
                </span>
              ) : treatment.experienceFamily ? (
                <span className="mb-2 inline-flex w-fit rounded-full bg-gray-100 px-3 py-1 text-[12px] font-semibold uppercase tracking-wide text-gray-600">
                  Promo
                </span>
              ) : null}
              <h2 className="text-xl font-semibold text-gray-900">{treatment.name}</h2>
              <p className="mt-1 text-[#666666]">{treatment.subtitle}</p>
              {treatment.priceLabel ? (
                <p className="mt-2 text-[16px] font-semibold text-gray-900">{treatment.priceLabel}</p>
              ) : null}
              {isSelected ? (
                <span className="mt-3 inline-flex w-fit rounded-full bg-[#B88E2F] px-3 py-1 text-[14px] font-semibold text-white">
                  Seleccionado
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {SALON_TREATMENT_CATEGORIES.map((category) => {
        const count = SALON_TREATMENT_OPTIONS.filter((option) => option.category === category).length;
        return (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className="flex w-full cursor-pointer items-center justify-between rounded-[24px] border border-gray-50 bg-white p-6 text-left shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition active:scale-[0.99]"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{category}</h2>
              <p className="text-[#666666]">
                {count} servicio{count === 1 ? "" : "s"}
              </p>
            </div>
            <ChevronDown className="h-6 w-6 text-gray-400" strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}
