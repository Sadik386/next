import { prisma } from "@/lib/prisma";
import { sendPlatformEmail } from "./platform-email.service";
import { randomBytes } from "crypto";

const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

export interface CreateVerificationTokenResult {
  success: boolean;
  token?: string;
  error?: string;
}

export async function createEmailVerificationToken(userId: number, userEmail: string): Promise<CreateVerificationTokenResult> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.emailVerificationToken.deleteMany({ where: { userId } });

  await prisma.emailVerificationToken.create({
    data: { userId, token, expiresAt },
  });

  return { success: true, token };
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  businessName: string,
  token: string,
  baseUrl: string
): Promise<{ success: boolean; error?: string }> {
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #C4973A; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="color: #fff; margin: 0;">Verify Your Email</h2>
      </div>
      <div style="padding: 24px 20px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="color: #333; line-height: 1.6; margin: 0 0 16px;">
          Hi ${name},
        </p>
        <p style="color: #333; line-height: 1.6; margin: 0 0 16px;">
          Your business workspace <strong>${businessName}</strong> has been created on Accoraze.
        </p>
        <p style="color: #333; line-height: 1.6; margin: 0 0 24px;">
          Please verify your email address to activate your account:
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #C4973A; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #666; font-size: 13px; line-height: 1.6; margin: 0 0 16px;">
          Or copy and paste this link into your browser:
        </p>
        <p style="color: #3b82f6; font-size: 12px; word-break: break-all; margin: 0 0 24px;">
          ${verifyUrl}
        </p>
        <p style="color: #666; font-size: 13px; line-height: 1.6; margin: 0 0 8px;">
          This link will expire in ${VERIFICATION_TOKEN_EXPIRY_HOURS} hours.
        </p>
        <p style="color: #666; font-size: 13px; line-height: 1.6; margin: 0;">
          If you did not create an account, you can safely ignore this email.
        </p>
      </div>
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #999; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="margin: 0;">© ${new Date().getFullYear()} Accoraze Platform</p>
      </div>
    </div>
  `;

  const result = await sendPlatformEmail({
    to: email,
    subject: "Verify Your Accoraze Account",
    html,
  });

  return { success: result.success, error: result.success ? undefined : result.message };
}

export async function verifyEmail(token: string): Promise<{ success: boolean; error: string }> {
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!verificationToken) {
    return { success: false, error: "Invalid verification link." };
  }

  if (verificationToken.expiresAt < new Date()) {
    return { success: false, error: "This verification link has expired. Please request a new one." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerifiedAt: new Date() },
    });
    await tx.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });
  });

  return { success: true, error: "" };
}

export async function isEmailVerified(userId: number): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerifiedAt: true },
  });
  return user?.emailVerifiedAt !== null && user?.emailVerifiedAt !== undefined;
}

export async function getUserVerificationStatus(userId: number): Promise<{ verified: boolean; email: string } | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerifiedAt: true },
  });
  if (!user) return null;
  return { verified: user.emailVerifiedAt !== null && user.emailVerifiedAt !== undefined, email: user.email };
}

export async function resendVerificationEmail(
  email: string
): Promise<{ success: boolean; message: string }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: true, message: "If an unverified account exists with this email, a verification link has been sent." };
  }

  if (user.emailVerifiedAt) {
    return { success: true, message: "This email is already verified. You can sign in." };
  }

  const businessMember = await prisma.businessMember.findFirst({
    where: { userId: user.id },
    include: { business: true },
  });
  const businessName = businessMember?.business?.name || "Your Business";

  const tokenResult = await createEmailVerificationToken(user.id, user.email);
  if (!tokenResult.success || !tokenResult.token) {
    return { success: false, message: "Failed to generate verification token." };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const emailResult = await sendVerificationEmail(user.email, user.name, businessName, tokenResult.token, baseUrl);

  if (!emailResult.success) {
    return { success: false, message: "Failed to send verification email. Please try again later." };
  }

  return { success: true, message: "Verification link sent. Please check your email." };
}