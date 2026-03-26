"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

export default function RegisterPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading...</p>}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteEmail = searchParams.get("invite") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSpouse, setHasSpouse] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);

    const password = form.get("password") as string;
    const passwordConfirm = form.get("passwordConfirm") as string;
    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.get("firstName"),
        lastName: form.get("lastName"),
        email: form.get("email"),
        phone: form.get("phone"),
        password: form.get("password"),
        childFirstName: form.get("childFirstName"),
        childLastName: form.get("childLastName"),
        spouseEmail: hasSpouse ? form.get("spouseEmail") : undefined,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data?.error ?? "Registration failed.");
      return;
    }

    router.push("/pending-approval");
  }

  const inputClass = "h-11 rounded-lg border border-slate-300 px-3 text-slate-900 outline-none focus:border-slate-500";

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Join the group</h1>
        <p className="text-sm text-slate-600">Create your account to join the homeschool community. An admin will review your request.</p>
      </div>

      <form className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2" onSubmit={handleSubmit}>
        {/* Parent info */}
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 md:col-span-2">Your info</p>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          First name
          <input type="text" name="firstName" required autoComplete="given-name" className={inputClass} />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Last name
          <input type="text" name="lastName" required autoComplete="family-name" className={inputClass} />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
          Email
          <input type="email" name="email" required autoComplete="email" defaultValue={inviteEmail} readOnly={!!inviteEmail} className={`${inputClass} ${inviteEmail ? "bg-slate-50 text-slate-500" : ""}`} />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
          Phone
          <input type="tel" name="phone" required minLength={7} pattern="[\d\s\+\-\(\)]{7,20}" title="Valid phone number" autoComplete="tel" className={inputClass} />
        </label>

        {/* Child info */}
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 md:col-span-2 mt-2">Child info</p>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Child's first name
          <input type="text" name="childFirstName" required className={inputClass} />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Child's last name
          <input type="text" name="childLastName" required className={inputClass} />
        </label>
        <p className="text-xs text-slate-500 md:col-span-2">You can add more children and details after your account is approved.</p>

        {/* Spouse link */}
        <div className="md:col-span-2 mt-2">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={hasSpouse} onChange={(e) => setHasSpouse(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            My spouse/partner already has an account
          </label>
          {hasSpouse && (
            <div className="mt-3">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Spouse's email
                <input type="email" name="spouseEmail" className={inputClass} placeholder="Their registered email" />
              </label>
              <p className="mt-1 text-xs text-slate-500">We'll send them a request to link accounts so you share the same family profile and children. No need to re-enter your child's info.</p>
            </div>
          )}
        </div>

        {/* Password */}
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 md:col-span-2 mt-2">Password</p>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Password
          <input type="password" name="password" required minLength={8} autoComplete="new-password" className={inputClass} />
          <span className="text-xs text-slate-500">Min 8 chars, uppercase, lowercase, number</span>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Confirm password
          <input type="password" name="passwordConfirm" required minLength={8} autoComplete="new-password" className={inputClass} />
        </label>

        <label className="flex items-start gap-2 text-sm text-slate-600 md:col-span-2">
          <input type="checkbox" required className="mt-1 h-4 w-4 rounded border-slate-300" />
          I agree to the Terms and Privacy Policy.
        </label>

        {error && <p className="text-sm text-red-600 md:col-span-2" role="alert" aria-live="polite">{error}</p>}

        <button
          type="submit"
          className="h-11 w-full rounded-lg bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 md:col-span-2"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>
    </section>
  );
}
