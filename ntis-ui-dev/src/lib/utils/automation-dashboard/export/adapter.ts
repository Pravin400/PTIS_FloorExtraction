import React from 'react';
import { Column, HeaderCell } from '@/components/common/AutomationTable';
import { ExportColumn, ExportHeaderCell } from '@/types/automation-dashboard/export.type';

// Map Tailwind background colors used in headers to hex for Excel/PDF
const tailwindColorMap: Record<string, string> = {
    'bg-green-50': '#F0FDF4',
    'bg-blue-50': '#EFF6FF',
    'bg-blue-50/50': '#EFF6FF',
    'bg-purple-50': '#FAF5FF',
    'bg-orange-50': '#FFF7ED',
    'bg-emerald-50': '#ECFDF5',
    'bg-red-50': '#FEF2F2',
    'bg-yellow-50': '#FEFCE8',
    'bg-indigo-50': '#EEF2FF',
    'bg-indigo-100': '#E0E7FF',
    'bg-purple-100': '#F3E8FF',
    'bg-purple-100/80': '#F3E8FF',
    'bg-emerald-100': '#D1FAE5',
    'bg-emerald-100/80': '#D1FAE5',
    'bg-orange-100': '#FFEDD5',
    'bg-orange-100/80': '#FFEDD5',
    'bg-white': '#FFFFFF',
};

function getBgColorFromClassName(className?: string): string | undefined {
    if (!className) return undefined;
    for (const key of Object.keys(tailwindColorMap)) {
        if (className.includes(key)) {
            return tailwindColorMap[key];
        }
    }
    return undefined;
}

/**
 * Extracts plain text from a React Node recursively.
 * Handles nested elements like <div>, <span>, <br> (converted to newline)
 */
export function extractTextFromNode(node: React.ReactNode): string {
    if (node === null || node === undefined || typeof node === 'boolean') {
        return '';
    }
    if (typeof node === 'string' || typeof node === 'number') {
        return String(node);
    }
    if (Array.isArray(node)) {
        return node.map(extractTextFromNode).filter(Boolean).join(' ');
    }
    if (React.isValidElement(node)) {
        const nodeType = node.type;
        // Filter out Lucide SVG icon components and SortIconComponent
        if (
            nodeType === 'svg' ||
            (typeof nodeType === 'function' && (nodeType.name === 'SortIconComponent' || nodeType.name?.includes('Icon'))) ||
            (typeof nodeType === 'object' && (nodeType as Record<string, unknown>)?.displayName?.toString().includes('Icon'))
        ) {
            return '';
        }
        if (nodeType === 'br') return '\n';
        const props = node.props as { children?: React.ReactNode };
        if (props && props.children !== undefined) {
            return extractTextFromNode(props.children);
        }
    }
    return '';
}

/**
 * Adapts AutomationTable configuration (columns & headerRows) into the common ExportConfig format.
 */
export function adaptTableConfigToExport<T extends Record<string, unknown>>(
    columns: Column<T>[],
    headerRows?: HeaderCell[][]
): { exportColumns: ExportColumn<T>[]; exportHeaderRows?: ExportHeaderCell[][] } {

    // Convert multi-level headers if provided
    let exportHeaderRows: ExportHeaderCell[][] | undefined = undefined;
    if (headerRows && headerRows.length > 0) {
        exportHeaderRows = headerRows.map(row =>
            row.map(cell => ({
                title: extractTextFromNode(cell.label).trim(),
                colSpan: cell.colSpan,
                rowSpan: cell.rowSpan,
                backgroundColor: getBgColorFromClassName(cell.headerClassName)
            }))
        );
    }

    // Build flat column headers list from headerRows if available for empty col.label fallback
    const flatHeaderTitlesFromRows: string[] = [];
    if (exportHeaderRows && exportHeaderRows.length > 0) {
        const lastRowIndex = exportHeaderRows.length - 1;
        // If bottom row matches columns count, use its titles directly
        if (exportHeaderRows[lastRowIndex].length === columns.length) {
            exportHeaderRows[lastRowIndex].forEach(cell => flatHeaderTitlesFromRows.push(cell.title));
        } else {
            // Expand grid columns
            const spanGrid: (string | null)[][] = exportHeaderRows.map(() => new Array(columns.length).fill(null));
            exportHeaderRows.forEach((row, rIdx) => {
                let cTracker = 0;
                let cellIdx = 0;
                while (cTracker < columns.length) {
                    if (spanGrid[rIdx][cTracker] !== null) {
                        cTracker++;
                    } else if (cellIdx < row.length) {
                        const cell = row[cellIdx++];
                        const cSpan = cell.colSpan || 1;
                        const rSpan = cell.rowSpan || 1;
                        for (let r = 0; r < rSpan; r++) {
                            if (rIdx + r < spanGrid.length) {
                                for (let c = 0; c < cSpan; c++) {
                                    if (cTracker + c < columns.length) {
                                        spanGrid[rIdx + r][cTracker + c] = cell.title;
                                    }
                                }
                            }
                        }
                        cTracker += cSpan;
                    } else {
                        cTracker++;
                    }
                }
            });
            for (let c = 0; c < columns.length; c++) {
                // Get the lowest non-empty header title for column c
                let title = '';
                for (let r = exportHeaderRows.length - 1; r >= 0; r--) {
                    if (spanGrid[r][c]) {
                        title = spanGrid[r][c]!;
                        break;
                    }
                }
                flatHeaderTitlesFromRows.push(title);
            }
        }
    }

    // Convert table columns to export columns
    const exportColumns: ExportColumn<T>[] = columns.map((col, index) => {
        const extractedHeader = extractTextFromNode(col.label).trim();
        const header = extractedHeader || (flatHeaderTitlesFromRows[index] || String(col.key));
        return {
            header,
            key: String(col.key),
            width: col.width ? parseInt(col.width.replace(/\D/g, ''), 10) || 100 : undefined,
            format: col.render
                ? (val: unknown, row: T, index: number) => extractTextFromNode(col.render!(val as T[keyof T] | undefined, row, index)).trim()
                : undefined
        };
    });

    return { exportColumns, exportHeaderRows };
}

