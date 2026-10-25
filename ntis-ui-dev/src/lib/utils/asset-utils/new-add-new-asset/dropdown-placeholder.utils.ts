 
export interface DropdownOption {
  label: string;
  value: string;
}

/**
 * Ensures that '--Select--' is the first option in the options collection.
 * Cleans up any existing empty-string or duplicate placeholder entries.
 *
 * @param options - Array of options (objects with label/value or plain strings)
 * @param placeholderLabel - The placeholder label, defaults to '--Select--'
 * @returns Normalized array of options with { label: '--Select--', value: '' } at index 0
 */
export function withSelectPlaceholder(
  options: Array<{ label?: string | number; value?: string | number } | string> | undefined | null,
  placeholderLabel: string = '--Select--'
): DropdownOption[] {
  if (!options || !Array.isArray(options) || options.length === 0) {
    return [{ label: placeholderLabel, value: '' }];
  }

  const normalized: DropdownOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { label: opt, value: opt };
    }
    const val = opt.value !== undefined && opt.value !== null ? String(opt.value) : '';
    const lbl = opt.label !== undefined && opt.label !== null ? String(opt.label) : val;
    return { label: lbl, value: val };
  });

  // Filter out any entries that have empty value or are already a select placeholder
  const withoutPlaceholders = normalized.filter((opt) => {
    if (opt.value === '') return false;
    const lower = opt.label.trim().toLowerCase();
    return lower !== '--select--' && lower !== 'select' && lower !== '-- select --';
  });

  return [{ label: placeholderLabel, value: '' }, ...withoutPlaceholders];
}
