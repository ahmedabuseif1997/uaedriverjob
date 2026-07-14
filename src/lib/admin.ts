import { prisma } from "@/lib/prisma";

export function writeAuditLog(params: {
  actorUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason?: string;
}) {
  return prisma.adminAuditLog.create({
    data: {
      actorUserId: params.actorUserId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      reason: params.reason,
    },
  });
}
