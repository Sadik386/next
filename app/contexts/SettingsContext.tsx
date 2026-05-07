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
  brandColor: string | null;
  invoiceFooter: string | null;
  currency: string;
  weekStartDay: number;
}

interface SettingsContextValue {
  settings: Settings | null;
  brandColor: string;
  currency: string;
  weekStartDay: number;
  refreshSettings: () => Promise<void>;
}

const DEFAULT_BRAND = "#C4973A";

const SettingsContext = createContext<SettingsContextValue>({
  settings: null,
  brandColor: DEFAULT_BRAND,
  currency: "BDT",
  weekStartDay: 0,
  refreshSettings: async () => {},
});

function applyBrandColor(color: string) {
  if (typeof document === "undefined") return;
  const value = color && color.trim().length > 0 ? color : DEFAULT_BRAND;
  document.documentElement.style.setProperty("--brand", value);
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const next: Settings | null = data.settings ?? null;
      setSettings(next);
      if (next) applyBrandColor(next.brandColor ?? DEFAULT_BRAND);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refreshSettings();
    function onChange() {
      refreshSettings();
    }
    window.addEventListener("brandColorChanged", onChange);
    return () => window.removeEventListener("brandColorChanged", onChange);
  }, [refreshSettings]);

  const value: SettingsContextValue = {
    settings,
    brandColor: settings?.brandColor ?? DEFAULT_BRAND,
    currency: settings?.currency ?? "BDT",
    weekStartDay: settings?.weekStartDay ?? 0,
    refreshSettings,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
