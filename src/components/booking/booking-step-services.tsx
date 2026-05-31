"use client";

import { ChevronDown, ChevronLeft } from "lucide-react";
import { useMemo, useState } from "react";

import {
  SALON_TREATMENT_CATEGORIES,
  SALON_TREATMENT_OPTIONS,
} from "@/lib/booking/salon-availability";
import type { TreatmentCategory } from "@/lib/treatments/catalog";

type BookingStepServicesProps = {
  selectedServiceIds: string[];
  onToggleTreatmentId: (id: string) => void;
  comboAlertText?: string | null;
};

export function BookingStepServices({
  selectedServiceIds,
  onToggleTreatmentId,
  comboAlertText,
}: BookingStepServicesProps) {
  const [activeCategory, setActiveCategory] = useState<TreatmentCategory | null>(null);

  const categoryTreatments = useMemo(
    () =>
      activeCategory
        ? SALON_TREATMENT_OPTIONS.filter((option) => option.category === activeCategory)
        : [],
    [activeCategory],
  );

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

        {comboAlertText ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-center text-[16px] text-gray-900">
            {comboAlertText}
          </div>
        ) : null}

        {categoryTreatments.map((treatment) => {
          const isSelected = selectedServiceIds.includes(treatment.id);
          return (
            <button
              key={treatment.id}
              type="button"
              onClick={() => onToggleTreatmentId(treatment.id)}
              className={`flex w-full cursor-pointer flex-col rounded-[24px] border p-6 text-left shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all active:scale-[0.99] ${
                isSelected
                  ? "border-[#B88E2F] bg-[#B88E2F]/10 ring-2 ring-[#B88E2F]/20"
                  : "border-gray-50 bg-white"
              }`}
            >
              <h2 className="text-xl font-semibold text-gray-900">{treatment.name}</h2>
              <p className="mt-1 text-[#666666]">{treatment.subtitle}</p>
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
