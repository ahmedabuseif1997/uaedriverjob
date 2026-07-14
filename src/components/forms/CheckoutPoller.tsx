"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";

/** Polls a job's status until the Stripe webhook has activated it, then redirects to its applicants page. */
export function CheckoutPoller({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (attempts > 20) return;
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/employer/jobs/${jobId}/status`);
      if (res.ok) {
        const json = await res.json();
        if (json.status === "ACTIVE") {
          router.push(`/employer/jobs/${jobId}/applicants`);
          router.refresh();
          return;
        }
      }
      setAttempts((n) => n + 1);
    }, 1500);
    return () => clearTimeout(timer);
  }, [attempts, jobId, router]);

  return (
    <div className="text-center">
      <p className="text-sm text-neutral-500">
        {attempts > 20 ? "This is taking longer than usual. You can check your listings page." : "Confirming your payment..."}
      </p>
    </div>
  );
}
