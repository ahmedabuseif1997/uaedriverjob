"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";
import type { UploadKind } from "@/lib/storage";
import { Button } from "@/components/ui/Button";

export function FileUpload({
  kind,
  accept,
  label,
  currentUrl,
  onUploaded,
}: {
  kind: UploadKind;
  accept: string;
  label: string;
  currentUrl?: string | null;
  onUploaded: (publicUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setStatus("uploading");
    setError(null);
    try {
      const extension = file.name.includes(".") ? file.name.split(".").pop()! : "";
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, contentType: file.type, extension }),
      });
      const presignJson = await presignRes.json();
      if (!presignRes.ok) {
        throw new Error(presignJson.error ?? "Upload is not available right now.");
      }

      const putRes = await fetch(presignJson.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) {
        throw new Error("Upload failed. Please try again.");
      }

      onUploaded(presignJson.publicUrl);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setStatus("error");
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={status === "uploading"}
      >
        {status === "uploading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status === "done" ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {currentUrl && status === "idle" ? `Replace ${label}` : label}
      </Button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
