import { randomBytes } from "crypto";
import type { Db, ObjectId } from "mongodb";
import { MongoServerError, ObjectId as ObjectIdCtor } from "mongodb";

import { getAvailableTimesForDate, formatSalonDisplayDate } from "@/lib/booking/salon-availability";
import { isPublicLeadTimeViolated } from "@/lib/booking/public-slot-lead";
import { SALON_TREATMENTS } from "@/lib/treatments/catalog";

import type { CreateReservationInput, MpWebhookEventDoc, ReservationDoc, ReservationStatus } from "./types";

const COLLECTION = "reservations";
const WEBHOOK_LOGS = "mp_webhook_events";

/** Argentina: sin DST desde 2009; offset fijo UTC-3 para armar el instante del turno. */
export function computeStartsAtUtc(dateKey: string, timeLocal: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !/^\d{2}:\d{2}$/.test(timeLocal)) {
    return null;
  }
  const isoLocal = `${dateKey}T${timeLocal}:00`;
  const withOffset = `${isoLocal}-03:00`;
  const d = new Date(withOffset);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pendingTtlMs(): number {
  const raw = process.env.PENDING_RESERVATION_TTL_MINUTES;
  const n = raw ? Number(raw) : 60;
  if (!Number.isFinite(n) || n < 5 || n > 10080) return 60 * 60 * 1000;
  return n * 60 * 1000;
}

let indexesEnsured = false;

export async function ensureReservationIndexes(db: Db) {
  if (indexesEnsured) return;
  const col = db.collection(COLLECTION);
  const logs = db.collection(WEBHOOK_LOGS);

  try {
    await col.dropIndex("uniq_startsAt");
  } catch {
    /* no existe en deploys nuevos */
  }

  await col.createIndex(
    { startsAt: 1 },
    {
      unique: true,
      partialFilterExpression: {
        reservationStatus: { $in: ["pending_payment", "confirmed"] },
      },
      name: "uniq_startsAt_active_pending_or_confirmed",
    },
  );
  await col.createIndex({ createdAt: -1 }, { name: "by_created" });
  await col.createIndex({ reservationStatus: 1, startsAt: 1 }, { name: "by_status_starts" });
  await col.createIndex({ externalReference: 1 }, { sparse: true, name: "by_external_ref" });
  await col.createIndex({ paymentDeadlineAt: 1 }, { sparse: true, name: "by_payment_deadline" });

  await logs.createIndex({ receivedAt: -1 }, { name: "mp_logs_received" });
  await logs.createIndex({ resourceId: 1, receivedAt: -1 }, { name: "mp_logs_resource" });

  indexesEnsured = true;
}

export async function insertPendingReservation(
  db: Db,
  input: CreateReservationInput,
): Promise<
  | { id: string; checkoutToken: string; externalReference: string }
  | { error: string; code?: string }
> {
  const startsAt = computeStartsAtUtc(input.dateKey, input.timeLocal);
  if (!startsAt) {
    return { error: "Fecha u horario inválidos.", code: "INVALID_SLOT" };
  }

  const now = new Date();
  if (isPublicLeadTimeViolated(input.dateKey, startsAt, now)) {
    return {
      error: "Para hoy, los turnos deben reservarse con al menos 1 hora de anticipación.",
      code: "LEAD_TIME",
    };
  }
  const checkoutToken = randomBytes(32).toString("hex");
  const paymentDeadlineAt = new Date(now.getTime() + pendingTtlMs());

  const doc = {
    treatmentId: input.treatmentId,
    treatmentName: input.treatmentName,
    subtitle: input.subtitle,
    category: input.category,
    dateKey: input.dateKey,
    timeLocal: input.timeLocal,
    displayDate: input.displayDate,
    startsAt,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    whatsappOptIn: input.whatsappOptIn,
    reservationStatus: "pending_payment" as ReservationStatus,
    paymentStatus: "pending" as const,
    source: "app_turnos" as const,
    createdAt: now,
    updatedAt: now,
    checkoutToken,
    paymentDeadlineAt,
  } satisfies Omit<ReservationDoc, "_id" | "externalReference" | "preferenceId" | "mpPaymentId">;

  await ensureReservationIndexes(db);

  try {
    const result = await db.collection(COLLECTION).insertOne(doc);
    const id = result.insertedId.toHexString();
    await db.collection(COLLECTION).updateOne(
      { _id: result.insertedId },
      { $set: { externalReference: id, updatedAt: new Date() } },
    );
    return { id, checkoutToken, externalReference: id };
  } catch (e) {
    if (e instanceof MongoServerError && e.code === 11000) {
      return {
        error: "Ese horario ya está ocupado o tiene una reserva pendiente. Elegí otro día u horario.",
        code: "SLOT_TAKEN",
      };
    }
    throw e;
  }
}

