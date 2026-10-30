import { redirect } from "next/navigation";
import { LoginView } from "@/components/LoginView";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return <LoginView />;
}
