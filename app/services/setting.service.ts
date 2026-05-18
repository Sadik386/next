import { prisma } from "@/lib/prisma";
import { Prisma, type Setting } from "@prisma/client";
import { createLog } from "@/services/activity-log.service";
import { getCurrentBusinessId } from "@/lib/business";
import { encryptSecret } from "@/lib/crypto/secret";

export const DEFAULT_BRAND_COLOR = "#C4973A";

export interface SettingInput {
  settingsSection?: string;
  businessName?: string;
  tagline?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  taxId?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  logoUrl?: string | null;
  printLogoUrl?: string | null;
  emailHeaderLogoUrl?: string | null;
  brandColor?: string | null;
  invoiceFooter?: string | null;
  currency?: string;
  weekStartDay?: number;
  // SMTP fields
  smtpProvider?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUsername?: string | null;
  smtpPassword?: string | null;
  smtpEncryption?: string | null;
  smtpFromEmail?: string | null;
  smtpFromName?: string | null;
  smtpReplyTo?: string | null;
  supportEmail?: string | null;
  emailFooterText?: string | null;
  companyAddressFooter?: string | null;
  emailOrderConfirmationEnabled?: boolean;
  emailInvoiceEnabled?: boolean;
  emailPasswordResetEnabled?: boolean;
  emailUserRegistrationEnabled?: boolean;
  emailLowStockEnabled?: boolean;
  emailDailySummaryEnabled?: boolean;
  clearSmtpPassword?: boolean;
}

export type ClientSetting = Omit<Setting, "smtpPassword"> & {
  smtpPassword: string;
  smtpPasswordSet: boolean;
};

function hasRealSmtpPassword(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value !== "********";
}

function maskSettingsForClient(setting: Setting): ClientSetting {
  const smtpPasswordSet = Boolean(setting.smtpPassword && setting.smtpPassword.length > 0);
  return {
    ...setting,
    smtpProvider: setting.smtpProvider ?? "SMTP",
    smtpPort: setting.smtpPort ?? 587,
    smtpEncryption: setting.smtpEncryption ?? "TLS",
    smtpPassword: smtpPasswordSet ? "********" : "",
    smtpPasswordSet,
  };
}

export async function getSettings() {
  const businessId = getCurrentBusinessId();
  let setting = await prisma.setting.findUnique({ where: { businessId } });
  if (!setting) {
    setting = await prisma.setting.create({
      data: {
        businessId,
        businessName: "My Business",
        currency: "BDT",
        weekStartDay: 0,
        brandColor: DEFAULT_BRAND_COLOR,
        smtpProvider: "SMTP",
        smtpPort: 587,
        smtpEncryption: "TLS",
      },
    });
  }
  return maskSettingsForClient(setting);
}

