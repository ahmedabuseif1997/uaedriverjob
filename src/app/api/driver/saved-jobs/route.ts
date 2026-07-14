import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({ jobId: z.string().min(1) });

async function getDriverProfile(userId: string) {
  return prisma.driverProfile.findUniqueOrThrow({ where: { userId } });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "DRIVER") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const driverProfile = await getDriverProfile(user.id);
  await prisma.savedJob.upsert({
    where: { driverId_jobPostId: { driverId: driverProfile.id, jobPostId: parsed.data.jobId } },
    create: { driverId: driverProfile.id, jobPostId: parsed.data.jobId },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "DRIVER") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const driverProfile = await getDriverProfile(user.id);
  await prisma.savedJob
    .delete({ where: { driverId_jobPostId: { driverId: driverProfile.id, jobPostId: parsed.data.jobId } } })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}
