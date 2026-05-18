"use client";
import { createContext, useContext, useMemo } from "react";
import { CURRENCIES, getCurrency } from "@/constants/currencies";
import { useSettings } from "@/contexts/SettingsContext";

interface CurrencyContextValue {
  code: string;
  symbol: string;
  format: (amount: number | string | null | undefined) => string;
}

const DEFAULT_CURRENCY_FORMAT = {
  code: "BDT",
  symbol: CURRENCIES[0]?.symbol ?? "৳",
  format: (amount: number | string | null | undefined): string => {
    const n = toNumber(amount);
    return `${CURRENCIES[0]?.symbol ?? "৳"}${n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  },
};

const CurrencyContext = createContext<CurrencyContextValue>(DEFAULT_CURRENCY_FORMAT);

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  // useSettings is a client-side hook, and SettingsProvider is also client-side.
  // This hook call should be safe within a client component.
  const { currency: currencyCode } = useSettings();

  const value = useMemo<CurrencyContextValue>(() => {
    const found = getCurrency(currencyCode);
    const symbol = found?.symbol ?? "৳";
    const code = found?.code ?? "BDT";
    return {
      code,
      symbol,
      format: (amount) => {
        const n = toNumber(amount);
        return `${symbol}${n.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      },
    };
  }, [currencyCode]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
