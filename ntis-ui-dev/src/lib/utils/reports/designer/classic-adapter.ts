import type {
  DesignerBand,
  DesignerBandType,
  DesignerElement,
  DesignerElementStyle,
  DesignerElementType,
  DesignerFieldCatalogEntry,
  DesignerReportParameter,
  DesignerSourceAssets,
  DesignerTableStructure,
  DesignerTemplate,
} from '@/types/report-designer.types';

const PX_PER_MM = 96 / 25.4;

const toPx = (mm: number) => Math.round(mm * PX_PER_MM);
const toMm = (px: number) => Number((px / PX_PER_MM).toFixed(2));

const HTML_NAMED_ENTITIES: Record<string, string> = {
  nbsp: '\u00a0',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

function decodeHtmlEntities(value: string): string {
  let decoded = value;

  for (let pass = 0; pass < 3; pass += 1) {
    const next = decoded
      .replace(/&#x([0-9a-f]+);?/gi, (match, hex: string) => {
        const codePoint = Number.parseInt(hex, 16);
        return Number.isFinite(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
          ? String.fromCodePoint(codePoint)
          : match;
      })
      .replace(/&#([0-9]+);?/g, (match, decimal: string) => {
        const codePoint = Number.parseInt(decimal, 10);
        return Number.isFinite(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
          ? String.fromCodePoint(codePoint)
          : match;
      })
      .replace(/&(nbsp|amp|lt|gt|quot|apos);/gi, (match, name: string) => (
        HTML_NAMED_ENTITIES[name.toLowerCase()] ?? match
      ));
    if (next === decoded) break;
    decoded = next;
  }

  return decoded;
}

function normalizeTableText(table: DesignerTableStructure): DesignerTableStructure {
  return {
    ...table,
    cells: Object.fromEntries(
      Object.entries(table.cells).map(([key, cell]) => [
        key,
        {
          ...cell,
          ...(typeof cell.content === 'string'
            ? { content: decodeHtmlEntities(cell.content) }
            : {}),
        },
      ])
    ),
  };
}

export interface ClassicSection {
  id: string;
  name: string;
  height: number;
  heightMm: number;
  type: 'header' | 'detail' | 'footer';
  bandType: DesignerBandType;
  dataPath?: string;
  fragmentCode?: string;
  repeatOnPageBreak?: boolean;
  keepTogether?: boolean;
  pageBreakBefore?: boolean;
  pageBreakAfter?: boolean;
  visible: boolean;
}

export interface ClassicElement {
  id: string;
  sectionId: string;
  type: string;
  designerType: DesignerElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  text?: string;
  fieldName?: string;
  visibility?: DesignerElement['visibility'];
  src?: string;
  imageUrl?: string;
  format?: DesignerElement['format'];
  columns?: DesignerElement['columns'];
  showHeader?: boolean;
  table?: DesignerTableStructure;
  cols?: number;
  rows?: number;
  cellData?: Record<string, string>;
  tableCells?: DesignerTableStructure['cells'];
  columnWidths?: number[];
  rowHeights?: number[];
  borderColor?: string;
  borderWidth?: number;
  headerBg?: string;
  textWrapping?: boolean;
  styles: Record<string, string | number>;
  allowOverlap?: boolean;
  locked?: boolean;
  properties?: Record<string, unknown>;
  visible: boolean;
}

export interface ClassicReportDefinition {
  reportId: string;
  reportName: string;
  reportCode: string;
  layoutVersion: number;
  schemaVersion: 3;
  paperSize: DesignerTemplate['page']['size'];
  orientation: DesignerTemplate['page']['orientation'];
  widthMm: number;
  heightMm: number;
  pageWidth: number;
  pageHeight: number;
  pageColor?: string;
  watermark?: DesignerTemplate['watermark'];
  pageBorder?: { top?: string; right?: string; bottom?: string; left?: string; inset?: { top?: number; right?: number; bottom?: number; left?: number }; boxShadow?: string };
  margins: { top: number; right: number; bottom: number; left: number };
  recordsPerPage: number;
  /** Native NTIS band coordinates are relative to the full physical page. */
  coordinateMode: 'page';
  sections: ClassicSection[];
  elements: ClassicElement[];
  fieldCatalog?: DesignerFieldCatalogEntry[];
  sourceAssets?: DesignerSourceAssets;
  ntis?: {
    templateId?: number;
    reportDefinitionId?: number;
    versionId?: number;
    versionNo?: number;
    status?: string;
    dataSourceCode: string;
    moduleId?: number | null;
    moduleName?: string;
    tenantId?: number | null;
    tenantScope?: 'Global' | 'CurrentTenant';
    currentTenantId?: number;
    isActive?: boolean;
    dataProviderCode?: string;
    parameters?: DesignerReportParameter[];
  };
}

export function createBlankClassicReportDefinition(
  reportId: string,
  reportName?: string
): ClassicReportDefinition {
  const normalizedReportId = reportId.trim();
  const resolvedName = reportName?.trim() || normalizedReportId
    .replace(/Report$/i, '')
    .replace(/([A-Z])/g, ' $1')
    .trim() + ' Report';

  return {
    reportId: normalizedReportId,
    reportName: resolvedName,
    reportCode: normalizedReportId,
    layoutVersion: 0,
    schemaVersion: 3,
    paperSize: 'A4',
    orientation: 'portrait',
    widthMm: 210,
    heightMm: 297,
    pageWidth: 794,
    pageHeight: 1123,
    margins: { top: 10, right: 10, bottom: 10, left: 10 },
    recordsPerPage: 1,
    coordinateMode: 'page',
    sections: [
      { id: 'report-header', name: 'Report Header', height: 100, heightMm: 26.5, type: 'header', bandType: 'reportHeader', visible: true },
      { id: 'details', name: 'Details', height: 880, heightMm: 232.8, type: 'detail', bandType: 'detail', visible: true },
      { id: 'page-footer', name: 'Page Footer', height: 80, heightMm: 21.2, type: 'footer', bandType: 'pageFooter', visible: true },
    ],
    elements: [],
    ntis: {
      status: 'Draft',
      dataSourceCode: 'UNASSIGNED',
      dataProviderCode: 'UnassignedReportDataProvider',
    },
  };
}

function classicSectionType(type: DesignerBandType): ClassicSection['type'] {
  if (type === 'detail' || type === 'subreport') return 'detail';
  if (type === 'pageFooter' || type === 'groupFooter' || type === 'reportFooter') return 'footer';
  return 'header';
}

function classicElementType(type: DesignerElementType): string {
  if (type === 'rectangle' || type === 'square' || type === 'circle' || type === 'container')
    return 'box';
  if (type === 'qr' || type === 'barcode' || type === 'signature' || type === 'watermark')
    return 'field';
  if (type === 'pageBreak') return 'unsupported';
  return type;
}

function toClassicStyles(style: DesignerElementStyle = {}): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  if (style.fontFamily) result.fontFamily = style.fontFamily;
  if (style.fontSize !== undefined) result.fontSize = `${style.fontSize}px`;
  if (style.fontWeight !== undefined) result.fontWeight = style.fontWeight;
  if (style.fontStyle) result.fontStyle = style.fontStyle;
  if (style.textDecoration) result.textDecoration = style.textDecoration;
  if (style.textAlign) result.textAlign = style.textAlign;
  if (style.verticalAlign) result.verticalAlign = style.verticalAlign;
  if (style.color) result.color = style.color;
  if (style.background) result.backgroundColor = style.background;
  if (style.borderColor) result.borderColor = style.borderColor;
  if (style.borderWidth !== undefined) result.borderWidth = style.borderWidth;
  if (style.borderColor || style.borderWidth !== undefined) {
    result.border = `${Math.max(style.borderWidth ?? 0.3, 0.3)}px solid ${style.borderColor ?? '#000000'}`;
  }
  if (style.borderRadius !== undefined) result.borderRadius = `${style.borderRadius}px`;
  if (style.padding !== undefined) result.padding = `${style.padding}px`;
  if (style.lineHeight !== undefined) result.lineHeight = style.lineHeight;
  if (style.opacity !== undefined) result.opacity = style.opacity;
  if (style.rotation !== undefined) result.transform = `rotate(${style.rotation}deg)`;
  if (style.zIndex !== undefined) result.zIndex = style.zIndex;
  if (style.objectFit) result.objectFit = style.objectFit;
  return result;
}

