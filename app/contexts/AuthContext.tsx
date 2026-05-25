"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  username?: string;
  businessId?: number;
  isFounder?: boolean;
}

export interface BusinessInfo {
  businessId: number;
  name: string;
  slug: string;
  isDefault: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  businesses: BusinessInfo[];
  refreshUser: () => Promise<void>;
  loadBusinesses: () => Promise<void>;
  switchBusiness: (businessId: number) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  businesses: [],
  refreshUser: async () => {},
  loadBusinesses: async () => {},
  switchBusiness: async () => ({ success: false, error: "Not initialized" }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<BusinessInfo[]>([]);

  const loadBusinesses = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/businesses", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data.businesses ?? []);
      }
    } catch {
      setBusinesses([]);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const switchBusiness = useCallback(async (businessId: number) => {
    try {
      const res = await fetch("/api/auth/switch-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user ?? null);
        await loadBusinesses();
        return { success: true };
      }
      return { success: false, error: data.error ?? "Switch failed" };
    } catch {
      return { success: false, error: "Network error" };
    }
  }, [loadBusinesses]);

  useEffect(() => {
    refreshUser();
    loadBusinesses();
  }, [refreshUser, loadBusinesses]);

  return (
    <AuthContext.Provider value={{ user, loading, businesses, refreshUser, loadBusinesses, switchBusiness }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): { user: AuthUser | null; loading: boolean; businesses: BusinessInfo[]; refreshUser: () => Promise<void>; loadBusinesses: () => Promise<void>; switchBusiness: (businessId: number) => Promise<{ success: boolean; error?: string }> } {
  const context = useContext(AuthContext);
  if (context === undefined || context === null) {
    return { user: null, loading: true, businesses: [], refreshUser: async () => {}, loadBusinesses: async () => {}, switchBusiness: async () => ({ success: false, error: "Not initialized" }) };
  }
  return context;
}
