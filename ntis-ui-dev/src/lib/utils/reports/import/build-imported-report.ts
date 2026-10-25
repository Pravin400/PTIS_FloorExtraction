import type {
  ClassicElement,
  ClassicReportDefinition,
  ClassicSection,
} from '@/lib/utils/reports/designer/classic-adapter';
import type {
  DesignerBandType,
  DesignerElementType,
  DesignerFieldCatalogEntry,
  DesignerReportParameter,
  DesignerSourceAsset,
  DesignerTemplate,
} from '@/types/report-designer.types';

const PX_PER_MM = 96 / 25.4;

type UnknownRecord = Record<string, unknown>;

export interface RptImageAnalysis {
  name?: string;
  mimeType?: string;
  buffer?: Buffer | { data?: number[] };
  sizeBytes?: number;
}

export interface RptImportAnalysis {
  isValidRpt?: boolean;
  suggestedId?: string;
  suggestedTitle?: string;
  metadata?: UnknownRecord;
  sections?: UnknownRecord[];
  elements?: UnknownRecord[];
  images?: RptImageAnalysis[];
  subreports?: Array<{ id?: string; name?: string }>;
  parametersDetected?: string[];
  diagnostics?: UnknownRecord;
}

export interface PdfLayoutItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface PdfLayoutGraphic {
  id?: string;
  type: 'line' | 'rectangle' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  dataUrl?: string;
  locked?: boolean;
  objectFit?: 'contain' | 'fill';
}

export interface PdfImportLayout {
  pageWidth: number;
  pageHeight: number;
  widthMm: number;
  heightMm: number;
  pageCount?: number;
  extractionMode?: 'unicode' | 'ocr' | 'image';
  items: PdfLayoutItem[];
  graphics?: PdfLayoutGraphic[];
}

interface PdfFieldBinding {
  field: DesignerFieldCatalogEntry;
  binding: string;
}

export interface ImportedReportOptions {
  reportId: string;
  reportName: string;
  paperSize: string;
  orientation: 'portrait' | 'landscape';
  moduleId: number | null;
  moduleName: string;
  dataProviderCode: string;
  dataSourceCode: string;
  tenantId: number | null;
  currentTenantId?: number;
  fieldCatalog?: DesignerFieldCatalogEntry[];
  sampleData?: UnknownRecord;
  referencePdf?: DesignerSourceAsset;
}

const numberOr = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const pxToMm = (value: number): number => Number((value / PX_PER_MM).toFixed(2));

const comparableText = (value: string): string => value
  .normalize('NFKC')
  .toLocaleLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, '');

const humanizeFieldName = (value: string): string => value
  .split('.').pop()!
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .trim();

function pdfFieldBindings(fields: DesignerFieldCatalogEntry[] = []): PdfFieldBinding[] {
  return fields.flatMap((field) => {
    if (field.type === 'collection' || field.type === 'object') return [];
    if (field.elementType && field.elementType !== 'field') return [];
    const binding = field.collectionPath
      && !field.name.startsWith(`${field.collectionPath}.`)
      ? `${field.collectionPath}.${field.name}`
      : field.name;
    return binding ? [{ field, binding }] : [];
  });
}

function bindingLabels(binding: PdfFieldBinding): string[] {
  return Array.from(new Set([
    binding.field.label,
    binding.field.name,
    humanizeFieldName(binding.field.name),
    binding.binding,
  ].map((value) => String(value || '').trim()).filter(Boolean)));
}

function exactPdfField(text: string, bindings: PdfFieldBinding[]): PdfFieldBinding | undefined {
  const normalized = comparableText(text.replace(/^\{\{?|\}\}?$/g, ''));
  if (!normalized) return undefined;
  return bindings.find((binding) =>
    bindingLabels(binding).some((label) => comparableText(label) === normalized));
}

function inlinePdfField(
  text: string,
  bindings: PdfFieldBinding[],
): { binding: PdfFieldBinding; labelText: string } | undefined {
  const delimiter = text.search(/[:：\-–—]/u);
  if (delimiter < 1 || !text.slice(delimiter + 1).trim()) return undefined;
  const labelText = text.slice(0, delimiter).trim();
  const binding = exactPdfField(labelText, bindings);
  return binding ? { binding, labelText: `${text.slice(0, delimiter + 1).trim()} ` } : undefined;
}

