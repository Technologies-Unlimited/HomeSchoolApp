"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

export default function VerifyPage({ params: paramsPromise }: { params: Promise<{ token: string }> }) {
  const params = use(paramsPromise);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setMessage("Your email has been verified! An admin will review your account shortly.");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, [params.token]);

  return (
    <section className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 py-20 text-center">
      {status === "loading" && <p className="text-sm text-slate-500">Verifying your email...</p>}
      {status === "success" && (
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-2xl text-green-600">
            ✓
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Email verified</h1>
          <p className="text-sm text-slate-600">{message}</p>
          <Link href="/" className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
            Go to dashboard
          </Link>
        </>
      )}
      {status === "error" && (
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-600">
            !
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Verification failed</h1>
          <p className="text-sm text-slate-600">{message}</p>
          <Link href="/" className="rounded-full border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
            Go home
          </Link>
        </>
      )}
    </section>
  );
}
