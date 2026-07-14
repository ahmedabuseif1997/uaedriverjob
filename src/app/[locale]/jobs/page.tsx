import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { JobFilters, type JobFilterValues } from "@/components/jobs/JobFilters";
import { JobResultsClient } from "@/components/jobs/JobResultsClient";
import type { Emirate, JobCategory, EmploymentType } from "@/generated/prisma/enums";
import { emirates } from "@/validation/profileSchemas";
import { jobCategories, employmentTypes } from "@/validation/jobPostSchemas";
import type { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 12;

export const metadata: Metadata = {
  title: "Browse driver jobs in the UAE | UAE Driver Jobs",
  description: "Search ride-hailing, delivery, truck, private driver, and logistics jobs across Dubai, Abu Dhabi, Sharjah, and the rest of the UAE.",
};

export default async function JobsSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters: JobFilterValues = {
    q: sp.q ?? "",
    emirate: sp.emirate ?? "",
    category: sp.category ?? "",
    employmentType: sp.employmentType ?? "",
  };

  const emirate = emirates.includes(filters.emirate as Emirate) ? (filters.emirate as Emirate) : undefined;
  const category = jobCategories.includes(filters.category as JobCategory) ? (filters.category as JobCategory) : undefined;
  const employmentType = employmentTypes.includes(filters.employmentType as EmploymentType)
    ? (filters.employmentType as EmploymentType)
    : undefined;

  const where: Prisma.JobPostWhereInput = {
    status: "ACTIVE",
    isModeratedApproved: true,
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    ...(emirate ? { emirate } : {}),
    ...(category ? { category } : {}),
    ...(employmentType ? { employmentType } : {}),
    ...(filters.q ? { title: { contains: filters.q, mode: "insensitive" } } : {}),
  };

  const [jobs, total, user] = await Promise.all([
    prisma.jobPost.findMany({
      where,
      orderBy: [{ tier: "asc" }, { publishedAt: "desc" }],
      take: PAGE_SIZE,
      include: { employer: { select: { companyName: true } } },
    }),
    prisma.jobPost.count({ where }),
    getCurrentUser(),
  ]);

  let savedIds = new Set<string>();
  let appliedIds = new Set<string>();
  if (user?.role === "DRIVER") {
    const driverProfile = await prisma.driverProfile.findUnique({ where: { userId: user.id } });
    if (driverProfile) {
      const jobIds = jobs.map((j) => j.id);
      const [saved, applied] = await Promise.all([
        prisma.savedJob.findMany({ where: { driverId: driverProfile.id, jobPostId: { in: jobIds } } }),
        prisma.application.findMany({ where: { driverId: driverProfile.id, jobPostId: { in: jobIds } } }),
      ]);
      savedIds = new Set(saved.map((s) => s.jobPostId));
      appliedIds = new Set(applied.map((a) => a.jobPostId));
    }
  }

  const jobCards = jobs.map((job) => ({
    id: job.id,
    slug: job.slug,
    title: job.title,
    companyName: job.employer.companyName,
    emirate: job.emirate,
    category: job.category,
    tier: job.tier,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryPeriod: job.salaryPeriod,
    saved: savedIds.has(job.id),
    applied: appliedIds.has(job.id),
  }));

  return (
    <main className="mx-auto max-w-6xl p-4">
      <h1 className="mb-4 text-xl font-semibold">
        {total} driving job{total === 1 ? "" : "s"} in the UAE
      </h1>
      <div className="flex gap-8">
        <JobFilters initial={filters} />
        <div className="flex-1">
          <JobResultsClient
            key={JSON.stringify(filters)}
            initialJobs={jobCards}
            initialHasMore={PAGE_SIZE < total}
            filters={filters}
            isDriver={user?.role === "DRIVER"}
          />
        </div>
      </div>
    </main>
  );
}
