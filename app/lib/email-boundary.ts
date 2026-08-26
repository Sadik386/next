type SmtpEncryptionMode = string | boolean | null | undefined;

interface SmtpTransportSecurityOptions {
  secure: boolean;
  requireTLS?: boolean;
  tls?: {
    rejectUnauthorized: boolean;
  };
}

type SafeSmtpLogDetails = {
  name?: string;
  code?: string;
  command?: string;
  responseCode?: number;
};

type SmtpErrorLike = {
  name?: unknown;
  code?: unknown;
  command?: unknown;
  responseCode?: unknown;
};

const DEV_INSECURE_TLS_ENV = "DOKANDAR_ALLOW_INSECURE_SMTP_TLS";

export function getSmtpTransportSecurity(
  portValue: number | null | undefined,
  encryption: SmtpEncryptionMode
): SmtpTransportSecurityOptions {
  const port = Number(portValue) || 587;
  const mode = typeof encryption === "string" ? encryption.trim().toLowerCase() : "";
  const requestedSsl = encryption === true || mode === "ssl";

  const secure = port === 465 || (port !== 587 && requestedSsl);
  const requireTLS = !secure && (port === 587 || mode === "tls" || mode === "starttls");
  const allowDevInsecureTls =
    process.env.NODE_ENV !== "production" && process.env[DEV_INSECURE_TLS_ENV] === "true";

  return {
    secure,
    ...(requireTLS ? { requireTLS: true } : {}),
    ...(allowDevInsecureTls ? { tls: { rejectUnauthorized: false } } : {}),
  };
}

export function isValidEmailAddress(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message.toLowerCase();
  if (typeof error === "string") return error.toLowerCase();
  return "";
}

function errorCode(error: unknown): string {
  const value = (error as SmtpErrorLike | null)?.code;
  return typeof value === "string" ? value.toUpperCase() : "";
}

function responseCode(error: unknown): number | undefined {
  const value = (error as SmtpErrorLike | null)?.responseCode;
  return typeof value === "number" ? value : undefined;
}

export function getSafeSmtpErrorMessage(
  error: unknown,
  context: "test" | "send"
): string {
  const text = errorText(error);
  const code = errorCode(error);
  const smtpResponseCode = responseCode(error);

  if (
    smtpResponseCode === 535 ||
    code === "EAUTH" ||
    text.includes("authentication failed") ||
    text.includes("invalid login") ||
    text.includes("invalid credentials")
  ) {
    return "SMTP authentication failed. Please verify username and app password.";
  }

  if (
    code === "ENOTFOUND" ||
    code === "ECONNREFUSED" ||
    code === "EAI_AGAIN" ||
    code === "ECONNECTION"
  ) {
    return "SMTP connection failed. Please check host and port.";
  }

  if (
    code === "ETIMEDOUT" ||
    text.includes("timeout") ||
    text.includes("timed out")
  ) {
    return "SMTP connection timed out. Please try again or check the provider settings.";
  }

  if (
    code === "ESOCKET" ||
    text.includes("starttls") ||
    text.includes("tls") ||
    text.includes("ssl")
  ) {
    return "SMTP TLS negotiation failed. Please check port and encryption settings.";
  }

  return context === "test"
    ? "SMTP test failed. Please verify the SMTP settings and try again."
    : "Email could not be sent. Please verify SMTP settings or try again later.";
}

export function getSafeSmtpLogDetails(error: unknown): SafeSmtpLogDetails {
  const smtpError = error as SmtpErrorLike | null;
  const details: SafeSmtpLogDetails = {};

  if (typeof smtpError?.name === "string") details.name = smtpError.name;
  if (typeof smtpError?.code === "string") details.code = smtpError.code;
  if (typeof smtpError?.command === "string") details.command = smtpError.command;
  if (typeof smtpError?.responseCode === "number") details.responseCode = smtpError.responseCode;

  return details;
}

export function logSafeSmtpError(message: string, error: unknown) {
  console.error(message, getSafeSmtpLogDetails(error));
}
