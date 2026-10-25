import type {
  CreateTariffWorkbenchDto,
  UpdateTariffWorkbenchDto,
  ValidationResult,
  TariffWorkbenchInput,
  TariffWorkbenchTranslator,
} from "@/types/water-bill/tariff-workbench/tariffWorkbench.types";
import {
  createTariffWorkbenchSchema,
  createTariffSlabSchema,
  createTariffChargeDetailSchema
} from "@/lib/api/water-bill/tariff-workbench/tariffWorkbench.schema";
import { zodErrorsToRecord } from "@/lib/validations/validation-utils";
import type { TariffSlabData } from "@/types/water-bill/tariff-workbench/tariffWorkbench.types";
import type { TariffChargeData } from "@/types/water-bill/tariff-workbench/tariffWorkbench.types";

export function validateTariffInput(
  input: TariffWorkbenchInput,
  t: TariffWorkbenchTranslator
): ValidationResult & { data?: TariffWorkbenchInput } {
  const schema = createTariffWorkbenchSchema((key, values) => t(key, values));
  const result = schema.safeParse(input);

  if (result.success) {
    return { isValid: true, errors: {}, data: result.data as TariffWorkbenchInput };
  }

  return { isValid: false, errors: zodErrorsToRecord(result) };
}

export function validateTariffSlabInput(
  input: Partial<TariffSlabData>,
  t: TariffWorkbenchTranslator
): ValidationResult & { data?: Partial<TariffSlabData> } {
  const schema = createTariffSlabSchema((key, values) => t(key, values));
  const result = schema.safeParse(input);

  if (result.success) {
    return { isValid: true, errors: {}, data: result.data as Partial<TariffSlabData> };
  }

  return { isValid: false, errors: zodErrorsToRecord(result) };
}

export function validateTariffChargeDetailInput(
  input: Partial<TariffChargeData>,
  t: TariffWorkbenchTranslator
): ValidationResult & { data?: Partial<TariffChargeData> } {
  const schema = createTariffChargeDetailSchema((key, values) => t(key, values));
  const result = schema.safeParse(input);

  if (result.success) {
    return { isValid: true, errors: {}, data: result.data as Partial<TariffChargeData> };
  }

  return { isValid: false, errors: zodErrorsToRecord(result) };
}

function parseDateStringToIso(dateStr: string | null | undefined): string | null {
  if (!dateStr || typeof dateStr !== "string" || !dateStr.trim()) return null;
  const str = dateStr.trim();
  const dateOnly = str.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return `${dateOnly}T00:00:00.000Z`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed.toISOString();
  return null;
}

export function mapToCreateTariffDto(input: TariffWorkbenchInput): CreateTariffWorkbenchDto {
  const fromIso = parseDateStringToIso(input.effectiveFrom) || input.effectiveFrom;
  const toIso = parseDateStringToIso(input.effectiveTo);
  const code = (input.tariffCode || "").trim();
  const name = (input.tariffName || "").trim();

  return {
    tariffCode: code,
    tariffName: name,
    financialYearId: Number(input.financialYearId) || 0,
    connectionTypeId: input.connectionTypeId ? Number(input.connectionTypeId) : null,
    connectionCategoryId: input.connectionCategoryId ? Number(input.connectionCategoryId) : null,
    tapSizeId: input.tapSizeId ? Number(input.tapSizeId) : null,
    effectiveFrom: fromIso,
    effectiveTo: toIso,
    versionNo: input.versionNo ? Number(input.versionNo) : 1,
    status: input.status || "Draft",
    description: input.description || null,
    isActive: typeof input.isActive === "boolean" ? input.isActive : input.isActive === "true" || input.isActive === undefined,
  };
}

export function mapToUpdateTariffDto(id: number, input: TariffWorkbenchInput): UpdateTariffWorkbenchDto {
  const fromIso = parseDateStringToIso(input.effectiveFrom) || input.effectiveFrom;
  const toIso = parseDateStringToIso(input.effectiveTo);
  const code = (input.tariffCode || "").trim();
  const name = (input.tariffName || "").trim();

  return {
    id,
    tariffCode: code,
    tariffName: name,
    financialYearId: Number(input.financialYearId) || 0,
    connectionTypeId: input.connectionTypeId ? Number(input.connectionTypeId) : null,
    connectionCategoryId: input.connectionCategoryId ? Number(input.connectionCategoryId) : null,
    tapSizeId: input.tapSizeId ? Number(input.tapSizeId) : null,
    effectiveFrom: fromIso,
    effectiveTo: toIso,
    versionNo: input.versionNo ? Number(input.versionNo) : 1,
    status: input.status || "Draft",
    description: input.description || null,
    isActive: typeof input.isActive === "boolean" ? input.isActive : input.isActive === "true" || input.isActive === undefined,
  };
}
