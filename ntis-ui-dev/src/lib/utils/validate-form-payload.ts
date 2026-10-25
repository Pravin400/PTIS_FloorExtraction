export function parseJsonArray<T = unknown>(value: FormDataEntryValue | null, key: string): T[] {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing or empty ${key}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(`Malformed JSON in ${key}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`Expected an array for ${key}`);
  }

  return parsed as T[];
}
