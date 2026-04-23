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
import { findSalonTreatmentById } from "@/lib/treatments/catalog";

type TurnosClientProps = {
  initialTreatment?: string;
};

type MeReservationsResponse = {
  reservations?: Array<{
    customerName?: string;
    customerPhone?: string;
    startsAtIso?: string;
  }>;
};
const CUSTOMER_PROFILE_CACHE_KEY = "mp_customer_profile_cache";

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
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(initialMatch ? [initialMatch.id] : []);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [serviceLimitHint, setServiceLimitHint] = useState<string | null>(null);
  const [treatmentFirstHintVisible, setTreatmentFirstHintVisible] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"unknown" | "guest" | "authed">("unknown");
  const [sessionDisplayName, setSessionDisplayName] = useState<string | null>(null);
  /** Horarios con solapes resueltos en servidor; `undefined` = no aplica, `null` = cargando. */
  const [remoteSlots, setRemoteSlots] = useState<string[] | null | undefined>(undefined);
  const bookingFocusRef = useRef<HTMLDivElement | null>(null);
  const dataSectionRef = useRef<HTMLDivElement | null>(null);
  const paymentSectionRef = useRef<HTMLElement | null>(null);
  const scrollPaymentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevDatosCompleteRef = useRef(false);
  const sessionBootstrappedRef = useRef(false);

  const selectedTreatment = useMemo(
    () => SALON_TREATMENT_OPTIONS.find((option) => option.id === selectedTreatmentId),
    [selectedTreatmentId],
  );
  const selectedServices = useMemo(
    () =>
      selectedServiceIds.flatMap((id) => {
        const found = SALON_TREATMENT_OPTIONS.find((o) => o.id === id);
        return found ? [found] : [];
      }),
    [selectedServiceIds],
  );
  const selectedServicesSummary = useMemo(
    () => selectedServices.map((s) => s.name).join(" + "),
    [selectedServices],
  );
  const totalSelectedDurationMinutes = useMemo(
    () =>
      selectedServiceIds.reduce((acc, id) => {
        const t = findSalonTreatmentById(id);
        return acc + (t?.durationMinutes ?? 0);
      }, 0),
    [selectedServiceIds],
  );
  const totalSelectedDurationLabel = useMemo(() => {
    const total = totalSelectedDurationMinutes;
    if (total <= 0) return "";
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h > 0 && m > 0) return `Duración ${h} h ${m} min`;
    if (h > 0) return `Duración ${h} h`;
    return `Duración ${m} min`;
  }, [totalSelectedDurationMinutes]);
  const primaryService = selectedServices[0];

  const requiresDeposit = selectedServices.some((s) => treatmentRequiresPublicDeposit(s.id));

  const hasSlot = Boolean(selectedServices.length > 0 && selectedDate && selectedTime);
  const datosComplete = Boolean(
    customerName.trim().length >= 2 &&
      isLikelyWhatsappNumber(customerPhone) &&
      whatsappOptIn,
  );
  const showWhatsappInvalidHint =
    customerPhone.trim().length >= 8 && !isLikelyWhatsappNumber(customerPhone);
  const hasSessionProfile = sessionStatus === "authed" && customerName.trim().length >= 2 && isLikelyWhatsappNumber(customerPhone);
  const activeStep = selectedServices.length === 0
    ? 1
    : !selectedDate
      ? 2
      : !selectedTime
        ? 3
        : !datosComplete
          ? 4
          : 5;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOMER_PROFILE_CACHE_KEY);
      if (!raw) return;
      const cached = JSON.parse(raw) as { name?: string; phone?: string };
      const cachedName = String(cached.name ?? "").trim();
      const cachedPhone = String(cached.phone ?? "").trim();
      if (cachedName) {
        setSessionDisplayName(cachedName);
        if (customerName.trim().length < 2) setCustomerName(cachedName);
        setSessionStatus("authed");
      }
      if (cachedPhone && !isLikelyWhatsappNumber(customerPhone)) {
        setCustomerPhone(cachedPhone);
      }
    } catch {
      // ignore invalid local cache
    }
  }, []);

  useEffect(() => {
    if (sessionBootstrappedRef.current) return;
    sessionBootstrappedRef.current = true;
    let cancelled = false;
    let retryTimer: number | null = null;
    const applyProfileFromReservations = (rows: MeReservationsResponse["reservations"]) => {
      const list = Array.isArray(rows) ? rows : [];
      const latest = [...list]
        .sort((a, b) => String(b.startsAtIso ?? "").localeCompare(String(a.startsAtIso ?? "")))[0];
      if (latest?.customerName && customerName.trim().length < 2) {
        setCustomerName(latest.customerName.trim());
      }
      if (latest?.customerPhone && !isLikelyWhatsappNumber(customerPhone)) {
        setCustomerPhone(latest.customerPhone.trim());
      }
      const n = latest?.customerName?.trim();
      setSessionDisplayName(n && n.length >= 2 ? n : null);
      setSessionStatus("authed");
      try {
        localStorage.setItem(
          CUSTOMER_PROFILE_CACHE_KEY,
          JSON.stringify({
            name: latest?.customerName?.trim() ?? "",
            phone: latest?.customerPhone?.trim() ?? "",
          }),
        );
      } catch {
        // ignore localStorage failures
      }
    };

    const run = async (attempt: number) => {
      try {
        const res = await fetch("/api/me/reservations?source=turnos", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (cancelled) return;
        if (res.status === 401) {
          if (attempt < 5) {
            retryTimer = window.setTimeout(() => {
              if (!cancelled) void run(attempt + 1);
            }, 450);
            return;
          }
          setSessionStatus("guest");
          setSessionDisplayName(null);
          return;
        }
        if (!res.ok) {
          setSessionStatus("guest");
          setSessionDisplayName(null);
          return;
        }
        const data = (await res.json()) as MeReservationsResponse;
        applyProfileFromReservations(data.reservations);
      } catch {
        if (!cancelled) setSessionStatus("guest");
      }
    };

    (async () => {
      await run(1);
    })();
    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, []);

  useEffect(() => {
    if (selectedServices.length > 0) setTreatmentFirstHintVisible(false);
  }, [selectedServices.length]);

  useEffect(() => {
    if (!treatmentFirstHintVisible) return;
    const t = window.setTimeout(() => setTreatmentFirstHintVisible(false), 4500);
    return () => window.clearTimeout(t);
  }, [treatmentFirstHintVisible]);

  useEffect(() => {
    prevDatosCompleteRef.current = false;
  }, [selectedTreatmentId, selectedDate, selectedTime]);

  useEffect(() => {
    if (!selectedDate || selectedServiceIds.length === 0) {
      setRemoteSlots(undefined);
      return;
    }
    let cancelled = false;
    setRemoteSlots(null);
    const q = new URLSearchParams({
      dateKey: selectedDate,
      treatmentId: selectedServiceIds[0] ?? "",
      serviceIds: selectedServiceIds.join(","),
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
  }, [selectedDate, selectedServiceIds]);

  useEffect(() => {
    if (!selectedDate || !selectedTime || selectedServiceIds.length === 0) return;
    if (remoteSlots === undefined || remoteSlots === null) return;
    if (!remoteSlots.includes(selectedTime)) {
      setSelectedTime("");
    }
  }, [selectedDate, selectedTime, selectedServiceIds, remoteSlots]);

  useEffect(() => {
    if (!serviceLimitHint) return;
    const t = window.setTimeout(() => setServiceLimitHint(null), 3200);
    return () => window.clearTimeout(t);
  }, [serviceLimitHint]);

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
    if (!primaryService || selectedServices.length === 0 || !selectedDate || !selectedTime || !datosComplete) {
      return;
    }
    setConfirmError(null);
    setCheckoutLoading(true);
    try {
      const pendingBody = {
        treatmentId: primaryService.id,
        treatmentName: selectedServicesSummary,
        subtitle: `${selectedServices.length} servicio${selectedServices.length === 1 ? "" : "s"} combinados`,
        category: primaryService.category,
        serviceIds: selectedServices.map((s) => s.id),
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
          treatment_id: primaryService.id,
          treatment_name: selectedServicesSummary,
          date_key: selectedDate,
          time_local: selectedTime,
        });
        const qs = new URLSearchParams({
          treatment: selectedServicesSummary,
          subtitle: `${selectedServices.length} servicio${selectedServices.length === 1 ? "" : "s"} combinados`,
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
        treatment: selectedServicesSummary,
        subtitle: `${selectedServices.length} servicio${selectedServices.length === 1 ? "" : "s"} combinados`,
        date: formatSalonDisplayDate(selectedDate),
        time: selectedTime,
        name: customerName.trim(),
        phone: customerPhone.trim(),
        id: dataPending.id,
      };
      sessionStorage.setItem("mp_turno_snapshot", JSON.stringify(snapshot));
      gaEvent("reservation_checkout_start", {
        treatment_id: primaryService.id,
        treatment_name: selectedServicesSummary,
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
          <Link href="/" aria-label="Volver a inicio" className="cursor-pointer text-[var(--soft-gray)]/88">
            <ChevronLeft className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <h1 className="text-[30px] leading-none font-heading">Reservar turno</h1>
          <span className="h-5 w-5" />
        </header>
        {sessionStatus === "authed" && sessionDisplayName ? (
          <p className="mb-4 text-center text-[14px] text-[var(--soft-gray)]/85">
            Hola, <span className="font-semibold text-[var(--premium-gold)]">{sessionDisplayName}</span>
          </p>
        ) : null}

        <BookingPicker
          selectedTreatmentId={selectedTreatmentId}
          onTreatmentIdChange={(id) => {
            setSelectedTreatmentId(id);
            setSelectedTime("");
          }}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          selectedTime={selectedTime}
          onTimeChange={setSelectedTime}
          remoteTimeSlots={
            selectedDate && selectedServiceIds.length > 0 ? (remoteSlots ?? null) : undefined
          }
          selectedCountLabel={
            selectedServices.length > 0
              ? `${selectedServices.length} servicio${selectedServices.length === 1 ? "" : "s"} seleccionado${
                  selectedServices.length === 1 ? "" : "s"
                }`
              : undefined
          }
          selectedDurationLabel={selectedServices.length > 0 ? totalSelectedDurationLabel : undefined}
          summaryTitle={selectedServices.length > 0 ? selectedServicesSummary : undefined}
          bookingFocusRef={bookingFocusRef}
          treatmentFirstHintVisible={treatmentFirstHintVisible}
          onTreatmentFirstHintVisible={setTreatmentFirstHintVisible}
          monthAvailabilityServiceIds={selectedServiceIds}
          multiSelect
          selectedTreatmentIds={selectedServiceIds}
          onToggleTreatmentId={(id) => {
            setSelectedServiceIds((prev) => {
              if (prev.includes(id)) return prev.filter((x) => x !== id);
              if (id === "servicio-completo" && prev.length > 0) {
                setServiceLimitHint(
                  "No podés seleccionar Servicio completo porque ya elegiste otros servicios.",
                );
                return prev;
              }
              if (prev.includes("servicio-completo")) {
                setServiceLimitHint(
                  "No podés agregar otro servicio porque ya seleccionaste Servicio completo.",
                );
                return prev;
              }
              if (id !== "keratina" && prev.includes("keratina")) {
                setServiceLimitHint(
                  "No podés agregar servicios después de Keratina. Si querés combinar, Keratina debe quedar al final.",
                );
                return prev;
              }
              if (prev.length >= 4) {
                setServiceLimitHint("Máximo 4 servicios por turno.");
                return prev;
              }
              return [...prev, id];
            });
            setSelectedTime("");
          }}
          onClearTreatmentIds={() => {
            setSelectedServiceIds([]);
            setSelectedTreatmentId("");
            setSelectedTime("");
          }}
          comboHintText="Podés elegir hasta 4 servicios. Servicio completo va solo y Keratina debe quedar al final."
          comboDurationLabel={totalSelectedDurationLabel}
          comboAlertText={serviceLimitHint}
        />

        {hasSlot && (
          <div ref={dataSectionRef} className="mt-6 space-y-5">
            {!hasSessionProfile ? (
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
            ) : (
              <section className="rounded-2xl border border-emerald-500/25 bg-emerald-950/15 px-4 py-3 text-[13px] text-emerald-100/90">
                Usaremos tus datos guardados para confirmar el turno.
              </section>
            )}

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
                        ? "cursor-pointer bg-[#009EE3] text-white shadow-[0_8px_24px_rgba(0,158,227,0.35)]"
                        : "cursor-pointer bg-[var(--premium-gold)] text-black shadow-[0_8px_24px_rgba(206,120,50,0.28)]"
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
          <Link href="/" className="flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1">
            <HomeIcon className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.9} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--soft-gray)]/80">Inicio</span>
          </Link>
          <Link href="/tratamientos" className="flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1">
            <Sparkles className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--soft-gray)]/80">Tratamientos</span>
          </Link>
          <Link href="/turnos" className="flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1">
            <CalendarDays className="h-5 w-5 text-[var(--premium-gold)]" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--premium-gold)]">Turnos</span>
          </Link>
          <Link href="/promociones" className="flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1">
            <Percent className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--soft-gray)]/80">Promos</span>
          </Link>
          <Link href="/perfil" className="flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1">
            <User className="h-5 w-5 text-[var(--soft-gray)]/90" strokeWidth={1.8} />
            <span className="text-[9px] tracking-[0.12em] text-[var(--soft-gray)]/80">Perfil</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

