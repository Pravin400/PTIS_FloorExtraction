import { z } from "zod";
import { zodErrorsToRecord } from "@/lib/validations/validation-utils";
import type { CreateChargeHeadDto } from "@/types/water-bill/chargeHeads.types";
import {
  WATER_BILL_ENUMS,
  type ChargeType,
  CHARGE_HEAD_LIMITS,
  CHARGE_HEAD_CODE_REGEX,
  CHARGE_HEAD_CODE_SANITIZE,
  MULTILINGUAL_ALPHANUMERIC_REGEX,
  hasMultilingualAlphanumeric,
  SEQUENCE_NO_MAX,
} from "@/constants/waterBill.constants";

export {
  CHARGE_HEAD_CODE_REGEX,
  CHARGE_HEAD_CODE_SANITIZE,
  MULTILINGUAL_ALPHANUMERIC_REGEX,
  hasMultilingualAlphanumeric,
  SEQUENCE_NO_MAX,
};

export function createChargeHeadSchema(
  t: (key: string, values?: Record<string, string | number>) => string
) {
  const safeT = (key: string, values?: Record<string, string | number>) => {
    try {
      if (typeof (t as { has?: (k: string) => boolean })?.has === "function") {
        const tWithHas = t as unknown as { has: (k: string) => boolean };
        if (!tWithHas.has(key)) {
          return key;
        }
      }
      return t(key, values);
    } catch {
      return key;
    }
  };

  return z.object({
    chargeHeadCode: z
      .string({ message: safeT("form.validation.codeRequired") })
      .refine((val) => val.trim().length > 0, {
        message: safeT("form.validation.codeRequired"),
      })
      .max(
        CHARGE_HEAD_LIMITS.CODE_MAX,
        safeT("form.validation.codeMaxLength", { count: CHARGE_HEAD_LIMITS.CODE_MAX })
      )
      .regex(
        CHARGE_HEAD_CODE_REGEX,
        safeT("form.validation.codeInvalid")
      ),

    chargeHeadName: z
      .string({ message: safeT("form.validation.nameRequired") })
      .refine((val) => val.trim().length > 0, {
        message: safeT("form.validation.nameRequired"),
      })
      .refine((val) => hasMultilingualAlphanumeric(val), {
        message: safeT("form.validation.nameInvalid"),
      })
      .transform((val) => val.trim())
      .pipe(
        z
          .string()
          .max(
            CHARGE_HEAD_LIMITS.NAME_MAX,
            safeT("form.validation.nameMaxLength", { count: CHARGE_HEAD_LIMITS.NAME_MAX })
          )
      ),

    chargeHeadNameLocal: z
      .string()
      .refine((val) => val === "" || (val.trim().length > 0 && hasMultilingualAlphanumeric(val)), {
        message: safeT("form.validation.nameLocalInvalid"),
      })
      .refine((val) => val.trim().length <= CHARGE_HEAD_LIMITS.NAME_LOCAL_MAX, {
        message: safeT("form.validation.nameLocalMaxLength", { count: CHARGE_HEAD_LIMITS.NAME_LOCAL_MAX }),
      })
      .transform((val) => (val.trim() === "" ? undefined : val.trim()))
      .optional(),

    chargeType: z
      .string({ message: safeT("form.validation.chargeTypeRequired") })
      .trim()
      .min(1, safeT("form.validation.chargeTypeRequired"))
      .refine((val) => WATER_BILL_ENUMS.CHARGE_TYPES.includes(val as ChargeType), {
        message: safeT("form.validation.chargeTypeInvalid"),
      }),

    sequenceNo: z
      .union([
        z.number({ message: safeT("form.validation.sequenceNoRequired") }),
        z.string(),
        z.undefined(),
        z.null(),
      ])
      .transform((val, ctx) => {
        if (val === undefined || val === null) return 1;
        if (typeof val === "string" && val.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: safeT("form.validation.sequenceNoRequired"),
          });
          return z.NEVER;
        }
        const num = Number(val);
        if (isNaN(num)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: safeT("form.validation.sequenceNoRequired"),
          });
          return z.NEVER;
        }
        if (!Number.isInteger(num) || num < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: safeT("form.validation.sequenceNoMin", { count: 1 }),
          });
          return z.NEVER;
        }
        return num;
      })
      .pipe(
        z
          .number({ message: safeT("form.validation.sequenceNoRequired") })
          .int(safeT("form.validation.sequenceNoMin", { count: 1 }))
          .min(1, safeT("form.validation.sequenceNoMin", { count: 1 }))
          .max(SEQUENCE_NO_MAX, safeT("form.validation.sequenceNoMax", { count: SEQUENCE_NO_MAX }))
      )
      .default(1),

    description: z
      .string()
      .max(
        CHARGE_HEAD_LIMITS.DESCRIPTION_MAX,
        safeT("form.validation.descriptionMaxLength", { count: CHARGE_HEAD_LIMITS.DESCRIPTION_MAX })
      )
      .refine((val) => val === "" || (val.trim().length > 0 && hasMultilingualAlphanumeric(val)), {
        message: safeT("form.validation.descriptionInvalid"),
      })
      .refine((val) => val.trim().length <= CHARGE_HEAD_LIMITS.DESCRIPTION_MAX, {
        message: safeT("form.validation.descriptionMaxLength", { count: CHARGE_HEAD_LIMITS.DESCRIPTION_MAX }),
      })
      .transform((val) => (val.trim() === "" ? undefined : val.trim()))
      .optional(),

    isRefundable: z.boolean().default(false),
    isRegularPay: z.boolean().default(false),
    isActive: z.boolean().default(true),
  });
}

export type ChargeHeadSchemaInput = z.input<
  ReturnType<typeof createChargeHeadSchema>
>;

export function validateChargeHeadInput(
  input: CreateChargeHeadDto,
  t: (key: string, values?: Record<string, string | number>) => string
): {
  isValid: boolean;
  errors: Record<string, string[]>;
  data?: CreateChargeHeadDto;
} {
  const schema = createChargeHeadSchema(t);
  const result = schema.safeParse(input);

  if (result.success) {
    return {
      isValid: true,
      errors: {},
      data: result.data as CreateChargeHeadDto,
    };
  }

  return {
    isValid: false,
    errors: zodErrorsToRecord(result),
  };
}
