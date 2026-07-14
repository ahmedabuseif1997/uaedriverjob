import { z } from "zod";

export const driverLicenseCategories = [
  "LIGHT_VEHICLE",
  "LIGHT_MOTORCYCLE",
  "HEAVY_TRUCK",
  "HEAVY_BUS",
  "FORKLIFT",
  "HEAVY_EQUIPMENT",
] as const;

export const vehicleTypes = [
  "SEDAN",
  "SUV",
  "VAN",
  "PICKUP_TRUCK",
  "HEAVY_TRUCK",
  "BUS",
  "MOTORCYCLE",
  "LIMOUSINE",
] as const;

export const emirates = [
  "DUBAI",
  "ABU_DHABI",
  "SHARJAH",
  "AJMAN",
  "RAS_AL_KHAIMAH",
  "FUJAIRAH",
  "UMM_AL_QUWAIN",
] as const;

export const visaStatuses = [
  "EMPLOYMENT_VISA_CURRENT_EMPLOYER",
  "EMPLOYMENT_VISA_TRANSFERABLE",
  "VISIT_VISA",
  "GOLDEN_VISA",
  "FAMILY_SPONSORED",
  "UAE_NATIONAL",
  "OTHER",
] as const;

export const driverProfileSchema = z.object({
  fullName: z.string().min(2, "Enter your full name").max(100),
  phone: z.string().max(30).optional().or(z.literal("")),
  emiratesIdNumber: z.string().max(30).optional().or(z.literal("")),
  licenseCategories: z.array(z.enum(driverLicenseCategories)),
  visaStatus: z.enum(visaStatuses).optional().or(z.literal("")),
  yearsExperience: z.coerce.number().int().min(0).max(60).optional(),
  vehicleTypes: z.array(z.enum(vehicleTypes)),
  preferredEmirates: z.array(z.enum(emirates)),
  bio: z.string().max(1000).optional().or(z.literal("")),
  photoUrl: z.string().url().optional().or(z.literal("")),
  resumeUrl: z.string().url().optional().or(z.literal("")),
});
export type DriverProfileInput = z.infer<typeof driverProfileSchema>;

export const employerProfileSchema = z.object({
  companyName: z.string().min(2, "Enter your company name").max(150),
  tradeLicenseNo: z.string().max(50).optional().or(z.literal("")),
  contactPhone: z.string().max(30).optional().or(z.literal("")),
  website: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  aboutCompany: z.string().max(1000).optional().or(z.literal("")),
  emirate: z.enum(emirates).optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
});
export type EmployerProfileInput = z.infer<typeof employerProfileSchema>;
