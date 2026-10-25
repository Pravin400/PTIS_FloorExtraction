import { pdf, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { ExportConfig, ExportHeaderCell } from '@/types/automation-dashboard/export.type';
import { formatCellValue } from './helpers';

const getFontPath = (fileName: string): string => `/fonts/${fileName}`;

// Register local Noto Sans Devanagari font for supporting Hindi/Marathi (Devanagari) characters in PDF
Font.register({
    family: 'NotoSansDevanagari',
    fonts: [
        {
            src: getFontPath('NotoSansDevanagari-Regular.ttf'),
            fontWeight: 'normal',
        },
        {
            src: getFontPath('NotoSansDevanagari-Bold.ttf'),
            fontWeight: 'bold',
        },
    ],
});

// Define styles for the PDF
const styles = StyleSheet.create({
    page: {
        padding: 20,
        fontFamily: 'NotoSansDevanagari',
        fontSize: 7,
    },
    header: {
        marginBottom: 15,
        textAlign: 'center',
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
        fontFamily: 'NotoSansDevanagari',
    },
    subtitle: {
        fontSize: 9,
        color: '#4B5563',
        fontFamily: 'NotoSansDevanagari',
    },
    table: {
        width: '100%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#94A3B8',
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    tableRow: {
        flexDirection: 'row',
        minHeight: 18,
    },
    totalRow: {
        backgroundColor: '#F3E8FF',
        fontWeight: 'bold',
    },
    tableCellHeader: {
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#94A3B8',
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 3,
        textAlign: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontFamily: 'NotoSansDevanagari',
        fontSize: 7,
    },
    tableCell: {
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 3,
        textAlign: 'center',
        justifyContent: 'center',
        fontFamily: 'NotoSansDevanagari',
        fontSize: 7,
    },
});

type ProcessedHeaderCell = ExportHeaderCell & {
    calculatedWidthPct: number;
    cSpan: number;
    isPlaceholder: boolean;
};

const TableDocument = <T,>({ config }: { config: ExportConfig<T> }) => {
    const { reportTitle, reportSubtitle, headerRows, columns, data, pdfOrientation = 'landscape' } = config;

    // Calculate total width to determine percentages
    const totalWidth = columns.reduce((acc, col) => acc + (col.width || 100), 0);

    // Process header rows to calculate exact widths and handle rowSpans with placeholders
    const processedHeaderRows: ProcessedHeaderCell[][] = [];
    if (headerRows && headerRows.length > 0) {
        const spanGrid: (ProcessedHeaderCell | null)[][] = headerRows.map(() => new Array(columns.length).fill(null));

        headerRows.forEach((row, rowIndex) => {
            const newRow: ProcessedHeaderCell[] = [];
            let colTracker = 0;
            let cellIndex = 0;

            while (colTracker < columns.length) {
                // If this slot is occupied by a rowSpan from a previous row
                if (spanGrid[rowIndex][colTracker] !== null) {
                    const spanningCell = spanGrid[rowIndex][colTracker] as ProcessedHeaderCell;
                    newRow.push({
                        ...spanningCell,
                        title: '', // Empty text for placeholder
                        isPlaceholder: true
                    });
                    colTracker += spanningCell.cSpan;
                } else if (cellIndex < row.length) {
                    // Empty slot, take the next cell from the current row
                    const cell = row[cellIndex];
                    cellIndex++;

                    const cSpan = cell.colSpan || 1;
                    const rSpan = cell.rowSpan || 1;

                    // Calculate exact width based on the underlying data columns
                    let sumWidth = 0;
                    for (let c = 0; c < cSpan; c++) {
                        if (colTracker + c < columns.length) {
                            sumWidth += (columns[colTracker + c].width || 100);
                        }
                    }
                    const widthPct = (sumWidth / totalWidth) * 100;

                    const cellData: ProcessedHeaderCell = {
                        ...cell,
                        calculatedWidthPct: widthPct,
                        cSpan,
                        isPlaceholder: false
                    };

                    newRow.push(cellData);

                    // Mark the grid as occupied for this cell's area
                    for (let r = 0; r < rSpan; r++) {
                        if (rowIndex + r < spanGrid.length) {
                            for (let c = 0; c < cSpan; c++) {
                                if (colTracker + c < columns.length) {
                                    spanGrid[rowIndex + r][colTracker + c] = cellData;
                                }
                            }
                        }
                    }
                    colTracker += cSpan;
                } else {
                    // Fallback to prevent infinite loop if config is malformed
                    colTracker++;
                }
            }
            processedHeaderRows.push(newRow);
        });
    }

    return (
        <Document>
            <Page size="A4" orientation={pdfOrientation} style={styles.page}>
                <View style={styles.header}>
                    {reportTitle ? <Text style={styles.title}>{String(reportTitle)}</Text> : null}
                    {reportSubtitle ? <Text style={styles.subtitle}>{String(reportSubtitle)}</Text> : null}
                </View>

                <View style={styles.table}>
                    {/* Render complex headers if provided */}
                    {processedHeaderRows && processedHeaderRows.length > 0 ? (
                        processedHeaderRows.map((row, rowIndex) => (
                            <View key={rowIndex} style={styles.tableRow}>
                                {row.map((cell, cellIndex) => (
                                    <View
                                        key={cellIndex}
                                        style={[
                                            styles.tableCellHeader,
                                            {
                                                width: `${cell.calculatedWidthPct}%`,
                                                backgroundColor: cell.backgroundColor || '#F8FAFC',
                                                ...(cell.isPlaceholder ? { borderTopWidth: 0, borderBottomWidth: 0 } : {})
                                            }
                                        ]}
                                    >
                                        <Text style={{ color: cell.textColor || '#0F172A' }}>
                                            {cell.isPlaceholder ? '' : String(cell.title || '')}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        ))
                    ) : (
                        <View style={styles.tableRow}>
                            {columns.map((col, colIndex) => {
                                const widthPct = ((col.width || 100) / totalWidth) * 100;
                                return (
                                    <View
                                        key={colIndex}
                                        style={[
                                            styles.tableCellHeader,
                                            { width: `${widthPct}%`, backgroundColor: '#4F46E5' }
                                        ]}
                                    >
                                        <Text style={{ color: '#FFFFFF' }}>{String(col.header || '')}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* Render Data Rows */}
                    {data.map((item, rowIndex) => {
                        const isTotalRow = (item as Record<string, unknown>)?.isTotal === true;
                        return (
                            <View
                                key={rowIndex}
                                style={[
                                    styles.tableRow,
                                    isTotalRow
                                        ? styles.totalRow
                                        : rowIndex % 2 !== 0
                                            ? { backgroundColor: '#F8FAFC' }
                                            : {}
                                ]}
                            >
                                {columns.map((col, colIndex) => {
                                    const widthPct = ((col.width || 100) / totalWidth) * 100;
                                    const val = formatCellValue(item, col, rowIndex);
                                    const textVal = val === null || val === undefined ? '' : String(val);
                                    return (
                                        <View key={colIndex} style={[styles.tableCell, { width: `${widthPct}%` }]}>
                                            <Text style={isTotalRow ? { fontWeight: 'bold' } : {}}>{textVal}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        );
                    })}
                </View>
            </Page>
        </Document>
    );
};

export async function exportToPdf<T>(config: ExportConfig<T>): Promise<void> {
    try {
        const blob = await pdf(<TableDocument config={config} />).toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const dateStr = new Date().toISOString().split('T')[0];
        a.download = `${config.fileName}_${dateStr}.pdf`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error: unknown) {
        console.error("Error generating PDF with react-pdf:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast.error(`There was an error generating the PDF: ${errorMessage}`);
    }
}

