"use client";

import { LayoutGrid, Briefcase, Users, CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";
import { BottomNav, SideNav } from "@/components/ui/BottomNav";

function useNavItems() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  return [
    { href: "/admin/dashboard", label: tc("dashboard"), icon: LayoutGrid },
    { href: "/admin/jobs", label: t("jobs"), icon: Briefcase },
    { href: "/admin/users", label: t("users"), icon: Users },
    { href: "/admin/payments", label: t("payments"), icon: CreditCard },
  ];
}

export function AdminSideNav() {
  return <SideNav items={useNavItems()} />;
}

export function AdminBottomNav() {
  return <BottomNav items={useNavItems()} />;
}
