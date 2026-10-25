export interface ExportColumn<T = unknown> {
    /** The column header title displayed in the export (used if headerRows is not provided) */
    header: string;
    /** The data key, can be a direct property or a nested path (e.g. 'division.name') */
    key: string;
    /** Optional column width (useful for Excel sizing) */
    width?: number;
    /** Optional custom formatting function to transform the cell value before exporting */
    format?: (value: unknown, row: T, index: number) => string | number;
}

export interface ExportHeaderCell {
    /** The title text for the header cell */
    title: string;
    /** Number of columns this cell should span (default: 1) */
    colSpan?: number;
    /** Number of rows this cell should span (default: 1) */
    rowSpan?: number;
    /** Hex color for the background (e.g., "#F0FDF4") */
    backgroundColor?: string;
    /** Hex color for the text (e.g., "#000000"). Defaults to white for main headers, black for colored backgrounds if not specified. */
    textColor?: string;
}

export interface ExportConfig<T = unknown> {
    /** The base name of the downloaded file (without extension) */
    fileName: string;
    /** Optional report title to be displayed inside the document (especially for PDF) */
    reportTitle?: string;
    /** Optional subtitle to be displayed below the report title */
    reportSubtitle?: string;
    /** Optional multi-level complex header rows */
    headerRows?: ExportHeaderCell[][];
    /** The array of column definitions (maps the data to the columns) */
    columns: ExportColumn<T>[];
    /** The array of data rows to export */
    data: T[];
    /** PDF specific orientation, defaults to 'landscape' */
    pdfOrientation?: 'portrait' | 'landscape';
}
