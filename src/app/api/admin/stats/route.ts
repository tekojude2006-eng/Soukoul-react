import { getSessionUser, jsonError } from "@/lib/auth";
import { getAdminStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Non authentifié.", 401);
  if (user.role !== "admin") return jsonError("Accès refusé.", 403);
  const stats = await getAdminStats();
  return Response.json(stats);
}
