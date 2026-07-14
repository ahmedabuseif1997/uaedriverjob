"use client";

import { LayoutGrid, Briefcase, Heart, User } from "lucide-react";
import { BottomNav, SideNav } from "@/components/ui/BottomNav";

const NAV_ITEMS = [
  { href: "/driver/dashboard", label: "Home", icon: LayoutGrid },
  { href: "/driver/applications", label: "Applications", icon: Briefcase },
  { href: "/driver/saved", label: "Saved", icon: Heart },
  { href: "/driver/profile", label: "Profile", icon: User },
];

export function DriverSideNav() {
  return <SideNav items={NAV_ITEMS} />;
}

export function DriverBottomNav() {
  return <BottomNav items={NAV_ITEMS} />;
}
