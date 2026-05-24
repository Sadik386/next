import nodemailer, { Transporter } from "nodemailer";
import { prisma } from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/business";
import { decryptSecret } from "@/lib/crypto/secret";
import { USAGE_KEYS } from "@/lib/pricing";
import { guardEmailSend } from "@/lib/subscription-guard";
import { incrementUsageSafely } from "@/lib/usage-service";
import {
  getSafeSmtpErrorMessage,
  getSmtpTransportSecurity,
  isValidEmailAddress,
  logSafeSmtpError,
} from "@/lib/email-boundary";

export interface EmailSettings {
  smtpProvider: string;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpEncryption: string;
  smtpFromEmail: string;
  smtpFromName: string;
  smtpReplyTo: string;
  supportEmail: string;
  emailFooterText: string;
  companyAddressFooter: string;
  emailOrderConfirmationEnabled: boolean;
  emailInvoiceEnabled: boolean;
  emailPasswordResetEnabled: boolean;
  emailUserRegistrationEnabled: boolean;
  emailLowStockEnabled: boolean;
  emailDailySummaryEnabled: boolean;
  emailHeaderLogoUrl: string | null;
}

export interface EmailResult {
  success: boolean;
  message: string;
}

function toAbsoluteEmailAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^(https?:|data:|cid:)/i.test(url)) return url;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!appUrl) return url;

  try {
    return new URL(url, appUrl).toString();
  } catch {
    return url;
  }
}

export async function getEmailSettings(businessId?: number): Promise<EmailSettings | null> {
  const bid = businessId || getCurrentBusinessId();
  const setting = await prisma.setting.findUnique({
    where: { businessId: bid },
    select: {
      smtpProvider: true,
      smtpHost: true,
      smtpPort: true,
      smtpUsername: true,
      smtpPassword: true,
      smtpEncryption: true,
      smtpFromEmail: true,
      smtpFromName: true,
      smtpReplyTo: true,
      supportEmail: true,
      emailFooterText: true,
      companyAddressFooter: true,
      emailOrderConfirmationEnabled: true,
      emailInvoiceEnabled: true,
      emailPasswordResetEnabled: true,
      emailUserRegistrationEnabled: true,
      emailLowStockEnabled: true,
      emailDailySummaryEnabled: true,
      emailHeaderLogoUrl: true,
    },
  });

  if (!setting || !setting.smtpHost || !setting.smtpUsername) {
    return null;
  }

  return {
    smtpProvider: setting.smtpProvider || "SMTP",
    smtpHost: setting.smtpHost,
    smtpPort: setting.smtpPort || 587,
    smtpUsername: setting.smtpUsername,
    smtpPassword: decryptSecret(setting.smtpPassword || ""),
    smtpEncryption: setting.smtpEncryption || "TLS",
    smtpFromEmail: setting.smtpFromEmail || "",
    smtpFromName: setting.smtpFromName || "",
    smtpReplyTo: setting.smtpReplyTo || "",
    supportEmail: setting.supportEmail || "",
    emailFooterText: setting.emailFooterText || "",
    companyAddressFooter: setting.companyAddressFooter || "",
    emailOrderConfirmationEnabled: setting.emailOrderConfirmationEnabled,
    emailInvoiceEnabled: setting.emailInvoiceEnabled,
    emailPasswordResetEnabled: setting.emailPasswordResetEnabled,
    emailUserRegistrationEnabled: setting.emailUserRegistrationEnabled,
    emailLowStockEnabled: setting.emailLowStockEnabled,
    emailDailySummaryEnabled: setting.emailDailySummaryEnabled,
    emailHeaderLogoUrl: setting.emailHeaderLogoUrl,
  };
}

function createTransporter(settings: EmailSettings): Transporter {
  const security = getSmtpTransportSecurity(settings.smtpPort, settings.smtpEncryption);

  return nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    ...security,
    auth: {
      user: settings.smtpUsername,
      pass: settings.smtpPassword,
    },
    connectionTimeout: 10000,
  });
}

function isBusinessSmtpReady(settings: EmailSettings): boolean {
  return Boolean(
    settings.smtpHost &&
    settings.smtpUsername &&
    settings.smtpPassword &&
    settings.smtpFromEmail
  );
}

export async function testSmtpConnection(businessId?: number): Promise<EmailResult> {
  const settings = await getEmailSettings(businessId);
  if (!settings) {
    return { success: false, message: "SMTP settings not configured." };
  }

  if (!settings.smtpHost || !settings.smtpUsername) {
    return { success: false, message: "SMTP host or username is missing." };
  }

  if (!settings.smtpPassword) {
    return { success: false, message: "SMTP password is missing." };
  }

  try {
    const transporter = createTransporter(settings);
    await transporter.verify();
    return { success: true, message: "SMTP connection successful." };
  } catch (error) {
    logSafeSmtpError("Business SMTP connection test failed:", error);
    return { success: false, message: getSafeSmtpErrorMessage(error, "test") };
  }
}

