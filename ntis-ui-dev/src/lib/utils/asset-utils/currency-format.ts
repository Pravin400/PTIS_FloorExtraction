 
export function formatIndianCurrencyAbbreviated(
  value: number | string | null | undefined,
  t?: (key: string, options?: Record<string, unknown>) => string
): string {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const getTranslation = (key: string, options?: Record<string, unknown>, fallback?: string): string => {
    if (!t) return fallback || '';
    try {
      const result = t(key, options);
      if (result === key && fallback) {
        return fallback;
      }
      return result;
    } catch {
      return fallback || '';
    }
  };

  let formatted = '';
  if (absNum >= 10000000) {
    const val = (absNum / 10000000).toFixed(2).replace(/\.00$/, '');
    formatted = getTranslation('currency.crore', { val }, `${val} Cr`);
  } else if (absNum >= 100000) {
    const val = (absNum / 100000).toFixed(2).replace(/\.00$/, '');
    formatted = getTranslation('currency.lakh', { val }, `${val} Lakh`);
  } else {
    formatted = absNum.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }

  const symbol = getTranslation('currency.symbol', undefined, '₹ ');
  return `${symbol}${isNegative ? '-' : ''}${formatted}`;
}
