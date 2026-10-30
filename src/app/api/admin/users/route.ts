import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import {
  absences,
  classTeachers,
  grades,
  homeworkCompletions,
  messages,
  notifications,
  users,
} from "@/db/schema";
import { getSessionUser, hashPassword, jsonError } from "@/lib/auth";

export const dynamic = "force-dynamic";

function normalizeEmail(email: string, role: string) {
  const raw = email.trim().toLowerCase();
  if (raw.includes("@")) return raw;
  return role === "student" ? `${raw}@eleve.sn` : `${raw}@ecole.sn`;
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Non authentifié.", 401);
  if (user.role !== "admin") return jsonError("Accès refusé.", 403);

  const body = (await req.json()) as {
    id?: number;
    name?: string;
    email?: string;
    password?: string;
    role?: "student" | "teacher";
    classId?: number | null;
    classIds?: number[];
    phone?: string | null;
    subject?: string | null;
    resetPassword?: string;
  };

  if (body.id) {
    const patch: Partial<typeof users.$inferInsert> = {};
    if (body.name) patch.name = body.name;
    if (body.email) patch.email = normalizeEmail(body.email, body.role ?? "student");
    if (body.classId !== undefined) patch.classId = body.classId;
    if (body.phone !== undefined) patch.phone = body.phone;
    if (body.subject !== undefined) patch.subject = body.subject;
    if (body.resetPassword) {
      if (body.resetPassword.length < 6) return jsonError("Mot de passe trop court.");
      patch.passwordHash = await hashPassword(body.resetPassword);
      patch.firstLogin = true;
    }
    await db.update(users).set(patch).where(eq(users.id, body.id));
    if (body.classIds) {
      await db.delete(classTeachers).where(eq(classTeachers.teacherId, body.id));
      if (body.classIds.length) {
        await db.insert(classTeachers).values(body.classIds.map((classId) => ({ classId, teacherId: body.id! })));
      }
    }
    return Response.json({ ok: true });
  }

  if (!body.name || !body.email || !body.password || !body.role) {
    return jsonError("Champs manquants.");
  }
  if (body.password.length < 6) return jsonError("Mot de passe trop court.");
  const [created] = await db
    .insert(users)
    .values({
      name: body.name,
      email: normalizeEmail(body.email, body.role),
      passwordHash: await hashPassword(body.password),
      role: body.role,
      firstLogin: true,
      phone: body.phone ?? null,
      subject: body.subject ?? null,
      classId: body.role === "student" ? body.classId ?? null : null,
    })
    .returning();

  if (body.role === "teacher" && body.classIds?.length) {
    await db.insert(classTeachers).values(body.classIds.map((classId) => ({ classId, teacherId: created.id })));
  }
  return Response.json({ item: created });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Non authentifié.", 401);
  if (user.role !== "admin") return jsonError("Accès refusé.", 403);
  const { id } = (await req.json()) as { id: number };
  if (id === user.id) return jsonError("Impossible de supprimer votre propre compte.");
  await db.delete(classTeachers).where(eq(classTeachers.teacherId, id));
  await db.delete(homeworkCompletions).where(eq(homeworkCompletions.studentId, id));
  await db.delete(grades).where(eq(grades.studentId, id));
  await db.delete(absences).where(eq(absences.studentId, id));
  await db.delete(notifications).where(eq(notifications.userId, id));
  await db.delete(messages).where(or(eq(messages.toId, id), eq(messages.fromId, id)));
  await db.delete(users).where(eq(users.id, id));
  return Response.json({ ok: true });
}
