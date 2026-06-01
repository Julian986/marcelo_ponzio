"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  panelBackBtn,
  panelCard,
  panelContainer,
  panelInput,
  panelPage,
} from "@/components/panel/panel-ui";
import { trackPanelClick } from "@/lib/analytics/track";
import { BookingPicker } from "@/components/booking/booking-picker";
import {
  SALON_TREATMENT_OPTIONS,
  formatSalonDisplayDate,
  isLikelyWhatsappNumber,
} from "@/lib/booking/salon-availability";

export function PanelNuevoTurnoClient() {
  const router = useRouter();
  const [selectedTreatmentId, setSelectedTreatmentId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [treatmentFirstHintVisible, setTreatmentFirstHintVisible] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [panelNotes, setPanelNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remoteSlots, setRemoteSlots] = useState<string[] | null | undefined>(undefined);
  const bookingFocusRef = useRef<HTMLDivElement | null>(null);

  const selectedTreatment = useMemo(
    () => SALON_TREATMENT_OPTIONS.find((option) => option.id === selectedTreatmentId),
    [selectedTreatmentId],
  );

  const hasSlot = Boolean(selectedTreatment && selectedDate && selectedTime);
  const datosComplete = Boolean(
    customerName.trim().length >= 2 &&
      isLikelyWhatsappNumber(customerPhone) &&
      whatsappOptIn,
  );
  const showWhatsappInvalidHint =
    customerPhone.trim().length >= 8 && !isLikelyWhatsappNumber(customerPhone);

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
      scope: "panel",
    });
    fetch(`/api/booking/slots?${q.toString()}`, { credentials: "same-origin" })
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

  async function handleSubmit() {
    if (!selectedTreatment || !selectedDate || !selectedTime || !datosComplete) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/panel/reservations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          treatmentId: selectedTreatment.id,
          dateKey: selectedDate,
          timeLocal: selectedTime,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          whatsappOptIn,
          panelNotes: panelNotes.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar el turno.");
        return;
      }
      if (data.ok && data.id) {
        trackPanelClick("agregar_turno", "saved");
        router.push("/panel-turnos");
        router.refresh();
      }
    } catch {
      setError("Sin conexión o error de red. Probá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={panelPage}>
      <div className={`${panelContainer} pt-6`}>
        <header className="mb-5 flex items-center gap-3">
          <Link href="/panel-turnos" className={panelBackBtn} aria-label="Volver al panel">
            <ChevronLeft className="h-5 w-5" strokeWidth={1.85} />
          </Link>
          <div>
            <h1 className="font-heading text-[22px] font-bold leading-tight text-gray-900">Nuevo turno</h1>
            <p className="mt-0.5 text-[12px] text-gray-500">Alta manual · sin pago</p>
          </div>
        </header>

        <BookingPicker
          bookingContext="panel"
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
          <section className={`mt-6 space-y-4 ${panelCard} px-4 py-4`}>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">Datos del cliente</p>
              <p className="mt-1 text-[12px] text-gray-600">
                Turno el {formatSalonDisplayDate(selectedDate)} a las {selectedTime}
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label htmlFor="pn-customerName" className="text-[11px] font-medium text-gray-500">
                  Nombre y apellido
                </label>
                <input
                  id="pn-customerName"
                  name="customerName"
                  autoComplete="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={panelInput}
                />
              </div>
              <div>
                <label htmlFor="pn-customerPhone" className="text-[11px] font-medium text-gray-500">
                  WhatsApp
                </label>
                <input
                  id="pn-customerPhone"
                  name="customerPhone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ej: +54 9 11 2345-6789"
                  aria-invalid={showWhatsappInvalidHint}
                  className={`${panelInput} ${
                    showWhatsappInvalidHint ? "border-amber-400" : ""
                  }`}
                />
                {showWhatsappInvalidHint ? (
                  <p className="mt-1 text-[11px] text-amber-700">Revisá el número (10–15 dígitos).</p>
                ) : null}
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                <input
                  type="checkbox"
                  checked={whatsappOptIn}
                  onChange={(e) => setWhatsappOptIn(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 accent-[#B88E2F]"
                />
                <span className="text-[12px] leading-snug text-gray-600">Recordatorios por WhatsApp</span>
              </label>
              <div>
                <label htmlFor="pn-notes" className="text-[11px] font-medium text-gray-500">
                  Notas internas (opcional)
                </label>
                <textarea
                  id="pn-notes"
                  name="panelNotes"
                  rows={3}
                  value={panelNotes}
                  onChange={(e) => setPanelNotes(e.target.value)}
                  placeholder="Solo visible en el sistema…"
                  className={`${panelInput} resize-none text-[14px]`}
                />
              </div>
            </div>

            {error ? (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-center text-[12px] text-red-700"
              >
                {error}
              </p>
            ) : null}

            <button
              type="button"
              disabled={!datosComplete || submitting}
              onClick={() => void handleSubmit()}
              className={`flex h-[50px] w-full items-center justify-center rounded-full text-[15px] font-semibold transition-all ${
                datosComplete && !submitting
                  ? "cursor-pointer bg-[#B88E2F] text-white shadow-md active:scale-[0.98]"
                  : "cursor-not-allowed bg-gray-200 text-gray-400"
              }`}
            >
              {submitting ? "Guardando…" : "Confirmar turno"}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
