import type { ClassicElement, ClassicReportDefinition, ClassicSection } from './classic-adapter';
import type {
  DesignerBandType,
  DesignerElementType,
  DesignerTableCell,
  DesignerTableStructure,
} from '@/types/report-designer.types';

const PX_PER_MM = 96 / 25.4;

const toMm = (pixels: number): number => Number((pixels / PX_PER_MM).toFixed(2));

export type CreatableDesignerBandType = 'pageHeader' | 'detail' | 'pageFooter';

export function updateClassicElement(
  definition: ClassicReportDefinition,
  elementId: string,
  patch: Partial<ClassicElement>
): ClassicReportDefinition {
  const synchronizedPatch: Partial<ClassicElement> = {
    ...patch,
    ...(patch.x !== undefined ? { xMm: toMm(patch.x) } : {}),
    ...(patch.y !== undefined ? { yMm: toMm(patch.y) } : {}),
    ...(patch.width !== undefined ? { widthMm: toMm(patch.width) } : {}),
    ...(patch.height !== undefined ? { heightMm: toMm(patch.height) } : {}),
  };

  return {
    ...definition,
    elements: definition.elements.map((element) =>
      element.id === elementId ? { ...element, ...synchronizedPatch } : element
    ),
  };
}

export function updateClassicElementStyles(
  definition: ClassicReportDefinition,
  elementId: string,
  patch: Record<string, string | number>
): ClassicReportDefinition {
  const element = findClassicElement(definition, elementId);
  if (!element) return definition;
  return updateClassicElement(definition, elementId, {
    styles: { ...element.styles, ...patch },
  });
}

export function findClassicElement(
  definition: ClassicReportDefinition | null,
  elementId: string | null
): ClassicElement | null {
  if (!definition || !elementId) return null;
  return definition.elements.find((element) => element.id === elementId) ?? null;
}

export const tableCellKey = (row: number, column: number): string => `${row}_${column}`;

function parseTableCellKey(key: string): { row: number; column: number } {
  const [row, column] = key.split('_').map(Number);
  return { row, column };
}

function cloneTableCell(cell: DesignerTableCell): DesignerTableCell {
  return {
    ...cell,
    ...(cell.style ? { style: { ...cell.style } } : {}),
  };
}

function defaultTableCell(row: number): DesignerTableCell {
  return {
    content: '',
    style: {
      textAlign: row === 0 ? 'center' : 'left',
      verticalAlign: 'middle',
      fontWeight: row === 0 ? 700 : 400,
      backgroundColor: row === 0 ? '#e2e8f0' : '#ffffff',
      borderColor: '#64748b',
      borderWidth: 1,
      padding: 4,
      wrap: true,
    },
  };
}

export function createDesignerTableStructure(rows = 3, cols = 3): DesignerTableStructure {
  const normalizedRows = Math.min(20, Math.max(1, Math.round(rows)));
  const normalizedColumns = Math.min(12, Math.max(1, Math.round(cols)));
  const cells: Record<string, DesignerTableCell> = {};
  for (let row = 0; row < normalizedRows; row += 1) {
    for (let column = 0; column < normalizedColumns; column += 1) {
      cells[tableCellKey(row, column)] = defaultTableCell(row);
    }
  }
  return {
    version: 1,
    rows: normalizedRows,
    cols: normalizedColumns,
    cells,
    columnWidths: Array.from({ length: normalizedColumns }, () => 80),
    rowHeights: Array.from({ length: normalizedRows }, () => 28),
  };
}

export function resizeDesignerTableStructure(
  table: DesignerTableStructure,
  rows: number,
  cols: number
): DesignerTableStructure {
  const resized = createDesignerTableStructure(rows, cols);
  for (let row = 0; row < resized.rows; row += 1) {
    for (let column = 0; column < resized.cols; column += 1) {
      const key = tableCellKey(row, column);
      if (table.cells[key] && !table.cells[key].mergedInto) {
        resized.cells[key] = {
          ...table.cells[key],
          rowSpan: Math.min(table.cells[key].rowSpan ?? 1, resized.rows - row),
          colSpan: Math.min(table.cells[key].colSpan ?? 1, resized.cols - column),
        };
      }
    }
  }
  resized.columnWidths = resized.columnWidths.map(
    (width, index) => table.columnWidths[index] ?? width
  );
  resized.rowHeights = resized.rowHeights.map((height, index) => table.rowHeights[index] ?? height);
  return normalizeDesignerTableStructure(resized);
}

