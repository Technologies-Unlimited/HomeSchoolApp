"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/client";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageGuide } from "@/components/page-guide";

interface EventItem {
  id: string;
  title: string;
  startDate?: string;
  status?: string;
  rsvpStatus?: string;
  location?: { name?: string };
  category?: string;
}

export default function MyEventsPage() {
  const { user, loading: authLoading } = useCurrentUser();
  const [rsvpd, setRsvpd] = useState<EventItem[]>([]);
  const [created, setCreated] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch("/api/events/mine")
      .then((r) => (r.ok ? r.json() : { rsvpd: [], created: [] }))
      .then((d) => {
        setRsvpd(d?.rsvpd ?? []);
        setCreated(d?.created ?? []);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading) return <p className="text-sm text-slate-500">Loading...</p>;
  if (!user) return <p className="text-sm text-slate-500">Sign in to see your events.</p>;

  const statusBadge = (status?: string) => {
    if (status === "going") return <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">Going</span>;
    if (status === "maybe") return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Maybe</span>;
    if (status === "waitlisted") return <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Waitlisted</span>;
    return null;
  };

  const eventCard = (event: EventItem) => (
    <Link key={event.id} href={`/events/${event.id}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 hover:shadow-sm">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-slate-800">{event.title}</p>
        {statusBadge(event.rsvpStatus)}
        {event.status === "draft" && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Draft</span>}
        {event.status === "pending" && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Pending</span>}
      </div>
      <div className="text-xs text-slate-400">
        {event.startDate ? new Date(event.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "TBD"}
        {event.location?.name ? ` — ${event.location.name}` : ""}
      </div>
    </Link>
  );

  return (
    <section className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "My Events" }]} />
      <PageGuide pageKey="my_events">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">My Events</h1>
      </PageGuide>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <>
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Events I'm attending</h2>
            {rsvpd.length === 0 ? (
              <p className="text-sm text-slate-500">You haven't RSVP'd to any upcoming events yet.</p>
            ) : (
              <div className="grid gap-2">{rsvpd.map(eventCard)}</div>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Events I created</h2>
            {created.length === 0 ? (
              <p className="text-sm text-slate-500">You haven't created any events yet.</p>
            ) : (
              <div className="grid gap-2">{created.map(eventCard)}</div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
