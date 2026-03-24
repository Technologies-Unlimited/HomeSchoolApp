"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/client";
import { Breadcrumb } from "@/components/breadcrumb";

interface DraftEvent {
  id: string;
  title: string;
  status?: string;
  updatedAt?: string;
}

export default function DraftEventsPage() {
  const { user, loading } = useCurrentUser();
  const [drafts, setDrafts] = useState<DraftEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/events/drafts")
      .then((res) => (res.ok ? res.json() : { events: [] }))
      .then((data) => setDrafts(data?.events ?? []))
      .catch(() => setError("Failed to load drafts."));
  }, [user]);

  async function handleSubmitForReview(eventId: string) {
    setSubmittingId(eventId);
    setError(null);
    const response = await fetch(`/api/events/${eventId}/submit`, { method: "POST" });
    setSubmittingId(null);
    if (response.ok) {
      setDrafts((prev) => prev.filter((draft) => draft.id !== eventId));
    } else {
      setError("Failed to submit event for review.");
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  if (!user) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Sign in required</h1>
        <p className="mt-2 text-sm text-slate-600">Please sign in to view your drafts.</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: "Events", href: "/events" }, { label: "My drafts" }]} />
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          My drafts
        </h1>
        <p className="text-sm text-slate-600">
          Events you've created that haven't been published yet.
        </p>
      </div>

      <div className="grid gap-4">
        {drafts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">No draft events.</p>
            <Link
              href="/events/new"
              className="mt-3 inline-block rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Create event
            </Link>
          </div>
        ) : (
          drafts.map((draft) => (
            <div
              key={draft.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm"
            >
              <div>
                <Link
                  href={`/events/${draft.id}`}
                  className="font-semibold text-slate-900 transition hover:text-slate-700"
                >
                  {draft.title}
                </Link>
                {draft.updatedAt && (
                  <p className="text-xs text-slate-500">
                    Last updated: {new Date(draft.updatedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/events/${draft.id}`}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleSubmitForReview(draft.id)}
                  disabled={submittingId === draft.id}
                  className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {submittingId === draft.id ? "Submitting..." : "Submit for review"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </section>
  );
}
