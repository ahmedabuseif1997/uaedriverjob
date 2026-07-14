import { Link } from "@/i18n/navigation";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getEmployerProfile } from "@/lib/employer";
import { Button } from "@/components/ui/Button";
import { EmployerJobCard } from "@/components/forms/EmployerJobCard";

export default async function EmployerJobsPage() {
  const user = await requireRole("EMPLOYER");
  const employer = await getEmployerProfile(user);

  const jobs = await prisma.jobPost.findMany({
    where: { employerId: employer.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });

  // Server Component computed once per request, not a memoized client render.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your job listings</h1>
        <Link href="/employer/jobs/new">
          <Button size="sm">Post a job</Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <p className="text-sm text-neutral-500">You haven&apos;t posted any jobs yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {jobs.map((job) => (
            <EmployerJobCard
              key={job.id}
              job={{
                id: job.id,
                title: job.title || "Untitled job",
                status: job.status,
                tier: job.tier,
                applicantCount: job._count.applications,
                daysLeft: job.expiresAt
                  ? Math.max(0, Math.ceil((job.expiresAt.getTime() - now) / (24 * 60 * 60 * 1000)))
                  : null,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
