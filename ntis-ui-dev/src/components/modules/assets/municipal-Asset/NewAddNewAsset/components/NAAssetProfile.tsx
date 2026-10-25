"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { NAAssetProfileProps } from "@/types/asset/municipal-Asset/new-add-new-asset/buildBasicInfo.types";
import { NAAssetProfileAdministrative } from "./NAAssetProfileAdministrative";
import { NAAssetProfileDimensions } from "./NAAssetProfileDimensions";

export const NAAssetProfile = React.memo(function NAAssetProfile(props: NAAssetProfileProps) {
  const t = useTranslations("newAddNewAsset");
  const {
    zones = [],
    wards = [],
    moujas = [],
    subzones = [],
    assetConditions = [],
  } = props;

  const zoneOptions = [
    { label: "-- Select --", value: "" },
    ...zones.map((z) => ({
      label: z.zoneName || z.ZoneName || z.zoneNo || `Zone ${z.id}`,
      value: String(z.id),
    })),
  ];

  const wardOptions = [
    { label: "-- Select --", value: "" },
    ...wards.map((w) => ({
      label: w.wardName || w.WardName || w.wardNo || `Ward ${w.id}`,
      value: String(w.id),
    })),
  ];

  const moujaOptions = [
    { label: "-- Select --", value: "" },
    ...moujas.map((m) => ({
      label: m.moujaName || `Mouja ${m.id}`,
      value: String(m.id),
    })),
  ];

  const subzoneOptions = [
    { label: "-- Select --", value: "" },
    ...subzones.map((s) => ({
      label: s.subZoneName || s.subzoneName || s.subZoneNo || s.SubZoneNo || s.name || `Subzone ${s.id || ""}`,
      value: String(s.id || s.subZoneNo || s.SubZoneNo || ""),
    })),
  ];

  const conditionOptions = [
    { label: "-- Select --", value: "" },
    ...assetConditions.map((c) => ({
      label: c.conditionName || `Condition ${c.id}`,
      value: String(c.id),
    })),
  ];

  const encroachmentStatusOptions = [
    { label: "-- Select --", value: "" },
    { label: t("assetDetails.encroachments.clean"), value: "Clean" },
    { label: t("assetDetails.encroachments.partiallyEncroached"), value: "Partially Encroached" },
    { label: t("assetDetails.encroachments.fullyEncroached"), value: "Fully Encroached" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-visible h-full max-h-[390px] w-full min-w-0">
      {/* Card header */}
      <div className="px-3 py-1.5 border-b border-slate-100 flex items-center gap-2 bg-white shrink-0 h-[34px] rounded-t-xl">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18M3 7V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2M5 21V7m14 14V7m-7 4v4m-3-4v4m6-4v4" />
        </svg>
        <h3 className="text-[11.5px] font-black text-[#101b87]">{t("assetDetails.title")}</h3>
      </div>

      {/* Form body */}
      <div className="px-2.5 py-1 pr-1.5 flex flex-col justify-start flex-1 min-h-0 gap-y-0.5 overflow-y-visible w-full min-w-0">
        <NAAssetProfileAdministrative
          formData={props.formData}
          errors={props.errors}
          showError={props.showError}
          handleChange={props.handleChange}
          updateFormData={props.updateFormData}
          zoneOptions={zoneOptions}
          wardOptions={wardOptions}
          moujaOptions={moujaOptions}
          subzoneOptions={subzoneOptions}
          isLoadingWards={props.isLoadingWards}
          isLoadingSubzones={props.isLoadingSubzones}
        />
        <NAAssetProfileDimensions
          formData={props.formData}
          errors={props.errors}
          showError={props.showError}
          handleChange={props.handleChange}
          updateFormData={props.updateFormData}
          conditionOptions={conditionOptions}
          encroachmentStatusOptions={encroachmentStatusOptions}
        />
      </div>
    </div>
  );
});
