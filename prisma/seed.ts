import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
  return `${base}-${randomBytes(3).toString("hex")}`;
}

async function main() {
  const password = await bcrypt.hash("password123", 12);

  // --- Admin ---
  await prisma.user.upsert({
    where: { email: "admin@uaedriverjob.com" },
    update: {},
    create: {
      email: "admin@uaedriverjob.com",
      passwordHash: password,
      role: "ADMIN",
      emailVerified: true,
    },
  });

  // --- Employers ---
  const employerSeeds = [
    { email: "careem-fleet@example.com", companyName: "Careem Fleet Partners", emirate: "DUBAI" as const },
    { email: "royal-limos@example.com", companyName: "Royal Limousines LLC", emirate: "ABU_DHABI" as const },
    { email: "gulf-logistics@example.com", companyName: "Gulf Logistics & Transport", emirate: "SHARJAH" as const },
  ];

  const employers = [];
  for (const seed of employerSeeds) {
    const user = await prisma.user.upsert({
      where: { email: seed.email },
      update: {},
      create: {
        email: seed.email,
        passwordHash: password,
        role: "EMPLOYER",
        emailVerified: true,
        employerProfile: {
          create: {
            companyName: seed.companyName,
            emirate: seed.emirate,
            contactPhone: "+9715012345678",
            aboutCompany: `${seed.companyName} is a growing transport company in the UAE.`,
          },
        },
      },
      include: { employerProfile: true },
    });
    employers.push(user.employerProfile!);
  }

  // --- Drivers ---
  const driverSeeds = [
    { email: "ahmed.driver@example.com", fullName: "Ahmed Al Mansoori" },
    { email: "priya.driver@example.com", fullName: "Priya Nair" },
    { email: "jose.driver@example.com", fullName: "Jose Santos" },
  ];

  for (const seed of driverSeeds) {
    await prisma.user.upsert({
      where: { email: seed.email },
      update: {},
      create: {
        email: seed.email,
        passwordHash: password,
        role: "DRIVER",
        emailVerified: true,
        driverProfile: {
          create: {
            fullName: seed.fullName,
            phone: "+9715098765432",
            licenseCategories: ["LIGHT_VEHICLE"],
            visaStatus: "EMPLOYMENT_VISA_TRANSFERABLE",
            yearsExperience: 4,
            vehicleTypes: ["SEDAN", "SUV"],
            preferredEmirates: ["DUBAI", "SHARJAH"],
            isProfileComplete: true,
          },
        },
      },
    });
  }

  // --- Job posts ---
  const jobSeeds = [
    {
      title: "Uber & Careem Driver - Own Car Preferred",
      category: "RIDE_HAILING" as const,
      emirate: "DUBAI" as const,
      employmentType: "FULL_TIME" as const,
      salaryMin: 4000,
      salaryMax: 8000,
      tier: "URGENT" as const,
      requiredLicenseCategories: ["LIGHT_VEHICLE" as const],
      requiredVehicleTypes: ["SEDAN" as const],
    },
    {
      title: "Private Family Driver - Villa in Abu Dhabi",
      category: "PRIVATE_FAMILY_DRIVER" as const,
      emirate: "ABU_DHABI" as const,
      employmentType: "FULL_TIME" as const,
      salaryMin: 3500,
      salaryMax: 4500,
      tier: "FEATURED" as const,
      requiredLicenseCategories: ["LIGHT_VEHICLE" as const],
      requiredVehicleTypes: ["SUV" as const],
    },
    {
      title: "Heavy Truck Driver - Cross Emirates Logistics",
      category: "TRUCK_HEAVY_VEHICLE" as const,
      emirate: "SHARJAH" as const,
      employmentType: "FULL_TIME" as const,
      salaryMin: 5000,
      salaryMax: 7000,
      tier: "STANDARD" as const,
      requiredLicenseCategories: ["HEAVY_TRUCK" as const],
      requiredVehicleTypes: ["HEAVY_TRUCK" as const],
    },
  ];

  for (let i = 0; i < jobSeeds.length; i++) {
    const seed = jobSeeds[i];
    const employer = employers[i % employers.length];
    const existing = await prisma.jobPost.findFirst({ where: { title: seed.title, employerId: employer.id } });
    if (existing) continue;

    await prisma.jobPost.create({
      data: {
        employerId: employer.id,
        title: seed.title,
        slug: slugify(seed.title),
        description: `We are hiring for the role of "${seed.title}". Competitive salary, visa sponsorship available, and a supportive team environment.`,
        category: seed.category,
        emirate: seed.emirate,
        employmentType: seed.employmentType,
        salaryMin: seed.salaryMin,
        salaryMax: seed.salaryMax,
        salaryPeriod: "MONTHLY",
        tier: seed.tier,
        status: "ACTIVE",
        requiredLicenseCategories: seed.requiredLicenseCategories,
        requiredVehicleTypes: seed.requiredVehicleTypes,
        minExperienceYears: 2,
        publishedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log("Seed complete. Sample login: admin@uaedriverjob.com / ahmed.driver@example.com / careem-fleet@example.com, password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
