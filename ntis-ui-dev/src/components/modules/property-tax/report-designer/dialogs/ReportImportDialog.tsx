'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ChevronDown, FilePlus2, Sparkles, Upload } from 'lucide-react';
import { reportDesignerApi, saveDesignerReport } from '@/lib/utils/reports/designer/designer-api';
import {
  canonicalProviderCode,
  matchDesignerDataSource,
} from '@/lib/utils/reports/designer/provider-schema';
import { readDefinition, resizePage } from '@/lib/utils/reports/designer/editor-model';
import {
  createBlankClassicReportDefinition,
  type ClassicReportDefinition,
} from '@/lib/utils/reports/designer/classic-adapter';
import { extractPdfLayout } from '@/lib/utils/reports/import/client/pdf-layout-client';
import type {
  DesignerDataSource,
  DesignerReportSettingsOptions,
} from '@/types/report-designer.types';
import {
  EditorButton,
  EditorDialog,
  EditorInput,
  EditorSelect,
} from '../components/EditorControls';

export function ReportImportDialog({
  importing,
  close,
  done,
}: {
  importing: boolean;
  close: () => void;
  done: (definition: ClassicReportDefinition) => void;
}) {
  const [options, setOptions] = useState<DesignerReportSettingsOptions>({
    currentTenantId: 0,
    modules: [],
    dataProviderCodes: [],
  });
  const [sources, setSources] = useState<DesignerDataSource[]>([]);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [provider, setProvider] = useState('');
  const [source, setSource] = useState('PROPERTY_TAX');
  const [rpt, setRpt] = useState<File | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);
  const [subreports, setSubreports] = useState<File[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [paper, setPaper] = useState('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [advanced, setAdvanced] = useState(true);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    const signal = new AbortController();
    reportDesignerApi
      .importOptions({ signal: signal.signal })
      .then(async (response) => {
        const data = (await response.json()) as {
          error?: string;
          options: DesignerReportSettingsOptions;
          dataSources: DesignerDataSource[];
        };
        if (!response.ok) throw new Error(data.error || 'Import options could not be loaded.');
        if (!signal.signal.aborted) {
          setOptions(data.options);
          setSources(data.dataSources);
        }
      })
      .catch((error) => {
        if (!signal.signal.aborted) setMessage(error.message);
      });
    return () => {
      mounted.current = false;
      signal.abort();
      controller.current?.abort();
    };
  }, []);
  const selectFile = (file: File | null, kind: 'rpt' | 'pdf') => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024 || !file.name.toLowerCase().endsWith(`.${kind}`)) {
      setMessage(`Select a .${kind} file up to 25 MB.`);
      return;
    }
    (kind === 'rpt' ? setRpt : setPdf)(file);
    if (!title) {
      const name = file.name.replace(/\.[^.]+$/, '');
      setTitle(name);
      setCode(
        name
          .replace(/[^A-Za-z0-9_]+/g, '_')
          .replace(/^[^A-Za-z]+/, '')
          .toUpperCase()
      );
    }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^[A-Za-z][A-Za-z0-9_]{2,99}$/.test(code)) {
      setMessage(
        'Report code must start with a letter and contain 3–100 letters, numbers or underscores.'
      );
      return;
    }
    if (!provider || (importing && !rpt && !pdf)) {
      setMessage('Select the data provider and report source.');
      return;
    }
    const signal = new AbortController();
    controller.current = signal;
    setBusy(true);
    setMessage('Preparing report…');
    try {
      let definition: ClassicReportDefinition;
      if (importing) {
        const form = new FormData();
        for (const [key, value] of Object.entries({
          reportId: code,
          reportName: title,
          moduleId,
          moduleName: options.modules.find((m) => String(m.id) === moduleId)?.name || '',
          dataProviderCode: provider,
          dataSourceCode: source,
          paperSize: paper,
          orientation,
          currentTenantId: String(options.currentTenantId),
        }))
          form.append(key, value);
        if (rpt) form.append('rptFile', rpt);
        if (pdf) {
          form.append('pdfFile', pdf);
          if (!rpt)
            form.append(
              'pdfLayout',
              JSON.stringify(
                await extractPdfLayout(pdf, (text) => {
                  if (mounted.current) setMessage(text);
                })
              )
            );
        }
        subreports.forEach((file) => form.append('subreports', file));
        if (signal.signal.aborted) return;
        const response = await fetch('/api/import-report', {
          method: 'POST',
          body: form,
          signal: signal.signal,
        });
        const data = (await response.json()) as {
          success?: boolean;
          definition?: ClassicReportDefinition;
          error?: string;
        };
        if (!response.ok || !data.success) throw new Error(data.error || 'Import failed.');
        definition = readDefinition(data.definition);
      } else {
        definition = resizePage(
          createBlankClassicReportDefinition(code, title),
          paper,
          orientation
        );
        definition.ntis = {
          ...definition.ntis!,
          dataProviderCode: provider,
          dataSourceCode: source,
          moduleId: moduleId ? Number(moduleId) : null,
          moduleName: options.modules.find((m) => String(m.id) === moduleId)?.name || '',
          tenantScope: 'CurrentTenant',
          currentTenantId: options.currentTenantId,
          tenantId: options.currentTenantId,
        };
      }
      const result = await saveDesignerReport(code, definition, false);
      if (!result.success) throw new Error(result.error || 'Report could not be saved.');
      if (mounted.current && !signal.signal.aborted)
        done({
          ...definition,
          ntis: {
            ...definition.ntis!,
            templateId: result.templateId || definition.ntis?.templateId,
            reportDefinitionId: result.reportDefinitionId || definition.ntis?.reportDefinitionId,
          },
        });
    } catch (error) {
      if (mounted.current && !signal.signal.aborted)
        setMessage(error instanceof Error ? error.message : 'Import failed.');
    } finally {
      if (mounted.current) setBusy(false);
    }
  };
  return (
    <EditorDialog
      title={importing ? 'नवीन अहवाल जोडा / इम्पोर्ट करा' : 'नवीन अहवाल तयार करा'}
      subtitle={
        importing
          ? 'फक्त .rpt किंवा PDF फाइल निवडा — आकार, मांडणी व डेटा फील्ड्स आपोआप सापडतील'
          : 'अहवालाची मूलभूत माहिती भरा आणि रिकामी मांडणी तयार करा'
      }
      icon={<FilePlus2 className="h-5 w-5" />}
      panelClassName="max-w-[680px]"
      bodyClassName="overflow-y-auto px-[22px] py-[18px]"
      close={() => {
        if (!busy) close();
      }}
      footer={
        <>
          <EditorButton
            className="h-[38px] min-w-[90px] px-4 text-[13px]"
            onClick={close}
            disabled={busy}
          >
            रद्द करा (Cancel)
          </EditorButton>
          <EditorButton
            form="report-import-form"
            type="submit"
            aria-label="Create draft"
            className="h-[38px] min-w-[160px] border-blue-700 bg-gradient-to-br from-blue-600 to-blue-700 px-5 text-[13px] font-semibold text-white hover:border-blue-800 hover:from-blue-700 hover:to-blue-800 hover:text-white"
            disabled={busy || !title.trim()}
          >
            {busy
              ? 'तयार करत आहे…'
              : importing
                ? 'अहवाल तयार करा (Generate)'
                : 'नवीन अहवाल तयार करा'}
          </EditorButton>
        </>
      }
    >
      <form id="report-import-form" onSubmit={submit} className="space-y-3.5">
        {importing && (
          <>
            <div className="flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-[12px] leading-5 text-blue-800">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                <strong>स्वयंचलित प्रणाली:</strong> .rpt फाइल टाकल्यावर कागदाचा आकार (A4/A3), मांडणी
                (Orientation) आणि अहवालाचे नाव आपोआप ओळखले जाईल.
              </p>
            </div>
            <label
              className="flex min-h-[110px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-4 text-center transition hover:border-blue-600 hover:bg-blue-50"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files[0];
                if (file)
                  selectFile(file, file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'rpt');
              }}
            >
              <input
                className="sr-only"
                type="file"
                aria-label="Crystal report (.rpt), up to 25 MB"
                accept=".rpt,.pdf"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  if (file)
                    selectFile(file, file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'rpt');
                }}
              />
              <span className="grid h-[42px] w-[42px] place-items-center rounded-full bg-blue-50 text-blue-600">
                <Upload className="h-[22px] w-[22px]" />
              </span>
              <span className="text-[13px] text-slate-800">
                <strong className="text-blue-600">.rpt / PDF फाइल निवडा</strong> किंवा येथे ड्रॅग
                करा
              </span>
              <span className="flex gap-1.5">
                <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  Crystal Report / PDF
                </span>
                <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-500">
                  कमाल 25 MB
                </span>
              </span>
            </label>
            {(rpt || pdf) && (
              <div className="rounded-[10px] border-[1.5px] border-green-300 bg-green-50 px-4 py-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[11.5px] font-bold text-green-700">
                    ✓ फाइल यशस्वीरित्या ओळखली (Auto-Detected)
                  </span>
                  <span className="rounded-md border border-green-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-green-700">
                    दुसरी फाइल निवडा
                  </span>
                </div>
                <div className="space-y-1.5 text-[11.5px]">
                  <div className="flex gap-2">
                    <span className="min-w-[140px] font-semibold text-slate-600">
                      निवडलेली फाइल:
                    </span>
                    <strong>{rpt?.name || pdf?.name}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="min-w-[140px] font-semibold text-slate-600">
                      कागदाचा आकार व मांडणी:
                    </span>
                    <strong className="rounded-md bg-green-100 px-2 py-0.5 text-green-700">
                      {paper} • {orientation === 'portrait' ? 'Portrait (उभी)' : 'Landscape (आडवी)'}
                    </strong>
                    <span className="rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">
                      आपोआप सेट केले
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div className="grid grid-cols-2 gap-3.5">
          <EditorInput
            label="अहवालाचे नाव / Report Title *"
            aria-label="Report title"
            value={title}
            maxLength={200}
            required
            onChange={(e) => setTitle(e.target.value)}
          />
          <EditorSelect
            label="विभाग / Module *"
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
          >
            <option value="">Select module</option>
            {options.modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </EditorSelect>
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[12px] font-semibold text-slate-700 hover:bg-slate-100"
            onClick={() => setAdvanced((value) => !value)}
          >
            <span>⚙</span>
            <span className="flex-1">प्रगत पर्याय (ऐच्छिक) / Advanced Options</span>
            <ChevronDown className={`h-3 w-3 transition ${advanced ? 'rotate-180' : ''}`} />
          </button>
          {advanced && (
            <div className="space-y-3 border-t border-slate-200 bg-white p-3.5">
              <div className="grid grid-cols-2 gap-3">
                <EditorSelect
                  label="Paper size"
                  value={paper}
                  onChange={(e) => setPaper(e.target.value)}
                >
                  {['A3', 'A4', 'A5', 'Letter', 'Legal'].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </EditorSelect>
                <EditorSelect
                  label="Orientation"
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as typeof orientation)}
                >
                  <option value="portrait">Portrait (उभी)</option>
                  <option value="landscape">Landscape (आडवी)</option>
                </EditorSelect>
                <EditorInput
                  label="अहवाल ID (English Code)"
                  aria-label="Report code"
                  value={code}
                  required
                  onChange={(e) => setCode(e.target.value)}
                />
                <EditorInput
                  label="Data Source Code"
                  value={source}
                  required
                  onChange={(e) => setSource(e.target.value)}
                />
              </div>
              <EditorSelect
                label="Data Provider / API Code"
                aria-label="Data provider"
                value={provider}
                onChange={(e) => {
                  const selected = e.target.value;
                  setProvider(selected);
                  const data = matchDesignerDataSource(sources, selected);
                  if (data) setSource(data.code);
                }}
                required
              >
                <option value="">Select provider</option>
                {[
                  ...new Set([
                    ...options.dataProviderCodes,
                    ...sources.map((s) => canonicalProviderCode(s)),
                  ]),
                ]
                  .filter((value) => value && value !== 'UnassignedReportDataProvider')
                  .sort()
                  .map((value) => (
                    <option key={value}>{value}</option>
                  ))}
              </EditorSelect>
              {importing && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <EditorInput
                    label="बाह्य Subreports (.rpt) पर्यायी"
                    type="file"
                    multiple
                    accept=".rpt"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (
                        files.length > 12 ||
                        files.some(
                          (file) =>
                            file.size > 25 * 1024 * 1024 ||
                            !file.name.toLowerCase().endsWith('.rpt')
                        )
                      )
                        setMessage('Select up to 12 .rpt subreports, each up to 25 MB.');
                      else setSubreports(files);
                    }}
                  />
                  <p className="mt-1 text-[10.5px] italic text-slate-500">
                    {subreports.length
                      ? subreports.map((file) => file.name).join(', ')
                      : 'कोणतीही बाह्य subreport जोडलेली नाही'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        {message ? (
          <p
            role="status"
            className={`rounded-lg border px-3 py-2 text-[11.5px] font-semibold ${
              /failed|invalid|select|could not/i.test(message)
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-green-200 bg-green-50 text-green-700'
            }`}
          >
            {message}
          </p>
        ) : null}
      </form>
    </EditorDialog>
  );
}