export async function sendTestEmail(toEmail: string, businessId?: number): Promise<EmailResult> {
  const settings = await getEmailSettings(businessId);
  if (!settings) {
    return { success: false, message: "SMTP settings not configured." };
  }

  if (!isValidEmailAddress(toEmail)) {
    return { success: false, message: "Invalid recipient email address." };
  }

  if (!isBusinessSmtpReady(settings)) {
    return { success: false, message: "Business SMTP is not fully configured." };
  }

  try {
    const transporter = createTransporter(settings);
    const businessName = settings.smtpFromName || "Your Business";
    const emailHeaderLogoUrl = toAbsoluteEmailAssetUrl(settings.emailHeaderLogoUrl);
    const recipient = toEmail.trim();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px;">
          ${emailHeaderLogoUrl ? `<img src="${emailHeaderLogoUrl}" alt="${businessName}" style="max-height: 60px;" />` : ""}
          <h2 style="color: #333; margin-top: 15px;">${businessName}</h2>
        </div>
        <div style="padding: 20px;">
          <h3 style="color: #333;">Test Email</h3>
          <p style="color: #666; line-height: 1.6;">
            This is a test email to verify your SMTP configuration is working correctly.
          </p>
          <p style="color: #666; line-height: 1.6;">
            If you received this email, your email settings are configured properly.
          </p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #999; border-radius: 0 0 8px 8px;">
          ${settings.emailFooterText ? `<p>${settings.emailFooterText}</p>` : ""}
          ${settings.companyAddressFooter ? `<p>${settings.companyAddressFooter}</p>` : ""}
          <p>© ${new Date().getFullYear()} ${businessName}</p>
        </div>
      </div>
    `;

    const textContent = `Test Email\n\nThis is a test email to verify your SMTP configuration is working correctly.\n\nIf you received this email, your email settings are configured properly.\n\n© ${new Date().getFullYear()} ${businessName}`;

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${settings.smtpFromName}" <${settings.smtpFromEmail}>`,
      to: recipient,
      subject: `Test Email from ${businessName}`,
      text: textContent,
      html: htmlContent,
    };

    if (settings.smtpReplyTo) {
      mailOptions.replyTo = settings.smtpReplyTo;
    }

    await transporter.sendMail(mailOptions);

    return { success: true, message: `Test email sent to ${recipient}.` };
  } catch (error) {
    logSafeSmtpError("Business test email send failed:", error);
    return { success: false, message: getSafeSmtpErrorMessage(error, "test") };
  }
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  businessId?: number;
  attachments?: EmailAttachment[];
}

export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  const businessId = params.businessId ?? getCurrentBusinessId();
  const settings = await getEmailSettings(businessId);
  if (!settings) {
    return { success: false, message: "SMTP settings not configured." };
  }

  if (!isBusinessSmtpReady(settings)) {
    return { success: false, message: "Business SMTP is not fully configured." };
  }

  if (!isValidEmailAddress(params.to)) {
    return { success: false, message: "Invalid recipient email address." };
  }

  const guard = await guardEmailSend(businessId);
  if (!guard.allowed) {
    return {
      success: false,
      message: guard.reason ?? "Email quota exceeded for your current plan.",
    };
  }

  try {
    const transporter = createTransporter(settings);
    const businessName = settings.smtpFromName || "Your Business";
    const emailHeaderLogoUrl = toAbsoluteEmailAssetUrl(settings.emailHeaderLogoUrl);
    const recipient = params.to.trim();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px;">
          ${emailHeaderLogoUrl ? `<img src="${emailHeaderLogoUrl}" alt="${businessName}" style="max-height: 60px;" />` : ""}
          <h2 style="color: #333; margin-top: 15px;">${businessName}</h2>
        </div>
        <div style="padding: 20px;">
          ${params.html}
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #999; border-radius: 0 0 8px 8px;">
          ${settings.emailFooterText ? `<p>${settings.emailFooterText}</p>` : ""}
          ${settings.companyAddressFooter ? `<p>${settings.companyAddressFooter}</p>` : ""}
          <p>© ${new Date().getFullYear()} ${businessName}</p>
        </div>
      </div>
    `;

const mailOptions: nodemailer.SendMailOptions = {
      from: `"${settings.smtpFromName}" <${settings.smtpFromEmail}>`,
      to: recipient,
      subject: params.subject,
      text: params.text || params.html.replace(/<[^>]*>/g, ""),
      html: htmlContent,
    };

    if (settings.smtpReplyTo) {
      mailOptions.replyTo = settings.smtpReplyTo;
    }

    if (params.attachments && params.attachments.length > 0) {
      mailOptions.attachments = params.attachments.map((att) => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
      }));
    }

    await transporter.sendMail(mailOptions);

    await incrementUsageSafely(businessId, USAGE_KEYS.EMAILS_SENT);

    return { success: true, message: "Email sent successfully." };
  } catch (error) {
    logSafeSmtpError("Business email send failed:", error);
    return { success: false, message: getSafeSmtpErrorMessage(error, "send") };
  }
}

export async function isSmtpConfigured(businessId?: number): Promise<boolean> {
  const settings = await getEmailSettings(businessId);
  return !!(settings && isBusinessSmtpReady(settings));
}
