import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { employerProfileSchema } from "@/validation/profileSchemas";

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = employerProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const data = parsed.data;

  const updated = await prisma.employerProfile.update({
    where: { userId: user.id },
    data: {
      companyName: data.companyName,
      tradeLicenseNo: data.tradeLicenseNo || null,
      contactPhone: data.contactPhone || null,
      website: data.website || null,
      aboutCompany: data.aboutCompany || null,
      emirate: data.emirate || null,
      logoUrl: data.logoUrl || undefined,
    },
  });

  return NextResponse.json({ ok: true, profile: updated });
}
