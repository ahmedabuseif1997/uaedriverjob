import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { writeAuditLog } from "@/lib/admin";

const schema = z.object({
  action: z.enum(["SUSPEND", "UNSUSPEND"]),
  reason: z.string().max(500).optional(),
});

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { userId } = await ctx.params;
  if (userId === admin.id) {
    return NextResponse.json({ error: "You can't suspend your own account." }, { status: 400 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const { action, reason } = parsed.data;
  const isSuspended = action === "SUSPEND";

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isSuspended, suspendedReason: isSuspended ? (reason ?? null) : null },
  });

  if (isSuspended) {
    await prisma.session.deleteMany({ where: { userId } });
  }

  await writeAuditLog({
    actorUserId: admin.id,
    action: isSuspended ? "USER_SUSPENDED" : "USER_UNSUSPENDED",
    targetType: "User",
    targetId: userId,
    reason,
  });

  return NextResponse.json({ ok: true, user: { id: updated.id, isSuspended: updated.isSuspended } });
}
