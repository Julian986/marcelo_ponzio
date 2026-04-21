"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import type { TreatmentCategory } from "@/lib/treatments/catalog";
import {
  SALON_TREATMENT_CATEGORIES,
  SALON_TREATMENT_OPTIONS,
  buildSalonCalendarItems,
  formatSalonDisplayDate,
  getAvailableTimesForDate,
  salonMonthNames,
  salonWeekdayLabels,
} from "@/lib/booking/salon-availability";

export type BookingPickerProps = {
  selectedTreatmentId: string;
  onTreatmentIdChange: (id: string) => void;
  selectedDate: string;
  onDateChange: (dateKey: string) => void;
  selectedTime: string;
  onTimeChange: (time: string) => void;
  /** Si se pasa, define qué horarios mostrar (ej. reserva pública con margen de 60 min en “hoy”). */
  resolveTimeSlots?: (dateKey: string) => string[];
  /**
   * Horarios ya resueltos en servidor (solapes, reglas). Solo aplica al `selectedDate` actual.
   * `undefined`: usar `resolveTimeSlots` / plantilla. `null`: cargando.
   */
  remoteTimeSlots?: string[] | null;
  bookingFocusRef?: React.RefObject<HTMLDivElement | null>;
  treatmentFirstHintVisible: boolean;
  onTreatmentFirstHintVisible: (visible: boolean) => void;
};

