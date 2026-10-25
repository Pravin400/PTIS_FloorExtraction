import { useEffect, useRef } from 'react';
import * as XLSX from 'xlsx-js-style';
import { toast } from 'sonner';

interface UseAutoExportToExcelProps<T> {
    data: T[] | null | undefined;
    fileName: string | null | undefined;
    sheetName?: string;
    onComplete?: () => void;
    emptyMessage?: string;
    successMessage?: string;
    errorMessage?: string;
}

export function useAutoExportToExcel<T extends Record<string, unknown>>({
    data,
    fileName,
    sheetName = 'Sheet1',
    onComplete,
    emptyMessage = 'No records found to export.',
    successMessage = 'Successfully exported data.',
    errorMessage = 'An unexpected error occurred during export.',
}: UseAutoExportToExcelProps<T>) {
    const callbacksRef = useRef({ onComplete, emptyMessage, successMessage, errorMessage, sheetName });

    // Keep refs updated
    useEffect(() => {
        callbacksRef.current = { onComplete, emptyMessage, successMessage, errorMessage, sheetName };
    }, [onComplete, emptyMessage, successMessage, errorMessage, sheetName]);

    useEffect(() => {
        if (data && fileName && Array.isArray(data)) {
            const { onComplete, emptyMessage, successMessage, errorMessage, sheetName } = callbacksRef.current;
            try {
                if (data.length === 0) {
                    toast.info(emptyMessage);
                } else {
                    const worksheet = XLSX.utils.json_to_sheet(data);
                    
                    const headerStyle = {
                        font: { bold: true, color: { rgb: "FFFFFF" } },
                        fill: { fgColor: { rgb: "1D4ED8" } },
                        alignment: { horizontal: "center", vertical: "center" }
                    };

                    const range = XLSX.utils.decode_range(worksheet['!ref'] || "A1:A1");
                    for (let C = range.s.c; C <= range.e.c; ++C) {
                        const address = XLSX.utils.encode_col(C) + "1";
                        if (!worksheet[address]) continue;
                        worksheet[address].s = headerStyle;
                    }

                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
                    
                    const finalFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
                    XLSX.writeFile(workbook, finalFileName);

                    toast.success(successMessage);
                }
            } catch (error) {
                console.error('Export error:', error);
                toast.error(errorMessage);
            } finally {
                if (onComplete) {
                    onComplete();
                }
            }
        }
    }, [data, fileName]);
}
