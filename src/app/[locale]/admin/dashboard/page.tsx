import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { filsToAed } from "@/lib/stripe";

export default async function AdminDashboardPage() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    driverCount,
    employerCount,
    activeJobCount,
    pendingModerationCount,
    activeSubscriptions,
    ordersThisMonth,
    applicationsToday,
    signupsToday,
    recentAudit,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "DRIVER" } }),
    prisma.user.count({ where: { role: "EMPLOYER" } }),
    prisma.jobPost.count({ where: { status: "ACTIVE" } }),
    prisma.jobPost.count({ where: { status: { in: ["REJECTED", "DEACTIVATED"] } } }),
    prisma.subscription.findMany({ where: { status: "ACTIVE" } }),
    prisma.order.findMany({ where: { status: "PAID", createdAt: { gte: startOfMonth } } }),
    prisma.application.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { actorUser: { select: { email: true } } },
    }),
  ]);

  const mrrAed = activeSubscriptions.reduce((sum, s) => {
    const monthly = { BASIC: 299, PRO: 899, ENTERPRISE: 2499 }[s.plan] ?? 0;
    return sum + monthly;
  }, 0);
  const oneTimeRevenueAed = ordersThisMonth.reduce((sum, o) => sum + filsToAed(o.amountFils), 0);

  const kpis = [
    { label: "Drivers", value: driverCount },
    { label: "Employers", value: employerCount },
    { label: "Active job posts", value: activeJobCount },
    { label: "Pending moderation", value: pendingModerationCount },
    { label: "MRR (subscriptions)", value: `AED ${mrrAed}` },
    { label: "One-time revenue (month)", value: `AED ${oneTimeRevenueAed}` },
    { label: "Applications today", value: applicationsToday },
    { label: "New signups today", value: signupsToday },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Admin dashboard</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <p className="text-2xl font-bold">{kpi.value}</p>
            <p className="text-sm text-neutral-500">{kpi.label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Recent activity</h2>
        {recentAudit.length === 0 ? (
          <p className="text-sm text-neutral-500">No moderation activity yet.</p>
        ) : (
          <div className="space-y-2">
            {recentAudit.map((entry) => (
              <Card key={entry.id} className="text-sm">
                <span className="font-medium">{entry.actorUser.email}</span>{" "}
                <span className="text-neutral-500">{entry.action.toLowerCase().replace(/_/g, " ")}</span>{" "}
                <span className="text-neutral-400">
                  {entry.targetType}#{entry.targetId.slice(-6)}
                </span>
                <span className="float-end text-neutral-400">{new Date(entry.createdAt).toLocaleString()}</span>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