function sampleValueAtPath(root: UnknownRecord | undefined, path: string): unknown {
  if (!root || !path) return undefined;
  return path.split('.').reduce<unknown>((value, key) => {
    const current = Array.isArray(value) ? value[0] : value;
    if (!current || typeof current !== 'object') return undefined;
    return (current as UnknownRecord)[key];
  }, root);
}

function samplePdfBindings(
  sampleData: UnknownRecord | undefined,
  bindings: PdfFieldBinding[],
): Map<string, PdfFieldBinding> {
  const result = new Map<string, PdfFieldBinding>();
  for (const binding of bindings) {
    const value = sampleValueAtPath(sampleData, binding.binding)
      ?? sampleValueAtPath(sampleData, binding.field.name);
    if (value === null || value === undefined || typeof value === 'object') continue;
    const comparable = comparableText(String(value));
    // Very short values such as 0/1 occur throughout official forms and are
    // too ambiguous to bind safely without a nearby label.
    if (comparable.length < 2 || result.has(comparable)) continue;
    result.set(comparable, binding);
  }
  return result;
}

function pdfTextElement(
  item: PdfLayoutItem,
  index: number,
  sectionId: string,
  useOcrOverlay = false,
): ClassicElement {
  const text = String(item.text || '').trim();
  const x = Math.max(0, numberOr(item.x, 0));
  const width = Math.max(2, numberOr(item.width, text.length * 6));
  const fontSize = Math.max(5, numberOr(item.fontSize, item.height || 12));
  const measuredHeight = Math.max(2, numberOr(item.height, fontSize));
  const height = Math.max(measuredHeight, fontSize * 1.25);
  const y = Math.max(0, numberOr(item.y, 0) - ((height - measuredHeight) / 2));
  return {
    id: useOcrOverlay ? `pdf-ocr-text-${index + 1}` : `pdf-text-${index + 1}`,
    sectionId,
    type: 'text',
    designerType: 'text',
    x,
    y,
    width,
    height,
    xMm: pxToMm(x),
    yMm: pxToMm(y),
    widthMm: pxToMm(width),
    heightMm: pxToMm(height),
    text,
    styles: {
      fontSize: `${fontSize.toFixed(1)}px`,
      fontFamily: item.fontFamily || "'Noto Sans Devanagari', Arial, sans-serif",
      fontWeight: numberOr(item.fontWeight, 400),
      color: item.color || '#111827',
      textAlign: item.textAlign || 'left',
      padding: '0px',
      lineHeight: '1.15',
      whiteSpace: 'nowrap',
      overflow: 'visible',
      verticalAlign: 'top',
      zIndex: 3,
      opacity: useOcrOverlay ? 0 : 1,
    },
    ...(useOcrOverlay ? {
      properties: {
        importRole: 'ocrText',
        sourceText: text,
        ocrEdited: false,
        ocrBackgroundColor: '#ffffff',
        sourceX: x,
        sourceY: y,
        sourceWidth: width,
        sourceHeight: height,
      },
    } : {}),
    allowOverlap: true,
    textWrapping: false,
    visible: true,
  };
}

export function pdfOcrMaskElements(elements: ClassicElement[], sectionId: string): ClassicElement[] {
  return elements.flatMap((element, index) => {
    if (element.properties?.importRole !== 'dynamicField') return [];
    const x = Math.max(0, numberOr(element.properties.sourceX, element.x));
    const y = Math.max(0, numberOr(element.properties.sourceY, element.y));
    const width = Math.max(2, numberOr(element.properties.sourceWidth, element.width));
    const height = Math.max(2, numberOr(element.properties.sourceHeight, element.height));
    return [{
      id: `pdf-ocr-mask-bound-${index + 1}`,
      sectionId,
      type: 'box',
      designerType: 'rectangle' as const,
      x,
      y,
      width,
      height,
      xMm: pxToMm(x),
      yMm: pxToMm(y),
      widthMm: pxToMm(width),
      heightMm: pxToMm(height),
      styles: {
        backgroundColor: String(element.properties.ocrBackgroundColor || '#ffffff'),
        border: 'none',
        zIndex: 1,
      },
      properties: { importRole: 'ocrMask', sourceElementId: element.id },
      allowOverlap: true,
      locked: true,
      textWrapping: false,
      visible: true,
    }];
  });
}

