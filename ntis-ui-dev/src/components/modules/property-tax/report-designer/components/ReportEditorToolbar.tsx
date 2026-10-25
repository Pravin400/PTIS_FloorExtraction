'use client';

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Circle,
  Copy,
  Eye,
  FilePlus2,
  Grid3X3,
  List,
  ListOrdered,
  ListTree,
  Minus,
  PaintBucket,
  PanelsTopLeft,
  Play,
  Redo2,
  Save,
  Shapes,
  Square,
  Table2,
  Trash2,
  Undo2,
  Upload,
} from 'lucide-react';
import {
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { PAPER_PRESETS, resizePage } from '@/lib/utils/reports/designer/editor-model';
import type { useReportDesignerWorkspace } from '@/hooks/reports/designer/useReportDesignerWorkspace';
import { EditorButton } from './EditorControls';

const iconClass = 'h-3.5 w-3.5 stroke-[2.25] text-slate-800';
const buttonClass =
  'h-[26px] rounded-md border-slate-300 px-2 text-[11.5px] font-medium text-slate-800 shadow-sm hover:bg-slate-50';
const separator = <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-slate-300" />;
const palette = [
  '#ffffff',
  '#000000',
  '#1f2937',
  '#64748b',
  '#94a3b8',
  '#d1d5db',
  '#f8fafc',
  '#dc2626',
  '#ea580c',
  '#f59e0b',
  '#16a34a',
  '#059669',
  '#0891b2',
  '#2563eb',
  '#4f46e5',
  '#7c3aed',
  '#c026d3',
  '#e11d48',
  '#fee2e2',
  '#ffedd5',
  '#fef3c7',
  '#dcfce7',
  '#cffafe',
  '#dbeafe',
  '#ede9fe',
  '#fae8ff',
];
type ToolbarMenu = 'table' | 'shapes' | 'watermark' | 'pageColor';

function Pill({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div
      title={title}
      className="inline-flex h-[26px] shrink-0 items-center rounded-md border border-slate-200 bg-white px-0.5 shadow-sm"
    >
      {children}
    </div>
  );
}

function PillButton({
  children,
  active,
  disabled,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex h-[22px] min-w-[24px] px-1 items-center justify-center rounded border-0 bg-transparent text-slate-700 shadow-none transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-35 active:bg-slate-200 ${
        active ? '!bg-blue-100 !text-blue-800 font-bold' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function PillDivider() {
  return <span aria-hidden className="mx-0.5 h-3.5 w-px shrink-0 bg-slate-200" />;
}

export function ReportEditorToolbar({
  workspace,
}: {
  workspace: ReturnType<typeof useReportDesignerWorkspace>;
}) {
  const {
    editor,
    state,
    dispatch,
    change,
    updateElements,
    busy,
    def,
    zoom,
    setZoom,
    grid,
    setGrid,
    setDialog,
    setPendingReportId,
    setDeleteOpen,
    dirty,
    selected,
    remove,
    duplicate,
    insert,
    insertTable,
    style,
    toggleStyle,
    align,
    go,
  } = workspace;
  const [menu, setMenu] = useState<{ name: ToolbarMenu; left: number } | null>(null);
  const [tableHover, setTableHover] = useState({ rows: 1, columns: 1 });
  useEffect(() => {
    const closeMenu = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-toolbar-menu], [data-toolbar-popover]')) setMenu(null);
    };
    document.addEventListener('pointerdown', closeMenu);
    return () => document.removeEventListener('pointerdown', closeMenu);
  }, []);
  const openMenu = (name: ToolbarMenu, event: ReactMouseEvent<HTMLButtonElement>) => {
    const header = event.currentTarget.closest('header');
    if (!header) return;
    const widths: Record<ToolbarMenu, number> = {
      table: 205,
      shapes: 230,
      watermark: 250,
      pageColor: 200,
    };
    const headerBox = header.getBoundingClientRect();
    const buttonBox = event.currentTarget.getBoundingClientRect();
    const left = Math.max(
      4,
      Math.min(buttonBox.left - headerBox.left, headerBox.width - widths[name] - 4)
    );
    setMenu((current) => (current?.name === name ? null : { name, left }));
  };
  const selectedReport = editor.reports.find((report) => report.id === def.reportId);
  const listPrefix = (kind: 'bullet' | 'number' | 'multilevel') =>
    updateElements(state.selected, (element) => {
      const lines = (element.text || '').split('\n');
      const prefixed = lines.map((line, index) => {
        const clean = line.replace(/^(?:[•◦▪]|\d+[.)]|[a-z][.)])\s+/, '');
        if (kind === 'bullet') return `• ${clean}`;
        if (kind === 'number') return `${index + 1}. ${clean}`;
        return `${index % 2 ? '  a.' : `${Math.floor(index / 2) + 1}.`} ${clean}`;
      });
      return { text: prefixed.join('\n') };
    });
  const applyBorder = (value: string) => {
    if (!value) return;
    if (value === 'custom' || value === 'dialog') {
      setDialog('borders');
      return;
    }
    updateElements(state.selected, (element) => {
      const styles = { ...element.styles };
      if (value === 'none') return { styles: { ...styles, border: 'none' } };
      if (value === 'all') return { styles: { ...styles, border: '1px solid #000000' } };
      if (value === 'thick') return { styles: { ...styles, border: '2px solid #000000' } };
      if (value === 'dashed') return { styles: { ...styles, border: '1px dashed #000000' } };
      if (value === 'double-bottom')
        return { styles: { ...styles, borderBottom: '3px double #000000' } };
      if (value === 'top-bottom')
        return {
          styles: {
            ...styles,
            borderTop: '1px solid #000000',
            borderBottom: '1px solid #000000',
          },
        };
      return {
        styles: {
          ...styles,
          [`border${value[0].toUpperCase()}${value.slice(1)}`]: '1px solid #000000',
        },
      };
    });
  };

  return (
    <header className="relative z-20 flex h-[76px] shrink-0 flex-col gap-[5px] overflow-visible border-b border-slate-200 bg-gradient-to-b from-white to-slate-50 px-3 py-[7px] shadow-sm">
      <div className="flex h-[26px] min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-[5px] overflow-x-auto pr-1.5 [scrollbar-width:none]">
          <EditorButton
            className={`${buttonClass} border-blue-700 bg-gradient-to-br from-blue-600 to-blue-700 px-2.5 font-semibold text-white hover:border-blue-800 hover:bg-blue-700 hover:text-white`}
            onClick={() => (dirty ? setPendingReportId('__new') : setDialog('new'))}
            disabled={busy}
          >
            <FilePlus2 className={iconClass} />
            <span>New Report</span>
          </EditorButton>
          <EditorButton
            className={buttonClass}
            onClick={() => (dirty ? setPendingReportId('__import') : setDialog('import'))}
            disabled={busy}
          >
            <Upload className={iconClass} />
            <span>Import Report</span>
          </EditorButton>
          <span className="shrink-0 font-semibold text-slate-500">Report:</span>
          <select
            aria-label="Report"
            title="Open a saved report; double-click for report settings"
            value={selectedReport ? def.reportId : ''}
            disabled={busy}
            className="h-[26px] min-w-60 max-w-[380px] shrink-0 rounded-md border border-slate-200 bg-white px-2 text-[11.5px] font-semibold text-slate-700 shadow-sm outline-none focus:border-blue-500"
            onDoubleClick={() => setDialog('settings')}
            onChange={(event) => {
              if (!event.target.value) return;
              if (dirty) setPendingReportId(event.target.value);
              else void editor.load(event.target.value);
            }}
          >
            {!selectedReport && (
              <option value="">
                {def.reportName} {def.layoutVersion === 0 ? '(draft)' : ''}
              </option>
            )}
            {editor.reports.map((report) => (
              <option key={report.id} value={report.id}>
                {report.name}
              </option>
            ))}
          </select>
          <EditorButton
            className={`${buttonClass} border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700`}
            aria-label="Delete report"
            onClick={() => setDeleteOpen(true)}
            disabled={!selectedReport?.canDelete}
          >
            <Trash2 className={iconClass} />
            <span>Delete</span>
          </EditorButton>
          {separator}
          <span className="shrink-0 font-semibold text-slate-500">Paper:</span>
          <select
            aria-label="Paper size"
            value={def.paperSize}
            className="h-[26px] w-[84px] shrink-0 rounded-md border border-slate-200 bg-white px-2 text-[11.5px] text-slate-700 shadow-sm outline-none focus:border-blue-500"
            onChange={(event) => {
              const paperSize = event.target.value;
              if (paperSize === 'Custom') setDialog('page');
              else
                change((definition) => resizePage(definition, paperSize, definition.orientation));
            }}
          >
            {Object.keys(PAPER_PRESETS).map((paper) => (
              <option key={paper}>{paper}</option>
            ))}
            <option value="Custom">Custom...</option>
          </select>
          {separator}
          <span className="shrink-0 text-[11px] font-semibold text-slate-500">Zoom:</span>
          <select
            aria-label="Zoom"
            className="h-[26px] w-[70px] shrink-0 rounded-md border border-slate-300 bg-white px-2 text-[11.5px] font-medium text-slate-800 shadow-sm outline-none focus:border-blue-500"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          >
            {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map((value) => (
              <option key={value} value={value}>
                {value * 100}%
              </option>
            ))}
          </select>
          <button
            type="button"
            className={`inline-flex h-[26px] shrink-0 items-center justify-center gap-1.5 rounded-md border px-2.5 text-[11.5px] font-medium transition shadow-sm ${
              grid
                ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
            }`}
            onClick={() => setGrid(!grid)}
            aria-pressed={grid}
          >
            <Grid3X3 className="h-3.5 w-3.5 stroke-[2.25] text-blue-600" />
            <span>Grid</span>
          </button>
          {separator}
          <div
            className="inline-flex h-[26px] shrink-0 items-center rounded-md border border-slate-300 bg-white shadow-sm overflow-hidden"
            title="Page & Insert Controls"
          >
            <button
              type="button"
              data-toolbar-menu
              className="inline-flex h-full items-center gap-1.5 px-2.5 text-[11.5px] font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors border-0 bg-transparent cursor-pointer"
              title="Insert Table"
              onClick={(event) => openMenu('table', event)}
            >
              <Table2 className="h-3.5 w-3.5 text-blue-600 stroke-[2.25]" />
              <span>Table</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
            <span className="h-3.5 w-px bg-slate-200 shrink-0" />
            <button
              type="button"
              data-toolbar-menu
              className="inline-flex h-full items-center gap-1.5 px-2.5 text-[11.5px] font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors border-0 bg-transparent cursor-pointer"
              title="Insert Shapes"
              onClick={(event) => openMenu('shapes', event)}
            >
              <Shapes className="h-3.5 w-3.5 text-blue-600 stroke-[2.25]" />
              <span>Shapes</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
            <span className="h-3.5 w-px bg-slate-200 shrink-0" />
            <button
              type="button"
              data-toolbar-menu
              className="inline-flex h-full items-center gap-1.5 px-2.5 text-[11.5px] font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors border-0 bg-transparent cursor-pointer"
              title="Watermark"
              onClick={(event) => openMenu('watermark', event)}
            >
              <span className="text-[12px] font-black text-orange-600 leading-none">A</span>
              <span>Watermark</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
            <span className="h-3.5 w-px bg-slate-200 shrink-0" />
            <button
              type="button"
              data-toolbar-menu
              className="inline-flex h-full items-center gap-1.5 px-2.5 text-[11.5px] font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors border-0 bg-transparent cursor-pointer"
              title="Page Color"
              onClick={(event) => openMenu('pageColor', event)}
            >
              <PaintBucket className="h-3.5 w-3.5 text-blue-600 stroke-[2.25]" />
              <span>Page Color</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-[5px] border-l border-slate-200 bg-slate-50/80 pl-2">
          <EditorButton
            className={buttonClass}
            onClick={() => (dirty ? setPendingReportId('__back') : go('__back'))}
          >
            <ArrowLeft className={iconClass} />
            <span>Back</span>
          </EditorButton>
          <EditorButton
            className={buttonClass}
            aria-label="Preview / Print"
            onClick={() => setDialog('preview')}
          >
            <Eye className={iconClass} />
            <span>Preview</span>
          </EditorButton>
          <EditorButton
            className={`${buttonClass} border-emerald-700 bg-gradient-to-br from-emerald-500 to-emerald-600 px-2.5 font-semibold text-white hover:border-emerald-800 hover:bg-emerald-600 hover:text-white`}
            aria-label="Save draft"
            onClick={() => void editor.save(false)}
            disabled={busy}
          >
            <Save className={iconClass} />
            <span>Save Draft</span>
          </EditorButton>
          <EditorButton
            className={`${buttonClass} border-green-700 bg-gradient-to-br from-green-600 to-green-600 px-2.5 font-bold text-white hover:border-green-800 hover:from-green-700 hover:to-green-700 hover:text-white`}
            onClick={() => void editor.save(true)}
            disabled={busy}
          >
            <Check className={iconClass} />
            <span>Publish</span>
          </EditorButton>
          <EditorButton
            className={`${buttonClass} border-blue-700 bg-gradient-to-br from-blue-600 to-blue-700 px-2.5 font-semibold text-white hover:border-blue-800 hover:bg-blue-700 hover:text-white`}
            onClick={async () => {
              await editor.save(false);
              setDialog('preview');
            }}
            disabled={busy}
          >
            <Play className={iconClass} />
            <span>Save & Preview</span>
          </EditorButton>
        </div>
      </div>

      <div className="flex h-[26px] min-w-0 items-center gap-[5px] overflow-x-auto [scrollbar-width:none]">
        <Pill title="History & Selection Actions">
          <PillButton
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
            onClick={() => dispatch({ type: 'undo' })}
            disabled={!state.past.length}
          >
            <Undo2 className="h-3.5 w-3.5 stroke-[2.25] text-slate-800" />
          </PillButton>
          <PillDivider />
          <PillButton
            aria-label="Redo"
            title="Redo (Ctrl+Y)"
            onClick={() => dispatch({ type: 'redo' })}
            disabled={!state.future.length}
          >
            <Redo2 className="h-3.5 w-3.5 stroke-[2.25] text-slate-800" />
          </PillButton>
          <PillDivider />
          <PillButton
            aria-label="Copy selected"
            title="Copy Selected (Ctrl+C / Ctrl+D)"
            onClick={duplicate}
            disabled={!state.selected.length}
          >
            <Copy className="h-3.5 w-3.5 stroke-[2.25] text-blue-600" />
          </PillButton>
          <PillDivider />
          <PillButton
            aria-label="Delete selected"
            title="Delete Selected (Delete)"
            onClick={remove}
            disabled={!state.selected.length}
          >
            <Trash2 className="h-3.5 w-3.5 stroke-[2.25] text-red-600" />
          </PillButton>
        </Pill>
        {separator}
        <select
          aria-label="Font"
          className="h-[26px] w-[145px] shrink-0 rounded-md border border-slate-300 bg-white px-2 text-[11.5px] font-medium text-slate-800 shadow-sm outline-none focus:border-blue-500"
          value={String(selected?.styles.fontFamily || 'Noto Sans Devanagari')}
          onChange={(event) => style('fontFamily', event.target.value)}
        >
          {[
            'Noto Sans Devanagari',
            'Mukta',
            'Tiro Devanagari Marathi',
            'Poppins',
            'Noto Serif Devanagari',
            'Martel',
            'Mangal',
            'Arial',
            'Segoe UI',
            'Calibri',
            'Times New Roman',
            'Georgia',
            'Courier New',
          ].map((font) => (
            <option key={font}>{font}</option>
          ))}
        </select>
        <select
          aria-label="Font size"
          className="h-[26px] w-[58px] shrink-0 rounded-md border border-slate-300 bg-white px-2 text-[11.5px] font-medium text-slate-800 shadow-sm outline-none focus:border-blue-500"
          value={parseFloat(String(selected?.styles.fontSize || 7))}
          onChange={(event) => style('fontSize', `${event.target.value}px`)}
        >
          {[7, 8, 8.5, 9, 9.5, 10, 11, 12, 13, 14, 16, 19, 22].map((size) => (
            <option key={size} value={size}>
              {size} pt
            </option>
          ))}
        </select>
        <Pill title="Text Style">
          <PillButton
            active={selected?.styles.fontWeight === 700 || selected?.styles.fontWeight === 'bold'}
            aria-label="Bold"
            title="Bold (Ctrl+B)"
            onClick={() => toggleStyle('fontWeight', 700, 400)}
          >
            <b className="font-serif text-[13px] font-black">B</b>
          </PillButton>
          <PillDivider />
          <PillButton
            active={selected?.styles.fontStyle === 'italic'}
            aria-label="Italic"
            title="Italic (Ctrl+I)"
            onClick={() => toggleStyle('fontStyle', 'italic', 'normal')}
          >
            <i className="font-serif text-[13px] font-black italic">I</i>
          </PillButton>
          <PillDivider />
          <PillButton
            active={selected?.styles.textDecoration === 'underline'}
            aria-label="Underline"
            title="Underline (Ctrl+U)"
            onClick={() => toggleStyle('textDecoration', 'underline', 'none')}
          >
            <u className="font-serif text-[13px] font-black">U</u>
          </PillButton>
        </Pill>
        {separator}
        <Pill title="Text Alignment">
          <PillButton
            active={selected?.styles.textAlign === 'left'}
            aria-label="Align text left"
            title="Align Left"
            onClick={() => style('textAlign', 'left')}
          >
            <AlignLeft className="h-3.5 w-3.5 stroke-[2.25]" />
          </PillButton>
          <PillDivider />
          <PillButton
            active={selected?.styles.textAlign === 'center'}
            aria-label="Align text center"
            title="Align Center"
            onClick={() => style('textAlign', 'center')}
          >
            <AlignCenter className="h-3.5 w-3.5 stroke-[2.25]" />
          </PillButton>
          <PillDivider />
          <PillButton
            active={selected?.styles.textAlign === 'right'}
            aria-label="Align text right"
            title="Align Right"
            onClick={() => style('textAlign', 'right')}
          >
            <AlignRight className="h-3.5 w-3.5 stroke-[2.25]" />
          </PillButton>
        </Pill>
        {separator}
        <Pill title="Bullets & Numbering">
          <PillButton
            aria-label="Bullets"
            title="Bullets"
            onClick={() => listPrefix('bullet')}
          >
            <List className="h-3.5 w-3.5 stroke-[2.25] text-blue-600" />
          </PillButton>
          <PillDivider />
          <PillButton
            aria-label="Numbering"
            title="Numbering"
            onClick={() => listPrefix('number')}
          >
            <ListOrdered className="h-3.5 w-3.5 stroke-[2.25] text-blue-600" />
          </PillButton>
          <PillDivider />
          <PillButton
            aria-label="Multilevel list"
            title="Multilevel list"
            onClick={() => listPrefix('multilevel')}
          >
            <ListTree className="h-3.5 w-3.5 stroke-[2.25] text-blue-600" />
          </PillButton>
        </Pill>
        {separator}
        <label className="relative shrink-0">
          <span className="sr-only">Align objects</span>
          <select
            aria-label="Align objects"
            className="h-[26px] w-[78px] rounded-md border border-slate-300 bg-white pl-6 pr-1 text-[11.5px] font-medium text-slate-800 shadow-sm outline-none"
            value=""
            onChange={(event) => align(event.target.value)}
          >
            <option value="">Align</option>
            {[
              ['left', 'Left'],
              ['center', 'Center'],
              ['right', 'Right'],
              ['top', 'Top'],
              ['middle', 'Middle'],
              ['bottom', 'Bottom'],
              ['space-x', 'Distribute H'],
              ['space-y', 'Distribute V'],
              ['same-width', 'Same Width'],
              ['same-height', 'Same Height'],
              ['page-center', 'Center Page'],
            ].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <AlignLeft className="pointer-events-none absolute left-1.5 top-1.5 h-3.5 w-3.5 text-blue-600" />
        </label>
        {separator}
        <Pill title="Text and background colors">
          <label
            className="inline-flex h-[22px] min-w-[24px] px-1 items-center justify-center rounded border-0 bg-transparent text-slate-700 shadow-none transition hover:bg-slate-100 hover:text-slate-950 cursor-pointer relative"
            title="Text Color"
          >
            <span className="flex flex-col items-center font-serif text-xs font-extrabold leading-[9px]">
              A<span className="mt-0.5 h-[3px] w-3.5 rounded-sm bg-black" />
            </span>
            <input
              aria-label="Text color"
              type="color"
              className="absolute inset-0 cursor-pointer opacity-0"
              value={String(selected?.styles.color || '#000000')}
              onChange={(event) => style('color', event.target.value)}
            />
          </label>
          <PillDivider />
          <label
            className="inline-flex h-[22px] min-w-[24px] px-1 items-center justify-center gap-1 rounded border-0 bg-transparent text-slate-700 shadow-none transition hover:bg-slate-100 hover:text-slate-950 cursor-pointer relative"
            title="Background Color"
          >
            <PaintBucket className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-[11px] font-medium">Bg</span>
            <input
              aria-label="Background color"
              type="color"
              className="absolute inset-0 cursor-pointer opacity-0"
              value={String(selected?.styles.backgroundColor || '#ffffff')}
              onChange={(event) => style('backgroundColor', event.target.value)}
            />
          </label>
        </Pill>
        <div className="inline-flex h-[26px] shrink-0 items-center rounded-md border border-slate-300 bg-white shadow-sm overflow-hidden">
          <label className="relative flex items-center">
            <span className="sr-only">Border</span>
            <select
              aria-label="Border"
              className="h-[24px] w-[90px] border-0 bg-transparent pl-6 pr-1 text-[11.5px] font-medium text-slate-800 outline-none cursor-pointer"
              value=""
              onChange={(event) => {
                applyBorder(event.target.value);
                event.target.value = '';
              }}
            >
              <option value="">Border</option>
              <option value="all">All Borders</option>
              <option value="none">No Border</option>
              <option value="bottom">Bottom Border</option>
              <option value="top">Top Border</option>
              <option value="left">Left Border</option>
              <option value="right">Right Border</option>
              <option value="top-bottom">Top & Bottom</option>
              <option value="double-bottom">Double Bottom</option>
              <option value="thick">Thick Border</option>
              <option value="dashed">Dashed Border</option>
              <option value="custom">Borders & Shading...</option>
            </select>
            <PanelsTopLeft className="pointer-events-none absolute left-1.5 top-1 h-3.5 w-3.5 text-blue-600" />
          </label>
          <span className="h-3.5 w-px bg-slate-200 shrink-0" />
          <button
            type="button"
            className="flex h-full items-center px-1.5 text-[10px] font-bold text-blue-700 hover:bg-blue-50 transition cursor-pointer"
            title="Open Borders and Shading Dialog (किनार आणि पार्श्वभूमी रंग शैली)"
            onClick={() => setDialog('borders')}
          >
            ...
          </button>
        </div>
        {separator}
        <EditorButton className={buttonClass} onClick={() => setDialog('page')}>
          <PanelsTopLeft className="h-3.5 w-3.5 text-blue-600" />
          <span>Margins</span>
          <ChevronDown className="h-2.5 w-2.5 opacity-50" />
        </EditorButton>
      </div>
      {menu ? (
        <div
          data-toolbar-popover
          className="absolute top-[70px] z-[120] rounded-md border border-slate-300 bg-white p-2 text-[11px] text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.25)]"
          style={{
            left: menu.left,
            width:
              menu.name === 'table'
                ? 205
                : menu.name === 'shapes'
                  ? 230
                  : menu.name === 'watermark'
                    ? 250
                    : 200,
          }}
        >
          {menu.name === 'table' ? (
            <>
              <div className="mb-1 flex items-center justify-between">
                <strong className="text-[11px] text-slate-800">Insert Table</strong>
                <strong className="text-[10px] text-blue-600">
                  {tableHover.columns}×{tableHover.rows} Table
                </strong>
              </div>
              <div
                className="grid grid-cols-10 gap-[3px]"
                onMouseLeave={() => setTableHover({ rows: 1, columns: 1 })}
              >
                {Array.from({ length: 80 }, (_, index) => {
                  const row = Math.floor(index / 10) + 1;
                  const column = (index % 10) + 1;
                  const active = row <= tableHover.rows && column <= tableHover.columns;
                  return (
                    <button
                      type="button"
                      key={index}
                      aria-label={`${column} by ${row} table`}
                      className={`h-3.5 w-3.5 border ${active ? 'border-blue-600 bg-blue-100' : 'border-slate-300 bg-white'}`}
                      onMouseEnter={() => setTableHover({ rows: row, columns: column })}
                      onClick={() => {
                        insertTable(row, column);
                        setMenu(null);
                      }}
                    />
                  );
                })}
              </div>
              <div className="mt-2 border-t border-slate-200 pt-1">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded px-1 py-1 text-left hover:bg-slate-100"
                  onClick={() => {
                    insertTable(3, 4);
                    setMenu(null);
                  }}
                >
                  <Table2 className="h-3.5 w-3.5 text-blue-600" />{' '}
                  <span>
                    <u>I</u>nsert Table…
                  </span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded px-1 py-1 text-left hover:bg-slate-100"
                  onClick={() => {
                    insertTable(4, 4);
                    setMenu(null);
                  }}
                >
                  <Table2 className="h-3.5 w-3.5 text-emerald-600" />{' '}
                  <span>
                    <u>D</u>raw Table
                  </span>
                </button>
              </div>
            </>
          ) : null}
          {menu.name === 'shapes' ? (
            <>
              <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-600">
                Lines & Arrows
              </p>
              <div className="mb-2 grid grid-cols-3 gap-1">
                {[
                  { type: 'line' as const, label: 'Line', icon: Minus },
                  { type: 'line' as const, label: 'Right', icon: ArrowRight },
                  { type: 'line' as const, label: 'Down', icon: ArrowDown },
                ].map(({ type, label, icon: Icon }) => (
                  <button
                    key={label}
                    type="button"
                    className="flex h-11 flex-col items-center justify-center gap-0.5 rounded border border-slate-200 bg-white text-[9px] hover:border-blue-400 hover:bg-blue-50"
                    onClick={() => {
                      insert(type);
                      setMenu(null);
                    }}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>
              <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-600">
                Rectangles & Shapes
              </p>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { type: 'text' as const, label: 'Text Box', icon: 'A' },
                  {
                    type: 'rectangle' as const,
                    label: 'Rectangle',
                    icon: <Square className="h-4 w-4" />,
                  },
                  {
                    type: 'rectangle' as const,
                    label: 'Rounded',
                    icon: <span className="h-4 w-5 rounded border-2 border-slate-700" />,
                  },
                  {
                    type: 'circle' as const,
                    label: 'Circle',
                    icon: <Circle className="h-4 w-4" />,
                  },
                ].map(({ type, label, icon }) => (
                  <button
                    key={label}
                    type="button"
                    className="flex h-12 flex-col items-center justify-center gap-1 rounded border border-slate-200 bg-white text-[8.5px] hover:border-blue-400 hover:bg-blue-50"
                    onClick={() => {
                      insert(type);
                      setMenu(null);
                    }}
                  >
                    {typeof icon === 'string' ? (
                      <strong className="text-sm text-blue-600">{icon}</strong>
                    ) : (
                      icon
                    )}{' '}
                    {label}
                  </button>
                ))}
              </div>
            </>
          ) : null}
          {menu.name === 'watermark' ? (
            <>
              {['Confidential', 'Disclaimers'].map((group, groupIndex) => (
                <div key={group} className={groupIndex ? 'mt-2' : ''}>
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    {group}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(groupIndex
                      ? [
                          ['DRAFT', -45],
                          ['DRAFT', 0],
                          ['SAMPLE', -45],
                          ['ORIGINAL', -45],
                        ]
                      : [
                          ['CONFIDENTIAL', -45],
                          ['CONFIDENTIAL', 0],
                          ['DO NOT COPY', -45],
                          ['DO NOT COPY', 0],
                        ]
                    ).map(([text, rotation], index) => (
                      <button
                        key={`${text}-${rotation}-${index}`}
                        type="button"
                        className="h-[54px] overflow-hidden rounded border border-slate-200 bg-slate-50 px-1 hover:border-blue-400 hover:bg-blue-50"
                        onClick={() => {
                          change((definition) => ({
                            ...definition,
                            watermark: {
                              type: 'text',
                              text: String(text),
                              rotation: Number(rotation),
                              opacity: 0.18,
                              fontSize: 68,
                              color: '#94a3b8',
                            },
                          }));
                          setMenu(null);
                        }}
                      >
                        <span
                          className="block text-[8px] font-bold text-slate-400"
                          style={{ transform: `rotate(${Number(rotation) / 1.5}deg)` }}
                        >
                          {String(text)}
                        </span>
                        <span className="mt-2 block text-[8px] text-slate-500">
                          {String(text)} {index + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="mt-2 space-y-1 border-t border-slate-200 pt-1.5">
                <EditorButton
                  className="w-full justify-start border-blue-700 bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:text-white"
                  onClick={() => {
                    setDialog('watermark');
                    setMenu(null);
                  }}
                >
                  Custom Watermark…
                </EditorButton>
                <EditorButton
                  className="w-full justify-start text-red-600"
                  onClick={() => {
                    change((definition) => ({ ...definition, watermark: undefined }));
                    setMenu(null);
                  }}
                >
                  Remove Watermark
                </EditorButton>
              </div>
            </>
          ) : null}
          {menu.name === 'pageColor' ? (
            <>
              <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-600">
                Theme Colors
              </p>
              <div className="grid grid-cols-7 gap-1">
                {palette.map((color) => (
                  <button
                    type="button"
                    key={color}
                    aria-label={`Page color ${color}`}
                    className="h-4 w-4 border border-slate-300 hover:outline hover:outline-2 hover:outline-blue-500"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      change((definition) => ({ ...definition, pageColor: color }));
                      setMenu(null);
                    }}
                  />
                ))}
              </div>
              <div className="mt-2 space-y-1 border-t border-slate-200 pt-1.5">
                <EditorButton
                  className="w-full justify-start"
                  onClick={() => {
                    change((definition) => ({ ...definition, pageColor: '#ffffff' }));
                    setMenu(null);
                  }}
                >
                  No Color
                </EditorButton>
                <label className="relative flex h-[26px] w-full cursor-pointer items-center rounded-md border border-slate-200 bg-white px-2 text-[11px] hover:bg-slate-50">
                  More Colors…
                  <input
                    type="color"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    value={def.pageColor || '#ffffff'}
                    onChange={(event) => {
                      change((definition) => ({ ...definition, pageColor: event.target.value }));
                      setMenu(null);
                    }}
                  />
                </label>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
