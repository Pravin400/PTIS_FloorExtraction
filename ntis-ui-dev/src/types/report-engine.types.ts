import type {
  ClassicElement,
  ClassicReportDefinition,
  ClassicSection,
} from '@/lib/utils/reports/designer/classic-adapter';

export type ReportOrientation = 'portrait' | 'landscape';

export interface ReportPaperPreset {
  widthMm: number;
  heightMm: number;
  label: string;
}

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PageGeometry {
  paperSize: string;
  orientation: ReportOrientation;
  widthMm: number;
  heightMm: number;
  pageWidthMm: number;
  pageHeightMm: number;
  pageWidth: number;
  pageHeight: number;
  margins: PageMargins;
  printableWidth: number;
  printableHeight: number;
  designWidth: number;
  designHeight: number;
  usesPageCoordinates: boolean;
  printableWidthMm: number;
  printableHeightMm: number;
}

export interface WatermarkConfig {
  type?: 'text' | 'image';
  text?: string;
  imageUrl?: string;
  scale?: string;
  opacity?: number;
  washout?: boolean;
  rotation?: number;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface PageBorderConfig {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  inset?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

export interface ReportElement extends Omit<Partial<ClassicElement>, 'format'> {
  id: string;
  sectionId: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  name?: string;
  zIndex?: number;
  isHtml?: boolean;
  renderMode?: string;
  binding?: string;
  path?: string;
  displayText?: string;
  format?: string;
  [key: string]: unknown;
}

export interface ReportSection extends Omit<Partial<ClassicSection>, 'type'> {
  id: string;
  height: number;
  name?: string;
  type?: 'header' | 'detail' | 'footer' | string;
  elements?: ReportElement[];
  [key: string]: unknown;
}

export interface ReportDefinition extends Omit<Partial<ClassicReportDefinition>, 'sections' | 'elements' | 'coordinateMode'> {
  reportId?: string;
  reportName?: string;
  reportCode?: string;
  sections?: ReportSection[];
  elements?: ReportElement[];
  coordinateMode?: string;
  page?: {
    paperSize?: string;
    paper?: string;
    orientation?: string;
    widthMm?: number;
    heightMm?: number;
    margins?: Partial<PageMargins>;
  };
  reportType?: string;
  hasTable?: boolean;
  watermark?: WatermarkConfig;
  customWidthMm?: number;
  customHeightMm?: number;
  [key: string]: unknown;
}

export interface RenderOptions {
  locale?: string;
  format?: 'devanagari' | 'standard';
  extraContext?: Record<string, unknown>;
  inPlace?: boolean;
}

export interface RenderedReport {
  pagesHtml: string;
  totalPages: number;
  stylesHtml: string;
  geometry: PageGeometry;
}

export interface ElementDiagnostic {
  id: string;
  name: string;
  sectionId?: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  rightMm: number;
  bottomMm: number;
  insidePage: boolean;
  insideSection: boolean;
  overflowRightMm: number;
  overflowBottomMm: number;
  isOverlapping: boolean;
  allowOverlap: boolean;
  overlappingWith: string[];
  issueCodes: string[];
  errors: string[];
  warnings: string[];
}

export interface TableDiagnostic {
  tableId: string;
  totalWidthMm: number;
  availableWidthMm: number;
  overflowMm: string;
}

export interface ValidationIssue {
  code: string;
  elementId?: string;
  sectionId?: string;
  severity: 'error' | 'warning';
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  valid: boolean;
  errors: string[];
  warnings: Array<string | { code: string; elements: string[]; sectionId: string; message: string }>;
  issues: ValidationIssue[];
  overlaps: Array<{ code: string; elements: string[]; sectionId: string; message: string }>;
  elementDiagnostics: Record<string, ElementDiagnostic>;
  tableDiagnostics: TableDiagnostic[];
  geometry: PageGeometry;
}

export type { ClassicElement, ClassicReportDefinition, ClassicSection };
