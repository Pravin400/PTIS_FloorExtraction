const FIELD_ACRONYMS: Record<string, string> = {
  api: 'API',
  id: 'ID',
  ptn: 'PTN',
  qr: 'QR',
  rv: 'RV',
  ulb: 'ULB',
  upic: 'UPIC',
};

export function englishFieldLabel(name: string, label: string): string {
  if (label && !/[\u0900-\u097f]/u.test(label)) return label;

  const fieldName = name.split('.').at(-1) || name;
  return fieldName
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map(
      (word) =>
        FIELD_ACRONYMS[word.toLowerCase()] || `${word[0]?.toUpperCase() || ''}${word.slice(1)}`
    )
    .join(' ');
}

