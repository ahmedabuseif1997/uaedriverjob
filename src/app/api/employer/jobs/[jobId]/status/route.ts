import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getEmployerProfile, getOwnedJobPost } from "@/lib/employer";

export async function GET(request: Request, ctx: { params: Promise<{ jobId: string }> }) {
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

  return NextResponse.json({ status: job.status });
}
