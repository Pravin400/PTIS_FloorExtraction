"use client";

import { Input, ValidationMessage, CancelButton } from "@/components/common";
import { PartitionFormErrors } from "@/types/zone-master/properties/partition-form.types";
import { sanitizeWingName } from "@/lib/utils/input-sanitization";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

const WING_NAME_MAX_LENGTH = 30;

interface AddWingFormProps {
  newWingNo: string;
  newWingName: string;
  setNewWingName: (name: string) => void;
  errors: PartitionFormErrors;
  setErrors: React.Dispatch<React.SetStateAction<PartitionFormErrors>>;
  addingWing: boolean;
  editingWingDetailId: number | null;
  onCancel: () => void;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  tCommon: (key: string) => string;
}

export function AddWingForm({
  newWingNo,
  newWingName,
  setNewWingName,
  errors,
  setErrors,
  addingWing,
  editingWingDetailId,
  onCancel,
  t,
  tCommon,
}: AddWingFormProps) {
  const wingAlias = useAliasLabel("Wing", t("defaults.wing"));

  return (
    <div className="p-3 border border-green-200 rounded-lg bg-green-50/50 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-[10px] font-bold text-green-700 uppercase tracking-wider">
          {editingWingDetailId ? t("partitionForm.wing.editWing", { wing: wingAlias }) : t("partitionForm.wing.addWing", { wing: wingAlias })}
        </h4>
        <CancelButton
          size="xs"
          onClick={onCancel}
          label={tCommon("buttons.cancel")}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Input
            label={t("partitionForm.wing.wingNo", { wing: wingAlias })}
            value={newWingNo}
            disabled
            className="bg-gray-100 text-gray-600"
          />
        </div>
        <div>
          <Input
            label={t("partitionForm.wing.wingName", { wing: wingAlias })}
            value={newWingName}
            onChange={(e) => {
              const sanitized = sanitizeWingName(e.target.value);
              if (sanitized.length <= WING_NAME_MAX_LENGTH) {
                setNewWingName(sanitized);
                setErrors({ ...errors, wingName: undefined });
              }
            }}
            placeholder={t("partitionForm.wing.placeholders.wingLetter", { wing: wingAlias })}
            maxLength={WING_NAME_MAX_LENGTH}
            className="bg-white"
            disabled={addingWing}
          />
          <ValidationMessage
            message={errors.wingName}
            visible={!!errors.wingName}
            type="error"
          />
        </div>
      </div>
    </div>
  );
}
