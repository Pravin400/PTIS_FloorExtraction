import { calculatePageDimensions } from './report-math';
import type { ReportDefinition, TableStructure, TableCell } from '@/types/report-editor-state.types';

export function createBlankReportDefinition(name = 'New Report', code = 'CUSTOM_REPORT'): ReportDefinition {
  const dims = calculatePageDimensions('A4', 'landscape');
  return {
    reportName: name,
    reportCode: code,
    paperSize: 'A4',
    orientation: 'landscape',
    margins: { top: 6.4, right: 3.2, bottom: 6.4, left: 6.4 },
    widthMm: dims.widthMm,
    heightMm: dims.heightMm,
    pageWidth: dims.pageWidthPx,
    pageHeight: dims.pageHeightPx,
    sections: [
      { id: 'pageheader', name: 'Page Header (पृष्ठ शीर्षक)', height: 80 },
      { id: 'details', name: 'Details (तपशील)', height: 400 },
      { id: 'pagefooter', name: 'Page Footer (तळटीप)', height: 60 },
    ],
    elements: [],
  };
}

export function createDefaultTableStructure(rows: number, cols: number, totalWidth = 400): TableStructure {
  const colWidth = Math.round(totalWidth / cols);
  const columnWidths = Array(cols).fill(colWidth);
  const rowHeights = Array(rows).fill(28);
  const cells: Record<string, TableCell> = {};

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells[`${r}_${c}`] = {
        content: `R${r + 1}C${c + 1}`,
        style: {
          fontSize: 9,
          textAlign: 'left',
          verticalAlign: 'middle',
          borderColor: '#cbd5e1',
          borderWidth: 1,
          padding: 4,
          wrap: true,
        },
      };
    }
  }

  return {
    rows,
    cols,
    cells,
    columnWidths,
    rowHeights,
  };
}

