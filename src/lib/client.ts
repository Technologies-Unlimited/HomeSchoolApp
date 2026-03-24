import { useEffect, useState } from "react";

export interface CurrentUser {
  id: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/me", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setUser(null);
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { user, loading };
}
