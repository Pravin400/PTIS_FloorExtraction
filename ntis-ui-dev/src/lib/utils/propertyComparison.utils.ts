import { formatIndianNumber } from '@/lib/utils/format';

/**
 * Formats monetary currency values to standard Indian representation.
 */
export function formatCurrencyValue(val: number): string {
  const decimals = Number.isInteger(val) ? 0 : 2;
  return '₹' + formatIndianNumber(val, decimals, decimals);
}

/**
 * Formats currency values compactly using Indian numbering (L for Lakh, Cr for Crore).
 * Returns both compact text and full formatted text for hover tooltips.
 * e.g.,
 * 4,52,737 -> compact: "₹4.53 L", full: "₹4,52,737"
 * 1,25,89,000 -> compact: "₹1.26 Cr", full: "₹1,25,89,000"
 * 34,185 -> compact: "₹34,185", full: "₹34,185"
 */
export function formatCompactCurrency(val: number): { compact: string; full: string } {
  const absVal = Math.abs(val);
  const full = formatCurrencyValue(val);

  if (absVal >= 10000000) {
    const crVal = (val / 10000000).toFixed(2).replace(/\.00$/, '');
    return { compact: `₹${crVal} Cr`, full };
  }
  if (absVal >= 100000) {
    const lakhVal = (val / 100000).toFixed(2).replace(/\.00$/, '');
    return { compact: `₹${lakhVal} L`, full };
  }

  return { compact: full, full };
}

/**
 * Formats numeric values (e.g., Area) compactly.
 */
export function formatCompactNumber(val: number, unit?: string): { compact: string; full: string } {
  const absVal = Math.abs(val);
  const formattedUnit = formatAreaUnit(unit);
  const unitSuffix = formattedUnit ? ` ${formattedUnit}` : '';
  const full = `${val.toLocaleString('en-IN')}${unitSuffix}`;

  if (absVal >= 10000000) {
    const crVal = (val / 10000000).toFixed(2).replace(/\.00$/, '');
    return { compact: `${crVal} Cr${unitSuffix}`, full };
  }
  if (absVal >= 100000) {
    const lakhVal = (val / 100000).toFixed(2).replace(/\.00$/, '');
    return { compact: `${lakhVal} L${unitSuffix}`, full };
  }

  return { compact: full, full };
}

/**
 * Determines text color based on numerical change.
 */
export function getDiffColorClass(diff: number): string {
  if (diff > 0) return 'text-emerald-600';
  if (diff < 0) return 'text-rose-600';
  return 'text-gray-500';
}

/**
 * Returns arrow indicator depending on numerical change.
 */
export function getDiffArrowSymbol(diff: number): string {
  if (diff > 0) return '↑ ';
  if (diff < 0) return '↓ ';
  return '';
}

/**
 * Maps raw backend unit string (e.g., 'SqMeter') to UI representation (e.g., 'm²').
 */
export function formatAreaUnit(rawUnit?: string): string {
  if (!rawUnit) return 'm²';
  const unitLower = rawUnit.toLowerCase();
  if (unitLower.includes('sqmeter') || unitLower.includes('sqm') || unitLower === 'm2') {
    return 'm²';
  }
  if (unitLower.includes('sqft') || unitLower.includes('sqfeet')) {
    return 'sq.ft';
  }
  return rawUnit;
}

/**
 * Computes Levenshtein Distance between two strings.
 */
export function levenshteinDistance(s1: string, s2: string): number {
  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const row = new Array(s2.length + 1);
  for (let i = 0; i <= s2.length; i++) {
    row[i] = i;
  }

  for (let i = 1; i <= s1.length; i++) {
    let prev = i;
    for (let j = 1; j <= s2.length; j++) {
      const val = s1[i - 1] === s2[j - 1] ? row[j - 1] : Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
      row[j - 1] = prev;
      prev = val;
    }
    row[s2.length] = prev;
  }

  return row[s2.length];
}

/**
 * Industry-standard text similarity percentage using Levenshtein distance, Jaccard Index, and Token Containment.
 */