function toClassicElement(element: DesignerElement, sectionId: string): ClassicElement {
  const type = classicElementType(element.type);
  const table = element.type === 'table' && element.table
    ? normalizeTableText(element.table)
    : undefined;
  return {
    id: element.id,
    sectionId,
    type,
    designerType: element.type,
    x: toPx(element.x),
    y: toPx(element.y),
    width: Math.max(1, toPx(element.w)),
    height: Math.max(1, toPx(element.h)),
    xMm: element.x,
    yMm: element.y,
    widthMm: element.w,
    heightMm: element.h,
    ...(element.text !== undefined ? { text: decodeHtmlEntities(element.text) } : {}),
    ...(element.path ? { fieldName: element.path } : {}),
    ...(element.visibility ? { visibility: element.visibility } : {}),
    ...(element.src ? { src: element.src, imageUrl: element.src } : {}),
    ...(element.format ? { format: element.format } : {}),
    ...(element.columns ? { columns: element.columns } : {}),
    ...(element.showHeader !== undefined ? { showHeader: element.showHeader } : {}),
    ...(element.properties ? { properties: element.properties } : {}),
    ...(table ? {
      table,
      cols: table.cols,
      rows: table.rows,
      tableCells: table.cells,
      cellData: Object.fromEntries(Object.entries(table.cells).map(([key, cell]) => [key, cell.content ?? ''])),
      columnWidths: table.columnWidths,
      rowHeights: table.rowHeights,
    } : {}),
    textWrapping: Boolean(element.style?.lineHeight || element.h >= 6),
    styles: toClassicStyles(element.style),
    ...(element.isHtml ? { isHtml: true, renderMode: "html" } : {}),
    // The native template has already passed NTIS layout validation. Its dense
    // official grids intentionally place text/fields over border rectangles,
    // so the classic designer must not report those imported layers as errors.
    allowOverlap: true,
    visible: true,
  };
}

