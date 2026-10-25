import type { IZoneDescription, RateCategory } from "@/types/RVRateMaster";
import * as XLSX from 'xlsx';

type MatrixRow = {
  id: number;
  zone?: string;
  zoneNo?: string;
  taxZoneId?: number;
  [key: string]: number | string | null | undefined;
};

interface ParsedImportData {
  zoneEdits: Record<string, Record<string, number>>;
  importedRateCount: number;
}

/**
 * Parse CSV or Excel content and validate structure
 */
export function parseExcelOrCsvContent(
  fileData: string | ArrayBuffer,
  fileExt: string,
  allZones: IZoneDescription[],
  rateCategories: RateCategory[],
  rateUnit: "SqMeter" | "SqFeet",
  t: ReturnType<typeof import("next-intl").useTranslations>
): ParsedImportData {
  let data: (string | number | boolean | null | undefined)[][] = [];

  try {
    if (fileExt === 'csv') {
      const text = typeof fileData === 'string' 
        ? fileData 
        : new TextDecoder().decode(new Uint8Array(fileData as ArrayBuffer));
      
      const cleanText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
      data = cleanText.split("\n").filter(Boolean).map(line => 
        line.split(",").map(cell => cell.trim())
      );
    } else {
      const workbook = XLSX.read(fileData as ArrayBuffer, { type: 'array' });
      data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
    }
  } catch (_error) {
    throw new Error(t('messages.validationParseFailed'));
  }

  if (!data || data.length < 1) {
    throw new Error(t('messages.validationFileEmpty'));
  }

  // 1. Validate Columns / Headers
  const unitText = rateUnit === "SqFeet" ? "Rs./Sq.ft" : "Rs./Sq.mtr";
  const expectedHeaders = [
    'Tax Zone No', 
    ...rateCategories.map(cat => `${cat.constructionCode || cat.constructionId} (${unitText})`)
  ].map(h => h.trim().toLowerCase());

  const uploadedHeaders = data[0].map(h => (h?.toString() ?? '').trim().toLowerCase());

  const isHeaderValid = expectedHeaders.length === uploadedHeaders.length &&
    expectedHeaders.every((h, i) => h === uploadedHeaders[i]);

  if (!isHeaderValid) {
    throw new Error(t('messages.validationCorrectTemplate'));
  }

  // Filter out empty rows (where all cells are empty) from the data rows
  const dataRows = data.slice(1).filter(row => 
    row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
  );

  // 2. Validate Rows (Zones on the left side)
  if (dataRows.length !== allZones.length) {
    throw new Error(t('messages.validationCorrectTemplate'));
  }

  for (let i = 0; i < allZones.length; i++) {
    const uploadedZoneNo = (dataRows[i][0]?.toString() ?? '').trim().toLowerCase();
    const expectedZoneNo = String(allZones[i].zoneNo).trim().toLowerCase();
    if (uploadedZoneNo !== expectedZoneNo) {
      throw new Error(t('messages.validationCorrectTemplate'));
    }
  }

  // 3. Parse Rates
  const excelDataByZone = new Map<string, Record<string, number>>();
  let importedRateCount = 0;

  dataRows.forEach((row) => {
    const taxZoneNo = (row[0]?.toString() ?? '').trim();
    const zone = allZones.find(z => String(z.zoneNo).trim() === taxZoneNo);
    
    if (!zone) return; // Should not happen since we validated row zones above

    const zoneEdits: Record<string, number> = {};

    rateCategories.forEach((cat, catIndex) => {
      const valueIndex = 1 + catIndex;
      if (valueIndex < row.length) {
        const rawValue = row[valueIndex];
        if (rawValue !== undefined && rawValue !== null && String(rawValue).trim() !== "") {
          const parsedValue = parseFloat(String(rawValue));
          if (!isNaN(parsedValue)) {
            importedRateCount++;
            const key = cat.constructionCode || cat.constructionId;
            zoneEdits[key] = parsedValue;
          }
        }
      }
    });

    if (Object.keys(zoneEdits).length > 0) {
      excelDataByZone.set(zone.zoneNo, zoneEdits);
    }
  });

  const zoneEdits: Record<string, Record<string, number>> = {};
  excelDataByZone.forEach((edits, zoneNo) => {
    zoneEdits[zoneNo] = edits;
  });

  return { zoneEdits, importedRateCount };
}

/**
 * Update matrix data with imported edits
 */
export function applyImportedEditsToMatrix(
  matrixData: MatrixRow[],
  importedEdits: Record<string, Record<string, number>>
): MatrixRow[] {
  return matrixData.map((row) => {
    const zoneNo = row.zoneNo as string;
    const zoneEdits = importedEdits[zoneNo] || {};
    
    if (Object.keys(zoneEdits).length > 0) {
      return { ...row, ...zoneEdits };
    }
    return row;
  });
}

/**
 * Validate uploaded file type
 */
export function validateFileType(file: File): boolean {
  const fileExt = file.name.toLowerCase().split('.').pop();
  return ['csv', 'xlsx', 'xls'].includes(fileExt || '');
}

