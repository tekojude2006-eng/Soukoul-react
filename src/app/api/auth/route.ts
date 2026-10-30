import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  clearSessionCookie,
  getSessionUser,
  hashPassword,
  jsonError,
  resolveIdentifier,
  setSessionCookie,
  signSession,
  toSessionUser,
  verifyPassword,
} from "@/lib/auth";
import { ensureSeeded } from "@/db/seed";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Non authentifié.", 401);
  return Response.json({ user });
}

export async function DELETE() {
  await clearSessionCookie();
  return Response.json({ ok: true });
}

export async function POST(req: Request) {
  await ensureSeeded();
  const body = (await req.json()) as {
    action?: string;
    identifier?: string;
    password?: string;
    code?: string;
  };
  const action = body.action ?? "login";

  if (action === "login") {
    const identifier = body.identifier ?? "";
    const password = body.password ?? "";
    const found = await resolveIdentifier(identifier);
    if (!found) return jsonError("Identifiant introuvable.", 401);
    const ok =
      (await verifyPassword(password, found.passwordHash)) ||
      (await verifyPassword(password.trim(), found.passwordHash));
    if (!ok) return jsonError("Mot de passe incorrect.", 401);
    const token = await signSession({ uid: found.id, role: found.role as Role });
    await setSessionCookie(token);
    return Response.json({ user: await toSessionUser(found) });
  }

  if (action === "recovery-send") {
    const found = await resolveIdentifier(body.identifier ?? "");
    if (!found) return jsonError("Aucun compte ne correspond à cet identifiant.");
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await db.update(users).set({ recoveryCode: code }).where(eq(users.id, found.id));
    return Response.json({
      ok: true,
      demoCode: code,
      message: "Un code à 6 chiffres a été envoyé à l'adresse associée.",
    });
  }

  if (action === "recovery-reset") {
    const found = await resolveIdentifier(body.identifier ?? "");
    if (!found) return jsonError("Identifiant introuvable.");
    if (!body.code || found.recoveryCode !== body.code.trim()) {
      return jsonError("Code de récupération invalide.");
    }
    const password = body.password ?? "";
    if (password.length < 6) return jsonError("Le mot de passe doit contenir au moins 6 caractères.");
    await db
      .update(users)
      .set({
        passwordHash: await hashPassword(password),
        recoveryCode: null,
        firstLogin: false,
      })
      .where(eq(users.id, found.id));
    return Response.json({ ok: true });
  }

  if (action === "force-password") {
    const user = await getSessionUser();
    if (!user) return jsonError("Non authentifié.", 401);
    const password = body.password ?? "";
    if (password.length < 6) return jsonError("Le mot de passe doit contenir au moins 6 caractères.");
    await db
      .update(users)
      .set({ passwordHash: await hashPassword(password), firstLogin: false })
      .where(eq(users.id, user.id));
    return Response.json({ ok: true });
  }

  return jsonError("Action inconnue.");
}
