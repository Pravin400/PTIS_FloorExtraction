"use client";

import { Input, ValidationMessage } from "@/components/common";
import { PartitionFormState, PartitionFormErrors } from "@/types/zone-master/properties/partition-form.types";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface NonApartmentPartitionSectionProps {
  form: PartitionFormState;
  setForm: React.Dispatch<React.SetStateAction<PartitionFormState>>;
  errors: PartitionFormErrors;
  setErrors: React.Dispatch<React.SetStateAction<PartitionFormErrors>>;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export function NonApartmentPartitionSection({
  form,
  setForm,
  errors,
  setErrors,
  t,
}: NonApartmentPartitionSectionProps) {
  const partitionAlias = useAliasLabel("Partition", t("defaults.partition"));

  return (
    <div className="space-y-4">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          {t("partitionForm.nonApartment.description", { partition: partitionAlias })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            label={t("partitionForm.fromPartition", { partition: partitionAlias })}
            type="number"
            value={form.fromPartition}
            onChange={(e) => {
              setForm({ ...form, fromPartition: e.target.value });
              setErrors({ ...errors, fromPartition: undefined });
            }}
            placeholder="1"
            required
            disabled
            className="bg-gray-50 font-bold text-blue-800"
          />
          <ValidationMessage
            message={errors.fromPartition}
            visible={!!errors.fromPartition}
            type="error"
          />
        </div>

        <div>
          <Input
            label={t("partitionForm.toPartition", { partition: partitionAlias })}
            type="text"
            inputMode="numeric"
            maxLength={2}
            value={form.toPartition}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 2);
              setForm({ ...form, toPartition: value });
              setErrors({ ...errors, toPartition: undefined });
            }}
            placeholder={t("partitionForm.placeholders.toPartition", { partition: partitionAlias })}
            required
          />
          <ValidationMessage
            message={errors.toPartition}
            visible={!!errors.toPartition}
            type="error"
          />
        </div>
      </div>

      {form.fromPartition && form.toPartition && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            {t("partitionForm.partitionRangePrefix", { partition: partitionAlias })} {form.fromPartition} {t("partitionForm.to")} {form.toPartition} ({Math.max(0, parseInt(form.toPartition) - parseInt(form.fromPartition) + 1)} {t("partitionForm.partitions", { partition: partitionAlias })})
          </p>
        </div>
      )}
    </div>
  );
}
