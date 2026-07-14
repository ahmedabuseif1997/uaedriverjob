"use client";

import { LayoutGrid, Briefcase, Heart, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { BottomNav, SideNav } from "@/components/ui/BottomNav";

function useNavItems() {
  const t = useTranslations("nav");
  return [
    { href: "/driver/dashboard", label: t("home"), icon: LayoutGrid },
    { href: "/driver/applications", label: t("applications"), icon: Briefcase },
    { href: "/driver/saved", label: t("saved"), icon: Heart },
    { href: "/driver/profile", label: t("profile"), icon: User },
  ];
}

export function DriverSideNav() {
  return <SideNav items={useNavItems()} />;
}

export function DriverBottomNav() {
  return <BottomNav items={useNavItems()} />;
}
