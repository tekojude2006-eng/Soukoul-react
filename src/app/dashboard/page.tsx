import { redirect } from "next/navigation";
import { DashboardApp } from "@/components/DashboardApp";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  return <DashboardApp user={user} />;
}
