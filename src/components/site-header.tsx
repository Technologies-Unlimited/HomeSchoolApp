"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/client";

const publicNavItems = [
  { label: "Home", href: "/" },
  { label: "Events", href: "/events" },
  { label: "Calendar", href: "/calendar" },
  { label: "Directory", href: "/directory" },
];

const authNavItems = [
  { label: "Notifications", href: "/notifications" },
  { label: "Profile", href: "/profile" },
];

export function SiteHeader() {
  const { user, loading, refresh } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  useEffect(() => {
    if (!user) return;
    fetch("/api/notifications?limit=1")
      .then((r) => (r.ok ? r.json() : { unreadCount: 0 }))
      .then((d) => setUnreadCount(d?.unreadCount ?? 0))
      .catch(() => {});
  }, [user, pathname]);

  const navItems = [
    ...publicNavItems,
    ...(user ? authNavItems : []),
    ...(user?.role === "admin" || user?.role === "super_admin"
      ? [{ label: "Admin", href: "/admin" }]
      : []),
  ];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    refresh();
    setMobileOpen(false);
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-20 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="shrink-0 text-sm font-bold text-slate-900">
          Home School Group
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 lg:flex">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-active={isActive}
                className={`relative rounded-full px-3 py-1.5 transition ${isActive ? "bg-slate-900 text-white" : "hover:bg-slate-100 hover:text-slate-900"}`}
              >
                {item.label}
                {item.label === "Notifications" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* Desktop auth */}
          <div className="hidden lg:flex lg:items-center lg:gap-2">
            {loading ? null : user ? (
              <>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  {user.firstName ?? "Member"}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu — overlays content */}
      {mobileOpen && (
        <nav className="absolute left-0 right-0 top-full z-30 border-t border-slate-200 bg-white px-4 py-3 shadow-lg lg:hidden">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-active={isActive}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  {item.label}
                </Link>
              );
            })}
            {loading ? null : user ? (
              <button
                onClick={handleLogout}
                className="mt-1 rounded-lg bg-slate-100 px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Sign out
              </button>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                  Sign in
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="rounded-lg bg-slate-900 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-slate-800">
                  Get started
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
