import type { IZoneDescription, RateCategory } from "@/types/RVRateMaster";

/**
 * Generate CSV template content for rate import
 */
export function generateCsvTemplate(
  allZones: IZoneDescription[],
  rateCategories: RateCategory[],
  rateUnit: "SqMeter" | "SqFeet" = "SqMeter"
): string {
  const unitText = rateUnit === "SqFeet" ? "Rs./Sq.ft" : "Rs./Sq.mtr";
  const headers = ['Tax Zone No', ...rateCategories.map(cat => `${cat.constructionCode || cat.constructionId} (${unitText})`)];
  
  const rows = allZones.map(zone => [
    zone.zoneNo,
    ...rateCategories.map(() => '')
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}

/**
 * Download a file with the given content
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/csv;charset=utf-8;'
): void {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
