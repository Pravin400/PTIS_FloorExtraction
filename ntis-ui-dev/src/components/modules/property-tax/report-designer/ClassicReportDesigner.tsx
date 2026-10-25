'use client';

import { useState } from 'react';
import { ReportCanvas } from './canvas/ReportCanvas';
import { EditorLanguage } from './components/EditorLanguage';
import { ReportEditorToolbar } from './components/ReportEditorToolbar';
import { ReportEditorDialogs } from './dialogs/ReportEditorDialogs';
import { useReportDesignerWorkspace } from '@/hooks/reports/designer/useReportDesignerWorkspace';
import { ReportExplorer } from './sidebar/ReportExplorer';
import { ReportProperties } from './sidebar/ReportProperties';
import type { ClassicReportDesignerProps } from '@/types/designer.types';

export function ClassicReportDesigner(props: ClassicReportDesignerProps) {
  const workspace = useReportDesignerWorkspace(props);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const {
    state,
    dispatch,
    change,
    updateElements,
    def,
    zoom,
    grid,
    snap,
    root,
    keyDown,
    select,
    setTableElementId,
    editor,
    insert,
  } = workspace;

  return (
    <EditorLanguage locale={workspace.locale}>
      <div
        ref={root}
        tabIndex={-1}
        onKeyDown={keyDown}
        onPointerDown={(event) => {
          if (
            !(event.target as HTMLElement).closest('input,textarea,select,button,[role="dialog"]')
          )
            root.current?.focus({ preventScroll: true });
        }}
        className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#525659] font-[Segoe_UI,Tahoma,sans-serif] text-[11px] text-slate-950 outline-none"
        aria-label="Report designer"
      >
        <ReportEditorToolbar workspace={workspace} />
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          <ReportExplorer workspace={workspace} />
          <ReportCanvas
            state={state}
            zoom={zoom}
            grid={grid}
            snap={snap}
            select={select}
            checkpoint={() => dispatch({ type: 'checkpoint' })}
            update={updateElements}
            change={change}
            edit={(element) => {
              if (element.type === 'table') setTableElementId(element.id);
              else {
                select([element.id], element.sectionId);
                setPropertiesOpen(true);
              }
            }}
            dropField={(name, sectionId, x, y) =>
              insert(
                editor.fields.find((field) => field.name === name)?.elementType || 'field',
                name,
                sectionId,
                x,
                y
              )
            }
          />
          <ReportProperties
            open={propertiesOpen}
            close={() => setPropertiesOpen(false)}
            definition={def}
            selected={state.selected}
            fields={editor.fields}
            update={(updates) =>
              updateElements(state.selected, (element) => ({
                ...updates,
                ...(updates.styles ? { styles: { ...element.styles, ...updates.styles } } : {}),
              }))
            }
            editTable={(element) => setTableElementId(element.id)}
          />
        </div>
        <ReportEditorDialogs workspace={workspace} />
      </div>
    </EditorLanguage>
  );
}
