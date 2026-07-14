import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getEmployerProfile, getOwnedJobPost } from "@/lib/employer";
import {
  getStripe,
  StripeNotConfiguredError,
  aedToFils,
  JOB_TIER_PRICE_ENV,
  JOB_TIER_AMOUNT_AED,
} from "@/lib/stripe";
import { listingTiers } from "@/validation/jobPostSchemas";

const schema = z.object({
  jobId: z.string().min(1),
  tier: z.enum(listingTiers),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { jobId, tier } = parsed.data;
  const employer = await getEmployerProfile(user);
  const job = await getOwnedJobPost(jobId, employer.id);
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }
  if (job.status !== "DRAFT" && job.status !== "ACTIVE") {
    return NextResponse.json({ error: "This listing can't be published or boosted right now." }, { status: 409 });
  }
  if (!job.title.trim() || !job.description.trim()) {
    return NextResponse.json({ error: "Add a title and description before publishing." }, { status: 400 });
  }
  if (job.status === "ACTIVE" && job.tier === tier) {
    return NextResponse.json({ error: `This listing is already ${tier.toLowerCase()}.` }, { status: 409 });
  }

  const priceId = JOB_TIER_PRICE_ENV[tier];
  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe price for the ${tier} tier is not configured.` },
      { status: 503 }
    );
  }

  try {
    const stripe = getStripe();

    let stripeCustomerId = employer.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: employer.companyName,
        metadata: { employerId: employer.id },
      });
      stripeCustomerId = customer.id;
      await prisma.employerProfile.update({
        where: { id: employer.id },
        data: { stripeCustomerId },
      });
    }

    const order = await prisma.order.create({
      data: {
        employerId: employer.id,
        type: "JOB_POST_ONE_TIME",
        jobPostId: job.id,
        tier,
        amountFils: aedToFils(JOB_TIER_AMOUNT_AED[tier]),
        status: "PENDING",
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { orderId: order.id, jobId: job.id, employerId: employer.id },
      success_url: `${baseUrl}/employer/checkout/success?job=${job.id}`,
      cancel_url: `${baseUrl}/employer/checkout/cancel?job=${job.id}`,
    });

    await prisma.$transaction([
      prisma.order.update({ where: { id: order.id }, data: { stripeCheckoutSessionId: session.id } }),
      prisma.jobPost.update({ where: { id: job.id }, data: { status: "PENDING_PAYMENT" } }),
    ]);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    throw err;
  }
}
