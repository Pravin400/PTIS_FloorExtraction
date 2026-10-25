import { z } from "zod";
import { VALIDATION_LIMITS } from "@/lib/validations/validation.constants";
import {
  ALLOWED_TARIFF_BILLING_METHODS,
  SUPPORTED_TARIFF_SLAB_FORMULA_CODES,
  type SupportedTariffSlabFormulaCode,
} from "@/constants/waterBill.constants";

export { ALLOWED_TARIFF_BILLING_METHODS, SUPPORTED_TARIFF_SLAB_FORMULA_CODES };
export type { SupportedTariffSlabFormulaCode };

export function isValidCalendarDate(dateStr: string | null | undefined): boolean {
  if (!dateStr || typeof dateStr !== "string") return true;
  const trimmed = dateStr.trim();
  if (!trimmed) return true;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    return false;
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

export function createTariffWorkbenchSchema(
  t: (key: string, values?: Record<string, string | number>) => string
) {
  return z
    .object({
      tariffCode: z
        .string()
        .trim()
        .min(1, t("validation.tariffCodeRequired"))
        .refine((val) => val.trim().length > 0, { message: t("validation.tariffCodeRequired") })
        .max(
          VALIDATION_LIMITS.MAX_CODE_LENGTH,
          t("validation.tariffCodeLength", { count: VALIDATION_LIMITS.MAX_CODE_LENGTH })
        ),

      tariffName: z
        .string()
        .trim()
        .min(1, t("validation.tariffNameRequired"))
        .refine((val) => val.trim().length > 0, { message: t("validation.tariffNameRequired") })
        .max(
          VALIDATION_LIMITS.MAX_NAME_LENGTH,
          t("validation.tariffNameLength", { count: VALIDATION_LIMITS.MAX_NAME_LENGTH })
        ),

      financialYearId: z.coerce
        .number({
          message: t("validation.financialYearIdRequired"),
        })
        .min(1, t("validation.financialYearIdRequired")),

      connectionTypeId: z.coerce
        .number({ message: t("validation.connectionTypeIdRequired") })
        .min(1, t("validation.connectionTypeIdRequired")),

      connectionCategoryId: z.coerce
        .number({ message: t("validation.connectionCategoryIdRequired") })
        .min(1, t("validation.connectionCategoryIdRequired")),

      tapSizeId: z.coerce
        .number({ message: t("validation.tapSizeIdRequired") })
        .min(1, t("validation.tapSizeIdRequired")),



      effectiveFrom: z
        .string()
        .trim()
        .min(1, t("validation.effectiveFromRequired"))
        .refine(
          (val) => isValidCalendarDate(val),
          { message: t("validation.effectiveFromInvalid") || t("validation.effectiveFromRequired") }
        ),

      effectiveTo: z
        .string()
        .nullable()
        .optional()
        .refine(
          (val) => {
            if (!val || !val.trim()) return true;
            return isValidCalendarDate(val);
          },
          { message: t("validation.effectiveToInvalid") || t("validation.effectiveToAfterFrom") }
        ),

      versionNo: z.coerce.number().min(1).optional().default(1),

      status: z.string().optional().default("Draft"),

      description: z.string().nullable().optional(),

      isActive: z.boolean().default(true),
    })
    .refine(
      (data) => {
        if (!data.effectiveFrom || !data.effectiveTo) return true;
        const fromDate = new Date(data.effectiveFrom);
        const toDate = new Date(data.effectiveTo);
        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return true;
        return toDate >= fromDate;
      },
      {
        message: t("validation.effectiveToAfterFrom"),
        path: ["effectiveTo"],
      }
    );
}

export type TariffWorkbenchSchemaInput = z.input<
  ReturnType<typeof createTariffWorkbenchSchema>
>;

export function createTariffSlabSchema(
  t: (key: string, values?: Record<string, string | number>) => string
) {
  return z
    .object({
      tariffId: z.coerce.number().min(1, t("validation.tariffIdRequired") || "Tariff ID is required"),
      geographyUnitId: z.coerce.number().nullable().optional(),
      fromUnit: z.coerce.number().nullable().optional(),
      toUnit: z.coerce.number().nullable().optional(),
      unitRate: z.coerce.number().nullable().optional(),
      fixedCharge: z.coerce.number().nullable().optional(),
      minimumCharge: z.coerce.number().nullable().optional(),
      maximumCharge: z.coerce.number().nullable().optional(),
      perConnectionAmount: z.coerce.number().nullable().optional(),
      formulaCode: z
        .string()
        .trim()
        .min(1, t("validation.formulaCodeRequired") || "Formula code is required")
        .transform((val) => (val.toUpperCase() === "FLAT_RATE" ? "FIXED" : val))
        .refine(
          (val): val is SupportedTariffSlabFormulaCode =>
            (SUPPORTED_TARIFF_SLAB_FORMULA_CODES as readonly string[]).includes(val),
          {
            message: t("validation.formulaCodeInvalid") || "Invalid formula code",
          }
        ),
      sortOrder: z.coerce.number().optional(),
      isActive: z.boolean().default(true),
    })
    .superRefine((data, ctx) => {
      const isSlabBased = ["UNIT_RATE", "UNIT_RATE_FIXED", "SLAB_RATE"].includes(data.formulaCode);
      const isFixedRequired = ["FIXED", "UNIT_RATE_FIXED", "FLAT_RATE"].includes(data.formulaCode);

      if (isSlabBased) {
        if (data.fromUnit == null || data.fromUnit < 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "From unit must be >= 0", path: ["fromUnit"] });
        }
        if (data.toUnit == null || data.toUnit <= 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "To unit must be > 0", path: ["toUnit"] });
        }
        if (data.fromUnit != null && data.toUnit != null && data.toUnit <= data.fromUnit) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "To unit must be greater than From unit", path: ["toUnit"] });
        }
        if (data.unitRate == null || data.unitRate < 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Unit rate must be >= 0", path: ["unitRate"] });
        }
      }

      if (isFixedRequired) {
        if (data.fixedCharge == null || data.fixedCharge < 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Fixed charge must be >= 0", path: ["fixedCharge"] });
        }
      }

      if (data.formulaCode === "MINIMUM_CHARGE") {
        if (data.minimumCharge == null || data.minimumCharge < 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Minimum charge must be >= 0", path: ["minimumCharge"] });
        }
      }

      if (data.formulaCode === "PER_CONNECTION") {
        if (data.perConnectionAmount == null || data.perConnectionAmount < 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Per connection amount must be >= 0", path: ["perConnectionAmount"] });
        }
      }

      if (data.maximumCharge != null && data.minimumCharge != null && data.maximumCharge < data.minimumCharge) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Maximum charge must be greater than or equal to minimum charge", path: ["maximumCharge"] });
      }
    });
}

