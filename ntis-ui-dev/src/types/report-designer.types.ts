export type DesignerElementType =
  | 'text'
  | 'field'
  | 'image'
  | 'qr'
  | 'barcode'
  | 'line'
  | 'rectangle'
  | 'square'
  | 'circle'
  | 'table'
  | 'container'
  | 'signature'
  | 'watermark'
  | 'pageBreak';

export type DesignerExpression =
  | { literal: string | number | boolean | null }
  | { path: string }
  | { operator: 'equals' | 'notEquals' | 'greaterThan' | 'greaterThanOrEqual' | 'lessThan' | 'lessThanOrEqual' | 'and' | 'or' | 'not' | 'isNull' | 'isEmpty' | 'sum' | 'count' | 'min' | 'max' | 'add' | 'subtract' | 'multiply' | 'divide'; left?: DesignerExpression; right?: DesignerExpression };

export type DesignerBandType =
  | 'pageHeader'
  | 'reportHeader'
  | 'groupHeader'
  | 'detail'
  | 'groupFooter'
  | 'reportFooter'
  | 'pageFooter'
  | 'subreport';

export interface DesignerElementStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  color?: string;
  background?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  lineHeight?: number;
  opacity?: number;
  rotation?: number;
  zIndex?: number;
  objectFit?: 'contain' | 'cover' | 'fill';
}

export interface DesignerTableCellStyle {
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  padding?: number;
  wrap?: boolean;
}

export interface DesignerTableCell {
  content: string;
  rowSpan?: number;
  colSpan?: number;
  hidden?: boolean;
  mergedInto?: string;
  style?: DesignerTableCellStyle;
}

/**
 * Static designer table schema. Keys in `cells` use zero-based `row_col`
 * coordinates. Covered cells remain in JSON so splitting a merged cell can
 * restore their original content and formatting without data loss.
 */
export interface DesignerTableStructure {
  version: 1;
  rows: number;
  cols: number;
  cells: Record<string, DesignerTableCell>;
  columnWidths: number[];
  rowHeights: number[];
}

export interface DesignerElement {
  id: string;
  type: DesignerElementType;
  x: number;
  y: number;
  w: number;
  h: number;
  width?: number;
  height?: number;
  text?: string;
  label?: string;
  path?: string;
  src?: string;
  watermarkType?: 'text' | 'image';
  format?: 'date' | 'currency' | 'number' | 'text' | '0' | '0.00' | '0.##';
  columns?: Array<{ label: string; path: string; width?: number }>;
  showHeader?: boolean;
  table?: DesignerTableStructure;
  binding?: string;
  visibility?: DesignerExpression;
  properties?: Record<string, unknown>;
  children?: DesignerElement[];
  style?: DesignerElementStyle;
  isHtml?: boolean;
  renderMode?: string;
}

/**
 * A band is a vertically flowing report section. Detail bands repeat once for
 * every item at dataPath; subreport bands expand a reusable fragment against a
 * child object/collection. Element coordinates are relative to the band.
 */
export interface DesignerBand {
  id: string;
  type: DesignerBandType;
  heightMm: number;
  elements: DesignerElement[];
  dataPath?: string;
  fragmentCode?: string;
  fragmentVersion?: number;
  repeatOnPageBreak?: boolean;
  keepTogether?: boolean;
  pageBreakBefore?: boolean;
  pageBreakAfter?: boolean;
}

export interface DesignerFragment {
  code: string;
  name: string;
  version?: number;
  bands: DesignerBand[];
}

export interface DesignerFieldCatalogEntry {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'image' | 'qr' | 'object' | 'collection';
  elementType?: 'field' | 'image' | 'qr' | 'table';
  group?: string | null;
  /** Collection whose row supplies this field, for example `propertyDetails`. */
  collectionPath?: string;
}

