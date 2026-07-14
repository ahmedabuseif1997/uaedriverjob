"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Label } from "@/components/ui/Input";
import { StickyBar } from "@/components/ui/StickyBar";
import { ChipMultiSelect } from "@/components/forms/ChipMultiSelect";
import {
  jobPostSchema,
  type JobPostInput,
  jobCategories,
  employmentTypes,
  salaryPeriods,
} from "@/validation/jobPostSchemas";
import { driverLicenseCategories, vehicleTypes, emirates } from "@/validation/profileSchemas";
import {
  JOB_CATEGORY_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  SALARY_PERIOD_LABELS,
  DRIVER_LICENSE_CATEGORY_LABELS,
  VEHICLE_TYPE_LABELS,
  EMIRATE_LABELS,
  LISTING_TIER_LABELS,
} from "@/lib/enumLabels";
import { JOB_TIER_AMOUNT_AED } from "@/lib/stripe";

const licenseOptions = driverLicenseCategories.map((v) => ({ value: v, label: DRIVER_LICENSE_CATEGORY_LABELS[v] }));
const vehicleOptions = vehicleTypes.map((v) => ({ value: v, label: VEHICLE_TYPE_LABELS[v] }));
const TIERS = ["STANDARD", "FEATURED", "URGENT"] as const;

export function JobPostForm({
  jobId,
  initial,
  status,
  quotaRemaining,
}: {
  jobId: string;
  initial: JobPostInput;
  status: "DRAFT" | "ACTIVE";
  quotaRemaining: number;
}) {
  const router = useRouter();
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [tier, setTier] = useState<(typeof TIERS)[number]>("STANDARD");
  const [useQuota, setUseQuota] = useState(quotaRemaining > 0);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const isFirstRun = useRef(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { register, control, watch } = useForm({
    resolver: zodResolver(jobPostSchema),
    defaultValues: initial,
  });

  const values = watch();

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    setSaveState("saving");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await fetch(`/api/employer/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      setSaveState("saved");
    }, 800);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)]);

  async function onPublish() {
    setPublishError(null);
    setPublishing(true);
    try {
      if (useQuota) {
        const res = await fetch(`/api/employer/jobs/${jobId}/publish`, { method: "POST" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Could not publish.");
        router.push(`/employer/jobs/${jobId}/applicants`);
        router.refresh();
      } else {
        const res = await fetch("/api/stripe/checkout/job-post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, tier }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Could not start checkout.");
        window.location.href = json.url;
      }
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Something went wrong.");
      setPublishing(false);
    }
  }

  return (
    <div className="max-w-2xl pb-24">
      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Basics</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Job title</Label>
              <Input id="title" placeholder="e.g. Uber & Careem Driver - Own Car Preferred" {...register("title")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select id="category" {...register("category")}>
                  {jobCategories.map((v) => (
                    <option key={v} value={v}>
                      {JOB_CATEGORY_LABELS[v]}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="employmentType">Employment type</Label>
                <Select id="employmentType" {...register("employmentType")}>
                  {employmentTypes.map((v) => (
                    <option key={v} value={v}>
                      {EMPLOYMENT_TYPE_LABELS[v]}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Location</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emirate">Emirate</Label>
              <Select id="emirate" {...register("emirate")}>
                {emirates.map((v) => (
                  <option key={v} value={v}>
                    {EMIRATE_LABELS[v]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="addressText">Address (optional)</Label>
              <Input id="addressText" {...register("addressText")} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Requirements</h2>
          <div className="space-y-4">
            <div>
              <Label>License categories required</Label>
              <Controller
                control={control}
                name="requiredLicenseCategories"
                render={({ field }) => (
                  <ChipMultiSelect options={licenseOptions} value={field.value} onChange={field.onChange} />
                )}
              />
            </div>
            <div>
              <Label>Vehicle types required</Label>
              <Controller
                control={control}
                name="requiredVehicleTypes"
                render={({ field }) => (
                  <ChipMultiSelect options={vehicleOptions} value={field.value} onChange={field.onChange} />
                )}
              />
            </div>
            <div>
              <Label htmlFor="minExperienceYears">Minimum years of experience</Label>
              <Input id="minExperienceYears" type="number" min={0} max={60} {...register("minExperienceYears")} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Compensation</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="salaryMin">Salary min (AED)</Label>
              <Input id="salaryMin" type="number" min={0} {...register("salaryMin")} />
            </div>
            <div>
              <Label htmlFor="salaryMax">Salary max (AED)</Label>
              <Input id="salaryMax" type="number" min={0} {...register("salaryMax")} />
            </div>
            <div>
              <Label htmlFor="salaryPeriod">Per</Label>
              <Select id="salaryPeriod" {...register("salaryPeriod")}>
                {salaryPeriods.map((v) => (
                  <option key={v} value={v}>
                    {SALARY_PERIOD_LABELS[v]}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Description</h2>
          <Textarea id="description" rows={6} {...register("description")} />
        </section>

        {status === "DRAFT" && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Publish</h2>
            {quotaRemaining > 0 && (
              <label className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm dark:border-emerald-800 dark:bg-emerald-900/30">
                <input
                  type="checkbox"
                  checked={useQuota}
                  onChange={(e) => setUseQuota(e.target.checked)}
                  className="h-4 w-4"
                />
                Use {quotaRemaining} remaining post{quotaRemaining === 1 ? "" : "s"} from your subscription — no
                payment needed
              </label>
            )}
            {(!useQuota || quotaRemaining === 0) && (
              <div className="grid grid-cols-3 gap-2">
                {TIERS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTier(t)}
                    className={`rounded-lg border p-3 text-start text-sm ${
                      tier === t
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30"
                        : "border-neutral-300 dark:border-neutral-700"
                    }`}
                  >
                    <div className="font-semibold">{LISTING_TIER_LABELS[t]}</div>
                    <div className="text-neutral-500">AED {JOB_TIER_AMOUNT_AED[t]}</div>
                  </button>
                ))}
              </div>
            )}
            {publishError && <p className="mt-2 text-sm text-red-600">{publishError}</p>}
          </section>
        )}
      </div>

      <StickyBar className="-mx-4 mt-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4">
          <span className="text-xs text-neutral-500">
            {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : " "}
          </span>
          {status === "DRAFT" ? (
            <Button type="button" onClick={onPublish} disabled={publishing}>
              {publishing ? "Publishing..." : useQuota && quotaRemaining > 0 ? "Publish job" : "Continue to payment"}
            </Button>
          ) : (
            <span className="text-sm font-medium text-emerald-600">Live</span>
          )}
        </div>
      </StickyBar>
    </div>
  );
}
