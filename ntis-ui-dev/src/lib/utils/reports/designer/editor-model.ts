import {
  createBlankClassicReportDefinition,
  type ClassicElement,
  type ClassicReportDefinition,
  type ClassicSection,
} from './classic-adapter';
import type { DesignerElementType, DesignerTableStructure } from '@/types/report-designer.types';
import { PAPER_SIZES } from '@/lib/utils/reports/engine/geometry';

export const PX_PER_MM = 96 / 25.4;
export const toMm = (pixels: number) => Number((pixels / PX_PER_MM).toFixed(3));
export const uid = () => crypto.randomUUID();
export const PAPER_PRESETS: Record<string, [number, number]> = Object.fromEntries(Object.entries(PAPER_SIZES).filter(([name]) => name !== 'Custom').map(([name, value]) => [name, [value.widthMm, value.heightMm]]));

export function resizePage(
  def: ClassicReportDefinition,
  paperSize: string,
  orientation: 'portrait' | 'landscape',
  custom?: [number, number]
) {
  const [a, b] = custom || PAPER_PRESETS[paperSize] || [def.widthMm, def.heightMm];
  const [widthMm, heightMm] =
    orientation === 'landscape'
      ? [Math.max(a, b), Math.min(a, b)]
      : [Math.min(a, b), Math.max(a, b)];
  return {
    ...def,
    paperSize,
    orientation,
    widthMm,
    heightMm,
    pageWidth: Math.round(widthMm * PX_PER_MM),
    pageHeight: Math.round(heightMm * PX_PER_MM),
  };
}

export function updateGeometry(
  element: ClassicElement,
  updates: Partial<ClassicElement>
): ClassicElement {
  const next = { ...element, ...updates };
  return {
    ...next,
    xMm: toMm(next.x),
    yMm: toMm(next.y),
    widthMm: toMm(next.width),
    heightMm: toMm(next.height),
  };
}

export function createTable(rows = 3, cols = 4, width = 360): DesignerTableStructure {
  const cells: DesignerTableStructure['cells'] = {};
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      cells[`${r}_${c}`] = {
        content: '',
        style: { borderWidth: 1, borderColor: '#0891b2', fontSize: 10, padding: 2 },
      };
  return {
    version: 1,
    rows,
    cols,
    cells,
    columnWidths: Array(cols).fill(width / cols),
    rowHeights: Array(rows).fill(28),
  };
}

export function newElement(
  type: DesignerElementType,
  sectionId: string,
  x = 20,
  y = 20,
  fieldName?: string
): ClassicElement {
  const shape = ['rectangle', 'square', 'circle', 'container'].includes(type);
  const width = type === 'table' ? 360 : type === 'image' || type === 'qr' ? 100 : 160;
  const height =
    type === 'table'
      ? 84
      : type === 'line'
        ? 1
        : shape || type === 'image' || type === 'qr'
          ? 100
          : 24;
  return updateGeometry(
    {
      id: uid(),
      sectionId,
      type: shape ? 'box' : type,
      designerType: type,
      x,
      y,
      width,
      height,
      xMm: 0,
      yMm: 0,
      widthMm: 0,
      heightMm: 0,
      visible: true,
      text: fieldName ? `{${fieldName}}` : type === 'text' ? 'New Text' : '',
      fieldName,
      styles: {
        fontFamily: 'Arial',
        fontSize: '10px',
        color: '#000000',
        padding: '0px',
        ...(shape ? { border: '1px solid #000000' } : {}),
        ...(type === 'circle' ? { borderRadius: '50%' } : {}),
      },
      ...(type === 'table' ? { table: createTable() } : {}),
    },
    {}
  );
}

export function newSection(
  bandType: ClassicSection['bandType'],
  name: string,
  dataPath?: string
): ClassicSection {
  const height = bandType === 'detail' || bandType === 'subreport' ? 30 : 50;
  return {
    id: uid(),
    name,
    bandType,
    type: bandType.includes('Footer')
      ? 'footer'
      : bandType === 'detail' || bandType === 'subreport'
        ? 'detail'
        : 'header',
    height,
    heightMm: toMm(height),
    visible: true,
    ...(dataPath ? { dataPath } : {}),
  };
}

/** Reject malformed JSON before it enters history; retain every imported extension property. */
export function readDefinition(value: unknown): ClassicReportDefinition {
  if (!value || typeof value !== 'object') throw new Error('Invalid report JSON.');
  const def = value as ClassicReportDefinition;
  if (!Array.isArray(def.sections) || !Array.isArray(def.elements) || !def.sections.length)
    throw new Error('Report sections and elements are required.');
  const sectionIds = new Set(def.sections.map((s) => s.id));
  if (
    sectionIds.size !== def.sections.length ||
    def.elements.some((e) => !sectionIds.has(e.sectionId))
  )
    throw new Error('Invalid section references.');
  if (new Set(def.elements.map((e) => e.id)).size !== def.elements.length)
    throw new Error('Duplicate element IDs.');
  if (
    def.sections.some((s) => !Number.isFinite(s.height) || s.height < 0) ||
    def.elements.some(
      (e) =>
        [e.x, e.y, e.width, e.height].some((n) => !Number.isFinite(n)) ||
        e.width < 0 ||
        e.height < 0
    )
  )
    throw new Error('Invalid report dimensions.');
  return {
    ...createBlankClassicReportDefinition(def.reportId || def.reportCode || 'CUSTOM_REPORT'),
    ...def,
  };
}

export interface EditorState {
  definition: ClassicReportDefinition;
  past: ClassicReportDefinition[];
  future: ClassicReportDefinition[];
  selected: string[];
  sectionId: string;
  saved: ClassicReportDefinition;
}
export type EditorAction =
  | { type: 'load'; definition: ClassicReportDefinition }
  | { type: 'change'; definition: ClassicReportDefinition; checkpoint?: boolean }
  | { type: 'checkpoint' }
  | { type: 'undo' | 'redo' }
  | { type: 'select'; ids: string[]; sectionId?: string }
  | { type: 'saved'; definition: ClassicReportDefinition; metadata?: Partial<ClassicReportDefinition> };
export function initialEditor(
  definition = createBlankClassicReportDefinition('CUSTOM_REPORT', 'New Report')
): EditorState {
  return {
    definition,
    past: [],
    future: [],
    selected: [],
    sectionId: definition.sections[0].id,
    saved: definition,
  };
}
export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'load':
      return initialEditor(action.definition);
    case 'select':
      return { ...state, selected: action.ids, sectionId: action.sectionId || state.sectionId };
    case 'checkpoint':
      return { ...state, past: [...state.past.slice(-49), state.definition], future: [] };
    case 'saved': {
      const saved = action.metadata ? { ...action.definition, ...action.metadata } : action.definition;
      return { ...state, saved, definition: state.definition === action.definition ? saved : action.metadata ? { ...state.definition, ...action.metadata } : state.definition };
    }
    case 'change':
      return {
        ...state,
        definition: action.definition,
        past:
          action.checkpoint === false ? state.past : [...state.past.slice(-49), state.definition],
        future: [],
      };
    case 'undo':
      return state.past.length
        ? {
            ...state,
            definition: state.past[state.past.length - 1],
            past: state.past.slice(0, -1),
            future: [state.definition, ...state.future],
            selected: [],
          }
        : state;
    case 'redo':
      return state.future.length
        ? {
            ...state,
            definition: state.future[0],
            future: state.future.slice(1),
            past: [...state.past, state.definition],
            selected: [],
          }
        : state;
  }
}
