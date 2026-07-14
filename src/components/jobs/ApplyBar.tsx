"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { StickyBar } from "@/components/ui/StickyBar";
import { Sheet } from "@/components/ui/Sheet";
import { ChipMultiSelect } from "@/components/forms/ChipMultiSelect";
import { DRIVER_LICENSE_CATEGORY_LABELS, VEHICLE_TYPE_LABELS } from "@/lib/enumLabels";
import type { DriverLicenseCategory, VehicleType } from "@/generated/prisma/enums";

export function ApplyBar({
  jobId,
  isDriver,
  isLoggedIn,
  initialApplied,
  missingLicenseCategories,
  missingVehicleTypes,
}: {
  jobId: string;
  isDriver: boolean;
  isLoggedIn: boolean;
  initialApplied: boolean;
  missingLicenseCategories: DriverLicenseCategory[];
  missingVehicleTypes: VehicleType[];
}) {
  const t = useTranslations("jobs");
  const router = useRouter();
  const [applied, setApplied] = useState(initialApplied);
  const [applying, setApplying] = useState(false);
  const [showCoverNote, setShowCoverNote] = useState(false);
  const [coverNote, setCoverNote] = useState("");
  const [showMissingFieldsModal, setShowMissingFieldsModal] = useState(false);
  const [pickedLicense, setPickedLicense] = useState<DriverLicenseCategory[]>([]);
  const [pickedVehicle, setPickedVehicle] = useState<VehicleType[]>([]);
  const [error, setError] = useState<string | null>(null);

  const hasMissingFields = missingLicenseCategories.length > 0 || missingVehicleTypes.length > 0;

  async function submitApply(quickProfileUpdate?: { licenseCategories?: string[]; vehicleTypes?: string[] }) {
    setError(null);
    setApplying(true);
    const res = await fetch(`/api/jobs/${jobId}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverNote: coverNote || undefined, quickProfileUpdate }),
    });
    setApplying(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Something went wrong.");
      return;
    }
    setApplied(true);
    setShowMissingFieldsModal(false);
    router.refresh();
  }

  function onApplyClick() {
    if (!isLoggedIn) {
      router.push("/auth/register");
      return;
    }
    if (hasMissingFields) {
      setShowMissingFieldsModal(true);
      return;
    }
    submitApply();
  }

  if (!isDriver && isLoggedIn) return null;

  return (
    <>
      <StickyBar>
        {showCoverNote && !applied && (
          <Textarea
            placeholder={t("notePlaceholder")}
            value={coverNote}
            onChange={(e) => setCoverNote(e.target.value)}
            rows={2}
            className="mb-2"
          />
        )}
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        <div className="flex items-center gap-2">
          {!applied && !showCoverNote && (
            <button
              type="button"
              onClick={() => setShowCoverNote(true)}
              className="text-sm font-medium text-neutral-500 underline underline-offset-2"
            >
              {t("addNote")}
            </button>
          )}
          <Button
            fullWidth
            disabled={applied || applying}
            onClick={onApplyClick}
            className="ms-auto max-w-xs"
          >
            <Send className="h-4 w-4" />
            {applied ? t("appliedLabel") : applying ? t("applying") : isLoggedIn ? t("applyNow") : t("signUpToApply")}
          </Button>
        </div>
      </StickyBar>

      <Sheet open={showMissingFieldsModal} onClose={() => setShowMissingFieldsModal(false)} title={t("oneMoreThing")}>
        <p className="mb-4 text-sm text-neutral-500">{t("missingFieldsBody")}</p>
        {missingLicenseCategories.length > 0 && (
          <div className="mb-4">
            <p className="mb-1.5 text-sm font-medium">{t("licenseCategories")}</p>
            <ChipMultiSelect
              options={missingLicenseCategories.map((v) => ({ value: v, label: DRIVER_LICENSE_CATEGORY_LABELS[v] }))}
              value={pickedLicense}
              onChange={setPickedLicense}
            />
          </div>
        )}
        {missingVehicleTypes.length > 0 && (
          <div className="mb-4">
            <p className="mb-1.5 text-sm font-medium">{t("vehicleTypes")}</p>
            <ChipMultiSelect
              options={missingVehicleTypes.map((v) => ({ value: v, label: VEHICLE_TYPE_LABELS[v] }))}
              value={pickedVehicle}
              onChange={setPickedVehicle}
            />
          </div>
        )}
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        <Button
          fullWidth
          disabled={applying}
          onClick={() => submitApply({ licenseCategories: pickedLicense, vehicleTypes: pickedVehicle })}
        >
          {applying ? t("applying") : t("confirmAndApply")}
        </Button>
      </Sheet>
    </>
  );
}
