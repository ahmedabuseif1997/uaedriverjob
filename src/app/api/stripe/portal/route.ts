import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getEmployerProfile } from "@/lib/employer";
import { getStripe, StripeNotConfiguredError } from "@/lib/stripe";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const employer = await getEmployerProfile(user);
  if (!employer.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account yet." }, { status: 409 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: employer.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/employer/billing`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    throw err;
  }
}