export type PanelReservationInsertInput = {
  treatmentId: string;
  dateKey: string;
  timeLocal: string;
  customerName: string;
  customerPhone: string;
  whatsappOptIn: boolean;
  panelNotes?: string | null;
};

const PANEL_NOTES_MAX_LEN = 2000;

/**
 * Alta manual desde el panel (sin Mercado Pago). Respeta el índice único de `startsAt`
 * para reservas activas (pending_payment | confirmed).
 */
export async function insertPanelReservation(
  db: Db,
  input: PanelReservationInsertInput,
): Promise<{ ok: true; id: string } | { error: string; code?: string }> {
  const treatment = SALON_TREATMENTS.find((t) => t.id === input.treatmentId.trim());
  if (!treatment) {
    return { error: "Tratamiento inválido.", code: "INVALID_TREATMENT" };
  }

  const dateKey = input.dateKey.trim();
  const timeLocal = input.timeLocal.trim();
  const startsAt = computeStartsAtUtc(dateKey, timeLocal);
  if (!startsAt) {
    return { error: "Fecha u horario inválidos.", code: "INVALID_SLOT" };
  }

  const allowedTimes = getAvailableTimesForDate(dateKey);
  if (!allowedTimes.includes(timeLocal)) {
    return { error: "Ese horario no está disponible.", code: "SLOT_UNAVAILABLE" };
  }

  let panelNotes: string | null = null;
  if (input.panelNotes != null && String(input.panelNotes).trim()) {
    const t = String(input.panelNotes).trim();
    if (t.length > PANEL_NOTES_MAX_LEN) {
      return { error: `Las notas no pueden superar ${PANEL_NOTES_MAX_LEN} caracteres.` };
    }
    panelNotes = t;
  }

  const now = new Date();
  const displayDate = formatSalonDisplayDate(dateKey);
  const createdBy = (process.env.PANEL_TURNOS_CREATED_BY ?? "panel").trim() || "panel";

  const doc = {
    treatmentId: treatment.id,
    treatmentName: treatment.name,
    subtitle: treatment.subtitle,
    category: treatment.category,
    dateKey,
    timeLocal,
    displayDate,
    startsAt,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    whatsappOptIn: input.whatsappOptIn === true,
    reservationStatus: "confirmed" as const,
    paymentStatus: "not_required" as const,
    source: "panel" as const,
    createdBy,
    panelNotes,
    createdAt: now,
    updatedAt: now,
  } satisfies Omit<
    ReservationDoc,
    | "_id"
    | "externalReference"
    | "preferenceId"
    | "mpPaymentId"
    | "checkoutToken"
    | "paymentDeadlineAt"
    | "mpPaymentStatusLast"
    | "mpPaymentApprovedAt"
    | "cancelReason"
    | "waReminder24hSentAt"
  >;

  await ensureReservationIndexes(db);

  try {
    const result = await db.collection(COLLECTION).insertOne(doc);
    const id = result.insertedId.toHexString();
    await db.collection(COLLECTION).updateOne(
      { _id: result.insertedId },
      { $set: { externalReference: id, updatedAt: new Date() } },
    );
    return { ok: true, id };
  } catch (e) {
    if (e instanceof MongoServerError && e.code === 11000) {
      return {
        error: "Ese horario ya está ocupado. Elegí otro.",
        code: "SLOT_TAKEN",
      };
    }
    throw e;
  }
}

export async function findReservationByHexId(db: Db, hexId: string): Promise<ReservationDoc | null> {
  try {
    const _id = new ObjectIdCtor(hexId);
    const doc = await db.collection<ReservationDoc>(COLLECTION).findOne({ _id });
    return doc ?? null;
  } catch {
    return null;
  }
}

