export const PX_PER_MM = 96 / 25.4;

export function mmToPx(mm: number): number {
  return Math.round(mm * PX_PER_MM);
}

export function pxToMm(px: number): number {
  return parseFloat((px / PX_PER_MM).toFixed(1));
}

export interface PaperSizeSpec {
  widthMm: number;
  heightMm: number;
  label: string;
}

/**
 * Format dynamic display label for paper size presets.
 */
export function formatPaperSizeLabel(key: string, widthMm: number, heightMm: number): string {
  if (key === 'Custom') return 'Custom Size';
  return `${key} (${widthMm} x ${heightMm} mm)`;
}

export const PAPER_SIZES: Record<string, PaperSizeSpec> = {
  A3: { widthMm: 297, heightMm: 420, label: 'A3 (297 x 420 mm)' },
  'A3 Extra': { widthMm: 322, heightMm: 445, label: 'A3 Extra (322 x 445 mm)' },
  'A3 Plus': { widthMm: 329, heightMm: 483, label: 'A3 Plus (329 x 483 mm)' },
  'A3 Rotated': { widthMm: 420, heightMm: 297, label: 'A3 Rotated (420 x 297 mm)' },
  'A3 Transverse': { widthMm: 297, heightMm: 420, label: 'A3 Transverse (297 x 420 mm)' },
  A4: { widthMm: 210, heightMm: 297, label: 'A4 (210 x 297 mm)' },
  'A4 Extra': { widthMm: 235, heightMm: 322, label: 'A4 Extra (235 x 322 mm)' },
  'A4 Plus': { widthMm: 210, heightMm: 330, label: 'A4 Plus (210 x 330 mm)' },
  'A4 Rotated': { widthMm: 297, heightMm: 210, label: 'A4 Rotated (297 x 210 mm)' },
  'A4 Small': { widthMm: 210, heightMm: 297, label: 'A4 Small (210 x 297 mm)' },
  'A4 Transverse': { widthMm: 210, heightMm: 297, label: 'A4 Transverse (210 x 297 mm)' },
  A5: { widthMm: 148, heightMm: 210, label: 'A5 (148 x 210 mm)' },
  'A5 Extra': { widthMm: 173, heightMm: 235, label: 'A5 Extra (173 x 235 mm)' },
  'A5 Rotated': { widthMm: 210, heightMm: 148, label: 'A5 Rotated (210 x 148 mm)' },
  'A5 Transverse': { widthMm: 148, heightMm: 210, label: 'A5 Transverse (148 x 210 mm)' },
  A6: { widthMm: 105, heightMm: 148, label: 'A6 (105 x 148 mm)' },
  Letter: { widthMm: 215.9, heightMm: 279.4, label: 'Letter (8.5 x 11 in)' },
  'Letter Extra': { widthMm: 241.3, heightMm: 304.8, label: 'Letter Extra (9.5 x 12 in)' },
  'Letter Plus': { widthMm: 215.9, heightMm: 322.3, label: 'Letter Plus (8.5 x 12.69 in)' },
  'Letter Rotated': { widthMm: 279.4, heightMm: 215.9, label: 'Letter Rotated (11 x 8.5 in)' },
  Legal: { widthMm: 215.9, heightMm: 355.6, label: 'Legal (8.5 x 14 in)' },
  Tabloid: { widthMm: 279.4, heightMm: 431.8, label: 'Tabloid (11 x 17 in)' },
  Custom: { widthMm: 210, heightMm: 297, label: 'Custom Size' },
};

export interface PageDimensionsResult {
  widthMm: number;
  heightMm: number;
  pageWidthPx: number;
  pageHeightPx: number;
}

export function calculatePageDimensions(
  paperSize = 'A4',
  orientation: 'portrait' | 'landscape' = 'portrait',
  customWidthMm?: number,
  customHeightMm?: number
): PageDimensionsResult {
  let baseW = 210;
  let baseH = 297;

  if (paperSize === 'Custom') {
    baseW = customWidthMm || 210;
    baseH = customHeightMm || 297;
  } else {
    const spec = PAPER_SIZES[paperSize] || PAPER_SIZES.A4;
    baseW = spec.widthMm;
    baseH = spec.heightMm;
  }

  const isLandscape = orientation === 'landscape';
  const widthMm = isLandscape ? Math.max(baseW, baseH) : Math.min(baseW, baseH);
  const heightMm = isLandscape ? Math.min(baseW, baseH) : Math.max(baseW, baseH);

  return {
    widthMm,
    heightMm,
    pageWidthPx: mmToPx(widthMm),
    pageHeightPx: mmToPx(heightMm),
  };
}

export function snapToGrid(value: number, snapSize = 5): number {
  if (snapSize <= 1) return value;
  return Math.round(value / snapSize) * snapSize;
}

export interface PrintableGeometry {
  pageWidth: number;
  pageHeight: number;
  leftPx: number;
  rightPx: number;
  topPx: number;
  bottomPx: number;
  printableWidth: number;
  printableHeight: number;
}

export function calculatePrintableGeometry(
  pageWidth: number,
  pageHeight: number,
  margins: { top?: number; right?: number; bottom?: number; left?: number } = {}
): PrintableGeometry {
  const leftPx = mmToPx(margins.left ?? 6.4);
  const rightPx = mmToPx(margins.right ?? 3.2);
  const topPx = mmToPx(margins.top ?? 6.4);
  const bottomPx = mmToPx(margins.bottom ?? 6.4);

  return {
    pageWidth,
    pageHeight,
    leftPx,
    rightPx,
    topPx,
    bottomPx,
    printableWidth: Math.max(0, pageWidth - leftPx - rightPx),
    printableHeight: Math.max(0, pageHeight - topPx - bottomPx),
  };
}
