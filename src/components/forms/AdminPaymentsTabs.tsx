"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

interface OrderRow {
  id: string;
  companyName: string;
  type: string;
  tier: string | null;
  jobTitle: string | null;
  amountAed: number;
  status: string;
  stripeCheckoutSessionId: string | null;
  createdAt: string;
}

interface SubscriptionRow {
  id: string;
  companyName: string;
  plan: string;
  status: string;
  quotaRemaining: number;
  quotaTotal: number;
  stripeSubscriptionId: string;
  currentPeriodEnd: string;
}

// Stripe dashboard links assume test mode, matching this build's default Stripe configuration.
function stripeCheckoutUrl(sessionId: string) {
  return `https://dashboard.stripe.com/test/checkout/sessions/${sessionId}`;
}
function stripeSubscriptionUrl(subscriptionId: string) {
  return `https://dashboard.stripe.com/test/subscriptions/${subscriptionId}`;
}

export function AdminPaymentsTabs({ orders, subscriptions }: { orders: OrderRow[]; subscriptions: SubscriptionRow[] }) {
  const [tab, setTab] = useState<"orders" | "subscriptions">("orders");

  return (
    <div>
      <div className="mb-4 flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
        {(["orders", "subscriptions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "min-h-11 border-b-2 px-4 text-sm font-medium capitalize",
              tab === t ? "border-emerald-600 text-emerald-700 dark:text-emerald-400" : "border-transparent text-neutral-500"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "orders" ? (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-xs text-neutral-500 dark:bg-neutral-900">
              <tr>
                <th className="p-3 text-start">Date</th>
                <th className="p-3 text-start">Employer</th>
                <th className="p-3 text-start">Item</th>
                <th className="p-3 text-start">Amount</th>
                <th className="p-3 text-start">Status</th>
                <th className="p-3 text-start">Stripe</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="p-3">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">{o.companyName}</td>
                  <td className="p-3">{o.jobTitle ?? o.tier ?? o.type}</td>
                  <td className="p-3">AED {o.amountAed}</td>
                  <td className="p-3">
                    <Badge tone={o.status === "PAID" ? "success" : o.status === "FAILED" ? "danger" : "neutral"}>
                      {o.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {o.stripeCheckoutSessionId && (
                      <a
                        href={stripeCheckoutUrl(o.stripeCheckoutSessionId)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:underline dark:text-emerald-400"
                      >
                        View
                      </a>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-3 text-center text-neutral-500">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-xs text-neutral-500 dark:bg-neutral-900">
              <tr>
                <th className="p-3 text-start">Employer</th>
                <th className="p-3 text-start">Plan</th>
                <th className="p-3 text-start">Status</th>
                <th className="p-3 text-start">Quota</th>
                <th className="p-3 text-start">Renews</th>
                <th className="p-3 text-start">Stripe</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((s) => (
                <tr key={s.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="p-3">{s.companyName}</td>
                  <td className="p-3">{s.plan}</td>
                  <td className="p-3">
                    <Badge tone={s.status === "ACTIVE" ? "success" : s.status === "PAST_DUE" ? "warning" : "neutral"}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {s.quotaRemaining}/{s.quotaTotal}
                  </td>
                  <td className="p-3">{new Date(s.currentPeriodEnd).toLocaleDateString()}</td>
                  <td className="p-3">
                    <a
                      href={stripeSubscriptionUrl(s.stripeSubscriptionId)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-3 text-center text-neutral-500">
                    No subscriptions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
