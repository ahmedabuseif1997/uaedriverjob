import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { driverLicenseCategories, vehicleTypes } from "@/validation/profileSchemas";

const schema = z.object({
  coverNote: z.string().max(1000).optional(),
  quickProfileUpdate: z
    .object({
      licenseCategories: z.array(z.enum(driverLicenseCategories)).optional(),
      vehicleTypes: z.array(z.enum(vehicleTypes)).optional(),
      yearsExperience: z.coerce.number().int().min(0).max(60).optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest, ctx: { params: Promise<{ jobId: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "DRIVER") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { jobId } = await ctx.params;
  const job = await prisma.jobPost.findUnique({ where: { id: jobId } });
  if (!job || job.status !== "ACTIVE") {
    return NextResponse.json({ error: "This job is no longer accepting applications." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  let driverProfile = await prisma.driverProfile.findUniqueOrThrow({ where: { userId: user.id } });

  if (parsed.data.quickProfileUpdate) {
    const u = parsed.data.quickProfileUpdate;
    driverProfile = await prisma.driverProfile.update({
      where: { id: driverProfile.id },
      data: {
        ...(u.licenseCategories
          ? { licenseCategories: Array.from(new Set([...driverProfile.licenseCategories, ...u.licenseCategories])) }
          : {}),
        ...(u.vehicleTypes
          ? { vehicleTypes: Array.from(new Set([...driverProfile.vehicleTypes, ...u.vehicleTypes])) }
          : {}),
        ...(u.yearsExperience !== undefined ? { yearsExperience: u.yearsExperience } : {}),
      },
    });
  }

  const existing = await prisma.application.findUnique({
    where: { jobPostId_driverId: { jobPostId: job.id, driverId: driverProfile.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "You've already applied to this job." }, { status: 409 });
  }

  const application = await prisma.application.create({
    data: {
      jobPostId: job.id,
      driverId: driverProfile.id,
      coverNote: parsed.data.coverNote || null,
      resumeUrlSnapshot: driverProfile.resumeUrl,
    },
  });

  return NextResponse.json({ ok: true, application });
}
