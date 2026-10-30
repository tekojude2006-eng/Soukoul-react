import { eq } from "drizzle-orm";
import { db } from "@/db";
import { absences, notifications, users } from "@/db/schema";
import { getSessionUser, jsonError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Non authentifié.", 401);
  if (user.role === "student") return jsonError("Accès refusé.", 403);

  const body = (await req.json()) as {
    action?: string;
    id?: number;
    studentId?: number;
    classId?: number;
    type?: "absence" | "retard";
    date?: string;
    timeSlot?: string;
    reason?: string;
    justified?: boolean;
  };

  if (body.action === "justify" && body.id) {
    if (user.role !== "admin" && user.role !== "teacher") return jsonError("Accès refusé.", 403);
    await db
      .update(absences)
      .set({ justified: true, reason: body.reason || "Justifiée" })
      .where(eq(absences.id, body.id));
    return Response.json({ ok: true });
  }

  if (!body.studentId || !body.date || !body.type || !body.timeSlot) {
    return jsonError("Champs manquants.");
  }
  const [student] = await db.select().from(users).where(eq(users.id, Number(body.studentId))).limit(1);
  if (!student) return jsonError("Étudiant introuvable.");
  const [row] = await db
    .insert(absences)
    .values({
      studentId: student.id,
      classId: Number(body.classId || student.classId || 0),
      type: body.type,
      date: body.date,
      timeSlot: body.timeSlot,
      reason: body.reason ?? null,
      justified: Boolean(body.justified),
      reportedBy: user.id,
    })
    .returning();
  await db.insert(notifications).values({
    userId: student.id,
    type: "absences",
    title: body.type === "retard" ? "Retard enregistré" : "Absence enregistrée",
    body: `${body.date} (${body.timeSlot})${body.reason ? ` — ${body.reason}` : ""}`,
    tab: "home",
    read: false,
  });
  return Response.json({ item: row });
}
