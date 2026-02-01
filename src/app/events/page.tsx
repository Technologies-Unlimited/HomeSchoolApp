"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/client";

interface EventItem {
  id: string;
  title: string;
  startDate?: string;
  status?: string;
  location?: { name?: string };
}

export default function EventsPage() {
  const { user } = useCurrentUser();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => (res.ok ? res.json() : { events: [] }))
      .then((data) => {
        setEvents(data?.events ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Events
          </h1>
          {user && (
            <Link
              href="/events/new"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Create event
            </Link>
          )}
        </div>
        <p className="text-sm text-slate-600">
          Plan upcoming gatherings and track RSVPs across the community.
        </p>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <p className="text-sm text-slate-500">Loading events...</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-slate-500">No published events yet.</p>
        ) : (
          events.map((event) => (
            <article
              key={event.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-slate-900">
                    <Link
                      href={`/events/${event.id}`}
                      className="transition hover:text-slate-700"
                    >
                      {event.title}
                    </Link>
                  </h2>
                  <p className="text-sm text-slate-600">
                    {event.startDate
                      ? new Date(event.startDate).toLocaleString()
                      : "Schedule TBD"}{" "}
                    • {event.location?.name ?? "Location TBD"}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {event.status ?? "published"}
                </span>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
