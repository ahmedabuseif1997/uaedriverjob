export const EMIRATE_LABELS: Record<string, string> = {
  DUBAI: "Dubai",
  ABU_DHABI: "Abu Dhabi",
  SHARJAH: "Sharjah",
  AJMAN: "Ajman",
  RAS_AL_KHAIMAH: "Ras Al Khaimah",
  FUJAIRAH: "Fujairah",
  UMM_AL_QUWAIN: "Umm Al Quwain",
};

export const DRIVER_LICENSE_CATEGORY_LABELS: Record<string, string> = {
  LIGHT_VEHICLE: "Light vehicle",
  LIGHT_MOTORCYCLE: "Motorcycle",
  HEAVY_TRUCK: "Heavy truck",
  HEAVY_BUS: "Heavy bus",
  FORKLIFT: "Forklift",
  HEAVY_EQUIPMENT: "Heavy equipment",
};

export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  SEDAN: "Sedan",
  SUV: "SUV",
  VAN: "Van",
  PICKUP_TRUCK: "Pickup truck",
  HEAVY_TRUCK: "Heavy truck",
  BUS: "Bus",
  MOTORCYCLE: "Motorcycle",
  LIMOUSINE: "Limousine",
};

export const VISA_STATUS_LABELS: Record<string, string> = {
  EMPLOYMENT_VISA_CURRENT_EMPLOYER: "Employment visa (current employer)",
  EMPLOYMENT_VISA_TRANSFERABLE: "Employment visa (transferable)",
  VISIT_VISA: "Visit visa",
  GOLDEN_VISA: "Golden visa",
  FAMILY_SPONSORED: "Family sponsored",
  UAE_NATIONAL: "UAE national",
  OTHER: "Other",
};

export const JOB_CATEGORY_LABELS: Record<string, string> = {
  RIDE_HAILING: "Ride-hailing (Uber / Careem / Bolt)",
  DELIVERY_RIDER: "Delivery rider",
  TRUCK_HEAVY_VEHICLE: "Truck / heavy vehicle",
  PRIVATE_FAMILY_DRIVER: "Private / family driver",
  BUS_DRIVER: "Bus driver",
  LIMOUSINE_CHAUFFEUR: "Limousine chauffeur",
  LOGISTICS_FLEET: "Logistics / fleet",
  OTHER: "Other",
};

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  FREELANCE: "Freelance",
};

export const SALARY_PERIOD_LABELS: Record<string, string> = {
  MONTHLY: "month",
  DAILY: "day",
  PER_TRIP: "trip",
};

export const LISTING_TIER_LABELS: Record<string, string> = {
  STANDARD: "Standard",
  FEATURED: "Featured",
  URGENT: "Urgent",
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  VIEWED: "Viewed",
  SHORTLISTED: "Shortlisted",
  REJECTED: "Rejected",
  HIRED: "Hired",
  WITHDRAWN: "Withdrawn",
};

export const JOB_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_PAYMENT: "Pending payment",
  ACTIVE: "Active",
  EXPIRED: "Expired",
  CLOSED: "Closed",
  REJECTED: "Rejected",
  DEACTIVATED: "Deactivated",
};

export function toOptions(labels: Record<string, string>) {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}
