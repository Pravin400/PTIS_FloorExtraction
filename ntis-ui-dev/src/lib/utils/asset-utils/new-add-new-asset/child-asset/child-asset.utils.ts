/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';

// Helper to format dates for API compatibility (yyyy-MM-ddTHH:mm:ss)
export const toApiDateString = (val: any): string | null => {
  if (!val) return null;
  const str = String(val).trim();
  if (!str) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return `${str}T00:00:00`;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(str)) {
    return str;
  }
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toISOString().replace(/\.\d{3}Z$/, '');
    }
  } catch {}
  return null;
};

export const calcDurationMonths = (s: string, e: string): number => {
  const start = new Date(s);
  const end = new Date(e);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;
  let m = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) m -= 1;
  return Math.max(0, m);
};

/**
 * Recursively appends a nested object/array/File tree onto a FormData instance using
 * dot/bracket notation (e.g. `rentInformation.leaseStart`, `roomDetails[0].offsets[1].shape`).
 * Extracted from createChildAssetAction's original inline `buildFormData` closure — behavior
 * preserved exactly, just threaded the FormData target through as a parameter instead of closure.
 */
export function appendFormDataRecursive(target: FormData, obj: any, parentKey?: string): void {
  if (obj === null || obj === undefined) return;

  if (obj instanceof File) {
    if (parentKey) target.append(parentKey, obj, obj.name || 'file');
  } else if (Array.isArray(obj)) {
    obj.forEach((val, index) => {
      if (val instanceof File) {
        target.append(parentKey || '', val, val.name || 'file');
      } else {
        appendFormDataRecursive(target, val, `${parentKey}[${index}]`);
      }
    });
  } else if (typeof obj === 'object') {
    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      const formKey = parentKey ? `${parentKey}.${key}` : key;
      appendFormDataRecursive(target, value, formKey);
    });
  } else {
    if (parentKey) target.append(parentKey, String(obj));
  }
}
