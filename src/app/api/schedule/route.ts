import { eq } from "drizzle-orm";
import { db } from "@/db";
import { schedules } from "@/db/schema";
import { getSessionUser, jsonError } from "@/lib/auth";
import { SUBJECT_COLORS } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Non authentifié.", 401);
  if (user.role === "student") return jsonError("Accès refusé.", 403);
  const body = (await req.json()) as {
    classId: number;
    teacherId?: number;
    subject?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room?: string;
    color?: string;
  };
  if (!body.classId || !body.dayOfWeek || !body.startTime || !body.endTime) {
    return jsonError("Champs manquants.");
  }
  const teacherId = user.role === "admin" ? (body.teacherId ?? user.id) : user.id;
  const subject = body.subject || user.subject || "Cours";
  const [row] = await db
    .insert(schedules)
    .values({
      classId: Number(body.classId),
      teacherId,
      subject,
      dayOfWeek: Number(body.dayOfWeek),
      startTime: body.startTime,
      endTime: body.endTime,
      room: body.room || null,
      color: body.color || SUBJECT_COLORS[subject] || "#3d5a80",
    })
    .returning();
  return Response.json({ item: row });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Non authentifié.", 401);
  if (user.role === "student") return jsonError("Accès refusé.", 403);
  const { id } = (await req.json()) as { id: number };
  const [row] = await db.select().from(schedules).where(eq(schedules.id, id)).limit(1);
  if (!row) return jsonError("Créneau introuvable.", 404);
  if (user.role === "teacher" && row.teacherId !== user.id) return jsonError("Accès refusé.", 403);
  await db.delete(schedules).where(eq(schedules.id, id));
  return Response.json({ ok: true });
}