export function nativeTemplateToClassic(
  template: DesignerTemplate,
  options: {
    reportId?: string;
    reportName?: string;
    layoutVersion?: number;
    templateId?: number;
    versionId?: number;
    versionNo?: number;
    status?: string;
    dataSourceCode?: string;
    reportDefinitionId?: number;
    moduleId?: number | null;
    moduleName?: string;
    tenantId?: number | null;
    tenantScope?: 'Global' | 'CurrentTenant';
    currentTenantId?: number;
    isActive?: boolean;
    dataProviderCode?: string;
    parameters?: DesignerReportParameter[];
  } = {}
): ClassicReportDefinition {
  const bands = template.bands ?? [];
  const margin = template.page.margin ?? { topMm: 0, rightMm: 0, bottomMm: 0, leftMm: 0 };
  const reportCode = template.reportCode || 'Report';
  const defaultReportId = reportCode;
  const pageWithLegacySize = template.page as typeof template.page & {
    paperSize?: DesignerTemplate['page']['size'];
  };

  return {
    reportId: options.reportId ?? defaultReportId,
    reportName: options.reportName ?? 'Report',
    reportCode,
    layoutVersion: options.layoutVersion ?? options.versionNo ?? 1,
    schemaVersion: 3,
    paperSize: pageWithLegacySize.paperSize
      || (template.page.size && template.page.size !== 'Custom' ? template.page.size : undefined)
      || (Math.abs(template.page.widthMm - 297) < 1 && Math.abs(template.page.heightMm - 420) < 1 ? 'A3' : undefined)
      || (Math.abs(template.page.widthMm - 420) < 1 && Math.abs(template.page.heightMm - 297) < 1 ? 'A3' : undefined)
      || template.page.size
      || 'A4',
    orientation: template.page.orientation,
    widthMm: template.page.widthMm,
    heightMm: template.page.heightMm,
    pageWidth: toPx(template.page.widthMm),
    pageHeight: toPx(template.page.heightMm),
    pageColor: template.page.background,
    ...(template.watermark ? { watermark: { ...template.watermark } } : {}),
    ...(template.page.border ? {
      pageBorder: { ...template.page.border, ...(template.page.borderInsetMm ? { inset: template.page.borderInsetMm } : {}) },
    } : {}),
    margins: {
      top: margin.topMm,
      right: margin.rightMm,
      bottom: margin.bottomMm,
      left: margin.leftMm,
    },
    recordsPerPage: template.recordsPerPage ?? 1,
    coordinateMode: 'page',
    sections: bands.map((band) => ({
      id: band.id,
      name: band.id.replace(/-/g, ' '),
      height: Math.max(1, toPx(band.heightMm)),
      heightMm: band.heightMm,
      type: classicSectionType(band.type),
      bandType: band.type,
      ...(band.dataPath ? { dataPath: band.dataPath } : {}),
      ...(band.fragmentCode ? { fragmentCode: band.fragmentCode } : {}),
      ...(band.repeatOnPageBreak ? { repeatOnPageBreak: true } : {}),
      ...(band.keepTogether ? { keepTogether: true } : {}),
      ...(band.pageBreakBefore ? { pageBreakBefore: true } : {}),
      ...(band.pageBreakAfter ? { pageBreakAfter: true } : {}),
      visible: true,
    })),
    elements: bands.flatMap((band) => band.elements.map((element) => toClassicElement(element, band.id))),
    ...(template.fieldCatalog ? { fieldCatalog: template.fieldCatalog } : {}),
    ...(template.sourceAssets ? { sourceAssets: template.sourceAssets } : {}),
    ntis: {
      ...(options.templateId ? { templateId: options.templateId } : {}),
      ...(options.reportDefinitionId ? { reportDefinitionId: options.reportDefinitionId } : {}),
      ...(options.versionId ? { versionId: options.versionId } : {}),
      ...(options.versionNo ? { versionNo: options.versionNo } : {}),
      ...(options.status ? { status: options.status } : {}),
      dataSourceCode: options.dataSourceCode ?? 'UNASSIGNED',
      moduleId: options.moduleId ?? null,
      ...(options.moduleName ? { moduleName: options.moduleName } : {}),
      tenantId: options.tenantId ?? null,
      tenantScope: options.tenantScope ?? 'CurrentTenant',
      ...(options.currentTenantId ? { currentTenantId: options.currentTenantId } : {}),
      isActive: options.isActive ?? true,
      dataProviderCode: options.dataProviderCode ?? 'UnassignedReportDataProvider',
      parameters: options.parameters ?? [],
    },
  };
}

