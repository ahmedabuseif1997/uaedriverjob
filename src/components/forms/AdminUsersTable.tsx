"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import type { Role } from "@/generated/prisma/enums";

interface AdminUserRow {
  id: string;
  email: string;
  role: Role;
  name: string;
  isSuspended: boolean;
  emailVerified: boolean;
  createdAt: string;
}

function SuspendControl({
  user,
  onDone,
}: {
  user: AdminUserRow;
  onDone: (id: string, isSuspended: boolean) => void;
}) {
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(action: "SUSPEND" | "UNSUSPEND") {
    setBusy(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason: reason || undefined }),
    });
    setBusy(false);
    if (res.ok) {
      onDone(user.id, action === "SUSPEND");
      setShowReason(false);
      setReason("");
    }
  }

  if (user.isSuspended) {
    return (
      <Button size="sm" variant="outline" disabled={busy} onClick={() => submit("UNSUSPEND")}>
        Unsuspend
      </Button>
    );
  }

  if (showReason) {
    return (
      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <Input
          autoFocus
          placeholder="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="h-9 w-40"
          onKeyDown={(e) => e.key === "Enter" && submit("SUSPEND")}
        />
        <Button size="sm" variant="danger" disabled={busy} onClick={() => submit("SUSPEND")}>
          Confirm
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowReason(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" variant="ghost" onClick={() => setShowReason(true)}>
      Suspend
    </Button>
  );
}

export function AdminUsersTable({
  users,
  currentRole,
  currentQuery,
}: {
  users: AdminUserRow[];
  currentRole: string;
  currentQuery: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [rows, setRows] = useState(users);

  function handleDone(id: string, isSuspended: boolean) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isSuspended } : r)));
    showToast({ message: isSuspended ? "User suspended." : "User unsuspended." });
  }

  function updateSearch(params: { role?: string; q?: string }) {
    const next = new URLSearchParams();
    const role = params.role ?? currentRole;
    const q = params.q ?? currentQuery;
    if (role) next.set("role", role);
    if (q) next.set("q", q);
    router.push(`/admin/users${next.toString() ? `?${next.toString()}` : ""}`);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          placeholder="Search email..."
          defaultValue={currentQuery}
          onKeyDown={(e) => e.key === "Enter" && updateSearch({ q: (e.target as HTMLInputElement).value })}
          className="max-w-xs"
        />
        <Select defaultValue={currentRole} onChange={(e) => updateSearch({ role: e.target.value })} className="max-w-xs">
          <option value="">All roles</option>
          <option value="DRIVER">Drivers</option>
          <option value="EMPLOYER">Employers</option>
        </Select>
      </div>

      <div className="space-y-2">
        {rows.map((user) => (
          <Card key={user.id}>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{user.name}</p>
                <p className="truncate text-sm text-neutral-500">{user.email}</p>
              </div>
              <Badge tone="neutral">{user.role}</Badge>
              {!user.emailVerified && <Badge tone="warning">Unverified</Badge>}
              {user.isSuspended && <Badge tone="danger">Suspended</Badge>}
              <SuspendControl user={user} onDone={handleDone} />
            </div>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-sm text-neutral-500">No users match this filter.</p>}
      </div>
    </div>
  );
}
