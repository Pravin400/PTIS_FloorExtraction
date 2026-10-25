'use client';

import { useState, type ReactNode } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Database,
  Folder,
  Image as ImageIcon,
  Plus,
  Search,
  Sigma,
  Type,
} from 'lucide-react';
import { englishFieldLabel } from '@/lib/utils/reports/designer/field-label';
import { toMm } from '@/lib/utils/reports/designer/editor-model';
import type { DesignerElementType } from '@/types/report-designer.types';
import { EditorButton, EditorInput } from '../components/EditorControls';
import type { useReportDesignerWorkspace } from '@/hooks/reports/designer/useReportDesignerWorkspace';

function TreeGroup({
  title,
  open,
  toggle,
  children,
}: {
  title: string;
  open: boolean;
  toggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="mt-1.5 first:mt-0">
      <button
        type="button"
        className="flex h-6 w-full items-center gap-1.5 rounded-sm bg-[#e1e7ed] px-2 text-left text-[10.5px] font-bold text-[#17365d] hover:bg-[#d5dee7]"
        onClick={toggle}
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <Folder className="h-3 w-3 fill-amber-300 text-amber-700" />
        <span className="truncate">{title}</span>
      </button>
      <div className={open ? 'block' : 'hidden'}>{children}</div>
    </div>
  );
}

const tools: Array<{
  type: DesignerElementType;
  title: string;
  description: string;
  icon: ReactNode;
}> = [
  { type: 'text', title: 'Heading', description: 'Large bold heading', icon: <b>H1</b> },
  {
    type: 'text',
    title: 'Text Label',
    description: 'Standard report text',
    icon: <Type className="h-4 w-4" />,
  },
  {
    type: 'field',
    title: 'DB Field',
    description: '{Field} data',
    icon: <Database className="h-4 w-4" />,
  },
  {
    type: 'line',
    title: 'Horizontal Line',
    description: 'Divider line',
    icon: <span className="text-lg">—</span>,
  },
  {
    type: 'rectangle',
    title: 'Rectangle',
    description: 'Box or border',
    icon: <span className="text-base">□</span>,
  },
  {
    type: 'circle',
    title: 'Circle',
    description: 'Round shape',
    icon: <span className="text-base">○</span>,
  },
  {
    type: 'image',
    title: 'Logo / Image',
    description: 'Report media',
    icon: <ImageIcon className="h-4 w-4" />,
  },
  {
    type: 'qr',
    title: 'QR Code',
    description: 'Dynamic QR value',
    icon: <span className="text-sm">▦</span>,
  },
  {
    type: 'table',
    title: 'Table',
    description: 'Rows and columns',
    icon: <span className="text-sm">▦</span>,
  },
  {
    type: 'signature',
    title: 'Signature',
    description: 'Signature image',
    icon: <span className="text-sm">✍</span>,
  },
];

