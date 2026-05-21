import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isCloud } from "@/lib/config/app-mode";
import { verifyToken } from "@/lib/jwt";
import { getPlatformAdminUser } from "@/lib/platform-auth";
import PlatformShell from "./PlatformShell";

export default async function PlatformLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!isCloud) {
    redirect("/dashboard");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) {
    redirect("/login");
  }

  const payload = await verifyToken(token);
  if (!payload) {
    redirect("/login");
  }

  const platformUser = await getPlatformAdminUser(payload);
  if (!platformUser) {
    redirect("/dashboard");
  }

  return <PlatformShell initialUser={platformUser}>{children}</PlatformShell>;
}
