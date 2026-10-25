"use client";

import { Input, Select, SearchSelect, ValidationMessage, CancelButton } from "@/components/common";
import { Info, AlertCircle } from "lucide-react";
import { PartitionFormState, PartitionFormErrors } from "@/types/zone-master/properties/partition-form.types";
import { Option } from "@/components/common";
import { PreviewButton } from "@/components/common/ActionButtons";
import { CODE_SANITIZE } from "@/lib/utils/validation-rules";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

const NO_OF_FLATS_PER_FLOOR_MAX_LENGTH = 2;
const FLAT_START_MAX_LENGTH = 5;
const INCREMENTED_BY_MAX_LENGTH = 5;

interface WingDetailConfigSectionProps {
  form: PartitionFormState;
  setForm: React.Dispatch<React.SetStateAction<PartitionFormState>>;
  errors: PartitionFormErrors;
  setErrors: React.Dispatch<React.SetStateAction<PartitionFormErrors>>;
  wingOptions: Option[];
  fromFloorOptions: Option[];
  toFloorOptions: Option[];
  generationTypeOptions: Option[];
  handleFromFloorChange: (e: React.ChangeEvent<HTMLSelectElement>, value: string) => void;
  handleToFloorChange: (e: React.ChangeEvent<HTMLSelectElement>, value: string) => void;
  handlePreviewBuilding: () => Promise<void>;
  loading: boolean;
  onCancel: () => void;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  tCommon: (key: string) => string;
}

