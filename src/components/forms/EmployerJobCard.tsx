"use client";

import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { JOB_STATUS_LABELS, LISTING_TIER_LABELS } from "@/lib/enumLabels";

type Status = "DRAFT" | "PENDING_PAYMENT" | "ACTIVE" | "EXPIRED" | "CLOSED" | "REJECTED" | "DEACTIVATED";
type Tier = "STANDARD" | "FEATURED" | "URGENT";

const STATUS_TONE: Record<Status, "neutral" | "success" | "warning" | "danger"> = {
  DRAFT: "neutral",
  PENDING_PAYMENT: "warning",
  ACTIVE: "success",
  EXPIRED: "neutral",
  CLOSED: "neutral",
  REJECTED: "danger",
  DEACTIVATED: "danger",
};

export function EmployerJobCard({
  job,
}: {
  job: { id: string; title: string; status: Status; tier: Tier; applicantCount: number; daysLeft: number | null };
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  async function close() {
    setBusy(true);
    const res = await fetch(`/api/employer/jobs/${job.id}/close`, { method: "POST" });
    setBusy(false);
    if (res.ok) {
      showToast({ message: "Listing closed." });
      router.refresh();
    }
  }

  async function duplicate() {
    setBusy(true);
    const res = await fetch(`/api/employer/jobs/${job.id}/duplicate`, { method: "POST" });
    const json = await res.json();
    setBusy(false);
    if (res.ok) {
      router.push(`/employer/jobs/${json.jobId}/edit`);
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium">{job.title}</h3>
        <Badge tone={STATUS_TONE[job.status]}>{JOB_STATUS_LABELS[job.status]}</Badge>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
        <Badge tone={job.tier === "FEATURED" ? "featured" : job.tier === "URGENT" ? "urgent" : "neutral"}>
          {LISTING_TIER_LABELS[job.tier]}
        </Badge>
        <span>{job.applicantCount} applicant{job.applicantCount === 1 ? "" : "s"}</span>
        {job.daysLeft !== null && job.status === "ACTIVE" && <span>{job.daysLeft} days left</span>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {job.status === "DRAFT" && (
          <Link href={`/employer/jobs/${job.id}/edit`}>
            <Button size="sm" variant="outline">
              Continue setup
            </Button>
          </Link>
        )}
        {(job.status === "ACTIVE" || job.status === "CLOSED" || job.status === "EXPIRED") && (
          <Link href={`/employer/jobs/${job.id}/applicants`}>
            <Button size="sm" variant="outline">
              View applicants
            </Button>
          </Link>
        )}
        {job.status === "ACTIVE" && (
          <Link href={`/employer/jobs/${job.id}/edit`}>
            <Button size="sm" variant="ghost">
              Edit
            </Button>
          </Link>
        )}
        {job.status === "ACTIVE" && (
          <Button size="sm" variant="ghost" onClick={close} disabled={busy}>
            Close
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={duplicate} disabled={busy}>
          Duplicate
        </Button>
      </div>
    </Card>
  );
}
