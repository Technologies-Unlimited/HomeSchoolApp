"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/client";
import { Breadcrumb } from "@/components/breadcrumb";
import { EVENT_CATEGORIES } from "@/lib/validation";
import { LocationPicker } from "@/components/location-picker";
import { DIETARY_OPTIONS } from "@/lib/dietary-options";
import { GRADE_OPTIONS } from "@/lib/grade-options";

const categoryLabels: Record<string, string> = {
  "field-trip": "Field Trip",
  "co-op": "Co-op Class",
  "park-day": "Park Day",
  sports: "Sports",
  social: "Social Event",
  "science-fair": "Science Fair",
  "book-club": "Book Club",
  "arts-crafts": "Arts & Crafts",
  volunteer: "Volunteer",
  meeting: "Meeting",
  other: "Other",
};

export default function NewEventPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading...</p>}>
      <NewEventForm />
    </Suspense>
  );
}

function NewEventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const duplicateId = searchParams.get("duplicate");
  const { user, loading } = useCurrentUser();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
  const [location, setLocation] = useState({ name: "", address: "" });
  const [dietaryAccommodations, setDietaryAccommodations] = useState<string[]>([]);

  const isAdminUser = user?.role === "admin" || user?.role === "super_admin";

  // Pre-fill from duplicated event
  useEffect(() => {
    if (!duplicateId || !user) return;
    fetch(`/api/events/${duplicateId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.event) return;
        const event = d.event;
        // Pre-fill the form fields via DOM (the form uses uncontrolled inputs)
        const form = document.querySelector("form");
        if (!form) return;
        const setValue = (name: string, value: string) => {
          const input = form.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
          if (input) {
            input.value = value;
            input.dispatchEvent(new Event("change", { bubbles: true }));
          }
        };
        setValue("title", event.title ?? "");
        setValue("description", event.description ?? "");
        setValue("category", event.category ?? "other");
        if (event.fee?.amount) setValue("feeAmount", String(event.fee.amount));
        if (event.fee?.per) setValue("feePer", event.fee.per);
        if (event.fee?.notes) setValue("feeNotes", event.fee.notes);
        if (event.ageRange?.min) setValue("ageMin", String(event.ageRange.min));
        if (event.ageRange?.max) setValue("ageMax", String(event.ageRange.max));
        if (event.gradeRange?.min) setValue("gradeMin", event.gradeRange.min);
        if (event.gradeRange?.max) setValue("gradeMax", event.gradeRange.max);
        if (event.maxAttendees) setValue("maxAttendees", String(event.maxAttendees));
        if (event.location) setLocation({ name: event.location.name ?? "", address: event.location.address ?? "" });
        if (event.attachments?.length) setAttachments(event.attachments);
        if (event.dietaryAccommodations?.length) setDietaryAccommodations(event.dietaryAccommodations);
        if (event.fee || event.ageRange || event.maxAttendees || event.attachments?.length || event.dietaryAccommodations?.length) setShowAdvanced(true);
      })
      .catch(() => {});
  }, [duplicateId, user]);

  function addAttachment() {
    setAttachments((prev) => [...prev, { name: "", url: "" }]);
  }

  function updateAttachment(index: number, field: "name" | "url", value: string) {
    setAttachments((prev) => prev.map((attachment, attachmentIndex) =>
      attachmentIndex === index ? { ...attachment, [field]: value } : attachment
    ));
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, attachmentIndex) => attachmentIndex !== index));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const publishNow = form.get("publish") === "true";

    const feeAmount = parseFloat(form.get("feeAmount") as string);
    const ageMin = parseInt(form.get("ageMin") as string);
    const ageMax = parseInt(form.get("ageMax") as string);
    const gradeMin = (form.get("gradeMin") as string) || undefined;
    const gradeMax = (form.get("gradeMax") as string) || undefined;
    const maxAttendees = parseInt(form.get("maxAttendees") as string);
    const recurringFreq = form.get("recurringFrequency") as string;
    const recurringCount = parseInt(form.get("recurringCount") as string);

    const validAttachments = attachments.filter((a) => a.name && a.url);

    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        category: form.get("category") || undefined,
        startDate: form.get("startDate"),
        endDate: form.get("endDate") || undefined,
        location: {
          name: location.name || undefined,
          address: location.address || undefined,
        },
        status: publishNow ? "published" : "draft",
        fee: feeAmount > 0 ? {
          amount: feeAmount,
          per: form.get("feePer") || "person",
          notes: form.get("feeNotes") || undefined,
        } : undefined,
        ageRange: (ageMin >= 0 || ageMax > 0) ? {
          min: ageMin >= 0 ? ageMin : undefined,
          max: ageMax > 0 ? ageMax : undefined,
        } : undefined,
        gradeRange: (gradeMin || gradeMax) ? {
          min: gradeMin,
          max: gradeMax,
        } : undefined,
        maxAttendees: maxAttendees > 0 ? maxAttendees : undefined,
        recurring: recurringFreq ? {
          frequency: recurringFreq,
          endAfterCount: recurringCount > 0 ? recurringCount : undefined,
        } : undefined,
        attachments: validAttachments.length > 0 ? validAttachments : undefined,
        dietaryAccommodations: dietaryAccommodations.length > 0 ? dietaryAccommodations : undefined,
      }),
    });

    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data?.error ?? "Failed to create event.");
      return;
    }

    const data = await response.json();
    if (publishNow) {
      router.push(`/events/${data.event.id}`);
    } else {
      router.push("/events/drafts");
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;

  if (!user) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Sign in required</h1>
        <p className="mt-2 text-sm text-slate-600">Please sign in to create events.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Breadcrumb items={[{ label: "Events", href: "/events" }, { label: "Create event" }]} />
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="shrink-0 flex items-center justify-center h-9 w-9 rounded-full border border-slate-300 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Create event</h1>
      </div>

      <form className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
        {/* Basic info */}
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Title
          <input type="text" name="title" required className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500" />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Category
          <select name="category" className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-500">
            <option value="">Select a category...</option>
            {EVENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{categoryLabels[cat] ?? cat}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Description
          <textarea name="description" className="min-h-[120px] rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500" />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Start date
            <input type="datetime-local" name="startDate" required className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500" />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            End date
            <input type="datetime-local" name="endDate" className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500" />
          </label>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Location</p>
          <LocationPicker value={location} onChange={setLocation} />
        </div>

        {/* Advanced options toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
        >
          <span className={`transition-transform ${showAdvanced ? "rotate-90" : ""}`}>&#9654;</span>
          {showAdvanced ? "Hide" : "Show"} additional options
        </button>

        {showAdvanced && (
          <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            {/* Fee */}
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Fee</p>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Amount ($)
                <input type="number" name="feeAmount" min="0" step="0.01" defaultValue="" placeholder="0.00" className="h-9 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-slate-500" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Per
                <select name="feePer" className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-500">
                  <option value="person">Per person</option>
                  <option value="child">Per child</option>
                  <option value="family">Per family</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Payment notes
                <input type="text" name="feeNotes" placeholder="e.g. Venmo @name" className="h-9 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-slate-500" />
              </label>
            </div>

            {/* Age / Grade range */}
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Age & grade range</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Min age
                <input type="number" name="ageMin" min="0" max="18" defaultValue="" placeholder="Any" className="h-9 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-slate-500" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Max age
                <input type="number" name="ageMax" min="0" max="18" defaultValue="" placeholder="Any" className="h-9 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-slate-500" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Min grade
                <select name="gradeMin" className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-500">
                  <option value="">Any</option>
                  {GRADE_OPTIONS.filter((g) => g.value).map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Max grade
                <select name="gradeMax" className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-500">
                  <option value="">Any</option>
                  {GRADE_OPTIONS.filter((g) => g.value).map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </label>
            </div>

            {/* Capacity */}
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Max attendees (optional)
              <input type="number" name="maxAttendees" min="1" defaultValue="" placeholder="Unlimited" className="h-9 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-slate-500" />
            </label>

            {/* Recurring */}
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recurring</p>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Frequency
                <select name="recurringFrequency" className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-500">
                  <option value="">One-time event</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 2 weeks</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Repeat count
                <input type="number" name="recurringCount" min="1" max="52" defaultValue="" placeholder="e.g. 10" className="h-9 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-slate-500" />
              </label>
            </div>

            {/* Attachments */}
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Attachments</p>
            <div className="space-y-2">
              {attachments.map((attachment, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={attachment.name}
                    onChange={(e) => updateAttachment(index, "name", e.target.value)}
                    placeholder="Name (e.g. Waiver form)"
                    className="h-9 flex-1 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-slate-500"
                  />
                  <input
                    type="url"
                    value={attachment.url}
                    onChange={(e) => updateAttachment(index, "url", e.target.value)}
                    placeholder="URL (https://...)"
                    className="h-9 flex-[2] rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-slate-500"
                  />
                  <button type="button" onClick={() => removeAttachment(index)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                </div>
              ))}
              <button type="button" onClick={addAttachment} className="text-sm text-slate-500 transition hover:text-slate-700">+ Add attachment link</button>
            </div>

            {/* Dietary accommodations */}
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Dietary accommodations</p>
            <p className="text-xs text-slate-500 -mt-2">Select which dietary needs this event can accommodate. Families with children who have these needs will know this event is safe for them.</p>
            <div className="flex flex-wrap gap-1.5">
              {DIETARY_OPTIONS.map((option) => {
                const selected = dietaryAccommodations.includes(option.value);
                return (
                  <button key={option.value} type="button" onClick={() => setDietaryAccommodations(selected ? dietaryAccommodations.filter((d) => d !== option.value) : [...dietaryAccommodations, option.value])} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${selected ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-500 hover:text-slate-700"}`}>
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600" role="alert" aria-live="polite">{error}</p>}
        <input type="hidden" name="publish" value="false" />
        <div className="flex gap-3">
          <button
            type="submit"
            className="h-11 flex-1 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save as draft"}
          </button>
          {isAdminUser && (
            <button
              type="submit"
              onClick={(clickEvent) => {
                const formEl = (clickEvent.target as HTMLButtonElement).closest("form");
                const hidden = formEl?.querySelector<HTMLInputElement>("input[name=publish]");
                if (hidden) hidden.value = "true";
              }}
              className="h-11 flex-1 rounded-lg bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={saving}
            >
              {saving ? "Publishing..." : "Publish now"}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