function pdfGraphicElements(
  graphics: PdfLayoutGraphic[] = [],
  sectionId: string,
): ClassicElement[] {
  return graphics.slice(0, 2_000).flatMap<ClassicElement>((graphic, index): ClassicElement[] => {
    const x = Math.max(0, numberOr(graphic.x, 0));
    const y = Math.max(0, numberOr(graphic.y, 0));
    const width = Math.max(1, numberOr(graphic.width, 1));
    const height = Math.max(1, numberOr(graphic.height, 1));
    const common = {
      id: graphic.id || (graphic.locked ? `pdf-template-bg-${index + 1}` : `pdf-graphic-${index + 1}`),
      sectionId,
      x,
      y,
      width,
      height,
      xMm: pxToMm(x),
      yMm: pxToMm(y),
      widthMm: pxToMm(width),
      heightMm: pxToMm(height),
      allowOverlap: true,
      textWrapping: false,
      visible: true,
      ...(graphic.locked ? { locked: true } : {}),
    };
    if (graphic.type === 'image') {
      const source = String(graphic.dataUrl || '');
      if (!/^data:image\/(?:jpeg|png|webp|gif);base64,/i.test(source) || source.length > 70_000) return [];
      return [{
        ...common,
        type: 'image',
        designerType: 'image' as const,
        src: source,
        imageUrl: source,
        styles: { objectFit: graphic.objectFit || 'contain', zIndex: graphic.locked ? 0 : 1 },
      }];
    }
    if (graphic.type === 'line') {
      const color = graphic.stroke || graphic.fill || '#111827';
      const isVertical = height > width * 2;
      return [{
        ...common,
        type: 'line',
        designerType: 'line' as const,
        x1: x,
        y1: y,
        x2: isVertical ? x : x + width,
        y2: isVertical ? y + height : y,
        styles: {
          backgroundColor: color,
          color,
          lineThickness: Math.max(0.5, numberOr(graphic.strokeWidth, 1)),
          zIndex: 1,
        },
      }];
    }
    const strokeWidth = Math.max(0, numberOr(graphic.strokeWidth, 0));
    const stroke = graphic.stroke && graphic.stroke !== 'none' ? graphic.stroke : 'transparent';
    const fill = graphic.fill && graphic.fill !== 'none' ? graphic.fill : 'transparent';
    return [{
      ...common,
      type: 'box',
      designerType: 'rectangle' as const,
      styles: {
        backgroundColor: fill,
        border: strokeWidth > 0 ? `${strokeWidth}px solid ${stroke}` : 'none',
        zIndex: 1,
      },
    }];
  });
}

