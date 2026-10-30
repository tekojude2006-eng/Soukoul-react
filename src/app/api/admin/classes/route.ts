import { eq } from "drizzle-orm";
import { db } from "@/db";
import { classes, classTeachers } from "@/db/schema";
import { getSessionUser, jsonError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Non authentifié.", 401);
  if (user.role !== "admin") return jsonError("Accès refusé.", 403);
  const body = (await req.json()) as {
    id?: number;
    name?: string;
    room?: string | null;
    principalTeacherId?: number | null;
  };
  if (body.id) {
    await db
      .update(classes)
      .set({
        name: body.name ?? "",
        room: body.room ?? null,
        principalTeacherId: body.principalTeacherId ?? null,
      })
      .where(eq(classes.id, body.id));
    if (body.principalTeacherId) {
      await db
        .insert(classTeachers)
        .values({ classId: Number(body.id), teacherId: Number(body.principalTeacherId) })
        .onConflictDoNothing();
    }
    return Response.json({ ok: true });
  }
  if (!body.name) return jsonError("Le nom de la classe est requis.");
  const [row] = await db
    .insert(classes)
    .values({
      name: body.name,
      room: body.room ?? null,
      principalTeacherId: body.principalTeacherId ?? null,
    })
    .returning();
  if (body.principalTeacherId) {
    await db
      .insert(classTeachers)
      .values({ classId: row.id, teacherId: Number(body.principalTeacherId) })
      .onConflictDoNothing();
  }
  return Response.json({ item: row });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Non authentifié.", 401);
  if (user.role !== "admin") return jsonError("Accès refusé.", 403);
  const { id } = (await req.json()) as { id: number };
  await db.delete(classTeachers).where(eq(classTeachers.classId, id));
  await db.delete(classes).where(eq(classes.id, id));
  return Response.json({ ok: true });
}
