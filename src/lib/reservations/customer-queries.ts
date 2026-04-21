import type { Db } from "mongodb";

import { normalizePhoneDigits } from "@/lib/booking/salon-availability";

import type { ReservationDoc } from "./types";

const COLLECTION = "reservations";

/** Reservas del cliente (mismo WhatsApp normalizado), más recientes primero. */
export async function listReservationsByCustomerPhoneDigits(
  db: Db,
  phoneDigits: string,
): Promise<ReservationDoc[]> {
  return db
    .collection<ReservationDoc>(COLLECTION)
    .find({ customerPhoneDigits: phoneDigits })
    .sort({ startsAt: -1 })
    .limit(200)
    .toArray();
}

/** Rellena `customerPhoneDigits` en documentos viejos (tandas acotadas por arranque). */
export async function backfillCustomerPhoneDigitsBatch(db: Db, batchSize = 250): Promise<number> {
  const col = db.collection<ReservationDoc>(COLLECTION);
  const rows = await col
    .find({ customerPhoneDigits: { $exists: false } }, { projection: { _id: 1, customerPhone: 1 } })
    .limit(batchSize)
    .toArray();
  if (rows.length === 0) return 0;
  await Promise.all(
    rows.map((r) =>
      col.updateOne(
        { _id: r._id },
        { $set: { customerPhoneDigits: normalizePhoneDigits(String(r.customerPhone ?? "")) } },
      ),
    ),
  );
  return rows.length;
}
