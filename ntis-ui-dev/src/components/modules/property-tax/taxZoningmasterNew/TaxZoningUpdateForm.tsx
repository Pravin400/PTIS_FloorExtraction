"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ValidationMessage } from "@/components/common/ValidationMessage";
import { SearchSelect, SearchSelectOption } from "@/components/common/SearchSelect";
import { MultiSelectDropdown } from "@/components/common/Dropdown";
import { Label } from "@/components/common/label";
import { TextArea } from "@/components/common/Textarea";
import { TaxZone, Ward } from "@/types/taxZoningRange.types";
import { comparePropertyNo } from "@/hooks/taxZoningRange/useTaxZoningRange";
import { DESCRIPTION_SANITIZE } from "@/lib/utils/validation-rules";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface TaxZoningUpdateFormProps {
  wardsData: Ward[];
  taxZones: TaxZone[];
  selectedWards: number[];
  setSelectedWards: (wards: number[]) => void;
  propertyFrom: string;
  setPropertyFrom: (val: string) => void;
  propertyTo: string;
  setPropertyTo: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  selectedZone: string;
  setSelectedZone: (val: string) => void;
  propertyOptions: SearchSelectOption[];
  isMultiWard: boolean;
  isEditMode: boolean;
  submitted: boolean;
  isWardValid: boolean;
  isZoneValid: boolean;
  isDescriptionValid: boolean;
  isRangeValid: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function TaxZoningUpdateForm({
  wardsData,
  taxZones,
  selectedWards,
  setSelectedWards,
  propertyFrom,
  setPropertyFrom,
  propertyTo,
  setPropertyTo,
  description,
  setDescription,
  selectedZone,
  setSelectedZone,
  propertyOptions,
  isMultiWard,
  isEditMode,
  submitted,
  isWardValid,
  isZoneValid,
  isDescriptionValid,
  isRangeValid,
  onSubmit,
}: TaxZoningUpdateFormProps) {
  const tUi = useTranslations("taxZoningRange.ui.form");
  const tRoot = useTranslations("taxZoningRange");
  const wardLabel = useAliasLabel("Ward", tRoot("aliasFallback.ward"));
  const taxZoneLabel = useAliasLabel("Tax Zone", tRoot("aliasFallback.taxZone"));
  const zoneOptions = taxZones.map((z) => ({ label: z.taxZoneNo, value: z.id.toString() }));
  const wardOptions = wardsData.map((w) => ({ label: w.wardNo, value: w.id.toString() }));

  // "To" options are always >= the selected "From" value
  const toPropertyOptions = useMemo(() => {
    if (!propertyFrom) return propertyOptions;
    return propertyOptions.filter((opt) => comparePropertyNo(opt.value, propertyFrom) >= 0);
  }, [propertyOptions, propertyFrom]);

  const noWardSelected = selectedWards.length === 0;

  const sanitizeDescription = (val: string) => val.replace(DESCRIPTION_SANITIZE, "");

  return (
    <form id="tax-zoning-form" onSubmit={onSubmit} noValidate className="bg-[#f8fbff] text-[#172033]">
      <div className="p-5 flex flex-col gap-5">

        {/* Ward Selection */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <Label required className="text-[12px] font-extrabold text-[#0b2f5b]">
              {tUi("selectWards", { ward: wardLabel })}
            </Label>
            <span className="text-[#17508e] text-[10px] bg-[#eef5fd] px-2 py-0.5 rounded-full">
              {selectedWards.length} {tUi("selected")}
            </span>
          </div>
          <div className={isEditMode ? "pointer-events-none opacity-60" : ""}>
            <MultiSelectDropdown
              options={wardOptions}
              value={selectedWards.map(String)}
              onChange={(vals) => setSelectedWards(vals.map(Number))}
              placeholder={tUi("selectWardsPlaceholder", { ward: wardLabel })}
              styles={{
                trigger: "border-[#c9d7e7] text-[12px] font-bold text-[#42526b] focus:ring-[#2e7cc9]",
                searchInput: "text-[12px]",
              }}
            />
          </div>
          {isMultiWard && (
            <div className="mt-2 text-[10px] font-bold text-[#9a6200] bg-[#fff9ed] p-2 rounded border border-[#ead6ad] flex items-start gap-1.5">
              <span>!</span>
              <span>{tUi("multiWardNote", { ward: wardLabel })}</span>
            </div>
          )}
          {submitted && !isWardValid && <ValidationMessage message={tUi("wardRequired", { ward: wardLabel })} />}
        </div>

        {/* Property Range (hidden if multiple wards) */}
        {!isMultiWard && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col">
              <Label className="text-[11px] font-extrabold text-[#42526b] mb-1">
                {tUi("propertyFrom")}
              </Label>
              <SearchSelect
                options={propertyOptions}
                value={propertyFrom}
                onChange={(_, val) => setPropertyFrom(val)}
                placeholder={noWardSelected ? tUi("selectWardFirst", { ward: wardLabel }) : tUi("propertyFromPlaceholder")}
                disabled={noWardSelected || propertyOptions.length === 0}
                disableSearch={false}
              />
            </div>
            <div className="flex flex-col">
              <Label className="text-[11px] font-extrabold text-[#42526b] mb-1">
                {tUi("propertyTo")}
              </Label>
              <SearchSelect
                options={toPropertyOptions}
                value={propertyTo}
                onChange={(_, val) => setPropertyTo(val)}
                placeholder={noWardSelected ? tUi("selectWardFirst", { ward: wardLabel }) : tUi("propertyToPlaceholder")}
                disabled={noWardSelected || propertyOptions.length === 0}
                disableSearch={false}
              />
            </div>
            {submitted && !isRangeValid && (
              <div className="col-span-2">
                <ValidationMessage message={tUi("rangeInvalid")} />
              </div>
            )}
          </div>
        )}

        {/* Tax Zone */}
        <div className="flex flex-col">
          <Label required className="text-[11px] font-extrabold text-[#42526b] mb-1">
            {tUi("taxZoneNo", { taxZone: taxZoneLabel })}
          </Label>
          <SearchSelect
            name="taxZone"
            options={zoneOptions}
            value={selectedZone}
            onChange={(_, val) => setSelectedZone(val)}
            placeholder={tUi("selectZone", { taxZone: taxZoneLabel })}
          />
          {submitted && !isZoneValid && <ValidationMessage message={tUi("zoneRequired", { taxZone: taxZoneLabel })} />}
        </div>

        {/* Zone Description */}
        <div className="flex flex-col">
          <TextArea
            label={tUi("zoneDescription", { taxZone: taxZoneLabel })}
            required
            value={description}
            onChange={(e) => setDescription(sanitizeDescription(e.target.value))}
            maxLength={200}
            showCharCount
            charCountLabel={tUi("charsSuffix")}
            className="h-24 text-[12px] resize-none"
            placeholder={tUi("descriptionPlaceholder")}
          />
          <span className="text-[9px] text-[#94a3b8] mt-0.5">
            {tUi("descriptionHint")}
          </span>
          {submitted && !isDescriptionValid && (
            <ValidationMessage message={tUi("descriptionInvalid")} />
          )}
        </div>
      </div>
    </form>
  );
}
