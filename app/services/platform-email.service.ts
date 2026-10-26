import nodemailer, { Transporter } from "nodemailer";
import { prisma } from "@/lib/prisma";
import { encryptSecret, decryptSecret } from "@/lib/crypto/secret";
import {
  getSafeSmtpErrorMessage,
  getSmtpTransportSecurity,
  isValidEmailAddress,
  logSafeSmtpError,
} from "@/lib/email-boundary";

export interface PlatformEmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  smtpFromEmail: string;
  smtpFromName: string;
  smtpReplyTo?: string;
}

export interface PlatformEmailDbConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
}

export interface PlatformEmailResult {
  success: boolean;
  message: string;
}

export interface PlatformEmailSafeConfig {
  configured: boolean;
  hasPassword: boolean;
  host: string | null;
  port: number | null;
  secure: boolean | null;
  user: string | null;
  fromEmail: string | null;
  fromName: string;
  replyTo: string | null;
  source: "database" | "environment" | null;
}

async function getDbEmailConfig(): Promise<PlatformEmailDbConfig | null> {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: "smtp_config" },
    });

    if (!setting?.value) {
      return null;
    }

    const config = JSON.parse(setting.value) as PlatformEmailDbConfig;
    if (!config.host || !config.user || !config.fromEmail) {
      return null;
    }

    return {
      ...config,
      pass: decryptSecret(config.pass || ""),
    };
  } catch {
    console.error("Failed to load DB email config.");
    return null;
  }
}

function getEnvEmailConfig(): PlatformEmailConfig | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM_EMAIL;

  if (!host || !user || !pass || !fromEmail) {
    return null;
  }

  return {
    smtpHost: host,
    smtpPort: parseInt(process.env.SMTP_PORT || "587", 10),
    smtpSecure: process.env.SMTP_SECURE === "true",
    smtpUser: user,
    smtpPass: pass,
    smtpFromEmail: fromEmail,
    smtpFromName: process.env.SMTP_FROM_NAME || "Acuity Commerce Platform",
    smtpReplyTo: process.env.SMTP_REPLY_TO,
  };
}

async function getPlatformEmailConfig(): Promise<PlatformEmailConfig | null> {
  const dbConfig = await getDbEmailConfig();
  if (dbConfig) {
    const port = dbConfig.port || 587;
    const security = getSmtpTransportSecurity(port, dbConfig.secure);

    return {
      smtpHost: dbConfig.host,
      smtpPort: port,
      smtpSecure: security.secure,
      smtpUser: dbConfig.user,
      smtpPass: dbConfig.pass,
      smtpFromEmail: dbConfig.fromEmail,
      smtpFromName: dbConfig.fromName,
      smtpReplyTo: dbConfig.replyTo,
    };
  }

  const envConfig = getEnvEmailConfig();
  if (envConfig) {
    const port = envConfig.smtpPort || 587;
    const security = getSmtpTransportSecurity(port, envConfig.smtpSecure);

    return {
      ...envConfig,
      smtpSecure: security.secure,
    };
  }

  return null;
}

function createPlatformTransporter(config: PlatformEmailConfig): Transporter {
  const security = getSmtpTransportSecurity(config.smtpPort, config.smtpSecure);

  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    ...security,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
    connectionTimeout: 10000,
  });
}

export async function isPlatformEmailConfigured(): Promise<boolean> {
  const config = await getPlatformEmailConfig();
  return config !== null;
}

