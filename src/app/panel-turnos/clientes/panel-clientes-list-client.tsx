"use client";

import { ChevronLeft, Search, User } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  panelBackBtn,
  panelCard,
  panelContainer,
  panelInput,
  panelPage,
} from "@/components/panel/panel-ui";
import { trackPanelClick } from "@/lib/analytics/track";

type ClientRow = {
  phoneDigits: string;
  customerName: string;
  customerPhone: string;
  visitCount: number;
  lastVisitDateKey: string;
};

function formatDateKey(key: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return key;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function PanelClientesListClient() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 280);
    return () => window.clearTimeout(t);
  }, [query]);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = q ? `?q=${encodeURIComponent(q)}` : "";
      const res = await fetch(`/api/panel-turnos/clientes${params}`, { credentials: "same-origin" });
      const data = (await res.json()) as { clients?: ClientRow[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudieron cargar las clientas.");
        setClients([]);
        return;
      }
      setClients(data.clients ?? []);
    } catch {
      setError("Sin conexión. Probá de nuevo.");
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(debounced);
  }, [debounced, load]);

  return (
    <div className={`${panelPage} bg-[#F0F1F3]`}>
      <div className={`${panelContainer} pt-6`}>
        <header className="mb-5 flex items-start gap-3">
          <Link
            href="/panel-turnos"
            className={panelBackBtn}
            aria-label="Volver a la agenda"
            onClick={() => trackPanelClick("clientes_back_agenda")}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-gray-500">Panel</p>
            <h1 className="font-montserrat text-[22px] font-bold leading-tight text-gray-900">Clientes</h1>
            <p className="mt-1 text-[14px] text-gray-500">Historial y ficha técnica por visita</p>
          </div>
        </header>

        <div className={`${panelCard} p-4`}>
          <label htmlFor="panel-clientes-search" className="sr-only">
            Buscar por nombre o WhatsApp
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="panel-clientes-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o WhatsApp…"
              className={`${panelInput} mt-0 pl-9`}
              autoComplete="off"
            />
          </div>
        </div>

        <section className="mt-4 space-y-3 pb-8">
          {loading ? (
            <p className="py-8 text-center text-[15px] text-gray-500">Cargando clientas…</p>
          ) : error ? (
            <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[15px] text-red-800">
              {error}
            </p>
          ) : clients.length === 0 ? (
            <p className="py-8 text-center text-[15px] text-gray-500">
              {debounced ? "No hay resultados para esa búsqueda." : "Todavía no hay clientas con turnos registrados."}
            </p>
          ) : (
            clients.map((c) => (
              <Link
                key={c.phoneDigits}
                href={`/panel-turnos/clientes/${encodeURIComponent(c.phoneDigits)}`}
                onClick={() => trackPanelClick("clientes_open_ficha")}
                className={`${panelCard} flex cursor-pointer items-center gap-4 px-4 py-4 transition active:scale-[0.99] hover:border-[#B88E2F]/25`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F5F5F5]">
                  <User className="h-6 w-6 text-[#B88E2F]" strokeWidth={1.6} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-montserrat text-[17px] font-semibold text-gray-900">{c.customerName}</p>
                  <p className="mt-0.5 truncate text-[14px] text-gray-500">{c.customerPhone}</p>
                  <p className="mt-1 text-[13px] text-gray-400">
                    {c.visitCount} {c.visitCount === 1 ? "visita" : "visitas"} · última{" "}
                    {formatDateKey(c.lastVisitDateKey)}
                  </p>
                </div>
              </Link>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
