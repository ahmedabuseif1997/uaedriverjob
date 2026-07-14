import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getEmployerProfile, getOwnedJobPost } from "@/lib/employer";
import { slugify } from "@/lib/slug";

export async function POST(request: Request, ctx: { params: Promise<{ jobId: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { jobId } = await ctx.params;
  const employer = await getEmployerProfile(user);
  const job = await getOwnedJobPost(jobId, employer.id);
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const copy = await prisma.jobPost.create({
    data: {
      employerId: employer.id,
      title: job.title,
      slug: slugify(job.title || "untitled-job"),
      description: job.description,
      category: job.category,
      emirate: job.emirate,
      addressText: job.addressText,
      employmentType: job.employmentType,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryPeriod: job.salaryPeriod,
      requiredLicenseCategories: job.requiredLicenseCategories,
      requiredVehicleTypes: job.requiredVehicleTypes,
      minExperienceYears: job.minExperienceYears,
      status: "DRAFT",
    },
  });

  return NextResponse.json({ jobId: copy.id });
}
