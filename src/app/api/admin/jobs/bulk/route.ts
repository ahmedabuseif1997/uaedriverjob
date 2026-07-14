import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({
  jobIds: z.array(z.string().min(1)).min(1).max(200),
  action: z.enum(["APPROVE", "REJECT", "DEACTIVATE"]),
  reason: z.string().max(500).optional(),
});

const AUDIT_ACTION: Record<"APPROVE" | "REJECT" | "DEACTIVATE", string> = {
  APPROVE: "JOB_APPROVED",
  REJECT: "JOB_REJECTED",
  DEACTIVATE: "JOB_DEACTIVATED",
};

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { jobIds, action, reason } = parsed.data;
  const data =
    action === "APPROVE"
      ? { isModeratedApproved: true, status: "ACTIVE" as const, moderationNotes: null }
      : action === "REJECT"
        ? { isModeratedApproved: false, status: "REJECTED" as const, moderationNotes: reason ?? null }
        : { status: "DEACTIVATED" as const, moderationNotes: reason ?? null };

  await prisma.jobPost.updateMany({ where: { id: { in: jobIds } }, data });
  await prisma.adminAuditLog.createMany({
    data: jobIds.map((jobId) => ({
      actorUserId: user.id,
      action: AUDIT_ACTION[action],
      targetType: "JobPost",
      targetId: jobId,
      reason,
    })),
  });

  return NextResponse.json({ ok: true, count: jobIds.length });
}
