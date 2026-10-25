/**
 * Parsing and formatting utilities for Tap Size nominal values and units.
 */

/**
 * Formats nominal size value to show at most 2 digits after the decimal point,
 * removing unnecessary trailing/leading zeroes.
 * e.g., "0.750" -> "0.75", "2.0" -> "2", ".6000" -> "0.6", "1.002" -> "1", null -> "-"
 */
export function formatNominalSize(value: unknown, emptyPlaceholder = "-"): string {
  if (value === null || value === undefined || value === "") {
    return emptyPlaceholder;
  }
  const num = Number(value);
  if (Number.isFinite(num)) {
    const rounded = Math.round((num + Number.EPSILON) * 100) / 100;
    return String(rounded);
  }
  return String(value);
}

/**
 * Automatically parses nominal size value and size unit from a tap size string.
 * Supports:
 * - Simple fractions: "1/2", "1/2\"", "1/2 Inch", "3/4", "3/4\"", "1/4", "3/8", "5/8"
 * - Mixed fractions: "1 1/2", "1 1/2\"", "1-1/2", "1 1/4", "2 1/2"
 * - Decimals: "0.5", "0.75", "1.5", "2.5"
 * - Integers with/without units: "1\"", "2\"", "3\"", "4\"", "15 mm", "20 mm"
 * - Unicode fractions: "½", "¾", "¼", "1½"
 */
export function parseNominalSizeFromTapSize(input: string): {
  nominalSizeValue?: string;
  sizeUnit?: string;
} {
  if (!input || !input.trim()) return {};

  let text = input.trim();
  let detectedUnit: string | undefined;

  // Detect unit
  if (/mm|millimeter/i.test(text)) {
    detectedUnit = "mm";
  } else if (/inch|in|\"|''/i.test(text)) {
    detectedUnit = "Inch";
  }

  // Replace unicode fractions
  const unicodeFractions: Record<string, string> = {
    "½": " 1/2",
    "¼": " 1/4",
    "¾": " 3/4",
    "⅛": " 1/8",
    "⅜": " 3/8",
    "⅝": " 5/8",
    "⅞": " 7/8",
  };
  for (const [char, repl] of Object.entries(unicodeFractions)) {
    if (text.includes(char)) {
      text = text.replaceAll(char, repl).trim();
      detectedUnit = detectedUnit ?? "Inch";
    }
  }

  // Mixed number with fraction: e.g. "1 1/2", "1-1/2", "2 3/4"
  const mixedMatch = text.match(/^(\d+)\s*[- ]\s*(\d+)\s*\/\s*(\d+)/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const num = parseInt(mixedMatch[2], 10);
    const den = parseInt(mixedMatch[3], 10);
    if (den !== 0) {
      const val = whole + num / den;
      return {
        nominalSizeValue: formatNominalSize(val, ""),
        sizeUnit: detectedUnit ?? "Inch",
      };
    }
  }

  // Simple fraction: e.g. "1/2", "3/4", "5/8"
  const fractionMatch = text.match(/^(\d+)\s*\/\s*(\d+)/);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10);
    const den = parseInt(fractionMatch[2], 10);
    if (den !== 0) {
      const val = num / den;
      return {
        nominalSizeValue: formatNominalSize(val, ""),
        sizeUnit: detectedUnit ?? "Inch",
      };
    }
  }

  // If text contains a slash (like "3/"), user is still typing a fraction!
  if (text.includes("/")) {
    return detectedUnit ? { sizeUnit: detectedUnit } : {};
  }

  // Pure integer or decimal: e.g. "0.5", "1.5", "2", "2\"", "15 mm"
  const numberMatch = text.match(/^(\d+(?:\.\d+)?)(?:\s*|\"|''|in|inch|mm|$)/i);
  if (numberMatch) {
    const val = parseFloat(numberMatch[1]);
    if (!Number.isNaN(val)) {
      return {
        nominalSizeValue: formatNominalSize(val, ""),
        sizeUnit: detectedUnit,
      };
    }
  }

  return detectedUnit ? { sizeUnit: detectedUnit } : {};
}
