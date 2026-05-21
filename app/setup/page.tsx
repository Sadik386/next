import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";
import { getSetupStatus } from "@/services/setup.service";
import SetupPageClient from "./SetupPageClient";

export default async function SetupPage() {
  const status = await getSetupStatus();

  if (status.isComplete) {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (token) {
      const payload = await verifyToken(token);
      if (payload) redirect("/dashboard");
    }

    redirect("/login");
  }

  return <SetupPageClient />;
}
