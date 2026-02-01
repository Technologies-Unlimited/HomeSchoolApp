"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/client";

interface PendingEvent {
  id: string;
  title: string;
  status?: string;
}

export default function AdminPage() {
  const { user, loading } = useCurrentUser();
  const [pending, setPending] = useState<PendingEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/events/pending")
      .then((res) => (res.ok ? res.json() : { events: [] }))
      .then((data) => setPending(data?.events ?? []))
      .catch(() => setError("Failed to load pending events."));
  }, [user]);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  if (!user) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">
          Admin access required
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Please sign in with an admin account.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Admin dashboard
        </h1>
        <p className="text-sm text-slate-600">
          Review submissions, manage members, and monitor system health.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Event approvals
          </h2>
          <div className="mt-4 grid gap-3">
            {pending.length === 0 ? (
              <p className="text-sm text-slate-500">No pending events.</p>
            ) : (
              pending.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                >
                  <span className="font-semibold text-slate-800">
                    {item.title}
                  </span>
                  <span className="text-slate-500">
                    {item.status ?? "pending"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Team notes</h2>
          <p className="mt-2 text-sm text-slate-600">
            Capture moderation decisions and upcoming initiatives.
          </p>
          <textarea
            className="mt-4 h-32 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none focus:border-slate-400"
            placeholder="Add an admin note..."
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
