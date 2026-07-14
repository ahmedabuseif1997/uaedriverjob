import { z } from "zod";
import { driverLicenseCategories, vehicleTypes, emirates } from "@/validation/profileSchemas";

export const jobCategories = [
  "RIDE_HAILING",
  "DELIVERY_RIDER",
  "TRUCK_HEAVY_VEHICLE",
  "PRIVATE_FAMILY_DRIVER",
  "BUS_DRIVER",
  "LIMOUSINE_CHAUFFEUR",
  "LOGISTICS_FLEET",
  "OTHER",
] as const;

export const employmentTypes = ["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE"] as const;
export const salaryPeriods = ["MONTHLY", "DAILY", "PER_TRIP"] as const;
export const listingTiers = ["STANDARD", "FEATURED", "URGENT"] as const;

export const jobPostSchema = z.object({
  title: z.string().max(150),
  category: z.enum(jobCategories),
  emirate: z.enum(emirates),
  addressText: z.string().max(200).optional().or(z.literal("")),
  employmentType: z.enum(employmentTypes),
  salaryMin: z.coerce.number().int().min(0).optional(),
  salaryMax: z.coerce.number().int().min(0).optional(),
  salaryPeriod: z.enum(salaryPeriods),
  description: z.string().max(5000).optional().or(z.literal("")),
  requiredLicenseCategories: z.array(z.enum(driverLicenseCategories)),
  requiredVehicleTypes: z.array(z.enum(vehicleTypes)),
  minExperienceYears: z.coerce.number().int().min(0).max(60).optional(),
});
export type JobPostInput = z.infer<typeof jobPostSchema>;

export const publishJobSchema = z.object({
  method: z.enum(["QUOTA", "CHECKOUT"]),
  tier: z.enum(listingTiers).optional(),
});
export type PublishJobInput = z.infer<typeof publishJobSchema>;
