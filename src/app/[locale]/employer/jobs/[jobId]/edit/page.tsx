import { notFound } from "next/navigation";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getEmployerProfile, getOwnedJobPost } from "@/lib/employer";
import { JobPostForm } from "@/components/forms/JobPostForm";
import type { JobPostInput } from "@/validation/jobPostSchemas";

export default async function EditJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const user = await requireRole("EMPLOYER");
  const employer = await getEmployerProfile(user);
  const job = await getOwnedJobPost(jobId, employer.id);
  if (!job) notFound();

  const subscription = await prisma.subscription.findUnique({ where: { employerId: employer.id } });
  const quotaRemaining = subscription?.status === "ACTIVE" ? subscription.quotaRemaining : 0;

  const initial: JobPostInput = {
    title: job.title,
    category: job.category,
    emirate: job.emirate,
    addressText: job.addressText ?? "",
    employmentType: job.employmentType,
    salaryMin: job.salaryMin ?? undefined,
    salaryMax: job.salaryMax ?? undefined,
    salaryPeriod: job.salaryPeriod,
    description: job.description,
    requiredLicenseCategories: job.requiredLicenseCategories,
    requiredVehicleTypes: job.requiredVehicleTypes,
    minExperienceYears: job.minExperienceYears ?? undefined,
  };

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">{job.status === "DRAFT" ? "Post a job" : "Edit listing"}</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Changes save automatically as you type.
      </p>
      <JobPostForm jobId={job.id} initial={initial} status={job.status === "ACTIVE" ? "ACTIVE" : "DRAFT"} quotaRemaining={quotaRemaining} />
    </div>
  );
}
