"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/client";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageGuide } from "@/components/page-guide";
import { FamilySection } from "@/components/family-section";

export default function ProfilePage() {
  const { user, loading } = useCurrentUser();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"account" | "family">("account");
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFormState({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      phone: user.phone ?? "",
    });
  }, [user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    const response = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formState),
    });

    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data?.error ?? "Failed to update profile.");
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;

  if (!user) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Sign in required</h1>
        <p className="mt-2 text-sm text-slate-600">Please sign in to manage your profile.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Profile" }]} />
      <PageGuide pageKey="profile">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Profile</h1>
      </PageGuide>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        <button
          onClick={() => setTab("account")}
          data-active={tab === "account"}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            tab === "account" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Account
        </button>
        <button
          onClick={() => setTab("family")}
          data-active={tab === "family"}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            tab === "family" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Family & Children
        </button>
      </div>

      {tab === "account" && (<>
        <form
          className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2"
          onSubmit={handleSubmit}
        >
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            Email
            <input
              type="email"
              readOnly
              className="h-11 rounded-lg border border-slate-200 bg-slate-100 px-3 text-slate-500 outline-none cursor-not-allowed"
              value={user.email}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            First name
            <input
              type="text"
              name="firstName"
              required
              className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500"
              value={formState.firstName}
              onChange={(event) => setFormState((prev) => ({ ...prev, firstName: event.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Last name
            <input
              type="text"
              name="lastName"
              required
              className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500"
              value={formState.lastName}
              onChange={(event) => setFormState((prev) => ({ ...prev, lastName: event.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            Phone
            <input
              type="tel"
              name="phone"
              required
              className="h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500"
              value={formState.phone}
              onChange={(event) => setFormState((prev) => ({ ...prev, phone: event.target.value }))}
            />
          </label>
          {error && <p className="text-sm text-red-600 md:col-span-2" role="alert" aria-live="polite">{error}</p>}
          {success && <p className="text-sm text-green-600 md:col-span-2" role="status" aria-live="polite">Profile updated successfully.</p>}
          <button
            type="submit"
            className="h-11 w-full rounded-lg bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70 md:col-span-2"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>

        {/* Password change */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Change password</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input type="password" placeholder="Current password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className="h-11 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-slate-500 md:col-span-2" />
            <input type="password" placeholder="New password" autoComplete="new-password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="h-11 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-slate-500" />
            <input type="password" placeholder="Confirm new password" autoComplete="new-password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className="h-11 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-slate-500" />
            {passwordError && <p className="text-sm text-red-600 md:col-span-2">{passwordError}</p>}
            {passwordSuccess && <p className="text-sm text-green-600 md:col-span-2">Password changed successfully.</p>}
            <button type="button" disabled={passwordSaving} onClick={async () => {
              setPasswordError(null); setPasswordSuccess(false);
              if (passwordForm.newPassword !== passwordForm.confirmPassword) { setPasswordError("Passwords do not match."); return; }
              if (passwordForm.newPassword.length < 8) { setPasswordError("New password must be at least 8 characters."); return; }
              setPasswordSaving(true);
              const r = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }) });
              setPasswordSaving(false);
              if (r.ok) { setPasswordSuccess(true); setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); setTimeout(() => setPasswordSuccess(false), 3000); }
              else { const d = await r.json().catch(() => ({})); setPasswordError(d.error || "Failed to change password."); }
            }} className="h-11 rounded-lg bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70 md:col-span-2">{passwordSaving ? "Changing..." : "Change password"}</button>
          </div>
        </div>
      </>)}

      {tab === "family" && <FamilySection />}
    </section>
  );
}