export function updateDesignerTableCell(
  table: DesignerTableStructure,
  row: number,
  column: number,
  content: string
): DesignerTableStructure {
  const key = tableCellKey(row, column);
  if (row < 0 || column < 0 || row >= table.rows || column >= table.cols || !table.cells[key]) {
    return table;
  }
  return {
    ...table,
    cells: {
      ...table.cells,
      [key]: { ...table.cells[key], content },
    },
  };
}

export function updateDesignerTableCellStyle(
  table: DesignerTableStructure,
  row: number,
  column: number,
  patch: Partial<NonNullable<DesignerTableCell['style']>>
): DesignerTableStructure {
  const key = tableCellKey(row, column);
  if (row < 0 || column < 0 || row >= table.rows || column >= table.cols || !table.cells[key]) {
    return table;
  }
  return {
    ...table,
    cells: {
      ...table.cells,
      [key]: {
        ...table.cells[key],
        style: {
          ...table.cells[key].style,
          ...patch,
        },
      },
    },
  };
}

export function normalizeDesignerTableStructure(
  table: DesignerTableStructure
): DesignerTableStructure {
  const rows = Math.min(20, Math.max(1, Math.round(table.rows)));
  const cols = Math.min(12, Math.max(1, Math.round(table.cols)));
  const cells: Record<string, DesignerTableCell> = {};

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < cols; column += 1) {
      const key = tableCellKey(row, column);
      const source = table.cells[key];
      cells[key] = source ? cloneTableCell(source) : defaultTableCell(row);
      cells[key].hidden = false;
      delete cells[key].mergedInto;
      cells[key].rowSpan = 1;
      cells[key].colSpan = 1;
    }
  }

  const occupied = new Set<string>();
  const anchors = Object.entries(table.cells)
    .map(([key, cell]) => ({ key, cell, ...parseTableCellKey(key) }))
    .filter(
      ({ cell, row, column }) =>
        !cell.hidden && row >= 0 && row < rows && column >= 0 && column < cols
    )
    .sort((left, right) => left.row - right.row || left.column - right.column);

  anchors.forEach(({ key, cell, row, column }) => {
    if (occupied.has(key)) return;
    const rowSpan = Math.min(Math.max(1, Number(cell.rowSpan) || 1), rows - row);
    const colSpan = Math.min(Math.max(1, Number(cell.colSpan) || 1), cols - column);
    const coverage: string[] = [];
    for (let currentRow = row; currentRow < row + rowSpan; currentRow += 1) {
      for (let currentColumn = column; currentColumn < column + colSpan; currentColumn += 1) {
        coverage.push(tableCellKey(currentRow, currentColumn));
      }
    }
    if (coverage.some((coveredKey) => occupied.has(coveredKey))) return;

    cells[key] = {
      ...cells[key],
      ...cloneTableCell(cell),
      hidden: false,
      rowSpan,
      colSpan,
    };
    delete cells[key].mergedInto;
    coverage.forEach((coveredKey) => {
      occupied.add(coveredKey);
      if (coveredKey === key) return;
      cells[coveredKey] = {
        ...cells[coveredKey],
        hidden: true,
        mergedInto: key,
        rowSpan: 1,
        colSpan: 1,
      };
    });
  });

  return {
    version: 1,
    rows,
    cols,
    cells,
    columnWidths: Array.from({ length: cols }, (_, index) =>
      Math.max(30, Number(table.columnWidths[index]) || 80)
    ),
    rowHeights: Array.from({ length: rows }, (_, index) =>
      Math.max(20, Number(table.rowHeights[index]) || 28)
    ),
  };
}

export function designerTableAnchorKey(table: DesignerTableStructure, key: string): string {
  const normalized = table.cells[key];
  return normalized?.hidden && normalized.mergedInto ? normalized.mergedInto : key;
}

