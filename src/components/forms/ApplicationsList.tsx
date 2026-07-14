"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { APPLICATION_STATUS_LABELS } from "@/lib/enumLabels";

type Status = "SUBMITTED" | "VIEWED" | "SHORTLISTED" | "REJECTED" | "HIRED" | "WITHDRAWN";

const STATUS_TONE: Record<Status, "neutral" | "success" | "warning" | "danger" | "info"> = {
  SUBMITTED: "info",
  VIEWED: "info",
  SHORTLISTED: "warning",
  REJECTED: "danger",
  HIRED: "success",
  WITHDRAWN: "neutral",
};

export interface ApplicationRow {
  id: string;
  status: Status;
  createdAt: string;
  job: { slug: string; title: string; companyName: string };
}

export function ApplicationsList({ applications }: { applications: ApplicationRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (applications.length === 0) {
    return <p className="text-sm text-neutral-500">You haven&apos;t applied to any jobs yet.</p>;
  }

  return (
    <div className="space-y-2">
      {applications.map((app) => (
        <Card key={app.id} className="cursor-pointer" onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium">{app.job.title}</p>
              <p className="truncate text-sm text-neutral-500">{app.job.companyName}</p>
            </div>
            <Badge tone={STATUS_TONE[app.status]}>{APPLICATION_STATUS_LABELS[app.status]}</Badge>
          </div>
          {expandedId === app.id && (
            <div className="mt-3 border-t border-neutral-200 pt-3 text-sm dark:border-neutral-800">
              <p className="text-neutral-500">Applied {new Date(app.createdAt).toLocaleDateString()}</p>
              <Link
                href={`/jobs/${app.job.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="mt-1 inline-block font-medium text-emerald-700 dark:text-emerald-400"
              >
                View job posting
              </Link>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
