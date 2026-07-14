import { prisma } from "@/lib/prisma";
import { AdminPaymentsTabs } from "@/components/forms/AdminPaymentsTabs";
import { filsToAed } from "@/lib/stripe";

export default async function AdminPaymentsPage() {
  const [orders, subscriptions] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { employer: { select: { companyName: true } }, jobPost: { select: { title: true } } },
    }),
    prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { employer: { select: { companyName: true } } },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Payments</h1>
      <AdminPaymentsTabs
        orders={orders.map((o) => ({
          id: o.id,
          companyName: o.employer.companyName,
          type: o.type,
          tier: o.tier,
          jobTitle: o.jobPost?.title ?? null,
          amountAed: filsToAed(o.amountFils),
          status: o.status,
          stripeCheckoutSessionId: o.stripeCheckoutSessionId,
          createdAt: o.createdAt.toISOString(),
        }))}
        subscriptions={subscriptions.map((s) => ({
          id: s.id,
          companyName: s.employer.companyName,
          plan: s.plan,
          status: s.status,
          quotaRemaining: s.quotaRemaining,
          quotaTotal: s.quotaTotal,
          stripeSubscriptionId: s.stripeSubscriptionId,
          currentPeriodEnd: s.currentPeriodEnd.toISOString(),
        }))}
      />
    </div>
  );
}
