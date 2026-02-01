"use client";

import Link from "next/link";
import { useCurrentUser } from "@/lib/client";

const navItems = [
  { label: "Overview", href: "/" },
  { label: "Events", href: "/events" },
  { label: "Calendar", href: "/calendar" },
  { label: "Notifications", href: "/notifications" },
  { label: "Profile", href: "/profile" },
  { label: "Admin", href: "/admin" },
];

export function SiteHeader() {
  const { user } = useCurrentUser();

  return (
    <header className="sticky top-0 z-20 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
            HG
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Home School Group
            </p>
            <p className="text-xs text-slate-500">Event management dashboard</p>
          </div>
        </div>
        <nav className="hidden items-center gap-4 text-sm font-medium text-slate-600 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
              {user.firstName ?? "Member"}
            </span>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