export function designerTableCellCoverage(table: DesignerTableStructure, key: string): string[] {
  const anchorKey = designerTableAnchorKey(table, key);
  const anchor = table.cells[anchorKey];
  if (!anchor) return [];
  const { row, column } = parseTableCellKey(anchorKey);
  const rowSpan = Math.max(1, Number(anchor.rowSpan) || 1);
  const colSpan = Math.max(1, Number(anchor.colSpan) || 1);
  const coverage: string[] = [];
  for (let currentRow = row; currentRow < Math.min(table.rows, row + rowSpan); currentRow += 1) {
    for (
      let currentColumn = column;
      currentColumn < Math.min(table.cols, column + colSpan);
      currentColumn += 1
    ) {
      coverage.push(tableCellKey(currentRow, currentColumn));
    }
  }
  return coverage;
}

export function designerTableRectangleKeys(startKey: string, endKey: string): string[] {
  const start = parseTableCellKey(startKey);
  const end = parseTableCellKey(endKey);
  if (![start.row, start.column, end.row, end.column].every(Number.isFinite)) return [];
  const keys: string[] = [];
  for (let row = Math.min(start.row, end.row); row <= Math.max(start.row, end.row); row += 1) {
    for (
      let column = Math.min(start.column, end.column);
      column <= Math.max(start.column, end.column);
      column += 1
    ) {
      keys.push(tableCellKey(row, column));
    }
  }
  return keys;
}

function visibleTableAnchors(table: DesignerTableStructure) {
  return Object.entries(table.cells)
    .filter(([, cell]) => !cell.hidden)
    .map(([key, cell]) => ({ key, cell, ...parseTableCellKey(key) }));
}

export function mergeDesignerTableCells(
  table: DesignerTableStructure,
  selectedKeys: string[]
): DesignerTableStructure {
  const normalized = normalizeDesignerTableStructure(table);
  const selected = new Set(selectedKeys.filter((key) => Boolean(normalized.cells[key])));
  if (selected.size < 2) return normalized;

  const points = [...selected].map(parseTableCellKey);
  const top = Math.min(...points.map(({ row }) => row));
  const bottom = Math.max(...points.map(({ row }) => row));
  const left = Math.min(...points.map(({ column }) => column));
  const right = Math.max(...points.map(({ column }) => column));
  const rectangle = designerTableRectangleKeys(
    tableCellKey(top, left),
    tableCellKey(bottom, right)
  );
  if (rectangle.some((key) => !selected.has(key))) return normalized;

  const selectedRectangle = new Set(rectangle);
  const anchors = visibleTableAnchors(normalized);
  const cutsExistingMerge = anchors.some(({ key }) => {
    const coverage = designerTableCellCoverage(normalized, key);
    const inside = coverage.filter((coveredKey) => selectedRectangle.has(coveredKey)).length;
    return inside > 0 && inside !== coverage.length;
  });
  if (cutsExistingMerge) return normalized;

  let prepared = {
    ...normalized,
    cells: Object.fromEntries(
      Object.entries(normalized.cells).map(([key, cell]) => [key, cloneTableCell(cell)])
    ),
  };
  anchors.forEach(({ key }) => {
    const coverage = designerTableCellCoverage(normalized, key);
    if (coverage.every((coveredKey) => selectedRectangle.has(coveredKey))) {
      prepared.cells[key].rowSpan = 1;
      prepared.cells[key].colSpan = 1;
    }
  });
  prepared = normalizeDesignerTableStructure(prepared);
  const anchorKey = tableCellKey(top, left);
  prepared.cells[anchorKey].rowSpan = bottom - top + 1;
  prepared.cells[anchorKey].colSpan = right - left + 1;
  return normalizeDesignerTableStructure(prepared);
}

export function unmergeDesignerTableCell(
  table: DesignerTableStructure,
  cellKey: string
): DesignerTableStructure {
  const normalized = normalizeDesignerTableStructure(table);
  const anchorKey = designerTableAnchorKey(normalized, cellKey);
  const anchor = normalized.cells[anchorKey];
  if (!anchor || ((anchor.rowSpan ?? 1) === 1 && (anchor.colSpan ?? 1) === 1)) {
    return normalized;
  }
  const next = {
    ...normalized,
    cells: Object.fromEntries(
      Object.entries(normalized.cells).map(([key, cell]) => [key, cloneTableCell(cell)])
    ),
  };
  next.cells[anchorKey].rowSpan = 1;
  next.cells[anchorKey].colSpan = 1;
  return normalizeDesignerTableStructure(next);
}

