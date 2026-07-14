"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { loginSchema, type LoginInput } from "@/validation/authSchemas";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setServerError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      setServerError(json.error ?? "Something went wrong.");
      return;
    }
    router.push(json.role === "EMPLOYER" ? "/employer/dashboard" : json.role === "ADMIN" ? "/admin/dashboard" : "/driver/dashboard");
    router.refresh();
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">{t("loginTitle")}</h1>
      <p className="mb-5 text-sm text-neutral-500">{t("loginSubtitle")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          <FieldError>{errors.email?.message}</FieldError>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("password")}</Label>
            <Link href="/auth/forgot-password" className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              {t("forgotPassword")}
            </Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
          <FieldError>{errors.password?.message}</FieldError>
        </div>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? t("loggingIn") : tc("login")}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-neutral-500">
        {t("noAccount")}{" "}
        <Link href="/auth/register" className="font-medium text-emerald-700 dark:text-emerald-400">
          {tc("signUp")}
        </Link>
      </p>
    </div>
  );
}
