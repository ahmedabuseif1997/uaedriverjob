"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/validation/authSchemas";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(data: ForgotPasswordInput) {
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center">
        <h1 className="mb-2 text-lg font-semibold">{t("checkEmail")}</h1>
        <p className="text-sm text-neutral-500">{t("checkEmailBody")}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">{t("resetTitle")}</h1>
      <p className="mb-5 text-sm text-neutral-500">{t("resetSubtitle")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          <FieldError>{errors.email?.message}</FieldError>
        </div>

        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? t("sending") : t("sendResetLink")}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-neutral-500">
        <Link href="/auth/login" className="font-medium text-emerald-700 dark:text-emerald-400">
          {t("backToLogin")}
        </Link>
      </p>
    </div>
  );
}
