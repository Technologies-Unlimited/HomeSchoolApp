"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useCurrentUser } from "@/lib/client";
import { Breadcrumb } from "@/components/breadcrumb";

interface PendingEvent {
  id: string;
  title: string;
  startDate?: string;
  status?: string;
}

export default function AdminPage() {
  const { user, loading } = useCurrentUser();
  const [pending, setPending] = useState<PendingEvent[]>([]);
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadPending = useCallback(() => {
    fetch("/api/events/pending")
      .then((res) => (res.ok ? res.json() : { events: [] }))
      .then((data) => setPending(data?.events ?? []))
      .catch(() => setError("Failed to load pending events."));
  }, []);

  useEffect(() => {
    if (!user) return;
    loadPending();
    fetch("/api/admin/notes")
      .then((res) => (res.ok ? res.json() : { content: "" }))
      .then((data) => setNotes(data?.content ?? ""));
  }, [user, loadPending]);

  function showSuccess(message: string) {
    setSuccess(message);
    setError(null);
    setTimeout(() => setSuccess(null), 3000);
  }

  async function handleApprove(eventId: string) {
    setActionLoading(eventId);
    const response = await fetch(`/api/events/${eventId}/approve`, { method: "POST" });
    setActionLoading(null);
    if (response.ok) {
      setPending((prev) => prev.filter((event) => event.id !== eventId));
      showSuccess("Event approved and published.");
    } else {
      setError("Failed to approve event.");
    }
  }

  async function handleReject(eventId: string) {
    const reason = prompt("Rejection reason (optional):");
    if (reason === null) return;
    setActionLoading(eventId);
    const response = await fetch(`/api/events/${eventId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setActionLoading(null);
    if (response.ok) {
      setPending((prev) => prev.filter((event) => event.id !== eventId));
      showSuccess("Event rejected and returned to draft.");
    } else {
      setError("Failed to reject event.");
    }
  }

  async function handleSaveNotes() {
    setNotesSaving(true);
    await fetch("/api/admin/notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: notes }),
    });
    setNotesSaving(false);
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  const isAdminUser = user?.role === "admin" || user?.role === "super_admin";

  if (!user || !isAdminUser) {
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
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Admin" }]} />
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Admin dashboard
        </h1>
        <p className="text-sm text-slate-600">
          Review submissions, manage members, and monitor system health.
        </p>
        <Link
          href="/admin/users"
          className="inline-block rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
        >
          Manage users
        </Link>
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
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      {item.title}
                    </span>
                    {item.startDate && (
                      <span className="text-xs text-slate-500">
                        {new Date(item.startDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(item.id)}
                      disabled={actionLoading === item.id}
                      className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                    >
                      {actionLoading === item.id ? "..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleReject(item.id)}
                      disabled={actionLoading === item.id}
                      className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                    >
                      {actionLoading === item.id ? "..." : "Reject"}
                    </button>
                  </div>
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
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          <button
            onClick={handleSaveNotes}
            disabled={notesSaving}
            className="mt-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {notesSaving ? "Saving..." : "Save notes"}
          </button>
        </div>
      </div>
      {success && (
        <p className="text-sm text-green-600" role="status" aria-live="polite">
          {success}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </section>
  );
}
