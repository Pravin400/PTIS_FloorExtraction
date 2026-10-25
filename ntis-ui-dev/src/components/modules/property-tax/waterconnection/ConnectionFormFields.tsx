import React from "react";
import { Input, Select, ValidationMessage } from "@/components/common";
import type {
  WaterConnectionFormModel,
  WaterConnectionTypeLookup,
  WaterConnectionSizeLookup,
  WaterConnectionStatusLookup,
} from "@/types/water-connection.types";

interface ConnectionFormFieldsProps {
  formData: WaterConnectionFormModel;
  errors: Record<string, string>;
  showError: (field: keyof WaterConnectionFormModel) => boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  typeOptions: WaterConnectionTypeLookup[];
  sizeOptions: WaterConnectionSizeLookup[];
  statusOptions: WaterConnectionStatusLookup[];
  applicableRate: number | null;
  rateError: string | null;
  t: (key: string) => string;
}

export function ConnectionFormFields({
  formData,
  errors,
  showError,
  onChange,
  onSelectChange,
  onBlur,
  typeOptions,
  sizeOptions,
  statusOptions,
  applicableRate,
  rateError,
  t,
}: ConnectionFormFieldsProps) {
  const todayStr = React.useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const typeSelectOptions = typeOptions.map((opt) => ({
    value: String(opt.id),
    label: opt.connectionTypeName,
  }));

  const sizeSelectOptions = sizeOptions.map((opt) => ({
    value: String(opt.id),
    label: opt.displayLabel,
  }));

  const statusSelectOptions = statusOptions.map((opt) => ({
    value: String(opt.id),
    label: opt.statusName,
  }));

  const rateTypeOptions = [
    { value: "yearly", label: t("form.fields.rateType.yearly") },
    { value: "quarterly", label: t("form.fields.rateType.quarterly") },
    { value: "monthly", label: t("form.fields.rateType.monthly") },
  ];

  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
      {/* Row 1: Connection No | Meter No */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            name="connectionNo"
            label={t("form.fields.connectionNo.label")}
            required
            value={formData.connectionNo}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={t("form.fields.connectionNo.placeholder")}
            maxLength={20}
            fullWidth
          />
          <ValidationMessage
            message={errors.connectionNo}
            visible={showError("connectionNo")}
          />
        </div>
        <div>
          <Input
            name="meterNo"
            label={t("form.fields.meterNo.label")}
            required
            value={formData.meterNo}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={t("form.fields.meterNo.placeholder")}
            maxLength={20}
            fullWidth
          />
          <ValidationMessage
            message={errors.meterNo}
            visible={showError("meterNo")}
          />
        </div>
      </div>

      {/* Row 2: Type | Install Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Select
            name="waterConnectionTypeId"
            label={t("form.fields.type.label")}
            required
            options={typeSelectOptions}
            value={formData.waterConnectionTypeId !== '' ? String(formData.waterConnectionTypeId) : ''}
            onChange={(_, val) => onSelectChange("waterConnectionTypeId", val)}
            placeholder={t("form.fields.type.placeholder")}
            error={showError("waterConnectionTypeId") ? errors.waterConnectionTypeId : undefined}
          />
        </div>
        <div>
          <Input
            name="installDate"
            type="date"
            label={t("form.fields.installDate.label")}
            required
            value={formData.installDate}
            onChange={onChange}
            onBlur={onBlur}
            max={todayStr}
            fullWidth
          />
          <ValidationMessage
            message={errors.installDate}
            visible={showError("installDate")}
          />
        </div>
      </div>

      {/* Row 3: Size | Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Select
            name="waterConnectionSizeId"
            label={t("form.fields.tapSize.label")}
            required
            options={sizeSelectOptions}
            value={formData.waterConnectionSizeId !== '' ? String(formData.waterConnectionSizeId) : ''}
            onChange={(_, val) => onSelectChange("waterConnectionSizeId", val)}
            placeholder={t("form.fields.tapSize.placeholder")}
            error={showError("waterConnectionSizeId") ? errors.waterConnectionSizeId : undefined}
          />
        </div>
        <div>
          <Select
            name="waterConnectionStatusId"
            label={t("form.fields.status.label")}
            required
            options={statusSelectOptions}
            value={formData.waterConnectionStatusId != null ? String(formData.waterConnectionStatusId) : ''}
            onChange={(_, val) => onSelectChange("waterConnectionStatusId", val)}
            placeholder={t("form.fields.status.placeholder")}
            error={showError("waterConnectionStatusId") ? errors.waterConnectionStatusId : undefined}
          />
        </div>
      </div>

      {/* Row 4: Rate Frequency | Applicable Rate (read-only, auto-calculated) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Select
            name="rateType"
            label={t("form.fields.rateType.label")}
            options={rateTypeOptions}
            value={formData.rateType ?? "yearly"}
            onChange={(_, val) => onSelectChange("rateType", val)}
            placeholder={t("form.fields.rateType.placeholder")}
          />
        </div>
        <div>
          <Input
            name="applicableRate"
            label={t("form.fields.applicableRate.label")}
            value={applicableRate != null ? `₹${applicableRate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}
            readOnly
            onChange={() => {}}
            helperText={applicableRate == null && !rateError ? t("form.fields.applicableRate.autoCalculated") : undefined}
            fullWidth
            className="bg-slate-100 cursor-default font-medium text-slate-700"
          />
          <ValidationMessage
            message={rateError ?? ""}
            visible={rateError != null}
            type="warning"
          />
        </div>
      </div>
    </div>
  );
}
