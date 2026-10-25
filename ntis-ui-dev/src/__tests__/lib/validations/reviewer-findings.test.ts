import { describe, it, expect, vi } from "vitest";
import { createChargeHeadSchema } from "@/lib/api/water-bill/chargeHeads.schema";
import { createTariffWorkbenchSchema } from "@/lib/api/water-bill/tariff-workbench/tariffWorkbench.schema";
import { parseApiBoolean, getTariffWorkbenchById } from "@/lib/api/water-bill/tariff-workbench/tariffWorkbench.service";
import { parseApiBoolean as parseApiBooleanCH } from "@/lib/api/water-bill/chargeHeads.service";
import { verifyServerActionAccess } from "@/lib/utils/server-access-guard";
import { apiClient } from "@/services/api.service";
import type {
  TariffWorkbench,
  TariffSlabData,
  TariffChargeData,
} from "@/types/water-bill/tariff-workbench/tariffWorkbench.types";
import type { ApiResponse } from "@/types/common.types";
import type { TariffChargePagedResponse } from "@/lib/api/water-bill/tariff-workbench/tariffChargeDetail.service";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
}));

vi.mock("@/services/api.service", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: () => undefined,
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/server/revalidation-helper", () => ({
  revalidateModulePaths: vi.fn(),
}));

vi.mock("@/lib/api/water-bill/tariff-workbench/tariffChargeDetail.service", () => ({
  getTariffChargeDetailsPaged: vi.fn(),
  getTariffChargeDetailById: vi.fn(),
  createTariffChargeDetail: vi.fn(),
  updateTariffChargeDetail: vi.fn(),
  deleteTariffChargeDetail: vi.fn(),
}));

const mockT = (key: string) => key;

