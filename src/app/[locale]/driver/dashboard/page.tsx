import { requireRole } from "@/lib/rbac";

export default async function DriverDashboardPage() {
  const user = await requireRole("DRIVER");

  return (
    <div>
      <h1 className="text-xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-sm text-neutral-500">{user.email}</p>
    </div>
  );
}
