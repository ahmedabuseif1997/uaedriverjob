import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { routing } from "@/i18n/routing";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const jobs = await prisma.jobPost.findMany({
    where: { status: "ACTIVE", isModeratedApproved: true },
    select: { slug: true, updatedAt: true },
    take: 5000,
  });

  const staticEntries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) => [
    { url: `${baseUrl}/${locale}`, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/${locale}/jobs`, changeFrequency: "hourly", priority: 0.9 },
  ]);

  const jobEntries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    jobs.map((job) => ({
      url: `${baseUrl}/${locale}/jobs/${job.slug}`,
      lastModified: job.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }))
  );

  return [...staticEntries, ...jobEntries];
}
