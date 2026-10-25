import { exportToExcel } from './excelExport';
import { Column } from '@/components/common/AutomationTable';
import { ExportColumn } from '@/types/automation-dashboard/export.type';

export interface ExportTableDataOptions<T> {
  fileName: string;
  reportTitle: string;
  reportSubtitle?: string;
  columns: Column<Record<string, unknown>>[];
  data: T[];
}

/**
 * Automatically converts table column definitions into ExportColumn format (excluding 'action' columns)
 * and exports the data to Excel.
 */
export function exportTableData<T extends Record<string, unknown>>(
  options: ExportTableDataOptions<T>
): void {
  const { fileName, reportTitle, reportSubtitle, columns, data } = options;
  if (!data || data.length === 0) return;

  const exportColumns: ExportColumn<T>[] = columns
    .filter((col) => col.key !== 'action')
    .map((col) => {
      const header = typeof col.label === 'string' ? col.label : String(col.key);
      const key = col.key as keyof T & string;

      return {
        header,
        key,
        format: (val: unknown, row: T) => {
          if (key === 'zoneName' || key === 'zoneNo') {
            const zNo = row.zoneNo;
            const zName = row.zoneName;
            if (zNo && zName) return `${zNo} - ${zName}`;
            return String(zNo || zName || val || '');
          }
          if (key === 'photoMissing') {
            return Number(row.photoMissing ?? (row as unknown as { missingPhotoCount?: number }).missingPhotoCount ?? val ?? 0);
          }
          if (key === 'planMissing') {
            return Number(row.planMissing ?? (row as unknown as { missingPlanCount?: number }).missingPlanCount ?? val ?? 0);
          }
          if (key === 'totalMissing') {
            if (row.totalMissing != null) return Number(row.totalMissing);
            const p = Number(row.photoMissing ?? (row as unknown as { missingPhotoCount?: number }).missingPhotoCount ?? 0);
            const pl = Number(row.planMissing ?? (row as unknown as { missingPlanCount?: number }).missingPlanCount ?? 0);
            return p + pl;
          }
          if (val == null) return '';
          if (typeof val === 'number' || typeof val === 'string') return val;
          return String(val);
        },
      };
    });

  exportToExcel<T>({
    fileName,
    reportTitle,
    reportSubtitle,
    columns: exportColumns,
    data,
  });
}
