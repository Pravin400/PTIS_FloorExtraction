/**
 * Devanagari numerals mapping (U+0966 to U+096F)
 */
const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'] as const;

const DEVANAGARI_TO_ASCII: Record<string, string> = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
};

/**
 * Converts numbers or digit strings to Devanagari numerals for Marathi/Hindi locales.
 * Returns standard ASCII digits for English or other locales.
 *
 * @example
 * formatLocalizedNumber(65, 'mr') // '६५'
 * formatLocalizedNumber(65, 'en') // '65'
 */
export function formatLocalizedNumber(
  value: number | string | null | undefined,
  locale?: string
): string {
  if (value === null || value === undefined) return '';
  const str = String(value).normalize('NFC');
  if (locale === 'mr' || locale === 'hi') {
    return str.replace(/[0-9]/g, (d) => DEVANAGARI_DIGITS[Number(d)] ?? d);
  }
  return str;
}

/**
 * Normalizes Devanagari numerals (०-९) back to standard ASCII digits (0-9).
 * Crucial for processing citizen inputs (mobile numbers, OTPs, PIN codes, ticket IDs).
 */
export function normalizeDevanagariDigits(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .normalize('NFC')
    .replace(/[०-९]/g, (ch) => DEVANAGARI_TO_ASCII[ch] ?? ch);
}

/**
 * Replaces department count tokens (e.g. '{count}', '(65)', '६५') in translated label templates
 * with the live department count formatted according to the current locale.
 *
 * @example
 * formatDepartmentNavLabel('Departments (65)', 67, 'en') // 'Departments (67)'
 * formatDepartmentNavLabel('खाती (६५)', 67, 'mr')       // 'खाती (६७)'
 * formatDepartmentNavLabel('Departments ({count})', 67, 'en') // 'Departments (67)'
 */
export function formatDepartmentNavLabel(
  labelTemplate: string,
  count: number,
  locale?: string
): string {
  if (!labelTemplate) return '';
  const normalized = labelTemplate.normalize('NFC');
  const isDevanagari = locale === 'mr' || locale === 'hi';
  const formattedCount = isDevanagari ? formatLocalizedNumber(count, locale) : String(count);

  if (normalized.includes('{count}')) {
    return normalized.replace(/\{count\}/g, formattedCount);
  }

  // Replace legacy embedded counts in parentheses e.g. "(65)" -> "(67)" or "(६५)" -> "(६७)"
  if (/\([0-9०-९]+\)/.test(normalized)) {
    return normalized.replace(/\([0-9०-९]+\)/g, `(${formattedCount})`);
  }

  // Replace freestanding count digits (Devanagari or ASCII numbers)
  return normalized
    .replace(/[०-९]+/g, formattedCount)
    .replace(/\b\d+\b/g, formattedCount);
}

/**
 * Resolves localized name for bilingual department / entity objects.
 * Prioritizes NFC normalized Devanagari text for Marathi locale.
 */
export function getLocalizedEntityName(
  entity: { nameEn?: string | null; nameMr?: string | null } | null | undefined,
  locale?: string
): string {
  if (!entity) return '';
  if (locale === 'mr' && entity.nameMr) {
    return entity.nameMr.normalize('NFC');
  }
  return (entity.nameEn || entity.nameMr || '').normalize('NFC');
}

