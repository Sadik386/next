import { sendPlatformEmail } from "./platform-email.service";

const INVITE_TOKEN_EXPIRY_HOURS = 24;

export interface CreateInviteTokenResult {
  success: boolean;
  token?: string;
  error?: string;
}

export async function createInviteToken(userId: number, businessId: number): Promise<CreateInviteTokenResult> {
  const { randomBytes } = await import("crypto");
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  const { prisma } = await import("@/lib/prisma");
  
  await prisma.emailVerificationToken.deleteMany({
    where: { userId, businessId: businessId || null },
  });

  await prisma.emailVerificationToken.create({
    data: { userId, businessId, token, expiresAt },
  });

  return { success: true, token };
}

export function buildInviteEmailHtml(params: {
  recipientName: string;
  inviterName: string;
  businessName: string;
  roleLabel: string;
  inviteUrl: string;
  expiryHours: number;
  year: number;
}): string {
  const { recipientName, inviterName, businessName, roleLabel, inviteUrl, expiryHours, year } = params;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've Been Invited to ${businessName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);">
          <tr>
            <td style="background-color: #C4973A; padding: 32px 32px 28px; text-align: center;">
              <span style="display: inline-block; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">ACUITY COMMERCE</span>
              <h1 style="margin: 16px 0 0; font-size: 22px; font-weight: 700; color: #ffffff; text-align: center;">You've Been Invited!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 32px 24px;">
              <p style="margin: 0 0 8px; font-size: 15px; color: #1a1a1a; font-weight: 600;">Hi ${recipientName},</p>
              <p style="margin: 0 0 20px; font-size: 14px; color: #4b5563; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join <strong style="color: #C4973A;">${businessName}</strong> on <strong style="color: #C4973A;">Acuity Commerce</strong>.
              </p>
              <p style="margin: 0 0 20px; font-size: 14px; color: #4b5563; line-height: 1.6;">
                You will be added as: <strong>${roleLabel}</strong>
              </p>

              <div style="text-align: center; margin: 0 0 28px;">
                <a href="${inviteUrl}"
                   style="display: inline-block; padding: 14px 32px; background-color: #C4973A; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.15);">
                  Accept Invitation
                </a>
              </div>

              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
                <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Or copy and paste this link into your browser:</p>
                <a href="${inviteUrl}" style="font-size: 12px; color: #2563eb; word-break: break-all; text-decoration: none;">${inviteUrl}</a>
              </div>

              <p style="margin: 0 0 12px; font-size: 13px; color: #6b7280;">
                <strong>Important:</strong> This invitation link expires in <strong>${expiryHours} hours</strong> for security reasons.
              </p>
              <p style="margin: 0; font-size: 13px; color: #9ca3af;">
                If you did not expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 32px; border-top: 1px solid #f3f4f6;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.6;">
                This is an automated message from <strong style="color: #C4973A;">DokanDar</strong>.<br>
                Please do not reply to this email.
              </p>
              <p style="margin: 8px 0 0; font-size: 11px; color: #d1d5db; text-align: center;">
                © ${year} DokanDar. All rights reserved.
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

export async function sendInviteEmail(
  email: string,
  recipientName: string,
  inviterName: string,
  businessName: string,
  roleLabel: string,
  token: string,
  baseUrl: string
): Promise<{ success: boolean; error?: string }> {
  const inviteUrl = `${baseUrl}/invite/accept?token=${token}`;

  const html = buildInviteEmailHtml({
    recipientName,
    inviterName,
    businessName,
    roleLabel,
    inviteUrl,
    expiryHours: INVITE_TOKEN_EXPIRY_HOURS,
    year: new Date().getFullYear(),
  });

  const result = await sendPlatformEmail({
    to: email,
    subject: `You've been invited to ${businessName} on DokanDar`,
    html,
  });

  return { success: result.success, error: result.success ? undefined : result.message };
}