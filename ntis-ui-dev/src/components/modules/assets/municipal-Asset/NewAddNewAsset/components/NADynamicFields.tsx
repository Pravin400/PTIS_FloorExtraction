"use client";

/**
 * NADynamicFields
 *
 * Renders the "Additional Details" card for the New Add New Asset page.
 *
 * Field definitions are loaded from the API using the same server action
 * (`fetchBuildingFieldDefinitions`) as the old Add New Asset page. They
 * change automatically when the selected category or asset type changes.
 *
 * Field values are stored in `formData.attributes` (the global AssetFormContext)
 * so they survive step navigation and are included in the save payload.
 *
 * The actual per-field rendering is delegated to the existing `DynamicFieldInput`
 * component (shared with the old Add New Asset) — no duplication of field-type
 * logic.
 */

import React from "react";
import { Database } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNAAssetForm } from "../NAAssetFormContext";
import { useNADynamicFields } from "@/hooks/asset/municipal-Asset/new-add-new-asset/useNADynamicFields";
import { groupAndMergeFields } from "@/lib/utils/asset-utils/new-add-new-asset/FieldRendererUtils";
import { DynamicFieldInput } from "../basic-info/DynamicFieldInput";

import type { NADynamicFieldsProps } from "@/types/asset/municipal-Asset/new-add-new-asset";

export const NADynamicFields = React.memo(function NADynamicFields({
  fields: propFields,
  loading: propLoading,
  formData: propFormData,
  onAttributeChange: propOnAttributeChange,
}: NADynamicFieldsProps = {}) {
  const t = useTranslations("newAddNewAsset");
  const contextForm = useNAAssetForm();

  const formData = propFormData || contextForm.formData;
  const handleAttributeChange = propOnAttributeChange || contextForm.handleAttributeChange;

  const categoryId = Number(formData.categoryId) || 0;
  const typeId = Number(formData.typeId) || 0;

  // Only fetch dynamic fields from hook if not already provided via props by the orchestrator
  const shouldFetchInHook = propFields === undefined;
  const hookResult = useNADynamicFields(
    shouldFetchInHook ? categoryId : 0,
    shouldFetchInHook ? typeId : 0,
    propFields
  );
  const fields = propFields ?? hookResult.fields;
  const loading = propLoading !== undefined ? propLoading : hookResult.loading;
  const error = hookResult.error;

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-full">
        {/* Card header */}
        <div className="px-3 py-1.5 border-b border-slate-100 flex items-center gap-2 bg-white shrink-0 h-[34px]">
          <Database className="w-3.5 h-3.5 text-[#2563EB]" />
          <h3 className="text-[11.5px] font-black text-[#101b87]">{t("additionalDetails.title")}</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-blue-100 border-t-blue-600 animate-spin" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {t("additionalDetails.loadingFields")}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty / error state ────────────────────────────────────────────────
  if (!loading && (fields.length === 0 || error)) {
    return null;
  }

  // ── Group fields into sections ─────────────────────────────────────────
  const mergedSections = groupAndMergeFields(fields);

  if (mergedSections.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-full max-h-[390px]">
      {/* Card header */}
      <div className="px-3 py-1.5 border-b border-slate-100 flex items-center gap-2 bg-white shrink-0 h-[34px]">
        <Database className="w-3.5 h-3.5 text-[#2563EB]" />
        <h3 className="text-[11.5px] font-black text-[#101b87]">{t("additionalDetails.title")}</h3>
      </div>

      {/* Scrollable form body */}
      <div className="px-2.5 py-1.5 pr-1.5 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {mergedSections.map((section) => (
          <div key={section.title} className="mb-3 last:mb-0">
            {/* Section separator (only when there is more than one section) */}
            {mergedSections.length > 1 && (
              <div className="flex items-center gap-2 mb-1.5 mt-1">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[9px] font-black text-[#101b87] uppercase tracking-wide whitespace-nowrap">
                  {section.title}
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {[...section.fields]
                .sort((a, b) => {
                  // Push boolean/checkbox fields to the end of each section
                  const aIsBool =
                    a.fieldType?.toLowerCase() === "checkbox" ||
                    a.fieldType?.toLowerCase() === "boolean";
                  const bIsBool =
                    b.fieldType?.toLowerCase() === "checkbox" ||
                    b.fieldType?.toLowerCase() === "boolean";
                  if (aIsBool && !bIsBool) return 1;
                  if (!aIsBool && bIsBool) return -1;
                  return 0;
                })
                .map((field) => (
                  <div key={field.id} className="flex flex-col gap-0.5 min-w-0">
                    <DynamicFieldInput
                      field={field}
                      formData={formData}
                      onAttributeChange={handleAttributeChange}
                      isCompact={true}
                    />
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
