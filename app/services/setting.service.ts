import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createLog } from "@/services/activity-log.service";

export const DEFAULT_BRAND_COLOR = "#C4973A";

export interface SettingInput {
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
  brandColor?: string | null;
  invoiceFooter?: string | null;
  currency?: string;
  weekStartDay?: number;
}

export async function getSettings() {
  let setting = await prisma.setting.findUnique({ where: { id: 1 } });
  if (!setting) {
    setting = await prisma.setting.create({
      data: {
        id: 1,
        businessName: "My Business",
        currency: "BDT",
        weekStartDay: 0,
        brandColor: DEFAULT_BRAND_COLOR,
      },
    });
  }
  return setting;
}

export async function updateSettings(data: SettingInput, userId: number) {
  const update: Prisma.SettingUncheckedUpdateInput = {};
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
  if (data.brandColor !== undefined) update.brandColor = data.brandColor;
  if (data.invoiceFooter !== undefined) update.invoiceFooter = data.invoiceFooter;
  if (data.currency !== undefined) update.currency = data.currency;
  if (data.weekStartDay !== undefined) update.weekStartDay = data.weekStartDay;

  const setting = await prisma.setting.upsert({
    where: { id: 1 },
    update,
    create: {
      id: 1,
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
      brandColor: data.brandColor ?? DEFAULT_BRAND_COLOR,
      invoiceFooter: data.invoiceFooter ?? null,
      currency: data.currency ?? "BDT",
      weekStartDay: data.weekStartDay ?? 0,
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

  return setting;
}

export async function getBrandColor(): Promise<string> {
  const setting = await prisma.setting.findUnique({
    where: { id: 1 },
    select: { brandColor: true },
  });
  const color = setting?.brandColor?.trim();
  return color && color.length > 0 ? color : DEFAULT_BRAND_COLOR;
}
