"use client";

import { LayoutGrid, Briefcase, Building2, CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";
import { BottomNav, SideNav } from "@/components/ui/BottomNav";

function useNavItems() {
  const t = useTranslations("nav");
  return [
    { href: "/employer/dashboard", label: t("home"), icon: LayoutGrid },
    { href: "/employer/jobs", label: t("listings"), icon: Briefcase },
    { href: "/employer/company", label: t("company"), icon: Building2 },
    { href: "/employer/billing", label: t("billing"), icon: CreditCard },
  ];
}

export function EmployerSideNav() {
  return <SideNav items={useNavItems()} />;
}

export function EmployerBottomNav() {
  return <BottomNav items={useNavItems()} />;
}
