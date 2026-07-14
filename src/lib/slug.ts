import { randomBytes } from "crypto";

export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");

  const suffix = randomBytes(3).toString("hex");
  return `${base || "job"}-${suffix}`;
}
