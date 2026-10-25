'use client';

import { Settings2, TableProperties, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type {
  ClassicElement,
  ClassicReportDefinition,
} from '@/lib/utils/reports/designer/classic-adapter';
import type { DesignerElementType, DesignerFieldCatalogEntry } from '@/types/report-designer.types';
import { EditorButton, EditorInput, EditorSelect } from '../components/EditorControls';

function PropertyGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-slate-300 pb-3">
      <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export function ReportProperties({
  open,
  close,
  definition,
  selected,
  fields,
  update,
  editTable,
}: {
  open: boolean;
  close: () => void;
  definition: ClassicReportDefinition;
  selected: string[];
  fields: DesignerFieldCatalogEntry[];
  update: (changes: Partial<ClassicElement>) => void;
  editTable: (element: ClassicElement) => void;
}) {
  const element = definition.elements.find((item) => item.id === selected[0]);
  const style = (key: string, value: string | number) =>
    element && update({ styles: { ...element.styles, [key]: value } });

  return (
    <aside
      className={`absolute bottom-0 top-0 z-30 flex w-[280px] flex-col overflow-hidden border-l-2 border-[#7f9db9] bg-[#f0f0f0] shadow-xl transition-[right] ${open ? 'right-0' : '-right-[280px] pointer-events-none'}`}
    >
      <div className="flex h-8 shrink-0 items-center justify-between border-b border-[#99aab8] bg-[#d8dee4] px-2.5 font-bold text-[#1e3a5f]">
        <span className="flex items-center gap-1.5">
          <Settings2 className="h-3.5 w-3.5" />
          Properties
        </span>
        <span className="flex items-center gap-1 font-normal text-slate-500">
          {selected.length} selected
          <button
            type="button"
            aria-label="Close properties"
            className="grid h-5 w-5 place-items-center rounded hover:bg-slate-300"
            onClick={close}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      </div>
      {!element ? (
        <div className="m-3 rounded border border-dashed border-slate-300 bg-white p-4 text-center text-[10.5px] leading-4 text-slate-500">
          Select an element on the report to edit its properties.
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          <p className="truncate rounded bg-slate-200/70 px-2 py-1 font-mono text-[9px] text-slate-500">
            {element.id}
          </p>

          <PropertyGroup title="Object">
            <EditorSelect
              label="Element type"
              value={element.designerType}
              onChange={(event) =>
                update({
                  designerType: event.target.value as DesignerElementType,
                  type: ['rectangle', 'square', 'circle'].includes(event.target.value)
                    ? 'box'
                    : event.target.value,
                })
              }
            >
              {[
                'text',
                'field',
                'image',
                'qr',
                'barcode',
                'line',
                'rectangle',
                'square',
                'circle',
                'table',
                'signature',
                'container',
              ].map((type) => (
                <option key={type}>{type}</option>
              ))}
            </EditorSelect>
            <EditorSelect
              label="Section"
              value={element.sectionId}
              onChange={(event) => update({ sectionId: event.target.value })}
            >
              {definition.sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </EditorSelect>
          </PropertyGroup>

          <PropertyGroup title="Position and size">
            <div className="grid grid-cols-2 gap-2">
              {(['x', 'y', 'width', 'height'] as const).map((key) => (
                <EditorInput
                  key={key}
                  label={`${key} (px)`}
                  type="number"
                  min={0}
                  step={0.1}
                  value={element[key]}
                  onChange={(event) => update({ [key]: Math.max(0, Number(event.target.value)) })}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <EditorInput
                label="Z index"
                type="number"
                value={Number(element.styles.zIndex || 0)}
                onChange={(event) => style('zIndex', Number(event.target.value))}
              />
              <EditorInput
                label="Opacity"
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={Number(element.styles.opacity ?? 1)}
                onChange={(event) => style('opacity', Number(event.target.value))}
              />
            </div>
          </PropertyGroup>

          <PropertyGroup title="Data">
            <EditorInput
              label="Field binding"
              list="report-field-bindings"
              value={element.fieldName || ''}
              onChange={(event) =>
                update({
                  fieldName: event.target.value,
                  ...(element.type === 'field' ? { text: `{${event.target.value}}` } : {}),
                })
              }
            />
            <datalist id="report-field-bindings">
              {fields.map((field) => (
                <option key={`${field.collectionPath}|${field.name}`} value={field.name}>
                  {field.label}
                </option>
              ))}
            </datalist>
            <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-600">
              Text / formula
              <textarea
                aria-label="Text / formula"
                rows={4}
                className="w-full resize-y rounded-md border border-slate-300 bg-white p-2 text-[11.5px] font-normal text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                value={element.text || ''}
                onChange={(event) => update({ text: event.target.value })}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const field = event.dataTransfer.getData('application/ntis-field');
                  if (!field) return;
                  const start = event.currentTarget.selectionStart;
                  const end = event.currentTarget.selectionEnd;
                  const text = element.text || '';
                  update({ text: `${text.slice(0, start)}{${field}}${text.slice(end)}` });
                }}
              />
            </label>
            <EditorSelect
              label="Number / date format"
              value={element.format || 'text'}
              onChange={(event) =>
                update({ format: event.target.value as ClassicElement['format'] })
              }
            >
              {['text', 'number', 'currency', 'date', '0', '0.00', '0.##'].map((format) => (
                <option key={format}>{format}</option>
              ))}
            </EditorSelect>
            {(element.designerType === 'image' || element.designerType === 'signature') && (
              <>
                <EditorInput
                  label="Image URL / data URL"
                  value={element.imageUrl || element.src || ''}
                  onChange={(event) =>
                    update({ imageUrl: event.target.value, src: event.target.value })
                  }
                />
                <EditorSelect
                  label="Image fit"
                  value={element.styles.objectFit || 'contain'}
                  onChange={(event) => style('objectFit', event.target.value)}
                >
                  <option>contain</option>
                  <option>cover</option>
                  <option>fill</option>
                </EditorSelect>
              </>
            )}
            {element.type === 'table' && (
              <EditorButton
                className="w-full border-blue-200 bg-blue-50 font-semibold text-blue-700"
                onClick={() => editTable(element)}
              >
                <TableProperties className="h-3.5 w-3.5" />
                <span>Edit table cells</span>
              </EditorButton>
            )}
          </PropertyGroup>

          <PropertyGroup title="Text and appearance">
            <EditorInput
              label="Font family"
              value={String(element.styles.fontFamily || 'Arial')}
              onChange={(event) => style('fontFamily', event.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <EditorInput
                label="Font size (px)"
                type="number"
                min={1}
                value={parseFloat(String(element.styles.fontSize || '10'))}
                onChange={(event) => style('fontSize', `${event.target.value}px`)}
              />
              <EditorInput
                label="Padding (px)"
                type="number"
                min={0}
                value={parseFloat(String(element.styles.padding || '0'))}
                onChange={(event) => style('padding', `${event.target.value}px`)}
              />
              <EditorInput
                label="Color"
                type="color"
                value={String(element.styles.color || '#000000')}
                onChange={(event) => style('color', event.target.value)}
              />
              <EditorInput
                label="Background"
                value={String(element.styles.backgroundColor || 'transparent')}
                onChange={(event) => style('backgroundColor', event.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <EditorSelect
                label="Text alignment"
                value={element.styles.textAlign || 'left'}
                onChange={(event) => style('textAlign', event.target.value)}
              >
                {['left', 'center', 'right', 'justify'].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </EditorSelect>
              <EditorSelect
                label="Vertical alignment"
                value={element.styles.verticalAlign || 'middle'}
                onChange={(event) => style('verticalAlign', event.target.value)}
              >
                {['top', 'middle', 'bottom'].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </EditorSelect>
            </div>
          </PropertyGroup>

          <PropertyGroup title="Border">
            <EditorInput
              label="Border (CSS)"
              placeholder="1px solid #000000"
              value={String(element.styles.border || '')}
              onChange={(event) => style('border', event.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              {['borderTop', 'borderRight', 'borderBottom', 'borderLeft'].map((key) => (
                <EditorInput
                  key={key}
                  label={key}
                  value={String(element.styles[key] || '')}
                  onChange={(event) => style(key, event.target.value)}
                />
              ))}
              <EditorInput
                label="Border radius"
                value={String(element.styles.borderRadius || '')}
                onChange={(event) => style('borderRadius', event.target.value)}
              />
              {element.type === 'line' && (
                <EditorInput
                  label="Line thickness"
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={Number(element.styles.lineWidth || 1)}
                  onChange={(event) => style('lineWidth', Number(event.target.value))}
                />
              )}
            </div>
          </PropertyGroup>

          <div className="flex flex-wrap gap-x-3 gap-y-2 pb-2 text-[10.5px] text-slate-600">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={element.visible !== false}
                onChange={(event) => update({ visible: event.target.checked })}
              />
              Visible
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={element.locked || false}
                onChange={(event) => update({ locked: event.target.checked })}
              />
              Locked
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={element.allowOverlap || false}
                onChange={(event) => update({ allowOverlap: event.target.checked })}
              />
              Allow overlap
            </label>
          </div>
        </div>
      )}
    </aside>
  );
}
