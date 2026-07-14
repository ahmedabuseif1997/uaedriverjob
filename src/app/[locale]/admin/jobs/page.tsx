import { prisma } from "@/lib/prisma";
import { AdminJobsTable } from "@/components/forms/AdminJobsTable";
import type { Prisma } from "@/generated/prisma/client";
import type { JobStatus } from "@/generated/prisma/enums";

const JOB_STATUSES: JobStatus[] = [
  "DRAFT",
  "PENDING_PAYMENT",
  "ACTIVE",
  "EXPIRED",
  "CLOSED",
  "REJECTED",
  "DEACTIVATED",
];

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const status = JOB_STATUSES.includes(sp.status as JobStatus) ? (sp.status as JobStatus) : undefined;
  const where: Prisma.JobPostWhereInput = {
    ...(status ? { status } : {}),
    ...(sp.q ? { title: { contains: sp.q, mode: "insensitive" } } : {}),
  };

  const jobs = await prisma.jobPost.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      employer: { select: { companyName: true } },
      _count: { select: { applications: true } },
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Job moderation</h1>
      <AdminJobsTable
        jobs={jobs.map((j) => ({
          id: j.id,
          title: j.title || "Untitled job",
          companyName: j.employer.companyName,
          status: j.status,
          tier: j.tier,
          emirate: j.emirate,
          category: j.category,
          applicantCount: j._count.applications,
          description: j.description,
          moderationNotes: j.moderationNotes,
          createdAt: j.createdAt.toISOString(),
        }))}
        currentStatus={sp.status ?? ""}
        currentQuery={sp.q ?? ""}
      />
    </div>
  );
}
