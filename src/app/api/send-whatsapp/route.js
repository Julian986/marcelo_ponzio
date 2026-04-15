import { NextResponse } from "next/server";
import { getDb } from "../../../lib/mongodb";
import { getTwilioClient } from "../../../lib/twilio";

function normalizeTo(to) {
  const digits = String(to ?? "").replace(/\D/g, "");
  if (!digits) throw new Error("El campo 'to' es obligatorio");

  let local = digits;
  if (local.startsWith("54")) local = local.slice(2);
  if (local.startsWith("9")) local = local.slice(1);

  return `whatsapp:+54${local}`;
}

export async function POST(request) {
  let to = "";
  let message = "";

  try {
    const body = await request.json();
    to = body?.to ?? "";
    message = body?.message ?? "";

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "El campo 'message' es obligatorio" }, { status: 400 });
    }

    const client = getTwilioClient();
    const from = process.env.TWILIO_WHATSAPP_FROM;

    if (!from) {
      return NextResponse.json(
        { error: "Falta variable de entorno: TWILIO_WHATSAPP_FROM" },
        { status: 500 },
      );
    }

    const response = await client.messages.create({
      from,
      to: normalizeTo(to),
      body: message,
    });

    const db = await getDb();
    await db.collection("whatsapp_logs").insertOne({
      to: String(to),
      message,
      sid: response.sid,
      status: response.status,
      createdAt: new Date(),
    });

    return NextResponse.json({ sid: response.sid, status: response.status });
  } catch (error) {
    try {
      if (to && message) {
        const db = await getDb();
        await db.collection("whatsapp_logs").insertOne({
          to: String(to),
          message,
          sid: null,
          status: "failed",
          createdAt: new Date(),
        });
      }
    } catch {
      // no-op
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo enviar WhatsApp" },
      { status: 500 },
    );
  }
}
