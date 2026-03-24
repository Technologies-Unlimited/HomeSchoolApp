"use client";

import { useEffect, useState } from "react";
import { Breadcrumb } from "@/components/breadcrumb";

interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  location?: { name?: string; address?: string };
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load events");
        return res.json();
      })
      .then((data) => setEvents(data.events ?? []))
      .catch((err) => setError(err.message ?? "Failed to load events."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Calendar" }]} />
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Calendar
        </h1>
        <p className="text-sm text-slate-600">
          Keep the schedule organized for families and volunteers.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Upcoming</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Loading events...</p>
        ) : error ? (
          <p className="text-sm text-red-600" role="alert" aria-live="polite">
            {error}
          </p>
        ) : events.length === 0 ? (
          <p className="text-sm text-slate-500">No upcoming events.</p>
        ) : (
          <div className="grid gap-3">
            {events.map((event) => {
              const start = new Date(event.startDate);
              const dateLabel = start.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });
              const timeLabel = start.toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              });

              return (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  <span className="font-semibold">{dateLabel}</span>
                  <span>{event.title}</span>
                  <span className="text-slate-500">{timeLabel}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
