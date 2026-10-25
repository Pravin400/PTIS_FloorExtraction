"use client";

import type React from "react";
import { useMemo } from "react";
import { Input, ValidationMessage, SearchSelect, type SearchSelectOption } from "@/components/common";
import { GisKpiMasterFormModel } from "@/types/gis-master/gis-kpi-master.types";
import { PRESET_COLORS, LUCIDE_KPI_ICONS, DynamicLucideIcon } from "../constants";

interface FormFieldsSectionProps {
  formData: GisKpiMasterFormModel;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  errors: Partial<Record<keyof GisKpiMasterFormModel, string>>;
  showError: (field: keyof GisKpiMasterFormModel) => boolean;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  isActive?: boolean;
  isEdit?: boolean;
  onColorSelect?: (color: string) => void;
}

export const FormFieldsSection = ({
  formData,
  handleChange,
  handleBlur,
  errors,
  showError,
  t,
  isActive = true,
  isEdit = false,
  onColorSelect,
}: FormFieldsSectionProps) => {
  const iconSelectOptions: SearchSelectOption[] = useMemo(() => {
    return LUCIDE_KPI_ICONS.map((ico) => {
      const IconComponent = ico.icon;
      return {
        value: ico.value,
        label: ico.label,
        icon: <IconComponent className="w-4 h-4 text-slate-700" />,
      };
    });
  }, []);

  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
      {/* KPI Code */}
      <div>
        <Input
          name="kpiCode"
          label={t("form.fields.kpiCode.label")}
          required
          placeholder={t("form.fields.kpiCode.placeholder")}
          value={formData.kpiCode}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={!isActive || isEdit}
          fullWidth
          className="text-gray-700"
        />
        <ValidationMessage
          message={errors.kpiCode}
          visible={showError("kpiCode")}
        />
      </div>

      {/* Default Title */}
      <div>
        <Input
          name="defaultTitle"
          label={t("form.fields.defaultTitle.label")}
          required
          placeholder={t("form.fields.defaultTitle.placeholder")}
          value={formData.defaultTitle}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={!isActive}
          fullWidth
          className="text-gray-700"
        />
        <ValidationMessage
          message={errors.defaultTitle}
          visible={showError("defaultTitle")}
        />
      </div>

      {/* Default Icon with Lucide Icons */}
      <div className="space-y-1.5">
        <div className="flex items-end gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center border border-gray-300 bg-white shrink-0 shadow-2xs"
            style={{
              backgroundColor: `${formData.defaultColor || "#2563EB"}15`,
              color: formData.defaultColor || "#2563EB",
            }}
            title={formData.defaultIcon || "Default icon"}
          >
            <DynamicLucideIcon name={formData.defaultIcon} className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <SearchSelect
              id="kpi-default-icon"
              name="defaultIcon"
              label={t("form.fields.defaultIcon.label")}
              required
              options={iconSelectOptions}
              value={formData.defaultIcon}
              onChange={(_name, val) => {
                handleChange({
                  target: { name: "defaultIcon", value: val },
                } as React.ChangeEvent<HTMLInputElement>);
              }}
              disabled={!isActive}
              placeholder={t("form.fields.defaultIcon.placeholder")}
              className={`w-full h-10 text-sm ${showError("defaultIcon") ? "!border-red-400" : ""}`}
            />
          </div>
        </div>
        <ValidationMessage
          message={errors.defaultIcon}
          visible={showError("defaultIcon")}
        />
      </div>

      {/* Default Color */}
      <div className="space-y-2">
        <div className="flex items-end gap-3">
          <input
            type="color"
            value={formData.defaultColor.startsWith("#") && formData.defaultColor.length === 7 ? formData.defaultColor : "#2563EB"}
            onChange={(e) => {
              if (onColorSelect) {
                onColorSelect(e.target.value);
              } else {
                handleChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
              }
            }}
            disabled={!isActive}
            className="h-10 w-12 cursor-pointer rounded-lg border border-gray-300 p-0.5 bg-white shadow-xs shrink-0"
            title="Pick a color"
          />
          <div className="flex-1">
            <Input
              label={t("form.fields.defaultColor.label")}
              required
              name="defaultColor"
              placeholder={t("form.fields.defaultColor.placeholder")}
              value={formData.defaultColor}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={!isActive}
              fullWidth
              className="h-10 text-gray-700 font-mono"
            />
          </div>
        </div>

        {/* Preset Color Swatches */}
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <span className="text-xs text-slate-500 mr-1">{t("form.presets")}</span>
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              disabled={!isActive}
              onClick={() => {
                if (onColorSelect) {
                  onColorSelect(color);
                }
              }}
              style={{ backgroundColor: color }}
              className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${formData.defaultColor.toUpperCase() === color.toUpperCase()
                  ? "border-blue-600 ring-2 ring-blue-300"
                  : "border-white shadow-xs"
                }`}
              title={color}
            />
          ))}
        </div>

        <ValidationMessage
          message={errors.defaultColor}
          visible={showError("defaultColor")}
        />
      </div>
    </div>
  );
};