export function insertDesignerTableRow(
  table: DesignerTableStructure,
  requestedIndex: number
): DesignerTableStructure {
  const oldTable = normalizeDesignerTableStructure(table);
  if (oldTable.rows >= 20) return oldTable;
  const index = Math.max(0, Math.min(oldTable.rows, Math.round(requestedIndex)));
  const cells: Record<string, DesignerTableCell> = {};
  for (let row = 0; row < oldTable.rows; row += 1) {
    for (let column = 0; column < oldTable.cols; column += 1) {
      const targetRow = row >= index ? row + 1 : row;
      const cell = cloneTableCell(oldTable.cells[tableCellKey(row, column)]);
      cell.hidden = false;
      delete cell.mergedInto;
      cell.rowSpan = 1;
      cell.colSpan = 1;
      cells[tableCellKey(targetRow, column)] = cell;
    }
  }
  for (let column = 0; column < oldTable.cols; column += 1) {
    cells[tableCellKey(index, column)] = defaultTableCell(index);
  }

  visibleTableAnchors(oldTable).forEach(({ row, column, cell }) => {
    const originalSpan = Math.max(1, Number(cell.rowSpan) || 1);
    const targetRow = row >= index ? row + 1 : row;
    const rowSpan = originalSpan + (row < index && index < row + originalSpan ? 1 : 0);
    cells[tableCellKey(targetRow, column)] = {
      ...cloneTableCell(cell),
      hidden: false,
      rowSpan,
      colSpan: Math.max(1, Number(cell.colSpan) || 1),
    };
    delete cells[tableCellKey(targetRow, column)].mergedInto;
  });

  const rowHeights = [...oldTable.rowHeights];
  rowHeights.splice(index, 0, 28);
  return normalizeDesignerTableStructure({
    ...oldTable,
    rows: oldTable.rows + 1,
    cells,
    rowHeights,
  });
}

export function insertDesignerTableColumn(
  table: DesignerTableStructure,
  requestedIndex: number
): DesignerTableStructure {
  const oldTable = normalizeDesignerTableStructure(table);
  if (oldTable.cols >= 12) return oldTable;
  const index = Math.max(0, Math.min(oldTable.cols, Math.round(requestedIndex)));
  const cells: Record<string, DesignerTableCell> = {};
  for (let row = 0; row < oldTable.rows; row += 1) {
    for (let column = 0; column < oldTable.cols; column += 1) {
      const targetColumn = column >= index ? column + 1 : column;
      const cell = cloneTableCell(oldTable.cells[tableCellKey(row, column)]);
      cell.hidden = false;
      delete cell.mergedInto;
      cell.rowSpan = 1;
      cell.colSpan = 1;
      cells[tableCellKey(row, targetColumn)] = cell;
    }
  }
  for (let row = 0; row < oldTable.rows; row += 1) {
    cells[tableCellKey(row, index)] = defaultTableCell(row);
  }

  visibleTableAnchors(oldTable).forEach(({ row, column, cell }) => {
    const originalSpan = Math.max(1, Number(cell.colSpan) || 1);
    const targetColumn = column >= index ? column + 1 : column;
    const colSpan = originalSpan + (column < index && index < column + originalSpan ? 1 : 0);
    cells[tableCellKey(row, targetColumn)] = {
      ...cloneTableCell(cell),
      hidden: false,
      rowSpan: Math.max(1, Number(cell.rowSpan) || 1),
      colSpan,
    };
    delete cells[tableCellKey(row, targetColumn)].mergedInto;
  });

  const columnWidths = [...oldTable.columnWidths];
  columnWidths.splice(index, 0, 80);
  return normalizeDesignerTableStructure({
    ...oldTable,
    cols: oldTable.cols + 1,
    cells,
    columnWidths,
  });
}

