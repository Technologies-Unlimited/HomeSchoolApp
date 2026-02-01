"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useCurrentUser } from "@/lib/client";

export default function ProfilePage() {
  const { user, loading } = useCurrentUser();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  useEffect(() => {
    if (!user) return;
    setFormState({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      phone: user.phone ?? "",
    });
  }, [user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);

    const response = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formState),
    });

    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data?.error ?? "Failed to update profile.");
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
          Please sign in to manage your profile.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Profile
        </h1>
        <p className="text-sm text-slate-600">
          Update family details and contact preferences.
        </p>
      </div>

      <form
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Parent name
          <input
            type="text"
            name="parentName"
            className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500"
            value={formState.firstName}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, firstName: event.target.value }))
            }
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Phone
          <input
            type="tel"
            name="phone"
            className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500"
            value={formState.phone}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, phone: event.target.value }))
            }
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
          Last name
          <input
            type="text"
            name="lastName"
            className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500"
            value={formState.lastName}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, lastName: event.target.value }))
            }
          />
        </label>
        {error && (
          <p className="text-sm text-red-600 md:col-span-2">{error}</p>
        )}
        <button
          type="submit"
          className="h-11 w-full rounded-lg bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70 md:col-span-2"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </section>
  );
}
