"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { fetchUserInfo } from "@/lib/api/auth";

interface AuthContextValue {
  user: {
    id: number;
    username: string;
    role: string;
  } | null;
  isLoggedIn: boolean;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{
    id: number;
    username: string;
    role: string;
  } | null>(null);

  const reloadUser = async () => {
    try {
      const userData = await fetchUserInfo();
      setUser(userData);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    reloadUser();
  }, []);

  const value: AuthContextValue = {
    user,
    isLoggedIn: !!user,
    reloadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
