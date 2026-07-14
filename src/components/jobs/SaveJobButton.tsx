"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";

export function SaveJobButton({
  jobId,
  initialSaved,
  isDriver,
}: {
  jobId: string;
  initialSaved: boolean;
  isDriver: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  if (!isDriver) return null;

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const next = !saved;
    setSaved(next); // optimistic
    const res = await fetch("/api/driver/saved-jobs", {
      method: next ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    if (!res.ok) setSaved(!next); // revert on failure
    setBusy(false);
  }

  return (
    <button
      onClick={toggle}
      aria-label={saved ? "Unsave job" : "Save job"}
      aria-pressed={saved}
      className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
    >
      <Heart className={cn("h-5 w-5", saved ? "fill-red-500 text-red-500" : "text-neutral-400")} />
    </button>
  );
}
