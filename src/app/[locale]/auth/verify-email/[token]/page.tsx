"use client";

import { use, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

export default function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Verification failed.");
          setStatus("error");
        } else {
          setStatus("success");
        }
      })
      .catch(() => {
        setError("Something went wrong.");
        setStatus("error");
      });
  }, [token]);

  return (
    <div className="text-center">
      {status === "pending" && <p className="text-sm text-neutral-500">Verifying your email...</p>}
      {status === "success" && (
        <>
          <h1 className="mb-2 text-lg font-semibold">Email verified</h1>
          <p className="text-sm text-neutral-500">Your email address has been confirmed.</p>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="mb-2 text-lg font-semibold">Verification failed</h1>
          <p className="text-sm text-neutral-500">{error}</p>
        </>
      )}
      <Link href="/" className="mt-5 inline-block font-medium text-emerald-700 dark:text-emerald-400">
        Go to homepage
      </Link>
    </div>
  );
}
