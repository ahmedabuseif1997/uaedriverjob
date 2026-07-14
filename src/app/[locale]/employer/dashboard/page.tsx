import { requireRole } from "@/lib/rbac";

export default async function EmployerDashboardPage() {
  const user = await requireRole("EMPLOYER");

  return (
    <div>
      <h1 className="text-xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-sm text-neutral-500">{user.email}</p>
    </div>
  );
}
