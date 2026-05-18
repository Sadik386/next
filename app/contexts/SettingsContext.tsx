"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface Settings {
  id: number;
  businessName: string;
  tagline: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  taxId: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  logoUrl: string | null;
  printLogoUrl: string | null;
  emailHeaderLogoUrl: string | null;
  brandColor: string | null;
  invoiceFooter: string | null;
  currency: string;
  weekStartDay: number;
  // SMTP fields
  smtpProvider: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUsername: string | null;
  smtpPassword: string;
  smtpPasswordSet: boolean;
  smtpEncryption: string | null;
  smtpFromEmail: string | null;
  smtpFromName: string | null;
  smtpReplyTo: string | null;
  supportEmail: string | null;
  emailFooterText: string | null;
  companyAddressFooter: string | null;
  emailOrderConfirmationEnabled: boolean;
  emailInvoiceEnabled: boolean;
  emailPasswordResetEnabled: boolean;
  emailUserRegistrationEnabled: boolean;
  emailLowStockEnabled: boolean;
  emailDailySummaryEnabled: boolean;
}

// Define a sensible default structure for Settings
const DEFAULT_SETTINGS: Settings = {
  id: 0,
  businessName: "",
  tagline: null,
  email: null,
  phone: null,
  website: null,
  taxId: null,
  address: null,
  city: null,
  state: null,
  zipCode: null,
  country: null,
  logoUrl: null,
  printLogoUrl: null,
  emailHeaderLogoUrl: null,
  brandColor: "#C4973A", // Default brand color
  invoiceFooter: null,
  currency: "BDT",
  weekStartDay: 0,
  // SMTP defaults
  smtpProvider: null,
  smtpHost: null,
  smtpPort: null,
  smtpUsername: null,
  smtpPassword: "",
  smtpPasswordSet: false,
  smtpEncryption: null,
  smtpFromEmail: null,
  smtpFromName: null,
  smtpReplyTo: null,
  supportEmail: null,
  emailFooterText: null,
  companyAddressFooter: null,
  emailOrderConfirmationEnabled: true,
  emailInvoiceEnabled: true,
  emailPasswordResetEnabled: true,
  emailUserRegistrationEnabled: true,
  emailLowStockEnabled: true,
  emailDailySummaryEnabled: false,
};

interface SettingsContextValue {
  settings: Settings; // Changed to Settings, not Settings | null
  brandColor: string;
  currency: string;
  weekStartDay: number;
  refreshSettings: () => Promise<void>;
}

const DEFAULT_BRAND = "#C4973A";
const LOCAL_STORAGE_KEY = "accoraze_brandColor";

// Provide a default value that matches the structure of SettingsContextValue
const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  brandColor: DEFAULT_BRAND,
  currency: "BDT",
  weekStartDay: 0,
  refreshSettings: async () => {},
});

function getInitialBrandColor(): string {
  if (typeof window === "undefined") return DEFAULT_BRAND;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored && stored.trim().length > 0) {
      return stored;
    }
  } catch {
    // localStorage not available
  }
  return DEFAULT_BRAND;
}

function applyBrandColor(color: string | null | undefined) {
  if (typeof document === "undefined") return;
  const value = color && color.trim().length > 0 ? color : DEFAULT_BRAND;
  document.documentElement.style.setProperty("--brand", value);
  // Persist to localStorage for faster initial load on next visit
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, value);
  } catch {
    // localStorage not available
  }
}

function toSafeSettings(value: Partial<Settings> | null | undefined): Settings {
  const smtpPasswordSet = Boolean(value?.smtpPasswordSet) || value?.smtpPassword === "********";
  return {
    ...DEFAULT_SETTINGS,
    ...(value ?? {}),
    smtpPassword: smtpPasswordSet ? "********" : "",
    smtpPasswordSet,
  };
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // Initialize with localStorage value to prevent flash
  const [settings, setSettings] = useState<Settings | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Apply brand color from localStorage immediately on mount
  useEffect(() => {
    const initialColor = getInitialBrandColor();
    applyBrandColor(initialColor);
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      if (!res.ok) {
        console.error("Failed to fetch settings:", res.statusText);
        return;
      }
      const data = await res.json();
      const next = toSafeSettings(data.settings);
      setSettings(next);
      // Update brand color CSS variable and localStorage
      applyBrandColor(next.brandColor);
    } catch (error) {
      console.error("Error fetching settings:", error);
      setSettings(DEFAULT_SETTINGS);
      applyBrandColor(DEFAULT_BRAND);
    } finally {
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      refreshSettings();
      function onChange() {
        refreshSettings();
      }
      window.addEventListener("brandColorChanged", onChange);
      return () => window.removeEventListener("brandColorChanged", onChange);
    }
  }, [refreshSettings]);

  // Ensure the value provided is always of the correct type, even if settings fetch fails
  const contextValue: SettingsContextValue = {
    settings: settings ?? DEFAULT_SETTINGS,
    brandColor: settings?.brandColor ?? getInitialBrandColor(),
    currency: settings?.currency ?? "BDT",
    weekStartDay: settings?.weekStartDay ?? 0,
    refreshSettings,
  };

  return <SettingsContext.Provider value={contextValue}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined || context === null) {
    // Return default values for SSR or when Provider is missing
    return {
      settings: DEFAULT_SETTINGS,
      brandColor: DEFAULT_BRAND,
      currency: "BDT",
      weekStartDay: 0,
      refreshSettings: async () => {},
    };
  }
  return context;
}
