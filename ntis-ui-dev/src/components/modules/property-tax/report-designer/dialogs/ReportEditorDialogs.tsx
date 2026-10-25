'use client';
import { createPortal } from 'react-dom';
import type { useReportDesignerWorkspace } from '@/hooks/reports/designer/useReportDesignerWorkspace';
import { createBlankClassicReportDefinition } from '@/lib/utils/reports/designer/classic-adapter';
import {
  newElement,
  newSection,
  PAPER_PRESETS,
  readDefinition,
  resizePage,
  toMm,
} from '@/lib/utils/reports/designer/editor-model';
import { reportDesignerApi } from '@/lib/utils/reports/designer/designer-api';
import type { DesignerBandType } from '@/types/report-designer.types';
import { ReportImportDialog } from './ReportImportDialog';
import { ReportSettingsDialog } from './ReportSettingsDialog';
import { ReportTableDialog } from './ReportTableDialog';
import { ReportBordersShadingDialog } from './ReportBordersShadingDialog';
import {
  EditorButton,
  EditorDialog,
  EditorInput,
  EditorSelect,
} from '../components/EditorControls';
const bands: DesignerBandType[] = [
  'pageHeader',
  'reportHeader',
  'groupHeader',
  'detail',
  'groupFooter',
  'reportFooter',
  'pageFooter',
  'subreport',
];
export function ReportEditorDialogs({
  workspace,
}: {
  workspace: ReturnType<typeof useReportDesignerWorkspace>;
}) {
  const {
    editor,
    dispatch,
    change,
    updateElements,
    busy,
    setMessage,
    def,
    dialog,
    setDialog,
    setTableElementId,
    sectionName,
    setSectionName,
    band,
    setBand,
    dataPath,
    setDataPath,
    json,
    setJson,
    pendingReportId,
    setPendingReportId,
    deleteOpen,
    setDeleteOpen,
    resetOpen,
    setResetOpen,
    previewFrame,
    select,
    table,
    preview,
    go,
  } = workspace;
  return (
    <>
      {' '}
      {(dialog === 'import' || dialog === 'new') && (
        <ReportImportDialog
          importing={dialog === 'import'}
          close={() => setDialog(null)}
          done={(definition) => {
            dispatch({ type: 'load', definition });
            setDialog(null);
            void editor.refresh().then(() => editor.load(definition.reportId));
          }}
        />
      )}
      {dialog === 'settings' && (
        <ReportSettingsDialog
          reportId={def.reportId}
          close={() => setDialog(null)}
          saved={(settings) => {
            setDialog(null);
            change((d) => ({
              ...d,
              reportName: settings.reportName,
              ntis: { ...d.ntis, ...settings },
            }));
          }}
        />
      )}
      {table && (
        <ReportTableDialog
          element={table}
          close={() => setTableElementId(null)}
          save={(tableModel) => {
            updateElements([table.id], {
              table: tableModel,
              width: tableModel.columnWidths.reduce((a, b) => a + b, 0),
              height: tableModel.rowHeights.reduce((a, b) => a + b, 0),
            });
            setTableElementId(null);
          }}
        />
      )}
      {dialog === 'page' && (
        <EditorDialog title="Page setup" close={() => setDialog(null)}>
          <div className="grid grid-cols-2 gap-3">
            <EditorSelect
              label="Paper size"
              value={def.paperSize}
              onChange={(e) => change((d) => resizePage(d, e.target.value, d.orientation))}
            >
              {[...new Set([...Object.keys(PAPER_PRESETS), def.paperSize, 'Custom'])].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </EditorSelect>
            <EditorSelect
              label="Orientation"
              value={def.orientation}
              onChange={(e) =>
                change((d) => resizePage(d, d.paperSize, e.target.value as typeof d.orientation))
              }
            >
              <option>portrait</option>
              <option>landscape</option>
            </EditorSelect>
            <EditorInput
              label="Width (mm)"
              type="number"
              min={1}
              value={def.widthMm}
              onChange={(e) =>
                change((d) => ({
                  ...d,
                  paperSize: 'Custom',
                  widthMm: Math.max(1, Number(e.target.value)),
                  pageWidth: Math.round((Math.max(1, Number(e.target.value)) * 96) / 25.4),
                }))
              }
            />
            <EditorInput
              label="Height (mm)"
              type="number"
              min={1}
              value={def.heightMm}
              onChange={(e) =>
                change((d) => ({
                  ...d,
                  paperSize: 'Custom',
                  heightMm: Math.max(1, Number(e.target.value)),
                  pageHeight: Math.round((Math.max(1, Number(e.target.value)) * 96) / 25.4),
                }))
              }
            />
            {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
              <EditorInput
                key={side}
                label={`${side} margin (mm)`}
                type="number"
                min={0}
                value={def.margins[side]}
                onChange={(e) =>
                  change((d) => ({
                    ...d,
                    margins: { ...d.margins, [side]: Math.max(0, Number(e.target.value)) },
                  }))
                }
              />
            ))}
            <EditorInput
              label="Page background"
              type="color"
              value={def.pageColor || '#ffffff'}
              onChange={(e) => change((d) => ({ ...d, pageColor: e.target.value }))}
            />
            <EditorInput
              label="Records per page"
              type="number"
              min={1}
              value={def.recordsPerPage}
              onChange={(e) =>
                change((d) => ({ ...d, recordsPerPage: Math.max(1, Number(e.target.value)) }))
              }
            />
            {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
              <EditorInput
                key={`border-${side}`}
                label={`${side} page border`}
                value={def.pageBorder?.[side] || ''}
                placeholder="1px solid #000080"
                onChange={(e) =>
                  change((d) => ({ ...d, pageBorder: { ...d.pageBorder, [side]: e.target.value } }))
                }
              />
            ))}
          </div>
        </EditorDialog>
      )}
      {dialog === 'section' && (
        <EditorDialog title="Add section / subreport" close={() => setDialog(null)}>
          <div className="space-y-3">
            <EditorInput
              label="Name"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
            />
            <EditorSelect
              label="Band type"
              value={band}
              onChange={(e) => setBand(e.target.value as DesignerBandType)}
            >
              {bands.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </EditorSelect>
            <EditorInput
              label="Repeating collection path"
              value={dataPath}
              placeholder="taxHeads / propertyDetails"
              onChange={(e) => setDataPath(e.target.value)}
            />
            <EditorButton
              onClick={() => {
                const next = newSection(band, sectionName, dataPath.trim() || undefined);
                const fields = editor.fields
                  .filter(
                    (f) =>
                      f.collectionPath === dataPath &&
                      f.type !== 'object' &&
                      f.type !== 'collection'
                  )
                  .slice(0, 12);
                const width = Math.min(100, def.pageWidth / Math.max(1, fields.length));
                const childElements =
                  band === 'subreport'
                    ? fields.map((f, i) => ({
                        ...newElement(
                          f.elementType === 'image' ? 'image' : 'field',
                          next.id,
                          i * width,
                          2,
                          f.name.startsWith(`${dataPath}.`)
                            ? f.name.slice(dataPath.length + 1)
                            : f.name
                        ),
                        width: width - 2,
                        widthMm: toMm(width - 2),
                      }))
                    : [];
                change((d) => ({
                  ...d,
                  sections: [...d.sections, next],
                  elements: [...d.elements, ...childElements],
                }));
                select([], next.id);
                setDialog(null);
              }}
            >
              Add section
            </EditorButton>
          </div>
        </EditorDialog>
      )}
      {dialog === 'watermark' && (
        <EditorDialog
          title="Printed Watermark (छापील वॉटरमार्क)"
          subtitle="अहवालाच्या प्रत्येक पानामागे मजकूर किंवा चित्र दाखवा"
          icon={<span className="text-lg font-extrabold">A</span>}
          blueHeader
          panelClassName="max-w-[640px]"
          bodyClassName="overflow-y-auto px-5 py-4"
          close={() => setDialog(null)}
          footer={
            <div className="flex w-full justify-between">
              <EditorButton
                className="border-red-300 bg-red-50 font-semibold text-red-600 hover:bg-red-100 hover:text-red-700"
                onClick={() => change((d) => ({ ...d, watermark: undefined }))}
              >
                Remove Watermark
              </EditorButton>
              <div className="flex gap-2">
                <EditorButton onClick={() => setDialog(null)}>Cancel</EditorButton>
                <EditorButton
                  className="min-w-[90px] border-blue-700 bg-gradient-to-br from-blue-600 to-blue-700 font-bold text-white hover:from-blue-700 hover:to-blue-800 hover:text-white"
                  onClick={() => setDialog(null)}
                >
                  Apply
                </EditorButton>
              </div>
            </div>
          }
        >
          <div className="flex gap-4">
            <div className="min-w-0 flex-1 space-y-2.5">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-[12px] font-bold text-slate-800">
                <input
                  type="radio"
                  name="watermark-type"
                  checked={!def.watermark}
                  onChange={() => change((d) => ({ ...d, watermark: undefined }))}
                />
                वॉटरमार्क नाही (No watermark)
              </label>
              <section
                className={`rounded-lg border px-3.5 py-3 ${def.watermark?.type === 'image' ? 'border-blue-500 bg-white shadow-sm' : 'border-slate-200 bg-slate-50'}`}
              >
                <label className="mb-2.5 flex cursor-pointer items-center gap-2 text-[12px] font-bold text-slate-800">
                  <input
                    type="radio"
                    name="watermark-type"
                    checked={def.watermark?.type === 'image'}
                    onChange={() =>
                      change((d) => ({ ...d, watermark: { ...d.watermark, type: 'image' } }))
                    }
                  />
                  चित्र वॉटरमार्क (Picture watermark)
                </label>
                <div className="pl-6">
                  <EditorInput
                    label="Image URL"
                    placeholder="/logo_1.png"
                    value={def.watermark?.imageUrl || ''}
                    onChange={(e) =>
                      change((d) => ({
                        ...d,
                        watermark: { ...d.watermark, type: 'image', imageUrl: e.target.value },
                      }))
                    }
                  />
                </div>
              </section>
              <section
                className={`rounded-lg border px-3.5 py-3 ${def.watermark?.type !== 'image' && def.watermark ? 'border-blue-500 bg-white shadow-sm' : 'border-slate-200 bg-slate-50'}`}
              >
                <label className="mb-2.5 flex cursor-pointer items-center gap-2 text-[12px] font-bold text-slate-800">
                  <input
                    type="radio"
                    name="watermark-type"
                    checked={def.watermark?.type !== 'image' && Boolean(def.watermark)}
                    onChange={() =>
                      change((d) => ({
                        ...d,
                        watermark: {
                          ...d.watermark,
                          type: 'text',
                          text: d.watermark?.text || 'CONFIDENTIAL',
                        },
                      }))
                    }
                  />
                  मजकूर वॉटरमार्क (Text watermark)
                </label>
                <div className="space-y-2 pl-6">
                  <div className="grid grid-cols-[1fr_130px] gap-2">
                    <EditorInput
                      label="Text"
                      value={def.watermark?.text || ''}
                      onChange={(e) =>
                        change((d) => ({
                          ...d,
                          watermark: { ...d.watermark, type: 'text', text: e.target.value },
                        }))
                      }
                    />
                    <EditorSelect
                      label="Presets"
                      value=""
                      onChange={(e) =>
                        change((d) => ({
                          ...d,
                          watermark: { ...d.watermark, type: 'text', text: e.target.value },
                        }))
                      }
                    >
                      <option value="">Choose…</option>
                      {[
                        'CONFIDENTIAL',
                        'DRAFT',
                        'SAMPLE',
                        'ORIGINAL',
                        'CANCELLED',
                        'DO NOT COPY',
                      ].map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </EditorSelect>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <EditorInput
                      label="Font size"
                      type="number"
                      min={1}
                      value={def.watermark?.fontSize || 68}
                      onChange={(e) =>
                        change((d) => ({
                          ...d,
                          watermark: { ...d.watermark, fontSize: Number(e.target.value) },
                        }))
                      }
                    />
                    <EditorInput
                      label="Opacity"
                      type="number"
                      min={0}
                      max={1}
                      step={0.05}
                      value={def.watermark?.opacity ?? 0.2}
                      onChange={(e) =>
                        change((d) => ({
                          ...d,
                          watermark: { ...d.watermark, opacity: Number(e.target.value) },
                        }))
                      }
                    />
                    <EditorInput
                      label="Rotation"
                      type="number"
                      value={def.watermark?.rotation ?? -45}
                      onChange={(e) =>
                        change((d) => ({
                          ...d,
                          watermark: { ...d.watermark, rotation: Number(e.target.value) },
                        }))
                      }
                    />
                  </div>
                </div>
              </section>
            </div>
            <div className="flex w-[150px] shrink-0 flex-col items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Preview
              </span>
              <div className="relative flex h-[185px] w-[135px] items-center justify-center overflow-hidden rounded border border-slate-300 bg-white shadow-md">
                {def.watermark?.type === 'image' && def.watermark.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={def.watermark.imageUrl}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                    style={{
                      opacity: def.watermark.opacity ?? 0.2,
                      transform: `rotate(${def.watermark.rotation ?? 0}deg)`,
                    }}
                  />
                ) : (
                  <span
                    className="max-w-[180px] whitespace-nowrap font-bold text-slate-400"
                    style={{
                      opacity: def.watermark?.opacity ?? 0.2,
                      fontSize: Math.max(12, (def.watermark?.fontSize || 68) / 3.4),
                      transform: `rotate(${def.watermark?.rotation ?? -45}deg)`,
                    }}
                  >
                    {def.watermark?.text || 'WATERMARK'}
                  </span>
                )}
              </div>
              <span className="text-center text-[9px] text-slate-400">
                A4 पानावर वॉटरमार्क कसा दिसेल
              </span>
            </div>
          </div>
        </EditorDialog>
      )}
      {dialog === 'preview' && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex flex-col bg-[#525659]"
          style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}
        >
          <div className="flex h-[38px] shrink-0 items-center justify-between bg-[#0f172a] px-4 text-white shadow-md">
            <strong className="text-[13px] font-bold tracking-wide">
              {def.reportName || def.reportCode || 'Report'} - Design Preview
            </strong>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => previewFrame.current?.contentWindow?.print()}
                className="rounded bg-[#2563eb] px-4 py-1 text-xs font-bold text-white shadow transition hover:bg-blue-600 active:bg-blue-700"
              >
                Print
              </button>
              <button
                type="button"
                onClick={() => setDialog(null)}
                aria-label="Close preview"
                className="rounded px-2.5 py-1 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                ✕ Close
              </button>
            </div>
          </div>
          <div className="relative flex-1 min-h-0 w-full h-[calc(100vh-38px)]">
            <iframe
              ref={previewFrame}
              title={`${def.reportName || def.reportCode || 'Report'} - Design Preview`}
              srcDoc={preview}
              className="absolute inset-0 h-full w-full border-0 bg-[#525659]"
              sandbox="allow-same-origin allow-modals allow-scripts"
            />
          </div>
        </div>,
        document.body
      )}
      {dialog === 'borders' && (
        <ReportBordersShadingDialog workspace={workspace} close={() => setDialog(null)} />
      )}
      {dialog === 'reference' && (
        <EditorDialog title="Reference PDF" close={() => setDialog(null)}>
          <iframe
            title="Original report PDF"
            src={`/api/reference-pdf?reportId=${encodeURIComponent(def.reportId)}`}
            className="h-[75vh] w-full"
          />
        </EditorDialog>
      )}
      {dialog === 'json' && (
        <EditorDialog title="Import report JSON" close={() => setDialog(null)}>
          <EditorInput
            label="Report JSON file"
            type="file"
            accept=".json"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file && file.size <= 25 * 1024 * 1024) setJson(await file.text());
            }}
          />
          <textarea
            aria-label="Report JSON"
            value={json}
            rows={12}
            className="mt-3 w-full rounded border p-2 font-mono text-xs"
            onChange={(e) => setJson(e.target.value)}
          />
          <EditorButton
            onClick={() => {
              try {
                const imported = readDefinition(JSON.parse(json));
                change(() => ({
                  ...imported,
                  reportId: def.reportId,
                  reportCode: def.reportCode,
                  ntis: def.ntis,
                }));
                select([]);
                setDialog(null);
              } catch (e) {
                setMessage(e instanceof Error ? e.message : 'Invalid JSON.');
              }
            }}
          >
            Apply layout
          </EditorButton>
        </EditorDialog>
      )}
      {pendingReportId && (
        <EditorDialog title="Unsaved changes" close={() => setPendingReportId(null)}>
          <p className="mb-4 text-sm">Save your changes before leaving this report?</p>
          <div className="flex gap-2">
            <EditorButton onClick={() => setPendingReportId(null)}>Cancel</EditorButton>
            <EditorButton onClick={() => go(pendingReportId)}>Discard changes</EditorButton>
            <EditorButton
              disabled={busy}
              onClick={async () => {
                if (await editor.save()) go(pendingReportId);
              }}
            >
              Save and continue
            </EditorButton>
          </div>
        </EditorDialog>
      )}
      {deleteOpen && (
        <EditorDialog title="Delete report" close={() => setDeleteOpen(false)}>
          <p className="mb-3 text-sm">Delete {def.reportName}?</p>
          <EditorButton
            onClick={async () => {
              try {
                const response = await reportDesignerApi.deleteReport(def.ntis?.templateId || 0);
                if (!response.ok) throw new Error('Report could not be deleted.');
                dispatch({
                  type: 'load',
                  definition: createBlankClassicReportDefinition('CUSTOM_REPORT', 'New Report'),
                });
                setDeleteOpen(false);
                await editor.refresh();
              } catch (e) {
                setMessage(e instanceof Error ? e.message : 'Delete failed.');
              }
            }}
          >
            Delete report
          </EditorButton>
        </EditorDialog>
      )}
      {resetOpen && (
        <EditorDialog title="Reset report" close={() => setResetOpen(false)}>
          <p className="mb-3 text-sm">Restore the report default and discard the current layout?</p>
          <EditorButton
            onClick={async () => {
              try {
                const response = await reportDesignerApi.resetDesign(def.reportId);
                if (!response.ok) throw new Error('Reset failed.');
                await editor.load(def.reportId);
                setResetOpen(false);
              } catch (e) {
                setMessage(e instanceof Error ? e.message : 'Reset failed.');
              }
            }}
          >
            Reset layout
          </EditorButton>
        </EditorDialog>
      )}
    </>
  );
}
