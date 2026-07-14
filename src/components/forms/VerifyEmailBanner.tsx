"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function VerifyEmailBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [sent, setSent] = useState(false);

  if (dismissed) return null;

  async function resend() {
    await fetch("/api/auth/resend-verification", { method: "POST" });
    setSent(true);
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
      <span>
        {sent
          ? "Verification email sent — check your inbox."
          : "Please verify your email address."}{" "}
        {!sent && (
          <button onClick={resend} className="font-semibold underline underline-offset-2">
            Resend email
          </button>
        )}
      </span>
      <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
