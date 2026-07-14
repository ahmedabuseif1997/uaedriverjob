"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Select, Label } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { emirates } from "@/validation/profileSchemas";
import { jobCategories, employmentTypes } from "@/validation/jobPostSchemas";
import { EMIRATE_LABELS, JOB_CATEGORY_LABELS, EMPLOYMENT_TYPE_LABELS } from "@/lib/enumLabels";

export interface JobFilterValues {
  q: string;
  emirate: string;
  category: string;
  employmentType: string;
}

function FilterFields({
  values,
  onChange,
}: {
  values: JobFilterValues;
  onChange: (next: JobFilterValues) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="q">Keyword</Label>
        <Input
          id="q"
          placeholder="e.g. Uber driver"
          value={values.q}
          onChange={(e) => onChange({ ...values, q: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="emirate">Emirate</Label>
        <Select id="emirate" value={values.emirate} onChange={(e) => onChange({ ...values, emirate: e.target.value })}>
          <option value="">All Emirates</option>
          {emirates.map((v) => (
            <option key={v} value={v}>
              {EMIRATE_LABELS[v]}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Select id="category" value={values.category} onChange={(e) => onChange({ ...values, category: e.target.value })}>
          <option value="">All categories</option>
          {jobCategories.map((v) => (
            <option key={v} value={v}>
              {JOB_CATEGORY_LABELS[v]}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="employmentType">Employment type</Label>
        <Select
          id="employmentType"
          value={values.employmentType}
          onChange={(e) => onChange({ ...values, employmentType: e.target.value })}
        >
          <option value="">Any</option>
          {employmentTypes.map((v) => (
            <option key={v} value={v}>
              {EMPLOYMENT_TYPE_LABELS[v]}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

export function JobFilters({ initial }: { initial: JobFilterValues }) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [sheetOpen, setSheetOpen] = useState(false);

  function apply(values: JobFilterValues) {
    const params = new URLSearchParams();
    if (values.q) params.set("q", values.q);
    if (values.emirate) params.set("emirate", values.emirate);
    if (values.category) params.set("category", values.category);
    if (values.employmentType) params.set("employmentType", values.employmentType);
    router.push(`/jobs${params.toString() ? `?${params.toString()}` : ""}`);
    setSheetOpen(false);
  }

  const activeCount = [initial.emirate, initial.category, initial.employmentType].filter(Boolean).length;

  return (
    <>
      {/* Mobile: trigger + bottom sheet */}
      <div className="mb-4 flex gap-2 sm:hidden">
        <Input
          placeholder="Search jobs..."
          defaultValue={initial.q}
          onKeyDown={(e) => {
            if (e.key === "Enter") apply({ ...draft, q: (e.target as HTMLInputElement).value });
          }}
          className="flex-1"
        />
        <Button variant="outline" onClick={() => setSheetOpen(true)} aria-label="Filters">
          <SlidersHorizontal className="h-4 w-4" />
          {activeCount > 0 && <span>({activeCount})</span>}
        </Button>
      </div>
      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Filters">
        <FilterFields values={draft} onChange={setDraft} />
        <Button fullWidth className="mt-6" onClick={() => apply(draft)}>
          Show results
        </Button>
      </Sheet>

      {/* Desktop: inline sidebar */}
      <div className="hidden w-64 shrink-0 sm:block">
        <FilterFields values={draft} onChange={setDraft} />
        <Button fullWidth className="mt-4" onClick={() => apply(draft)}>
          Apply filters
        </Button>
      </div>
    </>
  );
}
