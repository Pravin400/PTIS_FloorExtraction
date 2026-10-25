export const findUseName = (items: unknown[]): string | null => {
  if (!Array.isArray(items)) return null;
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const val = rec.use || rec.usageDescription || rec.typeOfUseDescription || rec.natureTypeBuilding || rec.subTypeOfUse;
    if (val && String(val).trim() !== '' && String(val) !== '-') {
      return String(val);
    }
  }
  return null;
};

export const formatRupeeShort = (val: number | string | undefined | null, hasSource: boolean): string => {
  if (!hasSource || val === undefined || val === null || val === '') return '-';
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (isNaN(num)) return '-';
  return `₹${num.toLocaleString('en-IN')}`;
};
