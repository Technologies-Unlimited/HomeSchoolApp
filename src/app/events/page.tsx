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
  rsvpStatus?: string;
  category?: string;
  location?: { name?: string };
  fee?: { amount: number; per: string };
  ageRange?: { min?: number; max?: number };
  maxAttendees?: number;
  recurring?: { frequency: string };
  updatedAt?: string;
}

export default function EventsPage() {
  const { user } = useCurrentUser();
  const [tab, setTab] = useState<"directory" | "drafts" | "my-events">("directory");

  // Directory state
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");

  // Drafts state
  const [drafts, setDrafts] = useState<EventItem[]>([]);
  const [draftsLoaded, setDraftsLoaded] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // My Events state
  const [rsvpd, setRsvpd] = useState<EventItem[]>([]);
  const [created, setCreated] = useState<EventItem[]>([]);
  const [myEventsLoaded, setMyEventsLoaded] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => (res.ok ? res.json() : { events: [] }))
      .then((data) => { setEvents(data?.events ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "drafts" && !draftsLoaded && user) {
      fetch("/api/events/drafts")
        .then((r) => (r.ok ? r.json() : { events: [] }))
        .then((d) => { setDrafts(d?.events ?? []); setDraftsLoaded(true); })
        .catch(() => setDraftsLoaded(true));
    }
  }, [tab, draftsLoaded, user]);

  useEffect(() => {
    if (tab === "my-events" && !myEventsLoaded && user) {
      fetch("/api/events/mine")
        .then((r) => (r.ok ? r.json() : { rsvpd: [], created: [] }))
        .then((d) => { setRsvpd(d?.rsvpd ?? []); setCreated(d?.created ?? []); setMyEventsLoaded(true); })
        .catch(() => setMyEventsLoaded(true));
    }
  }, [tab, myEventsLoaded, user]);

  async function handleSubmitForReview(eventId: string) {
    setSubmittingId(eventId);
    setError(null);
    const r = await fetch(`/api/events/${eventId}/submit`, { method: "POST" });
    setSubmittingId(null);
    if (r.ok) { setDrafts((p) => p.filter((d) => d.id !== eventId)); }
    else setError("Failed to submit event for review.");
  }

  const filteredEvents = categoryFilter
    ? events.filter((event) => event.category === categoryFilter)
    : events;

  const activeCategories = [...new Set(events.map((event) => event.category).filter(Boolean))];

  const statusBadge = (status?: string) => {
    if (status === "going") return <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">Going</span>;
    if (status === "maybe") return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Maybe</span>;
    if (status === "waitlisted") return <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Waitlisted</span>;
    return null;
  };

  return (
    <section className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Events" }]} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Events</h1>
        {user && (
          <Link href="/events/new" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
            Create event
          </Link>
        )}
      </div>

      {/* Tabs */}
      {user && (
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
          {([["directory", "Directory"], ["drafts", "My Drafts"], ["my-events", "My Events"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} data-active={tab === key} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      {/* ─── DIRECTORY TAB ─── */}
      {tab === "directory" && (
        <>
          <PageGuide pageKey="events_directory">
            <h2 className="text-lg font-semibold text-slate-900">Directory</h2>
          </PageGuide>
          {activeCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setCategoryFilter("")} data-active={!categoryFilter} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${!categoryFilter ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                All
              </button>
              {activeCategories.map((cat) => (
                <button key={cat} onClick={() => setCategoryFilter(cat === categoryFilter ? "" : cat!)} data-active={categoryFilter === cat} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${categoryFilter === cat ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
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
                <Link key={event.id} href={`/events/${event.id}`} className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-slate-900">{event.title}</h2>
                        {event.category && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{categoryLabels[event.category] ?? event.category}</span>}
                        {event.recurring && <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">{event.recurring.frequency}</span>}
                      </div>
                      <p className="text-sm text-slate-600">
                        {event.startDate ? new Date(event.startDate).toLocaleString() : "Schedule TBD"}
                        {event.location?.name ? ` \u2022 ${event.location.name}` : ""}
                      </p>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        {event.fee && event.fee.amount > 0 && <span>${event.fee.amount} / {event.fee.per}</span>}
                        {event.ageRange && (event.ageRange.min !== undefined || event.ageRange.max !== undefined) && <span>Ages {event.ageRange.min ?? 0}–{event.ageRange.max ?? "18+"}</span>}
                        {event.maxAttendees && <span>Max {event.maxAttendees} attendees</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </>
      )}

      {/* ─── DRAFTS TAB ─── */}
      {tab === "drafts" && (
        <div className="flex flex-col gap-6">
          <PageGuide pageKey="events_drafts">
            <h2 className="text-lg font-semibold text-slate-900">My Drafts</h2>
          </PageGuide>
        <div className="grid gap-4">
          {!draftsLoaded ? (
            <p className="text-sm text-slate-500">Loading drafts...</p>
          ) : drafts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">No draft events.</p>
              <Link href="/events/new" className="mt-3 inline-block rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                Create event
              </Link>
            </div>
          ) : (
            drafts.map((draft) => (
              <div key={draft.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
                <div>
                  <Link href={`/events/${draft.id}`} className="font-semibold text-slate-900 transition hover:text-slate-700">
                    {draft.title}
                  </Link>
                  {draft.status === "pending" && <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Pending review</span>}
                  {draft.updatedAt && <p className="text-xs text-slate-500">Last updated: {new Date(draft.updatedAt).toLocaleDateString()}</p>}
                </div>
                <div className="flex gap-2">
                  <Link href={`/events/${draft.id}`} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
                    Edit
                  </Link>
                  {draft.status !== "pending" && (
                    <button onClick={() => handleSubmitForReview(draft.id)} disabled={submittingId === draft.id} className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
                      {submittingId === draft.id ? "Submitting..." : "Submit for review"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      )}

      {/* ─── MY EVENTS TAB ─── */}
      {tab === "my-events" && (
        <div className="flex flex-col gap-6">
          <PageGuide pageKey="events_mine">
            <h2 className="text-lg font-semibold text-slate-900">My Events</h2>
          </PageGuide>
          {!myEventsLoaded ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : (
            <>
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-900">Events I'm attending</h2>
                {rsvpd.length === 0 ? (
                  <p className="text-sm text-slate-500">You haven't RSVP'd to any upcoming events yet.</p>
                ) : (
                  <div className="grid gap-2">
                    {rsvpd.map((event) => (
                      <Link key={event.id} href={`/events/${event.id}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 hover:shadow-sm">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-800">{event.title}</p>
                          {statusBadge(event.rsvpStatus)}
                        </div>
                        <div className="text-xs text-slate-400">
                          {event.startDate ? new Date(event.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "TBD"}
                          {event.location?.name ? ` — ${event.location.name}` : ""}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-900">Events I created</h2>
                {created.length === 0 ? (
                  <p className="text-sm text-slate-500">You haven't created any events yet.</p>
                ) : (
                  <div className="grid gap-2">
                    {created.map((event) => (
                      <Link key={event.id} href={`/events/${event.id}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 hover:shadow-sm">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-800">{event.title}</p>
                          {event.status === "draft" && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Draft</span>}
                          {event.status === "pending" && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Pending</span>}
                          {statusBadge(event.rsvpStatus)}
                        </div>
                        <div className="text-xs text-slate-400">
                          {event.startDate ? new Date(event.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "TBD"}
                          {event.location?.name ? ` — ${event.location.name}` : ""}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
