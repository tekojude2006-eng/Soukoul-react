import { getSessionUser, jsonError } from "@/lib/auth";
import { getBootstrap } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Non authentifié.", 401);
  const data = await getBootstrap(user);
  return Response.json(data);
}
