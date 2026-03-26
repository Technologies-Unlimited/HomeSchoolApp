"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageGuide } from "@/components/page-guide";

interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  category?: string;
  location?: { name?: string };
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    fetch("/api/events?limit=100")
      .then((res) => { if (!res.ok) throw new Error("Failed to load"); return res.json(); })
      .then((data) => setEvents(data.events ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.startDate) >= now).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const past = events.filter((e) => new Date(e.startDate) < now).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  const displayed = tab === "upcoming" ? upcoming : past;

  const [visibleCount, setVisibleCount] = useState(20);
  const visible = displayed.slice(0, visibleCount);
  const hasMore = visibleCount < displayed.length;

  // Reset visible count when switching tabs
  useEffect(() => { setVisibleCount(20); }, [tab]);

  // Group events by month
  const groups: { label: string; events: CalendarEvent[] }[] = [];
  for (const event of visible) {
    const date = new Date(event.startDate);
    const label = date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    const last = groups[groups.length - 1];
    if (last && last.label === label) { last.events.push(event); }
    else { groups.push({ label, events: [event] }); }
  }

  return (
    <section className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Calendar" }]} />
      <PageGuide pageKey="calendar">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Calendar</h1>
      </PageGuide>

      <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        <button onClick={() => setTab("upcoming")} data-active={tab === "upcoming"} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === "upcoming" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          Upcoming ({upcoming.length})
        </button>
        <button onClick={() => setTab("past")} data-active={tab === "past"} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === "past" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          Past ({past.length})
        </button>
      </div>
        <a href="/api/events/ical" className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100">Export calendar (.ics)</a>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading events...</p>
      ) : error ? (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      ) : displayed.length === 0 ? (
        <p className="text-sm text-slate-500">{tab === "upcoming" ? "No upcoming events." : "No past events."}</p>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{group.label}</h2>
              <div className="grid gap-2">
                {group.events.map((event) => {
                  const start = new Date(event.startDate);
                  return (
                    <Link key={event.id} href={`/events/${event.id}`} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 hover:shadow-sm">
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-100">
                        <span className="text-xs font-bold text-slate-900">{start.toLocaleDateString(undefined, { day: "numeric" })}</span>
                        <span className="text-[10px] uppercase text-slate-500">{start.toLocaleDateString(undefined, { weekday: "short" })}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{event.title}</p>
                        <p className="text-xs text-slate-500">
                          {start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                          {event.location?.name ? ` — ${event.location.name}` : ""}
                        </p>
                      </div>
                      {event.category && (
                        <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">{event.category}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {hasMore && (
            <button onClick={() => setVisibleCount((c) => c + 20)} className="w-full rounded-xl border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-700">
              Load more
            </button>
          )}
        </div>
      )}
    </section>
  );
}
