import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getEmployerProfile, getOwnedJobPost } from "@/lib/employer";
import { JOB_LISTING_DURATION_DAYS } from "@/lib/stripe";

/** Publishes a DRAFT job immediately by consuming one unit of the employer's active subscription quota. */
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
  if (job.status !== "DRAFT") {
    return NextResponse.json({ error: "This listing has already been published." }, { status: 409 });
  }
  if (!job.title.trim() || !job.description.trim()) {
    return NextResponse.json({ error: "Add a title and description before publishing." }, { status: 400 });
  }

  const subscription = await prisma.subscription.findUnique({ where: { employerId: employer.id } });
  if (!subscription || subscription.status !== "ACTIVE") {
    return NextResponse.json({ error: "No active subscription. Choose a paid tier instead." }, { status: 409 });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + JOB_LISTING_DURATION_DAYS.STANDARD * 24 * 60 * 60 * 1000);

  const activatedJob = await prisma.$transaction(async (tx) => {
    const decrement = await tx.subscription.updateMany({
      where: { id: subscription.id, quotaRemaining: { gt: 0 } },
      data: { quotaRemaining: { decrement: 1 } },
    });
    if (decrement.count === 0) {
      throw new QuotaExhaustedError();
    }

    return tx.jobPost.update({
      where: { id: job.id },
      data: { status: "ACTIVE", tier: "STANDARD", publishedAt: now, expiresAt },
    });
  }).catch((err) => {
    if (err instanceof QuotaExhaustedError) return null;
    throw err;
  });

  if (!activatedJob) {
    return NextResponse.json({ error: "Your subscription quota is exhausted this period." }, { status: 409 });
  }

  return NextResponse.json({ ok: true, job: activatedJob });
}

class QuotaExhaustedError extends Error {}
