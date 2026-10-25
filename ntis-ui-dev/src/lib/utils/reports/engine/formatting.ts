export const MARATHI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export function toDevanagariDigits(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return '';
  return String(num).replace(/[0-9]/g, (d) => MARATHI_DIGITS[parseInt(d, 10)] ?? d);
}

export function formatFieldValue(val: unknown, format?: string): string {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) {
    const d = String(val.getDate()).padStart(2, '0');
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const y = val.getFullYear();
    const str = `${d}/${m}/${y}`;
    return format === 'devanagari' ? toDevanagariDigits(str) : str;
  }
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    const parts = val.substring(0, 10).split('-');
    const str = `${parts[2]}/${parts[1]}/${parts[0]}`;
    return format === 'devanagari' ? toDevanagariDigits(str) : str;
  }
  if (typeof val === 'boolean') {
    return val ? 'होय' : 'नाही';
  }
  if (typeof val === 'number') {
    const formatted = val.toLocaleString('en-IN');
    return format === 'devanagari' ? toDevanagariDigits(formatted) : formatted;
  }
  return format === 'devanagari' ? toDevanagariDigits(String(val)) : String(val);
}

const NAMED_HTML_ENTITIES: Record<string, string> = {
  nbsp: '\u00a0',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

export function decodeHtmlEntities(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  let decoded = String(value);

  for (let pass = 0; pass < 3; pass += 1) {
    const next = decoded
      .replace(/&#x([0-9a-f]+);?/gi, (match, hex: string) => {
        const codePoint = Number.parseInt(hex, 16);
        return Number.isFinite(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
          ? String.fromCodePoint(codePoint)
          : match;
      })
      .replace(/&#([0-9]+);?/g, (match, decimal: string) => {
        const codePoint = Number.parseInt(decimal, 10);
        return Number.isFinite(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
          ? String.fromCodePoint(codePoint)
          : match;
      })
      .replace(
        /&(nbsp|amp|lt|gt|quot|apos);/gi,
        (match, name: string) => NAMED_HTML_ENTITIES[name.toLowerCase()] ?? match
      );
    if (next === decoded) break;
    decoded = next;
  }

  return decoded;
}

export function escapeHtml(str: string | number | null | undefined): string {
  return decodeHtmlEntities(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function getValueByPath(source: unknown, path: string): unknown {
  if (!source || !path || typeof source !== 'object') return undefined;
  const record = source as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(record, path)) return record[path];

  return String(path)
    .split('.')
    .reduce<unknown>((value, key) => {
      if (value === null || value === undefined || typeof value !== 'object') {
        return undefined;
      }
      const rec = value as Record<string, unknown>;
      if (Object.prototype.hasOwnProperty.call(rec, key)) return rec[key];

      const matchingKey = Object.keys(rec).find(
        (candidate) => candidate.toLowerCase() === key.toLowerCase()
      );
      return matchingKey === undefined ? undefined : rec[matchingKey];
    }, source);
}

export function resolveDataCollection(
  source: unknown,
  path: string
): Record<string, unknown>[] {
  const value = getValueByPath(source, path);
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === 'object'
    );
  }
  return value && typeof value === 'object'
    ? [value as Record<string, unknown>]
    : [];
}
