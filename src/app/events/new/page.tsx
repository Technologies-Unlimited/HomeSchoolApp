"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useCurrentUser } from "@/lib/client";
import { Breadcrumb } from "@/components/breadcrumb";

export default function NewEventPage() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isAdminUser = user?.role === "admin" || user?.role === "super_admin";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const publishNow = form.get("publish") === "true";

    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        startDate: form.get("startDate"),
        endDate: form.get("endDate") || undefined,
        location: {
          name: form.get("location"),
          address: form.get("address"),
        },
        status: publishNow ? "published" : "draft",
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

  if (loading) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  if (!user) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">
          Sign in required
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Please sign in to create events.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Breadcrumb items={[{ label: "Events", href: "/events" }, { label: "Create event" }]} />
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Create event
        </h1>
        <p className="text-sm text-slate-600">
          Draft your event details and submit for approval when ready.
        </p>
      </div>

      <form
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        onSubmit={handleSubmit}
      >
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Title
          <input
            type="text"
            name="title"
            required
            className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Description
          <textarea
            name="description"
            className="min-h-[120px] rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Start date
            <input
              type="datetime-local"
              name="startDate"
              required
              className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            End date
            <input
              type="datetime-local"
              name="endDate"
              className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500"
            />
          </label>
        </div>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Location name
          <input
            type="text"
            name="location"
            className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Address
          <input
            type="text"
            name="address"
            className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500"
          />
        </label>
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
              onClick={(event) => {
                const form = (event.target as HTMLButtonElement).closest("form");
                const hidden = form?.querySelector<HTMLInputElement>("input[name=publish]");
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
