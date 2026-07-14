import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import type { Prisma } from "@/generated/prisma/client";
import type { Emirate, JobCategory, EmploymentType } from "@/generated/prisma/enums";
import { emirates } from "@/validation/profileSchemas";
import { jobCategories, employmentTypes } from "@/validation/jobPostSchemas";

const PAGE_SIZE = 12;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const emirateParam = searchParams.get("emirate");
  const categoryParam = searchParams.get("category");
  const employmentTypeParam = searchParams.get("employmentType");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const emirate = emirates.includes(emirateParam as Emirate) ? (emirateParam as Emirate) : undefined;
  const category = jobCategories.includes(categoryParam as JobCategory) ? (categoryParam as JobCategory) : undefined;
  const employmentType = employmentTypes.includes(employmentTypeParam as EmploymentType)
    ? (employmentTypeParam as EmploymentType)
    : undefined;

  const where: Prisma.JobPostWhereInput = {
    status: "ACTIVE",
    isModeratedApproved: true,
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    ...(emirate ? { emirate } : {}),
    ...(category ? { category } : {}),
    ...(employmentType ? { employmentType } : {}),
    ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
  };

  const [jobs, total] = await Promise.all([
    prisma.jobPost.findMany({
      where,
      orderBy: [{ tier: "asc" }, { publishedAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { employer: { select: { companyName: true } } },
    }),
    prisma.jobPost.count({ where }),
  ]);

  const user = await getCurrentUser();
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

  return NextResponse.json({
    jobs: jobs.map((job) => ({
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
    })),
    hasMore: page * PAGE_SIZE < total,
    total,
  });
}
