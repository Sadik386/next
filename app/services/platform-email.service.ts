import nodemailer, { Transporter } from "nodemailer";

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

export interface PlatformEmailResult {
  success: boolean;
  message: string;
}

function getPlatformEmailConfig(): PlatformEmailConfig | null {
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
    smtpFromName: process.env.SMTP_FROM_NAME || "Accoraze Platform",
    smtpReplyTo: process.env.SMTP_REPLY_TO,
  };
}

function createPlatformTransporter(config: PlatformEmailConfig): Transporter {
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
    connectionTimeout: 10000,
    tls: {
      rejectUnauthorized: false,
    },
  });
}

export function isPlatformEmailConfigured(): boolean {
  const config = getPlatformEmailConfig();
  return config !== null;
}

export async function testPlatformSmtp(): Promise<PlatformEmailResult> {
  const config = getPlatformEmailConfig();
  if (!config) {
    return { success: false, message: "Platform SMTP not configured. Check environment variables." };
  }

  try {
    const transporter = createPlatformTransporter(config);
    await transporter.verify();
    return { success: true, message: "Platform SMTP connection successful." };
  } catch (error) {
    console.error("Platform SMTP connection test failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: `Connection failed: ${errorMessage}` };
  }
}

interface SendPlatformEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendPlatformEmail(params: SendPlatformEmailParams): Promise<PlatformEmailResult> {
  const config = getPlatformEmailConfig();
  if (!config) {
    return { success: false, message: "Platform SMTP not configured." };
  }

  if (!params.to || !params.to.includes("@")) {
    return { success: false, message: "Invalid recipient email address." };
  }

  try {
    const transporter = createPlatformTransporter(config);

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${config.smtpFromName}" <${config.smtpFromEmail}>`,
      to: params.to,
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
    console.error("Platform email send failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: `Failed to send email: ${errorMessage}` };
  }
}

export async function sendTestPlatformEmail(toEmail: string): Promise<PlatformEmailResult> {
  if (!toEmail || !toEmail.includes("@")) {
    return { success: false, message: "Invalid recipient email address." };
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px;">
        <h2 style="color: #333; margin-top: 15px;">Accoraze Platform</h2>
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
        <p>© ${new Date().getFullYear()} Accoraze Platform</p>
      </div>
    </div>
  `;

  return sendPlatformEmail({
    to: toEmail,
    subject: "Test Email from Accoraze Platform",
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
        <h2 style="color: #333; margin-top: 15px;">Accoraze Support</h2>
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
          You can reply to this email or log in to your Accoraze account to continue the conversation.
        </p>
      </div>
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #999; border-radius: 0 0 8px 8px;">
        <p>© ${new Date().getFullYear()} Accoraze Platform</p>
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
          This is an automated notification from Accoraze Platform.
        </p>
      </div>
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #999;">
        <p>© ${new Date().getFullYear()} Accoraze Platform</p>
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
      subject: "Welcome to Accoraze!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px;">
            <h2 style="color: #333; margin-top: 15px;">Welcome to Accoraze!</h2>
          </div>
          <div style="padding: 20px;">
            <p style="color: #333; line-height: 1.6;">
              Thank you for joining Accoraze! Your business <strong>${data.businessName || "account"}</strong> has been set up successfully.
            </p>
            <p style="color: #666; line-height: 1.6;">
              You can now start managing your inventory, customers, and sales with our platform.
            </p>
          </div>
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #999; border-radius: 0 0 8px 8px;">
            <p>© ${new Date().getFullYear()} Accoraze Platform</p>
          </div>
        </div>
      `,
    },
    cancellation: {
      subject: "Your Accoraze Subscription Has Been Cancelled",
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
            <p>© ${new Date().getFullYear()} Accoraze Platform</p>
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
            <p>© ${new Date().getFullYear()} Accoraze Platform</p>
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
            <p>© ${new Date().getFullYear()} Accoraze Platform</p>
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
            <p>© ${new Date().getFullYear()} Accoraze Platform</p>
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