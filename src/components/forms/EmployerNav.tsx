"use client";

import { LayoutGrid, Briefcase, Building2, CreditCard } from "lucide-react";
import { BottomNav, SideNav } from "@/components/ui/BottomNav";

const NAV_ITEMS = [
  { href: "/employer/dashboard", label: "Home", icon: LayoutGrid },
  { href: "/employer/jobs", label: "Listings", icon: Briefcase },
  { href: "/employer/company", label: "Company", icon: Building2 },
  { href: "/employer/billing", label: "Billing", icon: CreditCard },
];

export function EmployerSideNav() {
  return <SideNav items={NAV_ITEMS} />;
}

export function EmployerBottomNav() {
  return <BottomNav items={NAV_ITEMS} />;
}
