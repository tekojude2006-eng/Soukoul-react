import { eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, notifications, users } from "@/db/schema";
import { getSessionUser, jsonError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Non authentifié.", 401);
  if (user.role === "student") return jsonError("Accès refusé.", 403);

  const body = (await req.json()) as {
    action?: "create" | "update";
    id?: number;
    classId?: number;
    subject?: string;
    title?: string;
    description?: string;
    content?: string;
    attachmentName?: string | null;
    attachmentUrl?: string | null;
  };

  if (body.action === "update" && body.id) {
    await db
      .update(courses)
      .set({
        classId: Number(body.classId),
        subject: body.subject || user.subject || "Cours",
        title: body.title ?? "",
        description: body.description ?? null,
        content: body.content ?? null,
        attachmentName: body.attachmentName ?? null,
        attachmentUrl: body.attachmentUrl ?? null,
      })
      .where(eq(courses.id, Number(body.id)));
    return Response.json({ ok: true });
  }

  if (!body.classId || !body.title) {
    return jsonError("Indiquez la classe et le titre du support de cours.");
  }

  const [created] = await db
    .insert(courses)
    .values({
      classId: Number(body.classId),
      teacherId: user.id,
      subject: body.subject || user.subject || "Cours",
      title: body.title,
      description: body.description ?? null,
      content: body.content ?? null,
      attachmentName: body.attachmentName ?? null,
      attachmentUrl: body.attachmentUrl ?? null,
    })
    .returning();

  const classStudents = await db.select().from(users).where(eq(users.classId, Number(body.classId)));
  const targets = classStudents.filter((s) => s.role === "student");
  if (targets.length > 0) {
    await db.insert(notifications).values(
      targets.map((s) => ({
        userId: s.id,
        type: "cours",
        title: `Nouveau support — ${body.subject || user.subject || "Cours"}`,
        body: body.title ?? "",
        tab: "classes",
        read: false,
      })),
    );
  }

  return Response.json({ item: created });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Non authentifié.", 401);
  if (user.role === "student") return jsonError("Accès refusé.", 403);
  const { id } = (await req.json()) as { id: number };
  await db.delete(courses).where(eq(courses.id, Number(id)));
  return Response.json({ ok: true });
}

