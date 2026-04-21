"use client";

import { CalendarDays, ChevronLeft, Home as HomeIcon, Percent, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { BookingPicker } from "@/components/booking/booking-picker";
import { event as gaEvent } from "@/lib/gtag";
import {
  SALON_TREATMENT_OPTIONS,
  formatSalonDisplayDate,
  isLikelyWhatsappNumber,
} from "@/lib/booking/salon-availability";
import { treatmentRequiresPublicDeposit } from "@/lib/reservations/public-deposit";

type TurnosClientProps = {
  initialTreatment?: string;
};

export default function TurnosClient({ initialTreatment = "" }: TurnosClientProps) {
  const treatmentParam = (() => {
    try {
      return decodeURIComponent(initialTreatment.trim());
    } catch {
      return initialTreatment.trim();
    }
  })();
  const initialMatch = SALON_TREATMENT_OPTIONS.find(
    (option) => option.id === treatmentParam || option.name === treatmentParam,
  );

  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>(initialMatch?.id ?? "");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [treatmentFirstHintVisible, setTreatmentFirstHintVisible] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  /** Horarios con solapes resueltos en servidor; `undefined` = no aplica, `null` = cargando. */
  const [remoteSlots, setRemoteSlots] = useState<string[] | null | undefined>(undefined);
  const bookingFocusRef = useRef<HTMLDivElement | null>(null);
  const dataSectionRef = useRef<HTMLDivElement | null>(null);
  const paymentSectionRef = useRef<HTMLElement | null>(null);
  const scrollPaymentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevDatosCompleteRef = useRef(false);

  const selectedTreatment = useMemo(
    () => SALON_TREATMENT_OPTIONS.find((option) => option.id === selectedTreatmentId),
    [selectedTreatmentId],
  );

  const requiresDeposit = Boolean(
    selectedTreatment && treatmentRequiresPublicDeposit(selectedTreatment.id),
  );

  const hasSlot = Boolean(selectedTreatment && selectedDate && selectedTime);
  const datosComplete = Boolean(
    customerName.trim().length >= 2 &&
      isLikelyWhatsappNumber(customerPhone) &&
      whatsappOptIn,
  );
  const showWhatsappInvalidHint =
    customerPhone.trim().length >= 8 && !isLikelyWhatsappNumber(customerPhone);
  const activeStep = !selectedTreatment
    ? 1
    : !selectedDate
      ? 2
      : !selectedTime
        ? 3
        : !datosComplete
          ? 4
          : 5;

  useEffect(() => {
    if (selectedTreatment) setTreatmentFirstHintVisible(false);
  }, [selectedTreatment]);

  useEffect(() => {
    if (!treatmentFirstHintVisible) return;
    const t = window.setTimeout(() => setTreatmentFirstHintVisible(false), 4500);
    return () => window.clearTimeout(t);
  }, [treatmentFirstHintVisible]);

  useEffect(() => {
    prevDatosCompleteRef.current = false;
  }, [selectedTreatmentId, selectedDate, selectedTime]);

  useEffect(() => {
    if (!selectedDate || !selectedTreatmentId) {
      setRemoteSlots(undefined);
      return;
    }
    let cancelled = false;
    setRemoteSlots(null);
    const q = new URLSearchParams({
      dateKey: selectedDate,
      treatmentId: selectedTreatmentId,
      scope: "public",
    });
    fetch(`/api/booking/slots?${q.toString()}`)
      .then((res) => res.json())
      .then((data: { slots?: string[] }) => {
        if (!cancelled) {
          setRemoteSlots(Array.isArray(data.slots) ? data.slots : []);
        }
      })
      .catch(() => {
        if (!cancelled) setRemoteSlots([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate, selectedTreatmentId]);

  useEffect(() => {
    if (!selectedDate || !selectedTime || !selectedTreatmentId) return;
    if (remoteSlots === undefined || remoteSlots === null) return;
    if (!remoteSlots.includes(selectedTime)) {
      setSelectedTime("");
    }
  }, [selectedDate, selectedTime, selectedTreatmentId, remoteSlots]);

  const scheduleScrollToPaymentSection = useCallback(() => {
    if (!hasSlot) return;
    if (scrollPaymentTimeoutRef.current) clearTimeout(scrollPaymentTimeoutRef.current);
    scrollPaymentTimeoutRef.current = setTimeout(() => {
      scrollPaymentTimeoutRef.current = null;
      paymentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 180);
  }, [hasSlot]);

  useEffect(() => {
    return () => {
      if (scrollPaymentTimeoutRef.current) clearTimeout(scrollPaymentTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!hasSlot) {
      prevDatosCompleteRef.current = datosComplete;
      return;
    }
    const becameComplete = datosComplete && !prevDatosCompleteRef.current;
    prevDatosCompleteRef.current = datosComplete;
    if (becameComplete) scheduleScrollToPaymentSection();
  }, [datosComplete, hasSlot, scheduleScrollToPaymentSection]);

  useEffect(() => {
    if (!hasSlot) return;
    const id = requestAnimationFrame(() => {
      dataSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(id);
  }, [hasSlot, selectedTime]);

  const handleMercadoPagoCheckout = async () => {
    if (!selectedTreatment || !selectedDate || !selectedTime || !datosComplete) {
      return;
    }
    setConfirmError(null);
    setCheckoutLoading(true);
    try {
      const pendingBody = {
        treatmentId: selectedTreatment.id,
        treatmentName: selectedTreatment.name,
        subtitle: selectedTreatment.subtitle,
        category: selectedTreatment.category,
        dateKey: selectedDate,
        timeLocal: selectedTime,
        displayDate: formatSalonDisplayDate(selectedDate),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        whatsappOptIn,
      };
      const resPending = await fetch("/api/reservations/pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingBody),
      });
      const dataPending = (await resPending.json()) as {
        error?: string;
        id?: string;
        checkoutToken?: string;
        bookingMode?: "pending_payment" | "confirmed";
      };
      if (!resPending.ok) {
        setConfirmError(dataPending.error ?? "No se pudo reservar el turno.");
        return;
      }
      if (!dataPending.id) {
        setConfirmError("Respuesta inválida del servidor.");
        return;
      }

      if (dataPending.bookingMode === "confirmed") {
        gaEvent("reservation_confirmed_no_deposit", {
          treatment_id: selectedTreatment.id,
          treatment_name: selectedTreatment.name,
          date_key: selectedDate,
          time_local: selectedTime,
        });
        const qs = new URLSearchParams({
          treatment: selectedTreatment.name,
          subtitle: selectedTreatment.subtitle,
          date: formatSalonDisplayDate(selectedDate),
          time: selectedTime,
          name: customerName.trim(),
          phone: customerPhone.trim(),
          id: dataPending.id,
        });
        window.location.href = `/turnos/confirmado?${qs.toString()}`;
        return;
      }

      if (!dataPending.checkoutToken) {
        setConfirmError("Respuesta inválida del servidor.");
        return;
      }

      const resPref = await fetch("/api/mercadopago/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: dataPending.id,
          checkoutToken: dataPending.checkoutToken,
        }),
      });
      const dataPref = (await resPref.json()) as { error?: string; initPoint?: string };
      if (!resPref.ok) {
        setConfirmError(dataPref.error ?? "No se pudo iniciar Mercado Pago.");
        return;
      }
      if (!dataPref.initPoint) {
        setConfirmError("Mercado Pago no devolvió el enlace de pago.");
        return;
      }

      const snapshot = {
        treatment: selectedTreatment.name,
        subtitle: selectedTreatment.subtitle,
        date: formatSalonDisplayDate(selectedDate),
        time: selectedTime,
        name: customerName.trim(),
        phone: customerPhone.trim(),
        id: dataPending.id,
      };
      sessionStorage.setItem("mp_turno_snapshot", JSON.stringify(snapshot));
      gaEvent("reservation_checkout_start", {
        treatment_id: selectedTreatment.id,
        treatment_name: selectedTreatment.name,
        date_key: selectedDate,
        time_local: selectedTime,
      });
      window.location.href = dataPref.initPoint;
    } catch {
      setConfirmError("Sin conexión o error de red. Probá de nuevo.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <main className="mx-auto w-full max-w-md px-4 pt-6 pb-24">
        <header className="mb-5 flex items-center justify-between">
          <Link href="/" aria-label="Volver a inicio" className="text-[var(--soft-gray)]/88">
            <ChevronLeft className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <h1 className="text-[30px] leading-none font-heading">Reservar turno</h1>
          <span className="h-5 w-5" />
        </header>

        <BookingPicker
          selectedTreatmentId={selectedTreatmentId}
          onTreatmentIdChange={setSelectedTreatmentId}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          selectedTime={selectedTime}
          onTimeChange={setSelectedTime}
          remoteTimeSlots={
            selectedDate && selectedTreatmentId ? (remoteSlots ?? null) : undefined
          }
          bookingFocusRef={bookingFocusRef}
          treatmentFirstHintVisible={treatmentFirstHintVisible}
          onTreatmentFirstHintVisible={setTreatmentFirstHintVisible}
        />

        {hasSlot && (
          <div ref={dataSectionRef} className="mt-6 space-y-5">
            <section
              className={`rounded-2xl border bg-[#171717] px-4 py-4 transition-all ${
                activeStep === 4
                  ? "border-[var(--premium-gold)] shadow-[0_0_0_1px_rgba(228,202,105,0.22),0_0_22px_rgba(206,120,50,0.18)]"
                  : "border-white/8"
              }`}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] tracking-[0.14em] text-[var(--soft-gray)]/55">Paso 4</p>
                  <p className="mt-1 text-[18px] font-heading text-[var(--soft-gray)]">Tus datos</p>
                  <p className="mt-1 text-[12px] text-[var(--soft-gray)]/58">
                    Completá tu nombre y WhatsApp para recordatorios.
                  </p>
                  {activeStep === 4 && (
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--premium-gold)]/92">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--premium-gold)]" />
                      <span>Necesitamos estos datos antes del pago</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label htmlFor="customerName" className="text-[11px] tracking-[0.12em] text-[var(--soft-gray)]/55">
                    Nombre y apellido
                  </label>
                  <input
                    id="customerName"
                    name="customerName"
                    autoComplete="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Como figura en tu DNI o preferís que te llamemos"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#141414] px-3 py-3 text-[15px] text-[var(--soft-gray)] outline-none placeholder:text-[var(--soft-gray)]/35 focus:border-[var(--premium-gold)]/55"
                  />
                </div>
                <div>
                  <label htmlFor="customerPhone" className="text-[11px] tracking-[0.12em] text-[var(--soft-gray)]/55">
                    WhatsApp
                  </label>
                  <input
                    id="customerPhone"
                    name="customerPhone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    onBlur={() => {
                      const nameOk = customerName.trim().length >= 2;
                      const phoneOk = isLikelyWhatsappNumber(customerPhone);
                      if (hasSlot && nameOk && phoneOk && whatsappOptIn) {
                        scheduleScrollToPaymentSection();
                      }
                    }}
                    placeholder="Ej: +54 9 11 2345-6789"
                    aria-invalid={showWhatsappInvalidHint}
                    className={`mt-1.5 w-full rounded-xl border bg-[#141414] px-3 py-3 text-[15px] text-[var(--soft-gray)] outline-none placeholder:text-[var(--soft-gray)]/35 focus:border-[var(--premium-gold)]/55 ${
                      showWhatsappInvalidHint ? "border-amber-500/45" : "border-white/10"
                    }`}
                  />
                  <p className="mt-1 text-[11px] text-[var(--soft-gray)]/45">
                    Mismo número que usás en WhatsApp.
                  </p>
                  {showWhatsappInvalidHint ? (
                    <p className="mt-1 text-[11px] leading-snug text-amber-200/90">
                      Revisá el número: tiene que tener entre 10 y 15 dígitos en total (podés usar +54, espacios o
                      guiones).
                    </p>
                  ) : null}
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/8 bg-black/20 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={whatsappOptIn}
                    onChange={(e) => setWhatsappOptIn(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 accent-[var(--premium-gold)]"
                  />
                  <span className="text-[12px] leading-snug text-[var(--soft-gray)]/78">
                    Acepto recibir recordatorios y avisos de mi turno por WhatsApp.
                  </span>
                </label>
              </div>
            </section>

            <section
              ref={paymentSectionRef}
              className={`rounded-2xl border bg-[#171717] px-4 py-4 transition-all ${
                activeStep === 5
                  ? "border-[var(--premium-gold)] shadow-[0_0_0_1px_rgba(228,202,105,0.22),0_0_22px_rgba(206,120,50,0.18)]"
                  : "border-white/8"
              }`}
            >
              <p className="text-[11px] tracking-[0.14em] text-[var(--soft-gray)]/55">Paso 5</p>
              <p className="mt-1 text-[18px] font-heading text-[var(--soft-gray)]">
                {requiresDeposit ? "Seña con Mercado Pago" : "Confirmar turno"}
              </p>
              <p className="mt-1 text-[12px] text-[var(--soft-gray)]/58">
                {requiresDeposit
                  ? "Reservá el horario abonando la seña. Monto y política la define la clínica."
                  : "Este servicio se reserva sin seña. Te enviamos recordatorio por WhatsApp antes del turno."}
              </p>
              {activeStep === 5 && datosComplete && requiresDeposit && (
                <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--premium-gold)]/92">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--premium-gold)]" />
                  <span>Pagá la seña: te llevamos a Mercado Pago</span>
                </div>
              )}
              {requiresDeposit ? (
                <p className="mt-3 text-[11px] leading-snug text-[var(--soft-gray)]/50">
                  El turno se confirma cuando Mercado Pago acredita el pago (no al volver del navegador).
                </p>
              ) : (
                <p className="mt-3 text-[11px] leading-snug text-[var(--soft-gray)]/50">
                  Al confirmar, el turno queda agendado. Podés cambiar fecha u horario arriba si necesitás otro
                  servicio.
                </p>
              )}
              <div className="mt-4">
                <button
                  type="button"
                  disabled={!datosComplete || checkoutLoading}
                  onClick={() => void handleMercadoPagoCheckout()}
                  className={`flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl text-[16px] font-semibold transition-all ${
                    datosComplete && !checkoutLoading
                      ? requiresDeposit
                        ? "bg-[#009EE3] text-white shadow-[0_8px_24px_rgba(0,158,227,0.35)]"
                        : "bg-[var(--premium-gold)] text-black shadow-[0_8px_24px_rgba(206,120,50,0.28)]"
                      : "cursor-not-allowed bg-[#2a2a2a] text-white/40"
                  } ${checkoutLoading ? "cursor-wait" : ""}`}
                >
                  {requiresDeposit ? (
                    <img
                      src="/Mercado_Pago_idp_LvMgpe_1.svg"
                      alt=""
                      className={`h-8 w-auto shrink-0 object-contain sm:h-9 ${
                        datosComplete && !checkoutLoading ? "opacity-100" : "opacity-45"
                      }`}
                      width={39}
                      height={28}
                      decoding="async"
                    />
                  ) : null}
                  <span className="text-[13px] font-medium opacity-95">
                    {checkoutLoading
                      ? requiresDeposit
                        ? "Preparando pago…"
                        : "Confirmando…"
                      : requiresDeposit
                        ? "Pagar seña con Mercado Pago"
                        : "Confirmar reserva"}
                  </span>
                </button>
              </div>
              {confirmError ? (
                <p
                  role="alert"
                  className="mt-3 rounded-xl border border-red-500/35 bg-red-950/35 px-3 py-2.5 text-center text-[12px] leading-snug text-red-200/95"
                >
                  {confirmError}
                </p>
              ) : null}
            </section>
          </div>
        )}
      </main>

      <nav className="fixed right-0 bottom-0 left-0 z-30">
        <div className="flex w-full items-center justify-between border-t border-white/8 bg-black/60 px-4 py-2.5 backdrop-blur-[16px]">
          <Link href="/" className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <HomeIcon className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.9} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--soft-gray)]/80">Inicio</span>
          </Link>
          <Link href="/tratamientos" className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <Sparkles className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--soft-gray)]/80">Tratamientos</span>
          </Link>
          <Link href="/turnos" className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <CalendarDays className="h-5 w-5 text-[var(--premium-gold)]" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--premium-gold)]">Turnos</span>
          </Link>
          <Link href="/promociones" className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <Percent className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--soft-gray)]/80">Promos</span>
          </Link>
          <Link href="/perfil" className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <User className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--soft-gray)]/80">Perfil</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
