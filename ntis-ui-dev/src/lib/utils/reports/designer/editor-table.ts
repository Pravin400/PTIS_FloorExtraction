import type { DesignerTableStructure } from '@/types/report-designer.types';

export function mergeCells(table: DesignerTableStructure, keys: string[]): DesignerTableStructure {
  if (keys.length < 2) return table;
  const positions = keys.map((key) => key.split('_').map(Number));
  const r0 = Math.min(...positions.map((p) => p[0])),
    r1 = Math.max(...positions.map((p) => p[0]));
  const c0 = Math.min(...positions.map((p) => p[1])),
    c1 = Math.max(...positions.map((p) => p[1]));
  const cells = { ...table.cells };
  const anchor = `${r0}_${c0}`;
  for (let r = r0; r <= r1; r++)
    for (let c = c0; c <= c1; c++) {
      const cell = cells[`${r}_${c}`];
      if (cell?.hidden || (cell?.rowSpan || 1) > 1 || (cell?.colSpan || 1) > 1)
        throw new Error('Split existing merged cells before merging this selection.');
    }
  for (let r = r0; r <= r1; r++)
    for (let c = c0; c <= c1; c++) {
      const key = `${r}_${c}`;
      cells[key] =
        key === anchor
          ? { ...cells[key], rowSpan: r1 - r0 + 1, colSpan: c1 - c0 + 1 }
          : { ...cells[key], hidden: true, mergedInto: anchor };
    }
  return { ...table, cells };
}

export function splitCell(table: DesignerTableStructure, key: string): DesignerTableStructure {
  const anchor = table.cells[key]?.mergedInto || key;
  const cells = { ...table.cells };
  Object.entries(cells).forEach(([id, cell]) => {
    if (id === anchor || cell.mergedInto === anchor)
      cells[id] = { ...cell, hidden: false, mergedInto: undefined, rowSpan: 1, colSpan: 1 };
  });
  return { ...table, cells };
}

/** Insert/delete by remapping the saved cells, retaining spans and covered-cell content. */
export function changeTableAxis(
  table: DesignerTableStructure,
  axis: 'row' | 'column',
  index: number,
  remove = false
): DesignerTableStructure {
  const length = axis === 'row' ? table.rows : table.cols;
  if (remove && length <= 1) return table;
  if (index < 0 || index > length || (remove && index === length)) return table;
  const rows = table.rows + (axis === 'row' ? (remove ? -1 : 1) : 0);
  const cols = table.cols + (axis === 'column' ? (remove ? -1 : 1) : 0);
  const cells: DesignerTableStructure['cells'] = {};
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const coordinate = axis === 'row' ? r : c;
      const old = coordinate < index ? coordinate : coordinate + (remove ? 1 : -1);
      const oldKey = axis === 'row' ? `${old}_${c}` : `${r}_${old}`;
      cells[`${r}_${c}`] =
        !remove && coordinate === index
          ? { content: '', style: { borderWidth: 1, borderColor: '#0891b2' } }
          : {
              ...table.cells[oldKey],
              hidden: false,
              mergedInto: undefined,
              rowSpan: 1,
              colSpan: 1,
            };
    }
  // Rebuild surviving anchors, expanding or shrinking a span that crosses the edited axis.
  Object.entries(table.cells).forEach(([key, cell]) => {
    if (cell.hidden) return;
    const [r, c] = key.split('_').map(Number);
    const coordinate = axis === 'row' ? r : c;
    const span = (axis === 'row' ? cell.rowSpan : cell.colSpan) || 1;
    const crosses = index >= coordinate && index < coordinate + span;
    if (remove && coordinate === index && span === 1) return;
    const nextCoordinate =
      coordinate > index || (!remove && coordinate >= index)
        ? coordinate + (remove ? -1 : 1)
        : coordinate;
    const nextSpan =
      span +
      (remove && crosses ? -1 : !remove && index > coordinate && index < coordinate + span ? 1 : 0);
    const nextRow = axis === 'row' ? nextCoordinate : r,
      nextColumn = axis === 'column' ? nextCoordinate : c;
    const rowSpan = axis === 'row' ? nextSpan : cell.rowSpan || 1,
      colSpan = axis === 'column' ? nextSpan : cell.colSpan || 1;
    const anchor = `${nextRow}_${nextColumn}`;
    cells[anchor] = { ...cell, hidden: false, mergedInto: undefined, rowSpan, colSpan };
    for (let a = nextRow; a < nextRow + rowSpan; a++)
      for (let b = nextColumn; b < nextColumn + colSpan; b++) {
        const covered = `${a}_${b}`;
        if (covered !== anchor)
          cells[covered] = {
            ...cells[covered],
            hidden: true,
            mergedInto: anchor,
            rowSpan: 1,
            colSpan: 1,
          };
      }
  });
  const sizes = [...(axis === 'row' ? table.rowHeights : table.columnWidths)];
  if (remove) sizes.splice(index, 1);
  else sizes.splice(index, 0, axis === 'row' ? 28 : 80);
  return {
    ...table,
    rows,
    cols,
    cells,
    ...(axis === 'row' ? { rowHeights: sizes } : { columnWidths: sizes }),
  };
}
