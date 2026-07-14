import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { driverProfileSchema } from "@/validation/profileSchemas";

function computeIsComplete(data: {
  fullName: string;
  phone?: string;
  licenseCategories: string[];
  vehicleTypes: string[];
  yearsExperience?: number;
}): boolean {
  return Boolean(
    data.fullName &&
      data.phone &&
      data.licenseCategories.length > 0 &&
      data.vehicleTypes.length > 0 &&
      data.yearsExperience !== undefined
  );
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "DRIVER") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = driverProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const data = parsed.data;
  const isProfileComplete = computeIsComplete(data);

  const updated = await prisma.driverProfile.update({
    where: { userId: user.id },
    data: {
      fullName: data.fullName,
      phone: data.phone || null,
      emiratesIdNumber: data.emiratesIdNumber || null,
      licenseCategories: data.licenseCategories,
      visaStatus: data.visaStatus || null,
      yearsExperience: data.yearsExperience,
      vehicleTypes: data.vehicleTypes,
      preferredEmirates: data.preferredEmirates,
      bio: data.bio || null,
      photoUrl: data.photoUrl || undefined,
      resumeUrl: data.resumeUrl || undefined,
      isProfileComplete,
    },
  });

  return NextResponse.json({ ok: true, profile: updated });
}
