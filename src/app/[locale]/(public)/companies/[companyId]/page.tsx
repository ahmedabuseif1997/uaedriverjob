import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { JobCard } from "@/components/jobs/JobCard";
import { EMIRATE_LABELS } from "@/lib/enumLabels";

async function getCompany(companyId: string) {
  return prisma.employerProfile.findUnique({ where: { id: companyId } });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ companyId: string }>;
}): Promise<Metadata> {
  const { companyId } = await params;
  const company = await getCompany(companyId);
  if (!company) return {};
  return { title: `${company.companyName} | UAE Driver Jobs` };
}

export default async function CompanyPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const company = await getCompany(companyId);
  if (!company) notFound();

  const [jobs, user] = await Promise.all([
    prisma.jobPost.findMany({
      where: { employerId: company.id, status: "ACTIVE", isModeratedApproved: true },
      orderBy: [{ tier: "asc" }, { publishedAt: "desc" }],
    }),
    getCurrentUser(),
  ]);

  return (
    <main className="mx-auto max-w-4xl p-4">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
          {company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl font-semibold text-neutral-400">{company.companyName[0]?.toUpperCase()}</span>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold">{company.companyName}</h1>
          {company.emirate && <p className="text-sm text-neutral-500">{EMIRATE_LABELS[company.emirate]}</p>}
        </div>
      </div>

      {company.aboutCompany && <p className="mb-8 text-sm text-neutral-700 dark:text-neutral-300">{company.aboutCompany}</p>}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Open positions ({jobs.length})
      </h2>
      {jobs.length === 0 ? (
        <p className="text-sm text-neutral-500">No open positions right now.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              isDriver={user?.role === "DRIVER"}
              job={{
                id: job.id,
                slug: job.slug,
                title: job.title,
                companyName: company.companyName,
                emirate: job.emirate,
                category: job.category,
                tier: job.tier,
                salaryMin: job.salaryMin,
                salaryMax: job.salaryMax,
                salaryPeriod: job.salaryPeriod,
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}
