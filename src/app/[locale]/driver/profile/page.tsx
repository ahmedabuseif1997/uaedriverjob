import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { DriverProfileForm } from "@/components/forms/DriverProfileForm";
import type { DriverProfileInput } from "@/validation/profileSchemas";

export default async function DriverProfilePage() {
  const user = await requireRole("DRIVER");
  const profile = await prisma.driverProfile.findUniqueOrThrow({ where: { userId: user.id } });

  const initial: DriverProfileInput = {
    fullName: profile.fullName,
    phone: profile.phone ?? "",
    emiratesIdNumber: profile.emiratesIdNumber ?? "",
    licenseCategories: profile.licenseCategories,
    visaStatus: profile.visaStatus ?? "",
    yearsExperience: profile.yearsExperience ?? undefined,
    vehicleTypes: profile.vehicleTypes,
    preferredEmirates: profile.preferredEmirates,
    bio: profile.bio ?? "",
    photoUrl: profile.photoUrl ?? "",
    resumeUrl: profile.resumeUrl ?? "",
  };

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Your profile</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Keep this up to date — it&apos;s what employers see and what you apply with, so you never have to
        re-enter it per job.
      </p>
      <DriverProfileForm initial={initial} />
    </div>
  );
}