export async function getPlatformEmailSafeConfig(): Promise<PlatformEmailSafeConfig> {
  const dbConfig = await getDbEmailConfig();
  
  if (dbConfig) {
    const security = getSmtpTransportSecurity(dbConfig.port, dbConfig.secure);

    return {
      configured: true,
      hasPassword: !!dbConfig.pass,
      host: dbConfig.host,
      port: dbConfig.port,
      secure: security.secure,
      user: dbConfig.user,
      fromEmail: dbConfig.fromEmail,
      fromName: dbConfig.fromName,
      replyTo: dbConfig.replyTo || null,
      source: "database",
    };
  }

  const envHost = process.env.SMTP_HOST || "";
  const envFromEmail = process.env.SMTP_FROM_EMAIL || "";
  const envUser = process.env.SMTP_USER || "";
  const envConfigured = !!(envHost && envUser && envFromEmail);
  const envPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const envSecurity = getSmtpTransportSecurity(envPort, process.env.SMTP_SECURE === "true");

  return {
    configured: envConfigured,
    hasPassword: !!process.env.SMTP_PASS,
    host: envConfigured ? envHost : null,
    port: envConfigured ? envPort : null,
    secure: envConfigured ? envSecurity.secure : null,
    user: envConfigured ? envUser : null,
    fromEmail: envConfigured ? envFromEmail : null,
    fromName: process.env.SMTP_FROM_NAME || "NextGen Cloud POS Platform",
    replyTo: process.env.SMTP_REPLY_TO || null,
    source: envConfigured ? "environment" : null,
  };
}

export async function savePlatformEmailConfig(config: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
}): Promise<PlatformEmailResult> {
  try {
    const port = Number(config.port) || 587;
    const security = getSmtpTransportSecurity(port, config.secure);

    const existingSetting = await prisma.platformSetting.findUnique({
      where: { key: "smtp_config" },
    });

    let existingPass = "";
    if (existingSetting?.value) {
      const existingConfig = JSON.parse(existingSetting.value) as PlatformEmailDbConfig;
      existingPass = existingConfig.pass || "";
    }

    if (!config.password && !existingPass) {
      return { success: false, message: "SMTP password is required." };
    }

    const encryptedPass = config.password ? encryptSecret(config.password) : existingPass;
    
    const dbConfig: PlatformEmailDbConfig = {
      host: config.host,
      port,
      secure: security.secure,
      user: config.user,
      pass: encryptedPass,
      fromEmail: config.fromEmail,
      fromName: config.fromName,
      replyTo: config.replyTo,
    };

    await prisma.platformSetting.upsert({
      where: { key: "smtp_config" },
      update: { value: JSON.stringify(dbConfig) },
      create: { key: "smtp_config", value: JSON.stringify(dbConfig) },
    });

    return { success: true, message: "SMTP configuration saved successfully." };
  } catch {
    console.error("Failed to save platform email config.");
    return { success: false, message: "Failed to save configuration." };
  }
}

export async function testPlatformSmtp(): Promise<PlatformEmailResult> {
  const config = await getPlatformEmailConfig();
  if (!config) {
    return { success: false, message: "Platform SMTP not configured. Add settings or check environment variables." };
  }

  if (!config.smtpHost || !config.smtpUser || !config.smtpPass || !config.smtpFromEmail) {
    return { success: false, message: "SMTP credentials are incomplete. Please check username/password." };
  }

  try {
    const transporter = createPlatformTransporter(config);
    await transporter.verify();
    return { success: true, message: "Platform SMTP connection successful." };
  } catch (error) {
    logSafeSmtpError("Platform SMTP connection test failed:", error);
    return { success: false, message: getSafeSmtpErrorMessage(error, "test") };
  }
}

interface SendPlatformEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendPlatformEmail(params: SendPlatformEmailParams): Promise<PlatformEmailResult> {
  const config = await getPlatformEmailConfig();
  if (!config) {
    return { success: false, message: "Platform SMTP not configured." };
  }

  if (!config.smtpHost || !config.smtpUser || !config.smtpPass || !config.smtpFromEmail) {
    return { success: false, message: "SMTP credentials are incomplete. Please check username/password." };
  }

  if (!isValidEmailAddress(params.to)) {
    return { success: false, message: "Invalid recipient email address." };
  }

  try {
    const transporter = createPlatformTransporter(config);
    const recipient = params.to.trim();

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${config.smtpFromName}" <${config.smtpFromEmail}>`,
      to: recipient,
      subject: params.subject,
      text: params.text || params.html.replace(/<[^>]*>/g, ""),
      html: params.html,
    };

