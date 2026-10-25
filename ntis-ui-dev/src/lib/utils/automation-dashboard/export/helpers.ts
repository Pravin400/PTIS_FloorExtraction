import { ExportColumn } from '@/types/automation-dashboard/export.type';

/**
 * Safely extracts a value from a nested object using a dot-notation path.
 */
export function getNestedValue(obj: Record<string, unknown> | unknown, path: string): unknown {
    if (!obj || typeof obj !== 'object' || !path) return undefined;
    return path.split('.').reduce((acc: unknown, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined), obj);
}

/**
 * Gets the cell value for a specific row and column configuration.
 * Applies custom formatting if provided in the column definition.
 */
export function formatCellValue<T>(row: T, column: ExportColumn<T>, index: number): string | number {
    const rawValue = getNestedValue(row, column.key);

    // Apply custom format function if provided
    if (column.format) {
        const formatted = column.format(rawValue, row, index);
        if (formatted === null || formatted === undefined) return '';
        if (typeof formatted === 'object') return String(formatted);
        return formatted;
    }

    // Handle null/undefined gracefully
    if (rawValue === null || rawValue === undefined) {
        return '';
    }

    // Fallback for dates/objects
    if (typeof rawValue === 'object') {
        if (rawValue instanceof Date) {
            return rawValue.toLocaleDateString();
        }
        try {
            return JSON.stringify(rawValue);
        } catch {
            return String(rawValue);
        }
    }
    if (typeof rawValue === 'string' || typeof rawValue === 'number') {
        return rawValue;
    }

    return String(rawValue || '');
}
