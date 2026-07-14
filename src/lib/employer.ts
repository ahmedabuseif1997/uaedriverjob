import { prisma } from "@/lib/prisma";
import type { User } from "@/generated/prisma/client";

export async function getEmployerProfile(user: User) {
  return prisma.employerProfile.findUniqueOrThrow({ where: { userId: user.id } });
}

/** Returns the job post only if it belongs to this employer, otherwise null. */
export async function getOwnedJobPost(jobId: string, employerId: string) {
  const job = await prisma.jobPost.findUnique({ where: { id: jobId } });
  if (!job || job.employerId !== employerId) return null;
  return job;
}
