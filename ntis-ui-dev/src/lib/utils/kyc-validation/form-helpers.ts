import { translateDevanagariDigits } from '../input-sanitization';

export const parseOptionalNumber = (value: FormDataEntryValue | null): number | null => {
    const normalized = typeof value === "string" ? translateDevanagariDigits(value.trim()) : value;
    if (normalized === null || normalized === "") return null;
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? null : parsed;
};