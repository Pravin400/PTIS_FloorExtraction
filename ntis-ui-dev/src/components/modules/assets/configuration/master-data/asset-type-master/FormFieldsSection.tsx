import React from "react";
import { Label } from "@/components/common/label";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/select";
import { RadioGroup, RadioGroupItem } from "@/components/common/radio-group";
import { ValidationMessage } from "@/components/common/ValidationMessage";
import { ToggleSwitch } from "@/components/common/ToggleSwitch";
import { TextArea } from "@/components/common/Textarea";
import type { FormFieldsSectionProps } from "@/types/asset-masters/asset-type.types";

interface ExtendedFormFieldsSectionProps extends FormFieldsSectionProps {
  codeRef?: React.RefObject<HTMLInputElement | null>;
}

export function FormFieldsSection({
  formData,
  errors,
  showError,
  onChange,
  onBlur,
  onSelectChange,
  onRadioChange,
  onToggleSubUnit,
  t,
  categoryOptions,
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
          onChange={onChange}
          onBlur={onBlur}
          placeholder={t("placeholders.code")}
          maxLength={15}
          error={showError("code") ? " " : undefined}
          className="placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
        />
        <ValidationMessage message={errors.code} visible={showError("code")} />
      </div>

      <div className="space-y-1">
        <Label className="block text-sm font-medium text-slate-700">
          {t("labels.category")} <span className="text-red-500">*</span>
        </Label>
        <Select
          options={categoryOptions}
          value={String(formData.group ?? "")}
          onChange={(_, v) => onSelectChange("group", String(v))}
          placeholder={t("placeholders.category")}
          error={showError("group") ? " " : undefined}
          className="w-full placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
        />
        <ValidationMessage message={errors.group} visible={showError("group")} />
      </div>

      <div>
        <Input
          name="name"
          label={t("labels.name")}
          required
          value={formData.name}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={t("placeholders.name")}
          maxLength={50}
          error={showError("name") ? " " : undefined}
          className="placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
        />
        <ValidationMessage message={errors.name} visible={showError("name")} />
      </div>

      <div>
        <Input
          name="typeNameLocal"
          label={t("labels.typeNameLocal")}
          value={formData.typeNameLocal || ""}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={t("placeholders.typeNameLocal")}
          maxLength={200}
          error={showError("typeNameLocal") ? " " : undefined}
          className="placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
        />
        <ValidationMessage message={errors.typeNameLocal} visible={showError("typeNameLocal")} />
      </div>

      <div className="space-y-3">
        <Label className="block text-sm font-medium text-slate-700">
          {t("labels.registrationType")} <span className="text-red-500">*</span>
        </Label>
        <RadioGroup
          className="flex items-center gap-6"
          value={formData.allowUnitRegistration ? "unit" : formData.allowRoomRegistration ? "room" : ""}
          onValueChange={onRadioChange}
        >
          <div className="flex items-center space-x-2 cursor-pointer">
            <RadioGroupItem value="unit" id="reg-unit" className="border-gray-300 text-blue-600 focus:ring-blue-500" />
            <Label htmlFor="reg-unit" className="text-sm text-slate-700 cursor-pointer select-none">
              {t("labels.unitRegistration")}
            </Label>
          </div>
          <div className="flex items-center space-x-2 cursor-pointer">
            <RadioGroupItem value="room" id="reg-room" className="border-gray-300 text-blue-600 focus:ring-blue-500" />
            <Label htmlFor="reg-room" className="text-sm text-slate-700 cursor-pointer select-none">
              {t("labels.roomRegistration")}
            </Label>
          </div>
        </RadioGroup>
        <ValidationMessage message={errors.registrationType} visible={showError("registrationType")} />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-[#DCEAFF] bg-white p-3">
        <div>
          <div className="font-medium text-slate-800 text-sm">{t("labels.isSubUnit")}</div>
          <div className="text-xs text-slate-500">{t("labels.isSubUnitDescription")}</div>
        </div>
        <ToggleSwitch
          checked={formData.isSubUnit}
          onChange={onToggleSubUnit}
          showPopup={false}
          activeLabel={`${t("labels.isSubUnit")}: ${t("labels.yes")}`}
          inactiveLabel={`${t("labels.isSubUnit")}: ${t("labels.no")}`}
        />
      </div>

      <div>
        <TextArea
          name="description"
          label={t("labels.description")}
          rows={4}
          value={formData.description}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={t("placeholders.description")}
          maxLength={500}
          error={showError("description") ? true : false}
          className="w-full placeholder:text-slate-500 placeholder:text-[13px] text-[13px] text-slate-700"
        />
        <ValidationMessage message={errors.description} visible={showError("description")} />
      </div>
    </div>
  );
}

