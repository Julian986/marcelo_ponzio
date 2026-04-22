"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { CustomerReservationPublic } from "@/lib/reservations/customer-public-serialize";
import { isUpcomingReservation } from "@/lib/reservations/customer-public-serialize";
import { reservationStatusLabel } from "@/lib/reservations/customer-ui-copy";

function formatDayMonthFromKey(dateKey: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!m) return dateKey;
  return `${m[3]}/${m[2]}`;
}

export function MisTurnosClient() {
  const [rows, setRows] = useState<CustomerReservationPublic[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/me/reservations?source=mis_turnos", { credentials: "same-origin" });
      if (res.status === 401) {
        setRows([]);
        setError("IniciÃ¡ sesiÃ³n desde Perfil con tu WhatsApp.");
        return;
      }
      const data = (await res.json()) as { reservations?: CustomerReservationPublic[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudieron cargar los turnos.");
        setRows([]);
        return;
      }
      setRows(Array.isArray(data.reservations) ? data.reservations : []);
    } catch {
      setError("Sin conexiÃ³n.");
      setRows([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!successMessage) return;
    const t = window.setTimeout(() => setSuccessMessage(null), 3200);
    return () => window.clearTimeout(t);
  }, [successMessage]);

  const upcoming = useMemo(
    () => (rows ?? []).filter((r) => isUpcomingReservation(r)).sort((a, b) => a.startsAtIso.localeCompare(b.startsAtIso)),
    [rows],
  );
  const past = useMemo(
    () => (rows ?? []).filter((r) => !isUpcomingReservation(r)).sort((a, b) => b.startsAtIso.localeCompare(a.startsAtIso)),
    [rows],
  );

  const list = tab === "upcoming" ? upcoming : past;

  const handleCancelReservation = useCallback(
    async (reservationId: string) => {
      setCancellingId(reservationId);
      setError(null);
      setSuccessMessage(null);
      try {
        const res = await fetch(`/api/me/reservations/${encodeURIComponent(reservationId)}`, {
          method: "DELETE",
          credentials: "same-origin",
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(data.error ?? "No se pudo cancelar el turno.");
          return;
        }
        await load();
        setSuccessMessage("Turno cancelado con Ã©xito.");
      } catch {
        setError("Sin conexiÃ³n.");
      } finally {
        setCancellingId(null);
      }
    },
    [load],
  );

  return (
    <main className="mx-auto w-full max-w-md px-4 pt-6 pb-24">
      <header className="mb-5 flex items-center gap-3">
        <Link
          href="/perfil"
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-[#171717] text-[var(--soft-gray)]/88 hover:bg-[#1d1d1d]"
          aria-label="Volver al perfil"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.85} />
        </Link>
        <div>
          <h1 className="font-heading text-[22px] leading-tight text-[var(--premium-gold)]">Mis turnos</h1>
          <p className="mt-0.5 text-[12px] text-[var(--soft-gray)]/55">PrÃ³ximos y pasados</p>
        </div>
      </header>

      <div className="mb-4 flex rounded-2xl border border-white/10 bg-[#181818] p-1">
        <button
          type="button"
          onClick={() => setTab("upcoming")}
          className={`flex-1 cursor-pointer rounded-xl py-2.5 text-[13px] font-semibold transition ${
            tab === "upcoming" ? "bg-[var(--premium-gold)] text-black" : "text-[var(--soft-gray)]/75 hover:bg-white/5"
          }`}
        >
          PrÃ³ximos ({upcoming.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("past")}
          className={`flex-1 cursor-pointer rounded-xl py-2.5 text-[13px] font-semibold transition ${
            tab === "past" ? "bg-[var(--premium-gold)] text-black" : "text-[var(--soft-gray)]/75 hover:bg-white/5"
          }`}
        >
          Pasados ({past.length})
        </button>
      </div>

      {error ? (
        <p role="alert" className="mb-4 rounded-xl border border-amber-500/35 bg-amber-950/25 px-3 py-2.5 text-[13px] text-amber-100/95">
          {error}{" "}
          <Link href="/perfil#acceso" className="font-semibold text-[var(--premium-gold)] underline-offset-2 hover:underline">
            Ir a acceso
          </Link>
        </p>
      ) : null}
      {successMessage ? (
        <p
          role="status"
          className="mb-4 rounded-xl border border-emerald-500/35 bg-emerald-950/25 px-3 py-2.5 text-[13px] text-emerald-100/95"
        >
          {successMessage}
        </p>
      ) : null}

      {rows === null ? (
        <p className="py-10 text-center text-[14px] text-[var(--soft-gray)]/55">Cargandoâ€¦</p>
      ) : list.length === 0 ? (
        <p className="py-10 text-center text-[14px] text-[var(--soft-gray)]/55">
          {tab === "upcoming" ? "No tenÃ©s turnos prÃ³ximos." : "No hay turnos pasados para mostrar."}
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-white/8 bg-[#171717] px-4 py-4 shadow-[0_10px_28px_rgba(0,0,0,0.35)]"
            >
              <p className="text-[16px] font-semibold leading-tight text-[var(--soft-gray)]">
                <span className="text-[var(--premium-gold)]">
                  {r.timeLocal}
                  <span className="ml-1 text-[13px] font-medium text-[var(--premium-gold)]/75">hs</span>
                </span>
                <span className="text-[var(--soft-gray)]/90"> Â· {formatDayMonthFromKey(r.dateKey)}</span>
              </p>
              <p className="mt-1.5 text-[12px] text-[var(--soft-gray)]/52">{r.displayDate}</p>
              <p className="mt-2.5 text-[16px] font-semibold text-[var(--soft-gray)]">{r.treatmentName}</p>
              <p className="mt-0.5 text-[12px] text-[var(--soft-gray)]/58">{r.subtitle}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-[var(--soft-gray)]/88">
                  {reservationStatusLabel(r.reservationStatus)}
                </span>
                {r.source === "panel" ? (
                  <span className="rounded-full bg-sky-500/14 px-2.5 py-1 text-[11px] font-semibold text-sky-200/95">
                    Cargado en salÃ³n
                  </span>
                ) : null}
              </div>
              {r.reservationStatus === "cancelled" && r.cancelledBy === "panel" ? (
                <p className="mt-2 rounded-xl border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-[12px] leading-snug text-amber-100/88">
                  Este turno fue cancelado desde el panel del salÃ³n.
                </p>
              ) : null}
              {tab === "upcoming" && (r.reservationStatus === "confirmed" || r.reservationStatus === "pending_payment") ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/perfil/mis-turnos/${encodeURIComponent(r.id)}/reprogramar`}
                    className="inline-flex h-9 cursor-pointer items-center rounded-xl border border-[var(--premium-gold)]/45 bg-[var(--premium-gold)]/12 px-3 text-[12px] font-semibold text-[var(--premium-gold)] transition hover:bg-[var(--premium-gold)]/18"
                  >
                    Cambiar horario
                  </Link>
                  <button
                    type="button"
                    disabled={cancellingId === r.id}
                    onClick={() => setCancelConfirmId(r.id)}
                    className="inline-flex h-9 cursor-pointer items-center rounded-xl border border-red-400/45 bg-red-500/10 px-3 text-[12px] font-semibold text-red-200/95 transition hover:bg-red-500/16 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cancellingId === r.id ? "Cancelando..." : "Cancelar turno"}
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {cancelConfirmId ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4"
          onClick={() => {
            if (cancellingId !== cancelConfirmId) {
              setCancelConfirmId(null);
            }
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/12 bg-[#171717] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-heading text-[20px] text-[var(--soft-gray)]">Cancelar turno</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--soft-gray)]/78">
              Â¿EstÃ¡s seguro que deseÃ¡s cancelar este turno? Esta acciÃ³n no se puede deshacer.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelConfirmId(null)}
                disabled={cancellingId === cancelConfirmId}
                className="inline-flex h-9 items-center rounded-xl border border-white/15 px-3 text-[12px] font-semibold text-[var(--soft-gray)]/85 transition hover:bg-white/5 disabled:opacity-60"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = cancelConfirmId;
                  if (!id) return;
                  await handleCancelReservation(id);
                  setCancelConfirmId(null);
                }}
                disabled={cancellingId === cancelConfirmId}
                className="inline-flex h-9 items-center rounded-xl border border-red-400/45 bg-red-500/12 px-3 text-[12px] font-semibold text-red-200/95 transition hover:bg-red-500/18 disabled:opacity-60"
              >
                {cancellingId === cancelConfirmId ? "Cancelando..." : "SÃ­, cancelar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