export async function updateSettings(data: SettingInput, userId: number) {
  const businessId = getCurrentBusinessId();
  const update: Prisma.SettingUncheckedUpdateInput = {};
  const isSmtpSection = data.settingsSection === "email-smtp";

  if (data.businessName !== undefined) update.businessName = data.businessName;
  if (data.tagline !== undefined) update.tagline = data.tagline;
  if (data.email !== undefined) update.email = data.email;
  if (data.phone !== undefined) update.phone = data.phone;
  if (data.website !== undefined) update.website = data.website;
  if (data.taxId !== undefined) update.taxId = data.taxId;
  if (data.address !== undefined) update.address = data.address;
  if (data.city !== undefined) update.city = data.city;
  if (data.state !== undefined) update.state = data.state;
  if (data.zipCode !== undefined) update.zipCode = data.zipCode;
  if (data.country !== undefined) update.country = data.country;
  if (data.logoUrl !== undefined) update.logoUrl = data.logoUrl;
  if (data.printLogoUrl !== undefined) update.printLogoUrl = data.printLogoUrl;
  if (data.emailHeaderLogoUrl !== undefined) update.emailHeaderLogoUrl = data.emailHeaderLogoUrl;
  if (data.brandColor !== undefined) update.brandColor = data.brandColor;
  if (data.invoiceFooter !== undefined) update.invoiceFooter = data.invoiceFooter;
  if (data.currency !== undefined) update.currency = data.currency;
  if (data.weekStartDay !== undefined) update.weekStartDay = data.weekStartDay;

  // SMTP connection fields are intentionally non-null updates only. This keeps
  // blank values from unrelated partial PATCH payloads from erasing credentials.
  if (data.smtpProvider !== undefined && data.smtpProvider !== null) update.smtpProvider = data.smtpProvider;
  if (data.smtpHost !== undefined && data.smtpHost !== null) update.smtpHost = data.smtpHost;
  if (data.smtpPort !== undefined && data.smtpPort !== null) update.smtpPort = data.smtpPort;
  if (data.smtpUsername !== undefined && data.smtpUsername !== null) update.smtpUsername = data.smtpUsername;
  if (data.smtpEncryption !== undefined && data.smtpEncryption !== null) update.smtpEncryption = data.smtpEncryption;

  // SMTP metadata may be cleared from the Email & SMTP section, but nulls from
  // other section saves are ignored.
  if (data.smtpFromEmail !== undefined && (data.smtpFromEmail !== null || isSmtpSection)) {
    update.smtpFromEmail = data.smtpFromEmail;
  }
  if (data.smtpFromName !== undefined && (data.smtpFromName !== null || isSmtpSection)) {
    update.smtpFromName = data.smtpFromName;
  }
  if (data.smtpReplyTo !== undefined && (data.smtpReplyTo !== null || isSmtpSection)) {
    update.smtpReplyTo = data.smtpReplyTo;
  }
  if (data.supportEmail !== undefined && (data.supportEmail !== null || isSmtpSection)) {
    update.supportEmail = data.supportEmail;
  }
  if (data.emailFooterText !== undefined && (data.emailFooterText !== null || isSmtpSection)) {
    update.emailFooterText = data.emailFooterText;
  }
  if (data.companyAddressFooter !== undefined && (data.companyAddressFooter !== null || isSmtpSection)) {
    update.companyAddressFooter = data.companyAddressFooter;
  }
  if (data.emailOrderConfirmationEnabled !== undefined) update.emailOrderConfirmationEnabled = data.emailOrderConfirmationEnabled;
  if (data.emailInvoiceEnabled !== undefined) update.emailInvoiceEnabled = data.emailInvoiceEnabled;
  if (data.emailPasswordResetEnabled !== undefined) update.emailPasswordResetEnabled = data.emailPasswordResetEnabled;
  if (data.emailUserRegistrationEnabled !== undefined) update.emailUserRegistrationEnabled = data.emailUserRegistrationEnabled;
  if (data.emailLowStockEnabled !== undefined) update.emailLowStockEnabled = data.emailLowStockEnabled;
  if (data.emailDailySummaryEnabled !== undefined) update.emailDailySummaryEnabled = data.emailDailySummaryEnabled;

  if (data.clearSmtpPassword === true) {
    update.smtpPassword = null;
  } else if (hasRealSmtpPassword(data.smtpPassword)) {
    update.smtpPassword = encryptSecret(data.smtpPassword);
  }

  const setting = await prisma.setting.upsert({
    where: { businessId },
    update,
    create: {
      businessId,
      businessName: data.businessName ?? "My Business",
      tagline: data.tagline ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      website: data.website ?? null,
      taxId: data.taxId ?? null,
      address: data.address ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
      zipCode: data.zipCode ?? null,
      country: data.country ?? null,
      logoUrl: data.logoUrl ?? null,
      printLogoUrl: data.printLogoUrl ?? null,
      emailHeaderLogoUrl: data.emailHeaderLogoUrl ?? null,
      brandColor: data.brandColor ?? DEFAULT_BRAND_COLOR,
      invoiceFooter: data.invoiceFooter ?? null,
      currency: data.currency ?? "BDT",
      weekStartDay: data.weekStartDay ?? 0,
      smtpProvider: data.smtpProvider ?? "SMTP",
      smtpHost: data.smtpHost ?? null,
      smtpPort: data.smtpPort ?? 587,
      smtpUsername: data.smtpUsername ?? null,
      smtpPassword: hasRealSmtpPassword(data.smtpPassword) ? encryptSecret(data.smtpPassword) : null,
      smtpEncryption: data.smtpEncryption ?? "TLS",
      smtpFromEmail: data.smtpFromEmail ?? null,
      smtpFromName: data.smtpFromName ?? null,
      smtpReplyTo: data.smtpReplyTo ?? null,
      supportEmail: data.supportEmail ?? null,
      emailFooterText: data.emailFooterText ?? null,
      companyAddressFooter: data.companyAddressFooter ?? null,
      emailOrderConfirmationEnabled: data.emailOrderConfirmationEnabled ?? true,
      emailInvoiceEnabled: data.emailInvoiceEnabled ?? true,
      emailPasswordResetEnabled: data.emailPasswordResetEnabled ?? true,
      emailUserRegistrationEnabled: data.emailUserRegistrationEnabled ?? true,
      emailLowStockEnabled: data.emailLowStockEnabled ?? true,
      emailDailySummaryEnabled: data.emailDailySummaryEnabled ?? false,
    },
  });

  await createLog({
    userId,
    action: "update",
    module: "setting",
    entityId: String(setting.id),
    entityName: "Business Settings",
    description: "Updated business settings",
    metadata: { fields: Object.keys(update) },
  });

  return maskSettingsForClient(setting);
}

export async function getBrandColor(): Promise<string> {
  const businessId = getCurrentBusinessId();
  const setting = await prisma.setting.findUnique({
    where: { businessId },
    select: { brandColor: true },
  });
  const color = setting?.brandColor?.trim();
  return color && color.length > 0 ? color : DEFAULT_BRAND_COLOR;
}
