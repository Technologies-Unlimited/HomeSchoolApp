"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/client";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageGuide } from "@/components/page-guide";

const categoryLabels: Record<string, string> = {
  "field-trip": "Field Trip",
  "co-op": "Co-op",
  "park-day": "Park Day",
  sports: "Sports",
  social: "Social",
  "science-fair": "Science Fair",
  "book-club": "Book Club",
  "arts-crafts": "Arts & Crafts",
  volunteer: "Volunteer",
  meeting: "Meeting",
  other: "Other",
};

interface EventItem {
  id: string;
  title: string;
  startDate?: string;
  status?: string;
  category?: string;
  location?: { name?: string };
  fee?: { amount: number; per: string };
  ageRange?: { min?: number; max?: number };
  maxAttendees?: number;
  recurring?: { frequency: string };
}

export default function EventsPage() {
  const { user } = useCurrentUser();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    fetch("/api/events")
      .then((res) => (res.ok ? res.json() : { events: [] }))
      .then((data) => { setEvents(data?.events ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filteredEvents = categoryFilter
    ? events.filter((event) => event.category === categoryFilter)
    : events;

  const activeCategories = [...new Set(events.map((event) => event.category).filter(Boolean))];

  return (
    <section className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Events" }]} />
      <PageGuide pageKey="events">
        <div className="flex flex-wrap items-center justify-between gap-4 flex-1">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Events</h1>
          {user && (
            <div className="flex gap-2">
              <Link href="/events/drafts" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                My drafts
              </Link>
              <Link href="/events/new" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                Create event
              </Link>
            </div>
          )}
        </div>
      </PageGuide>

      {/* Category filter */}
      {activeCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter("")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              !categoryFilter ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All
          </button>
          {activeCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat === categoryFilter ? "" : cat!)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                categoryFilter === cat ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {categoryLabels[cat!] ?? cat}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4">
        {loading ? (
          <p className="text-sm text-slate-500">Loading events...</p>
        ) : filteredEvents.length === 0 ? (
          <p className="text-sm text-slate-500">
            {categoryFilter ? "No events in this category." : "No published events yet."}
          </p>
        ) : (
          filteredEvents.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">{event.title}</h2>
                    {event.category && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        {categoryLabels[event.category] ?? event.category}
                      </span>
                    )}
                    {event.recurring && (
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">
                        {event.recurring.frequency}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">
                    {event.startDate ? new Date(event.startDate).toLocaleString() : "Schedule TBD"}
                    {event.location?.name ? ` \u2022 ${event.location.name}` : ""}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    {event.fee && event.fee.amount > 0 && (
                      <span>${event.fee.amount} / {event.fee.per}</span>
                    )}
                    {event.ageRange && (event.ageRange.min !== undefined || event.ageRange.max !== undefined) && (
                      <span>
                        Ages {event.ageRange.min ?? 0}–{event.ageRange.max ?? "18+"}
                      </span>
                    )}
                    {event.maxAttendees && (
                      <span>Max {event.maxAttendees} attendees</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
