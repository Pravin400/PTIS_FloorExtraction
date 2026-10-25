export interface ReportElementStyles {
  fontFamily?: string;
  fontSize?: string | number;
  fontWeight?: string | number;
  fontStyle?: string;
  textDecoration?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number | string;
  borderStyle?: string;
  borderTop?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderRight?: string;
  border?: string;
  padding?: number | string;
  borderRadius?: number | string;
  zIndex?: number;
  opacity?: number;
}

export interface ReportElement {
  id: string;
  type: string;
  sectionId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  w?: number;
  h?: number;
  text?: string;
  displayText?: string;
  field?: string;
  path?: string;
  styles?: ReportElementStyles;
  table?: unknown;
}

export interface ReportSection {
  id: string;
  name: string;
  height: number;
  type?: string;
  visible?: boolean;
}

export interface ReportDefinition {
  id?: string;
  reportId?: string;
  reportName: string;
  reportCode?: string;
  paperSize?: string;
  orientation?: 'portrait' | 'landscape';
  margins?: { top: number; right: number; bottom: number; left: number };
  widthMm?: number;
  heightMm?: number;
  pageWidth?: number;
  pageHeight?: number;
  sections: ReportSection[];
  elements: ReportElement[];
  layoutVersion?: number | string;
}

export interface TableCellStyle {
  fontSize?: number;
  fontWeight?: number | string;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  padding?: number;
  wrap?: boolean;
}

export interface TableCell {
  content: string;
  rowSpan?: number
  colSpan?: number;
  hidden?: boolean;
  style?: TableCellStyle;
}

export interface TableStructure {
  rows: number;
  cols: number;
  cells: Record<string, TableCell>; // key: "r_c" e.g. "0_0"
  columnWidths: number[];
  rowHeights: number[];
}

