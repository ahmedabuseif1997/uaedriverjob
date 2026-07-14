import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { writeAuditLog } from "@/lib/admin";

const schema = z.object({
  action: z.enum(["APPROVE", "REJECT", "DEACTIVATE"]),
  reason: z.string().max(500).optional(),
});

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ jobId: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { jobId } = await ctx.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const job = await prisma.jobPost.findUnique({ where: { id: jobId } });
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const { action, reason } = parsed.data;
  const data =
    action === "APPROVE"
      ? { isModeratedApproved: true, status: "ACTIVE" as const, moderationNotes: null }
      : action === "REJECT"
        ? { isModeratedApproved: false, status: "REJECTED" as const, moderationNotes: reason ?? null }
        : { status: "DEACTIVATED" as const, moderationNotes: reason ?? null };

  const updated = await prisma.jobPost.update({ where: { id: jobId }, data });

  const auditAction: Record<typeof action, string> = {
    APPROVE: "JOB_APPROVED",
    REJECT: "JOB_REJECTED",
    DEACTIVATE: "JOB_DEACTIVATED",
  };
  await writeAuditLog({
    actorUserId: user.id,
    action: auditAction[action],
    targetType: "JobPost",
    targetId: jobId,
    reason,
  });

  return NextResponse.json({ ok: true, job: updated });
}
