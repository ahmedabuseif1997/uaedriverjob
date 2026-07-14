"use client";

import { LayoutGrid, Briefcase, Users, CreditCard } from "lucide-react";
import { BottomNav, SideNav } from "@/components/ui/BottomNav";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
];

export function AdminSideNav() {
  return <SideNav items={NAV_ITEMS} />;
}

export function AdminBottomNav() {
  return <BottomNav items={NAV_ITEMS} />;
}
