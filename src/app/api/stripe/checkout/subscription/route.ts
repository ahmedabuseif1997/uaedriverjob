import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getEmployerProfile } from "@/lib/employer";
import { getStripe, StripeNotConfiguredError, SUBSCRIPTION_PLAN_PRICE_ENV } from "@/lib/stripe";

const schema = z.object({
  plan: z.enum(["BASIC", "PRO", "ENTERPRISE"]),
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

  const { plan } = parsed.data;
  const employer = await getEmployerProfile(user);

  const existing = await prisma.subscription.findUnique({ where: { employerId: employer.id } });
  if (existing?.status === "ACTIVE") {
    return NextResponse.json({ error: "You already have an active subscription." }, { status: 409 });
  }

  const priceId = SUBSCRIPTION_PLAN_PRICE_ENV[plan];
  if (!priceId) {
    return NextResponse.json({ error: `Stripe price for the ${plan} plan is not configured.` }, { status: 503 });
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
      await prisma.employerProfile.update({ where: { id: employer.id }, data: { stripeCustomerId } });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { employerId: employer.id, plan },
      success_url: `${baseUrl}/employer/billing?checkout=success`,
      cancel_url: `${baseUrl}/employer/billing?checkout=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    throw err;
  }
}