export function createTariffChargeDetailSchema(
  t: (key: string, values?: Record<string, string | number>) => string
) {
  return z
    .object({
      tariffId: z.coerce.number().min(1, t("validation.tariffIdRequired") || "Tariff ID is required"),
      chargeHeadId: z.coerce.number().min(1, t("validation.chargeHeadIdRequired") || "Charge Head is required"),
      geographyUnitId: z.coerce.number().nullable().optional(),
      amount: z.preprocess((val) => {
        if (val === "" || val === null || val === undefined) {
          return undefined;
        }
        if (typeof val === "string") {
          const trimmed = val.trim();
          if (trimmed === "") return undefined;
          const num = Number(trimmed);
          return isNaN(num) ? val : num;
        }
        return val;
      }, z.number({
        message: t("validation.amountRequired") || t("errors.amountRequired") || "Amount is required",
      }).min(0, t("validation.amountInvalid") || t("errors.amountInvalid") || "Amount must be >= 0")),
      isDynamic: z.preprocess((val) => {
        if (typeof val === "boolean") return val;
        if (val === "true") return true;
        if (val === "false") return false;
        return undefined;
      }, z.boolean({
        message: t("validation.isDynamicRequired") || "Dynamic selection is required",
      })),
      isMandatory: z.preprocess((val) => {
        if (typeof val === "boolean") return val;
        if (val === "true") return true;
        if (val === "false") return false;
        return undefined;
      }, z.boolean({
        message: t("validation.isMandatoryRequired") || "Mandatory selection is required",
      })),
      sequenceNo: z.coerce.number().min(1, t("errors.sequenceNoInvalid") || "Sequence No must be >= 1"),
      isActive: z.boolean().default(true),
    })
    .superRefine((data, ctx) => {
      if (data.isDynamic && data.amount !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("errors.dynamicAmountNonZero") || "Amount must be 0 when Dynamic is Yes",
          path: ["amount"],
        });
      }
    });
}
