'use client';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  type ClassicElement,
} from '@/lib/utils/reports/designer/classic-adapter';
import { createTable, newElement, toMm, uid } from '@/lib/utils/reports/designer/editor-model';
import { escapeHtml, renderReport } from '@/lib/utils/reports/engine';
import type { ReportDefinition } from '@/lib/utils/reports/engine/types';
import type { DesignerBandType, DesignerElementType } from '@/types/report-designer.types';
import { useReportEditor } from '@/hooks/reports/designer/useReportEditor';
import type { ClassicReportDesignerProps } from '@/types/designer.types';
export function useReportDesignerWorkspace({
  locale = 'mr',
  defaultReportId,
  reportId,
  initialDefinition,
  openImporter = false,
  createNewReport = false,
}: ClassicReportDesignerProps) {
  const router = useRouter();
  const editor = useReportEditor(defaultReportId || reportId, initialDefinition);
  const { state, dispatch, change, updateElements, busy, message, setMessage } = editor;
  const def = state.definition;
  const [zoom, setZoom] = useState(1),
    [grid, setGrid] = useState(true),
    [snap, setSnap] = useState(true);
  const [tab, setTab] = useState<'fields' | 'tools' | 'sections'>('fields'),
    [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<
    | 'import'
    | 'new'
    | 'settings'
    | 'page'
    | 'preview'
    | 'section'
    | 'watermark'
    | 'reference'
    | 'json'
    | 'borders'
    | null
  >(() => (openImporter ? 'import' : createNewReport ? 'new' : null));
  const [tableElementId, setTableElementId] = useState<string | null>(null);
  const [sectionName, setSectionName] = useState('New Section'),
    [band, setBand] = useState<DesignerBandType>('detail'),
    [dataPath, setDataPath] = useState('');
  const [json, setJson] = useState(''),
    [sample, setSample] = useState('{}');
  const [pendingReportId, setPendingReportId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false),
    [resetOpen, setResetOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null),
    clipboard = useRef<ClassicElement[]>([]),
    previewFrame = useRef<HTMLIFrameElement>(null);
  const dirty = state.definition !== state.saved;
  const select = (ids: string[], sectionId?: string) =>
    dispatch({ type: 'select', ids, sectionId });
  const table = def.elements.find((e) => e.id === tableElementId),
    selected = def.elements.find((e) => e.id === state.selected[0]),
    section = def.sections.find((s) => s.id === state.sectionId);

  useEffect(() => {
    if (!dirty) return;
    const preventClose = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', preventClose);
    return () => window.removeEventListener('beforeunload', preventClose);
  }, [dirty]);
  const insert = (
    type: DesignerElementType,
    fieldName?: string,
    sectionId = state.sectionId,
    x = 20,
    y = 20
  ) => {
    const target = def.sections.find((s) => s.id === sectionId) || def.sections[0],
      field = editor.fields.find((f) => f.name === fieldName);
    if (field?.type === 'collection') {
      setBand('subreport');
      setDataPath(field.name);
      setSectionName(field.label);
      setDialog('section');
      return;
    }
    const binding =
      fieldName && target.dataPath && fieldName.startsWith(`${target.dataPath}.`)
        ? fieldName.slice(target.dataPath.length + 1)
        : fieldName;
    const element = newElement(type, target.id, x, y, binding);
    change((d) => ({ ...d, elements: [...d.elements, element] }));
    select([element.id], target.id);
  };
  const insertTable = (rows: number, columns: number) => {
    const target = def.sections.find((value) => value.id === state.sectionId) || def.sections[0];
    const width = Math.min(520, Math.max(160, columns * 72));
    const table = createTable(rows, columns, width);
    const element = {
      ...newElement('table', target.id, 20, 20),
      table,
      width: table.columnWidths.reduce((total, value) => total + value, 0),
      height: table.rowHeights.reduce((total, value) => total + value, 0),
    };
    change((definition) => ({ ...definition, elements: [...definition.elements, element] }));
    select([element.id], target.id);
  };
  const remove = () => {
    change((d) => ({
      ...d,
      elements: d.elements.filter((e) => !state.selected.includes(e.id) || e.locked),
    }));
    select([]);
  };
  const copy = () => {
    clipboard.current = structuredClone(def.elements.filter((e) => state.selected.includes(e.id)));
  };
  const paste = () => {
    const elements = clipboard.current.map((e) => ({
      ...e,
      id: uid(),
      sectionId: state.sectionId,
      x: e.x + 10,
      y: e.y + 10,
      xMm: toMm(e.x + 10),
      yMm: toMm(e.y + 10),
    }));
    if (!elements.length) return;
    change((d) => ({ ...d, elements: [...d.elements, ...elements] }));
    select(elements.map((e) => e.id));
  };
  const duplicate = () => {
    copy();
    paste();
  };
  const style = (key: string, value: string | number) =>
    updateElements(state.selected, (e) => ({ styles: { ...e.styles, [key]: value } }));
  const toggleStyle = (key: string, value: string | number, off: string | number) =>
    updateElements(state.selected, (e) => ({
      styles: { ...e.styles, [key]: e.styles[key] === value ? off : value },
    }));
  const align = (mode: string) => {
    const elements = def.elements.filter((e) => state.selected.includes(e.id));
    if (!elements.length) return;
    const x = Math.min(...elements.map((e) => e.x)),
      right = Math.max(...elements.map((e) => e.x + e.width)),
      y = Math.min(...elements.map((e) => e.y)),
      bottom = Math.max(...elements.map((e) => e.y + e.height));
    const sorted = [...elements].sort((a, b) => (mode === 'space-x' ? a.x - b.x : a.y - b.y));
    const gap =
      mode === 'space-x'
        ? (right - x - elements.reduce((n, e) => n + e.width, 0)) / Math.max(1, elements.length - 1)
        : (bottom - y - elements.reduce((n, e) => n + e.height, 0)) /
          Math.max(1, elements.length - 1);
    updateElements(state.selected, (e) => {
      if (mode === 'left') return { x };
      if (mode === 'right') return { x: right - e.width };
      if (mode === 'center') return { x: (x + right - e.width) / 2 };
      if (mode === 'top') return { y };
      if (mode === 'bottom') return { y: bottom - e.height };
      if (mode === 'middle') return { y: (y + bottom - e.height) / 2 };
      if (mode === 'page-center')
        return {
          x: Math.max(0, (def.pageWidth - e.width) / 2),
          y: Math.max(0, (def.pageHeight - e.height) / 2),
        };
      if (mode === 'same-width') return { width: elements[0].width };
      if (mode === 'same-height') return { height: elements[0].height };
      const i = sorted.findIndex((v) => v.id === e.id);
      return mode === 'space-x'
        ? { x: x + sorted.slice(0, i).reduce((n, v) => n + v.width + gap, 0) }
        : { y: y + sorted.slice(0, i).reduce((n, v) => n + v.height + gap, 0) };
    });
  };
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      dialog ||
      table ||
      pendingReportId ||
      deleteOpen ||
      resetOpen ||
      (event.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"]')
    )
      return;
    const modifier = event.ctrlKey || event.metaKey,
      key = event.key.toLowerCase();
    if (modifier && ['s', 'z', 'y', 'c', 'v', 'd', 'a'].includes(key)) {
      event.preventDefault();
      if (key === 's') void editor.save();
      else if (key === 'z') dispatch({ type: event.shiftKey ? 'redo' : 'undo' });
      else if (key === 'y') dispatch({ type: 'redo' });
      else if (key === 'c') copy();
      else if (key === 'v') paste();
      else if (key === 'd') duplicate();
      else select(def.elements.filter((e) => e.sectionId === state.sectionId).map((e) => e.id));
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      remove();
    } else if (event.key === 'Escape') select([]);
    else if (event.key.startsWith('Arrow') && state.selected.length) {
      event.preventDefault();
      const step = event.shiftKey ? 10 : 1,
        dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0,
        dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
      updateElements(state.selected, (e) =>
        e.locked
          ? {}
          : event.altKey
            ? { width: Math.max(1, e.width + dx), height: Math.max(1, e.height + dy) }
            : { x: Math.max(0, e.x + dx), y: Math.max(0, e.y + dy) }
      );
    }
  };
  const preview = useMemo(() => {
    if (dialog !== 'preview') return '';
    try {
      const placeholderData: Record<string, unknown> = {
        CouncilName: 'श्रीरामपूर नगरपरिषद, श्रीरामपूर',
        CouncilHeader: 'श्रीरामपूर नगरपरिषद, श्रीरामपूर जि. अहिल्यानगर',
        CouncilDistrict: 'जि. अहिल्यानगर',
        CouncilAddress: 'मुख्यालय प्रशासकीय भवन, श्रीरामपूर',
        CouncilLogo: '',
        ulbLogo: '',
        propertyPhoto: '',
        PropertyPhoto: '',
        PropertyPhotoA11: '',
        ulbNameLocal: 'श्रीरामपूर नगरपरिषद, श्रीरामपूर',
        ulbName: 'Municipal Corporation',
        ulbCode: 'MC',
        financeYear: '२०२६-२७',
        userName: 'प्रशासक (Admin)',
        ulbMobileNo: '०२२-१२३४५६७',
        ulbEmailId: 'contact@ulb.gov.in',
        ulbWebsiteUrl: 'www.ulb.gov.in',
        ulbAddress: 'मुख्यालय प्रशासकीय भवन',
        ownerTitle: 'श्री.',
        ownerName: 'रमेश पांडुरंग पाटील',
        occupierTitle: 'श्रीमती',
        occupierName: 'अनिता सचिन कदम',
        propertyNo: '१०१/अ',
        wardNo: '०४',
        partitionNo: '००१',
        flatOrShopNo: 'सदनिका क्र. ३०२',
        flatOrShopName: 'गोकुळ धाम',
        address: 'स्टेशन रोड, प्रभाग क्र. ०४',
        mobileNo: '९८७६५४३२१०',
        upicId: 'UPIC4030101',
      };

      (def?.elements || []).forEach((element) => {
        if (!element.fieldName) return;
        const fieldName = String(element.fieldName).replace(/^[@{}]+|[{}]+$/g, '').trim();
        if (!fieldName || fieldName.startsWith('#')) return;
        placeholderData[fieldName] = `{{${fieldName}}}`;
        placeholderData[element.fieldName] = `{{${fieldName}}}`;
      });

      (def?.elements || []).forEach((element) => {
        if (element.text && typeof element.text === 'string') {
          const matches = element.text.match(/\{\{\s*([^{}]+?)\s*\}\}|\{\s*([^{}]+?)\s*\}/g);
          if (matches) {
            matches.forEach((m) => {
              const raw = m.replace(/^[{}]/g, '').replace(/[{}]/g, '').trim();
              const clean = raw.replace(/^[@]/, '');
              if (!clean.startsWith('#')) {
                placeholderData[clean] = `{{${clean}}}`;
                placeholderData[raw] = `{{${clean}}}`;
              }
            });
          }
        }
      });

      (def?.sections || [])
        .filter((section) => section.bandType === 'subreport' && section.dataPath)
        .forEach((section) => {
          const childElements = (def.elements || []).filter(
            (element) => element.sectionId === section.id && element.fieldName
          );
          placeholderData[section.dataPath!] = [1, 2, 3].map((rowNumber) => {
            const row: Record<string, unknown> = {};
            childElements.forEach((element) => {
              const fieldName = String(element.fieldName).replace(/^[@{}]+|[{}]+$/g, '').trim();
              row[fieldName] = `{{${fieldName} ${rowNumber}}}`;
            });
            return row;
          });
        });

      let userData: Record<string, unknown> = {};
      try {
        if (sample && sample.trim() && sample.trim() !== '{}') {
          const parsed = JSON.parse(sample) as Record<string, unknown>;
          if (parsed && typeof parsed === 'object') userData = parsed;
        }
      } catch {
        // ignore invalid user sample JSON
      }

      const previewData = { ...placeholderData, ...userData };
      const rendered = renderReport(
        def as unknown as ReportDefinition,
        [previewData]
      );
      const safeTitle = escapeHtml(def.reportName || def.reportCode || 'Report Preview');
      return `<!doctype html>
<html><head><meta charset="utf-8"><title>${safeTitle} - Design Preview</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Martel:wght@400;600;700;800&family=Mukta:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700;800&family=Noto+Serif+Devanagari:wght@400;600;700&family=Poppins:wght@400;500;600;700;800&family=Rozha+One&family=Tiro+Devanagari+Marathi:ital@0;1&family=Yatra+One&display=swap" rel="stylesheet">
${rendered.stylesHtml}
<style>
  * { box-sizing: border-box; }
  html {
    margin: 0; padding: 0;
    background: #525659;
    min-height: 100%;
  }
  body {
    margin: 0; padding: 24px 20px 60px;
    background: #525659;
    font-family: 'Noto Sans Devanagari', Arial, sans-serif;
    min-height: 100%;
    display: flex; flex-direction: column; align-items: center;
    overflow-y: auto; overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .preview-container {
    width: 100%;
    display: flex; flex-direction: column; align-items: center;
  }
  .report-page {
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45);
    background: #ffffff;
    margin: 0 auto 28px auto;
    flex-shrink: 0;
  }
  @media print {
    html, body { background: #ffffff !important; padding: 0 !important; margin: 0 !important; overflow: visible !important; }
    .preview-container { display: block !important; padding: 0 !important; }
    .report-page { box-shadow: none !important; margin: 0 !important; }
  }
</style></head><body>
<div class="preview-container">
${rendered.pagesHtml}</div></body></html>`;
    } catch {
      return '<p style="color:white;padding:24px;font-family:sans-serif;">Preview rendering failed.</p>';
    }
  }, [def, dialog, sample]);
  const moveSection = (id: string, step: number) =>
    change((d) => {
      const sections = [...d.sections],
        index = sections.findIndex((s) => s.id === id),
        next = index + step;
      if (next < 0 || next >= sections.length) return d;
      [sections[index], sections[next]] = [sections[next], sections[index]];
      return { ...d, sections };
    });
  const exportJson = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(def, null, 2)], { type: 'application/json' })
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `${def.reportCode}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const go = (id: string) => {
    setPendingReportId(null);
    if (id === '__back') router.push(`/${locale}/property-tax/reports`);
    else if (id === '__new') setDialog('new');
    else if (id === '__import') setDialog('import');
    else void editor.load(id);
  };

  return {
    locale,
    defaultReportId,
    reportId,
    openImporter,
    createNewReport,
    router,
    editor,
    state,
    dispatch,
    change,
    updateElements,
    busy,
    message,
    setMessage,
    def,
    zoom,
    setZoom,
    grid,
    setGrid,
    snap,
    setSnap,
    tab,
    setTab,
    search,
    setSearch,
    dialog,
    setDialog,
    tableElementId,
    setTableElementId,
    sectionName,
    setSectionName,
    band,
    setBand,
    dataPath,
    setDataPath,
    json,
    setJson,
    sample,
    setSample,
    pendingReportId,
    setPendingReportId,
    deleteOpen,
    setDeleteOpen,
    resetOpen,
    setResetOpen,
    root,
    clipboard,
    previewFrame,
    dirty,
    select,
    table,
    selected,
    section,
    insert,
    insertTable,
    remove,
    copy,
    paste,
    duplicate,
    style,
    toggleStyle,
    align,
    keyDown,
    preview,
    moveSection,
    exportJson,
    go,
  };
}
