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

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return <AuthContext.Provider value={{ user, loading, refreshUser }}>{children}</AuthContext.Provider>;
}

export function useAuth(): { user: AuthUser | null; loading: boolean; refreshUser: () => Promise<void> } {
  const context = useContext(AuthContext);
  if (context === undefined || context === null) {
    return { user: null, loading: true, refreshUser: async () => {} };
  }
  return context;
}