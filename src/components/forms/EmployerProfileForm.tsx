"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/Input";
import { FileUpload } from "@/components/forms/FileUpload";
import { employerProfileSchema, type EmployerProfileInput, emirates } from "@/validation/profileSchemas";
import { EMIRATE_LABELS } from "@/lib/enumLabels";

export function EmployerProfileForm({ initial }: { initial: EmployerProfileInput }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl ?? "");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmployerProfileInput>({
    resolver: zodResolver(employerProfileSchema),
    defaultValues: initial,
  });

  async function onSubmit(data: EmployerProfileInput) {
    setServerError(null);
    setSaved(false);
    const res = await fetch("/api/employer/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, logoUrl }),
    });
    const json = await res.json();
    if (!res.ok) {
      setServerError(json.error ?? "Something went wrong.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl font-semibold text-neutral-400">
              {initial.companyName?.[0]?.toUpperCase() ?? "?"}
            </span>
          )}
        </div>
        <FileUpload kind="company-logo" accept="image/*" label="Upload logo" currentUrl={logoUrl} onUploaded={setLogoUrl} />
      </div>

      <div>
        <Label htmlFor="companyName">Company name</Label>
        <Input id="companyName" {...register("companyName")} />
        <FieldError>{errors.companyName?.message}</FieldError>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contactPhone">Contact phone</Label>
          <Input id="contactPhone" placeholder="+9714XXXXXXX" {...register("contactPhone")} />
        </div>
        <div>
          <Label htmlFor="emirate">Emirate</Label>
          <Select id="emirate" {...register("emirate")}>
            <option value="">Select...</option>
            {emirates.map((v) => (
              <option key={v} value={v}>
                {EMIRATE_LABELS[v]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="tradeLicenseNo">Trade license number</Label>
        <Input id="tradeLicenseNo" {...register("tradeLicenseNo")} />
      </div>

      <div>
        <Label htmlFor="website">Website</Label>
        <Input id="website" placeholder="https://" {...register("website")} />
        <FieldError>{errors.website?.message}</FieldError>
      </div>

      <div>
        <Label htmlFor="aboutCompany">About the company</Label>
        <Textarea id="aboutCompany" rows={4} {...register("aboutCompany")} />
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}
      {saved && <p className="text-sm text-emerald-600">Profile saved.</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
