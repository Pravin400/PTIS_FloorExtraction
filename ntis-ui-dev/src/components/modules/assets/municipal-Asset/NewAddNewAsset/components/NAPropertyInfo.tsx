'use client';


import React, { useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { NAPropertyInfoProps } from "@/types/asset/municipal-Asset/new-add-new-asset/buildBasicInfo.types";
import { useTransliteration } from "@/hooks/asset/municipal-Asset/new-add-new-asset/useTransliteration";
import { NAPropertyOwnershipSection } from "./NAPropertyOwnershipSection";
import { NAPropertyInChargeSection } from "./NAPropertyInChargeSection";

export const NAPropertyInfo = React.memo(function NAPropertyInfo(props: NAPropertyInfoProps) {
  const t = useTranslations("newAddNewAsset");
  const {
    formData,
    handleChange,
    updateFormData,
    departments = [],
    ownershipTypes = [],
    designations = [],
  } = props;

  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const { scheduleAutoTransliterate: scheduleAssetNameTranslit } =
    useTransliteration(locale, formData.assetNameRegional || "", (converted) => {
      updateFormData({ assetNameRegional: converted });
    });

  const { handleBlurTransliterate: blurInChargeTranslit, scheduleAutoTransliterate: scheduleInChargeTranslit } =
    useTransliteration(locale, formData.inChargeNameRegional || "", (converted) => {
      updateFormData({ inChargeNameRegional: converted });
    });

  const { handleBlurTransliterate: blurAddressTranslit, scheduleAutoTransliterate: scheduleAddressTranslit } =
    useTransliteration(locale, formData.fullAddressRegional || "", (converted) => {
      updateFormData({ fullAddressRegional: converted });
    });

  const handleChangeWithTranslit = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      handleChange(e);
      if (e.target.name === "assetName") {
        scheduleAssetNameTranslit(e.target.value);
      } else if (e.target.name === "inChargeName") {
        scheduleInChargeTranslit(e.target.value);
      } else if (e.target.name === "fullAddress") {
        scheduleAddressTranslit(e.target.value);
      }
    },
    [handleChange, scheduleAssetNameTranslit, scheduleInChargeTranslit, scheduleAddressTranslit]
  );

  const handleInChargeRegionalBlur = useCallback(
    async (e: React.FocusEvent<HTMLInputElement>) => {
      await blurInChargeTranslit(e.target.value);
    },
    [blurInChargeTranslit]
  );

  const handleAddressRegionalBlur = useCallback(
    async (e: React.FocusEvent<HTMLTextAreaElement>) => {
      await blurAddressTranslit(e.target.value);
    },
    [blurAddressTranslit]
  );

  const deptOptions = React.useMemo(
    () => [
      { label: "-- Select --", value: "" },
      ...departments.map((d) => ({
        label: d.departmentName || d.owningDepartmentName || `Department ${d.id}`,
        value: String(d.id),
      })),
    ],
    [departments]
  );

  const ownershipOptions = React.useMemo(
    () => [
      { label: "-- Select --", value: "" },
      ...(ownershipTypes.length > 0
        ? ownershipTypes.map((ot) => ({
          label: ot.ownershipTypeName || ot.name || ot.code || `Ownership ${ot.id}`,
          value: ot.ownershipTypeName || ot.name || String(ot.id),
        }))
        : [
          { label: t("kycDetails.ownershipOptions.municipal"), value: "municipal" },
          { label: t("kycDetails.ownershipOptions.private"), value: "private" },
        ]),
    ],
    [ownershipTypes, t]
  );

  const designationOptions = React.useMemo(
    () => [
      { label: "-- Select --", value: "" },
      ...designations.map((d) => ({
        label: d.designationName || d.name || `Designation ${d.id}`,
        value: String(d.id),
      })),
    ],
    [designations]
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-visible h-full max-h-[390px]">
      <div className="px-3 py-1.5 border-b border-slate-100 flex items-center gap-2 bg-white shrink-0 h-[34px] rounded-t-xl">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <h3 className="text-[11.5px] font-black text-[#101b87]">{t("kycDetails.title")}</h3>
      </div>

      <div className="px-2.5 py-1 pr-1.5 flex flex-col justify-start flex-1 min-h-0 gap-y-0.5 overflow-y-auto custom-scrollbar">
        <NAPropertyOwnershipSection
          formData={props.formData}
          errors={props.errors}
          showError={props.showError}
          handleChange={props.handleChange}
          deptOptions={deptOptions}
          ownershipOptions={ownershipOptions}
          handleChangeWithTranslit={handleChangeWithTranslit}
          updateFormData={props.updateFormData}
        />
        <NAPropertyInChargeSection
          formData={props.formData}
          errors={props.errors}
          showError={props.showError}
          handleChange={props.handleChange}
          updateFormData={props.updateFormData}
          designationOptions={designationOptions}
          isLoadingDesignations={props.isLoadingDesignations}
          handleChangeWithTranslit={handleChangeWithTranslit}
          handleInChargeRegionalBlur={handleInChargeRegionalBlur}
          handleAddressRegionalBlur={handleAddressRegionalBlur}
        />
      </div>
    </div>
  );
});
