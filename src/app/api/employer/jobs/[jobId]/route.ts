import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getEmployerProfile, getOwnedJobPost } from "@/lib/employer";
import { jobPostSchema } from "@/validation/jobPostSchemas";
import { slugify } from "@/lib/slug";

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ jobId: string }> }) {
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
  if (job.status !== "DRAFT" && job.status !== "ACTIVE") {
    return NextResponse.json({ error: "This listing can no longer be edited." }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const parsed = jobPostSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const data = parsed.data;
  const shouldRegenerateSlug = data.title !== undefined && data.title.trim().length > 0 && job.title !== data.title;

  const updated = await prisma.jobPost.update({
    where: { id: job.id },
    data: {
      ...data,
      addressText: data.addressText === "" ? null : data.addressText,
      description: data.description ?? undefined,
      ...(shouldRegenerateSlug ? { slug: slugify(data.title!) } : {}),
    },
  });

  return NextResponse.json({ ok: true, job: updated });
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ jobId: string }> }) {
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
    return NextResponse.json({ error: "Only drafts can be deleted." }, { status: 409 });
  }

  await prisma.jobPost.delete({ where: { id: job.id } });
  return NextResponse.json({ ok: true });
}
