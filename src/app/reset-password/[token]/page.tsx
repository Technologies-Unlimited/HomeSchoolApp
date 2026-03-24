"use client";

import { use, useState } from "react";
import Link from "next/link";

export default function ResetPasswordPage({ params: paramsPromise }: { params: Promise<{ token: string }> }) {
  const params = use(paramsPromise);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true); setError(null);
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.token, password }),
    });
    setLoading(false);
    if (response.ok) { setDone(true); }
    else { const data = await response.json().catch(() => ({})); setError(data.error || "Reset failed."); }
  }

  if (done) {
    return (
      <section className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-2xl text-green-600">✓</div>
        <h1 className="text-2xl font-semibold text-slate-900">Password reset</h1>
        <p className="text-sm text-slate-600">Your password has been updated. You can now sign in.</p>
        <Link href="/login" className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">Sign in</Link>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Set new password</h1>
        <p className="text-sm text-slate-600">Enter your new password below.</p>
      </div>
      <form className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          New password
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Confirm password
          <input type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500" />
        </label>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <button type="submit" disabled={loading} className="h-11 w-full rounded-lg bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70">
          {loading ? "Resetting..." : "Reset password"}
        </button>
      </form>
    </section>
  );
}
