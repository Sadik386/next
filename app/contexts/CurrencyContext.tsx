"use client";
import { createContext, useContext, useMemo } from "react";
import { CURRENCIES, getCurrency } from "@/constants/currencies";
import { useSettings } from "@/contexts/SettingsContext";

interface CurrencyContextValue {
  code: string;
  symbol: string;
  format: (amount: number | string | null | undefined) => string;
}

const DEFAULT: CurrencyContextValue = {
  code: "BDT",
  symbol: CURRENCIES[0]?.symbol ?? "৳",
  format: (amount) => {
    const n = toNumber(amount);
    return `${CURRENCIES[0]?.symbol ?? "৳"}${n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  },
};

const CurrencyContext = createContext<CurrencyContextValue>(DEFAULT);

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { currency } = useSettings();

  const value = useMemo<CurrencyContextValue>(() => {
    const found = getCurrency(currency);
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
  }, [currency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
