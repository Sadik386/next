import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { signToken } from "@/lib/jwt";

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });
  if (!user) return { error: "Invalid email or password" };
  if (!user.isActive) return { error: "Account deactivated" };
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) return { error: "Invalid email or password" };
  const token = await signToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name,
  });
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role.name },
  };
}
