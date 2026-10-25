
import React from "react";
import { Checkbox } from "@/components/common/checkbox";
import { Input } from "@/components/common/Input";
import { TextArea } from "@/components/common/Textarea";
import { ValidationMessage } from "@/components/common/ValidationMessage";
import {
  CODE_MAX,
  NAME_MAX,
  DESCRIPTION_MAX,
  VALUATION_TYPE_MAX,
} from "@/hooks/asset-masters/asset-category/validation";
import type { FormFieldsSectionProps } from "@/types/asset-masters/asset-category.types";

interface ExtendedFormFieldsSectionProps extends FormFieldsSectionProps {
  codeRef?: React.RefObject<HTMLInputElement | null>;
}

export function FormFieldsSection({
  formData,
  errors,
  showError,
  onChange,
  onBlur,
  onCheckboxChange,
  t,
  isPending = false,
  codeRef,
}: ExtendedFormFieldsSectionProps) {
  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
      <div>
        <Input
          ref={codeRef}
          name="code"
          label={t("labels.code")}
          required
          value={formData.code}
          placeholder={t("placeholders.code")}
          onChange={onChange}
          onBlur={onBlur}
          disabled={isPending}
          maxLength={CODE_MAX}
          error={showError("code") ? " " : undefined}
          className="placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
        />
        <ValidationMessage message={errors.code} visible={showError("code")} />
      </div>

      <div>
        <Input
          name="name"
          label={t("labels.name")}
          required
          value={formData.name}
          placeholder={t("placeholders.name")}
          onChange={onChange}
          onBlur={onBlur}
          disabled={isPending}
          maxLength={NAME_MAX}
          error={showError("name") ? " " : undefined}
          className="placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
        />
        <ValidationMessage message={errors.name} visible={showError("name")} />
      </div>

      <div>
        <TextArea
          name="description"
          label={t("labels.description")}
          rows={4}
          value={formData.description}
          placeholder={t("placeholders.description")}
          onChange={onChange}
          onBlur={onBlur}
          disabled={isPending}
          maxLength={DESCRIPTION_MAX}
          error={showError("description") ? true : false}
          className="w-full placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
        />
        <ValidationMessage message={errors.description} visible={showError("description")} />
      </div>

      {/* Category Configuration Options */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <h3 className="font-medium text-slate-800 text-sm">{t("labels.categoryConfiguration")}</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className={`rounded-xl p-3 border flex items-center justify-between ${!formData.hasFloorDetails ? "border-gray-200 bg-gray-50" : "border-gray-100 bg-gray-50/50 opacity-60"}`}>
            <div className="font-medium text-slate-900 text-sm">{t("labels.isMovable")}</div>
            <Checkbox checked={!!formData.isMovable} onCheckedChange={(v) => onCheckboxChange("isMovable", !!v)} disabled={isPending || !!formData.hasFloorDetails} className={!!formData.isMovable ? "bg-slate-800 border-slate-800 text-white [&_svg]:stroke-[3] [&_svg]:text-white" : ""} />
          </div>

          <div className={`rounded-xl p-3 border flex items-center justify-between ${!formData.isMovable ? "border-gray-200 bg-gray-50" : "border-gray-100 bg-gray-50/50 opacity-60"}`}>
            <div className="font-medium text-slate-900 text-sm">{t("labels.hasFloorDetails")}</div>
            <Checkbox checked={!!formData.hasFloorDetails} onCheckedChange={(v) => onCheckboxChange("hasFloorDetails", !!v)} disabled={isPending || !!formData.isMovable} className={!!formData.hasFloorDetails ? "bg-slate-800 border-slate-800 text-white [&_svg]:stroke-[3] [&_svg]:text-white" : ""} />
          </div>

          <div className="rounded-xl p-3 border border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="font-medium text-slate-900 text-sm">{t("labels.hasInventory")}</div>
            <Checkbox checked={!!formData.hasInventory} onCheckedChange={(v) => onCheckboxChange("hasInventory", !!v)} disabled={isPending} className={!!formData.hasInventory ? "bg-slate-800 border-slate-800 text-white [&_svg]:stroke-[3] [&_svg]:text-white" : ""} />
          </div>

          <div className={`rounded-xl p-3 border flex items-center justify-between ${formData.hasInventory ? "border-gray-200 bg-gray-50" : "border-gray-100 bg-gray-50/50 opacity-60"}`}>
            <div className="font-medium text-slate-900 text-sm">{t("labels.isInventoryMandatory")}</div>
            <Checkbox checked={!!formData.isInventoryMandatory} onCheckedChange={(v) => onCheckboxChange("isInventoryMandatory", !!v)} disabled={isPending || !formData.hasInventory} className={!!formData.isInventoryMandatory ? "bg-slate-800 border-slate-800 text-white [&_svg]:stroke-[3] [&_svg]:text-white" : ""} />
          </div>

          <div className="rounded-xl p-3 border border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="font-medium text-slate-900 text-sm">{t("labels.hasLegalCompliance")}</div>
            <Checkbox checked={!!formData.hasLegalCompliance} onCheckedChange={(v) => onCheckboxChange("hasLegalCompliance", !!v)} disabled={isPending} className={!!formData.hasLegalCompliance ? "bg-slate-800 border-slate-800 text-white [&_svg]:stroke-[3] [&_svg]:text-white" : ""} />
          </div>
        </div>

        <div>
          <Input
            name="valuationType"
            label={t("labels.valuationType")}
            required
            value={formData.valuationType || ""}
            onChange={onChange}
            onBlur={onBlur}
            disabled={isPending}
            placeholder={t("placeholders.valuationType")}
            maxLength={VALUATION_TYPE_MAX}
            error={showError("valuationType") ? " " : undefined}
            className="placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
          />
          <ValidationMessage message={errors.valuationType} visible={showError("valuationType")} />
        </div>
      </div>
    </div>
  );
}

