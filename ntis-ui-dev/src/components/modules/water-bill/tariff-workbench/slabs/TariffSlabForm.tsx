"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Drawer, CancelButton, SaveButton, Input, Select, ValidationMessage, FormStatusToggle, useToast } from "@/components/common";
import { LayoutGrid, AlertCircle } from "lucide-react";
import type { TariffSlabData } from "@/types/water-bill/tariff-workbench/tariffWorkbench.types";
import { SUPPORTED_TARIFF_SLAB_FORMULA_CODES } from "@/constants/waterBill.constants";

export interface TariffSlabLookupOption {
  value: string;
  label: string;
}

export interface TariffSlabFormData {
  tariffId: number;
  geographyUnitId: number | null;
  fromUnit: number | "";
  toUnit: number | "";
  unitRate: number | "";
  fixedCharge: number | "";
  minimumCharge: number | "";
  maximumCharge: number | null;
  perConnectionAmount: number | null;
  formulaCode: string;
  isActive: boolean;
}

const normalizeFormulaCode = (code?: string | null): string => {
  if (!code) return "";
  const trimmed = code.trim();
  return trimmed.toUpperCase() === "FLAT_RATE" ? "FIXED" : trimmed;
};

export interface TariffSlabFormProps {
  open: boolean;
  initialData?: TariffSlabData | null;
  defaultTariffId?: number;
  tariffOptions?: TariffSlabLookupOption[];
  geographyUnitOptions?: TariffSlabLookupOption[];
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (data: TariffSlabFormData) => void | Promise<void>;
}

