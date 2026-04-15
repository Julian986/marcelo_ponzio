import { addDays, startOfDay } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/mongodb";
import { sendReminder } from "@/lib/reminders";
import { getTwilioClient } from "@/lib/twilio";

const TZ = "America/Argentina/Buenos_Aires";

function normalizeTo(to) {
  const digits = String(to ?? "").replace(/\D/g, "");
  if (!digits) throw new Error("appointment.clientPhone inválido");

  let local = digits;
  if (local.startsWith("54")) local = local.slice(2);
  if (local.startsWith("9")) local = local.slice(1);

  return `whatsapp:+54${local}`;
}

function buildTomorrowRangeInArgentina(now = new Date()) {
  const zonedNow = toZonedTime(now, TZ);
  const tomorrowLocalStart = addDays(startOfDay(zonedNow), 1);
  const dayAfterLocalStart = addDays(tomorrowLocalStart, 1);

  return {
    dateKey: formatInTimeZone(tomorrowLocalStart, TZ, "yyyy-MM-dd"),
    startUtc: fromZonedTime(tomorrowLocalStart, TZ),
    endUtc: fromZonedTime(dayAfterLocalStart, TZ),
  };
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;

    if (!process.env.CRON_SECRET || authHeader !== expected) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!process.env.TWILIO_WHATSAPP_FROM) {
      return NextResponse.json(
        { error: "Falta variable de entorno: TWILIO_WHATSAPP_FROM" },
        { status: 500 },
      );
    }

    const { dateKey, startUtc, endUtc } = buildTomorrowRangeInArgentina();
    const db = await getDb();
    const appointmentsCol = db.collection("appointments");
    const logsCol = db.collection("whatsapp_logs");
    const client = getTwilioClient();

    const appointments = await appointmentsCol
      .find({
        startsAt: { $gte: startUtc, $lt: endUtc },
        status: "confirmed",
        waReminder24hSentAt: null,
        clientPhone: { $exists: true, $nin: [null, ""] },
      })
      .toArray();

    let sent = 0;
    let errors = 0;

    for (const appointment of appointments) {
      const claimedAt = new Date();
      const claim = await appointmentsCol.findOneAndUpdate(
        {
          _id: appointment._id,
          status: "confirmed",
          waReminder24hSentAt: null,
          clientPhone: { $exists: true, $nin: [null, ""] },
        },
        { $set: { waReminder24hSentAt: claimedAt } },
        { returnDocument: "before" },
      );

      if (!claim) {
        continue;
      }

      try {
        const appointmentForReminder = {
          ...appointment,
          name: appointment.clientName,
          date: formatInTimeZone(appointment.startsAt, TZ, "dd/MM/yyyy"),
          time: formatInTimeZone(appointment.startsAt, TZ, "HH:mm"),
        };
        const message = sendReminder(appointmentForReminder);

        const twilioResponse = await client.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM,
          to: normalizeTo(appointment.clientPhone),
          body: message,
        });

        await logsCol.insertOne({
          to: appointment.clientPhone,
          message,
          sid: twilioResponse.sid,
          status: twilioResponse.status,
          createdAt: new Date(),
        });

        sent += 1;
      } catch (error) {
        errors += 1;

        await appointmentsCol.updateOne(
          { _id: appointment._id, waReminder24hSentAt: claimedAt },
          { $set: { waReminder24hSentAt: null } },
        );

        await logsCol.insertOne({
          to: appointment.clientPhone ?? null,
          message: "",
          sid: null,
          status: "failed",
          createdAt: new Date(),
          error: error instanceof Error ? error.message : "Error desconocido",
        });
      }
    }

    return NextResponse.json({ dateKey, sent, errors });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno del cron" },
      { status: 500 },
    );
  }
}
