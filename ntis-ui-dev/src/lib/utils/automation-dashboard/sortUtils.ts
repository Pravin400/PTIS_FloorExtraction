'use client';
import { useState, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export type SortConfig<T> = {
    key: keyof T;
    direction: 'asc' | 'desc';
};

/**
 * Common sorting function to sort an array of objects based on a SortConfig.
 * Handles string and number comparisons gracefully, putting null/undefined values correctly.
 */
export function applyTableSort<T>(data: T[], sortConfig: SortConfig<T> | null): T[] {
    if (!sortConfig) return data;

    return data.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        // Handle undefined/null cases without 'any' type
        const aFinal = (aVal ?? '') as string | number;
        const bFinal = (bVal ?? '') as string | number;

        if (aFinal < bFinal) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aFinal > bFinal) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });
}

export function useTableSort<T>() {
    const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(null);

    const handleSort = useCallback((key: keyof T) => {
        setSortConfig((current) => {
            if (!current || current.key !== key) {
                return { key, direction: 'asc' };
            }
            if (current.direction === 'asc') {
                return { key, direction: 'desc' };
            }
            return null;
        });
    }, []);

    return { sortConfig, handleSort, setSortConfig };
}
