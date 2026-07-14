import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { ApplicationsList } from "@/components/forms/ApplicationsList";

export default async function DriverApplicationsPage() {
  const user = await requireRole("DRIVER");
  const driverProfile = await prisma.driverProfile.findUniqueOrThrow({ where: { userId: user.id } });

  const applications = await prisma.application.findMany({
    where: { driverId: driverProfile.id },
    orderBy: { createdAt: "desc" },
    include: { jobPost: { include: { employer: { select: { companyName: true } } } } },
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Your applications</h1>
      <ApplicationsList
        applications={applications.map((a) => ({
          id: a.id,
          status: a.status,
          createdAt: a.createdAt.toISOString(),
          job: { slug: a.jobPost.slug, title: a.jobPost.title, companyName: a.jobPost.employer.companyName },
        }))}
      />
    </div>
  );
}
