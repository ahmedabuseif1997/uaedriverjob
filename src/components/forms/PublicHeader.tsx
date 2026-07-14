import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/session";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { Button } from "@/components/ui/Button";

export async function PublicHeader() {
  const [user, tc] = await Promise.all([getCurrentUser(), getTranslations("common")]);

  const dashboardHref =
    user?.role === "ADMIN" ? "/admin/dashboard" : user?.role === "EMPLOYER" ? "/employer/dashboard" : "/driver/dashboard";

  return (
    <header className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-800">
      <Link href="/" className="font-bold">
        {tc("appName")}
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/jobs" className="hidden text-sm font-medium sm:inline">
          {tc("browseJobs")}
        </Link>
        <LocaleSwitcher />
        {user ? (
          <Link href={dashboardHref}>
            <Button size="sm" variant="outline">
              {tc("dashboard")}
            </Button>
          </Link>
        ) : (
          <>
            <Link href="/auth/login" className="hidden text-sm font-medium sm:inline">
              {tc("login")}
            </Link>
            <Link href="/auth/register">
              <Button size="sm">{tc("signUp")}</Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
