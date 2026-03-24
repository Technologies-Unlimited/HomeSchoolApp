"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError(null);
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (response.ok) { setSent(true); }
    else { setError("Something went wrong. Please try again."); }
  }

  if (sent) {
    return (
      <section className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-2xl text-green-600">✓</div>
        <h1 className="text-2xl font-semibold text-slate-900">Check your email</h1>
        <p className="text-sm text-slate-600">If an account exists with <span className="font-semibold">{email}</span>, we've sent a password reset link.</p>
        <Link href="/login" className="rounded-full border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Back to login</Link>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Forgot password</h1>
        <p className="text-sm text-slate-600">Enter your email and we'll send you a reset link.</p>
      </div>
      <form className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500" />
        </label>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <button type="submit" disabled={loading} className="h-11 w-full rounded-lg bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70">
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
      <p className="text-center text-sm text-slate-500"><Link href="/login" className="font-medium text-slate-700 hover:text-slate-900">Back to login</Link></p>
    </section>
  );
}
