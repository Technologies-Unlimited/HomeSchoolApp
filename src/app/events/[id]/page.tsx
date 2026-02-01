"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useCurrentUser } from "@/lib/client";

interface EventDetailProps {
  params: { id: string };
}

interface EventDetail {
  id: string;
  title: string;
  description?: string;
  startDate?: string;
  location?: { name?: string; address?: string };
  status?: string;
}

interface CommentItem {
  id: string;
  userName?: string;
  content: string;
  createdAt?: string;
}

export default function EventDetailPage({ params }: EventDetailProps) {
  const { user } = useCurrentUser();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/events/${params.id}`).then((res) => res.json()),
      fetch(`/api/comments/${params.id}`).then((res) => res.json()),
      fetch(`/api/rsvps/event/${params.id}/mine`).then((res) =>
        res.ok ? res.json() : { rsvp: null }
      ),
    ])
      .then(([eventData, commentData, rsvpData]) => {
        setEvent(eventData?.event ?? null);
        setComments(commentData?.comments ?? []);
        setRsvpStatus(rsvpData?.rsvp?.status ?? null);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load event.");
        setLoading(false);
      });
  }, [params.id]);

  async function handleRsvp(status: string) {
    setError(null);
    const response = await fetch("/api/rsvps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: params.id, status }),
    });
    if (!response.ok) {
      setError("RSVP failed.");
      return;
    }
    setRsvpStatus(status);
  }

  async function handleComment(eventSubmit: FormEvent<HTMLFormElement>) {
    eventSubmit.preventDefault();
    setError(null);
    const form = new FormData(eventSubmit.currentTarget);
    const content = form.get("comment");

    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: params.id, content }),
    });

    if (!response.ok) {
      setError("Failed to post comment.");
      return;
    }

    const data = await response.json();
    setComments((prev) => [data.comment, ...prev]);
    eventSubmit.currentTarget.reset();
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading event...</p>;
  }

  if (!event) {
    return <p className="text-sm text-slate-500">Event not found.</p>;
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          Event details
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          {event.title}
        </h1>
        <p className="text-sm text-slate-600">
          {event.startDate
            ? new Date(event.startDate).toLocaleString()
            : "Schedule TBD"}{" "}
          • {event.location?.name ?? "Location TBD"}
        </p>
        {event.description && (
          <p className="text-sm text-slate-600">{event.description}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">RSVP</h2>
          <p className="mt-2 text-sm text-slate-600">
            Let the host know your attendance status.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["going", "maybe", "not-going"].map((status) => (
              <button
                key={status}
                onClick={() => handleRsvp(status)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  rsvpStatus === status
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
                disabled={!user}
              >
                {status === "not-going" ? "Can't go" : status}
              </button>
            ))}
          </div>
          {!user && (
            <p className="mt-3 text-xs text-slate-500">
              Sign in to RSVP for this event.
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Discussion</h2>
          <form className="mt-4 space-y-3" onSubmit={handleComment}>
            <textarea
              name="comment"
              className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none focus:border-slate-400"
              placeholder="Write a comment..."
              required
              disabled={!user}
            />
            <button
              type="submit"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              disabled={!user}
            >
              Post comment
            </button>
          </form>
          {!user && (
            <p className="mt-3 text-xs text-slate-500">
              Sign in to join the discussion.
            </p>
          )}
          <div className="mt-6 space-y-3">
            {comments.length === 0 ? (
              <p className="text-sm text-slate-500">No comments yet.</p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  <p className="font-semibold text-slate-800">
                    {comment.userName ?? "Member"}
                  </p>
                  <p className="text-slate-600">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