    if (config.smtpReplyTo) {
      mailOptions.replyTo = config.smtpReplyTo;
    }

    await transporter.sendMail(mailOptions);
    return { success: true, message: "Email sent successfully." };
  } catch (error) {
    logSafeSmtpError("Platform email send failed:", error);
    return { success: false, message: getSafeSmtpErrorMessage(error, "send") };
  }
}

export async function sendTestPlatformEmail(toEmail: string): Promise<PlatformEmailResult> {
  if (!isValidEmailAddress(toEmail)) {
    return { success: false, message: "Invalid recipient email address." };
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px;">
        <h2 style="color: #333; margin-top: 15px;">NextGen Cloud POS Platform</h2>
      </div>
      <div style="padding: 20px;">
        <h3 style="color: #333;">Test Email</h3>
        <p style="color: #666; line-height: 1.6;">
          This is a test email to verify your Platform SMTP configuration is working correctly.
        </p>
        <p style="color: #666; line-height: 1.6;">
          If you received this email, your platform email settings are configured properly.
        </p>
      </div>
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #999; border-radius: 0 0 8px 8px;">
        <p>© ${new Date().getFullYear()} NextGen Cloud POS Platform</p>
      </div>
    </div>
  `;

  return sendPlatformEmail({
    to: toEmail,
    subject: "Test Email from NextGen Cloud POS Platform",
    html: htmlContent,
  });
}

export async function sendSupportReplyEmail(
  toEmail: string,
  requestTitle: string,
  replyContent: string,
  businessName?: string
): Promise<PlatformEmailResult> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px;">
        <h2 style="color: #333; margin-top: 15px;">NextGen Cloud POS Support</h2>
      </div>
      <div style="padding: 20px;">
        <h3 style="color: #333;">Reply to Your Support Request</h3>
        <p style="color: #666; line-height: 1.6;">
          <strong>Request:</strong> ${requestTitle}
          ${businessName ? `<br/><strong>Business:</strong> ${businessName}` : ""}
        </p>
        <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="color: #333; line-height: 1.6; margin: 0;">${replyContent}</p>
        </div>
        <p style="color: #666; font-size: 13px; line-height: 1.6;">
          You can reply to this email or log in to your NextGen Cloud POS account to continue the conversation.
        </p>
      </div>
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #999; border-radius: 0 0 8px 8px;">
        <p>© ${new Date().getFullYear()} NextGen Cloud POS Platform</p>
      </div>
    </div>
  `;

  return sendPlatformEmail({
    to: toEmail,
    subject: `Re: ${requestTitle}`,
    html: htmlContent,
  });
}

export async function sendSystemNotificationEmail(
  toEmail: string,
  subject: string,
  message: string,
  severity: "info" | "warning" | "critical" = "info"
): Promise<PlatformEmailResult> {
  const severityColors = {
    info: "#3b82f6",
    warning: "#f59e0b",
    critical: "#ef4444",
  };

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: ${severityColors[severity]}; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="color: #fff; margin: 0;">System Notification</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #333; line-height: 1.6;">${message}</p>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          This is an automated notification from NextGen Cloud POS Platform.
        </p>
      </div>
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #999;">
        <p>© ${new Date().getFullYear()} NextGen Cloud POS Platform</p>
      </div>
    </div>
  `;

  return sendPlatformEmail({
    to: toEmail,
    subject: `[${severity.toUpperCase()}] ${subject}`,
    html: htmlContent,
  });
}

export async function sendSubscriptionEmail(
  toEmail: string,
  template: "welcome" | "cancellation" | "upgrade" | "downgrade" | "payment_failed",
  data: {
    businessName?: string;
    planName?: string;
    amount?: string;
    nextBillingDate?: string;
  }
): Promise<PlatformEmailResult> {
  const templates = {
    welcome: {
      subject: "Welcome to NextGen Cloud POS!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px;">
            <h2 style="color: #333; margin-top: 15px;">Welcome to NextGen Cloud POS!</h2>
          </div>
          <div style="padding: 20px;">
            <p style="color: #333; line-height: 1.6;">
              Thank you for joining NextGen Cloud POS! Your business <strong>${data.businessName || "account"}</strong> has been set up successfully.
            </p>
            <p style="color: #666; line-height: 1.6;">
              You can now start managing your inventory, customers, and sales with our platform.
            </p>
          </div>
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #999; border-radius: 0 0 8px 8px;">
            <p>© ${new Date().getFullYear()} NextGen Cloud POS Platform</p>
          </div>
        </div>
      `,
    },
    cancellation: {
      subject: "Your NextGen Cloud POS Subscription Has Been Cancelled",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px;">
            <h2 style="color: #333; margin-top: 15px;">Subscription Cancelled</h2>
          </div>
          <div style="padding: 20px;">
            <p style="color: #333; line-height: 1.6;">
              Your subscription for <strong>${data.businessName || "your business"}</strong> has been cancelled.
            </p>
            <p style="color: #666; line-height: 1.6;">
              You will retain access until the end of your billing period. If you change your mind, you can resubscribe anytime.
            </p>
          </div>
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #999; border-radius: 0 0 8px 8px;">
            <p>© ${new Date().getFullYear()} NextGen Cloud POS Platform</p>
          </div>
        </div>
      `,
    },
    upgrade: {
      subject: `You've Upgraded to ${data.planName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px;">
            <h2 style="color: #16a34a; margin-top: 15px;">Plan Upgraded!</h2>
          </div>
          <div style="padding: 20px;">
            <p style="color: #333; line-height: 1.6;">
              Congratulations! Your business <strong>${data.businessName || ""}</strong> has been upgraded to the <strong>${data.planName}</strong> plan.
            </p>
            <p style="color: #666; line-height: 1.6;">
              You now have access to additional features and resources.
            </p>
          </div>
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #999; border-radius: 0 0 8px 8px;">
            <p>© ${new Date().getFullYear()} NextGen Cloud POS Platform</p>
          </div>
        </div>
      `,
    },
    downgrade: {
      subject: `Your Plan Has Been Downgraded`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px;">
            <h2 style="color: #333; margin-top: 15px;">Plan Downgraded</h2>
          </div>
          <div style="padding: 20px;">
            <p style="color: #333; line-height: 1.6;">
              Your business <strong>${data.businessName || ""}</strong> plan has been downgraded to <strong>${data.planName}</strong>.
            </p>
            <p style="color: #666; line-height: 1.6;">
              Your new plan will be effective from your next billing cycle.
            </p>
          </div>
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #999; border-radius: 0 0 8px 8px;">
            <p>© ${new Date().getFullYear()} NextGen Cloud POS Platform</p>
          </div>
        </div>
      `,
    },
    payment_failed: {
      subject: "Payment Failed - Action Required",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #fef2f2; padding: 20px; text-align: center; border-radius: 8px;">
            <h2 style="color: #dc2626; margin-top: 15px;">Payment Issue</h2>
          </div>
          <div style="padding: 20px;">
            <p style="color: #333; line-height: 1.6;">
              We were unable to process the payment of <strong>${data.amount || ""}</strong> for your business <strong>${data.businessName || ""}</strong>.
            </p>
            <p style="color: #666; line-height: 1.6;">
              Please update your payment method to avoid service interruption. Next billing date: ${data.nextBillingDate || "N/A"}
            </p>
          </div>
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #999; border-radius: 0 0 8px 8px;">
            <p>© ${new Date().getFullYear()} NextGen Cloud POS Platform</p>
          </div>
        </div>
      `,
    },
  };

  const selectedTemplate = templates[template];
  return sendPlatformEmail({
    to: toEmail,
    subject: selectedTemplate.subject,
    html: selectedTemplate.html,
  });
}
