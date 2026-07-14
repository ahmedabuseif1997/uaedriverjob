"use client";

import { cn } from "@/lib/cn";

export function ChipMultiSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T[];
  onChange: (next: T[]) => void;
}) {
  function toggle(v: T) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={cn(
              "min-h-9 rounded-full border px-3 py-1.5 text-sm font-medium",
              active
                ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
