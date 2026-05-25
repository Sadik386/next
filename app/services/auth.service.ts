import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword } from "@/lib/password";
import { signToken } from "@/lib/jwt";
import {
  BusinessContextError,
  resolveBusinessContextForUser,
  setActiveBusinessContext,
} from "@/lib/business-context";
import { activeBusinessMemberStatusWhere } from "@/constants/business-member-status";
import type { Role, User } from "@prisma/client";
import { randomBytes } from "crypto";
import { sendForgotPasswordEmail } from "@/services/email-verification.service";

type LoginUser = User & { role: Role };
type LoginResult =
  | {
      token: string;
      user: {
        id: number;
        name: string;
        email: string;
        role: string;
        businessId: number;
        isFounder: boolean;
      };
      error?: never;
    }
  | {
      error: string;
      token?: never;
      user?: never;
    };

async function createLoginResult(user: LoginUser): Promise<LoginResult> {
  try {
    const businessContext = await resolveBusinessContextForUser({
      id: user.id,
      name: user.name,
      username: user.username || undefined,
      email: user.email,
      role: user.role.name,
      businessId: undefined,
    });

    const payload = {
      id: user.id,
      name: user.name,
      username: user.username || undefined,
      email: user.email,
      role: user.role.name,
      businessId: businessContext.businessId,
      isFounder: user.isFounder,
    };
    const token = await signToken(payload);
    setActiveBusinessContext({
      ...businessContext,
      user: payload,
      role: payload.role,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        businessId: businessContext.businessId,
        isFounder: user.isFounder,
      },
    };
  } catch (error) {
    if (error instanceof BusinessContextError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function loginUser(email: string, password: string): Promise<LoginResult> {
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
    const byUsernameHasMembership = await prisma.businessMember.findFirst({
      where: {
        userId: userByUsername.id,
        status: activeBusinessMemberStatusWhere(),
        business: { isActive: true },
      },
    });
    if (!byUsernameHasMembership) {
      return { error: "Your account is not assigned to an active business." };
    }
    if (!userByUsername.isActive) return { error: "Account deactivated" };
    if (!userByUsername.emailVerifiedAt) return { error: "Please verify your email before signing in. Check your inbox for a verification link." };
    const isValid = await verifyPassword(password, userByUsername.password);
    if (!isValid) return { error: "Invalid email/username or password" };
    return await createLoginResult(userByUsername);
  }
const hasMembership = await prisma.businessMember.findFirst({
      where: {
        userId: user.id,
        status: activeBusinessMemberStatusWhere(),
        business: { isActive: true },
      },
    });
    if (!hasMembership) {
      return { error: "Your account is not assigned to an active business." };
    }
    if (!user.isActive) return { error: "Account deactivated" };
    if (!user.emailVerifiedAt) return { error: "Please verify your email before signing in. Check your inbox for a verification link." };
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) return { error: "Invalid email or password" };
    return await createLoginResult(user);
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await sendForgotPasswordEmail(user.email, user.name || "User", token, baseUrl);

  return { success: true, message: "Reset link sent" };
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
