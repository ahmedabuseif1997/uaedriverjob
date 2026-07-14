import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getEmployerProfile } from "@/lib/employer";
import { BillingPanel } from "@/components/forms/BillingPanel";
import { filsToAed } from "@/lib/stripe";

export default async function EmployerBillingPage() {
  const user = await requireRole("EMPLOYER");
  const employer = await getEmployerProfile(user);

  const [subscription, orders] = await Promise.all([
    prisma.subscription.findUnique({ where: { employerId: employer.id } }),
    prisma.order.findMany({
      where: { employerId: employer.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { jobPost: { select: { title: true } } },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Billing</h1>
      <BillingPanel
        subscription={
          subscription
            ? {
                plan: subscription.plan,
                status: subscription.status,
                quotaTotal: subscription.quotaTotal,
                quotaRemaining: subscription.quotaRemaining,
                currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
              }
            : null
        }
        orders={orders.map((o) => ({
          id: o.id,
          type: o.type,
          tier: o.tier,
          amountAed: filsToAed(o.amountFils),
          status: o.status,
          jobTitle: o.jobPost?.title ?? null,
          createdAt: o.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
