import { useCallback } from "react";
import { BulkUpdateFieldConfig, PropertyPreviewRow } from "@/types/common-details-update/common-details-update.types";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

/**
 * Safely compiles a regex pattern string from backend configurations.
 * Strips out the internal DB tag 'condition' (e.g. ^condition[1-9]\d{3}$ -> ^[1-9]\d{3}$)
 * and normalizes double-escaped backslashes to ensure correct regex evaluation in JavaScript.
 */
export const compileSafeRegex = (pattern?: string | null): RegExp | null => {
  if (!pattern) return null;
  try {
    let cleanPattern = pattern;
    if (/condition/i.test(cleanPattern)) {
      cleanPattern = cleanPattern.replace(/condition/gi, "");
    }
    const normalized = cleanPattern.replace(/\\\\/g, "\\");
    if (!normalized.trim()) return null;
    return new RegExp(normalized);
  } catch (_e) {
    try {
      const fallback = pattern.replace(/condition/gi, "");
      return new RegExp(fallback);
    } catch (_err) {
      return null;
    }
  }
};

/**
 * Dynamic variableName regex matching helper matching backend CommonDetailsService.cs:
 * Pattern: ^variableName[A-Za-z0-9]*$
 */
const matchesYearVariable = (variableName: string, fieldName: string, displayName?: string): boolean => {
  const name = fieldName ?? "";
  const disp = displayName ?? "";
  const normName = name.replace(/[_ ]/g, "");
  const normDisp = disp.replace(/[_ ]/g, "");

  const regex = new RegExp(`^${variableName}[A-Za-z0-9]*$`, "i");

  return (
    regex.test(name) ||
    regex.test(disp) ||
    regex.test(normName) ||
    regex.test(normDisp)
  );
};

/**
 * Utility function to check if a field represents Assessment Year dynamically
 */
export const isAssessmentYearField = (fieldName: string, displayName?: string): boolean => {
  return matchesYearVariable("AssessmentYear", fieldName, displayName);
};

/**
 * Utility function to check if a field represents Construction Year dynamically
 */
export const isConstructionYearField = (fieldName: string, displayName?: string): boolean => {
  return matchesYearVariable("ConstructionYear", fieldName, displayName);
};

/**
 * Utility function to check if a field is Construction Year or Assessment Year,
 * which must not exceed the current year.
 */
export const mustNotExceedCurrentYear = (fieldName: string, displayName?: string): boolean => {
  return isAssessmentYearField(fieldName, displayName) || isConstructionYearField(fieldName, displayName);
};

/**
 * Helper function to extract a valid numeric year from a property preview row
 */
export const getYearValueFromRow = (
  row: Record<string, unknown>,
  isTargetYearFn: (fName: string, dName?: string) => boolean
): number | null => {
  if (!row) return null;
  const keys = Object.keys(row);
  for (const k of keys) {
    if (isTargetYearFn(k, k)) {
      const val = row[k];
      if (val !== undefined && val !== null && val !== "" && val !== "-") {
        const num = Number(val);
        if (!isNaN(num) && num > 0) {
          return num;
        }
      }
    }
  }
  return null;
};

