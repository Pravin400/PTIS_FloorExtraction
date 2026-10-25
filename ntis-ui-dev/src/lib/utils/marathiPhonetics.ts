/**
 * Devanagari to Latin Phonetic Mapping for Marathi search
 */
export const MARATHI_PHONETIC_MAP: Record<string, string> = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'n',
  'च': 'ch', 'छ': 'ch', 'ज': 'j', 'झ': 'z', 'ञ': 'n',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'f', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh',
  'ष': 'sh', 'स': 's', 'ह': 'h', 'ळ': 'l', 'क्ष': 'ksh', 'ज्ञ': 'dny',
  'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', 'ः': 'h',
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
  'ऋ': 'ru', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
};

/** Normalize string for Devanagari matching (removes matras, punctuation, hyphens, dots) */
export function normalizeMarathiText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[\.\,\-\_\s\/\(\)]/g, '')
    .replace(/[ािीुूेैोौंःॅॉ्]/g, '');
}

/** Convert Marathi Devanagari text to Latin phonetic string */
export function marathiToLatin(str: string): string {
  if (!str) return '';
  let result = '';
  for (const char of str) {
    result += MARATHI_PHONETIC_MAP[char] || char.toLowerCase();
  }
  return result.replace(/[\.\,\-\_\s\/\(\)]/g, '');
}

/** Create a fuzzy phonetic key for forgiving English search */
export function toFuzzyPhoneticKey(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[\.\,\-\_\s\/\(\)]/g, '')
    .replace(/w/g, 'v')
    .replace(/ee/g, 'i')
    .replace(/ea/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/aa/g, 'a')
    .replace(/sh/g, 's')
    .replace(/ch/g, 'c')
    .replace(/z/g, 'j')
    .replace(/kh/g, 'k')
    .replace(/gh/g, 'g')
    .replace(/th/g, 't')
    .replace(/dh/g, 'd')
    .replace(/bh/g, 'b')
    .replace(/ph/g, 'f');
}

/** Score match relevance for letter-wise sorting (higher score = better match) */
export function getMarathiMatchScore(label: string, query: string): number {
  if (!query || !query.trim()) return 1;
  const cleanQuery = query.toLowerCase().trim();
  const cleanQueryNoSpaces = cleanQuery.replace(/[\.\,\-\_\s\/\(\)]/g, '');
  const cleanLabel = label.toLowerCase();
  const cleanLabelNoSpaces = cleanLabel.replace(/[\.\,\-\_\s\/\(\)]/g, '');
  const normLabel = normalizeMarathiText(label);
  const normQuery = normalizeMarathiText(query);
  const latinLabel = marathiToLatin(label);
  const fuzzyLabel = toFuzzyPhoneticKey(latinLabel);
  const fuzzyQuery = toFuzzyPhoneticKey(cleanQuery);

  // 1. Exact match
  if (
    cleanLabel === cleanQuery ||
    cleanLabelNoSpaces === cleanQueryNoSpaces ||
    latinLabel === cleanQueryNoSpaces ||
    fuzzyLabel === fuzzyQuery
  ) {
    return 100;
  }

  // 2. Starts-with match
  if (
    cleanLabel.startsWith(cleanQuery) ||
    cleanLabelNoSpaces.startsWith(cleanQueryNoSpaces) ||
    normLabel.startsWith(normQuery) ||
    latinLabel.startsWith(cleanQueryNoSpaces) ||
    fuzzyLabel.startsWith(fuzzyQuery)
  ) {
    return 80;
  }

  // 3. Word-boundary starts-with match
  const words = cleanLabel.split(/\s+/);
  if (
    words.some(
      (w) =>
        w.startsWith(cleanQuery) ||
        marathiToLatin(w).startsWith(cleanQueryNoSpaces) ||
        toFuzzyPhoneticKey(marathiToLatin(w)).startsWith(fuzzyQuery)
    )
  ) {
    return 60;
  }

  // 4. Substring match
  if (
    cleanLabel.includes(cleanQuery) ||
    cleanLabelNoSpaces.includes(cleanQueryNoSpaces) ||
    normLabel.includes(normQuery) ||
    latinLabel.includes(cleanQueryNoSpaces) ||
    fuzzyLabel.includes(fuzzyQuery)
  ) {
    return 40;
  }

  return 0;
}

/** Check if label matches search query in Marathi or English phonetics */
export function matchesMarathiQuery(label: string, query: string): boolean {
  return getMarathiMatchScore(label, query) > 0;
}
