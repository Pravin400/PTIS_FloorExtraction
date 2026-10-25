'use client';

import { useEffect, useState } from 'react';
import { Settings, Trash2 } from 'lucide-react';
import {
  loadDesignerReportSettings,
  updateDesignerReportSettings,
} from '@/lib/utils/reports/designer/designer-api';
import type {
  DesignerReportSettings,
  DesignerReportSettingsOptions,
} from '@/types/report-designer.types';
import {
  EditorButton,
  EditorDialog,
  EditorInput,
  EditorSelect,
} from '../components/EditorControls';

export function ReportSettingsDialog({
  reportId,
  close,
  saved,
}: {
  reportId: string;
  close: () => void;
  saved: (settings: DesignerReportSettings) => void;
}) {
  const [settings, setSettings] = useState<DesignerReportSettings | null>(null);
  const [options, setOptions] = useState<DesignerReportSettingsOptions | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    loadDesignerReportSettings(reportId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setSettings(data.settings);
          setOptions(data.options);
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : 'Settings could not be loaded.');
      });
    return () => controller.abort();
  }, [reportId]);

  const submit = async () => {
    if (!settings) return;
    setBusy(true);
    try {
      saved(await updateDesignerReportSettings(settings.templateId, settings));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Settings could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <EditorDialog
      title="Report Settings"
      subtitle="Module, tenant visibility and dynamic parameters"
      icon={<Settings className="h-[18px] w-[18px]" />}
      panelClassName="max-w-[820px]"
      bodyClassName="overflow-y-auto bg-slate-50 px-[18px] py-4"
      close={() => {
        if (!busy) close();
      }}
      footer={
        <div className="flex w-full items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-red-700">
            {error}
          </p>
          <EditorButton className="min-w-[78px]" onClick={close} disabled={busy}>
            Cancel
          </EditorButton>
          <EditorButton
            form="report-settings-form"
            type="submit"
            className="min-w-[120px] border-blue-700 bg-gradient-to-br from-blue-600 to-blue-700 font-bold text-white hover:from-blue-700 hover:to-blue-800 hover:text-white"
            disabled={busy || !settings}
          >
            Save Settings
          </EditorButton>
        </div>
      }
    >
      {settings && options ? (
        <form
          id="report-settings-form"
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <EditorInput
              label="Report Name *"
              value={settings.reportName}
              required
              onChange={(event) => setSettings({ ...settings, reportName: event.target.value })}
            />
            <EditorInput label="Report Code *" value={settings.reportCode} readOnly />
            <EditorSelect
              label="Module *"
              value={settings.moduleId || ''}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  moduleId: Number(event.target.value) || null,
                  moduleName:
                    options.modules.find((module) => String(module.id) === event.target.value)
                      ?.name || '',
                })
              }
            >
              <option value="">Others</option>
              {options.modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.name}
                </option>
              ))}
            </EditorSelect>
            <EditorSelect
              label="Tenant Visibility"
              value={settings.tenantScope}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  tenantScope: event.target.value as DesignerReportSettings['tenantScope'],
                })
              }
            >
              <option value="CurrentTenant">Current Tenant</option>
              <option value="Global">Global (All Tenants)</option>
            </EditorSelect>
            <EditorInput
              label="Data Source Code *"
              value={settings.dataSourceCode}
              onChange={(event) => setSettings({ ...settings, dataSourceCode: event.target.value })}
            />
            <EditorSelect
              label="Data Provider *"
              value={settings.dataProviderCode}
              onChange={(event) =>
                setSettings({ ...settings, dataProviderCode: event.target.value })
              }
            >
              {[...new Set([settings.dataProviderCode, ...options.dataProviderCodes])].map(
                (provider) => (
                  <option key={provider}>{provider}</option>
                )
              )}
            </EditorSelect>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-[7px] border border-blue-100 bg-blue-50 px-2.5 py-2">
            <span className="text-[10.5px] text-slate-600">
              {settings.tenantScope === 'Global'
                ? 'This report is available to all tenants.'
                : 'This report is visible only to the current tenant.'}
            </span>
            <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-bold text-slate-800">
              <input
                type="checkbox"
                checked={settings.isActive}
                onChange={(event) => setSettings({ ...settings, isActive: event.target.checked })}
              />
              Active / Visible to users
            </label>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 bg-blue-50 px-2.5 py-2 text-[11.5px] font-bold text-blue-900">
              <span>Dynamic Parameters</span>
              <EditorButton
                className="border-blue-700 bg-gradient-to-br from-blue-600 to-blue-700 px-2 font-semibold text-white hover:from-blue-700 hover:to-blue-800 hover:text-white"
                onClick={() =>
                  setSettings({
                    ...settings,
                    parameters: [
                      ...settings.parameters,
                      {
                        key: '',
                        label: '',
                        type: 'text',
                        isRequired: false,
                        sortOrder: settings.parameters.length,
                      },
                    ],
                  })
                }
              >
                + Add Parameter
              </EditorButton>
            </div>
            <div className="max-h-[260px] overflow-auto">
              <table className="w-full table-fixed border-collapse text-[10.5px]">
                <thead className="sticky top-0 bg-slate-50 text-left text-[10px] text-slate-600">
                  <tr>
                    <th className="w-[20%] border-b p-1.5">Key</th>
                    <th className="w-[25%] border-b p-1.5">Label</th>
                    <th className="w-[14%] border-b p-1.5">Type</th>
                    <th className="w-[18%] border-b p-1.5">Cascade From</th>
                    <th className="w-[9%] border-b p-1.5 text-center">Required</th>
                    <th className="w-[7%] border-b p-1.5">Order</th>
                    <th className="w-[7%] border-b p-1.5" />
                  </tr>
                </thead>
                <tbody>
                  {settings.parameters.map((parameter, index) => {
                    const update = (patch: Partial<typeof parameter>) =>
                      setSettings({
                        ...settings,
                        parameters: settings.parameters.map((value, row) =>
                          row === index ? { ...value, ...patch } : value
                        ),
                      });
                    const fieldClass =
                      'h-7 w-full rounded border border-slate-300 bg-white px-1.5 text-[10.5px] outline-none focus:border-blue-600';
                    return (
                      <tr key={`${parameter.key}-${index}`} className="border-b border-slate-100">
                        <td className="p-1">
                          <input
                            className={fieldClass}
                            value={parameter.key}
                            onChange={(event) => update({ key: event.target.value })}
                          />
                        </td>
                        <td className="p-1">
                          <input
                            className={fieldClass}
                            value={parameter.label}
                            onChange={(event) => update({ label: event.target.value })}
                          />
                        </td>
                        <td className="p-1">
                          <select
                            className={fieldClass}
                            value={parameter.type}
                            onChange={(event) => update({ type: event.target.value })}
                          >
                            {['text', 'number', 'date', 'select', 'boolean'].map((type) => (
                              <option key={type}>{type}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-1">
                          <input
                            className={fieldClass}
                            value={parameter.cascadeFromKey || ''}
                            onChange={(event) =>
                              update({ cascadeFromKey: event.target.value || null })
                            }
                          />
                        </td>
                        <td className="p-1 text-center">
                          <input
                            type="checkbox"
                            checked={parameter.isRequired}
                            onChange={(event) => update({ isRequired: event.target.checked })}
                          />
                        </td>
                        <td className="p-1">
                          <input
                            className={fieldClass}
                            type="number"
                            value={parameter.sortOrder}
                            onChange={(event) => update({ sortOrder: Number(event.target.value) })}
                          />
                        </td>
                        <td className="p-1 text-center">
                          <button
                            type="button"
                            aria-label="Remove parameter"
                            className="rounded p-1 text-red-500 hover:bg-red-50"
                            onClick={() =>
                              setSettings({
                                ...settings,
                                parameters: settings.parameters.filter((_, row) => row !== index),
                              })
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {!settings.parameters.length && (
                    <tr>
                      <td colSpan={7} className="p-5 text-center text-slate-400">
                        No dynamic parameters configured.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </form>
      ) : (
        <div className="grid min-h-44 place-items-center text-sm text-slate-500">
          Loading settings…
        </div>
      )}
    </EditorDialog>
  );
}
