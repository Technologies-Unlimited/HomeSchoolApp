"use client";

import { use, useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/client";
import { Breadcrumb } from "@/components/breadcrumb";
import { FormBuilder } from "@/components/form-builder";
import { FormRenderer } from "@/components/form-renderer";
import { FormResponses } from "@/components/form-responses";
import type { FormField, FormData } from "@/lib/form-types";
import { VolunteerSlots } from "@/components/volunteer-slots";
import { CarpoolBoard } from "@/components/carpool-board";

interface EventDetailProps {
  params: Promise<{ id: string }>;
}

interface EventDetail {
  id: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: { name?: string; address?: string };
  status?: string;
  creatorId?: string;
  category?: string;
  fee?: { amount: number; per: string; notes?: string };
  ageRange?: { min?: number; max?: number };
  maxAttendees?: number;
  recurring?: { frequency: string; endAfterCount?: number };
  attachments?: { name: string; url: string }[];
}

const categoryLabels: Record<string, string> = {
  "field-trip": "Field Trip", "co-op": "Co-op", "park-day": "Park Day",
  sports: "Sports", social: "Social", "science-fair": "Science Fair",
  "book-club": "Book Club", "arts-crafts": "Arts & Crafts",
  volunteer: "Volunteer", meeting: "Meeting", other: "Other",
};

interface CommentItem {
  id: string;
  userId?: string;
  userName?: string;
  content: string;
  createdAt?: string;
}

interface AttendeeItem {
  id: string;
  name: string;
  status: string;
}

export default function EventDetailPage({ params: paramsPromise }: EventDetailProps) {
  const params = use(paramsPromise);
  const { user } = useCurrentUser();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin: edit event
  const [editing, setEditing] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "", description: "", startDate: "", endDate: "",
    locationName: "", locationAddress: "",
  });

  // Admin: attendees
  const [attendees, setAttendees] = useState<AttendeeItem[]>([]);
  const [attendeesLoaded, setAttendeesLoaded] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);

  // Form state
  const [eventForm, setEventForm] = useState<FormData | null>(null);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [showResponses, setShowResponses] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/events/${params.id}`).then((res) => res.json()),
      fetch(`/api/comments/${params.id}`).then((res) => res.json()),
      fetch(`/api/rsvps/event/${params.id}/mine`).then((res) =>
        res.ok ? res.json() : { rsvp: null }
      ),
      fetch(`/api/forms/${params.id}`).then((res) =>
        res.ok ? res.json() : { form: null }
      ),
    ])
      .then(([eventData, commentData, rsvpData, formData]) => {
        const eventDetail = eventData?.event ?? null;
        setEvent(eventDetail);
        setComments(commentData?.comments ?? []);
        setRsvpStatus(rsvpData?.rsvp?.status ?? null);
        setEventForm(formData?.form ?? null);
        if (eventDetail) {
          setEditForm({
            title: eventDetail.title ?? "",
            description: eventDetail.description ?? "",
            startDate: eventDetail.startDate
              ? new Date(eventDetail.startDate).toISOString().slice(0, 16) : "",
            endDate: eventDetail.endDate
              ? new Date(eventDetail.endDate).toISOString().slice(0, 16) : "",
            locationName: eventDetail.location?.name ?? "",
            locationAddress: eventDetail.location?.address ?? "",
          });
        }
        setLoading(false);
      })
      .catch(() => { setError("Failed to load event."); setLoading(false); });
  }, [params.id]);

  const isOwner = user && event?.creatorId && user.id === event.creatorId.toString();
  const isAdminUser = user?.role === "admin" || user?.role === "super_admin";
  const canManage = isOwner || isAdminUser;

  // Load attendees for admin
  useEffect(() => {
    if (!canManage || attendeesLoaded || !event) return;
    fetch(`/api/events/${params.id}/attendees`)
      .then((res) => (res.ok ? res.json() : { attendees: [] }))
      .then((data) => { setAttendees(data?.attendees ?? []); setAttendeesLoaded(true); })
      .catch(() => setAttendeesLoaded(true));
  }, [canManage, attendeesLoaded, event, params.id]);

  async function handleEditSubmit(submitEvent: React.FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setEditSaving(true);
    setError(null);
    const response = await fetch(`/api/events/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editForm.title,
        description: editForm.description || undefined,
        startDate: editForm.startDate,
        endDate: editForm.endDate || undefined,
        location: { name: editForm.locationName || undefined, address: editForm.locationAddress || undefined },
      }),
    });
    setEditSaving(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data?.error ?? "Failed to update event.");
      return;
    }
    const data = await response.json();
    setEvent(data.event);
    setEditing(false);
  }

  async function handleRsvp(status: string) {
    setError(null);
    const response = await fetch("/api/rsvps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: params.id, status }),
    });
    if (!response.ok) { setError("RSVP failed."); return; }
    setRsvpStatus(status);
    setAttendeesLoaded(false);
  }

  async function handleComment(eventSubmit: React.FormEvent<HTMLFormElement>) {
    eventSubmit.preventDefault();
    setError(null);
    const formElement = eventSubmit.currentTarget;
    const form = new FormData(formElement);
    const content = form.get("comment");
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: params.id, content }),
    });
    if (!response.ok) { setError("Failed to post comment."); return; }
    const data = await response.json();
    setComments((prev) => [data.comment, ...prev]);
    formElement.reset();
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    const response = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    if (response.ok) {
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    } else {
      setError("Failed to delete comment.");
    }
  }

  async function handleSaveForm(fields: FormField[]) {
    setFormSaving(true);
    setError(null);
    if (eventForm) {
      const response = await fetch(`/api/forms/by-id/${eventForm.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
      setFormSaving(false);
      if (!response.ok) { setError("Failed to update form."); return; }
      setEventForm((prev) => (prev ? { ...prev, fields } : prev));
    } else {
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: params.id, fields }),
      });
      setFormSaving(false);
      if (!response.ok) { setError("Failed to create form."); return; }
      const data = await response.json();
      setEventForm(data.form);
    }
    setShowFormBuilder(false);
  }

  async function handleDeleteForm() {
    if (!eventForm || !confirm("Delete this sign-up form and all its responses?")) return;
    const response = await fetch(`/api/forms/by-id/${eventForm.id}`, { method: "DELETE" });
    if (response.ok) {
      setEventForm(null);
      setShowFormBuilder(false);
      setShowResponses(false);
    } else {
      setError("Failed to delete form.");
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading event...</p>;
  if (!event) return <p className="text-sm text-slate-500">Event not found.</p>;

  const goingCount = attendees.filter((a) => a.status === "going").length;

  return (
    <section className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: "Events", href: "/events" }, { label: event.title }]} />

      {/* Event header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{event.title}</h1>
        <p className="text-sm text-slate-600">
          {event.startDate ? new Date(event.startDate).toLocaleString() : "Schedule TBD"}
          {event.location?.name ? ` \u2022 ${event.location.name}` : ""}
        </p>
        {event.description && <p className="text-sm text-slate-600">{event.description}</p>}
        <div className="flex flex-wrap gap-2">
          {event.status && event.status !== "published" && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              {event.status}
            </span>
          )}
          {event.category && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {categoryLabels[event.category] ?? event.category}
            </span>
          )}
          {event.recurring && (
            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
              Recurring ({event.recurring.frequency})
            </span>
          )}
          {event.fee && event.fee.amount > 0 && (
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              ${event.fee.amount} / {event.fee.per}
              {event.fee.notes ? ` — ${event.fee.notes}` : ""}
            </span>
          )}
          {event.ageRange && (event.ageRange.min !== undefined || event.ageRange.max !== undefined) && (
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
              Ages {event.ageRange.min ?? 0}–{event.ageRange.max ?? "18+"}
            </span>
          )}
          {event.maxAttendees && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Max {event.maxAttendees}
            </span>
          )}
        </div>
        {event.attachments && event.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {event.attachments.map((attachment, index) => (
              <a
                key={index}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                📎 {attachment.name}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ─── ADMIN / OWNER PANEL ─── */}
      {canManage && (
        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Event management
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

            {/* Card: Edit event */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Edit event</h3>
              <p className="mt-1 text-xs text-slate-500">Update title, dates, location, and description.</p>
              <button
                onClick={() => setEditing(true)}
                className="mt-3 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                Edit details
              </button>
            </div>

            {/* Card: Attendees */}
            <button
              onClick={() => setShowAttendees(!showAttendees)}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-left transition hover:border-slate-300 hover:shadow-md cursor-pointer"
            >
              <h3 className="text-sm font-semibold text-slate-900">Attendees</h3>
              <p className="mt-1 text-xs text-slate-500">
                {showAttendees ? "Click to collapse" : "Click to view who's coming"}
              </p>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-2xl font-bold text-slate-900">{goingCount}</span>
                <span className="text-xs text-slate-500">going</span>
                {attendees.length > goingCount && (
                  <>
                    <span className="text-lg font-bold text-slate-400">{attendees.length - goingCount}</span>
                    <span className="text-xs text-slate-400">other RSVPs</span>
                  </>
                )}
              </div>
            </button>

            {/* Card: Sign-up form management */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Sign-up form</h3>
              {eventForm ? (
                <>
                  <p className="mt-1 text-xs text-slate-500">
                    {eventForm.fields.length} question{eventForm.fields.length !== 1 ? "s" : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => { setShowFormBuilder(true); setShowResponses(false); }}
                      className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Edit form
                    </button>
                    <button
                      onClick={() => { setShowResponses(!showResponses); setShowFormBuilder(false); }}
                      className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      {showResponses ? "Hide responses" : "View responses"}
                    </button>
                    <button
                      onClick={handleDeleteForm}
                      className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-1 text-xs text-slate-500">No form yet. Collect info from attendees.</p>
                  <button
                    onClick={() => setShowFormBuilder(true)}
                    className="mt-3 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                  >
                    Create form
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Expanded panels */}
          {showAttendees && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Attendee list</h3>
              {attendees.length === 0 ? (
                <p className="text-sm text-slate-500">No RSVPs yet.</p>
              ) : (
                <div className="space-y-2">
                  {["going", "maybe", "not-going"].map((statusGroup) => {
                    const group = attendees.filter((a) => a.status === statusGroup);
                    if (group.length === 0) return null;
                    const label = statusGroup === "not-going" ? "Can't go" : statusGroup.charAt(0).toUpperCase() + statusGroup.slice(1);
                    const dotColor = statusGroup === "going" ? "bg-green-500" : statusGroup === "maybe" ? "bg-amber-400" : "bg-slate-400";
                    return (
                      <div key={statusGroup}>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          {label} ({group.length})
                        </p>
                        <div className="grid gap-1">
                          {group.map((attendee) => (
                            <div key={attendee.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                              <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                              {attendee.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {editing && (
            <form onSubmit={handleEditSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Title
                <input type="text" required value={editForm.title}
                  onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                  className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500" />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Description
                <textarea value={editForm.description}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  className="min-h-[100px] rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500" />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Start date
                  <input type="datetime-local" required value={editForm.startDate}
                    onChange={(e) => setEditForm((p) => ({ ...p, startDate: e.target.value }))}
                    className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500" />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  End date
                  <input type="datetime-local" value={editForm.endDate}
                    onChange={(e) => setEditForm((p) => ({ ...p, endDate: e.target.value }))}
                    className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500" />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Location name
                  <input type="text" value={editForm.locationName}
                    onChange={(e) => setEditForm((p) => ({ ...p, locationName: e.target.value }))}
                    className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500" />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Address
                  <input type="text" value={editForm.locationAddress}
                    onChange={(e) => setEditForm((p) => ({ ...p, locationAddress: e.target.value }))}
                    className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500" />
                </label>
              </div>
              {error && <p className="text-sm text-red-600" role="alert" aria-live="polite">{error}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={editSaving}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
                  {editSaving ? "Saving..." : "Save changes"}
                </button>
                <button type="button" onClick={() => setEditing(false)}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {showFormBuilder && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">
                {eventForm ? "Edit sign-up form" : "Create sign-up form"}
              </h3>
              <FormBuilder
                initialFields={eventForm?.fields}
                onSave={handleSaveForm}
                onCancel={() => setShowFormBuilder(false)}
                saving={formSaving}
              />
            </div>
          )}

          {showResponses && eventForm && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Form responses</h3>
              <FormResponses formId={eventForm.id} fields={eventForm.fields} />
            </div>
          )}
        </div>
      )}

      {/* ─── ATTENDEE VIEW ─── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* RSVP card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">RSVP</h2>
          <p className="mt-2 text-sm text-slate-600">
            {canManage ? "Your RSVP status for this event." : "Let the host know your attendance status."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["going", "maybe", "not-going"].map((status) => (
              <button
                key={status}
                onClick={() => handleRsvp(status)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  rsvpStatus === status
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                disabled={!user}
              >
                {status === "not-going" ? "Can't go" : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          {!user && (
            <p className="mt-3 text-xs text-slate-500">Sign in to RSVP for this event.</p>
          )}
        </div>

        {/* Sign-up form card (attendee view — only if form exists and user is not viewing admin panel) */}
        {eventForm && eventForm.fields?.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Sign-up form</h2>
            <div className="mt-4">
              {user ? (
                formSubmitted ? (
                  <p className="text-sm text-green-600">Response submitted. Thank you!</p>
                ) : (
                  <FormRenderer
                    formId={eventForm.id}
                    fields={eventForm.fields}
                    onSubmitted={() => setFormSubmitted(true)}
                  />
                )
              ) : (
                <p className="text-sm text-slate-500">Sign in to fill out this form.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Volunteer slots + Carpool */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Volunteer sign-ups</h2>
          <VolunteerSlots eventId={params.id} canManage={!!canManage} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Carpools</h2>
          <CarpoolBoard eventId={params.id} />
        </div>
      </div>

      {/* Discussion — full width */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Discussion</h2>
        <form className="mt-4 space-y-3" onSubmit={handleComment}>
          <textarea
            name="comment"
            className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none focus:border-slate-400"
            placeholder="Write a comment..."
            required
            minLength={3}
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
          <p className="mt-3 text-xs text-slate-500">Sign in to join the discussion.</p>
        )}
        <div className="mt-6 space-y-3">
          {comments.length === 0 ? (
            <p className="text-sm text-slate-500">No comments yet.</p>
          ) : (
            comments.map((comment) => {
              const canDeleteComment =
                user &&
                (comment.userId?.toString() === user.id ||
                  user.role === "admin" ||
                  user.role === "super_admin");
              return (
                <div key={comment.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-800">{comment.userName ?? "Member"}</p>
                      <p className="text-slate-600">{comment.content}</p>
                    </div>
                    {canDeleteComment && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="shrink-0 text-xs text-red-500 transition hover:text-red-700"
                        aria-label={`Delete comment by ${comment.userName ?? "Member"}`}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert" aria-live="polite">{error}</p>
      )}
    </section>
  );
}