export async function attachPreferenceToReservation(
  db: Db,
  reservationId: ObjectId,
  preferenceId: string,
): Promise<boolean> {
  const r = await db.collection(COLLECTION).updateOne(
    { _id: reservationId, reservationStatus: "pending_payment" },
    { $set: { preferenceId, updatedAt: new Date() } },
  );
  return r.modifiedCount === 1;
}

export type MpPaymentPayload = {
  id: number | string;
  status: string;
  external_reference?: string | null;
};

/**
 * Confirma la reserva si el pago está approved y el external_reference coincide.
 * Idempotente: si ya está confirmed con el mismo mpPaymentId, no hace nada destructivo.
 */
export async function tryConfirmReservationFromMpPayment(
  db: Db,
  payment: MpPaymentPayload,
): Promise<{ outcome: "confirmed" | "ignored" | "no_match" | "not_approved"; detail?: string }> {
  const paymentIdStr = String(payment.id);
  const ext = payment.external_reference?.trim() ?? "";

  if (payment.status !== "approved") {
    if (ext) {
      const res = await findReservationByHexId(db, ext);
      if (res && res.reservationStatus === "pending_payment") {
        await db.collection(COLLECTION).updateOne(
          { _id: res._id },
          {
            $set: {
              mpPaymentId: paymentIdStr,
              mpPaymentStatusLast: payment.status,
              updatedAt: new Date(),
            },
          },
        );
      }
    }
    return { outcome: "not_approved", detail: payment.status };
  }

  if (!ext) {
    return { outcome: "no_match", detail: "missing_external_reference" };
  }

  const reservation = await findReservationByHexId(db, ext);
  if (!reservation) {
    return { outcome: "no_match", detail: "reservation_not_found" };
  }

  if (reservation.reservationStatus === "confirmed") {
    if (reservation.mpPaymentId === paymentIdStr) {
      return { outcome: "ignored", detail: "already_confirmed_same_payment" };
    }
    return { outcome: "ignored", detail: "already_confirmed_different_payment" };
  }

  if (reservation.reservationStatus !== "pending_payment") {
    return { outcome: "ignored", detail: `reservation_status_${reservation.reservationStatus}` };
  }

  if (reservation.paymentDeadlineAt && reservation.paymentDeadlineAt.getTime() < Date.now()) {
    return { outcome: "ignored", detail: "reservation_expired" };
  }

  const now = new Date();
  const result = await db.collection(COLLECTION).updateOne(
    {
      _id: reservation._id,
      reservationStatus: "pending_payment",
    },
    {
      $set: {
        reservationStatus: "confirmed",
        paymentStatus: "approved",
        mpPaymentId: paymentIdStr,
        mpPaymentStatusLast: payment.status,
        mpPaymentApprovedAt: now,
        updatedAt: now,
      },
      $unset: { checkoutToken: "" },
    },
  );

  if (result.modifiedCount !== 1) {
    return { outcome: "ignored", detail: "concurrent_update" };
  }

  return { outcome: "confirmed" };
}

export async function insertMpWebhookEvent(db: Db, doc: MpWebhookEventDoc): Promise<ObjectId> {
  const r = await db.collection<MpWebhookEventDoc>(WEBHOOK_LOGS).insertOne(doc);
  return r.insertedId;
}

export async function updateMpWebhookEvent(
  db: Db,
  id: ObjectId,
  patch: Partial<Pick<MpWebhookEventDoc, "processingOutcome" | "detail" | "reservationHexId" | "mpPaymentId">>,
) {
  await db.collection(WEBHOOK_LOGS).updateOne({ _id: id }, { $set: patch });
}

/** Marca reservas pending_payment vencidas como canceladas (libera el slot para nuevo pending). */
export async function expirePendingReservations(db: Db): Promise<number> {
  const now = new Date();
  const r = await db.collection(COLLECTION).updateMany(
    {
      reservationStatus: "pending_payment",
      paymentDeadlineAt: { $lt: now },
    },
    {
      $set: {
        reservationStatus: "cancelled",
        paymentStatus: "failed",
        cancelReason: "payment_deadline_expired",
        updatedAt: now,
      },
      $unset: { checkoutToken: "" },
    },
  );
  return r.modifiedCount;
}
