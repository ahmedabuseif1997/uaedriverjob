import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { JobCard } from "@/components/jobs/JobCard";

export default async function DriverDashboardPage() {
  const user = await requireRole("DRIVER");
  const driverProfile = await prisma.driverProfile.findUniqueOrThrow({ where: { userId: user.id } });

  const [applicationCount, savedCount, recommended] = await Promise.all([
    prisma.application.count({ where: { driverId: driverProfile.id } }),
    prisma.savedJob.count({ where: { driverId: driverProfile.id } }),
    prisma.jobPost.findMany({
      where: {
        status: "ACTIVE",
        isModeratedApproved: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        ...(driverProfile.preferredEmirates.length > 0 ? { emirate: { in: driverProfile.preferredEmirates } } : {}),
      },
      orderBy: [{ tier: "asc" }, { publishedAt: "desc" }],
      take: 4,
      include: { employer: { select: { companyName: true } } },
    }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold">Welcome back, {driverProfile.fullName.split(" ")[0]}</h1>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card>
          <p className="text-2xl font-bold">{applicationCount}</p>
          <p className="text-sm text-neutral-500">Applications</p>
        </Card>
        <Card>
          <p className="text-2xl font-bold">{savedCount}</p>
          <p className="text-sm text-neutral-500">Saved jobs</p>
        </Card>
      </div>

      <div className="mt-6">
        <Link href="/jobs">
          <Button fullWidth>Browse all jobs</Button>
        </Link>
      </div>

      {recommended.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Jobs for you</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {recommended.map((job) => (
              <JobCard
                key={job.id}
                isDriver
                job={{
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
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
