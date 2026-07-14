"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";

type ApplicationStatus = "SUBMITTED" | "VIEWED" | "SHORTLISTED" | "REJECTED" | "HIRED" | "WITHDRAWN";

interface ApplicantRow {
  id: string;
  status: ApplicationStatus;
  coverNote: string | null;
  resumeUrl: string | null;
  createdAt: string;
  driver: { fullName: string; phone: string | null; yearsExperience: number | null };
}

const COLUMNS: { key: ApplicationStatus; label: string }[] = [
  { key: "SUBMITTED", label: "Submitted" },
  { key: "SHORTLISTED", label: "Shortlisted" },
  { key: "HIRED", label: "Hired" },
  { key: "REJECTED", label: "Rejected" },
];

function columnFor(status: ApplicationStatus): ApplicationStatus {
  if (status === "VIEWED") return "SUBMITTED";
  if (status === "WITHDRAWN") return "REJECTED";
  return status;
}

export function ApplicantsBoard({ jobId, applications }: { jobId: string; applications: ApplicantRow[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [selected, setSelected] = useState<ApplicantRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function updateStatus(applicationId: string, status: ApplicationStatus) {
    setBusyId(applicationId);
    const res = await fetch(`/api/employer/jobs/${jobId}/applicants/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    if (res.ok) {
      showToast({ message: `Marked as ${status.toLowerCase()}.` });
      setSelected(null);
      router.refresh();
    }
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = applications.filter((a) => columnFor(a.status) === col.key);
          return (
            <div key={col.key}>
              <h2 className="mb-2 text-sm font-semibold text-neutral-500">
                {col.label} ({items.length})
              </h2>
              <div className="space-y-2">
                {items.map((a) => (
                  <Card key={a.id} className="cursor-pointer" onClick={() => setSelected(a)}>
                    <div className="font-medium">{a.driver.fullName}</div>
                    <div className="mt-1 text-xs text-neutral-500">
                      {a.driver.yearsExperience !== null ? `${a.driver.yearsExperience} yrs experience` : ""}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {col.key !== "SHORTLISTED" && (
                        <Button size="sm" variant="outline" disabled={busyId === a.id} onClick={() => updateStatus(a.id, "SHORTLISTED")}>
                          Shortlist
                        </Button>
                      )}
                      {col.key !== "HIRED" && (
                        <Button size="sm" variant="outline" disabled={busyId === a.id} onClick={() => updateStatus(a.id, "HIRED")}>
                          Hire
                        </Button>
                      )}
                      {col.key !== "REJECTED" && (
                        <Button size="sm" variant="ghost" disabled={busyId === a.id} onClick={() => updateStatus(a.id, "REJECTED")}>
                          Reject
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
                {items.length === 0 && <p className="text-xs text-neutral-400">No applicants here.</p>}
              </div>
            </div>
          );
        })}
      </div>

      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected?.driver.fullName}>
        {selected && (
          <div className="space-y-4">
            <Badge>{selected.status}</Badge>
            <div className="text-sm">
              <p>
                <span className="text-neutral-500">Phone:</span> {selected.driver.phone ?? "Not provided"}
              </p>
              <p>
                <span className="text-neutral-500">Experience:</span>{" "}
                {selected.driver.yearsExperience !== null ? `${selected.driver.yearsExperience} years` : "Not provided"}
              </p>
            </div>
            {selected.coverNote && (
              <div>
                <h3 className="mb-1 text-sm font-semibold">Cover note</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">{selected.coverNote}</p>
              </div>
            )}
            {selected.resumeUrl && (
              <a href={selected.resumeUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                View resume
              </a>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" onClick={() => updateStatus(selected.id, "SHORTLISTED")} disabled={busyId === selected.id}>
                Shortlist
              </Button>
              <Button size="sm" onClick={() => updateStatus(selected.id, "HIRED")} disabled={busyId === selected.id}>
                Hire
              </Button>
              <Button size="sm" variant="outline" onClick={() => updateStatus(selected.id, "REJECTED")} disabled={busyId === selected.id}>
                Reject
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}
