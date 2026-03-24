"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/client";

interface EventItem { id: string; title: string; startDate?: string; category?: string; location?: { name?: string } }
interface AnnouncementItem { id: string; title: string; content: string; priority: string; pinned: boolean; authorName?: string; createdAt?: string }

const priorityStyles: Record<string, string> = { urgent: "border-red-200 bg-red-50", important: "border-amber-200 bg-amber-50", normal: "border-slate-200 bg-white" };

export default function Home() {
  const { user } = useCurrentUser();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [announcementPage, setAnnouncementPage] = useState(1);
  const [announcementTotal, setAnnouncementTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/events?limit=5").then((r) => (r.ok ? r.json() : { events: [] })),
      fetch("/api/announcements?limit=10").then((r) => (r.ok ? r.json() : { announcements: [], total: 0 })),
    ])
      .then(([eventData, announcementData]) => {
        setEvents(eventData?.events ?? []);
        setAnnouncements(announcementData?.announcements ?? []);
        setAnnouncementTotal(announcementData?.total ?? 0);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, []);

  async function loadMoreAnnouncements() {
    const nextPage = announcementPage + 1;
    setLoadingMore(true);
    const r = await fetch(`/api/announcements?limit=10&page=${nextPage}`);
    const data = await r.json().catch(() => ({ announcements: [] }));
    setAnnouncements((prev) => [...prev, ...(data?.announcements ?? [])]);
    setAnnouncementPage(nextPage);
    setLoadingMore(false);
  }

  const hasMoreAnnouncements = announcements.length < announcementTotal;

  return (
    <div className="flex flex-col gap-8">
      {/* Status banners */}
      {user && !user.emailVerified && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-800">Verify your email</h2>
          <p className="mt-1 text-sm text-amber-700">Check your inbox for a verification link.</p>
          <a href="/pending-approval" className="mt-3 inline-block rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700">Check status</a>
        </div>
      )}
      {user && user.emailVerified && !user.approved && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-lg font-semibold text-blue-800">Pending approval</h2>
          <p className="mt-1 text-sm text-blue-700">Your email is verified. An admin will review your request soon.</p>
        </div>
      )}

      {/* Welcome */}
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          {user ? `Welcome back, ${user.firstName ?? "there"}` : "Home School Group"}
        </h1>
        <p className="text-sm text-slate-600">Manage events, RSVPs, and community updates in one place.</p>
      </section>

      {/* Quick actions */}
      {user && user.approved && (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/events/new" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
            <p className="text-sm font-semibold text-slate-900">Create event</p><p className="mt-1 text-xs text-slate-500">Plan a new gathering</p>
          </Link>
          <Link href="/events" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
            <p className="text-sm font-semibold text-slate-900">Browse events</p><p className="mt-1 text-xs text-slate-500">RSVP and sign up</p>
          </Link>
          <Link href="/directory" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
            <p className="text-sm font-semibold text-slate-900">Family directory</p><p className="mt-1 text-xs text-slate-500">Connect with families</p>
          </Link>
          <Link href="/profile" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
            <p className="text-sm font-semibold text-slate-900">My profile</p><p className="mt-1 text-xs text-slate-500">Family & children info</p>
          </Link>
        </section>
      )}

      {!user && !loading && (
        <section className="flex gap-3">
          <Link href="/login" className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Sign in</Link>
          <Link href="/register" className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">Get started</Link>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Announcements — takes 2 cols */}
        <section className="space-y-4 lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">Announcements</h2>
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : fetchError ? (
            <p className="text-sm text-red-600">Failed to load data. Please refresh the page.</p>
          ) : announcements.length === 0 ? (
            <p className="text-sm text-slate-500">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className={`rounded-xl border p-4 ${priorityStyles[a.priority] ?? priorityStyles.normal}`}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{a.title}</h3>
                    <div className="flex shrink-0 gap-1">
                      {a.pinned && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Pinned</span>}
                      {a.priority === "urgent" && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">Urgent</span>}
                      {a.priority === "important" && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Important</span>}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{a.content}</p>
                  <p className="mt-2 text-[10px] text-slate-400">{a.authorName}{a.createdAt ? ` — ${new Date(a.createdAt).toLocaleDateString()}` : ""}</p>
                </div>
              ))}
              {hasMoreAnnouncements && (
                <button onClick={loadMoreAnnouncements} disabled={loadingMore} className="w-full rounded-xl border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-700 disabled:opacity-50">
                  {loadingMore ? "Loading..." : "Load more announcements"}
                </button>
              )}
            </div>
          )}
        </section>

        {/* Upcoming events sidebar */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Upcoming events</h2>
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-slate-500">No upcoming events.</p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`} className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {event.startDate ? new Date(event.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "TBD"}
                    {event.location?.name ? ` — ${event.location.name}` : ""}
                  </p>
                </Link>
              ))}
              <Link href="/events" className="block text-center text-xs font-medium text-slate-500 transition hover:text-slate-700">View all events</Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
