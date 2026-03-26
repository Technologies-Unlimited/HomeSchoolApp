"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface CurrentUser {
  id: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  emailVerified?: boolean;
  approved?: boolean;
}

interface CurrentUserContextValue {
  user: CurrentUser | null;
  loading: boolean;
  refresh: () => void;
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(() => {
    setLoading(true);
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data?.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <CurrentUserContext.Provider value={{ user, loading, refresh: fetchUser }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error("useCurrentUser must be used within a CurrentUserProvider");
  }
  return context;
}
