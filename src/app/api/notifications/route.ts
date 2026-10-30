import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, pushSubscriptions } from "@/db/schema";
import { getSessionUser, jsonError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH() {
  const user = await getSessionUser();
  if (!user) return jsonError("Non authentifié.", 401);
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));
  return Response.json({ ok: true });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Non authentifié.", 401);
  const body = (await req.json()) as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  if (!body.endpoint) return jsonError("Endpoint manquant.");
  await db.insert(pushSubscriptions).values({
    userId: user.id,
    endpoint: body.endpoint,
    p256dh: body.keys?.p256dh ?? null,
    auth: body.keys?.auth ?? null,
  });
  return Response.json({ ok: true });
}
