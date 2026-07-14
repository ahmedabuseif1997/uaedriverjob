import { notFound } from "next/navigation";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getEmployerProfile, getOwnedJobPost } from "@/lib/employer";
import { ApplicantsBoard } from "@/components/forms/ApplicantsBoard";

export default async function ApplicantsPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const user = await requireRole("EMPLOYER");
  const employer = await getEmployerProfile(user);
  const job = await getOwnedJobPost(jobId, employer.id);
  if (!job) notFound();

  const applications = await prisma.application.findMany({
    where: { jobPostId: job.id },
    include: { driver: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">{job.title || "Untitled job"}</h1>
      <p className="mb-6 text-sm text-neutral-500">{applications.length} applicant{applications.length === 1 ? "" : "s"}</p>
      <ApplicantsBoard
        jobId={job.id}
        applications={applications.map((a) => ({
          id: a.id,
          status: a.status,
          coverNote: a.coverNote,
          resumeUrl: a.resumeUrlSnapshot,
          createdAt: a.createdAt.toISOString(),
          driver: {
            fullName: a.driver.fullName,
            phone: a.driver.phone,
            yearsExperience: a.driver.yearsExperience,
          },
        }))}
      />
    </div>
  );
}
