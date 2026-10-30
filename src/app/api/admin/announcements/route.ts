import { eq } from "drizzle-orm";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { getSessionUser, jsonError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Non authentifié.", 401);
  if (user.role !== "admin") return jsonError("Accès refusé.", 403);

  const body = (await req.json()) as { title?: string; content?: string };
  const title = (body.title ?? "").trim();
  const content = (body.content ?? "").trim();
  if (!title || !content) {
    return jsonError("Titre et contenu requis.");
  }

  const [created] = await db
    .insert(announcements)
    .values({
      title,
      content,
      authorId: user.id,
    })
    .returning();

  return Response.json({ item: created });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Non authentifié.", 401);
  if (user.role !== "admin") return jsonError("Accès refusé.", 403);

  const { id } = (await req.json()) as { id: number };
  await db.delete(announcements).where(eq(announcements.id, Number(id)));
  return Response.json({ ok: true });
}
