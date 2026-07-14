import Stripe from "stripe";

let client: Stripe | null = null;

/** Lazily constructs the Stripe client so the app boots fine with no Stripe keys configured. */
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new StripeNotConfiguredError();
  }
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return client;
}

export class StripeNotConfiguredError extends Error {
  constructor() {
    super("Stripe is not configured on this deployment (STRIPE_SECRET_KEY is unset).");
    this.name = "StripeNotConfiguredError";
  }
}

/** AED is a standard 2-decimal Stripe currency; amounts are passed in fils (AED x 100). */
export function aedToFils(amountAed: number): number {
  return Math.round(amountAed * 100);
}

export function filsToAed(amountFils: number): number {
  return amountFils / 100;
}

export const JOB_TIER_PRICE_ENV: Record<"STANDARD" | "FEATURED" | "URGENT", string | undefined> = {
  STANDARD: process.env.STRIPE_PRICE_JOB_STANDARD,
  FEATURED: process.env.STRIPE_PRICE_JOB_FEATURED,
  URGENT: process.env.STRIPE_PRICE_JOB_URGENT,
};

export const SUBSCRIPTION_PLAN_PRICE_ENV: Record<"BASIC" | "PRO" | "ENTERPRISE", string | undefined> = {
  BASIC: process.env.STRIPE_PRICE_SUB_BASIC,
  PRO: process.env.STRIPE_PRICE_SUB_PRO,
  ENTERPRISE: process.env.STRIPE_PRICE_SUB_ENTERPRISE,
};

/** Reference AED list prices for job-post tiers (fils), used to create Orders and for display before Stripe confirms. */
export const JOB_TIER_AMOUNT_AED: Record<"STANDARD" | "FEATURED" | "URGENT", number> = {
  STANDARD: 199,
  FEATURED: 399,
  URGENT: 599,
};

export const SUBSCRIPTION_PLAN_QUOTA: Record<"BASIC" | "PRO" | "ENTERPRISE", number> = {
  BASIC: 5,
  PRO: 20,
  ENTERPRISE: 999999,
};

export const JOB_LISTING_DURATION_DAYS: Record<"STANDARD" | "FEATURED" | "URGENT", number> = {
  STANDARD: 30,
  FEATURED: 30,
  URGENT: 14,
};
