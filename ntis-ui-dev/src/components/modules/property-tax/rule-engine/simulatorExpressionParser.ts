/**
 * simulatorExpressionParser.ts
 * Pure utility helpers for the Rule Simulator payload builder.
 *
 * Keeps useSimulatorPayload.ts under the 200-line component limit.
 */
import { FieldConfig } from '@/types/rule-engine';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FieldTypeMap {
  arrayFields:   Set<string>;
  numericFields: Set<string>;
}

// ── Expression Collector ───────────────────────────────────────────────────────

/**
 * Recursively walks a parsed ruleJson object and collects every
 * 'expression' / 'Expression' string it finds at any nesting depth.
 */
export function collectExpressionsFromRuleJson(ruleJson: string | undefined | null): string[] {
  const results: string[] = [];

  const walk = (obj: unknown): void => {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }

    const o = obj as Record<string, unknown>;
    if (typeof o.Expression === 'string') results.push(o.Expression);
    if (typeof o.expression === 'string') results.push(o.expression);
    Object.values(o).forEach(v => { if (v && typeof v === 'object') walk(v); });
  };

  if (ruleJson) {
    try { walk(JSON.parse(ruleJson)); } catch { /* malformed json — skip */ }
  }
  return results;
}

// ── Field Type Inferrer ────────────────────────────────────────────────────────

/**
 * Infers the required CLR type for each input field purely from the C# lambda
 * expressions stored in ruleJson — no manual per-rule configuration needed.
 *
 * Mapping:
 *   input.X.Contains(...)        → X must be a JSON array  (List<T>)
 *   input.X == 104  /  > 10      → X must be a JSON number (int / double)
 *   input.X == "abc"             → X must be a JSON string
 *   input.X * / + - <number>     → X is arithmetic → numeric
 */
export function inferFieldTypes(expressions: string[]): FieldTypeMap {
  const arrayFields   = new Set<string>();
  const numericFields = new Set<string>();

  for (const expr of expressions) {
    let m: RegExpExecArray | null;

    // ── Array fields: input.X.Contains(...)  (dot + method call) ──────────────
    // X is a C# List<T>; the value inside is what we search for
    const arrRx = /\b[iI]nput\.(\w+)\s*\.\s*(?:Contains|contains)\b/g;
    while ((m = arrRx.exec(expr)) !== null) arrayFields.add(m[1]);

    // ── Scalar/numeric fields: input.X contains/in (1, 2, 3) ─────────────────
    // MS Rules Engine keyword syntax — X is a SCALAR compared against a value set.
    // Distinct from .Contains() — space before operator, NO dot.
    const inSetRx = /\b[iI]nput\.(\w+)\s+(?:contains|in)\s*\(/g;
    while ((m = inSetRx.exec(expr)) !== null) {
      if (!arrayFields.has(m[1])) numericFields.add(m[1]);
    }

    // ── Numeric: input.X <op> <number>  OR  <number> <op> input.X ────────────
    const numRxA = /\b[iI]nput\.(\w+)\s*(?:==|!=|<=|>=|<|>)\s*-?\d+(?:\.\d+)?\b/g;
    while ((m = numRxA.exec(expr)) !== null) {
      if (!arrayFields.has(m[1])) numericFields.add(m[1]);
    }
    const numRxB = /-?\d+(?:\.\d+)?\s*(?:==|!=|<=|>=|<|>)\s*[iI]nput\.(\w+)\b/g;
    while ((m = numRxB.exec(expr)) !== null) {
      if (!arrayFields.has(m[1])) numericFields.add(m[1]);
    }

    // ── Arithmetic involvement → numeric (e.g. input.Rate * ...) ─────────────
    const arithRx = /\b[iI]nput\.(\w+)\s*[+\-*/]/g;
    while ((m = arithRx.exec(expr)) !== null) {
      if (!arrayFields.has(m[1])) numericFields.add(m[1]);
    }
  }

  return { arrayFields, numericFields };
}

// ── Value Coercion ─────────────────────────────────────────────────────────────

/**
 * Converts the raw string value entered by the user into the correct JS type
 * that will serialize to the right JSON form for the backend's BuildDynamicInput.
 *
 * - array  → number[] or string[]  (split by comma)
 * - empty  → 0 for numeric fields, '' for string fields
 * - number → JS number
 * - other  → string
 */
export function coerceInputValue(
  key: string,
  rawVal: string,
  types: FieldTypeMap,
  arrayFieldIds: Set<string>,
  config?: FieldConfig,
): unknown {
  const exprSaysArray   = types.arrayFields.has(key);
  const exprSaysNumeric = types.numericFields.has(key);

  // Expression-inferred type is the source of truth.
  // arrayFieldIds (from conditionsJson operators) is only used as a fallback
  // when expressions give NO information about this field at all.
  const noExprInfo = !exprSaysArray && !exprSaysNumeric;

  const isArray   = exprSaysArray ||
    (noExprInfo && (arrayFieldIds.has(key) || config?.inputType === 'MULTISELECT'));
  const isNumeric = exprSaysNumeric ||
    (!isArray && noExprInfo && (config?.dataType === 'INTEGER' || config?.dataType === 'DECIMAL'));

  if (isArray) {
    const parts = rawVal ? rawVal.split(',') : [];
    return parts.map(v => {
      const t = v.trim();
      const n = Number(t);
      return (t !== '' && !isNaN(n)) ? n : t;
    });
  }

  if (rawVal.trim() === '') return isNumeric ? 0 : '';
  const n = Number(rawVal.trim());
  return !isNaN(n) ? n : rawVal.trim();
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** C# method names that follow 'input.X.' — must not be treated as field names. */
export const KNOWN_CS_METHODS = new Set([
  'Contains', 'contains', 'StartsWith', 'EndsWith', 'Equals', 'ToLower', 'ToUpper',
]);