export function deleteDesignerTableRow(
  table: DesignerTableStructure,
  index: number
): DesignerTableStructure {
  const oldTable = normalizeDesignerTableStructure(table);
  if (oldTable.rows <= 1 || index < 0 || index >= oldTable.rows) return oldTable;
  const cells: Record<string, DesignerTableCell> = {};
  for (let row = 0; row < oldTable.rows; row += 1) {
    if (row === index) continue;
    for (let column = 0; column < oldTable.cols; column += 1) {
      const targetRow = row > index ? row - 1 : row;
      const cell = cloneTableCell(oldTable.cells[tableCellKey(row, column)]);
      cell.hidden = false;
      delete cell.mergedInto;
      cell.rowSpan = 1;
      cell.colSpan = 1;
      cells[tableCellKey(targetRow, column)] = cell;
    }
  }

  visibleTableAnchors(oldTable).forEach(({ row, column, cell }) => {
    const oldSpan = Math.max(1, Number(cell.rowSpan) || 1);
    const containsDeletedRow = index >= row && index < row + oldSpan;
    if (containsDeletedRow && oldSpan === 1) return;
    const targetRow = row > index ? row - 1 : row === index ? index : row;
    const rowSpan = containsDeletedRow ? oldSpan - 1 : oldSpan;
    if (targetRow >= oldTable.rows - 1 || rowSpan < 1) return;
    cells[tableCellKey(targetRow, column)] = {
      ...cloneTableCell(cell),
      hidden: false,
      rowSpan,
      colSpan: Math.max(1, Number(cell.colSpan) || 1),
    };
    delete cells[tableCellKey(targetRow, column)].mergedInto;
  });

  return normalizeDesignerTableStructure({
    ...oldTable,
    rows: oldTable.rows - 1,
    cells,
    rowHeights: oldTable.rowHeights.filter((_, row) => row !== index),
  });
}

export function deleteDesignerTableColumn(
  table: DesignerTableStructure,
  index: number
): DesignerTableStructure {
  const oldTable = normalizeDesignerTableStructure(table);
  if (oldTable.cols <= 1 || index < 0 || index >= oldTable.cols) return oldTable;
  const cells: Record<string, DesignerTableCell> = {};
  for (let row = 0; row < oldTable.rows; row += 1) {
    for (let column = 0; column < oldTable.cols; column += 1) {
      if (column === index) continue;
      const targetColumn = column > index ? column - 1 : column;
      const cell = cloneTableCell(oldTable.cells[tableCellKey(row, column)]);
      cell.hidden = false;
      delete cell.mergedInto;
      cell.rowSpan = 1;
      cell.colSpan = 1;
      cells[tableCellKey(row, targetColumn)] = cell;
    }
  }

  visibleTableAnchors(oldTable).forEach(({ row, column, cell }) => {
    const oldSpan = Math.max(1, Number(cell.colSpan) || 1);
    const containsDeletedColumn = index >= column && index < column + oldSpan;
    if (containsDeletedColumn && oldSpan === 1) return;
    const targetColumn = column > index ? column - 1 : column === index ? index : column;
    const colSpan = containsDeletedColumn ? oldSpan - 1 : oldSpan;
    if (targetColumn >= oldTable.cols - 1 || colSpan < 1) return;
    cells[tableCellKey(row, targetColumn)] = {
      ...cloneTableCell(cell),
      hidden: false,
      rowSpan: Math.max(1, Number(cell.rowSpan) || 1),
      colSpan,
    };
    delete cells[tableCellKey(row, targetColumn)].mergedInto;
  });

  return normalizeDesignerTableStructure({
    ...oldTable,
    cols: oldTable.cols - 1,
    cells,
    columnWidths: oldTable.columnWidths.filter((_, column) => column !== index),
  });
}

