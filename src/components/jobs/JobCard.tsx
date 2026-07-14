import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SaveJobButton } from "@/components/jobs/SaveJobButton";
import { EMIRATE_LABELS, JOB_CATEGORY_LABELS, SALARY_PERIOD_LABELS } from "@/lib/enumLabels";
import { formatAed } from "@/lib/format";

export interface JobCardData {
  id: string;
  slug: string;
  title: string;
  companyName: string;
  emirate: string;
  category: string;
  tier: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: string;
  applied?: boolean;
  saved?: boolean;
}

function salaryText(job: JobCardData, locale: string): string | null {
  if (!job.salaryMin && !job.salaryMax) return null;
  const period = SALARY_PERIOD_LABELS[job.salaryPeriod];
  if (job.salaryMin && job.salaryMax) {
    return `${formatAed(job.salaryMin, locale)}–${formatAed(job.salaryMax, locale)} / ${period}`;
  }
  return `${formatAed(job.salaryMin ?? job.salaryMax!, locale)} / ${period}`;
}

export function JobCard({ job, isDriver }: { job: JobCardData; isDriver: boolean }) {
  const locale = useLocale();
  const t = useTranslations("jobs");
  const salary = salaryText(job, locale);

  return (
    <Link href={`/jobs/${job.slug}`} className="block min-w-0">
      <Card className="h-full transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-medium">{job.title}</h3>
            <p className="truncate text-sm text-neutral-500">{job.companyName}</p>
          </div>
          <SaveJobButton jobId={job.id} initialSaved={!!job.saved} isDriver={isDriver} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {job.tier !== "STANDARD" && (
            <Badge tone={job.tier === "FEATURED" ? "featured" : "urgent"}>
              {job.tier === "FEATURED" ? "Featured" : "Urgent"}
            </Badge>
          )}
          <Badge tone="neutral">{EMIRATE_LABELS[job.emirate]}</Badge>
          <Badge tone="neutral">{JOB_CATEGORY_LABELS[job.category]}</Badge>
          {job.applied && <Badge tone="success">{t("appliedLabel")}</Badge>}
        </div>
        {salary && <p className="mt-2 text-sm font-medium">{salary}</p>}
      </Card>
    </Link>
  );
}
