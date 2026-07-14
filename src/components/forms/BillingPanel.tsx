"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SUBSCRIPTION_PLAN_AMOUNT_AED, SUBSCRIPTION_PLAN_QUOTA } from "@/lib/stripe";

type Plan = "BASIC" | "PRO" | "ENTERPRISE";
const PLANS: Plan[] = ["BASIC", "PRO", "ENTERPRISE"];

interface SubscriptionInfo {
  plan: Plan;
  status: string;
  quotaTotal: number;
  quotaRemaining: number;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface OrderRow {
  id: string;
  type: string;
  tier: string | null;
  amountAed: number;
  status: string;
  jobTitle: string | null;
  createdAt: string;
}

export function BillingPanel({
  subscription,
  orders,
}: {
  subscription: SubscriptionInfo | null;
  orders: OrderRow[];
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function subscribe(plan: Plan) {
    setError(null);
    setBusy(plan);
    const res = await fetch("/api/stripe/checkout/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Something went wrong.");
      setBusy(null);
      return;
    }
    window.location.href = json.url;
  }

  async function openPortal() {
    setError(null);
    setBusy("portal");
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Something went wrong.");
      setBusy(null);
      return;
    }
    window.location.href = json.url;
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Subscription</h2>
        {subscription && subscription.status === "ACTIVE" ? (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{subscription.plan} plan</p>
                <p className="text-sm text-neutral-500">
                  {subscription.quotaRemaining} of {subscription.quotaTotal} posts remaining this period
                </p>
                <p className="text-xs text-neutral-400">
                  Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  {subscription.cancelAtPeriodEnd ? " (cancels at period end)" : ""}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={openPortal} disabled={busy === "portal"}>
                Manage billing
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <Card key={plan}>
                <p className="font-semibold">{plan}</p>
                <p className="text-lg font-bold">AED {SUBSCRIPTION_PLAN_AMOUNT_AED[plan]}/mo</p>
                <p className="mb-3 text-sm text-neutral-500">
                  {SUBSCRIPTION_PLAN_QUOTA[plan] >= 999999 ? "Unlimited" : SUBSCRIPTION_PLAN_QUOTA[plan]} posts /
                  month
                </p>
                <Button size="sm" fullWidth onClick={() => subscribe(plan)} disabled={busy === plan}>
                  {busy === plan ? "Redirecting..." : "Subscribe"}
                </Button>
              </Card>
            ))}
          </div>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Order history</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-neutral-500">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-start text-xs text-neutral-500 dark:bg-neutral-900">
                <tr>
                  <th className="p-3 text-start">Date</th>
                  <th className="p-3 text-start">Item</th>
                  <th className="p-3 text-start">Amount</th>
                  <th className="p-3 text-start">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-neutral-200 dark:border-neutral-800">
                    <td className="p-3">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">{o.jobTitle ?? o.tier ?? o.type}</td>
                    <td className="p-3">AED {o.amountAed}</td>
                    <td className="p-3">
                      <Badge tone={o.status === "PAID" ? "success" : o.status === "FAILED" ? "danger" : "neutral"}>
                        {o.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