export function ReportExplorer({
  workspace,
}: {
  workspace: ReturnType<typeof useReportDesignerWorkspace>;
}) {
  const {
    editor,
    state,
    change,
    def,
    tab,
    setTab,
    search,
    setSearch,
    setDialog,
    select,
    section,
    insert,
    moveSection,
  } = workspace;
  const [openTrees, setOpenTrees] = useState<Record<string, boolean>>({ data: true });
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const filteredFields = editor.fields.filter((field) =>
    `${field.name} ${englishFieldLabel(field.name, field.label)}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  const toggleTree = (key: string) =>
    setOpenTrees((current) => ({ ...current, [key]: !current[key] }));

  return (
    <aside className="flex w-[250px] shrink-0 flex-col overflow-hidden border-r-2 border-[#7f9db9] bg-[#f0f0f0]">
      <div className="flex h-[31px] shrink-0 border-b border-[#99aab8] bg-[#d8dee4]">
        {[
          ['fields', 'Field Explorer'],
          ['tools', 'Toolbox'],
          ['sections', 'Sections'],
        ].map(([value, label]) => (
          <button
            type="button"
            key={value}
            onClick={() => setTab(value as typeof tab)}
            aria-pressed={tab === value}
            className={`flex-1 border-r border-[#b5c2cc] px-1 text-center text-[11px] font-semibold ${
              tab === value
                ? 'border-b-2 border-b-[#0055ea] bg-[#f0f0f0] font-bold text-[#003366]'
                : 'bg-[#e4e9ed] text-slate-800 hover:bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {tab === 'fields' && (
          <>
            <div className="mb-2 flex h-[29px] items-center gap-1 border border-[#7f9db9] bg-white px-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-slate-600" />
              <input
                aria-label="Search data fields"
                className="min-w-0 flex-1 bg-transparent text-[11px] outline-none"
                placeholder="Search database fields..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <TreeGroup
              title="DATA FIELDS (Database)"
              open={Boolean(openTrees.data)}
              toggle={() => toggleTree('data')}
            >
              <div className="py-1 pl-2">
                {filteredFields.map((field) => {
                  const fieldKey = `${field.collectionPath}|${field.name}`;
                  const isSelected = selectedField === fieldKey;

                  return (
                    <button
                      type="button"
                      key={fieldKey}
                      className={`flex h-[27px] w-full cursor-grab items-center gap-1.5 rounded-sm border px-1.5 text-left text-[10.5px] active:cursor-grabbing ${
                        isSelected
                          ? 'border-[#b8d5ec] bg-[#dcecf8] text-[#004080]'
                          : 'border-transparent bg-white text-slate-700 hover:border-[#8bb5e0] hover:bg-[#e6f0fa] hover:text-[#004080]'
                      }`}
                      title={field.name}
                      draggable
                      onDragStart={(event) => {
                        setSelectedField(fieldKey);
                        event.dataTransfer.setData('application/ntis-field', field.name);
                      }}
                      onClick={() => {
                        setSelectedField(fieldKey);
                        insert(field.elementType || 'field', field.name);
                      }}
                    >
                      <Database className="h-3 w-3 shrink-0 text-[#1264d8]" strokeWidth={2} />
                      <span className="min-w-0 flex-1 truncate">
                        {englishFieldLabel(field.name, field.label)}
                      </span>
                      <span className="w-[74px] shrink-0 truncate text-right text-[8.5px] text-[#94a3b8]">
                        {field.name}
                      </span>
                    </button>
                  );
                })}
                {!filteredFields.length && (
                  <p className="px-1 py-2 text-[10px] italic text-slate-500">No matching fields</p>
                )}
              </div>
            </TreeGroup>
            <TreeGroup
              title="FORMULA FIELDS ({@})"
              open={Boolean(openTrees.formulas)}
              toggle={() => toggleTree('formulas')}
            >
              <button
                type="button"
                className="ml-3 mt-1 flex h-6 items-center gap-1 px-1 text-[10.5px] hover:bg-blue-100"
                onClick={() => insert('field', '@Formula')}
              >
                <Sigma className="h-3 w-3 text-orange-600" /> Formula
              </button>
            </TreeGroup>
            <TreeGroup
              title="SUMMARY FIELDS (∑)"
              open={Boolean(openTrees.summary)}
              toggle={() => toggleTree('summary')}
            >
              <div className="space-y-0.5 py-1 pl-3">
                {filteredFields
                  .filter((field) => field.type === 'number')
                  .map((field) => (
                    <button
                      type="button"
                      key={`summary-${field.name}`}
                      className="flex h-6 w-full items-center gap-1 truncate px-1 text-[10.5px] hover:bg-blue-100"
                      onClick={() => insert('field', field.name)}
                    >
                      <Sigma className="h-3 w-3 text-orange-600" />
                      <span className="truncate">{field.label}</span>
                    </button>
                  ))}
              </div>
            </TreeGroup>
            <TreeGroup
              title="REPORT PARAMETERS ({?})"
              open={Boolean(openTrees.parameters)}
              toggle={() => toggleTree('parameters')}
            >
              <div className="space-y-0.5 py-1 pl-3">
                {def.ntis?.parameters?.map((parameter) => (
                  <button
                    type="button"
                    key={parameter.key}
                    className="block h-6 w-full truncate px-1 text-left text-[10.5px] hover:bg-blue-100"
                    onClick={() => insert('field', `@${parameter.key}`)}
                  >
                    {parameter.label || parameter.key}
                  </button>
                ))}
              </div>
            </TreeGroup>
            <TreeGroup
              title="STATIC TEXT & SHAPES"
              open={Boolean(openTrees.static)}
              toggle={() => toggleTree('static')}
            >
              <div className="grid grid-cols-2 gap-1 p-1 pl-3">
                {(['text', 'line', 'rectangle', 'circle'] as DesignerElementType[]).map((type) => (
                  <EditorButton key={type} className="capitalize" onClick={() => insert(type)}>
                    {type}
                  </EditorButton>
                ))}
              </div>
            </TreeGroup>
          </>
        )}

        {tab === 'tools' && (
          <div className="space-y-3">
            <div>
              <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Typography, Shapes & Data
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {tools.map((tool) => (
                  <button
                    type="button"
                    key={`${tool.type}-${tool.title}`}
                    className="flex min-h-[66px] flex-col items-center justify-center rounded-md border border-slate-200 bg-white p-1.5 text-center shadow-sm hover:border-blue-300 hover:bg-blue-50"
                    onClick={() => insert(tool.type)}
                  >
                    <span className="mb-1 grid h-6 w-6 place-items-center rounded-full bg-blue-50 text-blue-600">
                      {tool.icon}
                    </span>
                    <span className="text-[10.5px] font-semibold text-slate-800">{tool.title}</span>
                    <span className="text-[9px] text-slate-500">{tool.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'sections' && (
          <div className="space-y-2">
            <EditorButton
              className="w-full border-blue-200 bg-blue-50 font-semibold text-blue-700"
              onClick={() => setDialog('section')}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Section</span>
            </EditorButton>
            <div className="flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <span>Sections List</span>
              <span className="rounded-full border border-blue-100 bg-blue-50 px-1.5 text-blue-600">
                {def.sections.length}
              </span>
            </div>
            {def.sections.map((item) => (
              <div
                key={item.id}
                className={`rounded-md border bg-white p-2 text-[11px] shadow-sm ${
                  item.id === state.sectionId
                    ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500/20'
                    : 'border-slate-300'
                }`}
              >
                <button
                  type="button"
                  className="w-full truncate text-left font-semibold text-slate-800"
                  onClick={() => select([], item.id)}
                >
                  {item.name}
                </button>
                <p className="truncate text-[9.5px] text-slate-500">
                  {item.bandType} {item.dataPath}
                </p>
                <div className="mt-1.5 flex gap-1">
                  <EditorButton title="Move up" onClick={() => moveSection(item.id, -1)}>
                    <ChevronUp className="h-3 w-3" />
                  </EditorButton>
                  <EditorButton title="Move down" onClick={() => moveSection(item.id, 1)}>
                    <ChevronDown className="h-3 w-3" />
                  </EditorButton>
                  <EditorButton
                    onClick={() =>
                      change((definition) => ({
                        ...definition,
                        sections: definition.sections.map((value) =>
                          value.id === item.id
                            ? { ...value, visible: value.visible === false }
                            : value
                        ),
                      }))
                    }
                  >
                    {item.visible === false ? 'Show' : 'Hide'}
                  </EditorButton>
                  <EditorButton
                    disabled={def.sections.length === 1}
                    onClick={() => {
                      change((definition) => ({
                        ...definition,
                        sections: definition.sections.filter((value) => value.id !== item.id),
                        elements: definition.elements.filter(
                          (element) => element.sectionId !== item.id
                        ),
                      }));
                      select([], def.sections.find((value) => value.id !== item.id)?.id);
                    }}
                  >
                    Remove
                  </EditorButton>
                </div>
              </div>
            ))}
            {section && (
              <div className="space-y-2 border-t border-slate-300 pt-2">
                <EditorInput
                  label="Section name"
                  value={section.name}
                  onChange={(event) =>
                    change((definition) => ({
                      ...definition,
                      sections: definition.sections.map((item) =>
                        item.id === section.id ? { ...item, name: event.target.value } : item
                      ),
                    }))
                  }
                />
                <EditorInput
                  label="Height (px)"
                  type="number"
                  min={1}
                  value={section.height}
                  onChange={(event) =>
                    change((definition) => ({
                      ...definition,
                      sections: definition.sections.map((item) =>
                        item.id === section.id
                          ? {
                              ...item,
                              height: Number(event.target.value),
                              heightMm: toMm(Number(event.target.value)),
                            }
                          : item
                      ),
                    }))
                  }
                />
                <EditorInput
                  label="Collection path"
                  value={section.dataPath || ''}
                  onChange={(event) =>
                    change((definition) => ({
                      ...definition,
                      sections: definition.sections.map((item) =>
                        item.id === section.id ? { ...item, dataPath: event.target.value } : item
                      ),
                    }))
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