export interface YearValidationResult {
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

/**
 * Custom hook for year-based validation rules.
 * Rules:
 * 1. Year format validated via DB regex (config.validationRegex after stripping 'condition') or standard 4-digit format ('^[1-9]\\d{3}$')
 * 2. Construction Year and Assessment Year cannot be greater than current year (Hard error - red)
 * 3. AssessmentYear >= ConstructionYear when BOTH fields are present (Hard error on AssessmentYear - red)
 * 4. Single field update -> Continuous warning under the field (Amber/Yellow)
 */
export const useYearValidation = (
  t: (key: string, values?: Record<string, string | number>) => string
) => {
  const assessmentLabel = useAliasLabel("Assessment", t("aliasFallback.assessment"));
  const constructionYearLabel = useAliasLabel("Construction_Year", t("aliasFallback.constructionYear"));

  const validateYearFields = useCallback(
    (
      formValues: Record<string, string | number | boolean>,
      fieldConfigs: BulkUpdateFieldConfig[],
      _properties: PropertyPreviewRow[] = []
    ): YearValidationResult => {
      const errors: Record<string, string> = {};
      const warnings: Record<string, string> = {};

      const currentYear = new Date().getFullYear();
      const defaultYearRegex = /^[1-9]\d{3}$/;

      // Step 1: Validate individual year field format & current year boundary for Construction/Assessment Year fields (Hard errors)
      fieldConfigs.forEach((config) => {
        if (config.controlType === "checkbox") return;
        const val = formValues[config.fieldName];
        const isProvided = val !== undefined && val !== "" && val !== null;
        if (!isProvided) return;

        const isAssessOrConstYear =
          isAssessmentYearField(config.fieldName, config.displayName) ||
          isConstructionYearField(config.fieldName, config.displayName);

        const isYearControl =
          String(config.controlType).toLowerCase() === "year" || isAssessOrConstYear;

        if (isYearControl) {
          const strVal = String(val).trim();

          // 1. Format check: use dynamic DB regex (cleaned of "condition") or standard 4-digit year format
          const dbRegex = compileSafeRegex(config.validationRegex);
          const effectiveRegex = dbRegex || defaultYearRegex;

          if (!effectiveRegex.test(strVal)) {
            errors[config.fieldName] = t("messages.invalidYearFormat");
            return;
          }

          // 2. Cannot exceed current year check ONLY for Construction Year and Assessment Year
          if (isAssessOrConstYear) {
            const numYear = Number(strVal);
            if (!isNaN(numYear) && numYear > currentYear) {
              errors[config.fieldName] = t("messages.yearExceedsCurrentYear", { year: currentYear });
              return;
            }
          }
        }
      });

      // Step 2: Validate relative AssessmentYear >= ConstructionYear rules & continuous single field warnings
      let assessmentConfig: BulkUpdateFieldConfig | undefined;
      let constructionConfig: BulkUpdateFieldConfig | undefined;

      fieldConfigs.forEach((config) => {
        if (isAssessmentYearField(config.fieldName, config.displayName)) {
          assessmentConfig = config;
        } else if (isConstructionYearField(config.fieldName, config.displayName)) {
          constructionConfig = config;
        }
      });

      const valAssessment = assessmentConfig ? formValues[assessmentConfig.fieldName] : undefined;
      const valConstruction = constructionConfig ? formValues[constructionConfig.fieldName] : undefined;

      const hasAssessmentInput = valAssessment !== undefined && valAssessment !== "" && valAssessment !== null;
      const hasConstructionInput = valConstruction !== undefined && valConstruction !== "" && valConstruction !== null;

      const numAssessment = hasAssessmentInput ? Number(valAssessment) : NaN;
      const numConstruction = hasConstructionInput ? Number(valConstruction) : NaN;

      const assessmentHasError = assessmentConfig ? Boolean(errors[assessmentConfig.fieldName]) : false;
      const constructionHasError = constructionConfig ? Boolean(errors[constructionConfig.fieldName]) : false;

      // Only check relative rules if individual fields pass 4-digit & currentYear checks
      if (!assessmentHasError && !constructionHasError) {
        // CASE A: Both AssessmentYear & ConstructionYear are present in form -> Hard Blocking Error (Red)
        if (assessmentConfig && constructionConfig) {
          if (hasAssessmentInput && hasConstructionInput) {
            if (!isNaN(numAssessment) && !isNaN(numConstruction)) {
              if (numAssessment < numConstruction) {
                // Priority goes to Assessment Year -> ONLY show error message under Assessment Year field!
                const msg = t("messages.assessmentYearLessThanConstruction", {
                  assessment: assessmentLabel,
                  constructionYear: constructionYearLabel,
                });
                if (assessmentConfig) {
                  errors[assessmentConfig.fieldName] = msg;
                }
              }
            }
          }
        }
        // CASE B: Single AssessmentYear field present in form -> Continuous Warning under field (Amber/Yellow)
        else if (assessmentConfig && !constructionConfig) {
          warnings[assessmentConfig.fieldName] = t("messages.makeSureAssessmentYearGreater", {
            assessment: assessmentLabel,
            constructionYear: constructionYearLabel,
          });
        }
        // CASE C: Single ConstructionYear field present in form -> Continuous Warning under field (Amber/Yellow)
        else if (constructionConfig && !assessmentConfig) {
          warnings[constructionConfig.fieldName] = t("messages.makeSureConstructionYearLessThan", {
            assessment: assessmentLabel,
            constructionYear: constructionYearLabel,
          });
        }
      }

      return { errors, warnings };
    },
    [t, assessmentLabel, constructionYearLabel]
  );

  return {
    validateYearFields,
  };
};
