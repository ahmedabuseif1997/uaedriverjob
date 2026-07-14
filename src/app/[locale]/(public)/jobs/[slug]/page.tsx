import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Badge } from "@/components/ui/Badge";
import { ApplyBar } from "@/components/jobs/ApplyBar";
import { formatAed } from "@/lib/format";
import {
  EMIRATE_LABELS,
  JOB_CATEGORY_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  SALARY_PERIOD_LABELS,
  DRIVER_LICENSE_CATEGORY_LABELS,
  VEHICLE_TYPE_LABELS,
} from "@/lib/enumLabels";
import type { DriverLicenseCategory, VehicleType } from "@/generated/prisma/enums";

async function getJob(slug: string) {
  return prisma.jobPost.findUnique({
    where: { slug },
    include: { employer: true },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job || job.status !== "ACTIVE") return {};

  const title = `${job.title} at ${job.employer.companyName} | UAE Driver Jobs`;
  const description = job.description.slice(0, 160);
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job || job.status !== "ACTIVE" || !job.isModeratedApproved) notFound();

  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);
  const isDriver = user?.role === "DRIVER";

  let applied = false;
  let missingLicenseCategories: DriverLicenseCategory[] = [];
  let missingVehicleTypes: VehicleType[] = [];

  if (isDriver && user) {
    const driverProfile = await prisma.driverProfile.findUnique({ where: { userId: user.id } });
    if (driverProfile) {
      const existing = await prisma.application.findUnique({
        where: { jobPostId_driverId: { jobPostId: job.id, driverId: driverProfile.id } },
      });
      applied = !!existing;
      missingLicenseCategories = job.requiredLicenseCategories.filter(
        (c) => !driverProfile.licenseCategories.includes(c)
      );
      missingVehicleTypes = job.requiredVehicleTypes.filter((v) => !driverProfile.vehicleTypes.includes(v));
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.publishedAt?.toISOString(),
    validThrough: job.expiresAt?.toISOString(),
    employmentType: job.employmentType,
    hiringOrganization: {
      "@type": "Organization",
      name: job.employer.companyName,
    },
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressRegion: EMIRATE_LABELS[job.emirate], addressCountry: "AE" },
    },
    ...(job.salaryMin || job.salaryMax
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "AED",
            value: {
              "@type": "QuantitativeValue",
              minValue: job.salaryMin ?? undefined,
              maxValue: job.salaryMax ?? undefined,
              unitText: job.salaryPeriod === "MONTHLY" ? "MONTH" : job.salaryPeriod === "DAILY" ? "DAY" : "HOUR",
            },
          },
        }
      : {}),
  };

  return (
    <main className="mx-auto max-w-3xl p-4 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {job.tier !== "STANDARD" && (
          <Badge tone={job.tier === "FEATURED" ? "featured" : "urgent"}>
            {job.tier === "FEATURED" ? "Featured" : "Urgent"}
          </Badge>
        )}
        <Badge tone="neutral">{EMIRATE_LABELS[job.emirate]}</Badge>
        <Badge tone="neutral">{JOB_CATEGORY_LABELS[job.category]}</Badge>
        <Badge tone="neutral">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
      </div>

      <h1 className="text-2xl font-bold">{job.title}</h1>
      <Link href={`/companies/${job.employer.id}`} className="mt-1 inline-block text-neutral-500 hover:underline">
        {job.employer.companyName}
      </Link>

      {(job.salaryMin || job.salaryMax) && (
        <p className="mt-3 font-medium">
          {formatAed(job.salaryMin ?? job.salaryMax!, locale)}
          {job.salaryMin && job.salaryMax && job.salaryMin !== job.salaryMax
            ? `–${formatAed(job.salaryMax, locale)}`
            : ""}{" "}
          / {SALARY_PERIOD_LABELS[job.salaryPeriod]}
        </p>
      )}

      <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        {job.description}
      </div>

      {(job.requiredLicenseCategories.length > 0 || job.requiredVehicleTypes.length > 0 || job.minExperienceYears) && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">Requirements</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
            {job.requiredLicenseCategories.map((c) => (
              <li key={c}>License: {DRIVER_LICENSE_CATEGORY_LABELS[c]}</li>
            ))}
            {job.requiredVehicleTypes.map((v) => (
              <li key={v}>Vehicle: {VEHICLE_TYPE_LABELS[v]}</li>
            ))}
            {job.minExperienceYears ? <li>{job.minExperienceYears}+ years of experience</li> : null}
          </ul>
        </div>
      )}

      <ApplyBar
        jobId={job.id}
        isDriver={isDriver}
        isLoggedIn={!!user}
        initialApplied={applied}
        missingLicenseCategories={missingLicenseCategories}
        missingVehicleTypes={missingVehicleTypes}
      />
    </main>
  );
}
