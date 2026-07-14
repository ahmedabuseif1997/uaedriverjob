import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getEmployerProfile, getOwnedJobPost } from "@/lib/employer";

const schema = z.object({
  status: z.enum(["VIEWED", "SHORTLISTED", "REJECTED", "HIRED"]),
});

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ jobId: string; applicationId: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { jobId, applicationId } = await ctx.params;
  const employer = await getEmployerProfile(user);
  const job = await getOwnedJobPost(jobId, employer.id);
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const application = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!application || application.jobPostId !== job.id) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ ok: true, application: updated });
}