export function BookingPicker({
  selectedTreatmentId,
  onTreatmentIdChange,
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeChange,
  resolveTimeSlots,
  remoteTimeSlots,
  bookingFocusRef,
  treatmentFirstHintVisible,
  onTreatmentFirstHintVisible,
}: BookingPickerProps) {
  const [visibleMonthDate, setVisibleMonthDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
  const [activeTreatmentCategory, setActiveTreatmentCategory] = useState<TreatmentCategory | null>(null);

  const selectedTreatment = useMemo(
    () => SALON_TREATMENT_OPTIONS.find((option) => option.id === selectedTreatmentId),
    [selectedTreatmentId],
  );
  const visibleTreatments = useMemo(
    () =>
      activeTreatmentCategory
        ? SALON_TREATMENT_OPTIONS.filter((option) => option.category === activeTreatmentCategory)
        : [],
    [activeTreatmentCategory],
  );
  const calendarItems = useMemo(
    () => buildSalonCalendarItems(visibleMonthDate.getFullYear(), visibleMonthDate.getMonth()),
    [visibleMonthDate],
  );
  const visibleMonthLabel = `${salonMonthNames[visibleMonthDate.getMonth()]} ${visibleMonthDate.getFullYear()}`;

  const useRemoteSlots = remoteTimeSlots !== undefined;
  const slotsLoading = useRemoteSlots && selectedDate && remoteTimeSlots === null;
  const availableTimes = selectedDate
    ? useRemoteSlots
      ? remoteTimeSlots === null
        ? []
        : remoteTimeSlots
      : resolveTimeSlots
        ? resolveTimeSlots(selectedDate)
        : getAvailableTimesForDate(selectedDate)
    : [];

  const activeStep = !selectedTreatment
    ? 1
    : !selectedDate
      ? 2
      : !selectedTime
        ? 3
        : 4;

  const openTreatmentModal = () => {
    setActiveTreatmentCategory(selectedTreatment?.category ?? null);
    setIsTreatmentModalOpen(true);
  };

  const closeTreatmentModal = () => {
    setIsTreatmentModalOpen(false);
    setActiveTreatmentCategory(null);
  };

  const selectTreatment = (treatmentId: string) => {
    onTreatmentIdChange(treatmentId);
    closeTreatmentModal();
  };

  return (
    <>
      <section className="space-y-2">
        <button
          type="button"
          onClick={openTreatmentModal}
          className={`flex w-full items-center justify-between rounded-2xl border bg-[#171717] px-4 py-3 text-left transition-all ${
            activeStep === 1
              ? "border-[var(--premium-gold)] shadow-[0_0_0_1px_rgba(228,202,105,0.22),0_0_22px_rgba(206,120,50,0.18)]"
              : "border-white/8"
          }`}
        >
          <div>
            <p className="text-[11px] tracking-[0.14em] text-[var(--soft-gray)]/55">Paso 1</p>
            <p className="mt-1 text-[14px] text-[var(--soft-gray)]">
              {selectedTreatment ? selectedTreatment.name : "Elegí servicio"}
            </p>
            {selectedTreatment && (
              <p className="mt-1 text-[11px] text-[var(--soft-gray)]/55">
                {selectedTreatment.category} · {selectedTreatment.subtitle}
              </p>
            )}
            {activeStep === 1 && (
              <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--premium-gold)]/92">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--premium-gold)]" />
                <span>Comenzá seleccionando el servicio</span>
              </div>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-[var(--soft-gray)]/60" strokeWidth={1.8} />
        </button>

        <div
          className={`flex items-center justify-between rounded-2xl border bg-[#171717] px-4 py-3 transition-all ${
            activeStep === 2
              ? "border-[var(--premium-gold)] shadow-[0_0_0_1px_rgba(228,202,105,0.22),0_0_22px_rgba(206,120,50,0.18)]"
              : "border-white/8"
          }`}
        >
          <div>
            <p className="text-[11px] tracking-[0.14em] text-[var(--soft-gray)]/55">Paso 2</p>
            <p className="mt-1 text-[14px] text-[var(--soft-gray)]">
              {selectedDate ? formatSalonDisplayDate(selectedDate) : "Elegí día"}
            </p>
            {activeStep === 2 && (
              <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--premium-gold)]/92">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--premium-gold)]" />
                <span>Ahora elegí una fecha disponible</span>
              </div>
            )}
          </div>
          <ChevronRight className="h-4 w-4 rotate-90 text-[var(--soft-gray)]/60" strokeWidth={1.8} />
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-[24px] border border-white/8 bg-[#e4c48f] p-3 text-[#2c241b] shadow-[0_12px_26px_rgba(0,0,0,0.36)]">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              setVisibleMonthDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
            }
            className="text-[#7f6a45]"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
          </button>
          <h2 className="text-[18px] leading-none font-heading">{visibleMonthLabel}</h2>
          <button
            type="button"
            onClick={() =>
              setVisibleMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
            }
            className="text-[#7f6a45]"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>

        {treatmentFirstHintVisible ? (
          <p
            role="status"
            aria-live="polite"
            className="mb-2 rounded-xl border border-[#8a7548]/55 bg-[#fff9ec]/97 px-3 py-2.5 text-center text-[12px] leading-snug text-[#2c241b] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
          >
            <span className="font-semibold">Primero elegí un servicio</span>
            <span className="text-[#3b3224]"> (paso 1) para poder elegir el día.</span>
          </p>
        ) : null}

        <div className="grid grid-cols-7 gap-y-2 text-center">
          {salonWeekdayLabels.map((label) => (
            <div key={label} className="text-[10px] tracking-[0.08em] text-[#7f7364]">
              {label}
            </div>
          ))}
          {calendarItems.map((day) => {
            const isSelected = day.value === selectedDate;
            const isDisabled = !day.isCurrentMonth || !day.isAvailable;

            return (
              <button
                key={day.value}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  if (!selectedTreatment) {
                    onTreatmentFirstHintVisible(true);
                    return;
                  }
                  onDateChange(day.value);
                  onTimeChange("");
                  requestAnimationFrame(() => {
                    bookingFocusRef?.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  });
                }}
                className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-[12px] transition-colors ${
                  isSelected
                    ? "bg-[#1a1a1a] text-[#c89b56] shadow-[0_6px_14px_rgba(0,0,0,0.25)]"
                    : !day.isCurrentMonth
                      ? "text-[#cfbea8]/45"
                      : day.isAvailable
                        ? "bg-[#eed7ae] text-[#3b2f22]"
                        : "text-[#897a67]"
                }`}
              >
                {day.dayNumber}
              </button>
            );
          })}
        </div>
      </section>

      <div ref={bookingFocusRef} className="mt-4">
        <section>
          <div
            className={`flex items-center justify-between rounded-2xl border bg-[#171717] px-4 py-3 transition-all ${
              activeStep === 3
                ? "border-[var(--premium-gold)] shadow-[0_0_0_1px_rgba(228,202,105,0.22),0_0_22px_rgba(206,120,50,0.18)]"
                : "border-white/8"
            }`}
          >
            <div>
              <p className="text-[11px] tracking-[0.14em] text-[var(--soft-gray)]/55">Paso 3</p>
              <p className="mt-1 text-[14px] text-[var(--soft-gray)]">
                {selectedTime ? `Horario elegido: ${selectedTime}` : "Elegí horario"}
              </p>
              {activeStep === 3 && (
                <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--premium-gold)]/92">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--premium-gold)]" />
                  <span>Seleccioná un horario para continuar</span>
                </div>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--soft-gray)]/60" strokeWidth={1.8} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {slotsLoading ? (
              <div className="col-span-2 rounded-2xl border border-white/8 bg-[#171717] px-4 py-5 text-center text-[13px] text-[var(--soft-gray)]/68">
                Cargando horarios…
              </div>
            ) : availableTimes.length > 0 ? (
              availableTimes.map((time) => {
                const isActive = time === selectedTime;
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => onTimeChange(time)}
                    className={`h-11 rounded-xl border text-[16px] transition-colors ${
                      isActive
                        ? "border-[var(--premium-gold)] bg-[rgba(206,120,50,0.14)] text-[var(--premium-gold)]"
                        : "border-white/8 bg-[#151515] text-[var(--soft-gray)]"
                    }`}
                  >
                    {time}
                  </button>
                );
              })
            ) : (
              <div
                className={`col-span-2 rounded-2xl border px-4 py-5 text-center ${
                  selectedDate
                    ? "border-amber-500/35 bg-amber-950/20"
                    : "border-[var(--premium-gold)]/35 bg-[rgba(206,120,50,0.14)]"
                }`}
              >
                {selectedDate ? (
                  <>
                    <p className="text-[13px] font-medium text-amber-100/95">No hay horarios disponibles para este dia.</p>
                    <p className="mt-1 text-[12px] text-amber-100/75">
                      Proba con otra fecha para ver turnos disponibles.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[13px] font-medium text-[var(--premium-gold)]">Los turnos web se reservan con 2 dias de anticipacion.</p>
                    <p className="mt-1 text-[12px] text-[var(--soft-gray)]/88">
                      Elegi una fecha desde pasado manana para ver horarios.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {isTreatmentModalOpen && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/60 backdrop-blur-[3px]">
          <button
            type="button"
            aria-label="Cerrar selector de servicio"
            onClick={closeTreatmentModal}
            className="absolute inset-0"
          />

          <div className="relative w-full rounded-t-[32px] border-t border-white/8 bg-[#161616] px-4 pt-3 pb-6 shadow-[0_-18px_40px_rgba(0,0,0,0.45)]">
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-white/12" />

            <div className="mb-4 flex items-center justify-between">
              {activeTreatmentCategory ? (
                <button
                  type="button"
                  onClick={() => setActiveTreatmentCategory(null)}
                  className="text-[var(--soft-gray)]/75"
                  aria-label="Volver a categorías"
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={1.8} />
                </button>
              ) : (
                <span className="h-5 w-5" />
              )}

              <h2 className="text-[26px] leading-none font-heading">
                {activeTreatmentCategory ?? "Elegí servicio"}
              </h2>

              <button
                type="button"
                onClick={closeTreatmentModal}
                className="text-[13px] text-[var(--soft-gray)]/75"
              >
                Cerrar
              </button>
            </div>

            {activeTreatmentCategory ? (
              <div className="max-h-[52vh] space-y-2 overflow-y-auto pb-2">
                {visibleTreatments.map((treatment) => {
                  const isSelected = treatment.id === selectedTreatmentId;

                  return (
                    <button
                      key={treatment.id}
                      type="button"
                      onClick={() => selectTreatment(treatment.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                        isSelected
                          ? "border-[var(--premium-gold)] bg-[rgba(228,202,105,0.1)]"
                          : "border-white/8 bg-[#1c1c1c]"
                      }`}
                    >
                      <p className="text-[16px] leading-tight font-heading text-[var(--soft-gray)]">
                        {treatment.name}
                      </p>
                      <p className="mt-1 text-[12px] text-[var(--soft-gray)]/58">{treatment.subtitle}</p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {SALON_TREATMENT_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveTreatmentCategory(category)}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-[#1c1c1c] px-4 py-4 text-left"
                  >
                    <div>
                      <p className="text-[20px] leading-none font-heading text-[var(--soft-gray)]">{category}</p>
                      <p className="mt-1 text-[12px] text-[var(--soft-gray)]/58">
                        {SALON_TREATMENT_OPTIONS.filter((option) => option.category === category).length} servicios
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[var(--soft-gray)]/55" strokeWidth={1.8} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
