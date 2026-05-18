import nodemailer, { Transporter } from "nodemailer";
import { prisma } from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/business";
import { decryptSecret } from "@/lib/crypto/secret";

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
  const isSSL = settings.smtpEncryption === "SSL";
  return nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: isSSL,
    auth: {
      user: settings.smtpUsername,
      pass: settings.smtpPassword,
    },
    connectionTimeout: 10000,
    tls: {
      rejectUnauthorized: false,
    },
  });
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
    console.error("SMTP connection test failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: `Connection failed: ${errorMessage}` };
  }
}

export async function sendTestEmail(toEmail: string, businessId?: number): Promise<EmailResult> {
  const settings = await getEmailSettings(businessId);
  if (!settings) {
    return { success: false, message: "SMTP settings not configured." };
  }

  if (!toEmail || !toEmail.includes("@")) {
    return { success: false, message: "Invalid recipient email address." };
  }

  try {
    const transporter = createTransporter(settings);
    const businessName = settings.smtpFromName || "Your Business";
    const emailHeaderLogoUrl = toAbsoluteEmailAssetUrl(settings.emailHeaderLogoUrl);

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

    await transporter.sendMail({
      from: `"${settings.smtpFromName}" <${settings.smtpFromEmail}>`,
      to: toEmail,
      subject: `Test Email from ${businessName}`,
      text: textContent,
      html: htmlContent,
    });

    return { success: true, message: `Test email sent to ${toEmail}.` };
  } catch (error) {
    console.error("Send test email failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: `Failed to send email: ${errorMessage}` };
  }
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  businessId?: number;
}

export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  const settings = await getEmailSettings(params.businessId);
  if (!settings) {
    return { success: false, message: "SMTP settings not configured." };
  }

  if (!params.to || !params.to.includes("@")) {
    return { success: false, message: "Invalid recipient email address." };
  }

  try {
    const transporter = createTransporter(settings);
    const businessName = settings.smtpFromName || "Your Business";
    const emailHeaderLogoUrl = toAbsoluteEmailAssetUrl(settings.emailHeaderLogoUrl);

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

    await transporter.sendMail({
      from: `"${settings.smtpFromName}" <${settings.smtpFromEmail}>`,
      to: params.to,
      subject: params.subject,
      text: params.text || params.html.replace(/<[^>]*>/g, ""),
      html: htmlContent,
    });

    return { success: true, message: "Email sent successfully." };
  } catch (error) {
    console.error("Send email failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: `Failed to send email: ${errorMessage}` };
  }
}

export async function isSmtpConfigured(businessId?: number): Promise<boolean> {
  const settings = await getEmailSettings(businessId);
  return !!(settings && settings.smtpHost && settings.smtpFromEmail);
}
