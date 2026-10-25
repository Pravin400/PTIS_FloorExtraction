"use client";

import { Input, ValidationMessage, Select } from "@/components/common";
import { PartitionFormState, PartitionFormErrors } from "@/types/zone-master/properties/partition-form.types";
import { Option } from "@/components/common";

interface WingConfigurationSectionProps {
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
  t: (key: string) => string;
}

export function WingConfigurationSection({
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
  t,
}: WingConfigurationSectionProps) {
  return (
    <div className="space-y-4">
      {/* Wing Selection */}
      <div>
        <Select
          label={t("partitionForm.wing.wingLetter")}
          options={wingOptions}
          value={form.wingLetter}
          onChange={(_, value) => {
            setForm({ ...form, wingLetter: value });
            setErrors({ ...errors, wingLetter: undefined });
          }}
          placeholder={t("partitionForm.wing.selectWing")}
          selectSize="md"
          required
        />
        <ValidationMessage
          message={errors.wingLetter}
          visible={!!errors.wingLetter}
          type="error"
        />
      </div>

      {/* Floor Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Select
            label={t("partitionForm.wing.fromFloor")}
            options={fromFloorOptions}
            value={form.fromFloor}
            onChange={handleFromFloorChange}
            placeholder={t("partitionForm.wing.selectFloor")}
            selectSize="md"
            required
          />
          <ValidationMessage
            message={errors.fromFloor}
            visible={!!errors.fromFloor}
            type="error"
          />
        </div>

        <div>
          <Select
            label={t("partitionForm.wing.toFloor")}
            options={toFloorOptions}
            value={form.toFloor}
            onChange={handleToFloorChange}
            placeholder={t("partitionForm.wing.selectFloor")}
            selectSize="md"
            required
          />
          <ValidationMessage
            message={errors.toFloor}
            visible={!!errors.toFloor}
            type="error"
          />
        </div>
      </div>

      {/* Flat Configuration */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Input
            label={t("partitionForm.wing.noOfFlatOnOneFloor")}
            type="number"
            value={form.noOfFlatOnOneFloor}
            onChange={(e) => {
              setForm({ ...form, noOfFlatOnOneFloor: e.target.value });
              setErrors({ ...errors, noOfFlatOnOneFloor: undefined });
            }}
            placeholder="0"
            required
            disabled={form.generationType === "VC"}
          />
          <ValidationMessage
            message={errors.noOfFlatOnOneFloor}
            visible={!!errors.noOfFlatOnOneFloor}
            type="error"
          />
        </div>

        <div>
          <Input
            label={t("partitionForm.wing.flatStart")}
            type="number"
            value={form.flatStart}
            onChange={(e) => {
              setForm({ ...form, flatStart: e.target.value });
              setErrors({ ...errors, flatStart: undefined });
            }}
            placeholder="0"
            required
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
            type="number"
            value={form.incrementedBy}
            onChange={(e) => {
              setForm({ ...form, incrementedBy: e.target.value });
              setErrors({ ...errors, incrementedBy: undefined });
            }}
            placeholder="0"
            required
            disabled={form.generationType === "HC"}
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
            label={t("partitionForm.wing.prefix")}
            value={form.prefix}
            onChange={(e) => setForm({ ...form, prefix: e.target.value })}
            placeholder={t("partitionForm.wing.prefixPlaceholder")}
          />
        </div>

        <div>
          <Select
            label={t("partitionForm.wing.generationType")}
            options={generationTypeOptions}
            value={form.generationType}
            onChange={(_, value) => {
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
            placeholder={t("partitionForm.wing.selectGenerationType")}
            selectSize="md"
            required
          />
          <ValidationMessage
            message={errors.generationType}
            visible={!!errors.generationType}
            type="error"
          />
        </div>
      </div>
    </div>
  );
}
