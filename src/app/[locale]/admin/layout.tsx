import { requireRole } from "@/lib/rbac";
import { AdminSideNav, AdminBottomNav } from "@/components/forms/AdminNav";
import { LogoutButton } from "@/components/forms/LogoutButton";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ADMIN");

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1">
        <AdminSideNav />
        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-end gap-4 border-b border-neutral-200 p-3 dark:border-neutral-800">
            <LocaleSwitcher />
            <LogoutButton />
          </header>
          <main className="p-4 pb-20 sm:pb-4">{children}</main>
        </div>
      </div>
      <AdminBottomNav />
    </div>
  );
}