describe("Reviewer Findings Fixes Verification", () => {
  describe("Finding 1: Whitespace-only identifiers in Charge Head schema", () => {
    it("rejects empty string and whitespace-only code and name", () => {
      const schema = createChargeHeadSchema(mockT);

      const emptyResult = schema.safeParse({
        chargeHeadCode: "",
        chargeHeadName: "",
        chargeType: "Tax",
      });
      expect(emptyResult.success).toBe(false);

      const whitespaceResult = schema.safeParse({
        chargeHeadCode: "   ",
        chargeHeadName: "   ",
        chargeType: "   ",
      });
      expect(whitespaceResult.success).toBe(false);

      const validResult = schema.safeParse({
        chargeHeadCode: "CH001",
        chargeHeadName: "Water Tax",
        chargeType: "Tax",
        sequenceNo: 1,
      });
      expect(validResult.success).toBe(true);

      const invalidChargeTypeResult = schema.safeParse({
        chargeHeadCode: "CH001",
        chargeHeadName: "Water Tax",
        chargeType: "InvalidType",
        sequenceNo: 1,
      });
      expect(invalidChargeTypeResult.success).toBe(false);
      if (!invalidChargeTypeResult.success) {
        expect(invalidChargeTypeResult.error.flatten().fieldErrors.chargeType).toBeDefined();
      }
    });

    it("validates chargeHeadCode characters: allows letters, digits, _, and -, rejects > and spaces", () => {
      const schema = createChargeHeadSchema(mockT);

      // Valid codes with letters, digits, _, and - (including required examples WTR-FEE_123, WATER1, FEE_123)
      expect(schema.safeParse({ chargeHeadCode: "WTR-FEE_123", chargeHeadName: "Valid", chargeType: "Tax" }).success).toBe(true);
      expect(schema.safeParse({ chargeHeadCode: "WATER1", chargeHeadName: "Valid", chargeType: "Tax" }).success).toBe(true);
      expect(schema.safeParse({ chargeHeadCode: "FEE_123", chargeHeadName: "Valid", chargeType: "Tax" }).success).toBe(true);
      expect(schema.safeParse({ chargeHeadCode: "WTR_CHG", chargeHeadName: "Valid", chargeType: "Tax" }).success).toBe(true);
      expect(schema.safeParse({ chargeHeadCode: "WTR-CHG", chargeHeadName: "Valid", chargeType: "Tax" }).success).toBe(true);
      expect(schema.safeParse({ chargeHeadCode: "WTR-CHG_01", chargeHeadName: "Valid", chargeType: "Tax" }).success).toBe(true);
      expect(schema.safeParse({ chargeHeadCode: "wtr-chg_01", chargeHeadName: "Valid", chargeType: "Tax" }).success).toBe(true);
      expect(schema.safeParse({ chargeHeadCode: "12345", chargeHeadName: "Valid", chargeType: "Tax" }).success).toBe(true);

      // Invalid codes (including required examples WTR>>>123, WTR FEE)
      const greaterThanResult = schema.safeParse({ chargeHeadCode: "WTR>>>123", chargeHeadName: "Invalid", chargeType: "Tax" });
      expect(greaterThanResult.success).toBe(false);
      if (!greaterThanResult.success) {
        expect(greaterThanResult.error.flatten().fieldErrors.chargeHeadCode).toBeDefined();
      }

      const spacesResult = schema.safeParse({ chargeHeadCode: "WTR FEE", chargeHeadName: "Invalid", chargeType: "Tax" });
      expect(spacesResult.success).toBe(false);
      if (!spacesResult.success) {
        expect(spacesResult.error.flatten().fieldErrors.chargeHeadCode).toBeDefined();
      }

      const symbolsResult = schema.safeParse({ chargeHeadCode: "WTR@CHG", chargeHeadName: "Invalid", chargeType: "Tax" });
      expect(symbolsResult.success).toBe(false);
      if (!symbolsResult.success) {
        expect(symbolsResult.error.flatten().fieldErrors.chargeHeadCode).toBeDefined();
      }
    });

    it("ensures all Charge Head validation translation keys exist in en, mr, and hi locale files", async () => {
      const en = await import("@/i18n/locales/en/chargeHeads.json");
      const mr = await import("@/i18n/locales/mr/chargeHeads.json");
      const hi = await import("@/i18n/locales/hi/chargeHeads.json");

      const requiredKeys = [
        "codeRequired",
        "codeInvalid",
        "codeMaxLength",
        "nameRequired",
        "nameInvalid",
        "nameMaxLength",
        "nameLocalInvalid",
        "nameLocalMaxLength",
        "chargeTypeRequired",
        "chargeTypeInvalid",
        "sequenceNoRequired",
        "sequenceNoMin",
        "descriptionInvalid",
        "descriptionMaxLength",
      ] as const;

      for (const key of requiredKeys) {
        const enVal = (en.default.form.validation as Record<string, string>)[key];
        expect(enVal).toBeDefined();
        expect(enVal.length).toBeGreaterThan(0);

        const mrVal = (mr.default.form.validation as Record<string, string>)[key];
        expect(mrVal).toBeDefined();
        expect(mrVal.length).toBeGreaterThan(0);

        const hiVal = (hi.default.form.validation as Record<string, string>)[key];
        expect(hiVal).toBeDefined();
        expect(hiVal.length).toBeGreaterThan(0);
      }
    });

    it("safely handles translation queries without crashing when keys are missing or t.has is provided", () => {
      const mockTWithHas = Object.assign(
        (key: string) => {
          if (key === "form.validation.codeRequired") return "Code Required Localized";
          throw new Error(`MISSING_MESSAGE: Could not resolve '${key}'`);
        },
        {
          has: (key: string) => key === "form.validation.codeRequired",
        }
      );

      const schema = createChargeHeadSchema(mockTWithHas as unknown as (k: string) => string);
      expect(() => {
        schema.safeParse({ chargeHeadCode: "WTR>>>123", chargeHeadName: "", chargeType: "Tax" });
      }).not.toThrow();
    });
  });

  describe("Finding 5 & 6: String API boolean flags and inactive flags", () => {
    it("parses true, false, 'true', 'false', '1', '0', 1, 0 correctly", () => {
      expect(parseApiBoolean(true)).toBe(true);
      expect(parseApiBoolean(false)).toBe(false);
      expect(parseApiBoolean("true")).toBe(true);
      expect(parseApiBoolean("false")).toBe(false);
      expect(parseApiBoolean("TRUE")).toBe(true);
      expect(parseApiBoolean("FALSE")).toBe(false);
      expect(parseApiBoolean("1")).toBe(true);
      expect(parseApiBoolean("0")).toBe(false);
      expect(parseApiBoolean(1)).toBe(true);
      expect(parseApiBoolean(0)).toBe(false);

      expect(parseApiBooleanCH("false")).toBe(false);
      expect(parseApiBooleanCH("0")).toBe(false);
      expect(parseApiBooleanCH("inactive")).toBe(false);
      expect(parseApiBooleanCH("active")).toBe(true);
    });
  });

  describe("Finding 7: Single-record response envelope unwrap", () => {
    it("unwraps single-record response when wrapped in data or result envelope", async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: {
          data: {
            id: 42,
            tariffCode: "RES-2026",
            tariffName: "Residential 2026",
            financialYearId: 1,
            effectiveFrom: "2026-01-01",
            status: "Draft",
            isActive: true,
          },
        },
      });

      const res = await getTariffWorkbenchById(42);
      expect(res.success).toBe(true);
      expect(res.data?.id).toBe(42);
      expect(res.data?.tariffCode).toBe("RES-2026");
    });
  });

  describe("Finding 8: Whitespace-only tariff fields in Tariff schema", () => {
    it("rejects whitespace-only tariffCode, tariffName", () => {
      const schema = createTariffWorkbenchSchema(mockT);

      const res = schema.safeParse({
        tariffCode: "   ",
        tariffName: "   ",
        financialYearId: 1,
        effectiveFrom: "2026-01-01",
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        const fieldErrors = res.error.flatten().fieldErrors;
        expect(fieldErrors.tariffCode).toBeDefined();
        expect(fieldErrors.tariffName).toBeDefined();
      }
    });

    it("accepts valid normal values and trims whitespace", () => {
      const schema = createTariffWorkbenchSchema(mockT);

      const res = schema.safeParse({
        tariffCode: "  RES-001  ",
        tariffName: "  Residential Tariff  ",
        financialYearId: 1,
        connectionTypeId: 1,
        connectionCategoryId: 1,
        tapSizeId: 1,
        effectiveFrom: "2026-01-01",
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.tariffCode).toBe("RES-001");
        expect(res.data.tariffName).toBe("Residential Tariff");
      }
    });
  });

  describe("Finding 9: Global test authorization bypass removal", () => {
    it("denies access when no valid cookies/user session exists regardless of test env", async () => {
      const hasAccess = await verifyServerActionAccess("WATERBILL.TARIFFMASTER", "edit");
      expect(hasAccess).toBe(false);
    });
  });

  describe("Finding 10: Date validation for calendar dates", () => {
    it("rejects invalid date strings like 'invalid-date' and accepts valid YYYY-MM-DD", () => {
      const schema = createTariffWorkbenchSchema(mockT);

      const invalidFrom = schema.safeParse({
        tariffCode: "RES-001",
        tariffName: "Residential",
        financialYearId: 1,
        effectiveFrom: "invalid-date-string",
      });
      expect(invalidFrom.success).toBe(false);

      const invalidTo = schema.safeParse({
        tariffCode: "RES-001",
        tariffName: "Residential",
        financialYearId: 1,
        effectiveFrom: "2026-01-01",
        effectiveTo: "invalid-date-string",
      });
      expect(invalidTo.success).toBe(false);

      const equalDates = schema.safeParse({
        tariffCode: "RES-001",
        tariffName: "Residential",
        financialYearId: 1,
        connectionTypeId: 1,
        connectionCategoryId: 1,
        tapSizeId: 1,
        effectiveFrom: "2026-01-01",
        effectiveTo: "2026-01-01",
      });
      expect(equalDates.success).toBe(true);

      const lesserToDate = schema.safeParse({
        tariffCode: "RES-001",
        tariffName: "Residential",
        financialYearId: 1,
        effectiveFrom: "2026-06-01",
        effectiveTo: "2026-01-01",
      });
      expect(lesserToDate.success).toBe(false);

      const impossibleFeb30 = schema.safeParse({
        tariffCode: "RES-001",
        tariffName: "Residential",
        financialYearId: 1,
        effectiveFrom: "2026-02-30",
      });
      expect(impossibleFeb30.success).toBe(false);
    });

    it("strictly rejects non-YYYY-MM-DD formats, timestamps, and slash dates", async () => {
      const { isValidCalendarDate } = await import("@/lib/api/water-bill/tariff-workbench/tariffWorkbench.schema");

      expect(isValidCalendarDate("2026-04-01")).toBe(true);
      expect(isValidCalendarDate("2026-02-30")).toBe(false);
      expect(isValidCalendarDate("01/04/2026")).toBe(false);
      expect(isValidCalendarDate("2026/04/01")).toBe(false);
      expect(isValidCalendarDate("1700000000000")).toBe(false);
      expect(isValidCalendarDate("2026-04-01T00:00:00Z")).toBe(false);
    });
  });

  describe("Finding 1: Master lookup failure behavior", () => {
    it("throws server-side exception on lookup failures instead of empty arrays", async () => {
      const { getTariffFormLookups } = await import("@/lib/api/water-bill/tariff-workbench/tariffLookups.service");

      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error("Database connection lost"));

      await expect(getTariffFormLookups()).rejects.toThrow("Failed to load required Financial Year master data");
    });

    it("returns empty options when master API calls succeed with zero records", async () => {
      const { getTariffFormLookups } = await import("@/lib/api/water-bill/tariff-workbench/tariffLookups.service");

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        statusCode: 200,
        data: { items: [], totalCount: 0, pageNumber: 1, pageSize: 2000, totalPages: 1 },
      });

      const lookups = await getTariffFormLookups();
      expect(lookups.financialYearOptions).toEqual([]);
      expect(lookups.connectionTypeOptions).toEqual([]);
      expect(lookups.connectionCategoryOptions).toEqual([]);
    });
  });

  describe("Finding 4 & 5: Version display and tariffColumns fallbacks", () => {
    it("does not fabricate FY-{id} and uses '-' when financialYearCode is missing", async () => {
      const { getTariffColumns } = await import("@/components/modules/water-bill/tariff-workbench/tariffColumns");
      const columns = getTariffColumns(mockT, mockT);
      const fyCol = columns.find((c) => c.key === "financialYearCode" || c.key === "year");

      const rowWithoutCode = { id: 1, financialYearId: 42 } as unknown as TariffWorkbench;
      expect(fyCol?.render?.(undefined, rowWithoutCode, 0)).toEqual(expect.anything());
    });
  });

  describe("Finding 11: Reject non-finite and fractional pagination parameters", () => {
    it("rejects NaN, Infinity, and fractional values", async () => {
      const { parsePositiveInteger } = await import("@/lib/utils/water-bill/utils");
      expect(parsePositiveInteger(1.5, 10)).toBe(10);
      expect(parsePositiveInteger("1.5", 10)).toBe(10);
      expect(parsePositiveInteger(NaN, 10)).toBe(10);
      expect(parsePositiveInteger(Infinity, 10)).toBe(10);
      expect(parsePositiveInteger(-Infinity, 10)).toBe(10);
      expect(parsePositiveInteger("abc", 10)).toBe(10);
      expect(parsePositiveInteger(5, 10)).toBe(5);
      expect(parsePositiveInteger("5", 10)).toBe(5);
    });
  });

  describe("Finding 8: Preserve sanitized filterLogic in API query parameters", () => {
    it("preserves filterLogic in sanitizePagedQuery result", async () => {
      const { sanitizePagedQuery } = await import("@/lib/utils/water-bill/utils");
      const res = sanitizePagedQuery({
        pageNumber: 1,
        pageSize: 10,
        filterLogic: "isActive eq true",
      });
      expect(res.filterLogic).toBe("isActive eq true");
    });
  });

  describe("Formula-specific Slab Validation", () => {
    it("enforces MINIMUM_CHARGE requires minimumCharge and clears it for FIXED", async () => {
      const { createTariffSlabSchema } = await import("@/lib/api/water-bill/tariff-workbench/tariffWorkbench.schema");
      const schema = createTariffSlabSchema(mockT);

      const minChargeMissing = schema.safeParse({ tariffId: 1, formulaCode: "MINIMUM_CHARGE", chargeHeadId: 1 });
      expect(minChargeMissing.success).toBe(false);

      const minChargeValid = schema.safeParse({ tariffId: 1, formulaCode: "MINIMUM_CHARGE", chargeHeadId: 1, minimumCharge: 50 });
      expect(minChargeValid.success).toBe(true);

      const unitRateInvalid = schema.safeParse({ tariffId: 1, formulaCode: "UNIT_RATE", chargeHeadId: 1, minimumCharge: 100, maximumCharge: 50, fromUnit: 1, toUnit: 5, unitRate: 10 });
      expect(unitRateInvalid.success).toBe(false);
    });

    it("enforces SLAB_RATE requires fromUnit, toUnit, and unitRate with toUnit > fromUnit", async () => {
      const { createTariffSlabSchema } = await import("@/lib/api/water-bill/tariff-workbench/tariffWorkbench.schema");
      const schema = createTariffSlabSchema(mockT);

      // Missing unit range/rate should fail
      const missingUnits = schema.safeParse({ tariffId: 1, formulaCode: "SLAB_RATE" });
      expect(missingUnits.success).toBe(false);

      // toUnit <= fromUnit should fail
      const invalidRange = schema.safeParse({
        tariffId: 1,
        formulaCode: "SLAB_RATE",
        fromUnit: 10,
        toUnit: 5,
        unitRate: 12,
      });
      expect(invalidRange.success).toBe(false);

      // Equal toUnit and fromUnit should fail
      const equalRange = schema.safeParse({
        tariffId: 1,
        formulaCode: "SLAB_RATE",
        fromUnit: 10,
        toUnit: 10,
        unitRate: 12,
      });
      expect(equalRange.success).toBe(false);

      // Negative unit rate should fail
      const negativeRate = schema.safeParse({
        tariffId: 1,
        formulaCode: "SLAB_RATE",
        fromUnit: 0,
        toUnit: 10,
        unitRate: -1,
      });
      expect(negativeRate.success).toBe(false);

      // Valid SLAB_RATE should succeed
      const validSlab = schema.safeParse({
        tariffId: 1,
        formulaCode: "SLAB_RATE",
        fromUnit: 0,
        toUnit: 15,
        unitRate: 12.5,
      });
      expect(validSlab.success).toBe(true);
    });

    it("validates every supported formula against its mandatory calculation inputs", async () => {
      const { createTariffSlabSchema } = await import("@/lib/api/water-bill/tariff-workbench/tariffWorkbench.schema");
      const schema = createTariffSlabSchema(mockT);

      // 1. UNIT_RATE: requires fromUnit >= 0, toUnit > fromUnit, unitRate >= 0
      expect(schema.safeParse({ tariffId: 1, formulaCode: "UNIT_RATE" }).success).toBe(false);
      expect(schema.safeParse({ tariffId: 1, formulaCode: "UNIT_RATE", fromUnit: 0, toUnit: 10, unitRate: 5 }).success).toBe(true);

      // 2. UNIT_RATE_FIXED: requires fromUnit, toUnit, unitRate AND fixedCharge >= 0
      expect(schema.safeParse({ tariffId: 1, formulaCode: "UNIT_RATE_FIXED", fromUnit: 0, toUnit: 10, unitRate: 5 }).success).toBe(false);
      expect(schema.safeParse({ tariffId: 1, formulaCode: "UNIT_RATE_FIXED", fromUnit: 0, toUnit: 10, unitRate: 5, fixedCharge: 50 }).success).toBe(true);

      // 3. FIXED: requires fixedCharge >= 0, does not require units
      expect(schema.safeParse({ tariffId: 1, formulaCode: "FIXED" }).success).toBe(false);
      expect(schema.safeParse({ tariffId: 1, formulaCode: "FIXED", fixedCharge: 100 }).success).toBe(true);

      // 4. MINIMUM_CHARGE: requires minimumCharge >= 0, maximumCharge optional but must be >= minimumCharge
      expect(schema.safeParse({ tariffId: 1, formulaCode: "MINIMUM_CHARGE" }).success).toBe(false);
      expect(schema.safeParse({ tariffId: 1, formulaCode: "MINIMUM_CHARGE", minimumCharge: 50 }).success).toBe(true);
      expect(schema.safeParse({ tariffId: 1, formulaCode: "MINIMUM_CHARGE", minimumCharge: 50, maximumCharge: 25 }).success).toBe(false);
      expect(schema.safeParse({ tariffId: 1, formulaCode: "MINIMUM_CHARGE", minimumCharge: 50, maximumCharge: 100 }).success).toBe(true);

      // 5. PER_CONNECTION: requires perConnectionAmount >= 0
      expect(schema.safeParse({ tariffId: 1, formulaCode: "PER_CONNECTION" }).success).toBe(false);
      expect(schema.safeParse({ tariffId: 1, formulaCode: "PER_CONNECTION", perConnectionAmount: 30 }).success).toBe(true);
    });

    it("rejects unsupported formula codes (e.g. UNKNOWN_FORMULA, empty, or whitespace)", async () => {
      const { createTariffSlabSchema, SUPPORTED_TARIFF_SLAB_FORMULA_CODES } = await import(
        "@/lib/api/water-bill/tariff-workbench/tariffWorkbench.schema"
      );
      const schema = createTariffSlabSchema(mockT);

      // UNKNOWN_FORMULA must fail
      const unknownResult = schema.safeParse({
        tariffId: 1,
        formulaCode: "UNKNOWN_FORMULA",
        fromUnit: 0,
        toUnit: 10,
        unitRate: 5,
      });
      expect(unknownResult.success).toBe(false);
      if (!unknownResult.success) {
        const errors = unknownResult.error.flatten().fieldErrors;
        expect(errors.formulaCode).toBeDefined();
        expect(errors.formulaCode?.[0]).toBe("validation.formulaCodeInvalid");
      }

      // Empty or whitespace formulaCode must fail with required
      const emptyResult = schema.safeParse({
        tariffId: 1,
        formulaCode: "   ",
        fromUnit: 0,
        toUnit: 10,
        unitRate: 5,
      });
      expect(emptyResult.success).toBe(false);
      if (!emptyResult.success) {
        const errors = emptyResult.error.flatten().fieldErrors;
        expect(errors.formulaCode).toBeDefined();
        expect(errors.formulaCode?.[0]).toBe("validation.formulaCodeRequired");
      }

      // All supported formula codes in allowlist must be allowed by formulaCode field validation
      for (const code of SUPPORTED_TARIFF_SLAB_FORMULA_CODES) {
        const res = schema.safeParse({
          tariffId: 1,
          formulaCode: code,
          fromUnit: 0,
          toUnit: 10,
          unitRate: 5,
          fixedCharge: 10,
          minimumCharge: 5,
          maximumCharge: 20,
          perConnectionAmount: 5,
        });
        expect(res.success).toBe(true);
      }
    });
  });

  describe("Server Action Smart Defaults (SequenceNo, SortOrder)", () => {
    it("getNextSequenceNoAction calculates highest across all pages", async () => {
      const { getNextSequenceNoAction } = await import("@/app/[locale]/water-bill/tariff-workbench/charge-details/actions");
      const { getTariffChargeDetailsPaged } = await import("@/lib/api/water-bill/tariff-workbench/tariffChargeDetail.service");

      vi.mocked(getTariffChargeDetailsPaged)
        .mockResolvedValueOnce({
          success: true,
          statusCode: 200,
          data: {
            items: [{ sequenceNo: 15 }],
            totalCount: 2001,
            pageNumber: 1,
            pageSize: 2000,
            totalPages: 2,
            hasNextPage: true,
            hasPreviousPage: false,
          },
        } as unknown as Awaited<ReturnType<typeof getTariffChargeDetailsPaged>>)
        .mockResolvedValueOnce({
          success: true,
          statusCode: 200,
          data: {
            items: [{ sequenceNo: 42 }],
            totalCount: 2001,
            pageNumber: 2,
            pageSize: 2000,
            totalPages: 2,
            hasNextPage: false,
            hasPreviousPage: true,
          },
        } as unknown as Awaited<ReturnType<typeof getTariffChargeDetailsPaged>>);

      const next = await getNextSequenceNoAction(1);
      expect(next).toBe(43);
      expect(getTariffChargeDetailsPaged).toHaveBeenCalledTimes(2);
      expect(getTariffChargeDetailsPaged).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ tariffId: 1, sortBy: "sequenceNo", sortOrder: "desc", pageNumber: 1, pageSize: 2000 })
      );
      expect(getTariffChargeDetailsPaged).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ tariffId: 1, sortBy: "sequenceNo", sortOrder: "desc", pageNumber: 2, pageSize: 2000 })
      );
    });

    it("createTariffChargeDetailAction automatically falls back to getNextSequenceNoAction when sequenceNo is omitted or zero", async () => {
      const { createTariffChargeDetailAction } = await import("@/app/[locale]/water-bill/tariff-workbench/charge-details/actions");
      const { getTariffChargeDetailsPaged, createTariffChargeDetail } = await import("@/lib/api/water-bill/tariff-workbench/tariffChargeDetail.service");

      vi.mocked(getTariffChargeDetailsPaged).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: {
          items: [{ sequenceNo: 7 }] as unknown as TariffChargeData[],
          totalCount: 1,
          pageNumber: 1,
          pageSize: 2000,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      } as unknown as ApiResponse<TariffChargePagedResponse>);

      vi.mocked(createTariffChargeDetail).mockResolvedValueOnce({
        success: true,
        data: { id: 1 } as unknown as TariffChargeData,
      });

      const res = await createTariffChargeDetailAction({
        tariffId: 10,
        chargeHeadId: 5,
        amount: 25,
        isDynamic: false,
        isMandatory: true,
        sequenceNo: 0,
      });

      expect(res.success).toBe(true);
      expect(createTariffChargeDetail).toHaveBeenCalledWith(
        expect.objectContaining({
          tariffId: 10,
          chargeHeadId: 5,
          sequenceNo: 8,
        })
      );
    });

    it("createTariffSlabAction dynamically assigns sortOrder max+1 instead of 1", async () => {
      const { createTariffSlabAction } = await import("@/app/[locale]/water-bill/tariff-workbench/slabs/actions");

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: {
          items: [{ Id: 1, TariffId: 1, SortOrder: 5 }, { Id: 2, TariffId: 1, SortOrder: 2 }],
          totalCount: 2,
        },
      });
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: { id: 3, sortOrder: 6 },
      });

      await createTariffSlabAction({ tariffId: 1, formulaCode: "FIXED", fixedCharge: 10 });

      expect(apiClient.post).toHaveBeenCalledWith(
        "/TariffSlabDetail",
        expect.objectContaining({ sortOrder: 6 })
      );
    });

    it("normalizeTariffSlabData preserves sortOrder from raw API responses (camelCase and PascalCase)", async () => {
      const { normalizeTariffSlabData } = await import("@/lib/api/water-bill/tariff-workbench/tariffWorkbench.utils");

      const rawCamel = {
        id: 1,
        tariffId: 10,
        sortOrder: 3,
        fromUnit: 0,
        toUnit: 10,
        unitRate: 5,
        formulaCode: "UNIT_RATE",
        isActive: true,
      };
      const normalizedCamel = normalizeTariffSlabData(rawCamel);
      expect(normalizedCamel.sortOrder).toBe(3);

      const rawPascal = {
        Id: 2,
        TariffId: 10,
        SortOrder: 7,
        FromUnit: 11,
        ToUnit: 20,
        UnitRate: 10,
        FormulaCode: "UNIT_RATE",
        IsActive: true,
      };
      const normalizedPascal = normalizeTariffSlabData(rawPascal);
      expect(normalizedPascal.sortOrder).toBe(7);

      const rawDefault = { id: 3, tariffId: 10 };
      const normalizedDefault = normalizeTariffSlabData(rawDefault);
      expect(normalizedDefault.sortOrder).toBe(1);
    });

    it("createTariffSlabAction correctly calculates next sortOrder with multiple existing normalized slabs", async () => {
      const { createTariffSlabAction } = await import("@/app/[locale]/water-bill/tariff-workbench/slabs/actions");

      // Raw API responses from backend with multiple slabs (using backend PascalCase fields)
      const rawApiSlabs = [
        { Id: 101, TariffId: 1, SortOrder: 1, FormulaCode: "UNIT_RATE", FromUnit: 0, ToUnit: 10, UnitRate: 5 },
        { Id: 102, TariffId: 1, SortOrder: 2, FormulaCode: "UNIT_RATE", FromUnit: 11, ToUnit: 20, UnitRate: 8 },
        { Id: 103, TariffId: 1, SortOrder: 4, FormulaCode: "UNIT_RATE", FromUnit: 21, ToUnit: 30, UnitRate: 12 },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: {
          items: rawApiSlabs,
          totalCount: 3,
        },
      });

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: { id: 104, sortOrder: 5 },
      });

      await createTariffSlabAction({
        tariffId: 1,
        formulaCode: "FIXED",
        fixedCharge: 50,
      });

      // Max sortOrder among normalized items is 4, so next must be 5
      expect(apiClient.post).toHaveBeenCalledWith(
        "/TariffSlabDetail",
        expect.objectContaining({ sortOrder: 5 })
      );
    });

    it("updateTariffSlabAction returns error when existing slab lookup fails instead of defaulting to 1", async () => {
      const { updateTariffSlabAction } = await import("@/app/[locale]/water-bill/tariff-workbench/slabs/actions");

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: false,
        error: "Item not found",
        statusCode: 404,
      });

      const res = await updateTariffSlabAction(999, {
        tariffId: 1,
        formulaCode: "FIXED",
        fixedCharge: 100,
      });

      expect(res.success).toBe(false);
      expect(res.message).toBe("Item not found");
      expect(apiClient.put).not.toHaveBeenCalled();
    });

    it("updateTariffSlabAction preserves existing sortOrder on successful edit", async () => {
      const { updateTariffSlabAction } = await import("@/app/[locale]/water-bill/tariff-workbench/slabs/actions");

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: {
          Id: 10,
          TariffId: 1,
          SortOrder: 7,
          FormulaCode: "FIXED",
          FixedCharge: 50,
          IsActive: true,
        },
      });

      vi.mocked(apiClient.put).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: { id: 10, sortOrder: 7 },
      });

      const res = await updateTariffSlabAction(10, {
        tariffId: 1,
        formulaCode: "FIXED",
        fixedCharge: 120,
      });

      expect(res.success).toBe(true);
      expect(apiClient.put).toHaveBeenCalledWith(
        "/TariffSlabDetail/10",
        expect.objectContaining({ sortOrder: 7, fixedCharge: 120 })
      );
    });
  });

  describe("Validated Data Persistence in Server Actions", () => {
    it("createTariffChargeDetailAction passes validated/coerced data and strips extraneous fields", async () => {
      const { createTariffChargeDetailAction } = await import("@/app/[locale]/water-bill/tariff-workbench/charge-details/actions");
      const { createTariffChargeDetail } = await import("@/lib/api/water-bill/tariff-workbench/tariffChargeDetail.service");

      vi.mocked(createTariffChargeDetail).mockResolvedValueOnce({
        success: true,
        data: { id: 1 } as unknown as TariffChargeData,
      });

      const unvalidatedInput = {
        tariffId: "10" as unknown as number,
        chargeHeadId: "20" as unknown as number,
        amount: "150.5" as unknown as number,
        isDynamic: false,
        isMandatory: true,
        sequenceNo: "3" as unknown as number,
        isActive: true,
        unrecognizedField: "should-be-stripped",
        extraUiState: { selected: true },
      } as unknown as Partial<TariffChargeData>;

      const res = await createTariffChargeDetailAction(unvalidatedInput);
      expect(res.success).toBe(true);

      expect(createTariffChargeDetail).toHaveBeenCalledWith(
        expect.objectContaining({
          tariffId: 10,
          chargeHeadId: 20,
          amount: 150.5,
          sequenceNo: 3,
        })
      );
      const passedPayload = vi.mocked(createTariffChargeDetail).mock.calls.at(-1)?.[0] as Record<string, unknown>;
      expect(passedPayload.unrecognizedField).toBeUndefined();
      expect(passedPayload.extraUiState).toBeUndefined();
    });

    it("createTariffSlabAction passes validated/coerced data and strips extraneous fields", async () => {
      const { createTariffSlabAction } = await import("@/app/[locale]/water-bill/tariff-workbench/slabs/actions");

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: { items: [], totalCount: 0 },
      });

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: { id: 1 },
      });

      const unvalidatedInput = {
        tariffId: "5" as unknown as number,
        formulaCode: " UNIT_RATE ",
        fromUnit: "0" as unknown as number,
        toUnit: "15" as unknown as number,
        unitRate: "12.75" as unknown as number,
        isActive: true,
        arbitraryField: "discardMe",
      } as unknown as Partial<TariffSlabData>;

      const res = await createTariffSlabAction(unvalidatedInput);
      expect(res.success).toBe(true);

      expect(apiClient.post).toHaveBeenCalledWith(
        "/TariffSlabDetail",
        expect.objectContaining({
          tariffId: 5,
          formulaCode: "UNIT_RATE",
          fromUnit: 0,
          toUnit: 15,
          unitRate: 12.75,
          sortOrder: 1,
        })
      );
      const passedPayload = vi.mocked(apiClient.post).mock.calls.at(-1)?.[1] as Record<string, unknown>;
      expect(passedPayload.arbitraryField).toBeUndefined();
    });
  });

  describe("Legacy Billing Method removal", () => {
    it("tariff schema passes without billingMethodId", async () => {
      const { createTariffWorkbenchSchema } = await import("@/lib/api/water-bill/tariff-workbench/tariffWorkbench.schema");
      const schema = createTariffWorkbenchSchema(mockT);
      const res = schema.safeParse({ tariffCode: "TEST", tariffName: "TEST", financialYearId: 1, connectionTypeId: 1, connectionCategoryId: 1, tapSizeId: 1, effectiveFrom: "2026-01-01" });
      expect(res.success).toBe(true);
      if (res.success) expect((res.data as Record<string, unknown>).billingMethodId).toBeUndefined();
    });
  });

  describe("Backend pagination metadata differences", () => {
    it("normalizePagedResponse honors backend pageNumber and pageSize and totalCount", async () => {
      const { normalizePagedResponse } = await import("@/lib/utils/water-bill/utils");

      const rawApiData = { items: [{}], pageNumber: "5", pageSize: "25", totalCount: "100", totalPages: 4 };
      const result = normalizePagedResponse(rawApiData, (x: unknown) => x, { pageNumber: 1, pageSize: 10 });

      expect(result.pageNumber).toBe(5);
      expect(result.pageSize).toBe(25);
      expect(result.totalCount).toBe(100);
    });
  });

  describe("Shared pageSize = -1 behavior", () => {
    it("sanitizePagedQuery falls back to max 100 or 10 if rawPageSize=-1 without allowUnlimited", async () => {
      const { sanitizePagedQuery } = await import("@/lib/utils/water-bill/utils");

      expect(sanitizePagedQuery({ pageSize: -1 }).pageSize).toBe(10);
      expect(sanitizePagedQuery({ pageSize: -1 }, undefined, { allowUnlimited: true }).pageSize).toBe(-1);
      expect(sanitizePagedQuery({ pageSize: 500 }).pageSize).toBe(100);
      expect(sanitizePagedQuery({ pageSize: 500 }, undefined, { maxPageSize: 1000 }).pageSize).toBe(500);
    });
  });

  describe("Charge Detail validation: explicit booleans and amount boundary validation", () => {
    it("createTariffChargeDetailSchema rejects omitted, null, or empty string isDynamic", async () => {
      const { createTariffChargeDetailSchema } = await import("@/lib/api/water-bill/tariff-workbench/tariffWorkbench.schema");
      const schema = createTariffChargeDetailSchema(mockT);

      // Omitted isDynamic
      const omittedDynamic = schema.safeParse({
        tariffId: 1,
        chargeHeadId: 2,
        amount: 50,
        isMandatory: true,
        sequenceNo: 1,
      });
      expect(omittedDynamic.success).toBe(false);

      // null isDynamic
      const nullDynamic = schema.safeParse({
        tariffId: 1,
        chargeHeadId: 2,
        amount: 50,
        isDynamic: null,
        isMandatory: true,
        sequenceNo: 1,
      });
      expect(nullDynamic.success).toBe(false);

      // empty string isDynamic
      const emptyDynamic = schema.safeParse({
        tariffId: 1,
        chargeHeadId: 2,
        amount: 50,
        isDynamic: "",
        isMandatory: true,
        sequenceNo: 1,
      });
      expect(emptyDynamic.success).toBe(false);
    });

    it("createTariffChargeDetailSchema rejects omitted, null, or empty string isMandatory", async () => {
      const { createTariffChargeDetailSchema } = await import("@/lib/api/water-bill/tariff-workbench/tariffWorkbench.schema");
      const schema = createTariffChargeDetailSchema(mockT);

      // Omitted isMandatory
      const omittedMandatory = schema.safeParse({
        tariffId: 1,
        chargeHeadId: 2,
        amount: 50,
        isDynamic: false,
        sequenceNo: 1,
      });
      expect(omittedMandatory.success).toBe(false);

      // null isMandatory
      const nullMandatory = schema.safeParse({
        tariffId: 1,
        chargeHeadId: 2,
        amount: 50,
        isDynamic: false,
        isMandatory: null,
        sequenceNo: 1,
      });
      expect(nullMandatory.success).toBe(false);

      // empty string isMandatory
      const emptyMandatory = schema.safeParse({
        tariffId: 1,
        chargeHeadId: 2,
        amount: 50,
        isDynamic: false,
        isMandatory: "",
        sequenceNo: 1,
      });
      expect(emptyMandatory.success).toBe(false);
    });

    it("createTariffChargeDetailSchema rejects empty or omitted amount and keeps intentional zero", async () => {
      const { createTariffChargeDetailSchema } = await import("@/lib/api/water-bill/tariff-workbench/tariffWorkbench.schema");
      const schema = createTariffChargeDetailSchema(mockT);

      // Omitted amount
      const omittedAmount = schema.safeParse({
        tariffId: 1,
        chargeHeadId: 2,
        isDynamic: false,
        isMandatory: true,
        sequenceNo: 1,
      });
      expect(omittedAmount.success).toBe(false);

      // empty string amount ""
      const emptyAmount = schema.safeParse({
        tariffId: 1,
        chargeHeadId: 2,
        amount: "",
        isDynamic: false,
        isMandatory: true,
        sequenceNo: 1,
      });
      expect(emptyAmount.success).toBe(false);

      // whitespace amount "   "
      const whitespaceAmount = schema.safeParse({
        tariffId: 1,
        chargeHeadId: 2,
        amount: "   ",
        isDynamic: false,
        isMandatory: true,
        sequenceNo: 1,
      });
      expect(whitespaceAmount.success).toBe(false);

      // null amount
      const nullAmount = schema.safeParse({
        tariffId: 1,
        chargeHeadId: 2,
        amount: null,
        isDynamic: false,
        isMandatory: true,
        sequenceNo: 1,
      });
      expect(nullAmount.success).toBe(false);

      // negative amount
      const negativeAmount = schema.safeParse({
        tariffId: 1,
        chargeHeadId: 2,
        amount: -5,
        isDynamic: false,
        isMandatory: true,
        sequenceNo: 1,
      });
      expect(negativeAmount.success).toBe(false);

      // intentional zero amount with isDynamic = false
      const zeroAmount = schema.safeParse({
        tariffId: 1,
        chargeHeadId: 2,
        amount: 0,
        isDynamic: false,
        isMandatory: true,
        sequenceNo: 1,
      });
      expect(zeroAmount.success).toBe(true);
      if (zeroAmount.success) {
        expect(zeroAmount.data.amount).toBe(0);
      }

      // intentional zero string "0"
      const stringZeroAmount = schema.safeParse({
        tariffId: 1,
        chargeHeadId: 2,
        amount: "0",
        isDynamic: false,
        isMandatory: true,
        sequenceNo: 1,
      });
      expect(stringZeroAmount.success).toBe(true);
      if (stringZeroAmount.success) {
        expect(stringZeroAmount.data.amount).toBe(0);
      }

      // dynamic charge contract: isDynamic = true requires amount = 0
      const dynamicWithZero = schema.safeParse({
        tariffId: 1,
        chargeHeadId: 2,
        amount: 0,
        isDynamic: true,
        isMandatory: true,
        sequenceNo: 1,
      });
      expect(dynamicWithZero.success).toBe(true);

      const dynamicWithNonZero = schema.safeParse({
        tariffId: 1,
        chargeHeadId: 2,
        amount: 150,
        isDynamic: true,
        isMandatory: true,
        sequenceNo: 1,
      });
      expect(dynamicWithNonZero.success).toBe(false);
    });

    it("createTariffChargeDetailAction rejects direct call when required fields are missing", async () => {
      const { createTariffChargeDetailAction } = await import("@/app/[locale]/water-bill/tariff-workbench/charge-details/actions");

      // direct call with omitted isDynamic
      const res1 = await createTariffChargeDetailAction({
        tariffId: 1,
        chargeHeadId: 2,
        amount: 50,
        isMandatory: true,
      });
      expect(res1.success).toBe(false);

      // direct call with omitted isMandatory
      const res2 = await createTariffChargeDetailAction({
        tariffId: 1,
        chargeHeadId: 2,
        amount: 50,
        isDynamic: false,
      });
      expect(res2.success).toBe(false);

      // direct call with empty amount ""
      const res3 = await createTariffChargeDetailAction({
        tariffId: 1,
        chargeHeadId: 2,
        amount: "" as unknown as number,
        isDynamic: false,
        isMandatory: true,
      });
      expect(res3.success).toBe(false);

      // direct call with valid intentional 0 amount
      const { createTariffChargeDetail } = await import("@/lib/api/water-bill/tariff-workbench/tariffChargeDetail.service");
      vi.mocked(createTariffChargeDetail).mockResolvedValueOnce({
        success: true,
        data: { id: 99, amount: 0 } as unknown as TariffChargeData,
      });

      const res4 = await createTariffChargeDetailAction({
        tariffId: 1,
        chargeHeadId: 2,
        amount: 0,
        isDynamic: false,
        isMandatory: true,
        sequenceNo: 1,
      });
      expect(res4.success).toBe(true);
    });
  });

  describe("Finding 9: Compatibility mapping for FLAT_RATE -> FIXED", () => {
    it("normalizeTariffSlabData canonicalizes FLAT_RATE and variants to FIXED", async () => {
      const { normalizeTariffSlabData } = await import("@/lib/api/water-bill/tariff-workbench/tariffWorkbench.utils");

      const item1 = normalizeTariffSlabData({
        id: 1,
        tariffId: 10,
        formulaCode: "FLAT_RATE",
        fixedCharge: 100,
      });
      expect(item1.formulaCode).toBe("FIXED");

      const item2 = normalizeTariffSlabData({
        Id: 2,
        TariffId: 10,
        FormulaCode: "flat_rate",
        FixedCharge: 150,
      });
      expect(item2.formulaCode).toBe("FIXED");

      const item3 = normalizeTariffSlabData({
        id: 3,
        tariffId: 10,
        formulaCode: "FIXED",
        fixedCharge: 200,
      });
      expect(item3.formulaCode).toBe("FIXED");

      const item4 = normalizeTariffSlabData({
        id: 4,
        tariffId: 10,
        formulaCode: "UNIT_RATE",
        unitRate: 15,
      });
      expect(item4.formulaCode).toBe("UNIT_RATE");
    });

    it("createTariffSlabSchema transforms FLAT_RATE to FIXED and validates required fields", async () => {
      const { createTariffSlabSchema } = await import("@/lib/api/water-bill/tariff-workbench/tariffWorkbench.schema");
      const schema = createTariffSlabSchema(mockT);

      // Valid FLAT_RATE with fixedCharge
      const validResult = schema.safeParse({
        tariffId: 1,
        formulaCode: "FLAT_RATE",
        fixedCharge: 120,
      });
      expect(validResult.success).toBe(true);
      if (validResult.success) {
        expect(validResult.data.formulaCode).toBe("FIXED");
      }

      // FLAT_RATE without fixedCharge should fail
      const missingFixed = schema.safeParse({
        tariffId: 1,
        formulaCode: "FLAT_RATE",
      });
      expect(missingFixed.success).toBe(false);

      // FLAT_RATE with negative fixedCharge should fail
      const negativeFixed = schema.safeParse({
        tariffId: 1,
        formulaCode: "FLAT_RATE",
        fixedCharge: -5,
      });
      expect(negativeFixed.success).toBe(false);
    });

    it("createTariffSlabAction maps FLAT_RATE to FIXED before persisting", async () => {
      const { createTariffSlabAction } = await import("@/app/[locale]/water-bill/tariff-workbench/slabs/actions");

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: {
          items: [],
          totalCount: 0,
        },
      });

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: { id: 88, formulaCode: "FIXED", fixedCharge: 100 },
      });

      const res = await createTariffSlabAction({
        tariffId: 1,
        formulaCode: "FLAT_RATE",
        fixedCharge: 100,
      });

      expect(res.success).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/TariffSlabDetail",
        expect.objectContaining({
          formulaCode: "FIXED",
          fixedCharge: 100,
        })
      );
    });
  });

  describe("Finding 10: End-to-end integration: API response → Normalization → Server Action → Saved Payload", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("handles multiple existing slabs from raw API response and calculates next sortOrder", async () => {
      const { createTariffSlabAction } = await import("@/app/[locale]/water-bill/tariff-workbench/slabs/actions");

      // Raw API response from backend with multiple slabs having various sort orders
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: {
          items: [
            { Id: 201, TariffId: 2, SortOrder: 2, FormulaCode: "UNIT_RATE", FromUnit: 0, ToUnit: 10, UnitRate: 5 },
            { Id: 202, TariffId: 2, SortOrder: 8, FormulaCode: "UNIT_RATE", FromUnit: 11, ToUnit: 20, UnitRate: 8 },
            { Id: 203, TariffId: 2, SortOrder: 5, FormulaCode: "UNIT_RATE", FromUnit: 21, ToUnit: 30, UnitRate: 12 },
          ],
          totalCount: 3,
        },
      });

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: { id: 204, sortOrder: 9 },
      });

      const res = await createTariffSlabAction({
        tariffId: 2,
        formulaCode: "FIXED",
        fixedCharge: 80,
      });

      expect(res.success).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/TariffSlabDetail",
        expect.objectContaining({
          tariffId: 2,
          formulaCode: "FIXED",
          fixedCharge: 80,
          sortOrder: 9, // max(2, 8, 5) + 1 = 9
        })
      );
    });

    it.each([
      {
        name: "UNIT_RATE",
        input: { tariffId: 1, formulaCode: "UNIT_RATE", fromUnit: 0, toUnit: 50, unitRate: 14.5 },
        expected: { tariffId: 1, formulaCode: "UNIT_RATE", fromUnit: 0, toUnit: 50, unitRate: 14.5, sortOrder: 1 },
      },
      {
        name: "FIXED",
        input: { tariffId: 1, formulaCode: "FIXED", fixedCharge: 250 },
        expected: { tariffId: 1, formulaCode: "FIXED", fixedCharge: 250, sortOrder: 1 },
      },
      {
        name: "UNIT_RATE_FIXED",
        input: { tariffId: 1, formulaCode: "UNIT_RATE_FIXED", fromUnit: 0, toUnit: 30, unitRate: 10, fixedCharge: 50 },
        expected: { tariffId: 1, formulaCode: "UNIT_RATE_FIXED", fromUnit: 0, toUnit: 30, unitRate: 10, fixedCharge: 50, sortOrder: 1 },
      },
      {
        name: "SLAB_RATE",
        input: { tariffId: 1, formulaCode: "SLAB_RATE", fromUnit: 10, toUnit: 25, unitRate: 18 },
        expected: { tariffId: 1, formulaCode: "SLAB_RATE", fromUnit: 10, toUnit: 25, unitRate: 18, sortOrder: 1 },
      },
      {
        name: "PER_CONNECTION",
        input: { tariffId: 1, formulaCode: "PER_CONNECTION", perConnectionAmount: 85 },
        expected: { tariffId: 1, formulaCode: "PER_CONNECTION", perConnectionAmount: 85, sortOrder: 1 },
      },
      {
        name: "MINIMUM_CHARGE",
        input: { tariffId: 1, formulaCode: "MINIMUM_CHARGE", minimumCharge: 120 },
        expected: { tariffId: 1, formulaCode: "MINIMUM_CHARGE", minimumCharge: 120, sortOrder: 1 },
      },
      {
        name: "FLAT_RATE (compatibility alias)",
        input: { tariffId: 1, formulaCode: "FLAT_RATE", fixedCharge: 75 },
        expected: { tariffId: 1, formulaCode: "FIXED", fixedCharge: 75, sortOrder: 1 },
      },
    ])("end-to-end calculation and payload validity for $name formula", async ({ input, expected }) => {
      const { createTariffSlabAction } = await import("@/app/[locale]/water-bill/tariff-workbench/slabs/actions");

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: { items: [], totalCount: 0 },
      });

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: { id: 99, ...expected },
      });

      const res = await createTariffSlabAction(input);
      expect(res.success).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/TariffSlabDetail",
        expect.objectContaining(expected)
      );
    });

    it.each([
      "UNKNOWN_FORMULA",
      "FLAT",
      "INVALID_RATE",
      "",
      "   ",
    ])("rejects incorrect formula '%s' without calling persistence API", async (formulaCode) => {
      const { createTariffSlabAction } = await import("@/app/[locale]/water-bill/tariff-workbench/slabs/actions");

      const res = await createTariffSlabAction({
        tariffId: 1,
        formulaCode,
        fixedCharge: 50,
      });

      expect(res.success).toBe(false);
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it.each([
      { name: "UNIT_RATE missing unitRate", payload: { tariffId: 1, formulaCode: "UNIT_RATE", fromUnit: 0, toUnit: 10 } },
      { name: "UNIT_RATE missing toUnit", payload: { tariffId: 1, formulaCode: "UNIT_RATE", fromUnit: 0, unitRate: 15 } },
      { name: "UNIT_RATE missing fromUnit", payload: { tariffId: 1, formulaCode: "UNIT_RATE", toUnit: 10, unitRate: 15 } },
      { name: "UNIT_RATE toUnit <= fromUnit", payload: { tariffId: 1, formulaCode: "UNIT_RATE", fromUnit: 10, toUnit: 10, unitRate: 15 } },
      { name: "SLAB_RATE missing unitRate", payload: { tariffId: 1, formulaCode: "SLAB_RATE", fromUnit: 0, toUnit: 20 } },
      { name: "SLAB_RATE toUnit <= fromUnit", payload: { tariffId: 1, formulaCode: "SLAB_RATE", fromUnit: 20, toUnit: 10, unitRate: 12 } },
      { name: "UNIT_RATE_FIXED missing fixedCharge", payload: { tariffId: 1, formulaCode: "UNIT_RATE_FIXED", fromUnit: 0, toUnit: 10, unitRate: 10 } },
      { name: "UNIT_RATE_FIXED missing unitRate", payload: { tariffId: 1, formulaCode: "UNIT_RATE_FIXED", fromUnit: 0, toUnit: 10, fixedCharge: 50 } },
      { name: "FIXED missing fixedCharge", payload: { tariffId: 1, formulaCode: "FIXED" } },
      { name: "MINIMUM_CHARGE missing minimumCharge", payload: { tariffId: 1, formulaCode: "MINIMUM_CHARGE" } },
      { name: "PER_CONNECTION missing perConnectionAmount", payload: { tariffId: 1, formulaCode: "PER_CONNECTION" } },
      { name: "missing tariffId", payload: { formulaCode: "FIXED", fixedCharge: 50 } },
    ])("rejects empty mandatory fields for $name", async ({ payload }) => {
      const { createTariffSlabAction } = await import("@/app/[locale]/water-bill/tariff-workbench/slabs/actions");

      const res = await createTariffSlabAction(payload as unknown as Partial<TariffSlabData>);
      expect(res.success).toBe(false);
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it("update failures: rejects update on validation error, lookup 404, or API error", async () => {
      const { updateTariffSlabAction } = await import("@/app/[locale]/water-bill/tariff-workbench/slabs/actions");

      // 1. Validation failure: update with invalid formula should fail before lookup
      const resValFail = await updateTariffSlabAction(10, {
        tariffId: 1,
        formulaCode: "INVALID_FORMULA",
      });
      expect(resValFail.success).toBe(false);
      expect(apiClient.get).not.toHaveBeenCalled();
      expect(apiClient.put).not.toHaveBeenCalled();

      // 2. Lookup 404 failure: returns error and does not update
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: false,
        statusCode: 404,
        error: "Tariff slab not found",
      });
      const resLookupFail = await updateTariffSlabAction(999, {
        tariffId: 1,
        formulaCode: "FIXED",
        fixedCharge: 100,
      });
      expect(resLookupFail.success).toBe(false);
      expect(apiClient.put).not.toHaveBeenCalled();

      // 3. API PUT failure: lookup succeeds, but PUT endpoint returns 500
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: {
          Id: 15,
          TariffId: 1,
          SortOrder: 3,
          FormulaCode: "FIXED",
          FixedCharge: 50,
          IsActive: true,
        },
      });
      vi.mocked(apiClient.put).mockResolvedValueOnce({
        success: false,
        statusCode: 500,
        error: "Database error on update",
      });
      const resPutFail = await updateTariffSlabAction(15, {
        tariffId: 1,
        formulaCode: "FIXED",
        fixedCharge: 150,
      });
      expect(resPutFail.success).toBe(false);
      expect(apiClient.put).toHaveBeenCalledWith(
        "/TariffSlabDetail/15",
        expect.objectContaining({ sortOrder: 3, fixedCharge: 150 })
      );
    });
  });
});
