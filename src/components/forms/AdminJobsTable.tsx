"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { JOB_STATUS_LABELS, LISTING_TIER_LABELS, EMIRATE_LABELS, JOB_CATEGORY_LABELS } from "@/lib/enumLabels";

type Status = "DRAFT" | "PENDING_PAYMENT" | "ACTIVE" | "EXPIRED" | "CLOSED" | "REJECTED" | "DEACTIVATED";
type Action = "APPROVE" | "REJECT" | "DEACTIVATE";

interface AdminJobRow {
  id: string;
  title: string;
  companyName: string;
  status: Status;
  tier: string;
  emirate: string;
  category: string;
  applicantCount: number;
  description: string;
  moderationNotes: string | null;
  createdAt: string;
}

const STATUS_TONE: Record<Status, "neutral" | "success" | "warning" | "danger"> = {
  DRAFT: "neutral",
  PENDING_PAYMENT: "warning",
  ACTIVE: "success",
  EXPIRED: "neutral",
  CLOSED: "neutral",
  REJECTED: "danger",
  DEACTIVATED: "danger",
};

const REVERSE_ACTION: Record<Action, Action> = {
  APPROVE: "DEACTIVATE",
  REJECT: "APPROVE",
  DEACTIVATE: "APPROVE",
};

export function AdminJobsTable({
  jobs,
  currentStatus,
  currentQuery,
}: {
  jobs: AdminJobRow[];
  currentStatus: string;
  currentQuery: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [rows, setRows] = useState(jobs);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<AdminJobRow | null>(null);
  const [busy, setBusy] = useState(false);

  async function callAction(jobIds: string[], action: Action) {
    if (jobIds.length === 1) {
      await fetch(`/api/admin/jobs/${jobIds[0]}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
    } else {
      await fetch("/api/admin/jobs/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobIds, action }),
      });
    }
  }

  async function applyAction(jobIds: string[], action: Action) {
    setBusy(true);
    await callAction(jobIds, action);
    setBusy(false);
    setRows((prev) =>
      prev.map((r) =>
        jobIds.includes(r.id)
          ? { ...r, status: action === "APPROVE" ? "ACTIVE" : action === "REJECT" ? "REJECTED" : "DEACTIVATED" }
          : r
      )
    );
    setSelected(new Set());
    setDetail(null);
    showToast({
      message: `${jobIds.length} listing${jobIds.length === 1 ? "" : "s"} ${action.toLowerCase()}d.`,
      actionLabel: "Undo",
      onAction: () => applyAction(jobIds, REVERSE_ACTION[action]),
    });
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function updateSearch(params: { status?: string; q?: string }) {
    const next = new URLSearchParams();
    const status = params.status ?? currentStatus;
    const q = params.q ?? currentQuery;
    if (status) next.set("status", status);
    if (q) next.set("q", q);
    router.push(`/admin/jobs${next.toString() ? `?${next.toString()}` : ""}`);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          placeholder="Search title..."
          defaultValue={currentQuery}
          onKeyDown={(e) => e.key === "Enter" && updateSearch({ q: (e.target as HTMLInputElement).value })}
          className="max-w-xs"
        />
        <Select
          defaultValue={currentStatus}
          onChange={(e) => updateSearch({ status: e.target.value })}
          className="max-w-xs"
        >
          <option value="">All statuses</option>
          {Object.entries(JOB_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-50 p-2 dark:border-neutral-700 dark:bg-neutral-900">
          <span className="text-sm">{selected.size} selected</span>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => applyAction([...selected], "APPROVE")}>
            Approve
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => applyAction([...selected], "DEACTIVATE")}>
            Deactivate
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => applyAction([...selected], "REJECT")}>
            Reject
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {rows.map((job) => (
          <Card key={job.id} className="cursor-pointer" onClick={() => setDetail(job)}>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selected.has(job.id)}
                onClick={(e) => e.stopPropagation()}
                onChange={() => toggleSelected(job.id)}
                className="h-4 w-4 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{job.title}</p>
                <p className="truncate text-sm text-neutral-500">
                  {job.companyName} · {EMIRATE_LABELS[job.emirate]} · {job.applicantCount} applicant
                  {job.applicantCount === 1 ? "" : "s"}
                </p>
              </div>
              <Badge tone={STATUS_TONE[job.status]}>{JOB_STATUS_LABELS[job.status]}</Badge>
              <div className="hidden shrink-0 gap-1.5 sm:flex" onClick={(e) => e.stopPropagation()}>
                {job.status !== "ACTIVE" && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => applyAction([job.id], "APPROVE")}>
                    Approve
                  </Button>
                )}
                {job.status !== "DEACTIVATED" && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => applyAction([job.id], "DEACTIVATE")}>
                    Deactivate
                  </Button>
                )}
                {job.status !== "REJECTED" && (
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => applyAction([job.id], "REJECT")}>
                    Reject
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-sm text-neutral-500">No jobs match this filter.</p>}
      </div>

      <Sheet open={!!detail} onClose={() => setDetail(null)} title={detail?.title}>
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-1.5">
              <Badge tone={STATUS_TONE[detail.status]}>{JOB_STATUS_LABELS[detail.status]}</Badge>
              <Badge tone="neutral">{LISTING_TIER_LABELS[detail.tier]}</Badge>
              <Badge tone="neutral">{EMIRATE_LABELS[detail.emirate]}</Badge>
              <Badge tone="neutral">{JOB_CATEGORY_LABELS[detail.category]}</Badge>
            </div>
            <p className="text-neutral-500">{detail.companyName}</p>
            <p className="whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">{detail.description}</p>
            {detail.moderationNotes && (
              <div>
                <p className="font-medium">Moderation notes</p>
                <p className="text-neutral-500">{detail.moderationNotes}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" disabled={busy} onClick={() => applyAction([detail.id], "APPROVE")}>
                Approve
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => applyAction([detail.id], "DEACTIVATE")}>
                Deactivate
              </Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => applyAction([detail.id], "REJECT")}>
                Reject
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