export function WingDetailConfigSection({
  form,
  setForm,
  errors,
  setErrors,
  wingOptions,
  fromFloorOptions,
  toFloorOptions,
  generationTypeOptions,
  handleFromFloorChange,
  handleToFloorChange,
  handlePreviewBuilding,
  loading,
  onCancel,
  t,
  tCommon,
}: WingDetailConfigSectionProps) {
  const wingAlias = useAliasLabel("Wing", t("defaults.wing"));
  const floorAlias = useAliasLabel("Floor", t("defaults.floor"));
  const flatNoShopNoAlias = useAliasLabel(
    "Flat_No_Shop_No",
    useAliasLabel("Flat No/Shop No", t("defaults.flatNoShopNo"))
  );

  return (
    <div className="p-4 border border-gray-300 rounded-lg space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          {t("partitionForm.wing.newWingDetails", { wing: wingAlias })}
        </h4>
        <CancelButton
          size="xs"
          onClick={onCancel}
          label={tCommon("buttons.cancel")}
        />
      </div>

      {/* Info Box: Required Fields */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-300 rounded-lg">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-800">
          <p className="font-semibold mb-1">{t("partitionForm.wing.requiredFieldsTitle")}</p>
          <p>{t("partitionForm.wing.requiredFieldsDesc", { wing: wingAlias })}</p>
        </div>
      </div>

      {/* Wing Letter */}
      <div>
        <Select
          label={t("partitionForm.wing.wingLetter", { wing: wingAlias })}
          required
          value={form.wingLetter}
          disabled
          onChange={(_e, value) => {
            setForm({ ...form, wingLetter: value });
            setErrors({ ...errors, wingLetter: undefined });
          }}
          options={wingOptions}
          placeholder={t("partitionForm.wing.placeholders.wingLetter", { wing: wingAlias })}
          selectSize="md"
        />
        <ValidationMessage
          message={errors.wingLetter}
          visible={!!errors.wingLetter}
          type="error"
        />
      </div>

      {/* Floor Range */}
      <div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <SearchSelect
              label={t("partitionForm.wing.fromFloor", { floor: floorAlias })}
              required
              value={form.fromFloor}
              onChange={(_name, value) => {
                handleFromFloorChange({} as React.ChangeEvent<HTMLSelectElement>, value);
              }}
              options={fromFloorOptions}
              placeholder={t("partitionForm.wing.placeholders.fromFloor", { floor: floorAlias })}
            />
            <ValidationMessage
              message={errors.fromFloor}
              visible={!!errors.fromFloor}
              type="error"
            />
          </div>
          <div>
            <SearchSelect
              label={t("partitionForm.wing.toFloor", { floor: floorAlias })}
              required
              value={form.toFloor}
              onChange={(_name, value) => {
                handleToFloorChange({} as React.ChangeEvent<HTMLSelectElement>, value);
              }}
              options={toFloorOptions}
              placeholder={t("partitionForm.wing.placeholders.toFloor", { floor: floorAlias })}
            />
            <ValidationMessage
              message={errors.toFloor}
              visible={!!errors.toFloor}
              type="error"
            />
          </div>
        </div>
      </div>

      {/* No Of Flat On One Floor */}
      <div>
        <Input
          label={t("partitionForm.wing.noOfFlatOnOneFloor", { flatNoShopNo: flatNoShopNoAlias, floor: floorAlias })}
          required
          type="number"
          value={form.noOfFlatOnOneFloor}
          onChange={(e) => {
            const value = e.target.value.slice(0, NO_OF_FLATS_PER_FLOOR_MAX_LENGTH);
            setForm({ ...form, noOfFlatOnOneFloor: value });
            setErrors({ ...errors, noOfFlatOnOneFloor: undefined });
          }}
          placeholder={t("partitionForm.wing.placeholders.noOfFlatOnOneFloor", { flatNoShopNo: flatNoShopNoAlias })}
          disabled={loading || form.generationType === "VC"}
          min="1"
          maxLength={NO_OF_FLATS_PER_FLOOR_MAX_LENGTH}
        />
        <ValidationMessage
          message={errors.noOfFlatOnOneFloor}
          visible={!!errors.noOfFlatOnOneFloor}
          type="error"
        />
      </div>

      {/* Flat Start and Incremented By */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            label={t("partitionForm.wing.flatStart", { flatNoShopNo: flatNoShopNoAlias })}
            required
            type="number"
            value={form.flatStart}
            onChange={(e) => {
              const value = e.target.value.slice(0, FLAT_START_MAX_LENGTH);
              setForm({ ...form, flatStart: value });
              setErrors({ ...errors, flatStart: undefined });
            }}
            placeholder={t("partitionForm.wing.placeholders.flatStart")}
            disabled={loading}
            min="0"
            maxLength={FLAT_START_MAX_LENGTH}
          />
          <ValidationMessage
            message={errors.flatStart}
            visible={!!errors.flatStart}
            type="error"
          />
        </div>

        <div>
          <Input
            label={t("partitionForm.wing.incrementedBy")}
            required
            type="number"
            value={form.incrementedBy}
            onChange={(e) => {
              const value = e.target.value.slice(0, INCREMENTED_BY_MAX_LENGTH);
              setForm({ ...form, incrementedBy: value });
              setErrors({ ...errors, incrementedBy: undefined });
            }}
            placeholder={t("partitionForm.wing.placeholders.incrementedBy")}
            disabled={loading || form.generationType === "HC"}
            min="1"
            maxLength={INCREMENTED_BY_MAX_LENGTH}
          />
          <ValidationMessage
            message={errors.incrementedBy}
            visible={!!errors.incrementedBy}
            type="error"
          />
        </div>
      </div>

      {/* Prefix and Generation Type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            label={t("partitionForm.wing.prefix", { flatNoShopNo: flatNoShopNoAlias })}
            value={form.prefix}
            onChange={(e) => {
              const sanitized = e.target.value
                .replace(CODE_SANITIZE, '')
                .toUpperCase()
                .slice(0, 10);
              setForm({ ...form, prefix: sanitized });
            }}
            placeholder={t("partitionForm.wing.placeholders.prefix")}
            disabled={loading}
            maxLength={10}
          />
        </div>

        <div>
          <Select
            label={t("partitionForm.wing.generationType")}
            required
            value={form.generationType}
            onChange={(_e, value) => {
              const newForm = { ...form, generationType: value };
              if (value === "HC") {
                newForm.incrementedBy = "1";
              }
              if (value === "VC") {
                newForm.noOfFlatOnOneFloor = "1";
              }
              setForm(newForm);
              setErrors({ 
                ...errors, 
                generationType: undefined, 
                incrementedBy: undefined, 
                noOfFlatOnOneFloor: undefined 
              });
            }}
            options={generationTypeOptions}
            placeholder={t("partitionForm.wing.placeholders.generationType")}
            selectSize="md"
          />
          <ValidationMessage
            message={errors.generationType}
            visible={!!errors.generationType}
            type="error"
          />
        </div>
      </div>

      {/* Warning Message */}
      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-300 rounded-lg">
        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-red-800">
          {t("partitionForm.wing.wingBuildingsDuplicate", { wing: wingAlias })}
        </p>
      </div>

      {/* Preview Building Button */}
      <PreviewButton
        onClick={handlePreviewBuilding}
        isLoading={loading}
        disabled={loading}
        label={t("partitionForm.wing.preview.previewButton")}
        className="w-full"
      />
    </div>
  );
}