export function dynamicPdfElements(
  items: PdfLayoutItem[],
  sectionId: string,
  fields: DesignerFieldCatalogEntry[] = [],
  sampleData?: UnknownRecord,
  useOcrOverlay = false,
): ClassicElement[] {
  const usableItems = items.slice(0, 3_000);
  const bindings = pdfFieldBindings(fields);
  const valueBindings = samplePdfBindings(sampleData, bindings);
  const boundValueIndexes = new Map<number, PdfFieldBinding>();
  const labelIndexes = new Map<number, PdfFieldBinding>();
  const usedBindings = new Set<string>();

  usableItems.forEach((item, index) => {
    const text = String(item.text || '').trim();
    if (!text || /^\{\{?.+\}\}?$/.test(text)) return;
    const binding = exactPdfField(text, bindings);
    if (binding) labelIndexes.set(index, binding);
  });

  // A PDF often stores a label and its sample value as separate text objects.
  // Replace the nearest value to the right (or immediately below) with the
  // provider field while retaining the label at its original coordinates.
  for (const [labelIndex, binding] of labelIndexes) {
    if (usedBindings.has(binding.binding)) continue;
    const label = usableItems[labelIndex];
    const labelX = numberOr(label.x, 0);
    const labelY = numberOr(label.y, 0);
    const labelWidth = Math.max(2, numberOr(label.width, 0));
    const labelHeight = Math.max(5, numberOr(label.height, label.fontSize || 12));
    let bestIndex = -1;
    let bestScore = Number.POSITIVE_INFINITY;
    usableItems.forEach((candidate, candidateIndex) => {
      if (candidateIndex === labelIndex || boundValueIndexes.has(candidateIndex) || labelIndexes.has(candidateIndex)) return;
      const candidateText = String(candidate.text || '').trim();
      if (!candidateText) return;
      const candidateX = numberOr(candidate.x, 0);
      const candidateY = numberOr(candidate.y, 0);
      const sameLineDelta = Math.abs(candidateY - labelY);
      const rightGap = candidateX - (labelX + labelWidth);
      let score = Number.POSITIVE_INFINITY;
      if (rightGap >= -2 && rightGap <= 320 && sameLineDelta <= Math.max(labelHeight, numberOr(candidate.height, 12))) {
        score = Math.max(0, rightGap) + sameLineDelta * 8;
      } else {
        const belowGap = candidateY - (labelY + labelHeight);
        if (belowGap >= -2 && belowGap <= 60 && Math.abs(candidateX - labelX) <= 100) {
          score = 400 + belowGap * 5 + Math.abs(candidateX - labelX);
        }
      }
      if (score < bestScore) {
        bestScore = score;
        bestIndex = candidateIndex;
      }
    });
    if (bestIndex >= 0) {
      boundValueIndexes.set(bestIndex, binding);
      usedBindings.add(binding.binding);
    }
  }

  return usableItems.flatMap((item, index) => {
    const text = String(item.text || '').trim();
    if (!text) return [];
    const base = pdfTextElement(item, index, sectionId, useOcrOverlay);
    const placeholder = /^\{\{?\s*([^{}]+?)\s*\}\}?$/.exec(text);
    const placeholderBinding = placeholder ? exactPdfField(placeholder[1], bindings) : undefined;
    const valueBinding = placeholderBinding
      ?? boundValueIndexes.get(index)
      ?? valueBindings.get(comparableText(text));
    const boundFieldName = valueBinding?.binding ?? (placeholder ? placeholder[1].trim() : undefined);
    if (boundFieldName) {
      return [{
        ...base,
        type: 'field',
        designerType: 'field',
        fieldName: boundFieldName,
        text: `{${boundFieldName}}`,
        styles: {
          ...base.styles,
          zIndex: 2,
          ...(useOcrOverlay ? {
            opacity: 1,
            backgroundColor: 'transparent',
            padding: '1px 2px',
          } : {}),
        },
        ...(useOcrOverlay ? {
          properties: {
            ...(base.properties ?? {}),
            importRole: 'dynamicField',
            ocrEdited: true,
          },
        } : {}),
      }];
    }

    const inline = inlinePdfField(text, bindings);
    if (!inline || usedBindings.has(inline.binding.binding)) return [base];
    usedBindings.add(inline.binding.binding);
    const labelRatio = Math.min(0.8, Math.max(0.2, inline.labelText.length / Math.max(1, text.length)));
    const labelWidth = Math.max(8, base.width * labelRatio);
    const valueWidth = Math.max(12, base.width - labelWidth);
    const labelElement: ClassicElement = {
      ...base,
      width: labelWidth,
      widthMm: pxToMm(labelWidth),
      text: inline.labelText,
    };
    const fieldElement: ClassicElement = {
      ...base,
      id: `${base.id}-field`,
      type: 'field',
      designerType: 'field',
      fieldName: inline.binding.binding,
      text: `{${inline.binding.binding}}`,
      x: base.x + labelWidth,
      xMm: pxToMm(base.x + labelWidth),
      width: valueWidth,
      widthMm: pxToMm(valueWidth),
      styles: {
        ...base.styles,
        zIndex: 2,
        ...(useOcrOverlay ? {
          opacity: 1,
          backgroundColor: 'transparent',
          padding: '1px 2px',
        } : {}),
      },
      ...(useOcrOverlay ? {
        properties: {
          ...(base.properties ?? {}),
          importRole: 'dynamicField',
          ocrEdited: true,
          sourceX: base.x + labelWidth,
          sourceWidth: valueWidth,
        },
      } : {}),
    };
    return [labelElement, fieldElement];
  });
}