export function splitDesignerTableCell(
  table: DesignerTableStructure,
  cellKey: string,
  axis: 'rows' | 'columns',
  requestedParts = 2
): DesignerTableStructure {
  let working = normalizeDesignerTableStructure(table);
  const anchorKey = designerTableAnchorKey(working, cellKey);
  const { row, column } = parseTableCellKey(anchorKey);
  const source = working.cells[anchorKey];
  if (!source) return working;
  const originalRowSpan = Math.max(1, Number(source.rowSpan) || 1);
  const originalColSpan = Math.max(1, Number(source.colSpan) || 1);
  const originalSpan = axis === 'rows' ? originalRowSpan : originalColSpan;
  const currentDimension = axis === 'rows' ? working.rows : working.cols;
  const dimensionLimit = axis === 'rows' ? 20 : 12;
  const maximumParts = originalSpan + (dimensionLimit - currentDimension);
  if (maximumParts < 2) return working;
  const parts = Math.max(2, Math.min(maximumParts, Math.round(requestedParts)));
  const originalStyle = source.style ? { ...source.style } : undefined;

  if (axis === 'rows') {
    for (let count = originalRowSpan; count < parts; count += 1) {
      working = insertDesignerTableRow(working, row + count);
    }
  } else {
    for (let count = originalColSpan; count < parts; count += 1) {
      working = insertDesignerTableColumn(working, column + count);
    }
  }

  working = unmergeDesignerTableCell(working, tableCellKey(row, column));
  const totalSpan =
    axis === 'rows' ? Math.max(originalRowSpan, parts) : Math.max(originalColSpan, parts);
  const baseSpan = Math.floor(totalSpan / parts);
  const remainder = totalSpan % parts;
  let offset = 0;
  const cells = Object.fromEntries(
    Object.entries(working.cells).map(([key, cell]) => [key, cloneTableCell(cell)])
  );
  for (let part = 0; part < parts; part += 1) {
    const span = baseSpan + (part < remainder ? 1 : 0);
    const targetRow = row + (axis === 'rows' ? offset : 0);
    const targetColumn = column + (axis === 'columns' ? offset : 0);
    const key = tableCellKey(targetRow, targetColumn);
    cells[key] = {
      ...cells[key],
      ...(originalStyle ? { style: { ...originalStyle } } : {}),
      hidden: false,
      rowSpan: axis === 'rows' ? span : originalRowSpan,
      colSpan: axis === 'columns' ? span : originalColSpan,
    };
    delete cells[key].mergedInto;
    offset += span;
  }
  return normalizeDesignerTableStructure({ ...working, cells });
}

export function resizeDesignerTableColumn(
  table: DesignerTableStructure,
  column: number,
  width: number
): DesignerTableStructure {
  if (column < 0 || column >= table.cols) return table;
  const columnWidths = [...table.columnWidths];
  columnWidths[column] = Math.max(30, Math.round(width));
  return { ...table, columnWidths };
}

export function resizeDesignerTableRow(
  table: DesignerTableStructure,
  row: number,
  height: number
): DesignerTableStructure {
  if (row < 0 || row >= table.rows) return table;
  const rowHeights = [...table.rowHeights];
  rowHeights[row] = Math.max(20, Math.round(height));
  return { ...table, rowHeights };
}

export function updateClassicElementTable(
  definition: ClassicReportDefinition,
  elementId: string,
  table: DesignerTableStructure
): ClassicReportDefinition {
  const width = table.columnWidths.reduce((sum, value) => sum + value, 0);
  const height = table.rowHeights.reduce((sum, value) => sum + value, 0);
  return updateClassicElement(definition, elementId, {
    table,
    rows: table.rows,
    cols: table.cols,
    tableCells: table.cells,
    cellData: Object.fromEntries(
      Object.entries(table.cells).map(([key, cell]) => [key, cell.content])
    ),
    columnWidths: table.columnWidths,
    rowHeights: table.rowHeights,
    width,
    height,
  });
}

