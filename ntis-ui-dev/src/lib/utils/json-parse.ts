/**
 * Generic safe JSON parse utility.
 * Avoids try/catch boilerplate at call sites and eliminates duplicate inline
 * parse helpers scattered across the rule engine module.
 *
 * @param json   Raw JSON string (may be undefined/null/empty).
 * @param fallback Value returned when json is absent or unparsable.
 * @returns Parsed value of type T, or fallback on any failure.
 *
 * @example
 * const conditions = safeParse(rule.conditionsJson, defaultConditionGroup);
 */
export function safeParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}
