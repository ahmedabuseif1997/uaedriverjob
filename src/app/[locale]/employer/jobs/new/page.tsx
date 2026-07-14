import { redirect } from "next/navigation";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getEmployerProfile } from "@/lib/employer";
import { slugify } from "@/lib/slug";

export default async function NewJobPage() {
  const user = await requireRole("EMPLOYER");
  const employer = await getEmployerProfile(user);

  const job = await prisma.jobPost.create({
    data: {
      employerId: employer.id,
      title: "",
      slug: slugify("untitled-job"),
      description: "",
      category: "OTHER",
      emirate: "DUBAI",
      employmentType: "FULL_TIME",
      salaryPeriod: "MONTHLY",
      status: "DRAFT",
    },
  });

  redirect(`/employer/jobs/${job.id}/edit`);
}
