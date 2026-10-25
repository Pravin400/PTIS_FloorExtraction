"use client";

import { useMemo, useEffect } from "react";
import { Input, Select, ValidationMessage } from "@/components/common";
import { PartitionFormState, PartitionFormErrors } from "@/types/zone-master/properties/partition-form.types";
import { SocietyWingDetailItem } from "@/types/zone-master/properties/society-wing-details.types";
import { SocietyDetailItem } from "@/types/zone-master/properties/societyDetails.types";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface AmenitySelectionProps {
  form: PartitionFormState;
  setForm: React.Dispatch<React.SetStateAction<PartitionFormState>>;
  errors: PartitionFormErrors;
  setErrors: React.Dispatch<React.SetStateAction<PartitionFormErrors>>;
  wingDetails: SocietyWingDetailItem[];
  /** The property's single SocietyDetailsMast row (0 or 1 item), from GET /SocietyDetails */
  societyDetails: SocietyDetailItem[];
  calculateMaxAmenity: (wingName?: string | null) => number;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export function AmenitySelection({
  form,
  setForm,
  errors,
  setErrors,
  wingDetails,
  societyDetails,
  calculateMaxAmenity,
  t,
}: AmenitySelectionProps) {
  const wingAlias = useAliasLabel("Wing", t("defaults.wing"));

  // "Main Society" (property-level, no wing) option first, then real wings
  // from society wing details. The Main Society option's value stays "" -
  // this is the existing "no wing selected" sentinel used everywhere else
  // (usePartitionSubmit, usePartitionFormValidation, calculateMaxAmenity).
  const wingOptions = useMemo(() => {
    const mainSocietyLabel = societyDetails[0]?.societyName?.trim() || t("partitionForm.amenity.mainSociety");
    const mainSocietyOption = [
      { value: "", label: mainSocietyLabel },
    ];

    const actualWingOptions = wingDetails
      .filter((detail) => typeof detail.wingNo === "string" && detail.wingNo.trim() !== "")
      .map((detail) => ({
        value: detail.wingNo,
        label: detail.wingName?.trim() || detail.wingNo,
      }));

    return [...mainSocietyOption, ...actualWingOptions];
  }, [wingDetails, societyDetails, t]);

  // Calculate max amenity based on selected wing
  const maxAmenity = useMemo(() => {
    return calculateMaxAmenity(form.selectedWingForAmenity || null);
  }, [calculateMaxAmenity, form.selectedWingForAmenity]);

  // Auto-set fromAmenity when maxAmenity changes
  useEffect(() => {
    const newFromAmenity = String(maxAmenity + 1);
    if (form.fromAmenity !== newFromAmenity) {
      setForm(prev => ({
        ...prev,
        fromAmenity: newFromAmenity,
      }));
    }
  }, [maxAmenity, form.fromAmenity, setForm]);

  // Calculate amenity display text
  const amenityDisplayText = useMemo(() => {
    if (!form.fromAmenity || !form.toAmenity) return "";
    
    const prefix = form.selectedWingForAmenity 
      ? `${form.selectedWingForAmenity}-AM`
      : "AM";
    
    const from = parseInt(form.fromAmenity);
    const to = parseInt(form.toAmenity);
    const count = Math.max(0, to - from + 1);
    
    return `${prefix}${from} ${t("partitionForm.to")} ${prefix}${to} (${count} ${t("partitionForm.amenity.amenities")})`;
  }, [form.selectedWingForAmenity, form.fromAmenity, form.toAmenity, t]);

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          {t("partitionForm.amenity.description", { wing: wingAlias })}
        </p>
      </div>

      {/* Wing Selection */}
      <div>
        <Select
          label={t("partitionForm.amenity.selectWing", { wing: wingAlias })}
          value={form.selectedWingForAmenity}
          onChange={(_, value) => {
            setForm({ ...form, selectedWingForAmenity: value, toAmenity: "" });
            setErrors({ ...errors, selectedWingForAmenity: undefined, toAmenity: undefined });
          }}
          options={wingOptions}
          placeholder={t("partitionForm.amenity.placeholders.selectWing", { wing: wingAlias })}
        />
        <ValidationMessage
          message={errors.selectedWingForAmenity}
          visible={!!errors.selectedWingForAmenity}
          type="error"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            label={t("partitionForm.amenity.fromAmenity")}
            type="number"
            value={form.fromAmenity}
            onChange={(e) => {
              setForm({ ...form, fromAmenity: e.target.value });
              setErrors({ ...errors, fromAmenity: undefined });
            }}
            placeholder={t("partitionForm.amenity.placeholders.fromAmenity")}
            required
            disabled
            className="bg-gray-50 font-bold text-blue-800"
          />
          <ValidationMessage
            message={errors.fromAmenity}
            visible={!!errors.fromAmenity}
            type="error"
          />
        </div>

        <div>
          <Input
            label={t("partitionForm.amenity.toAmenity")}
            type="text"
            inputMode="numeric"
            maxLength={3}
            value={form.toAmenity}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 3);
              setForm({ ...form, toAmenity: value });
              setErrors({ ...errors, toAmenity: undefined });
            }}
            placeholder={t("partitionForm.amenity.placeholders.toAmenity")}
            required
          />
          <ValidationMessage
            message={errors.toAmenity}
            visible={!!errors.toAmenity}
            type="error"
          />
        </div>
      </div>

      {amenityDisplayText && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-800">
            {t("partitionForm.amenity.amenitiesWillBeCreated")} {amenityDisplayText}
          </p>
        </div>
      )}
    </div>
  );
}
  