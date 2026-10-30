import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { classes, users } from "@/db/schema";
import type { Role, SessionUser } from "@/lib/types";
import { ensureSeeded } from "@/db/seed";
import { hashPassword, verifyPassword } from "@/lib/password";

export { hashPassword, verifyPassword };

const COOKIE = "soukoul_token";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "soukoul-university-secret-key-please-change",
);

type TokenPayload = {
  uid: number;
  role: Role;
};

export async function signSession(payload: TokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function readSession(): Promise<TokenPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const uid = Number(payload.uid);
    const role = payload.role as Role;
    if (!uid || !role) return null;
    return { uid, role };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function resolveIdentifier(identifier: string) {
  const raw = identifier.trim().toLowerCase();
  if (!raw) return null;
  if (raw.includes("@")) {
    const [found] = await db.select().from(users).where(eq(users.email, raw)).limit(1);
    return found ?? null;
  }
  const candidates = [`${raw}@eleve.sn`, `${raw}@ecole.sn`];
  const found = await db.select().from(users).where(inArray(users.email, candidates)).limit(1);
  return found[0] ?? null;
}

export async function toSessionUser(user: typeof users.$inferSelect): Promise<SessionUser> {
  let className: string | null = null;
  if (user.classId) {
    const [cls] = await db.select().from(classes).where(eq(classes.id, user.classId)).limit(1);
    className = cls?.name ?? null;
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    firstLogin: user.firstLogin,
    phone: user.phone,
    subject: user.subject,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    classId: user.classId,
    className,
  };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  await ensureSeeded();
  const session = await readSession();
  if (!session) return null;
  const [user] = await db.select().from(users).where(eq(users.id, session.uid)).limit(1);
  if (!user) return null;
  return toSessionUser(user);
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
