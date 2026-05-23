import type { BusinessInfo } from "./types"
import { compact, compactAddress, currencyPrefix, optionalText, safeText, type AddressSource } from "./formatters"

export type DocumentSettings = AddressSource & {
  businessName?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  taxId?: string | null
  logoUrl?: string | null
  printLogoUrl?: string | null
  brandColor?: string | null
  invoiceFooter?: string | null
  currency?: string | null
}

export type DocumentProfile = {
  businessName: string
  address?: string
  addressLines: string[]
  phone?: string
  email?: string
  website?: string
  taxId?: string
  logoUrl?: string
  printLogoUrl?: string
  brandColor?: string
  invoiceFooter?: string
  currency: string
  currencySymbol: string
}

export function buildDocumentProfile(settings: DocumentSettings | null | undefined): DocumentProfile {
  const currency = safeText(settings?.currency, "BDT")
  const address = compactAddress(settings)
  const phone = optionalText(settings?.phone)
  const email = optionalText(settings?.email)

  return {
    businessName: safeText(settings?.businessName, "My Business"),
    address,
    addressLines: compact([
      settings?.address,
      settings?.city,
      settings?.state,
      settings?.zipCode,
      settings?.country,
    ]),
    phone,
    email,
    website: optionalText(settings?.website),
    taxId: optionalText(settings?.taxId),
    logoUrl: optionalText(settings?.logoUrl),
    printLogoUrl: optionalText(settings?.printLogoUrl),
    brandColor: optionalText(settings?.brandColor),
    invoiceFooter: optionalText(settings?.invoiceFooter),
    currency,
    currencySymbol: currencyPrefix(currency),
  }
}

export function toBusinessInfo(profile: DocumentProfile, options: { logoUrl?: string } = {}): BusinessInfo {
  return {
    name: profile.businessName,
    address: profile.address,
    phone: profile.phone,
    email: profile.email,
    taxId: profile.taxId,
    logoUrl: options.logoUrl,
    brandColor: profile.brandColor,
    invoiceFooter: profile.invoiceFooter,
  }
}
