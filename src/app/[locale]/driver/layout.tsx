import { requireRole } from "@/lib/rbac";
import { DriverSideNav, DriverBottomNav } from "@/components/forms/DriverNav";
import { VerifyEmailBanner } from "@/components/forms/VerifyEmailBanner";
import { LogoutButton } from "@/components/forms/LogoutButton";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("DRIVER");

  return (
    <div className="flex flex-1 flex-col">
      {!user.emailVerified && <VerifyEmailBanner />}
      <div className="flex flex-1">
        <DriverSideNav />
        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-end gap-4 border-b border-neutral-200 p-3 dark:border-neutral-800">
            <LocaleSwitcher />
            <LogoutButton />
          </header>
          <main className="p-4 pb-20 sm:pb-4">{children}</main>
        </div>
      </div>
      <DriverBottomNav />
    </div>
  );
}
