import { Input, ValidationMessage } from "@/components/common";
import type { TaxZoneFormModel } from "@/types/taxzone.types";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface FormFieldsSectionProps {
  formData: TaxZoneFormModel;
  errors: Record<string, string>;
  showError: (field: keyof TaxZoneFormModel) => boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, values?: Record<string, any>) => string;
}

export function FormFieldsSection({
  formData,
  errors,
  showError,
  onChange,
  onBlur,
  t,
}: FormFieldsSectionProps) {
  const zoneLabel = useAliasLabel("Tax Zone", t("aliasFallback.taxZone"));
  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
      <Input
        name="taxZoneNo"
        label={t("form.fields.zoneNo.label", { zone: zoneLabel })}
        required={true}
        value={formData.taxZoneNo}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={t("form.fields.zoneNo.placeholder")}
        fullWidth
      />
      <ValidationMessage message={errors.taxZoneNo} visible={showError("taxZoneNo")} />

      <Input
        name="taxZoneType"
        label={t("form.fields.zoneType.label", { zone: zoneLabel })}
        required={true}
        value={formData.taxZoneType}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={t("form.fields.zoneType.placeholder")}
        fullWidth
        maxLength={15}
      />
      <ValidationMessage message={errors.taxZoneType} visible={showError("taxZoneType")} />

      <Input
        name="remark"
        label={t("form.fields.remark.label", { zone: zoneLabel })}
        required={true}
        value={formData.remark}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={t("form.fields.remark.placeholder", { zone: zoneLabel })}
        fullWidth
        maxLength={15}
      />
      <ValidationMessage message={errors.remark} visible={showError("remark")} />
    </div>
  );
}