export function calculateStringSimilarityPercentage(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (!s1 && !s2) return 100;
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 100;

  const clean1 = s1.replace(/[^\w\s\u0900-\u097F]/gi, '').trim();
  const clean2 = s2.replace(/[^\w\s\u0900-\u097F]/gi, '').trim();
  if (clean1 === clean2) return 100;

  // 1. Normalized Levenshtein Similarity
  const maxLen = Math.max(clean1.length, clean2.length);
  const levDist = levenshteinDistance(clean1, clean2);
  const levSim = maxLen > 0 ? ((maxLen - levDist) / maxLen) * 100 : 0;

  // 2. Token Set Jaccard & Containment Similarity
  const tokens1 = clean1.split(/\s+/).filter(t => t.length > 0);
  const tokens2 = clean2.split(/\s+/).filter(t => t.length > 0);

  if (tokens1.length === 0 || tokens2.length === 0) return parseFloat(levSim.toFixed(2));

  const set2 = new Set(tokens2);
  const common = tokens1.filter(t => set2.has(t));
  const union = new Set([...tokens1, ...tokens2]);

  const jaccard = (common.length / union.size) * 100;
  const dice = ((2 * common.length) / (tokens1.length + tokens2.length)) * 100;

  const overallSim = Math.max(levSim, jaccard, dice);
  return parseFloat(overallSim.toFixed(2));
}

/**
 * Calculates numeric match percentage based on relative variance.
 */
export function calculateNumericSimilarityPercentage(num1: number, num2: number): number {
  if (num1 === num2) return 100;
  const maxVal = Math.max(Math.abs(num1), Math.abs(num2));
  if (maxVal === 0) return 100;
  const diff = Math.abs(num1 - num2);
  const variancePct = (diff / maxVal) * 100;
  const matchPct = Math.max(0, 100 - variancePct);
  return parseFloat(matchPct.toFixed(2));
}

/**
 * Evaluates parameter match based on configurable threshold (default 80%).
 */
export function evaluatePropertyParameterMatch(
  val1: string | number | undefined | null,
  val2: string | number | undefined | null,
  type: 'text' | 'numeric' | 'category' | 'exact' = 'text',
  thresholdPercent = 80
): { matchPercentage: number; isMatch: boolean } {
  if (val1 === undefined || val1 === null || val2 === undefined || val2 === null) {
    return { matchPercentage: 0, isMatch: false };
  }

  const str1 = String(val1).trim();
  const str2 = String(val2).trim();
  if (!str1 || !str2 || str1.toUpperCase() === 'N/A' || str2.toUpperCase() === 'N/A' || str1.toUpperCase() === 'LAAGU NAHI') {
    return { matchPercentage: 0, isMatch: false };
  }

  if (type === 'exact') {
    const clean1 = str1.toLowerCase().replace(/[^a-z0-9]/gi, '');
    const clean2 = str2.toLowerCase().replace(/[^a-z0-9]/gi, '');
    const isExact = clean1 !== '' && clean2 !== '' && clean1 === clean2;
    return { matchPercentage: isExact ? 100 : 0, isMatch: isExact };
  }

  if (type === 'numeric') {
    const n1 = typeof val1 === 'number' ? val1 : parseFloat(String(val1).replace(/[^0-9.-]/g, '')) || 0;
    const n2 = typeof val2 === 'number' ? val2 : parseFloat(String(val2).replace(/[^0-9.-]/g, '')) || 0;
    const matchPercentage = calculateNumericSimilarityPercentage(n1, n2);
    return { matchPercentage, isMatch: matchPercentage >= thresholdPercent };
  }

  if (type === 'category') {
    const raw1 = str1.toLowerCase();
    const raw2 = str2.toLowerCase();
    if (raw1 === raw2) return { matchPercentage: 100, isMatch: true };

    const isNonRes = (s: string) =>
      s.includes('अनिवासी') ||
      s.includes('गैरनिवासी') ||
      s.includes('non-res') ||
      s.includes('non res') ||
      s.includes('nonres') ||
      s.includes('non-residential') ||
      s.includes('non residential') ||
      s.includes('nonresidential') ||
      s.includes('commercial') ||
      s.includes('industrial') ||
      s.includes('business') ||
      s.includes('office') ||
      s.includes('shop') ||
      s.includes('गाळा') ||
      s.includes('व्यावसायिक');

    const isNonRes1 = isNonRes(raw1);
    const isNonRes2 = isNonRes(raw2);

    const isRes1 = !isNonRes1 && (raw1.includes('res') || raw1.includes('निवासी') || raw1.includes('घर'));
    const isRes2 = !isNonRes2 && (raw2.includes('res') || raw2.includes('निवासी') || raw2.includes('घर'));

    if ((isRes1 && isRes2) || (isNonRes1 && isNonRes2)) {
      return { matchPercentage: 100, isMatch: true };
    }
    return { matchPercentage: 0, isMatch: false };
  }

  const matchPercentage = calculateStringSimilarityPercentage(str1, str2);
  return { matchPercentage, isMatch: matchPercentage >= thresholdPercent };
}

