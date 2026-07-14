import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, JOB_LISTING_DURATION_DAYS, SUBSCRIPTION_PLAN_QUOTA } from "@/lib/stripe";
import type { SubscriptionStatus, SubscriptionPlan, ListingTier } from "@/generated/prisma/enums";

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "trialing":
      return "TRIALING";
    case "canceled":
    case "incomplete_expired":
      return "CANCELED";
    default:
      return "INCOMPLETE";
  }
}

function getSubscriptionPeriod(subscription: Stripe.Subscription): { start: Date; end: Date } {
  const item = subscription.items.data[0];
  return {
    start: new Date(item.current_period_start * 1000),
    end: new Date(item.current_period_end * 1000),
  };
}

async function upsertSubscriptionFromStripe(
  employerId: string,
  plan: SubscriptionPlan,
  subscription: Stripe.Subscription
) {
  const { start, end } = getSubscriptionPeriod(subscription);
  const status = mapStripeStatus(subscription.status);
  const quotaTotal = SUBSCRIPTION_PLAN_QUOTA[plan];

  await prisma.subscription.upsert({
    where: { employerId },
    create: {
      employerId,
      plan,
      status,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      quotaTotal,
      quotaRemaining: quotaTotal,
      currentPeriodStart: start,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      status,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      currentPeriodStart: start,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode === "payment") {
    const orderId = session.metadata?.orderId;
    const jobId = session.metadata?.jobId;
    if (!orderId || !jobId) return;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.status === "PAID") return;

    const tier = (order.tier ?? "STANDARD") as ListingTier;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + JOB_LISTING_DURATION_DAYS[tier] * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          stripePaymentIntentId:
            typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
        },
      }),
      prisma.jobPost.update({
        where: { id: jobId },
        data: { status: "ACTIVE", tier, publishedAt: now, expiresAt },
      }),
    ]);
    return;
  }

  if (session.mode === "subscription") {
    const employerId = session.metadata?.employerId;
    const plan = session.metadata?.plan as SubscriptionPlan | undefined;
    if (!employerId || !plan || !session.subscription) return;

    const stripe = getStripe();
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    await upsertSubscriptionFromStripe(employerId, plan, subscription);
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subDetails = invoice.parent?.subscription_details;
  const subscriptionRef = subDetails?.subscription;
  const subscriptionId = typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;
  if (!subscriptionId) return;

  const existing = await prisma.subscription.findUnique({ where: { stripeSubscriptionId: subscriptionId } });
  if (!existing) return;

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const { start, end } = getSubscriptionPeriod(subscription);

  await prisma.subscription.update({
    where: { id: existing.id },
    data: {
      status: mapStripeStatus(subscription.status),
      quotaRemaining: existing.quotaTotal,
      currentPeriodStart: start,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const existing = await prisma.subscription.findUnique({ where: { stripeSubscriptionId: subscription.id } });
  if (!existing) return;

  const { start, end } = getSubscriptionPeriod(subscription);
  await prisma.subscription.update({
    where: { id: existing.id },
    data: {
      status: mapStripeStatus(subscription.status),
      currentPeriodStart: start,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const existing = await prisma.subscription.findUnique({ where: { stripeSubscriptionId: subscription.id } });
  if (!existing) return;

  await prisma.subscription.update({
    where: { id: existing.id },
    data: { status: "CANCELED", quotaRemaining: 0 },
  });
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    await prisma.stripeEvent.create({ data: { id: event.id, type: event.type } });
  } catch {
    // Already processed this event (unique constraint on id) - acknowledge and skip.
    return NextResponse.json({ received: true });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "invoice.paid":
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
