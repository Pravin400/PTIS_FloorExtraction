'use client';

import { useState } from 'react';
import type { ClassicElement } from '@/lib/utils/reports/designer/classic-adapter';
import type { DesignerTableCellStyle, DesignerTableStructure } from '@/types/report-designer.types';
import { changeTableAxis, mergeCells, splitCell } from '@/lib/utils/reports/designer/editor-table';
import { createTable } from '@/lib/utils/reports/designer/editor-model';
import { EditorButton, EditorDialog } from '../components/EditorControls';

const controlClass =
  'h-[25px] rounded border border-slate-400 bg-white px-1 text-[10px] outline-none focus:border-blue-600';

export function ReportTableDialog({
  element,
  close,
  save,
}: {
  element: ClassicElement;
  close: () => void;
  save: (table: DesignerTableStructure) => void;
}) {
  const [table, setTable] = useState(() => structuredClone(element.table || createTable()));
  const [selected, setSelected] = useState<string[]>(['0_0']);
  const [error, setError] = useState('');
  const [past, setPast] = useState<DesignerTableStructure[]>([]);
  const [future, setFuture] = useState<DesignerTableStructure[]>([]);

  const change = (next: DesignerTableStructure) => {
    setPast((value) => [...value.slice(-49), table]);
    setFuture([]);
    setTable(next);
  };
  const style = (updates: Partial<DesignerTableCellStyle>) => {
    const cells = { ...table.cells };
    selected.forEach((key) => {
      if (cells[key]) cells[key] = { ...cells[key], style: { ...cells[key].style, ...updates } };
    });
    change({ ...table, cells });
  };
  const operation = (operationFactory: () => DesignerTableStructure) => {
    try {
      change(operationFactory());
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Table operation failed.');
    }
  };
  const [row, column] = (selected[0] || '0_0').split('_').map(Number);
  const firstCell = table.cells[selected[0] || '0_0'];
  const firstStyle = firstCell?.style || {};

  return (
    <EditorDialog
      title="Advanced Table Editor"
      panelClassName="max-w-[1080px]"
      bodyClassName="overflow-hidden bg-white px-4 py-3"
      close={close}
      footer={
        <>
          <EditorButton onClick={close}>Cancel</EditorButton>
          <EditorButton
            className="border-blue-700 bg-gradient-to-br from-blue-600 to-blue-700 px-3 font-bold text-white hover:from-blue-700 hover:to-blue-800 hover:text-white"
            onClick={() => save(table)}
          >
            Apply Table
          </EditorButton>
        </>
      }
    >
      <div className="flex max-h-[68vh] flex-col gap-2">
        <div className="flex flex-wrap items-center gap-[5px] rounded-[5px] border border-slate-300 bg-slate-50 p-[7px]">
          <EditorButton onClick={() => operation(() => changeTableAxis(table, 'row', row + 1))}>
            + Row
          </EditorButton>
          <EditorButton onClick={() => operation(() => changeTableAxis(table, 'row', row, true))}>
            − Row
          </EditorButton>
          <EditorButton
            onClick={() => operation(() => changeTableAxis(table, 'column', column + 1))}
          >
            + Column
          </EditorButton>
          <EditorButton
            onClick={() => operation(() => changeTableAxis(table, 'column', column, true))}
          >
            − Column
          </EditorButton>
          <span className="h-5 border-l border-slate-300" />
          <EditorButton onClick={() => operation(() => mergeCells(table, selected))}>
            Merge Selected
          </EditorButton>
          <EditorButton onClick={() => operation(() => splitCell(table, selected[0] || '0_0'))}>
            Unmerge / Split
          </EditorButton>
          <span className="flex-1" />
          <EditorButton
            disabled={!past.length}
            onClick={() => {
              const value = past.at(-1);
              if (!value) return;
              setFuture((items) => [table, ...items]);
              setPast((items) => items.slice(0, -1));
              setTable(value);
            }}
          >
            Undo
          </EditorButton>
          <EditorButton
            disabled={!future.length}
            onClick={() => {
              const value = future[0];
              if (!value) return;
              setPast((items) => [...items, table]);
              setFuture((items) => items.slice(1));
              setTable(value);
            }}
          >
            Redo
          </EditorButton>
          <strong className="text-[11px] text-blue-600">
            {table.cols} cols × {table.rows} rows
          </strong>
        </div>

        <div className="flex flex-wrap items-end gap-[5px] rounded-[5px] border border-slate-300 bg-slate-50 p-[7px]">
          <label className="text-[9px] text-slate-600">
            Align
            <select
              className={`${controlClass} ml-1`}
              value={firstStyle.textAlign || 'left'}
              onChange={(event) =>
                style({ textAlign: event.target.value as 'left' | 'center' | 'right' })
              }
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
          <label className="text-[9px] text-slate-600">
            Vertical
            <select
              className={`${controlClass} ml-1`}
              value={firstStyle.verticalAlign || 'middle'}
              onChange={(event) =>
                style({ verticalAlign: event.target.value as 'top' | 'middle' | 'bottom' })
              }
            >
              <option value="top">Top</option>
              <option value="middle">Middle</option>
              <option value="bottom">Bottom</option>
            </select>
          </label>
          <label className="text-[9px] text-slate-600">
            Font
            <input
              className={`${controlClass} ml-1 w-12`}
              type="number"
              min={4}
              max={96}
              value={firstStyle.fontSize || 9}
              onChange={(event) => style({ fontSize: Number(event.target.value) })}
            />
          </label>
          <EditorButton
            className="font-extrabold"
            onClick={() => style({ fontWeight: firstStyle.fontWeight === 700 ? 400 : 700 })}
          >
            B
          </EditorButton>
          <label className="text-[9px] text-slate-600">
            Border
            <input
              className={`${controlClass} ml-1 w-11`}
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={firstStyle.borderWidth ?? 1}
              onChange={(event) => style({ borderWidth: Number(event.target.value) })}
            />
          </label>
          <label className="text-[9px] text-slate-600">
            Color{' '}
            <input
              type="color"
              className="ml-1 h-6 w-7 align-middle"
              value={firstStyle.borderColor || '#000000'}
              onChange={(event) => style({ borderColor: event.target.value })}
            />
          </label>
          <label className="text-[9px] text-slate-600">
            Fill{' '}
            <input
              type="color"
              className="ml-1 h-6 w-7 align-middle"
              value={firstStyle.backgroundColor || '#ffffff'}
              onChange={(event) => style({ backgroundColor: event.target.value })}
            />
          </label>
          <label className="text-[9px] text-slate-600">
            Text{' '}
            <input
              type="color"
              className="ml-1 h-6 w-7 align-middle"
              value={firstStyle.color || '#000000'}
              onChange={(event) => style({ color: event.target.value })}
            />
          </label>
          <label className="text-[9px] text-slate-600">
            Padding
            <input
              className={`${controlClass} ml-1 w-11`}
              type="number"
              min={0}
              max={40}
              value={firstStyle.padding ?? 4}
              onChange={(event) => style({ padding: Number(event.target.value) })}
            />
          </label>
          <label className="flex items-center gap-1 text-[10px] text-slate-700">
            <input
              type="checkbox"
              checked={firstStyle.wrap !== false}
              onChange={(event) => style({ wrap: event.target.checked })}
            />{' '}
            Wrap text
          </label>
          <span className="ml-auto text-[9px] text-slate-500">
            Click: one | Ctrl+Click: multiple | Shift+Click: rectangle
          </span>
        </div>

        <div className="max-h-[480px] overflow-auto rounded border border-slate-300 bg-slate-50">
          <table className="min-w-full table-fixed select-none border-collapse">
            <colgroup>
              {table.columnWidths.map((width, index) => (
                <col key={index} style={{ width }} />
              ))}
            </colgroup>
            <tbody>
              {Array.from({ length: table.rows }, (_, tableRow) => (
                <tr key={tableRow} style={{ height: table.rowHeights[tableRow] }}>
                  {Array.from({ length: table.cols }, (_, tableColumn) => {
                    const key = `${tableRow}_${tableColumn}`;
                    const cell = table.cells[key];
                    if (cell?.hidden) return null;
                    return (
                      <td
                        key={key}
                        rowSpan={cell?.rowSpan || 1}
                        colSpan={cell?.colSpan || 1}
                        className={`relative box-border p-0 ${selected.includes(key) ? 'z-[2] outline outline-2 outline-blue-600 outline-offset-[-2px]' : ''}`}
                        style={{
                          ...cell?.style,
                          border: `${cell?.style?.borderWidth ?? 1}px solid ${cell?.style?.borderColor || '#0891b2'}`,
                          minWidth: table.columnWidths[tableColumn],
                        }}
                        onClick={(event) => {
                          if (event.shiftKey) {
                            const keys: string[] = [];
                            for (
                              let currentRow = Math.min(row, tableRow);
                              currentRow <= Math.max(row, tableRow);
                              currentRow += 1
                            )
                              for (
                                let currentColumn = Math.min(column, tableColumn);
                                currentColumn <= Math.max(column, tableColumn);
                                currentColumn += 1
                              )
                                keys.push(`${currentRow}_${currentColumn}`);
                            setSelected(keys);
                          } else if (event.ctrlKey || event.metaKey) {
                            setSelected((keys) =>
                              keys.includes(key)
                                ? keys.filter((value) => value !== key)
                                : [...keys, key]
                            );
                          } else setSelected([key]);
                        }}
                      >
                        <textarea
                          aria-label={`Cell ${tableRow + 1}, ${tableColumn + 1}`}
                          className="relative z-[3] block h-full min-h-7 w-full resize-none bg-transparent p-1 outline-none"
                          value={cell?.content || ''}
                          onChange={(event) =>
                            change({
                              ...table,
                              cells: {
                                ...table.cells,
                                [key]: { ...cell, content: event.target.value },
                              },
                            })
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {error ? (
          <p role="alert" className="text-[11px] font-semibold text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    </EditorDialog>
  );
}