function pageSize(value: string): DesignerTemplate['page']['size'] {
  return ['A4', 'A5', 'A6', 'Letter', 'Legal'].includes(value)
    ? value as DesignerTemplate['page']['size']
    : 'Custom';
}

function sectionBandType(section: UnknownRecord): DesignerBandType {
  const id = String(section.id ?? '').toLowerCase();
  const name = String(section.name ?? '').toLowerCase();
  const type = String(section.type ?? '').toLowerCase();
  const token = `${id} ${name}`;
  if (section.isSubreport || token.includes('subreport')) return 'subreport';
  if (token.includes('group') && token.includes('header')) return 'groupHeader';
  if (token.includes('group') && token.includes('footer')) return 'groupFooter';
  if (token.includes('page') && token.includes('header')) return 'pageHeader';
  if (token.includes('report') && token.includes('header')) return 'reportHeader';
  if (token.includes('page') && token.includes('footer')) return 'pageFooter';
  if (token.includes('report') && token.includes('footer')) return 'reportFooter';
  if (type === 'detail' || token.includes('detail')) return 'detail';
  if (type === 'footer') return 'reportFooter';
  return 'reportHeader';
}

function sectionType(bandType: DesignerBandType): ClassicSection['type'] {
  if (bandType === 'detail' || bandType === 'subreport') return 'detail';
  if (bandType.endsWith('Footer')) return 'footer';
  return 'header';
}

function elementType(value: unknown): DesignerElementType {
  switch (String(value ?? '').toLowerCase()) {
    case 'box':
      return 'rectangle';
    case 'formula':
    case 'parameter':
    case 'special':
      return 'field';
    case 'subreport':
      return 'container';
    case 'unsupported':
      return 'text';
    case 'text':
    case 'field':
    case 'image':
    case 'qr':
    case 'barcode':
    case 'line':
    case 'rectangle':
    case 'square':
    case 'circle':
    case 'table':
    case 'container':
    case 'signature':
    case 'watermark':
    case 'pagebreak':
      return String(value).toLowerCase() === 'pagebreak'
        ? 'pageBreak'
        : String(value).toLowerCase() as DesignerElementType;
    default:
      return 'text';
  }
}

function bufferFrom(value: RptImageAnalysis['buffer']): Buffer | null {
  if (Buffer.isBuffer(value)) return value;
  if (value && Array.isArray(value.data)) return Buffer.from(value.data);
  return null;
}

function embeddedImageMap(images: RptImageAnalysis[] = []): Map<string, string> {
  const result = new Map<string, string>();
  for (const image of images) {
    const buffer = bufferFrom(image.buffer);
    if (!image.name || !buffer) continue;
    // The backend validator limits individual template strings to 100 KB.
    // Keep small Crystal assets inline and leave oversized assets as a visible
    // designer placeholder instead of creating an invalid template version.
    if (buffer.length > 70_000) continue;
    result.set(
      image.name.toLowerCase(),
      `data:${image.mimeType || 'application/octet-stream'};base64,${buffer.toString('base64')}`,
    );
  }
  return result;
}

function normalizedImageSource(element: UnknownRecord, images: Map<string, string>): string | undefined {
  const source = String(element.src ?? element.imageUrl ?? '').trim();
  if (!source) return undefined;
  const fileName = source.split(/[\\/]/).pop()?.toLowerCase();
  const embedded = fileName ? images.get(fileName) : undefined;
  if (embedded) return embedded;
  return source.startsWith('/reports/') ? undefined : source;
}

function normalizeSection(section: UnknownRecord, index: number): ClassicSection {
  const height = Math.max(1, numberOr(section.height, 40));
  const bandType = sectionBandType(section);
  return {
    id: String(section.id || `section-${index + 1}`),
    name: String(section.name || `Section ${index + 1}`),
    height,
    heightMm: numberOr(section.heightMm, pxToMm(height)),
    type: sectionType(bandType),
    bandType,
    ...(typeof section.dataPath === 'string' ? { dataPath: section.dataPath } : {}),
    ...(typeof section.fragmentCode === 'string' ? { fragmentCode: section.fragmentCode } : {}),
    repeatOnPageBreak: Boolean(section.repeatOnPageBreak),
    keepTogether: Boolean(section.keepTogether),
    pageBreakBefore: Boolean(section.pageBreakBefore),
    pageBreakAfter: Boolean(section.pageBreakAfter),
    visible: section.visible !== false,
  };
}

