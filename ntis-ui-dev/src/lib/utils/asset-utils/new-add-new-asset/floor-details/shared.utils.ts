/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';

export const isRedirectError = (err: any): boolean =>
  !!(
    err &&
    typeof err === 'object' &&
    'digest' in err &&
    typeof err.digest === 'string' &&
    err.digest.startsWith('NEXT_REDIRECT')
  );

export const getArray = (d: unknown): any[] => {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  const obj = d as Record<string, unknown>;
  const itemsObj = obj.items as Record<string, unknown> | undefined;
  const arr = itemsObj?.floorDetails || obj.items || obj.floorDetails || obj.data;
  return Array.isArray(arr) ? arr : [];
};
