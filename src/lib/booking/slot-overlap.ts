import type { Db } from "mongodb";

import { findSalonTreatmentById } from "@/lib/treatments/catalog";

const COLLECTION = "reservations";
const ACTIVE_STATUSES = ["pending_payment", "confirmed"] as const;

export type IntervalMs = { startMs: number; endMs: number };

export function intervalsOverlap(a: IntervalMs, b: IntervalMs): boolean {
  return a.startMs < b.endMs && a.endMs > b.startMs;
}

/** Inicio/fin del turno en epoch ms (misma convención que `computeStartsAtUtc`, ART -03:00). */
export function slotIntervalMs(
  dateKey: string,
  timeLocal: string,
  durationMinutes: number,
): IntervalMs | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !/^\d{2}:\d{2}$/.test(timeLocal)) {
    return null;
  }
  const d = new Date(`${dateKey}T${timeLocal}:00-03:00`);
  if (Number.isNaN(d.getTime())) return null;
  const startMs = d.getTime();
  const endMs = startMs + durationMinutes * 60_000;
  return { startMs, endMs };
}

function durationForReservationRow(r: {
  durationMinutes?: unknown;
  treatmentId?: unknown;
  startsAt?: unknown;
}): number {
  if (typeof r.durationMinutes === "number" && Number.isFinite(r.durationMinutes) && r.durationMinutes > 0) {
    return r.durationMinutes;
  }
  const tid = String(r.treatmentId ?? "").trim();
  return findSalonTreatmentById(tid)?.durationMinutes ?? 60;
}

export async function loadBusyIntervalsMs(db: Db, dateKey: string): Promise<IntervalMs[]> {
  const rows = await db
    .collection(COLLECTION)
    .find(
      { dateKey, reservationStatus: { $in: [...ACTIVE_STATUSES] } },
      { projection: { startsAt: 1, durationMinutes: 1, treatmentId: 1 } },
    )
    .toArray();

  return rows.map((r) => {
    const startsAt = r.startsAt instanceof Date ? r.startsAt : new Date(String(r.startsAt));
    const startMs = startsAt.getTime();
    const dur = durationForReservationRow(r as { durationMinutes?: unknown; treatmentId?: unknown });
    return { startMs, endMs: startMs + dur * 60_000 };
  });
}

export function filterSlotsWithoutOverlap(
  slots: string[],
  dateKey: string,
  durationMinutes: number,
  busy: IntervalMs[],
): string[] {
  return slots.filter((timeLocal) => {
    const slot = slotIntervalMs(dateKey, timeLocal, durationMinutes);
    if (!slot) return false;
    return !busy.some((b) => intervalsOverlap(slot, b));
  });
}

export async function reservationIntervalOverlapsExisting(
  db: Db,
  dateKey: string,
  candidate: IntervalMs,
): Promise<boolean> {
  const busy = await loadBusyIntervalsMs(db, dateKey);
  return busy.some((b) => intervalsOverlap(candidate, b));
}
