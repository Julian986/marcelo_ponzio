"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { CustomerReservationPublic } from "@/lib/reservations/customer-public-serialize";
import { isUpcomingReservation } from "@/lib/reservations/customer-public-serialize";
import { formatShortDateFromKey, reservationStatusLabel } from "@/lib/reservations/customer-ui-copy";

export function MisTurnosClient() {
  const [rows, setRows] = useState<CustomerReservationPublic[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/me/reservations", { credentials: "same-origin" });
      if (res.status === 401) {
        setRows([]);
        setError("Iniciá sesión desde Perfil con tu WhatsApp.");
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
      setError("Sin conexión.");
      setRows([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upcoming = useMemo(
    () => (rows ?? []).filter((r) => isUpcomingReservation(r)).sort((a, b) => a.startsAtIso.localeCompare(b.startsAtIso)),
    [rows],
  );
  const past = useMemo(
    () => (rows ?? []).filter((r) => !isUpcomingReservation(r)).sort((a, b) => b.startsAtIso.localeCompare(a.startsAtIso)),
    [rows],
  );

  const list = tab === "upcoming" ? upcoming : past;

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
          <p className="mt-0.5 text-[12px] text-[var(--soft-gray)]/55">Próximos y pasados</p>
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
          Próximos ({upcoming.length})
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

      {rows === null ? (
        <p className="py-10 text-center text-[14px] text-[var(--soft-gray)]/55">Cargando…</p>
      ) : list.length === 0 ? (
        <p className="py-10 text-center text-[14px] text-[var(--soft-gray)]/55">
          {tab === "upcoming" ? "No tenés turnos próximos." : "No hay turnos pasados para mostrar."}
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-white/8 bg-[#171717] px-4 py-4 shadow-[0_10px_28px_rgba(0,0,0,0.35)]"
            >
              <p className="font-heading text-[22px] leading-none tracking-tight text-[var(--soft-gray)]">
                <span className="text-[var(--premium-gold)]">{r.timeLocal}</span>
                <span className="text-[var(--soft-gray)]/90"> · {formatShortDateFromKey(r.dateKey)}</span>
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
                    Cargado en salón
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
