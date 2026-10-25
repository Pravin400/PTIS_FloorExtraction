'use client';
/* eslint-disable @next/next/no-img-element -- Report objects include embedded document images and editable URLs. */

import { useState, type CSSProperties, type PointerEvent } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { QRCodeSVG } from 'qrcode.react';
import { PX_PER_MM, toMm, type EditorState } from '@/lib/utils/reports/designer/editor-model';
import type {
  ClassicElement,
  ClassicReportDefinition,
} from '@/lib/utils/reports/designer/classic-adapter';

import { safeImageUrl } from '@/lib/utils/reports/designer/image-url';
export { safeImageUrl } from '@/lib/utils/reports/designer/image-url';

export function CanvasObject({ element }: { element: ClassicElement }) {
  const type = element.designerType || element.type;
  if (type === 'line')
    return (
      <svg className="h-full w-full overflow-visible" aria-label="Line">
        <line
          x1={0}
          y1={0}
          x2={element.width}
          y2={element.height}
          stroke={String(element.styles.color || '#000000')}
          strokeWidth={Number(element.styles.lineWidth || 1)}
          strokeDasharray={
            String(element.styles.lineStyle || '').includes('dash') ? '5 3' : undefined
          }
        />
      </svg>
    );
  if (type === 'image' || type === 'signature') {
    const src = safeImageUrl(element.imageUrl || element.src);
    // Image URLs are user-editable and may be embedded document data.
    return src ? (
      <img
        src={src}
        alt={element.fieldName || 'Report image'}
        className="h-full w-full"
        style={{ objectFit: (element.styles.objectFit as CSSProperties['objectFit']) || 'contain' }}
        draggable={false}
      />
    ) : (
      <div className="flex h-full items-center justify-center border border-dashed border-slate-400 bg-slate-50 text-center text-[10px]">{`{${element.fieldName || type}}`}</div>
    );
  }
  if (type === 'qr')
    return (
      <QRCodeSVG value={element.text || element.fieldName || 'QR'} width="100%" height="100%" />
    );
  if (type === 'barcode')
    return (
      <div className="flex h-full items-center justify-center font-mono">{`||| ${element.fieldName || element.text || 'Barcode'} |||`}</div>
    );
  if (type === 'table' && element.table) {
    const table = element.table;
    return (
      <table className="h-full w-full table-fixed border-collapse">
        <colgroup>
          {table.columnWidths.map((w, c) => (
            <col
              key={c}
              style={{ width: `${(w / table.columnWidths.reduce((a, b) => a + b, 0)) * 100}%` }}
            />
          ))}
        </colgroup>
        <tbody>
          {Array.from({ length: table.rows }, (_, r) => (
            <tr key={r} style={{ height: table.rowHeights[r] }}>
              {Array.from({ length: table.cols }, (_, c) => {
                const cell = table.cells[`${r}_${c}`];
                if (cell?.hidden) return null;
                const style = cell?.style || {};
                return (
                  <td
                    key={c}
                    rowSpan={cell?.rowSpan || 1}
                    colSpan={cell?.colSpan || 1}
                    style={{
                      border: `${style.borderWidth ?? 1}px solid ${style.borderColor || '#0891b2'}`,
                      fontSize: style.fontSize || 10,
                      fontWeight: style.fontWeight,
                      textAlign: style.textAlign,
                      verticalAlign:
                        style.verticalAlign === 'middle' ? 'middle' : style.verticalAlign,
                      backgroundColor: style.backgroundColor,
                      color: style.color,
                      padding: style.padding ?? 2,
                      whiteSpace: style.wrap === false ? 'nowrap' : 'pre-wrap',
                    }}
                  >
                    {cell?.content || ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (['rectangle', 'square', 'circle', 'container', 'box'].includes(type)) return null;
  const text = element.text || (element.fieldName ? `{${element.fieldName}}` : '');
  const html = element.properties?.isHtml || /<(span|b|strong|font)\b/i.test(text);
  return html ? (
    <span
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(text, { USE_PROFILES: { html: true } }),
      }}
    />
  ) : (
    <span className="block w-full whitespace-pre-wrap">{text}</span>
  );
}

type Drag = {
  startX: number;
  startY: number;
  elements: ClassicElement[];
  handle?: string;
  section?: { id: string; height: number };
};
interface Props {
  state: EditorState;
  zoom: number;
  grid: boolean;
  snap: boolean;
  select: (ids: string[], sectionId?: string) => void;
  checkpoint: () => void;
  update: (
    ids: string[],
    updates: (e: ClassicElement) => Partial<ClassicElement>,
    checkpoint?: boolean
  ) => void;
  change: (
    update: (d: ClassicReportDefinition) => ClassicReportDefinition,
    checkpoint?: boolean
  ) => void;
  edit: (element: ClassicElement) => void;
  dropField: (name: string, sectionId: string, x: number, y: number) => void;
}

export function ReportCanvas({
  state,
  zoom,
  grid,
  snap,
  select,
  checkpoint,
  update,
  change,
  edit,
  dropField,
}: Props) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const def = state.definition;
  const start = (
    event: PointerEvent<HTMLDivElement>,
    element?: ClassicElement,
    handle?: string,
    section?: { id: string; height: number }
  ) => {
    if (event.button !== 0) return;
    if (element?.locked) {
      select([element.id], element.sectionId);
      return;
    }
    event.stopPropagation();
    if (!element && !section) {
      select([]);
      return;
    }
    let ids = state.selected;
    if (element) {
      ids =
        event.ctrlKey || event.metaKey
          ? ids.includes(element.id)
            ? ids.filter((id) => id !== element.id)
            : [...ids, element.id]
          : ids.includes(element.id)
            ? ids
            : [element.id];
      select(ids, element.sectionId);
    }
    checkpoint();
    setDrag({
      startX: event.clientX,
      startY: event.clientY,
      handle,
      section,
      elements: def.elements.filter((e) => ids.includes(e.id) && !e.locked),
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const active = drag;
    if (!active) return;
    const step = snap ? 5 : 1;
    const dx = Math.round((event.clientX - active.startX) / zoom / step) * step;
    const dy = Math.round((event.clientY - active.startY) / zoom / step) * step;
    if (active.section) {
      const height = Math.max(8, active.section.height + dy);
      change(
        (d) => ({
          ...d,
          sections: d.sections.map((s) =>
            s.id === active.section?.id ? { ...s, height, heightMm: toMm(height) } : s
          ),
        }),
        false
      );
      return;
    }
    update(
      active.elements.map((e) => e.id),
      (current) => {
        const e = active.elements.find((item) => item.id === current.id)!;
        const h = active.handle || '';
        if (!h) return { x: Math.max(0, e.x + dx), y: Math.max(0, e.y + dy) };
        let { x, y, width, height } = e;
        if (h.includes('e')) width = Math.max(1, width + dx);
        if (h.includes('s')) height = Math.max(1, height + dy);
        if (h.includes('w')) {
          width = Math.max(1, e.width - dx);
          x = e.x + e.width - width;
        }
        if (h.includes('n')) {
          height = Math.max(1, e.height - dy);
          y = e.y + e.height - height;
        }
        return { x: Math.max(0, x), y: Math.max(0, y), width, height };
      },
      false
    );
  };
  const contentHeight = Math.max(
    def.pageHeight,
    def.sections.reduce((total, section) => total + section.height, 0)
  );
  const gutterWidth = 150;

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#525659]"
      aria-label="Report canvas"
    >
      <div className="flex h-6 shrink-0 overflow-hidden border-b border-[#7f9db9] bg-[#e8eaed]">
        <div className="flex w-[100px] shrink-0 items-center justify-center border-r border-[#7f9db9] bg-[#d8dee4] text-[9.5px] font-bold text-[#334e68]">
          mm
        </div>
        <div className="relative flex-1 overflow-hidden">
          {Array.from({ length: 60 }, (_, index) => (
            <span
              key={index}
              className={`absolute bottom-0 w-px bg-slate-600 ${index % 10 === 0 ? 'h-3.5' : index % 5 === 0 ? 'h-2' : 'h-1'}`}
              style={{ left: index * PX_PER_MM }}
            >
              {index % 10 === 0 && (
                <span className="absolute -top-2.5 left-0.5 font-mono text-[8px] font-semibold text-slate-700">
                  {index}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
      <div
        className="min-h-0 flex-1 overflow-auto bg-[#525659] px-10 pb-24 pt-[30px]"
        onPointerMove={move}
        onPointerUp={() => setDrag(null)}
        onPointerCancel={() => setDrag(null)}
      >
        <div
          className="relative mx-auto"
          style={{
            width: (gutterWidth + def.pageWidth) * zoom,
            height: contentHeight * zoom,
          }}
        >
          <div
            className="absolute left-0 top-0 flex origin-top-left items-start"
            style={{
              width: gutterWidth + def.pageWidth,
              minHeight: contentHeight,
              transform: `scale(${zoom})`,
            }}
          >
            <div className="w-[150px] shrink-0 select-none">
              {def.sections.map((section) => (
                <div
                  key={section.id}
                  className="relative w-full border-r border-[#7f9db9] bg-[#e4e9ed]"
                  style={{ height: section.height }}
                >
                  <button
                    type="button"
                    className={`m-0.5 flex h-[18px] max-w-[146px] items-center gap-1 rounded-sm bg-gradient-to-r px-1 text-left text-[9px] font-bold text-white shadow-sm ${
                      state.sectionId === section.id
                        ? 'from-[#0055ea] to-[#1e70d4]'
                        : 'from-[#40586e] to-[#55728a]'
                    }`}
                    onClick={() => select([], section.id)}
                  >
                    <span className="min-w-0 flex-1 truncate">{section.name}</span>
                    <span className="shrink-0 opacity-75">{section.bandType}</span>
                  </button>
                </div>
              ))}
            </div>
            <div
              className="relative shrink-0 border border-[#777] shadow-[0_4px_20px_rgba(0,0,0,0.45)]"
              style={{
                width: def.pageWidth,
                minHeight: contentHeight,
                backgroundColor: def.pageColor || '#fff',
              }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute z-[1] border border-dashed border-blue-300"
                style={{
                  left: def.margins.left * PX_PER_MM,
                  right: def.margins.right * PX_PER_MM,
                  top: def.margins.top * PX_PER_MM,
                  bottom: def.margins.bottom * PX_PER_MM,
                }}
              />
              {def.pageBorder && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute z-[5] box-border"
                  style={{
                    top: (def.pageBorder.inset?.top ?? 0) * PX_PER_MM,
                    right: (def.pageBorder.inset?.right ?? 0) * PX_PER_MM,
                    bottom: (def.pageBorder.inset?.bottom ?? 0) * PX_PER_MM,
                    left: (def.pageBorder.inset?.left ?? 0) * PX_PER_MM,
                    borderTop:
                      def.pageBorder.top && def.pageBorder.top !== 'none'
                        ? def.pageBorder.top
                        : undefined,
                    borderBottom:
                      def.pageBorder.bottom && def.pageBorder.bottom !== 'none'
                        ? def.pageBorder.bottom
                        : undefined,
                    borderLeft:
                      def.pageBorder.left && def.pageBorder.left !== 'none'
                        ? def.pageBorder.left
                        : undefined,
                    borderRight:
                      def.pageBorder.right && def.pageBorder.right !== 'none'
                        ? def.pageBorder.right
                        : undefined,
                    boxShadow: def.pageBorder.boxShadow,
                  }}
                />
              )}
              {def.watermark && (
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  style={{
                    opacity: def.watermark.opacity ?? 0.2,
                    transform: `rotate(${def.watermark.rotation ?? -45}deg)`,
                    fontSize: def.watermark.fontSize || 68,
                    color: def.watermark.color || '#94a3b8',
                  }}
                >
                  {def.watermark.type === 'image' ? (
                    <CanvasObject
                      element={{
                        ...def.elements[0],
                        designerType: 'image',
                        type: 'image',
                        imageUrl: def.watermark.imageUrl,
                        styles: {},
                      }}
                    />
                  ) : (
                    def.watermark.text
                  )}
                </div>
              )}
              {def.sections.map((section) => (
                <div
                  key={section.id}
                  className="relative touch-none border-b border-dashed border-slate-400"
                  data-section-id={section.id}
                  style={{
                    height: section.height,
                    opacity: section.visible === false ? 0.35 : 1,
                    ...(grid
                      ? {
                          backgroundImage: 'radial-gradient(#aeb8c2 0.65px,transparent 0.65px)',
                          backgroundSize: '5px 5px',
                        }
                      : {}),
                  }}
                  onPointerDown={(event) => start(event)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const name = event.dataTransfer.getData('application/ntis-field');
                    if (!name) return;
                    const box = event.currentTarget.getBoundingClientRect();
                    dropField(
                      name,
                      section.id,
                      (event.clientX - box.left) / zoom,
                      (event.clientY - box.top) / zoom
                    );
                  }}
                >
                  {def.elements
                    .filter((element) => element.sectionId === section.id)
                    .map((element) => {
                      const isSelected = state.selected.includes(element.id);
                      const style = element.styles as CSSProperties;
                      return (
                        <div
                          key={element.id}
                          role="button"
                          tabIndex={0}
                          aria-label={element.fieldName || element.text || element.designerType}
                          aria-pressed={isSelected}
                          data-element-id={element.id}
                          className={`absolute touch-none ${element.locked ? 'cursor-default' : 'cursor-move'} ${isSelected ? 'ring-1 ring-blue-600' : 'hover:outline hover:outline-1 hover:outline-blue-300'}`}
                          style={{
                            ...style,
                            left: element.x,
                            top: element.y,
                            width: element.width,
                            height: element.height,
                            position: 'absolute',
                            boxSizing: 'border-box',
                            opacity: element.visible === false ? 0.25 : style.opacity,
                            borderRadius:
                              element.designerType === 'circle' ? '50%' : style.borderRadius,
                            zIndex: isSelected ? 99999 : Number(style.zIndex || 0),
                          }}
                          onPointerDown={(event) => start(event, element)}
                          onDoubleClick={() => {
                            edit(element);
                            if (
                              !element.locked &&
                              ['text', 'field', 'formula', 'text_box'].includes(element.type)
                            )
                              setEditing({ id: element.id, text: element.text || '' });
                          }}
                        >
                          <div
                            className="h-full w-full overflow-hidden"
                            style={
                              ['text', 'field', 'formula', 'text_box'].includes(element.type)
                                ? {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent:
                                      style.verticalAlign === 'top'
                                        ? 'flex-start'
                                        : style.verticalAlign === 'bottom'
                                          ? 'flex-end'
                                          : 'center',
                                  }
                                : undefined
                            }
                          >
                            {editing?.id === element.id ? (
                              <textarea
                                autoFocus
                                aria-label="Edit canvas text"
                                className="h-full w-full resize-none bg-white text-inherit outline-none"
                                value={editing.text}
                                onPointerDown={(event) => event.stopPropagation()}
                                onChange={(event) =>
                                  setEditing({ id: element.id, text: event.target.value })
                                }
                                onBlur={() => {
                                  if (editing.text !== element.text)
                                    update([element.id], () => ({ text: editing.text }));
                                  setEditing(null);
                                }}
                                onKeyDown={(event) => {
                                  event.stopPropagation();
                                  if (event.key === 'Escape') setEditing(null);
                                  else if (
                                    event.key === 'Enter' &&
                                    (event.ctrlKey || event.metaKey)
                                  )
                                    event.currentTarget.blur();
                                }}
                              />
                            ) : (
                              <CanvasObject element={element} />
                            )}
                          </div>
                          {isSelected &&
                            !element.locked &&
                            ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'].map((handle) => (
                              <div
                                key={handle}
                                aria-label={`Resize ${handle}`}
                                className="absolute z-50 h-2 w-2 border border-blue-600 bg-white"
                                style={{
                                  left: handle.includes('w')
                                    ? -4
                                    : handle.includes('e')
                                      ? element.width - 4
                                      : element.width / 2 - 4,
                                  top: handle.includes('n')
                                    ? -4
                                    : handle.includes('s')
                                      ? element.height - 4
                                      : element.height / 2 - 4,
                                  cursor: `${handle}-resize`,
                                }}
                                onPointerDown={(event) => start(event, element, handle)}
                              />
                            ))}
                        </div>
                      );
                    })}
                  <div
                    className="absolute bottom-0 z-[100000] h-1 w-full cursor-row-resize hover:bg-blue-400/50"
                    aria-label={`Resize ${section.name}`}
                    onPointerDown={(event) => start(event, undefined, undefined, section)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