function normalizeElement(
  element: UnknownRecord,
  index: number,
  fallbackSectionId: string,
  images: Map<string, string>,
): ClassicElement {
  const x = numberOr(element.x, 0);
  const y = numberOr(element.y, 0);
  const width = Math.max(1, numberOr(element.width, 120));
  const height = Math.max(1, numberOr(element.height, 24));
  const type = String(element.type || 'text');
  const source = normalizedImageSource(element, images);
  const styles = element.styles && typeof element.styles === 'object'
    ? element.styles as Record<string, string | number>
    : {};

  return {
    id: String(element.id || `imported-element-${index + 1}`),
    sectionId: String(element.sectionId || fallbackSectionId),
    type,
    designerType: elementType(type),
    x,
    y,
    width,
    height,
    xMm: numberOr(element.xMm, pxToMm(x)),
    yMm: numberOr(element.yMm, pxToMm(y)),
    widthMm: numberOr(element.widthMm, pxToMm(width)),
    heightMm: numberOr(element.heightMm, pxToMm(height)),
    ...(typeof element.text === 'string' ? { text: element.text } : {}),
    ...(typeof element.fieldName === 'string' ? { fieldName: element.fieldName } : {}),
    ...(source ? { src: source, imageUrl: source } : {}),
    styles,
    ...(element.properties && typeof element.properties === 'object'
      ? { properties: { ...(element.properties as UnknownRecord) } }
      : {}),
    allowOverlap: true,
    textWrapping: element.textWrapping !== false,
    visible: element.visible !== false,
  };
}

function comparableFieldLeaf(value: string): string {
  return comparableText(value
    .replace(/[{}]/g, '')
    .replace(/^[^.]+;\d+\./, '')
    .split('.')
    .pop() || '');
}

function cleanRptFieldName(value: string): string {
  return value
    .replace(/[{}]/g, '')
    .replace(/^[?@]/, '')
    .replace(/^[^.]+;\d+\./, '')
    .trim();
}

export function fieldCatalogFromRptAnalysis(
  analysis: RptImportAnalysis,
): DesignerFieldCatalogEntry[] {
  const fields = new Map<string, DesignerFieldCatalogEntry>();
  (analysis.elements ?? []).forEach((element) => {
    if (String(element.type || '').toLowerCase() !== 'field') return;
    const rawName = typeof element.fieldName === 'string'
      ? cleanRptFieldName(element.fieldName)
      : '';
    const name = rawName.split('.').pop() || '';
    if (!name || fields.has(name.toLowerCase())) return;
    fields.set(name.toLowerCase(), {
      name,
      label: humanizeFieldName(name),
      type: 'string',
      elementType: 'field',
      group: 'RPT Database Fields',
    });
  });
  return [...fields.values()];
}

function bindEmbeddedSubreportData(
  sections: ClassicSection[],
  elements: ClassicElement[],
  fields: DesignerFieldCatalogEntry[] = [],
): void {
  const collectionFields = new Map<string, DesignerFieldCatalogEntry[]>();
  fields.forEach((field) => {
    if (!field.collectionPath) return;
    const current = collectionFields.get(field.collectionPath) ?? [];
    current.push(field);
    collectionFields.set(field.collectionPath, current);
  });
  if (collectionFields.size === 0) return;

  sections.forEach((section) => {
    const sourceBandName = section.name.split('/').pop() || section.name;
    if (section.bandType !== 'subreport' || section.dataPath || !/detail/i.test(sourceBandName)) return;
    const sectionFields = elements.filter((element) =>
      element.sectionId === section.id && element.type === 'field' && element.fieldName);
    const sourceLeaves = new Set(sectionFields.map((element) => comparableFieldLeaf(element.fieldName || '')));
    let bestPath = '';
    let bestScore = 0;

    collectionFields.forEach((entries, collectionPath) => {
      const score = entries.reduce((total, field) =>
        total + (sourceLeaves.has(comparableFieldLeaf(field.name)) ? 1 : 0), 0);
      if (score > bestScore) {
        bestPath = collectionPath;
        bestScore = score;
      }
    });

    if (!bestPath && collectionFields.size === 1) {
      bestPath = collectionFields.keys().next().value || '';
    }
    if (!bestPath) return;
    section.dataPath = bestPath;

    const candidates = collectionFields.get(bestPath) ?? [];
    sectionFields.forEach((element) => {
      const matchingField = candidates.find((field) =>
        comparableFieldLeaf(field.name) === comparableFieldLeaf(element.fieldName || ''));
      if (!matchingField) return;
      element.fieldName = matchingField.name.startsWith(`${bestPath}.`)
        ? matchingField.name.slice(bestPath.length + 1)
        : matchingField.name;
      element.text = `{${element.fieldName}}`;
    });
  });
}

