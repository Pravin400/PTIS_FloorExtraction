/**
 * Shared Payroll utilities
 * Centralizes soft deletion detection, active status parsing, and common helpers.
 */

export function isRecordMarkedForDeletion(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const item = raw as Record<string, unknown>;

  // Check explicit boolean or numeric flags
  if (item.markedForDeletion === true || item.markedForDeletion === 1 || item.markedForDeletion === '1') {
    return true;
  }
  if (item.MarkedForDeletion === true || item.MarkedForDeletion === 1 || item.MarkedForDeletion === '1') {
    return true;
  }
  if (item.isDeleted === true || item.isDeleted === 1 || item.isDeleted === '1') {
    return true;
  }
  if (item.IsDeleted === true || item.IsDeleted === 1 || item.IsDeleted === '1') {
    return true;
  }

  const keys = [
    'markedForDeletion',
    'MarkedForDeletion',
    'markfordeletion',
    'isMarkedForDeletion',
    'IsMarkedForDeletion',
    'isDeleted',
    'IsDeleted',
  ];
  for (const k of keys) {
    const val = item[k];
    if (val === true || val === 1 || val === '1') return true;
    if (typeof val === 'string' && val.toLowerCase() === 'true') return true;
  }

  return false;
}

export function parseIsActive(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return true;
  const item = raw as Record<string, unknown>;
  const keys = ['isActive', 'IsActive', 'isactive', 'status', 'Status'];
  for (const k of keys) {
    const val = item[k];
    if (val !== undefined && val !== null) {
      if (val === false || val === 0 || val === '0') return false;
      if (typeof val === 'string' && (val.toLowerCase() === 'false' || val.toLowerCase() === 'inactive')) return false;
      if (val === true || val === 1 || val === '1') return true;
      if (typeof val === 'string' && (val.toLowerCase() === 'true' || val.toLowerCase() === 'active')) return true;
    }
  }
  return true;
}
