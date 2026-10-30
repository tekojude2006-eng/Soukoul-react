import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { grades, notifications, users } from "@/db/schema";
import { getSessionUser, jsonError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Non authentifié.", 401);
  if (user.role === "student") return jsonError("Accès refusé.", 403);

  const body = (await req.json()) as {
    classId: number;
    period: string;
    evaluationTitle: string;
    coefficient: number;
    subject?: string;
    entries: Array<{ studentId: number; score: number | null | ""; comment?: string | null }>;
  };

  if (!body.classId || !body.period || !body.evaluationTitle) {
    return jsonError("Champs manquants.");
  }

  const subject = body.subject || user.subject || "Matière";
  const coefficient = Number(body.coefficient || 1);
  const existing = await db
    .select()
    .from(grades)
    .where(
      and(
        eq(grades.classId, Number(body.classId)),
        eq(grades.period, body.period),
        eq(grades.evaluationTitle, body.evaluationTitle),
        eq(grades.teacherId, user.id),
      ),
    );
  const byStudent = new Map(existing.map((g) => [g.studentId, g]));

  for (const entry of body.entries ?? []) {
    const raw = entry.score;
    const empty = raw === "" || raw === null || raw === undefined || Number.isNaN(Number(raw));
    const prev = byStudent.get(entry.studentId);
    if (empty) {
      if (prev) await db.delete(grades).where(eq(grades.id, prev.id));
      continue;
    }
    const score = Number(raw);
    if (score < 0 || score > 20) continue;
    if (prev) {
      await db
        .update(grades)
        .set({ score, comment: entry.comment ?? null, coefficient, subject })
        .where(eq(grades.id, prev.id));
    } else {
      await db.insert(grades).values({
        studentId: entry.studentId,
        teacherId: user.id,
        classId: Number(body.classId),
        subject,
        evaluationTitle: body.evaluationTitle,
        period: body.period,
        coefficient,
        score,
        comment: entry.comment ?? null,
      });
      await db.insert(notifications).values({
        userId: entry.studentId,
        type: "notes",
        title: `Nouvelle note en ${subject}`,
        body: `${body.evaluationTitle} — ${score}/20`,
        tab: "notes",
        read: false,
      });
    }
  }

  return Response.json({ ok: true });
}

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Non authentifié.", 401);
  const url = new URL(req.url);
  const classId = Number(url.searchParams.get("classId"));
  if (!classId) return Response.json({ students: [], evaluations: [] });
  const students = await db.select().from(users).where(eq(users.classId, classId));
  const evals = await db.select().from(grades).where(eq(grades.classId, classId));
  const titles = Array.from(
    new Map(
      evals.map((g) => [
        `${g.period}|${g.evaluationTitle}|${g.teacherId}`,
        { period: g.period, evaluationTitle: g.evaluationTitle, teacherId: g.teacherId, subject: g.subject, coefficient: g.coefficient },
      ]),
    ).values(),
  );
  return Response.json({
    students: students.filter((s) => s.role === "student").map((s) => ({ id: s.id, name: s.name, email: s.email })),
    evaluations: titles,
  });
}
