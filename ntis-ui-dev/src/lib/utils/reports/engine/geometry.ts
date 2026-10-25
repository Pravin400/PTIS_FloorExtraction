import type {
  PageGeometry,
  PageMargins,
  ReportDefinition,
  ReportOrientation,
  ReportPaperPreset,
} from './types';

// 96 DPI CSS Pixels per Inch / 25.4 mm
export const PX_PER_MM = 96 / 25.4;

export function mmToPx(mm: number | string | null | undefined): number {
  return Math.round((Number(mm) || 0) * PX_PER_MM);
}

export function pxToMm(px: number | string | null | undefined): number {
  return parseFloat(((Number(px) || 0) / PX_PER_MM).toFixed(1));
}

// Standard Crystal Reports Paper Sizes Catalog (Millimeters)
export const PAPER_SIZES: Record<string, ReportPaperPreset> = {
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

export function resolvePageGeometry(
  reportDef: ReportDefinition | Partial<ReportDefinition> | Record<string, unknown> = {}
): PageGeometry {
  const def = reportDef as ReportDefinition;
  const pageCfg = def.page || {};
  const paperSize =
    pageCfg.paperSize || pageCfg.paper || def.paperSize || 'A4';
  const orientation: ReportOrientation = (
    pageCfg.orientation ||
    def.orientation ||
    'portrait'
  ).toLowerCase() === 'landscape'
    ? 'landscape'
    : 'portrait';

  const paperPreset = PAPER_SIZES[paperSize] || PAPER_SIZES['A4'];

  let widthMm = pageCfg.widthMm || def.widthMm;
  let heightMm = pageCfg.heightMm || def.heightMm;

  if (!widthMm || !heightMm) {
    const baseW =
      paperSize === 'Custom' && def.customWidthMm
        ? def.customWidthMm
        : paperPreset.widthMm;
    const baseH =
      paperSize === 'Custom' && def.customHeightMm
        ? def.customHeightMm
        : paperPreset.heightMm;

    if (orientation === 'landscape') {
      widthMm = Math.max(baseW, baseH);
      heightMm = Math.min(baseW, baseH);
    } else {
      widthMm = Math.min(baseW, baseH);
      heightMm = Math.max(baseW, baseH);
    }
  }

  const pageWidth = def.pageWidth || mmToPx(widthMm);
  const pageHeight = def.pageHeight || mmToPx(heightMm);

  const rawMargins = (pageCfg.margins || def.margins || {
    top: 6.4,
    right: 3.2,
    bottom: 6.4,
    left: 6.4,
  }) as PageMargins;

  const margins: PageMargins = {
    top: rawMargins.top !== undefined ? Number(rawMargins.top) : 6.4,
    right: rawMargins.right !== undefined ? Number(rawMargins.right) : 3.2,
    bottom: rawMargins.bottom !== undefined ? Number(rawMargins.bottom) : 6.4,
    left: rawMargins.left !== undefined ? Number(rawMargins.left) : 6.4,
  };

  const printableWidthMm = parseFloat(
    (widthMm - margins.left - margins.right).toFixed(1)
  );
  const printableHeightMm = parseFloat(
    (heightMm - margins.top - margins.bottom).toFixed(1)
  );

  const printableWidth =
    pageWidth - mmToPx(margins.left) - mmToPx(margins.right);
  const printableHeight =
    pageHeight - mmToPx(margins.top) - mmToPx(margins.bottom);

  const usesPageCoordinates = reportDef.coordinateMode === 'page';

  return {
    paperSize,
    orientation,
    widthMm,
    heightMm,
    pageWidthMm: widthMm,
    pageHeightMm: heightMm,
    pageWidth,
    pageHeight,
    margins,
    printableWidth,
    printableHeight,
    designWidth: usesPageCoordinates ? pageWidth : printableWidth,
    designHeight: usesPageCoordinates ? pageHeight : printableHeight,
    usesPageCoordinates,
    printableWidthMm,
    printableHeightMm,
  };
}
