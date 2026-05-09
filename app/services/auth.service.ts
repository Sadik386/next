import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword } from "@/lib/password";
import { signToken } from "@/lib/jwt";
import { randomBytes } from "crypto";

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });
  if (!user) {
    const userByUsername = await prisma.user.findFirst({
      where: { username: email },
      include: { role: true },
    });
    if (!userByUsername) return { error: "Invalid email/username or password" };
    if (!userByUsername.isActive) return { error: "Account deactivated" };
    const isValid = await verifyPassword(password, userByUsername.password);
    if (!isValid) return { error: "Invalid email/username or password" };
    const token = await signToken({
      id: userByUsername.id,
      name: userByUsername.name,
      username: userByUsername.username || undefined,
      email: userByUsername.email,
      role: userByUsername.role.name,
    });
    return {
      token,
      user: { id: userByUsername.id, name: userByUsername.name, email: userByUsername.email, role: userByUsername.role.name },
    };
  }
  if (!user.isActive) return { error: "Account deactivated" };
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) return { error: "Invalid email or password" };
  const token = await signToken({
    id: user.id,
    name: user.name,
    username: user.username || undefined,
    email: user.email,
    role: user.role.name,
  });
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role.name },
  };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: true, message: "Reset link sent" };
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  console.log(`[DEV] Password reset for ${email}: http://localhost:3000/reset-password?token=${token}`);

  return { success: true, message: "Reset link sent", devToken: token };
}

export async function resetPassword(token: string, newPassword: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) {
    return { error: "Invalid token" };
  }

  if (resetToken.usedAt) {
    return { error: "Token already used" };
  }

  if (resetToken.expiresAt < new Date()) {
    return { error: "Token expired" };
  }

  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { password: hashedPassword },
  });

  await prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: { usedAt: new Date() },
  });

  return { success: true };
}