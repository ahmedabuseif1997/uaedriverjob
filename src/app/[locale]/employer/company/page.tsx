import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { EmployerProfileForm } from "@/components/forms/EmployerProfileForm";
import type { EmployerProfileInput } from "@/validation/profileSchemas";

export default async function EmployerCompanyPage() {
  const user = await requireRole("EMPLOYER");
  const profile = await prisma.employerProfile.findUniqueOrThrow({ where: { userId: user.id } });

  const initial: EmployerProfileInput = {
    companyName: profile.companyName,
    tradeLicenseNo: profile.tradeLicenseNo ?? "",
    contactPhone: profile.contactPhone ?? "",
    website: profile.website ?? "",
    aboutCompany: profile.aboutCompany ?? "",
    emirate: profile.emirate ?? "",
    logoUrl: profile.logoUrl ?? "",
  };

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Company profile</h1>
      <p className="mb-6 text-sm text-neutral-500">
        This is shown to drivers on every job you post.
      </p>
      <EmployerProfileForm initial={initial} />
    </div>
  );
}
