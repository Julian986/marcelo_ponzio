import type { Db } from "mongodb";

import { canonicalPhoneDigitsAR, customerPhoneDigitsQueryValues } from "@/lib/customer/phone-canonical-ar";

import type { ReservationDoc } from "./types";

const COLLECTION = "reservations";

/** Reservas del cliente (mismo WhatsApp, formato AR unificado + variantes guardadas). */
export async function listReservationsByCustomerPhoneDigits(
  db: Db,
  phoneDigitsCanonical: string,
): Promise<ReservationDoc[]> {
  const keys = customerPhoneDigitsQueryValues(phoneDigitsCanonical);
  return db
    .collection<ReservationDoc>(COLLECTION)
    .find({ customerPhoneDigits: { $in: keys } })
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
        { $set: { customerPhoneDigits: canonicalPhoneDigitsAR(String(r.customerPhone ?? "")) } },
      ),
    ),
  );
  return rows.length;
}
