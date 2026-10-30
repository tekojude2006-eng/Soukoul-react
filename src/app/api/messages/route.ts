import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { messages, notifications } from "@/db/schema";
import { getSessionUser, jsonError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Non authentifié.", 401);

  const body = (await req.json()) as {
    toId?: number;
    content?: string;
    action?: "send" | "mark-read";
  };

  if (body.action === "mark-read") {
    await db.update(messages).set({ read: true }).where(eq(messages.toId, user.id));
    return Response.json({ ok: true });
  }

  const toId = Number(body.toId);
  const content = (body.content ?? "").trim();
  if (!toId || !content) {
    return jsonError("Destinataire et message requis.");
  }

  const [created] = await db
    .insert(messages)
    .values({
      fromId: user.id,
      toId,
      content,
      read: false,
    })
    .returning();

  await db.insert(notifications).values({
    userId: toId,
    type: "messages",
    title: `Message de ${user.name}`,
    body: content.slice(0, 90),
    tab: user.role === "teacher" ? "messages" : "classes",
    read: false,
  });

  return Response.json({ item: created });
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Non authentifié.", 401);
  const rows = await db
    .select()
    .from(messages)
    .where(or(eq(messages.toId, user.id), eq(messages.fromId, user.id)));
  return Response.json({ messages: rows });
}
