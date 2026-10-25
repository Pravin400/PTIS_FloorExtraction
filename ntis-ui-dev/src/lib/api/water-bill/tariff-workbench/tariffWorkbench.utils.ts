import { parseApiBoolean } from "@/lib/utils/water-bill/utils";
import type { TariffWorkbench } from "@/types/water-bill/tariff-workbench/tariffWorkbench.types";

export function normalizeTariffWorkbench(data: unknown): TariffWorkbench {
  if (!data || typeof data !== "object") {
    return {
      id: 0,
      tariffCode: "",
      tariffName: "",
      financialYearId: 0,
      connectionTypeId: null,
      connectionCategoryId: null,
      effectiveFrom: "",
      effectiveTo: null,
      versionNo: 0,
      status: "",
      description: null,
      isActive: false,
    };
  }

  const obj = data as Record<string, unknown>;
  const idVal = obj.id ?? obj.Id ?? obj.tariffId ?? obj.TariffId ?? obj.tariffMasterId ?? obj.TariffMasterId;
  const numId = Number(idVal);
  const id = Number.isFinite(numId) ? numId : 0;

  const tariffCode = String(obj.tariffCode ?? obj.TariffCode ?? obj.code ?? obj.Code ?? "").trim();
  const tariffName = String(obj.tariffName ?? obj.TariffName ?? obj.name ?? obj.Name ?? "").trim();
  const financialYearId = Number(obj.financialYearId ?? obj.FinancialYearId ?? obj.yearId ?? obj.YearId) || 0;
  const rawYear = obj.year ?? obj.Year ?? obj.financialYear ?? obj.FinancialYear ?? obj.yearCode ?? obj.YearCode ?? obj.financialYearCode ?? obj.FinancialYearCode;
  const year = rawYear !== undefined && rawYear !== null ? String(rawYear).trim() : undefined;
  const rawYearCode = obj.yearCode ?? obj.YearCode ?? obj.financialYear ?? obj.FinancialYear ?? obj.year ?? obj.Year ?? obj.financialYearCode ?? obj.FinancialYearCode;
  const yearCode = rawYearCode !== undefined && rawYearCode !== null ? String(rawYearCode).trim() : undefined;
  const financialYearCode = year || yearCode;

  const connTypeId = obj.connectionTypeId ?? obj.ConnectionTypeId;
  const connectionTypeId = connTypeId !== null && connTypeId !== undefined ? Number(connTypeId) : null;
  const connectionTypeName = ((obj.connectionTypeName ?? obj.ConnectionTypeName) as string | undefined)?.trim();

  const connCatId = obj.connectionCategoryId ?? obj.ConnectionCategoryId;
  const connectionCategoryId = connCatId !== null && connCatId !== undefined ? Number(connCatId) : null;
  const connectionCategoryName = ((obj.connectionCategoryName ?? obj.ConnectionCategoryName) as string | undefined)?.trim();

  const tapSizeIdVal = obj.tapSizeId ?? obj.TapSizeId;
  const tapSizeId = tapSizeIdVal !== null && tapSizeIdVal !== undefined ? Number(tapSizeIdVal) : null;
  const tapSizeName = ((obj.tapSizeName ?? obj.TapSizeName) as string | undefined)?.trim();

  const effectiveFromRaw = String(obj.effectiveFrom ?? obj.EffectiveFrom ?? "").trim();
  const effectiveFrom = effectiveFromRaw ? effectiveFromRaw.split("T")[0] : "";

  const effectiveToRaw = (obj.effectiveTo ?? obj.EffectiveTo) ? String(obj.effectiveTo ?? obj.EffectiveTo).trim() : null;
  const effectiveTo = effectiveToRaw ? effectiveToRaw.split("T")[0] : null;

  const versionNoRaw = obj.versionNo ?? obj.VersionNo;
  const versionNo = versionNoRaw !== undefined && versionNoRaw !== null ? Number(versionNoRaw) : undefined;
  const status = obj.status ?? obj.Status ? String(obj.status ?? obj.Status).trim() : undefined;
  const description = (obj.description ?? obj.Description) ? String(obj.description ?? obj.Description).trim() : null;

  const isActiveVal = obj.isActive ?? obj.IsActive ?? obj.active ?? obj.Active ?? obj.status ?? obj.Status;
  const isActive = parseApiBoolean(isActiveVal, false);

  return {
    id,
    tariffCode,
    tariffName,
    year,
    financialYearId,
    financialYearCode,
    yearId: financialYearId,
    yearCode,
    connectionTypeId,
    connectionTypeName,
    connectionCategoryId,
    connectionCategoryName,
    tapSizeId,
    tapSizeName,
    effectiveFrom,
    effectiveTo,
    versionNo,
    status,
    description,
    isActive,
  };
}

