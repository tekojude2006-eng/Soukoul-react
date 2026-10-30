import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { homeworkCompletions, homeworks, notifications, users } from "@/db/schema";
import { getSessionUser, jsonError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Non authentifié.", 401);

  const body = (await req.json()) as {
    action?: string;
    id?: number;
    classId?: number;
    title?: string;
    description?: string;
    dueDate?: string;
    subject?: string;
    homeworkId?: number;
    completed?: boolean;
  };

  if (body.action === "complete") {
    if (user.role !== "student") return jsonError("Accès refusé.", 403);
    const homeworkId = Number(body.homeworkId);
    if (body.completed === false) {
      await db
        .delete(homeworkCompletions)
        .where(
          and(eq(homeworkCompletions.homeworkId, homeworkId), eq(homeworkCompletions.studentId, user.id)),
        );
    } else {
      await db
        .insert(homeworkCompletions)
        .values({ homeworkId, studentId: user.id })
        .onConflictDoNothing();
    }
    return Response.json({ ok: true });
  }

  if (user.role === "student") return jsonError("Accès refusé.", 403);

  if (body.action === "update" && body.id) {
    await db
      .update(homeworks)
      .set({
        title: body.title ?? "",
        description: body.description ?? null,
        classId: Number(body.classId),
        dueDate: body.dueDate ?? "",
        subject: body.subject ?? user.subject,
      })
      .where(eq(homeworks.id, body.id));
    return Response.json({ ok: true });
  }

  if (!body.classId || !body.title || !body.dueDate) return jsonError("Champs manquants.");
  const [row] = await db
    .insert(homeworks)
    .values({
      classId: Number(body.classId),
      teacherId: user.id,
      subject: body.subject ?? user.subject,
      title: body.title,
      description: body.description ?? null,
      dueDate: body.dueDate,
    })
    .returning();

  const students = await db.select().from(users).where(eq(users.classId, Number(body.classId)));
  if (students.length) {
    await db.insert(notifications).values(
      students
        .filter((s) => s.role === "student")
        .map((s) => ({
          userId: s.id,
          type: "devoirs",
          title: "Nouveau devoir",
          body: body.title ?? "",
          tab: "devoirs",
          read: false,
        })),
    );
  }
  return Response.json({ item: row });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Non authentifié.", 401);
  if (user.role === "student") return jsonError("Accès refusé.", 403);
  const { id } = (await req.json()) as { id: number };
  await db.delete(homeworkCompletions).where(eq(homeworkCompletions.homeworkId, id));
  await db.delete(homeworks).where(eq(homeworks.id, id));
  return Response.json({ ok: true });
}