export interface DesignerSourceAsset {
  documentGuid: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface DesignerSourceAssets {
  referencePdf?: DesignerSourceAsset;
}

export interface DesignerWatermark {
  type?: 'text' | 'image';
  text?: string;
  imageUrl?: string;
  scale?: string;
  washout?: boolean;
  opacity?: number;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  rotation?: number;
  semitransparent?: boolean;
}

export interface DesignerTemplate {
  schemaVersion?: 1 | 2 | 3;
  reportCode?: string;
  /** Maximum master/detail records rendered on one physical PDF page. */
  recordsPerPage?: number;
  /** Page overlay selected in the classic designer's Watermark menu. */
  watermark?: DesignerWatermark | null;
  page: {
    size: 'A4' | 'A5' | 'A6' | 'Letter' | 'Legal' | 'Custom' | (string & {});
    paperSize?: string;
    orientation: 'portrait' | 'landscape';
    widthMm: number;
    heightMm: number;
    background: string;
    /** Optional per-edge page frame, retained when a classic layout is saved. */
    border?: { top?: string; right?: string; bottom?: string; left?: string };
    borderInsetMm?: { top?: number; right?: number; bottom?: number; left?: number };
    margin?: { topMm: number; rightMm: number; bottomMm: number; leftMm: number };
  };
  /** Flat v1 canvas. Kept required so all existing saved templates still work. */
  elements: DesignerElement[];
  /** Flowing v2 layout used for repeating rows, pagination, and subreports. */
  bands?: DesignerBand[];
  /** Reusable child layouts referenced by a subreport band's fragmentCode. */
  fragments?: DesignerFragment[];
  /** Designer-only schema metadata inferred from a provider or sample JSON. */
  fieldCatalog?: DesignerFieldCatalogEntry[];
  /** Source documents used by the designer, stored in NTIS document storage. */
  sourceAssets?: DesignerSourceAssets;
}

export interface DesignerDataSourceField {
  path: string;
  label: string;
  elementType: 'field' | 'image' | 'qr' | 'table';
  group?: string | null;
  valueType?: 'string' | 'number' | 'date' | 'boolean' | 'image' | 'qr' | 'object' | 'collection';
  children?: DesignerDataSourceField[];
}

export interface DesignerDataSource {
  code: string;
  name: string;
  /** Canonical active ReportDefinition code used by preview/generation APIs. */
  executionReportCode?: string;
  fields: DesignerDataSourceField[];
}

export interface DesignerTemplateSummary {
  dataProviderCode: string;
  canDelete: boolean;
  sortOrder: number;
  id: number;
  reportDefinitionId: number;
  reportCode: string;
  reportName: string;
  moduleId: number | null;
  moduleCode: string;
  tenantId: number | null;
  isActive: boolean;
  dataSourceCode: string;
  publishedVersionId: number | null;
  publishedVersionNo: number | null;
  draftVersionId: number | null;
  draftVersionNo: number | null;
}

export interface DesignerTemplateVersion {
  id: number;
  versionNo: number;
  status: string;
  templateJson: string;
  createdDate: string;
  publishedDate: string | null;
}

export interface DesignerTemplateDetail {
  id: number;
  reportDefinitionId: number;
  reportCode: string;
  reportName: string;
  moduleId: number | null;
  moduleCode: string;
  tenantId: number | null;
  isActive: boolean;
  dataSourceCode: string;
  dataProviderCode: string;
  parameters: DesignerReportParameter[];
  versions: DesignerTemplateVersion[];
}

export interface DesignerReportParameter {
  id?: number | null;
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean' | string;
  isRequired: boolean;
  sortOrder: number;
  cascadeFromKey?: string | null;
  isActive?: boolean;
}

export interface DesignerReportSettings {
  templateId: number;
  reportDefinitionId: number;
  reportCode: string;
  reportName: string;
  moduleId: number | null;
  moduleName: string;
  tenantId: number | null;
  tenantScope: 'Global' | 'CurrentTenant';
  currentTenantId: number;
  isActive: boolean;
  dataSourceCode: string;
  dataProviderCode: string;
  parameters: DesignerReportParameter[];
}

export interface DesignerReportSettingsOptions {
  currentTenantId: number;
  modules: Array<{ id: number; name: string }>;
  dataProviderCodes: string[];
}

export interface DesignerReportJob {
  jobId: string;
  reportCode: string;
  status: string;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  totalChunks?: number;
  completedChunks?: number;
  currentChunk?: number;
  progressPercentage?: number;
  stage?: string;
  errorMessage: string | null;
  createdDate: string;
  completedDate: string | null;
}

export interface DesignerRuntimePayload {
  reportCode: string;
  templateVersionId: number;
  template: DesignerTemplate;
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

export interface DesignerPreviewRequest {
  reportCode: string;
  parameters: Record<string, string>;
}

export interface DesignerGenerationRequest extends DesignerPreviewRequest {
  outputMode?: 'separate' | 'merged' | 'batch';
  jobType?: 'Single' | 'Bulk';
}

export interface DesignerActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
