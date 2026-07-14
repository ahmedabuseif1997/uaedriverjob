import { prisma } from "@/lib/prisma";
import { AdminUsersTable } from "@/components/forms/AdminUsersTable";
import type { Role } from "@/generated/prisma/enums";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const role = sp.role === "DRIVER" || sp.role === "EMPLOYER" ? (sp.role as Role) : undefined;

  const users = await prisma.user.findMany({
    where: {
      role: role ?? { in: ["DRIVER", "EMPLOYER"] },
      ...(sp.q ? { email: { contains: sp.q, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      driverProfile: { select: { fullName: true } },
      employerProfile: { select: { companyName: true } },
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Users</h1>
      <AdminUsersTable
        users={users.map((u) => ({
          id: u.id,
          email: u.email,
          role: u.role,
          name: u.driverProfile?.fullName ?? u.employerProfile?.companyName ?? "—",
          isSuspended: u.isSuspended,
          emailVerified: u.emailVerified,
          createdAt: u.createdAt.toISOString(),
        }))}
        currentRole={sp.role ?? ""}
        currentQuery={sp.q ?? ""}
      />
    </div>
  );
}
