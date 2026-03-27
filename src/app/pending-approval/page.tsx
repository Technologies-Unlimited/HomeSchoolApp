"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/client";

export default function PendingApprovalPage() {
  const { user, loading } = useCurrentUser();
  const router = useRouter();
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  // Redirect approved users to home
  useEffect(() => {
    if (!loading && user?.emailVerified && user?.approved) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function handleResend() {
    setResending(true);
    setResendError(null);
    const response = await fetch("/api/auth/resend-verification", { method: "POST" });
    setResending(false);
    if (response.ok) {
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } else {
      const data = await response.json().catch(() => ({}));
      setResendError(data.error || "Failed to send verification email. Please try again later.");
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;

  const needsVerification = user && !user.emailVerified;
  const needsApproval = user && user.emailVerified && !user.approved;

  return (
    <section className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 py-20 text-center">
      {needsVerification && (
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-2xl text-amber-600">
            ✉
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Check your email</h1>
          <p className="text-sm text-slate-600">
            We sent a verification link to <span className="font-semibold">{user.email}</span>. Click the link to verify your account.
          </p>
          <button
            onClick={handleResend}
            disabled={resending || resendSuccess}
            className="rounded-full border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
          >
            {resendSuccess ? "Email sent!" : resending ? "Sending..." : "Resend verification email"}
          </button>
          {resendError && <p className="text-sm text-red-600">{resendError}</p>}
        </>
      )}

      {needsApproval && (
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600">
            ⏳
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Pending approval</h1>
          <p className="text-sm text-slate-600">
            Your email is verified. A group admin will review your membership request and you'll receive an email when you're approved.
          </p>
        </>
      )}

      {!user && (
        <>
          <h1 className="text-2xl font-semibold text-slate-900">Not signed in</h1>
          <p className="text-sm text-slate-600">Please sign in to check your account status.</p>
        </>
      )}
    </section>
  );
}