export function normalizeTariffSlabData(data: unknown): import("@/types/water-bill/tariff-workbench/tariffWorkbench.types").TariffSlabData {
  if (!data || typeof data !== "object") {
    return {
      id: 0,
      tariffId: 0,
      tariffName: "",
      geographyUnitId: null,
      geographyUnitName: "",
      fromUnit: 0,
      toUnit: 0,
      unitRate: 0,
      fixedCharge: 0,
      minimumCharge: 0,
      maximumCharge: null,
      perConnectionAmount: null,
      formulaCode: "",
      sortOrder: 1,
      isActive: false,
    };
  }

  const obj = data as Record<string, unknown>;
  const idVal = obj.id ?? obj.Id;
  const numId = Number(idVal);
  const id = Number.isFinite(numId) ? numId : 0;

  const tIdVal = obj.tariffId ?? obj.TariffId;
  const numTId = Number(tIdVal);
  const tariffId = Number.isFinite(numTId) ? numTId : 0;

  const geoIdVal = obj.geographyUnitId ?? obj.GeographyUnitId;
  const geographyUnitId = geoIdVal !== null && geoIdVal !== undefined ? Number(geoIdVal) : null;

  return {
    id,
    tariffId,
    tariffName: String(obj.tariffName ?? obj.TariffName ?? "").trim(),
    geographyUnitId,
    geographyUnitName: String(obj.geographyUnitName ?? obj.GeographyUnitName ?? "").trim(),
    fromUnit: Number(obj.fromUnit ?? obj.FromUnit) || 0,
    toUnit: Number(obj.toUnit ?? obj.ToUnit) || 0,
    unitRate: Number(obj.unitRate ?? obj.UnitRate) || 0,
    fixedCharge: Number(obj.fixedCharge ?? obj.FixedCharge) || 0,
    minimumCharge: Number(obj.minimumCharge ?? obj.MinimumCharge) || 0,
    maximumCharge: (obj.maximumCharge ?? obj.MaximumCharge) !== null && (obj.maximumCharge ?? obj.MaximumCharge) !== undefined ? Number(obj.maximumCharge ?? obj.MaximumCharge) : null,
    perConnectionAmount: (obj.perConnectionAmount ?? obj.PerConnectionAmount) !== null && (obj.perConnectionAmount ?? obj.PerConnectionAmount) !== undefined ? Number(obj.perConnectionAmount ?? obj.PerConnectionAmount) : null,
    formulaCode: (() => {
      const raw = String(obj.formulaCode ?? obj.FormulaCode ?? "").trim();
      return raw.toUpperCase() === "FLAT_RATE" ? "FIXED" : raw;
    })(),
    sortOrder: Number(obj.sortOrder ?? obj.SortOrder) || 1,
    isActive: parseApiBoolean(obj.isActive ?? obj.IsActive ?? obj.active ?? obj.Active ?? obj.status ?? obj.Status, false),
  };
}

export function normalizeTariffChargeData(data: unknown): import("@/types/water-bill/tariff-workbench/tariffWorkbench.types").TariffChargeData {
  if (!data || typeof data !== "object") {
    return {
      id: 0,
      tariffId: 0,
      tariffName: "",
      chargeHeadId: 0,
      chargeHeadName: "",
      geographyUnitId: null,
      geographyUnitName: "",
      amount: 0,
      isDynamic: false,
      isMandatory: false,
      sequenceNo: 1,
      isActive: false,
    };
  }

  const obj = data as Record<string, unknown>;
  const idVal = obj.id ?? obj.Id;
  const numId = Number(idVal);
  const id = Number.isFinite(numId) ? numId : 0;

  const tIdVal = obj.tariffId ?? obj.TariffId;
  const numTId = Number(tIdVal);
  const tariffId = Number.isFinite(numTId) ? numTId : 0;

  const chargeHeadIdVal = obj.chargeHeadId ?? obj.ChargeHeadId;
  const numCHId = Number(chargeHeadIdVal);
  const chargeHeadId = Number.isFinite(numCHId) ? numCHId : 0;

  const geoIdVal = obj.geographyUnitId ?? obj.GeographyUnitId;
  const geographyUnitId = geoIdVal !== null && geoIdVal !== undefined ? Number(geoIdVal) : null;

  return {
    id,
    tariffId,
    tariffName: String(obj.tariffName ?? obj.TariffName ?? "").trim(),
    chargeHeadId,
    chargeHeadName: String(obj.chargeHeadName ?? obj.ChargeHeadName ?? "").trim(),
    geographyUnitId,
    geographyUnitName: String(obj.geographyUnitName ?? obj.GeographyUnitName ?? "").trim(),
    amount: Number(obj.amount ?? obj.Amount) || 0,
    isDynamic: parseApiBoolean(obj.isDynamic ?? obj.IsDynamic, false),
    isMandatory: parseApiBoolean(obj.isMandatory ?? obj.IsMandatory, false),
    sequenceNo: Number(obj.sequenceNo ?? obj.SequenceNo) || 1,
    isActive: parseApiBoolean(obj.isActive ?? obj.IsActive ?? obj.active ?? obj.Active ?? obj.status ?? obj.Status, false),
  };
}
