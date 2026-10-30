import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  getSessionUser,
  hashPassword,
  jsonError,
  toSessionUser,
  verifyPassword,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return jsonError("Non authentifié.", 401);

  const body = (await req.json()) as {
    action?: "update-profile" | "change-password";
    name?: string;
    phone?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    subject?: string | null;
    currentPassword?: string;
    newPassword?: string;
  };

  const [dbUser] = await db.select().from(users).where(eq(users.id, sessionUser.id)).limit(1);
  if (!dbUser) return jsonError("Utilisateur introuvable.", 404);

  if (body.action === "change-password") {
    const currentPassword = body.currentPassword ?? "";
    const newPassword = body.newPassword ?? "";
    if (newPassword.length < 6) {
      return jsonError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
    }
    const ok =
      (await verifyPassword(currentPassword, dbUser.passwordHash)) ||
      (await verifyPassword(currentPassword.trim(), dbUser.passwordHash));
    if (!ok) {
      return jsonError("Mot de passe actuel incorrect.", 400);
    }
    await db
      .update(users)
      .set({
        passwordHash: await hashPassword(newPassword),
        firstLogin: false,
      })
      .where(eq(users.id, sessionUser.id));
    return Response.json({ ok: true });
  }

  const patch: Partial<typeof users.$inferInsert> = {};
  if (typeof body.name === "string" && body.name.trim()) {
    patch.name = body.name.trim();
  }
  if (body.phone !== undefined) {
    patch.phone = body.phone ? body.phone.trim() : null;
  }
  if (body.bio !== undefined) {
    patch.bio = body.bio ? body.bio.trim() : null;
  }
  if (body.avatarUrl !== undefined) {
    patch.avatarUrl = body.avatarUrl || null;
  }
  if (body.subject !== undefined && sessionUser.role !== "student") {
    patch.subject = body.subject ? body.subject.trim() : null;
  }

  const [updated] = await db
    .update(users)
    .set(patch)
    .where(eq(users.id, sessionUser.id))
    .returning();

  return Response.json({ ok: true, user: await toSessionUser(updated) });
}