function bindImportedFieldsToCatalog(
  sections: ClassicSection[],
  elements: ClassicElement[],
  fields: DesignerFieldCatalogEntry[] = [],
): void {
  if (fields.length === 0) return;
  const sectionsById = new Map(sections.map((section) => [section.id, section]));
  const bindableFields = fields.filter((field) =>
    field.type !== 'collection' && field.type !== 'object' && field.elementType !== 'table');

  elements.forEach((element) => {
    if (element.type !== 'field' || !element.fieldName) return;
    const sourceLeaf = comparableFieldLeaf(element.fieldName);
    if (!sourceLeaf) return;
    const section = sectionsById.get(element.sectionId);
    const dataPath = section?.dataPath || '';
    const candidates = bindableFields.filter((field) => comparableFieldLeaf(field.name) === sourceLeaf);
    const matchingField = (dataPath
      ? candidates.find((field) => field.collectionPath === dataPath)
      : candidates.find((field) => !field.collectionPath))
      ?? (candidates.length === 1 ? candidates[0] : undefined);
    if (!matchingField) return;

    const binding = dataPath && matchingField.name.startsWith(`${dataPath}.`)
      ? matchingField.name.slice(dataPath.length + 1)
      : matchingField.name;
    element.fieldName = binding;
    element.text = `{${binding}}`;
  });
}

function detectedParameters(values: string[] = []): DesignerReportParameter[] {
  const seen = new Set<string>();
  return values.flatMap((value, index) => {
    const key = value.replace(/^@/, '').trim();
    if (!key || seen.has(key.toLowerCase())) return [];
    seen.add(key.toLowerCase());
    return [{
      key,
      label: key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' '),
      type: 'text',
      isRequired: false,
      sortOrder: index,
      cascadeFromKey: null,
      isActive: true,
    }];
  });
}

function reportMetadata(options: ImportedReportOptions, parameters: DesignerReportParameter[]) {
  return {
    dataSourceCode: options.dataSourceCode,
    dataProviderCode: options.dataProviderCode,
    moduleId: options.moduleId,
    moduleName: options.moduleName,
    tenantId: options.tenantId,
    tenantScope: 'CurrentTenant' as const,
    ...(options.currentTenantId ? { currentTenantId: options.currentTenantId } : {}),
    isActive: true,
    parameters,
    status: 'Draft',
  };
}

