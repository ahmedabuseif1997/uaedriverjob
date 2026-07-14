import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Link } from "@/i18n/navigation";
import { JobCard } from "@/components/jobs/JobCard";
import { HomeSearchBar } from "@/components/jobs/HomeSearchBar";
import { emirates } from "@/validation/profileSchemas";
import { EMIRATE_LABELS } from "@/lib/enumLabels";

export default async function HomePage() {
  const [featured, user, t] = await Promise.all([
    prisma.jobPost.findMany({
      where: {
        status: "ACTIVE",
        isModeratedApproved: true,
        tier: { in: ["FEATURED", "URGENT"] },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: [{ tier: "asc" }, { publishedAt: "desc" }],
      take: 8,
      include: { employer: { select: { companyName: true } } },
    }),
    getCurrentUser(),
    getTranslations("home"),
  ]);

  return (
    <main className="flex-1">
      <section className="border-b border-neutral-200 bg-neutral-50 px-4 py-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-neutral-500">{t("subtitle")}</p>
        <HomeSearchBar />
        <div className="mx-auto mt-4 flex max-w-2xl flex-wrap justify-center gap-2">
          {emirates.map((e) => (
            <Link
              key={e}
              href={`/jobs?emirate=${e}`}
              className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm hover:bg-white dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              {EMIRATE_LABELS[e]}
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl p-4 py-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("featuredTitle")}</h2>
            <Link href="/jobs" className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {t("seeAllJobs")}
            </Link>
          </div>
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {featured.map((job) => (
              <div key={job.id} className="w-64 shrink-0 snap-start sm:w-auto">
                <JobCard
                  isDriver={user?.role === "DRIVER"}
                  job={{
                    id: job.id,
                    slug: job.slug,
                    title: job.title,
                    companyName: job.employer.companyName,
                    emirate: job.emirate,
                    category: job.category,
                    tier: job.tier,
                    salaryMin: job.salaryMin,
                    salaryMax: job.salaryMax,
                    salaryPeriod: job.salaryPeriod,
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {!user && (
        <section className="mx-auto max-w-6xl p-4 pb-16">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 p-6 dark:border-neutral-800">
              <h3 className="mb-1 font-semibold">{t("driverCtaTitle")}</h3>
              <p className="mb-4 text-sm text-neutral-500">{t("driverCtaBody")}</p>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-400"
              >
                {t("driverCtaLink")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
            <div className="rounded-xl border border-neutral-200 p-6 dark:border-neutral-800">
              <h3 className="mb-1 font-semibold">{t("employerCtaTitle")}</h3>
              <p className="mb-4 text-sm text-neutral-500">{t("employerCtaBody")}</p>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-400"
              >
                {t("employerCtaLink")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
