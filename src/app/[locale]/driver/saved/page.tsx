import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { JobCard } from "@/components/jobs/JobCard";

export default async function DriverSavedJobsPage() {
  const user = await requireRole("DRIVER");
  const driverProfile = await prisma.driverProfile.findUniqueOrThrow({ where: { userId: user.id } });

  const saved = await prisma.savedJob.findMany({
    where: { driverId: driverProfile.id },
    orderBy: { createdAt: "desc" },
    include: { jobPost: { include: { employer: { select: { companyName: true } } } } },
  });

  const jobIds = saved.map((s) => s.jobPostId);
  const applications = await prisma.application.findMany({
    where: { driverId: driverProfile.id, jobPostId: { in: jobIds } },
  });
  const appliedIds = new Set(applications.map((a) => a.jobPostId));

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Saved jobs</h1>
      {saved.length === 0 ? (
        <p className="text-sm text-neutral-500">You haven&apos;t saved any jobs yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {saved.map((s) => (
            <JobCard
              key={s.id}
              isDriver
              job={{
                id: s.jobPost.id,
                slug: s.jobPost.slug,
                title: s.jobPost.title,
                companyName: s.jobPost.employer.companyName,
                emirate: s.jobPost.emirate,
                category: s.jobPost.category,
                tier: s.jobPost.tier,
                salaryMin: s.jobPost.salaryMin,
                salaryMax: s.jobPost.salaryMax,
                salaryPeriod: s.jobPost.salaryPeriod,
                saved: true,
                applied: appliedIds.has(s.jobPost.id),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
