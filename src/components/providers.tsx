"use client";

import { CurrentUserProvider } from "@/lib/client";

export function Providers({ children }: { children: React.ReactNode }) {
  return <CurrentUserProvider>{children}</CurrentUserProvider>;
}
