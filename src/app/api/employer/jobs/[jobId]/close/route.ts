import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getEmployerProfile, getOwnedJobPost } from "@/lib/employer";

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
  if (job.status !== "ACTIVE") {
    return NextResponse.json({ error: "Only active listings can be closed." }, { status: 409 });
  }

  const updated = await prisma.jobPost.update({ where: { id: job.id }, data: { status: "CLOSED" } });
  return NextResponse.json({ ok: true, job: updated });
}
