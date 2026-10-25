import * as XLSX from 'xlsx-js-style';
import { ExportConfig } from '@/types/automation-dashboard/export.type';
import { formatCellValue } from './helpers';

export function exportToExcel<T>(config: ExportConfig<T>): void {
    const { fileName, reportTitle, reportSubtitle, headerRows, columns, data } = config;

    // 1. Prepare data rows layout
    const rows: unknown[][] = [];
    const merges: XLSX.Range[] = [];

    // Add report title if provided
    let titleRowIndex = -1;
    let subtitleRowIndex = -1;

    if (reportTitle) {
        titleRowIndex = rows.length;
        rows.push([reportTitle]);

        if (reportSubtitle) {
            subtitleRowIndex = rows.length;
            rows.push([reportSubtitle]);
        }
        rows.push([]); // Empty row for spacing
    }

    const headerStartRowIndex = rows.length;
    let dataStartRowIndex = headerStartRowIndex;

    // Allocate space for header rows
    if (headerRows && headerRows.length > 0) {
        headerRows.forEach(() => rows.push([]));
        dataStartRowIndex += headerRows.length;
    } else {
        rows.push(columns.map(col => col.header));
        dataStartRowIndex += 1;
    }

    // Add data
    data.forEach((item, index) => {
        const rowData = columns.map(col => formatCellValue(item, col, index));
        rows.push(rowData);
    });

    // 2. Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet['!merges'] = merges;

    // 3. Apply Title and Subtitle Styling
    if (titleRowIndex !== -1) {
        const titleCellAddress = XLSX.utils.encode_cell({ r: titleRowIndex, c: 0 });
        worksheet[titleCellAddress].s = {
            font: { bold: true, sz: 16, color: { rgb: "000000" } },
            alignment: { horizontal: "left", vertical: "center" }
        };
        merges.push({ s: { r: titleRowIndex, c: 0 }, e: { r: titleRowIndex, c: columns.length - 1 } });
    }

    if (subtitleRowIndex !== -1) {
        const subTitleCellAddress = XLSX.utils.encode_cell({ r: subtitleRowIndex, c: 0 });
        worksheet[subTitleCellAddress].s = {
            font: { italic: true, sz: 11, color: { rgb: "4B5563" } }, // Gray-600
            alignment: { horizontal: "left", vertical: "center" }
        };
        merges.push({ s: { r: subtitleRowIndex, c: 0 }, e: { r: subtitleRowIndex, c: columns.length - 1 } });
    }

    // 4. Apply Header Styling
    if (headerRows && headerRows.length > 0) {
        const occupied = new Set<string>();

        headerRows.forEach((row, rowIndex) => {
            let colIndex = 0;
            row.forEach(cell => {
                // Skip occupied columns
                while (occupied.has(`${rowIndex},${colIndex}`)) {
                    colIndex++;
                }

                const r = headerStartRowIndex + rowIndex;
                const c = colIndex;

                const cellAddress = XLSX.utils.encode_cell({ r, c });
                worksheet[cellAddress] = { t: 's', v: cell.title };

                // Style cell
                const bgColor = cell.backgroundColor?.replace('#', '') || "F3F4F6"; // default slate-100
                const txtColor = cell.textColor?.replace('#', '') || "111827"; // default gray-900

                const style = {
                    font: { bold: true, color: { rgb: txtColor } },
                    fill: { fgColor: { rgb: bgColor } },
                    alignment: { horizontal: "center", vertical: "center", wrapText: true },
                    border: {
                        top: { style: 'thin', color: { rgb: "D1D5DB" } },
                        bottom: { style: 'thin', color: { rgb: "D1D5DB" } },
                        left: { style: 'thin', color: { rgb: "D1D5DB" } },
                        right: { style: 'thin', color: { rgb: "D1D5DB" } }
                    }
                };
                worksheet[cellAddress].s = style;

                const rs = cell.rowSpan || 1;
                const cs = cell.colSpan || 1;

                if (rs > 1 || cs > 1) {
                    merges.push({
                        s: { r, c },
                        e: { r: r + rs - 1, c: c + cs - 1 }
                    });
                }

                // Mark occupied and apply style to merged cells so borders render properly
                for (let i = 0; i < rs; i++) {
                    for (let j = 0; j < cs; j++) {
                        occupied.add(`${rowIndex + i},${colIndex + j}`);
                        if (i === 0 && j === 0) continue;

                        const mergedAddress = XLSX.utils.encode_cell({ r: r + i, c: c + j });
                        worksheet[mergedAddress] = { t: 's', v: '' };
                        worksheet[mergedAddress].s = style;
                    }
                }

                colIndex += cs;
            });
        });
    } else {
        // Fallback flat headers
        for (let c = 0; c < columns.length; c++) {
            const cellAddress = XLSX.utils.encode_cell({ r: headerStartRowIndex, c });
            if (!worksheet[cellAddress]) continue;

            worksheet[cellAddress].s = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "4F46E5" } }, // Indigo-600
                alignment: { horizontal: "center", vertical: "center", wrapText: true },
                border: {
                    top: { style: 'thin', color: { rgb: "D1D5DB" } },
                    bottom: { style: 'thin', color: { rgb: "D1D5DB" } },
                    left: { style: 'thin', color: { rgb: "D1D5DB" } },
                    right: { style: 'thin', color: { rgb: "D1D5DB" } }
                }
            };
        }
    }

    // 5. Style data cells
    for (let r = dataStartRowIndex; r < rows.length; r++) {
        for (let c = 0; c < columns.length; c++) {
            const cellAddress = XLSX.utils.encode_cell({ r, c });
            if (!worksheet[cellAddress]) continue;

            worksheet[cellAddress].s = {
                alignment: { vertical: "center", horizontal: "center", wrapText: true },
                border: {
                    top: { style: 'thin', color: { rgb: "E5E7EB" } },
                    bottom: { style: 'thin', color: { rgb: "E5E7EB" } },
                    left: { style: 'thin', color: { rgb: "E5E7EB" } },
                    right: { style: 'thin', color: { rgb: "E5E7EB" } }
                }
            };
        }
    }

    // 6. Set column widths
    const colWidths = columns.map(col => {
        if (col.width) {
            return { wpx: col.width };
        }
        return { wch: Math.max(col.header.length, 15) };
    });
    worksheet['!cols'] = colWidths;

    // 7. Create workbook and save
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Add timestamp to filename
    const dateStr = new Date().toISOString().split('T')[0];
    const finalFileName = `${fileName}_${dateStr}.xlsx`;

    XLSX.writeFile(workbook, finalFileName);
}
