import React from "react";
import { Building2 } from "lucide-react";
import { Input, SearchSelect, Card, CardContent, CardHeader, CardTitle  } from "@/components/common";
import { SubUnitFloorSectionProps } from "@/types/asset/sub-units.types";
import { withSelectPlaceholder } from "@/lib/utils/asset-utils/new-add-new-asset/dropdown-placeholder.utils";

export function SubUnitFloorSection({
  formData,
  setFormData,
  handleChange,
  handleFloorSelect,
  floorSelectOptions,
  subFloorOptions,
  dropdownOptions,
  dynamicSubUseTypes,
  area,
  t,
  inpClass
}: SubUnitFloorSectionProps) {
  return (
    <Card variant="bordered" padding="sm" className="shadow-sm border-slate-200/80 bg-white rounded-2xl">
      <CardHeader className="flex items-center gap-2 bg-gradient-to-r from-[#C8E1FC] via-[#DBEAFF] to-[#EDF5FF] border border-[#A3CBFA] rounded-xl py-1 px-2.5 mb-2.5 shadow-sm">
        <div className="bg-[#1d4ed8] p-1 rounded-lg text-white shadow-sm flex items-center justify-center shrink-0">
          <Building2 className="size-3.5 text-white" />
        </div>
        <CardTitle className="text-xs font-bold text-[#1d4ed8] uppercase tracking-widest">{t("subunit.sections.floorDetails")}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2 items-start">
        {floorSelectOptions.length > 1 ? (
          <SearchSelect
            label={t("subunit.fields.assignToFloor")}
            value={formData.floorId ? String(formData.floorId) : ""}
            onChange={(_name, val) => {
              const event = {
                target: { value: val }
              } as React.ChangeEvent<HTMLSelectElement>;
              handleFloorSelect(event);
            }}
            options={withSelectPlaceholder(floorSelectOptions.slice(1))}
            placeholder="--Select--"
          />
        ) : (
          <div className="flex flex-col">
            <span className="block text-[11px] font-medium text-gray-700 mb-1 truncate">{t("subunit.fields.assignToFloor")}</span>
            <div className={`${inpClass} flex items-center px-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-semibold`}>
              {t("notifications.noFloors", "No floors available")}
            </div>
          </div>
        )}
        <SearchSelect
          label={t("subunit.fields.subFloor")}
          name="subFloorId"
          value={formData.subFloorId ? String(formData.subFloorId) : ""}
          onChange={(_name, val) => setFormData((p: Record<string, unknown>) => ({ ...p, subFloorId: val }))}
          options={withSelectPlaceholder(subFloorOptions || [])}
          placeholder="--Select--"
        />
        <Input
          label={t("subunit.fields.constructionYear")}
          name="conYear"
          value={formData.conYear || ""}
          onChange={handleChange}
          placeholder={`e.g. ${new Date().getFullYear()}`}
          maxLength={4}
          className={inpClass}
        />
        <SearchSelect
          label={t("subunit.fields.constructionType")}
          name="conType"
          value={formData.conType || ""}
          onChange={(_name, val) => setFormData((p: Record<string, unknown>) => ({ ...p, conType: val }))}
          options={withSelectPlaceholder(dropdownOptions?.constructionTypes || [])}
          placeholder="--Select--"
        />
        <SearchSelect
          label={t("subunit.fields.typeOfUse")}
          name="useType"
          value={formData.useType || ""}
          onChange={(_name, val) => setFormData((p: Record<string, unknown>) => ({ ...p, useType: val, subUseType: "" }))}
          options={withSelectPlaceholder(dropdownOptions?.useTypes || [])}
          placeholder="--Select--"
        />
        <SearchSelect
          label={t("subunit.fields.subTypeOfUse")}
          name="subUseType"
          value={formData.subUseType || ""}
          onChange={(_name, val) => setFormData((p: Record<string, unknown>) => ({ ...p, subUseType: val }))}
          options={withSelectPlaceholder(
            dynamicSubUseTypes.length > 0
              ? dynamicSubUseTypes
              : (dropdownOptions?.subUseTypes || []).filter((o: { count: number; [key: string]: unknown }) => String(o.typeOfUseId) === String(formData.useType))
          )}
          placeholder="--Select--"
        />
        <Input
          label={t("subunit.fields.unitArea")}
          value={area}
          readOnly
          className={`${inpClass} bg-slate-50 text-slate-600 font-mono font-semibold cursor-default`}
        />
      </CardContent>
    </Card>
  );
}
