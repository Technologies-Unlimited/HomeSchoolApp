"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.get("firstName"),
        lastName: form.get("lastName"),
        email: form.get("email"),
        phone: form.get("phone"),
        password: form.get("password"),
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data?.error ?? "Registration failed.");
      return;
    }

    router.push("/");
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Create an account
        </h1>
        <p className="text-sm text-slate-600">
          Join the community to RSVP and manage your family profile.
        </p>
      </div>

      <form
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          First name
          <input
            type="text"
            name="firstName"
            autoComplete="given-name"
            className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Last name
          <input
            type="text"
            name="lastName"
            autoComplete="family-name"
            className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
          Phone
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Password
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Confirm password
          <input
            type="password"
            name="passwordConfirm"
            autoComplete="new-password"
            className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500"
          />
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-600 md:col-span-2">
          <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300" />
          I agree to the Terms and Privacy Policy.
        </label>
        {error && (
          <p className="text-sm text-red-600 md:col-span-2">{error}</p>
        )}
        <button
          type="submit"
          className="h-11 w-full rounded-lg bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 md:col-span-2"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
    </section>
  );
}
