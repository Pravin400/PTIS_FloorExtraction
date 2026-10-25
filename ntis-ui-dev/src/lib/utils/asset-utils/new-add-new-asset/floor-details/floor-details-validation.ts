 
import { NewFloorFormState } from "@/types/asset/floor-details.types";

const THIS_YEAR = new Date().getFullYear();

/**
 * Client-side pre-flight gate for the "add floor" form.
 * Only checks what the backend CANNOT infer from step-wise locking alone:
 *   – required dropdown selections (floor, conType, useType, subUseType)
 *   – conYear numeric format and max = current year (UX-only, 4-digit gate)
 *
 * All numeric range checks (rooms > 0, areas > 0, baseValue > 0, carpet ≤ builtUp,
 * asstYear) are enforced by the backend — no frontend duplication here.
 */
export function validateFloorConfig(form: NewFloorFormState): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.floor || form.floor.trim() === "") {
    errors.floor = "Required";
  }
  if (!form.conType || form.conType.trim() === "") {
    errors.conType = "Required";
  }
  if (!form.useType || form.useType.trim() === "") {
    errors.useType = "Required";
  }
  if (!form.subUseType || form.subUseType.trim() === "") {
    errors.subUseType = "Required";
  }

  // Con Year: 4 numeric digits, must not exceed the current year
  if (!form.conYear || form.conYear.trim() === "") {
    errors.conYear = "Required";
  } else {
    const conYearNum = Number(form.conYear);
    if (
      isNaN(conYearNum) ||
      form.conYear.length !== 4 ||
      conYearNum < 1800 ||
      conYearNum > THIS_YEAR
    ) {
      errors.conYear = `Enter a valid year between 1800 and ${THIS_YEAR}`;
    }
  }

  // Assessment Year: 4 numeric digits, must not exceed the current year, and must be >= Con Year
  if (!form.asstYear || form.asstYear.trim() === "") {
    errors.asstYear = "Required";
  } else {
    const asstYearNum = Number(form.asstYear);
    const conYearNum = Number(form.conYear);
    if (
      isNaN(asstYearNum) ||
      form.asstYear.length !== 4 ||
      asstYearNum < 1800 ||
      asstYearNum > THIS_YEAR
    ) {
      errors.asstYear = `Enter a valid year between 1800 and ${THIS_YEAR}`;
    } else if (!isNaN(conYearNum) && asstYearNum < conYearNum) {
      errors.asstYear = "Cannot be earlier than Con Yr";
    }
  }

  // Built-Up & Carpet Area validations removed as requested
  const builtUp = Number(form.builtUpAreaSqM) || 0;
  const carpet = Number(form.carpetAreaSqM) || 0;
  
  if (carpet > 0 && builtUp > 0 && carpet > builtUp) {
    errors.carpetAreaSqM = "Cannot exceed Built-Up Area";
  }

  return errors;
}