export function TariffSlabForm({
  open,
  initialData,
  defaultTariffId,
  tariffOptions = [],
  geographyUnitOptions = [],
  isSubmitting = false,
  onClose,
  onSubmit,
}: TariffSlabFormProps) {
  const t = useTranslations("tariffWorkbench");
  const tCommon = useTranslations("common");
  const toast = useToast();
  const isEdit = Boolean(initialData);

  const formulaCodeOptions = [
    { value: "UNIT_RATE", label: t("form.formulaCodes.unitRate") },
    { value: "FIXED", label: t("form.formulaCodes.flatRate") },
    { value: "UNIT_RATE_FIXED", label: t("form.formulaCodes.unitRateFixed") ?? "Unit Rate Plus Fixed Charge" },
    { value: "SLAB_RATE", label: t("form.formulaCodes.slabRate") },
    { value: "PER_CONNECTION", label: t("form.formulaCodes.perConnection") },
    { value: "MINIMUM_CHARGE", label: t("form.formulaCodes.minimumCharge") ?? "Minimum Charge" },
  ];

  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [formData, setFormData] = useState<TariffSlabFormData>({
    tariffId: initialData?.tariffId ?? defaultTariffId ?? 0,
    geographyUnitId: initialData?.geographyUnitId ?? null,
    fromUnit: initialData?.fromUnit ?? "",
    toUnit: initialData?.toUnit ?? "",
    unitRate: initialData?.unitRate ?? "",
    fixedCharge: initialData?.fixedCharge ?? "",
    minimumCharge: initialData?.minimumCharge ?? "",
    maximumCharge: initialData?.maximumCharge ?? null,
    perConnectionAmount: initialData?.perConnectionAmount ?? null,
    formulaCode: normalizeFormulaCode(initialData?.formulaCode),
    isActive: initialData?.isActive ?? true,
  });
  const [touched, setTouched] = useState<Partial<Record<keyof TariffSlabFormData, boolean>>>({});
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevInitialData, setPrevInitialData] = useState(initialData);

  if (open !== prevOpen || initialData !== prevInitialData) {
    setPrevOpen(open);
    setPrevInitialData(initialData);
    setFormData({
      tariffId: initialData?.tariffId ?? defaultTariffId ?? 0,
      geographyUnitId: initialData?.geographyUnitId ?? null,
      fromUnit: initialData?.fromUnit ?? "",
      toUnit: initialData?.toUnit ?? "",
      unitRate: initialData?.unitRate ?? "",
      fixedCharge: initialData?.fixedCharge ?? "",
      minimumCharge: initialData?.minimumCharge ?? "",
      maximumCharge: initialData?.maximumCharge ?? null,
      perConnectionAmount: initialData?.perConnectionAmount ?? null,
      formulaCode: normalizeFormulaCode(initialData?.formulaCode),
      isActive: initialData?.isActive ?? true,
    });
    setSubmittedOnce(false);
    setTouched({});
  }

  const validate = useCallback((data: TariffSlabFormData) => {
    const errs: Partial<Record<keyof TariffSlabFormData, string>> = {};
    if (data.tariffId <= 0) errs.tariffId = t("errors.tariffNameRequired") || "Tariff Name is required";
    const canonicalFormulaCode = normalizeFormulaCode(data.formulaCode);
    if (!canonicalFormulaCode) {
      errs.formulaCode = t("errors.formulaCodeRequired") || "Formula code is required";
    } else if (!(SUPPORTED_TARIFF_SLAB_FORMULA_CODES as readonly string[]).includes(canonicalFormulaCode)) {
      errs.formulaCode = t("errors.formulaCodeInvalid") || "Invalid formula code";
    }

    // Common range validations for slab-based formulas
    const isSlabBased = ["UNIT_RATE", "UNIT_RATE_FIXED", "SLAB_RATE"].includes(canonicalFormulaCode);
    if (isSlabBased) {
      if (data.fromUnit === "" || data.fromUnit < 0) errs.fromUnit = t("errors.fromUnitInvalid") || "From unit must be >= 0";
      if (data.toUnit === "" || data.toUnit <= 0) errs.toUnit = t("errors.toUnitInvalid") || "To unit must be > 0";
      if (data.fromUnit !== "" && data.toUnit !== "" && data.fromUnit >= data.toUnit) errs.toUnit = t("errors.toUnitGtFromUnit") || "To unit must be greater than from unit";
    }

    // Formula specific validations
    if (["UNIT_RATE", "UNIT_RATE_FIXED", "SLAB_RATE"].includes(canonicalFormulaCode)) {
      if (data.unitRate === "" || data.unitRate < 0) errs.unitRate = t("errors.unitRateInvalid") || "Unit rate must be >= 0";
    }
    if (["FIXED", "UNIT_RATE_FIXED"].includes(canonicalFormulaCode)) {
      if (data.fixedCharge === "" || data.fixedCharge < 0) errs.fixedCharge = "Fixed charge must be >= 0";
    }
    if (canonicalFormulaCode === "MINIMUM_CHARGE") {
      if (data.minimumCharge === "" || data.minimumCharge < 0) errs.minimumCharge = "Minimum charge must be >= 0";
    }
    if (canonicalFormulaCode === "PER_CONNECTION") {
      if (data.perConnectionAmount === null || data.perConnectionAmount < 0) {
        errs.perConnectionAmount = "Per connection amount must be >= 0";
      }
    }

    // General optional limits validation
    const isMinMaxAllowed = ["UNIT_RATE", "UNIT_RATE_FIXED", "SLAB_RATE", "MINIMUM_CHARGE"].includes(canonicalFormulaCode);
    if (isMinMaxAllowed) {
      if (data.minimumCharge !== "" && data.minimumCharge < 0) errs.minimumCharge = "Minimum charge must be >= 0";
      if (data.maximumCharge !== null && data.maximumCharge < 0) errs.maximumCharge = "Maximum charge must be >= 0";
      if (data.minimumCharge !== "" && data.minimumCharge >= 0 && data.maximumCharge !== null && data.maximumCharge < data.minimumCharge) {
        errs.maximumCharge = "Maximum charge must be >= Minimum charge";
      }
    }

    return errs;
  }, [t]);

  const errors = validate(formData);
  const showError = (field: keyof TariffSlabFormData) =>
    Boolean((submittedOnce || touched[field]) && errors[field]);
  const visibleTariffOptions = initialData?.tariffId && !tariffOptions.some((option) => option.value === String(initialData.tariffId))
    ? [{ value: String(initialData.tariffId), label: initialData.tariffName }, ...tariffOptions]
    : tariffOptions;
  const visibleGeographyUnitOptions = initialData?.geographyUnitId != null && !geographyUnitOptions.some((option) => option.value === String(initialData.geographyUnitId))
    ? [{ value: String(initialData.geographyUnitId), label: initialData.geographyUnitName }, ...geographyUnitOptions]
    : geographyUnitOptions;

  const visibleFormulaCodeOptions =
    formData.formulaCode === "FLAT_RATE"
      ? [{ value: "FLAT_RATE", label: t("form.formulaCodes.flatRate") }, ...formulaCodeOptions]
      : formulaCodeOptions;

  const activeFormulaCode = normalizeFormulaCode(formData.formulaCode);
  const isSlabBased = ["UNIT_RATE", "UNIT_RATE_FIXED", "SLAB_RATE"].includes(activeFormulaCode);
  const isFixedChargeRequired = ["FIXED", "UNIT_RATE_FIXED"].includes(activeFormulaCode);
  const isMinimumChargeRequired = activeFormulaCode === "MINIMUM_CHARGE";
  const isPerConnectionRequired = activeFormulaCode === "PER_CONNECTION";
  const isMinMaxAllowed = ["UNIT_RATE", "UNIT_RATE_FIXED", "SLAB_RATE", "MINIMUM_CHARGE"].includes(activeFormulaCode);

  const handleChange = (field: keyof TariffSlabFormData, value: string | number | boolean | null) => {
    setFormData((prev) => {
      const nextData = { ...prev, [field]: value };

      // Clear inapplicable fields when formulaCode changes
      if (field === "formulaCode") {
        const rawFormula = value as string;
        const formula = normalizeFormulaCode(rawFormula);
        const nextIsSlabBased = ["UNIT_RATE", "UNIT_RATE_FIXED", "SLAB_RATE"].includes(formula);
        const nextIsFixedRequired = ["FIXED", "UNIT_RATE_FIXED"].includes(formula);
        const nextIsMinMaxAllowed = ["UNIT_RATE", "UNIT_RATE_FIXED", "SLAB_RATE", "MINIMUM_CHARGE"].includes(formula);

        if (!nextIsSlabBased) {
          nextData.fromUnit = "";
          nextData.toUnit = "";
          nextData.unitRate = "";
        }
        if (!nextIsFixedRequired) {
          nextData.fixedCharge = "";
        }
        if (!nextIsMinMaxAllowed) {
          nextData.minimumCharge = "";
          nextData.maximumCharge = null;
        }
        if (formula !== "PER_CONNECTION") {
          nextData.perConnectionAmount = null;
        }
        nextData.formulaCode = formula;
      }
      return nextData;
    });
  };

  const handleBlur = (field: keyof TariffSlabFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedOnce(true);
    const errs = validate(formData);
    if (Object.keys(errs).length > 0) {
      toast.error(Object.values(errs).join(" | "));
      return;
    }
    const submitData = {
      ...formData,
      formulaCode: normalizeFormulaCode(formData.formulaCode),
      fromUnit: formData.fromUnit === "" ? 0 : formData.fromUnit,
      toUnit: formData.toUnit === "" ? 0 : formData.toUnit,
      unitRate: formData.unitRate === "" ? 0 : formData.unitRate,
      fixedCharge: formData.fixedCharge === "" ? 0 : formData.fixedCharge,
      minimumCharge: formData.minimumCharge === "" ? 0 : formData.minimumCharge,
    };
    onSubmit(submitData);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="md"
      className="border-l-4 border-[#4F6A94]"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-linear-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            <LayoutGrid size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {isEdit ? t("editSlabTitle") || "Edit Slab Detail" : t("addSlabTitle") || "Add Slab Detail"}
            </div>
            <div className="text-sm text-slate-500">
              {isEdit ? "Update Slab Detail parameters" : "Configure slab parameters"}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <CancelButton label={tCommon("buttons.cancel")} onClick={onClose} disabled={isSubmitting} />
          <SaveButton label={isEdit ? (tCommon("buttons.update") || "Update") : (tCommon("buttons.save") || "Save")} type="submit" form="tariff-slab-form" isLoading={isSubmitting} />
        </div>
      }
    >
      <form
        id="tariff-slab-form"
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col justify-between h-full bg-[#F8FAFF] p-5 space-y-5"
      >
        <div className="space-y-4">
          <FormStatusToggle
            isEdit={isEdit}
            isActive={Boolean(formData.isActive)}
            onChange={(checked) => handleChange("isActive", checked)}
            statusLabel={formData.isActive ? tCommon("status.active") : tCommon("status.inactive")}
            description={formData.isActive ? t("form.activeStatusOn") : t("form.activeStatusOff")}
            isSubmitting={isSubmitting}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="space-y-1">
            <Select
              required
              label={t("table.tariffName") || "Tariff Name"}
              value={formData.tariffId ? String(formData.tariffId) : ""}
              onChange={(e) => handleChange("tariffId", Number(e.target.value))}
              onBlur={() => handleBlur("tariffId")}
              options={visibleTariffOptions}
              placeholder="Select Tariff Name"
              className={`${showError("tariffId") ? "!border-red-500 focus:!ring-red-500 [&>button]:!border-red-500 [&>button]:focus:!ring-red-400" : ""} [&>ul]:!top-full [&>ul]:!bottom-auto [&>ul]:!mt-1 [&>ul]:!mb-0`}
            />
            <ValidationMessage message={errors.tariffId} visible={showError("tariffId")} />
          </div>

          <div className="space-y-1">
            <Select
              label={t("table.geographyUnit")}
              value={formData.geographyUnitId != null ? String(formData.geographyUnitId) : ""}
              onChange={(e) => handleChange("geographyUnitId", e.target.value ? Number(e.target.value) : null)}
              onBlur={() => handleBlur("geographyUnitId")}
              options={visibleGeographyUnitOptions}
              placeholder="Select Geography Unit"
              className="[&>ul]:!top-full [&>ul]:!bottom-auto [&>ul]:!mt-1 [&>ul]:!mb-0"
            />
          </div>

          <div className="space-y-1">
            <Select
              required
              label={t("table.formulaCode")}
              value={formData.formulaCode}
              onChange={(e) => handleChange("formulaCode", e.target.value)}
              onBlur={() => handleBlur("formulaCode")}
              options={visibleFormulaCodeOptions}
              placeholder="Select Formula Code"
              className={`${showError("formulaCode") ? "!border-red-500 focus:!ring-red-500 [&>button]:!border-red-500 [&>button]:focus:!ring-red-400" : ""} [&>ul]:!top-full [&>ul]:!bottom-auto [&>ul]:!mt-1 [&>ul]:!mb-0`}
            />
            <ValidationMessage message={errors.formulaCode} visible={showError("formulaCode")} />
          </div>

          <div className="space-y-1">
            <Input
              required={isPerConnectionRequired}
              disabled={!isPerConnectionRequired}
              type="number"
              label={t("table.perConnectionAmount")}
              placeholder="e.g: 0"
              value={formData.perConnectionAmount != null ? String(formData.perConnectionAmount) : ""}
              onChange={(e) => {
                const val = e.target.value;
                const num = val === "" ? "" : Number(val);
                handleChange("perConnectionAmount", num !== "" && num < 0 ? 0 : (num === "" ? null : num));
              }}
              onKeyDown={(e) => { if (e.key === "-") e.preventDefault(); }}
              onBlur={() => handleBlur("perConnectionAmount")}
              min={0}
              className={showError("perConnectionAmount") ? "!border-red-500 focus:!ring-red-500" : ""}
            />
            <ValidationMessage message={errors.perConnectionAmount} visible={showError("perConnectionAmount")} />
          </div>

          <div className="space-y-1">
            <Input
              required={isSlabBased}
              disabled={!isSlabBased}
              type="number"
              label={t("table.fromUnit")}
              placeholder="e.g: 0"
              value={String(formData.fromUnit)}
              onChange={(e) => {
                const val = e.target.value;
                const num = val === "" ? "" : Number(val);
                handleChange("fromUnit", num !== "" && num < 0 ? 0 : num);
              }}
              onKeyDown={(e) => { if (e.key === "-") e.preventDefault(); }}
              onBlur={() => handleBlur("fromUnit")}
              min={0}
              className={showError("fromUnit") ? "!border-red-500 focus:!ring-red-500" : ""}
            />
            <ValidationMessage message={errors.fromUnit} visible={showError("fromUnit")} />
          </div>

          <div className="space-y-1">
            <Input
              required={isSlabBased}
              disabled={!isSlabBased}
              type="number"
              label={t("table.toUnit")}
              placeholder="e.g: 99999"
              value={String(formData.toUnit)}
              onChange={(e) => {
                const val = e.target.value;
                const num = val === "" ? "" : Number(val);
                handleChange("toUnit", num !== "" && num < 0 ? 0 : num);
              }}
              onKeyDown={(e) => { if (e.key === "-") e.preventDefault(); }}
              onBlur={() => handleBlur("toUnit")}
              min={0}
              className={showError("toUnit") ? "!border-red-500 focus:!ring-red-500" : ""}
            />
            <ValidationMessage message={errors.toUnit} visible={showError("toUnit")} />
          </div>

          <div className="space-y-1">
            <Input
              required={isSlabBased}
              disabled={!isSlabBased}
              type="number"
              label={t("table.unitRate")}
              placeholder="e.g: 0"
              value={String(formData.unitRate)}
              onChange={(e) => {
                const val = e.target.value;
                const num = val === "" ? "" : Number(val);
                handleChange("unitRate", num !== "" && num < 0 ? 0 : num);
              }}
              onKeyDown={(e) => { if (e.key === "-") e.preventDefault(); }}
              onBlur={() => handleBlur("unitRate")}
              min={0}
              className={showError("unitRate") ? "!border-red-500 focus:!ring-red-500" : ""}
            />
            <ValidationMessage message={errors.unitRate} visible={showError("unitRate")} />
          </div>

          <div className="space-y-1">
            <Input
              required={isFixedChargeRequired}
              disabled={!isFixedChargeRequired}
              type="number"
              label={t("table.fixedCharge")}
              placeholder="e.g: 0"
              value={String(formData.fixedCharge)}
              onChange={(e) => {
                const val = e.target.value;
                const num = val === "" ? "" : Number(val);
                handleChange("fixedCharge", num !== "" && num < 0 ? 0 : num);
              }}
              onKeyDown={(e) => { if (e.key === "-") e.preventDefault(); }}
              onBlur={() => handleBlur("fixedCharge")}
              min={0}
              className={showError("fixedCharge") ? "!border-red-500 focus:!ring-red-500" : ""}
            />
            <ValidationMessage message={errors.fixedCharge} visible={showError("fixedCharge")} />
          </div>

          <div className="space-y-1">
            <Input
              required={isMinimumChargeRequired}
              disabled={!isMinMaxAllowed}
              type="number"
              label={t("table.minimumCharge")}
              placeholder="e.g: 0"
              value={String(formData.minimumCharge)}
              onChange={(e) => {
                const val = e.target.value;
                const num = val === "" ? "" : Number(val);
                handleChange("minimumCharge", num !== "" && num < 0 ? 0 : num);
              }}
              onKeyDown={(e) => { if (e.key === "-") e.preventDefault(); }}
              onBlur={() => handleBlur("minimumCharge")}
              min={0}
              className={showError("minimumCharge") ? "!border-red-500 focus:!ring-red-500" : ""}
            />
            <ValidationMessage message={errors.minimumCharge} visible={showError("minimumCharge")} />
          </div>

          <div className="space-y-1">
            <Input
              disabled={!isMinMaxAllowed}
              type="number"
              label={t("table.maximumCharge")}
              placeholder="e.g: 0"
              value={formData.maximumCharge != null ? String(formData.maximumCharge) : ""}
              onChange={(e) => {
                const val = e.target.value;
                const num = val === "" ? "" : Number(val);
                handleChange("maximumCharge", num !== "" && num < 0 ? 0 : (num === "" ? null : num));
              }}
              onKeyDown={(e) => { if (e.key === "-") e.preventDefault(); }}
              onBlur={() => handleBlur("maximumCharge")}
              min={0}
              className={showError("maximumCharge") ? "!border-red-500 focus:!ring-red-500" : ""}
            />
            <ValidationMessage message={errors.maximumCharge} visible={showError("maximumCharge")} />
          </div>
        </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-700">
          <AlertCircle size={14} className="shrink-0" />
          <span>{tCommon("note.mandatory") || "* Mandatory fields must be filled"}</span>
        </div>
      </form>
    </Drawer>
  );
}