export function buildRptReportDefinition(
  analysis: RptImportAnalysis,
  options: ImportedReportOptions,
): ClassicReportDefinition {
  const metadata = analysis.metadata ?? {};
  const orientation = metadata.orientation === 'portrait' || metadata.orientation === 'landscape'
    ? metadata.orientation
    : options.orientation;
  const defaultWidth = orientation === 'landscape' ? 297 : 210;
  const defaultHeight = orientation === 'landscape' ? 210 : 297;
  const widthMm = numberOr(metadata.widthMm, defaultWidth);
  const heightMm = numberOr(metadata.heightMm, defaultHeight);
  const pageWidth = numberOr(metadata.pageWidth, Math.round(widthMm * PX_PER_MM));
  const pageHeight = numberOr(metadata.pageHeight, Math.round(heightMm * PX_PER_MM));
  const sections = (analysis.sections ?? []).map(normalizeSection);
  if (sections.length === 0) {
    sections.push({
      id: 'details',
      name: 'Details',
      height: pageHeight,
      heightMm,
      type: 'detail',
      bandType: 'detail',
      visible: true,
    });
  }
  const imageMap = embeddedImageMap(analysis.images);
  const sectionHeights = new Map(sections.map((section) => [section.id, section.height]));
  const elements = (analysis.elements ?? [])
    .map((element, index) => normalizeElement(element, index, sections[0].id, imageMap))
    .filter((element) => {
      if (element.type !== 'line' || element.visible === false) return true;
      const sectionHeight = sectionHeights.get(element.sectionId) ?? 0;
      const isVertical = element.height >= Math.max(24, element.width * 4);
      // A Crystal object cannot legitimately extend through several bands.
      // Portable extraction can occasionally misread binary coordinates and
      // create a page-long vertical separator; discard only that impossible case.
      return !(isVertical && sectionHeight > 0 && element.height > sectionHeight + 4);
    });
  bindEmbeddedSubreportData(sections, elements, options.fieldCatalog);
  bindImportedFieldsToCatalog(sections, elements, options.fieldCatalog);
  const parameters = detectedParameters(analysis.parametersDetected);
  const margins = metadata.margins && typeof metadata.margins === 'object'
    ? metadata.margins as UnknownRecord
    : {};

  return {
    reportId: options.reportId,
    reportName: options.reportName,
    reportCode: options.reportId,
    layoutVersion: 0,
    schemaVersion: 3,
    paperSize: pageSize(String(metadata.paperSize || options.paperSize)),
    orientation,
    widthMm,
    heightMm,
    pageWidth,
    pageHeight,
    margins: {
      top: numberOr(margins.top, 10),
      right: numberOr(margins.right, 10),
      bottom: numberOr(margins.bottom, 10),
      left: numberOr(margins.left, 10),
    },
    recordsPerPage: 1,
    coordinateMode: 'page',
    sections,
    elements,
    ...(options.fieldCatalog?.length ? { fieldCatalog: options.fieldCatalog } : {}),
    ...(options.referencePdf ? { sourceAssets: { referencePdf: options.referencePdf } } : {}),
    ntis: reportMetadata(options, parameters),
  };
}


export function buildPdfReportDefinition(
  layout: PdfImportLayout,
  options: ImportedReportOptions,
): ClassicReportDefinition {
  const widthMm = numberOr(layout.widthMm, options.orientation === 'landscape' ? 297 : 210);
  const heightMm = numberOr(layout.heightMm, options.orientation === 'landscape' ? 210 : 297);
  const pageWidth = numberOr(layout.pageWidth, Math.round(widthMm * PX_PER_MM));
  const pageHeight = numberOr(layout.pageHeight, Math.round(heightMm * PX_PER_MM));
  const orientation = widthMm > heightMm ? 'landscape' : 'portrait';
  const sectionId = 'details';
  const items = Array.isArray(layout.items) ? layout.items.slice(0, 3_000) : [];
  const graphics = pdfGraphicElements(layout.graphics, sectionId);
  const useOcrOverlay = layout.extractionMode === 'ocr'
    && (layout.graphics ?? []).some((graphic) => graphic.type === 'image' && graphic.locked);
  const dynamicElements = dynamicPdfElements(
    items,
    sectionId,
    options.fieldCatalog,
    options.sampleData,
    useOcrOverlay,
  );
  const dynamicMasks = useOcrOverlay ? pdfOcrMaskElements(dynamicElements, sectionId) : [];
  const elements = [...graphics, ...dynamicMasks, ...dynamicElements];

  return {
    reportId: options.reportId,
    reportName: options.reportName,
    reportCode: options.reportId,
    layoutVersion: 0,
    schemaVersion: 3,
    paperSize: pageSize(options.paperSize),
    orientation,
    widthMm,
    heightMm,
    pageWidth,
    pageHeight,
    margins: { top: 0, right: 0, bottom: 0, left: 0 },
    recordsPerPage: 1,
    coordinateMode: 'page',
    sections: [{
      id: sectionId,
      name: 'Details',
      height: pageHeight,
      heightMm,
      type: 'detail',
      bandType: 'detail',
      visible: true,
    }],
    elements,
    ...(options.fieldCatalog?.length ? { fieldCatalog: options.fieldCatalog } : {}),
    ...(options.referencePdf ? { sourceAssets: { referencePdf: options.referencePdf } } : {}),
    ntis: reportMetadata(options, []),
  };
}
