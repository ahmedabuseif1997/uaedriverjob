"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Car, Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { registerSchema, type RegisterInput } from "@/validation/authSchemas";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "DRIVER" },
  });

  const role = watch("role");

  async function onSubmit(data: RegisterInput) {
    setServerError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      setServerError(json.error ?? "Something went wrong.");
      return;
    }
    router.push(json.role === "EMPLOYER" ? "/employer/dashboard" : "/driver/dashboard");
    router.refresh();
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">{t("registerTitle")}</h1>
      <p className="mb-5 text-sm text-neutral-500">{t("registerSubtitle")}</p>

      <div className="mb-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setValue("role", "DRIVER")}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm font-medium",
            role === "DRIVER"
              ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
              : "border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
          )}
        >
          <Car className="h-5 w-5" />
          {t("iAmDriver")}
        </button>
        <button
          type="button"
          onClick={() => setValue("role", "EMPLOYER")}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm font-medium",
            role === "EMPLOYER"
              ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
              : "border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
          )}
        >
          <Building2 className="h-5 w-5" />
          {t("iAmEmployer")}
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name">{role === "EMPLOYER" ? t("companyName") : t("fullName")}</Label>
          <Input id="name" autoComplete="name" {...register("name")} />
          <FieldError>{errors.name?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          <FieldError>{errors.email?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="password">{t("password")}</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
          <FieldError>{errors.password?.message}</FieldError>
        </div>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? t("creatingAccount") : t("createAccount")}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-neutral-500">
        {t("alreadyHaveAccount")}{" "}
        <Link href="/auth/login" className="font-medium text-emerald-700 dark:text-emerald-400">
          {tc("login")}
        </Link>
      </p>
    </div>
  );
}
