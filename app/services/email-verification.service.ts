import { prisma } from "@/lib/prisma";
import { sendPlatformEmail } from "./platform-email.service";
import { BUSINESS_MEMBER_STATUS } from "@/constants/business-member-status";
import { randomBytes } from "crypto";

const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

export interface CreateVerificationTokenResult {
  success: boolean;
  token?: string;
  error?: string;
}

export async function createEmailVerificationToken(userId: number, userEmail: string, businessId?: number): Promise<CreateVerificationTokenResult> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.emailVerificationToken.deleteMany({ where: businessId ? { userId, businessId } : { userId } });

  await prisma.emailVerificationToken.create({
    data: { userId, businessId, token, expiresAt },
  });

  return { success: true, token };
}

export function buildVerificationEmailHtml(params: {
  recipientName: string;
  businessName: string;
  verifyUrl: string;
  expiryHours: number;
  appUrl: string;
  year: number;
}): string {
  const { recipientName, businessName, verifyUrl, expiryHours, appUrl, year } = params;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Accoraze Account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background-color: #C4973A; padding: 32px 32px 28px; text-align: center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center;">
                    <span style="display: inline-block; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">ACCORAZE</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin: 16px 0 0; font-size: 22px; font-weight: 700; color: #ffffff; text-align: center;">Verify Your Email Address</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 36px 32px 24px;">
              <p style="margin: 0 0 8px; font-size: 15px; color: #1a1a1a; font-weight: 600;">Hi ${recipientName},</p>
              <p style="margin: 0 0 20px; font-size: 14px; color: #4b5563; line-height: 1.6;">
                Welcome to <strong style="color: #C4973A;">Accoraze</strong>! Your business workspace <strong>${businessName}</strong> is ready to use.
              </p>
              <p style="margin: 0 0 28px; font-size: 14px; color: #4b5563; line-height: 1.6;">
                Please verify your email address to activate your account and access your workspace.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 0 0 28px;">
                <a href="${verifyUrl}"
                   style="display: inline-block; padding: 14px 32px; background-color: #C4973A; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.15);">
                  Verify Email Address
                </a>
              </div>

              <!-- Plain link fallback -->
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
                <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Or copy and paste this link into your browser:</p>
                <a href="${verifyUrl}" style="font-size: 12px; color: #2563eb; word-break: break-all; text-decoration: none;">${verifyUrl}</a>
              </div>

              <!-- Expiry notice -->
              <p style="margin: 0 0 12px; font-size: 13px; color: #6b7280;">
                <strong>Important:</strong> This link expires in <strong>${expiryHours} hours</strong> for security reasons.
              </p>
              <p style="margin: 0; font-size: 13px; color: #9ca3af;">
                If you did not create an Accoraze account, you can safely ignore this email. No action is required.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 32px; border-top: 1px solid #f3f4f6;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.6;">
                This is an automated message from <strong style="color: #C4973A;">Accoraze</strong>.<br>
                Please do not reply to this email.
              </p>
              <p style="margin: 8px 0 0; font-size: 11px; color: #d1d5db; text-align: center;">
                © ${year} Accoraze. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildForgotPasswordEmailHtml(params: {
  recipientName: string;
  resetUrl: string;
  expiryMinutes: number;
  year: number;
}): string {
  const { recipientName, resetUrl, expiryMinutes, year } = params;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Accoraze Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1a1a2e; padding: 32px 32px 28px; text-align: center;">
              <span style="display: inline-block; font-size: 22px; font-weight: 700; color: #C4973A; letter-spacing: 0.5px;">ACCORAZE</span>
              <h1 style="margin: 16px 0 0; font-size: 22px; font-weight: 700; color: #ffffff; text-align: center;">Reset Your Password</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 36px 32px 24px;">
              <p style="margin: 0 0 8px; font-size: 15px; color: #1a1a1a; font-weight: 600;">Hi ${recipientName},</p>
              <p style="margin: 0 0 20px; font-size: 14px; color: #4b5563; line-height: 1.6;">
                We received a request to reset the password for your Accoraze account.
                Click the button below to set a new password.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 0 0 28px;">
                <a href="${resetUrl}"
                   style="display: inline-block; padding: 14px 32px; background-color: #C4973A; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.15);">
                  Reset Password
                </a>
              </div>

              <!-- Plain link fallback -->
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
                <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Or copy and paste this link into your browser:</p>
                <a href="${resetUrl}" style="font-size: 12px; color: #2563eb; word-break: break-all; text-decoration: none;">${resetUrl}</a>
              </div>

              <!-- Expiry notice -->
              <p style="margin: 0 0 12px; font-size: 13px; color: #6b7280;">
                <strong>Important:</strong> This link expires in <strong>${expiryMinutes} minutes</strong> and can only be used once.
              </p>
              <p style="margin: 0; font-size: 13px; color: #9ca3af;">
                If you did not request a password reset, you can safely ignore this email. Your password will not be changed.
              </p>
            </td>
          </tr>
          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 16px;">
                <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.5; font-weight: 500;">
                  <strong>Security reminder:</strong> Accoraze staff will never ask for your password or ask you to download anything via email.
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 32px; border-top: 1px solid #f3f4f6;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.6;">
                This is an automated message from <strong style="color: #C4973A;">Accoraze</strong>.<br>
                Please do not reply to this email.
              </p>
              <p style="margin: 8px 0 0; font-size: 11px; color: #d1d5db; text-align: center;">
                © ${year} Accoraze. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  businessName: string,
  token: string,
  baseUrl: string
): Promise<{ success: boolean; error?: string }> {
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

  const html = buildVerificationEmailHtml({
    recipientName: name,
    businessName,
    verifyUrl,
    expiryHours: VERIFICATION_TOKEN_EXPIRY_HOURS,
    appUrl: baseUrl,
    year: new Date().getFullYear(),
  });

  const result = await sendPlatformEmail({
    to: email,
    subject: "Verify Your Accoraze Account",
    html,
  });

  return { success: result.success, error: result.success ? undefined : result.message };
}

export async function sendForgotPasswordEmail(
  email: string,
  name: string,
  token: string,
  baseUrl: string
): Promise<{ success: boolean; error?: string }> {
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  const RESET_EXPIRY_MINUTES = 15;

  const html = buildForgotPasswordEmailHtml({
    recipientName: name,
    resetUrl,
    expiryMinutes: RESET_EXPIRY_MINUTES,
    year: new Date().getFullYear(),
  });

  const result = await sendPlatformEmail({
    to: email,
    subject: "Reset Your Accoraze Password",
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
    await prisma.emailVerificationToken.delete({ where: { id: verificationToken.id } });
    return { success: false, error: "This verification link has expired. Please request a new one." };
  }

  const userId = verificationToken.userId;
  const businessId = verificationToken.businessId;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });

    if (businessId) {
      const pendingMembership = await tx.businessMember.findFirst({
        where: {
          userId,
          businessId,
          status: BUSINESS_MEMBER_STATUS.PENDING,
        },
      });

      if (pendingMembership) {
        await tx.businessMember.update({
          where: { id: pendingMembership.id },
          data: { status: BUSINESS_MEMBER_STATUS.ACTIVE },
        });
      }
    }

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