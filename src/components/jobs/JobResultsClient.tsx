"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { JobCard, type JobCardData } from "@/components/jobs/JobCard";
import type { JobFilterValues } from "@/components/jobs/JobFilters";

/**
 * Keyed by the parent on the current filter set (see JobsSearchPage), so a filter change
 * remounts this component with fresh initial props instead of needing to sync via an effect.
 */
export function JobResultsClient({
  initialJobs,
  initialHasMore,
  filters,
  isDriver,
}: {
  initialJobs: JobCardData[];
  initialHasMore: boolean;
  filters: JobFilterValues;
  isDriver: boolean;
}) {
  const t = useTranslations("jobs");
  const [jobs, setJobs] = useState(initialJobs);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.emirate) params.set("emirate", filters.emirate);
    if (filters.category) params.set("category", filters.category);
    if (filters.employmentType) params.set("employmentType", filters.employmentType);
    params.set("page", String(page + 1));

    const res = await fetch(`/api/jobs?${params.toString()}`);
    const json = await res.json();
    setJobs((prev) => [...prev, ...json.jobs]);
    setHasMore(json.hasMore);
    setPage((p) => p + 1);
    setLoading(false);
  }, [filters, page]);

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMore();
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  if (jobs.length === 0) {
    return <p className="text-sm text-neutral-500">{t("noResults")}</p>;
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} isDriver={isDriver} />
        ))}
      </div>
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-6 text-sm text-neutral-400">
          {loading ? "Loading more..." : ""}
        </div>
      )}
    </div>
  );
}