function elementId(type: DesignerElementType): string {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createClassicElement(type: DesignerElementType, sectionId: string): ClassicElement {
  const classicType = type === 'rectangle' ? 'box' : type;
  const table = type === 'table' ? createDesignerTableStructure() : undefined;
  const width = type === 'table' ? 240 : type === 'line' ? 160 : type === 'image' ? 90 : 140;
  const height = type === 'table' ? 84 : type === 'line' ? 8 : type === 'image' ? 70 : 32;
  const text = type === 'text' ? 'Text' : type === 'field' ? '{FieldName}' : undefined;

  return {
    id: elementId(type),
    sectionId,
    type: classicType,
    designerType: type,
    x: 12,
    y: 12,
    width,
    height,
    xMm: toMm(12),
    yMm: toMm(12),
    widthMm: toMm(width),
    heightMm: toMm(height),
    ...(text !== undefined ? { text } : {}),
    ...(table
      ? {
          table,
          rows: table.rows,
          cols: table.cols,
          tableCells: table.cells,
          cellData: Object.fromEntries(
            Object.entries(table.cells).map(([key, cell]) => [key, cell.content])
          ),
          columnWidths: table.columnWidths,
          rowHeights: table.rowHeights,
        }
      : {}),
    styles:
      type === 'rectangle'
        ? { border: '1px solid #334155', borderColor: '#334155', borderWidth: 1 }
        : type === 'line'
          ? { borderColor: '#334155', borderWidth: 1 }
          : { fontFamily: 'Noto Sans Devanagari', fontSize: '12px', color: '#172033' },
    visible: true,
  };
}

export function appendClassicElement(
  definition: ClassicReportDefinition,
  element: ClassicElement
): ClassicReportDefinition {
  return { ...definition, elements: [...definition.elements, element] };
}

function sectionType(bandType: DesignerBandType): ClassicSection['type'] {
  if (bandType === 'detail' || bandType === 'subreport') return 'detail';
  if (bandType === 'pageFooter' || bandType === 'reportFooter' || bandType === 'groupFooter') {
    return 'footer';
  }
  return 'header';
}

export function createClassicSection(
  bandType: CreatableDesignerBandType,
  name: string
): ClassicSection {
  const height = bandType === 'detail' ? 220 : bandType === 'pageHeader' ? 90 : 70;
  return {
    id: `${bandType}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    height,
    heightMm: toMm(height),
    type: sectionType(bandType),
    bandType,
    ...(bandType === 'pageHeader' ? { repeatOnPageBreak: true } : {}),
    visible: true,
  };
}

export function appendClassicSection(
  definition: ClassicReportDefinition,
  section: ClassicSection
): ClassicReportDefinition {
  const order: Record<ClassicSection['type'], number> = { header: 0, detail: 1, footer: 2 };
  const sections = [...definition.sections, section].sort(
    (left, right) => order[left.type] - order[right.type]
  );
  return { ...definition, sections };
}

export function updateClassicSection(
  definition: ClassicReportDefinition,
  sectionId: string,
  patch: Partial<ClassicSection>
): ClassicReportDefinition {
  const synchronizedPatch: Partial<ClassicSection> = {
    ...patch,
    ...(patch.height !== undefined
      ? { height: Math.max(1, patch.height), heightMm: toMm(Math.max(1, patch.height)) }
      : {}),
  };
  return {
    ...definition,
    sections: definition.sections.map((section) =>
      section.id === sectionId ? { ...section, ...synchronizedPatch } : section
    ),
  };
}

export function removeClassicSection(
  definition: ClassicReportDefinition,
  sectionId: string
): ClassicReportDefinition {
  if (definition.sections.length <= 1) return definition;
  return {
    ...definition,
    sections: definition.sections.filter((section) => section.id !== sectionId),
    elements: definition.elements.filter((element) => element.sectionId !== sectionId),
  };
}

export function bindClassicField(
  definition: ClassicReportDefinition,
  fieldName: string,
  sectionId: string,
  selectedElementId?: string | null,
  selectedCellKey?: string | null
): { definition: ClassicReportDefinition; element: ClassicElement | null } {
  if (!fieldName || !definition.sections.some((section) => section.id === sectionId)) {
    return { definition, element: null };
  }

  const selectedElement = findClassicElement(definition, selectedElementId ?? null);
  const selectedType = selectedElement?.designerType || selectedElement?.type;

  if (selectedElement && selectedType === 'table' && selectedElement.table) {
    const [rowStr, colStr] = (selectedCellKey ?? '0_0').split('_');
    const row = Number(rowStr) || 0;
    const col = Number(colStr) || 0;
    const updatedTable = updateDesignerTableCell(selectedElement.table, row, col, `{${fieldName}}`);
    const nextDef = updateClassicElementTable(definition, selectedElement.id, updatedTable);
    return {
      definition: nextDef,
      element: findClassicElement(nextDef, selectedElement.id),
    };
  }

  if (selectedElement && selectedType && ['field', 'text', 'formula'].includes(selectedType)) {
    return {
      definition: updateClassicElement(definition, selectedElement.id, {
        fieldName,
        text: `{${fieldName}}`,
      }),
      element: { ...selectedElement, fieldName, text: `{${fieldName}}` },
    };
  }

  const element = {
    ...createClassicElement('field', sectionId),
    fieldName,
    text: `{${fieldName}}`,
  };
  return {
    definition: appendClassicElement(definition, element),
    element,
  };
}

export function removeClassicElement(
  definition: ClassicReportDefinition,
  elementIdToRemove: string
): ClassicReportDefinition {
  return {
    ...definition,
    elements: definition.elements.filter((element) => element.id !== elementIdToRemove),
  };
}

export function duplicateClassicElement(
  definition: ClassicReportDefinition,
  elementIdToDuplicate: string
): { definition: ClassicReportDefinition; element: ClassicElement | null } {
  const source = findClassicElement(definition, elementIdToDuplicate);
  if (!source) return { definition, element: null };
  const clone = JSON.parse(JSON.stringify(source)) as ClassicElement;
  clone.id = elementId(source.designerType);
  clone.x = source.x + 8;
  clone.y = source.y + 8;
  clone.xMm = toMm(clone.x);
  clone.yMm = toMm(clone.y);
  return {
    definition: appendClassicElement(definition, clone),
    element: clone,
  };
}

export interface ClassicPaperSizeInfo {
  widthMm: number;
  heightMm: number;
  label: string;
}

export const CLASSIC_PAPER_SIZES: Record<string, ClassicPaperSizeInfo> = {
  A3: { widthMm: 297, heightMm: 420, label: 'A3 (297 x 420 mm)' },
  A4: { widthMm: 210, heightMm: 297, label: 'A4 (210 x 297 mm)' },
  A5: { widthMm: 148, heightMm: 210, label: 'A5 (148 x 210 mm)' },
  A6: { widthMm: 105, heightMm: 148, label: 'A6 (105 x 148 mm)' },
  Letter: { widthMm: 215.9, heightMm: 279.4, label: 'Letter (8.5 x 11 in)' },
  Legal: { widthMm: 215.9, heightMm: 355.6, label: 'Legal (8.5 x 14 in)' },
  Tabloid: { widthMm: 279.4, heightMm: 431.8, label: 'Tabloid (11 x 17 in)' },
  Custom: { widthMm: 210, heightMm: 297, label: 'Custom' },
};

export interface PageSetupOptions {
  paperSize?: string;
  orientation?: 'portrait' | 'landscape';
  margins?: { top?: number; right?: number; bottom?: number; left?: number };
  pageColor?: string;
  customWidthMm?: number;
  customHeightMm?: number;
}

export function updateClassicPageSetup(
  definition: ClassicReportDefinition,
  options: PageSetupOptions
): ClassicReportDefinition {
  const paperKey = options.paperSize ?? definition.paperSize ?? 'A4';
  const orientation = options.orientation ?? definition.orientation ?? 'portrait';
  const isLandscape = orientation.toLowerCase() === 'landscape';

  let baseW = 210;
  let baseH = 297;

  if (paperKey === 'Custom') {
    baseW = options.customWidthMm ?? definition.widthMm ?? 210;
    baseH = options.customHeightMm ?? definition.heightMm ?? 297;
  } else {
    const paper = CLASSIC_PAPER_SIZES[paperKey] ?? CLASSIC_PAPER_SIZES['A4'];
    baseW = paper.widthMm;
    baseH = paper.heightMm;
  }

  const widthMm = isLandscape ? Math.max(baseW, baseH) : Math.min(baseW, baseH);
  const heightMm = isLandscape ? Math.min(baseW, baseH) : Math.max(baseW, baseH);
  const pageWidth = Math.round(widthMm * PX_PER_MM);
  const pageHeight = Math.round(heightMm * PX_PER_MM);

  const updatedMargins = {
    top:
      options.margins?.top !== undefined
        ? Math.max(0, options.margins.top)
        : (definition.margins?.top ?? 10),
    right:
      options.margins?.right !== undefined
        ? Math.max(0, options.margins.right)
        : (definition.margins?.right ?? 10),
    bottom:
      options.margins?.bottom !== undefined
        ? Math.max(0, options.margins.bottom)
        : (definition.margins?.bottom ?? 10),
    left:
      options.margins?.left !== undefined
        ? Math.max(0, options.margins.left)
        : (definition.margins?.left ?? 10),
  };

  return {
    ...definition,
    paperSize: paperKey,
    orientation: isLandscape ? 'landscape' : 'portrait',
    widthMm,
    heightMm,
    pageWidth,
    pageHeight,
    pageColor: options.pageColor !== undefined ? options.pageColor : definition.pageColor,
    margins: updatedMargins,
  };
}
