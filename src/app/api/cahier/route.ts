import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cahierSessions, notifications, users } from "@/db/schema";
import { getSessionUser, jsonError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Non authentifié.", 401);
  if (user.role === "student") return jsonError("Accès refusé.", 403);
  const body = (await req.json()) as {
    classId: number;
    date: string;
    title: string;
    summary?: string;
    workAssigned?: string;
    subject?: string;
  };
  if (!body.classId || !body.date || !body.title) return jsonError("Champs manquants.");
  const [row] = await db
    .insert(cahierSessions)
    .values({
      classId: Number(body.classId),
      teacherId: user.id,
      subject: body.subject || user.subject || "Cours",
      date: body.date,
      title: body.title,
      summary: body.summary ?? null,
      workAssigned: body.workAssigned ?? null,
    })
    .returning();
  const students = await db.select().from(users).where(eq(users.classId, Number(body.classId)));
  if (students.length) {
    await db.insert(notifications).values(
      students
        .filter((s) => s.role === "student")
        .map((s) => ({
          userId: s.id,
          type: "cours",
          title: "Nouvelle séance au cahier de texte",
          body: body.title,
          tab: "cahier",
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
  await db.delete(cahierSessions).where(eq(cahierSessions.id, id));
  return Response.json({ ok: true });
}
