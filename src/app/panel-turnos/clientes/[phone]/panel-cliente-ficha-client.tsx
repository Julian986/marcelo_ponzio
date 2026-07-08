"use client";

import { ChevronLeft, FileText, MessageCircle, Pencil } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import type { PanelClientVisit } from "@/lib/panel/client-serialize";
import {
  panelBackBtn,
  panelCard,
  panelContainer,
  panelInput,
  panelLabel,
  panelPage,
  panelPrimaryBtn,
} from "@/components/panel/panel-ui";
import { trackPanelClick } from "@/lib/analytics/track";

type ClientInfo = {
  phoneDigits: string;
  customerName: string;
  customerPhone: string;
  visitCount: number;
};

type Props = {
  phoneDigits: string;
};

function visitStatusLabel(status: string): string {
  if (status === "cancelled") return "Cancelada";
  if (status === "pending_payment") return "Pendiente de pago";
  if (status === "completed") return "Realizada";
  if (status === "no_show") return "No asistió";
  return "Confirmada";
}

function whatsAppChatUrl(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `https://wa.me/${digits}`;
}

export function PanelClienteFichaClient({ phoneDigits }: Props) {
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [visits, setVisits] = useState<PanelClientVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/panel-turnos/clientes/${encodeURIComponent(phoneDigits)}`, {
        credentials: "same-origin",
      });
      const data = (await res.json()) as {
        client?: ClientInfo;
        visits?: PanelClientVisit[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "No se pudo cargar la ficha.");
        setClient(null);
        setVisits([]);
        return;
      }
      setClient(data.client ?? null);
      setVisits(data.visits ?? []);
    } catch {
      setError("Sin conexión. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [phoneDigits]);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(visit: PanelClientVisit) {
    setEditingId(visit.id);
    setDraftNote(visit.technicalNote ?? "");
    setSaveError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftNote("");
    setSaveError(null);
  }

  async function saveNote(visitId: string) {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/panel-turnos/reservations/${encodeURIComponent(visitId)}/nota`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ note: draftNote }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setSaveError(data.error ?? "No se pudo guardar.");
        return;
      }
      trackPanelClick("ficha_guardar_nota");
      setVisits((prev) =>
        prev.map((v) =>
          v.id === visitId ? { ...v, technicalNote: draftNote.trim() ? draftNote.trim() : null } : v,
        ),
      );
      setEditingId(null);
      setDraftNote("");
    } catch {
      setSaveError("Sin conexión. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const waUrl = client ? whatsAppChatUrl(client.customerPhone) : null;

  return (
    <div className={`${panelPage} bg-[#F0F1F3]`}>
      <div className={`${panelContainer} pt-6`}>
        <header className="mb-5 flex items-start gap-3">
          <Link
            href="/panel-turnos/clientes"
            className={panelBackBtn}
            aria-label="Volver a clientes"
            onClick={() => trackPanelClick("ficha_back_clientes")}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-gray-500">Ficha del cliente</p>
            {loading ? (
              <h1 className="font-montserrat text-[22px] font-bold text-gray-900">Cargando…</h1>
            ) : client ? (
              <>
                <h1 className="font-montserrat text-[22px] font-bold leading-tight text-gray-900">{client.customerName}</h1>
                <p className="mt-1 text-[14px] text-gray-500">{client.customerPhone}</p>
                <p className="mt-1 text-[13px] text-gray-400">
                  {client.visitCount} {client.visitCount === 1 ? "visita" : "visitas"} registradas
                </p>
              </>
            ) : (
              <h1 className="font-montserrat text-[22px] font-bold text-gray-900">Clienta</h1>
            )}
          </div>
        </header>

        {client && waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackPanelClick("ficha_whatsapp")}
            className="mb-4 inline-flex items-center gap-2 text-[14px] font-medium text-[#1A7A3A] underline-offset-2 hover:underline"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2} />
            Enviar WhatsApp
          </a>
        ) : null}

        {loading ? (
          <p className="py-8 text-center text-[15px] text-gray-500">Cargando historial…</p>
        ) : error ? (
          <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[15px] text-red-800">
            {error}
          </p>
        ) : (
          <section className="space-y-4 pb-10">
            <p className="text-[13px] font-semibold tracking-wide text-gray-500 uppercase">Historial de visitas</p>

            {visits.map((visit) => {
              const isEditing = editingId === visit.id;
              return (
                <article key={visit.id} className={`${panelCard} overflow-hidden p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-montserrat text-[16px] font-semibold text-gray-900">{visit.treatmentName}</p>
                      <p className="mt-1 text-[14px] text-gray-600">
                        {visit.displayDate} · {visit.timeLocal} hs
                      </p>
                      <p className="mt-1 text-[12px] text-gray-400">{visitStatusLabel(visit.reservationStatus)}</p>
                    </div>
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => startEdit(visit)}
                        className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                        {visit.technicalNote ? "Editar nota" : "Agregar nota"}
                      </button>
                    ) : null}
                  </div>

                  {!isEditing && visit.technicalNote ? (
                    <div className="mt-3 rounded-xl border border-[#B88E2F]/20 bg-[#B88E2F]/5 px-3 py-3">
                      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[#B88E2F] uppercase">
                        <FileText className="h-3.5 w-3.5" strokeWidth={2} />
                        Ficha técnica
                      </p>
                      <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-gray-800">{visit.technicalNote}</p>
                    </div>
                  ) : null}

                  {!isEditing && !visit.technicalNote ? (
                    <p className="mt-3 text-[13px] text-gray-400">Sin ficha técnica para esta visita.</p>
                  ) : null}

                  {isEditing ? (
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <label htmlFor={`note-${visit.id}`} className={panelLabel}>
                        Ficha técnica
                      </label>
                      <textarea
                        id={`note-${visit.id}`}
                        value={draftNote}
                        onChange={(e) => setDraftNote(e.target.value)}
                        rows={5}
                        placeholder="Ej: Color 20% rojo suave, 33% azul, 20 g de producto, oxidante 20 vol, 35 min…"
                        className={`${panelInput} resize-y min-h-[120px]`}
                      />
                      {saveError ? (
                        <p role="alert" className="mt-2 text-[14px] text-red-700">
                          {saveError}
                        </p>
                      ) : null}
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void saveNote(visit.id)}
                          className={`${panelPrimaryBtn} h-11 text-[15px]`}
                        >
                          {saving ? "Guardando…" : "Guardar"}
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={cancelEdit}
                          className="flex h-11 flex-1 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-[15px] font-medium text-gray-700"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