function numericCss(value: string | number | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isLegacyDesignerChrome(
  styles: ClassicElement['styles'],
  elementType: string,
): boolean {
  const border = String(styles.border ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  const background = String(styles.backgroundColor ?? '').trim().toLowerCase();
  const padding = numericCss(styles.padding) ?? 0;
  const isWhite = background === '#fff' || background === '#ffffff' || background === 'white';

  if ((elementType === 'field' || elementType === 'formula')
    && ['1px solid #000', '1px solid #000000', '1px solid black'].includes(border)) {
    return isWhite && padding >= 1.9 && padding <= 2.1;
  }
  return (elementType === 'text' || elementType === 'text_box')
    && border === '1px solid #1e293b'
    && isWhite
    && padding >= 3.9
    && padding <= 4.1;
}

function toNativeStyle(
  styles: ClassicElement['styles'] = {},
  elementType = 'text',
): DesignerElementStyle {
  const result: DesignerElementStyle = {};
  if (typeof styles.fontFamily === 'string') result.fontFamily = styles.fontFamily;
  const fontSize = numericCss(styles.fontSize);
  if (fontSize !== undefined) result.fontSize = fontSize;
  const fontWeight = numericCss(styles.fontWeight);
  if (fontWeight !== undefined) result.fontWeight = fontWeight;
  if (styles.fontStyle === 'normal' || styles.fontStyle === 'italic') result.fontStyle = styles.fontStyle;
  if (styles.textDecoration === 'none' || styles.textDecoration === 'underline')
    result.textDecoration = styles.textDecoration;
  if (styles.textAlign === 'left' || styles.textAlign === 'center' || styles.textAlign === 'right')
    result.textAlign = styles.textAlign;
  if (styles.verticalAlign === 'top' || styles.verticalAlign === 'middle' || styles.verticalAlign === 'bottom')
    result.verticalAlign = styles.verticalAlign;
  if (typeof styles.color === 'string') result.color = styles.color;
  if (typeof styles.backgroundColor === 'string') result.background = styles.backgroundColor;
  if (typeof styles.borderColor === 'string') result.borderColor = styles.borderColor;
  if (numericCss(styles.borderWidth) !== undefined) result.borderWidth = numericCss(styles.borderWidth);
  if (typeof styles.border === 'string' && !isLegacyDesignerChrome(styles, elementType)) {
    const width = styles.border.match(/([\d.]+)px/);
    const color = styles.border.match(/(#[0-9a-f]{3,8}|rgba?\([^)]+\)|[a-z]+)\s*$/i);
    if (width) result.borderWidth = Number(width[1]);
    if (color) result.borderColor = color[1];
  }
  const borderRadius = numericCss(styles.borderRadius);
  if (borderRadius !== undefined) result.borderRadius = borderRadius;
  const padding = numericCss(styles.padding);
  if (padding !== undefined) result.padding = padding;
  const lineHeight = numericCss(styles.lineHeight);
  if (lineHeight !== undefined) result.lineHeight = lineHeight;
  const opacity = numericCss(styles.opacity);
  if (opacity !== undefined) result.opacity = opacity;
  const rotation = typeof styles.transform === 'string'
    ? numericCss(styles.transform.match(/rotate\(([-\d.]+)deg\)/)?.[1])
    : undefined;
  if (rotation !== undefined) result.rotation = rotation;
  const zIndex = numericCss(styles.zIndex);
  if (zIndex !== undefined) result.zIndex = zIndex;
  if (styles.objectFit === 'contain' || styles.objectFit === 'cover' || styles.objectFit === 'fill') {
    result.objectFit = styles.objectFit;
  }
  return result;
}

const NATIVE_ELEMENT_TYPES = new Set<DesignerElementType>([
  'text', 'field', 'image', 'qr', 'barcode', 'line', 'rectangle', 'square',
  'circle', 'table', 'container', 'signature', 'watermark', 'pageBreak',
]);

function normalizedNativeType(value: unknown): DesignerElementType | null {
  if (value === 'box') return 'rectangle';
  if (value === 'formula') return 'field';
  if (value === 'subreport') return 'container';
  if (value === 'unsupported') return 'text';
  return typeof value === 'string' && NATIVE_ELEMENT_TYPES.has(value as DesignerElementType)
    ? value as DesignerElementType
    : null;
}

function nativeElementType(element: ClassicElement): DesignerElementType {
  // Older classic drafts may have persisted "box" or "formula" in
  // designerType. Never pass those UI-only values to the backend validator.
  return normalizedNativeType(element.designerType)
    ?? normalizedNativeType(element.type)
    ?? 'text';
}

function toNativeElement(element: ClassicElement): DesignerElement {
  const type = nativeElementType(element);
  const x = Number.isFinite(element.xMm) ? element.xMm : toMm(element.x);
  const y = Number.isFinite(element.yMm) ? element.yMm : toMm(element.y);
  const w = Number.isFinite(element.widthMm) ? element.widthMm : toMm(element.width);
  const h = Number.isFinite(element.heightMm) ? element.heightMm : toMm(element.height);
  const sourceTable = type === 'table'
    ? element.table ?? (element.rows && element.cols ? {
        version: 1 as const,
        rows: element.rows,
        cols: element.cols,
        cells: element.tableCells ?? Object.fromEntries(
          Object.entries(element.cellData ?? {}).map(([key, content]) => [key, { content }]),
        ),
        columnWidths: element.columnWidths ?? Array.from({ length: element.cols }, () => 1),
        rowHeights: element.rowHeights ?? Array.from({ length: element.rows }, () => 24),
      } : undefined)
    : undefined;
  const table = sourceTable ? normalizeTableText(sourceTable) : undefined;
  return {
    id: element.id,
    type,
    x,
    y,
    w,
    h,
    ...(element.text !== undefined ? { text: decodeHtmlEntities(element.text) } : {}),
    ...(element.fieldName ? { path: element.fieldName } : {}),
    ...(element.visibility ? { visibility: element.visibility } : {}),
    ...(element.src || element.imageUrl ? { src: element.src || element.imageUrl } : {}),
    ...(element.format ? { format: element.format } : {}),
    ...(element.columns ? { columns: element.columns } : {}),
    ...(element.showHeader !== undefined ? { showHeader: element.showHeader } : {}),
    ...(element.properties ? { properties: element.properties } : {}),
    ...(table ? { table } : {}),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...((element as any).isHtml ? { isHtml: true, renderMode: 'html' } : {}),
    style: toNativeStyle(element.styles, element.type),
  };
}

export function classicToNativeTemplate(definition: ClassicReportDefinition): DesignerTemplate {
  const sections = Array.isArray(definition.sections) ? definition.sections : [];
  const elements = Array.isArray(definition.elements) ? definition.elements : [];
  const bands: DesignerBand[] = sections.map((section) => ({
    id: section.id,
    type: section.bandType ?? (section.type === 'detail' ? 'detail' : section.type === 'footer' ? 'reportFooter' : 'reportHeader'),
    heightMm: toMm(section.height),
    elements: elements
      .filter((element) => element.sectionId === section.id && element.visible !== false)
      .map(toNativeElement),
    ...(section.dataPath ? { dataPath: section.dataPath } : {}),
    ...(section.fragmentCode ? { fragmentCode: section.fragmentCode } : {}),
    ...(section.repeatOnPageBreak ? { repeatOnPageBreak: true } : {}),
    ...(section.keepTogether ? { keepTogether: true } : {}),
    ...(section.pageBreakBefore ? { pageBreakBefore: true } : {}),
    ...(section.pageBreakAfter ? { pageBreakAfter: true } : {}),
  }));

  const rawSize = definition.paperSize || 'A4';
  const legacySizes = new Set(['A4', 'A5', 'A6', 'Letter', 'Legal']);
  const normalizedSize = legacySizes.has(rawSize)
    ? (rawSize as 'A4' | 'A5' | 'A6' | 'Letter' | 'Legal')
    : 'Custom';

  return {
    schemaVersion: 3,
    reportCode: definition.reportCode || definition.reportId || 'Report',
    recordsPerPage: definition.recordsPerPage || 1,
    ...(definition.watermark ? { watermark: { ...definition.watermark } } : {}),
    page: {
      size: normalizedSize,
      paperSize: rawSize,
      orientation: definition.orientation || 'portrait',
      widthMm: definition.widthMm || toMm(definition.pageWidth),
      heightMm: definition.heightMm || toMm(definition.pageHeight),
      margin: {
        topMm: definition.margins?.top ?? 0,
        rightMm: definition.margins?.right ?? 0,
        bottomMm: definition.margins?.bottom ?? 0,
        leftMm: definition.margins?.left ?? 0,
      },
      background: definition.pageColor || '#ffffff',
      ...(definition.pageBorder ? {
        border: {
          top: definition.pageBorder.top,
          right: definition.pageBorder.right,
          bottom: definition.pageBorder.bottom,
          left: definition.pageBorder.left,
        },
        ...(definition.pageBorder.inset ? { borderInsetMm: definition.pageBorder.inset } : {}),
      } : {}),
    },
    elements: [],
    bands,
    ...(definition.fieldCatalog ? { fieldCatalog: definition.fieldCatalog } : {}),
    ...(definition.sourceAssets ? { sourceAssets: definition.sourceAssets } : {}),
  };
}
