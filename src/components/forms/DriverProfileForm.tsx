"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/Input";
import { ChipMultiSelect } from "@/components/forms/ChipMultiSelect";
import { FileUpload } from "@/components/forms/FileUpload";
import {
  driverProfileSchema,
  type DriverProfileInput,
  driverLicenseCategories,
  vehicleTypes,
  emirates,
  visaStatuses,
} from "@/validation/profileSchemas";
import {
  DRIVER_LICENSE_CATEGORY_LABELS,
  VEHICLE_TYPE_LABELS,
  EMIRATE_LABELS,
  VISA_STATUS_LABELS,
} from "@/lib/enumLabels";

const licenseOptions = driverLicenseCategories.map((v) => ({ value: v, label: DRIVER_LICENSE_CATEGORY_LABELS[v] }));
const vehicleOptions = vehicleTypes.map((v) => ({ value: v, label: VEHICLE_TYPE_LABELS[v] }));
const emirateOptions = emirates.map((v) => ({ value: v, label: EMIRATE_LABELS[v] }));

export function DriverProfileForm({ initial }: { initial: DriverProfileInput }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(initial.photoUrl ?? "");
  const [resumeUrl, setResumeUrl] = useState(initial.resumeUrl ?? "");

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(driverProfileSchema),
    defaultValues: initial,
  });

  async function onSubmit(data: DriverProfileInput) {
    setServerError(null);
    setSaved(false);
    const res = await fetch("/api/driver/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, photoUrl, resumeUrl }),
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
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl font-semibold text-neutral-400">
              {initial.fullName?.[0]?.toUpperCase() ?? "?"}
            </span>
          )}
        </div>
        <FileUpload kind="driver-photo" accept="image/*" label="Upload photo" currentUrl={photoUrl} onUploaded={setPhotoUrl} />
      </div>

      <div>
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" {...register("fullName")} />
        <FieldError>{errors.fullName?.message}</FieldError>
      </div>

      <div>
        <Label htmlFor="phone">Phone number</Label>
        <Input id="phone" placeholder="+9715XXXXXXXX" {...register("phone")} />
        <FieldError>{errors.phone?.message}</FieldError>
      </div>

      <div>
        <Label htmlFor="emiratesIdNumber">Emirates ID number</Label>
        <Input id="emiratesIdNumber" placeholder="784-XXXX-XXXXXXX-X" {...register("emiratesIdNumber")} />
        <FieldError>{errors.emiratesIdNumber?.message}</FieldError>
      </div>

      <div>
        <Label>Driving license categories</Label>
        <Controller
          control={control}
          name="licenseCategories"
          render={({ field }) => (
            <ChipMultiSelect options={licenseOptions} value={field.value} onChange={field.onChange} />
          )}
        />
      </div>

      <div>
        <Label>Vehicle types you can drive</Label>
        <Controller
          control={control}
          name="vehicleTypes"
          render={({ field }) => (
            <ChipMultiSelect options={vehicleOptions} value={field.value} onChange={field.onChange} />
          )}
        />
      </div>

      <div>
        <Label>Preferred Emirates</Label>
        <Controller
          control={control}
          name="preferredEmirates"
          render={({ field }) => (
            <ChipMultiSelect options={emirateOptions} value={field.value} onChange={field.onChange} />
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="visaStatus">Visa status</Label>
          <Select id="visaStatus" {...register("visaStatus")}>
            <option value="">Select...</option>
            {visaStatuses.map((v) => (
              <option key={v} value={v}>
                {VISA_STATUS_LABELS[v]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="yearsExperience">Years of experience</Label>
          <Input id="yearsExperience" type="number" min={0} max={60} {...register("yearsExperience")} />
        </div>
      </div>

      <div>
        <Label htmlFor="bio">About you</Label>
        <Textarea id="bio" rows={4} {...register("bio")} />
        <FieldError>{errors.bio?.message}</FieldError>
      </div>

      <div>
        <Label>Resume / CV</Label>
        <FileUpload
          kind="driver-resume"
          accept=".pdf,.doc,.docx"
          label={resumeUrl ? "Resume uploaded" : "Upload resume"}
          currentUrl={resumeUrl}
          onUploaded={setResumeUrl}
        />
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}
      {saved && <p className="text-sm text-emerald-600">Profile saved.</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
