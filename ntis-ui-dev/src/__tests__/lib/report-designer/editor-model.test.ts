import { describe, expect, it } from 'vitest';
import {
  createBlankClassicReportDefinition,
  classicToNativeTemplate,
  nativeTemplateToClassic,
} from '@/lib/utils/reports/designer/classic-adapter';
import {
  createTable,
  editorReducer,
  initialEditor,
  newElement,
  newSection,
  readDefinition,
  resizePage,
  updateGeometry,
} from '@/lib/utils/reports/designer/editor-model';
import { changeTableAxis, mergeCells, splitCell } from '@/lib/utils/reports/designer/editor-table';

describe('React editor history and imported report preservation', () => {
  it('undoes a whole drag gesture and redoes it as one operation', () => {
    const definition = createBlankClassicReportDefinition('THANE_SPECIAL_NOTICE');
    definition.elements = [newElement('field', definition.sections[0].id, 30, 40, 'oldWardNo')];
    let state = editorReducer(initialEditor(definition), { type: 'checkpoint' });
    for (const x of [35, 40, 50])
      state = editorReducer(state, {
        type: 'change',
        checkpoint: false,
        definition: {
          ...state.definition,
          elements: state.definition.elements.map((e) => updateGeometry(e, { x })),
        },
      });
    expect(state.past).toHaveLength(1);
    state = editorReducer(state, { type: 'undo' });
    expect(state.definition.elements[0].x).toBe(30);
    expect(state.definition).toBe(state.saved);
    state = editorReducer(state, { type: 'redo' });
    expect(state.definition.elements[0].x).toBe(50);
  });
  it('retains edits made while an earlier revision was saving', () => {
    const state = initialEditor();
    const changed = editorReducer(state, {
      type: 'change',
      definition: { ...state.definition, reportName: 'Edited during save' },
    });
    const saved = editorReducer(changed, { type: 'saved', definition: state.definition });
    expect(saved.definition.reportName).toBe('Edited during save');
    expect(saved.definition).not.toBe(saved.saved);
  });
  it('preserves subreport paths, field formats, logo bindings and extension properties', () => {
    const definition = createBlankClassicReportDefinition('THANE_SPECIAL_NOTICE');
    const section = newSection('subreport', 'Tax heads', 'taxHeads');
    definition.sections.push(section);
    definition.elements = [
      {
        ...newElement('field', section.id, 10, 5, 'totalTax'),
        format: '0',
        properties: { importRole: 'CrystalField', custom: true },
      },
      newElement('image', definition.sections[0].id, 0, 0, 'ulbLogo'),
    ];
    const parsed = readDefinition(JSON.parse(JSON.stringify(definition)));
    const native = classicToNativeTemplate(parsed);
    expect(native.bands?.find((b) => b.id === section.id)?.dataPath).toBe('taxHeads');
    expect(native.bands?.find((b) => b.id === section.id)?.elements[0].properties?.custom).toBe(
      true
    );
    expect(parsed.elements[0].format).toBe('0');
    expect(
      nativeTemplateToClassic(native, { reportId: 'THANE_SPECIAL_NOTICE' }).elements[1].fieldName
    ).toBe('totalTax');
  });
  it('rejects corrupt geometry and unknown section references before importing JSON', () => {
    const definition = createBlankClassicReportDefinition('TEST');
    definition.elements = [newElement('text', 'missing')];
    expect(() => readDefinition(definition)).toThrow('section');
    definition.elements[0].sectionId = definition.sections[0].id;
    definition.elements[0].width = NaN;
    expect(() => readDefinition(definition)).toThrow('dimensions');
  });
  it('keeps distinct image, QR and table types and removes editor-only field borders', () => {
    expect(newElement('image', 'header', 0, 0, 'propertyPhoto').type).toBe('image');
    expect(newElement('qr', 'header').designerType).toBe('qr');
    expect(newElement('field', 'header', 0, 0, 'printDate').styles.border).toBeUndefined();
    expect(newElement('table', 'details').table?.version).toBe(1);
  });
  it('updates physical dimensions without changing report bindings or sections', () => {
    const definition = createBlankClassicReportDefinition('TEST');
    const result = resizePage(definition, 'A4', 'landscape');
    expect(result.widthMm).toBe(297);
    expect(result.heightMm).toBe(210);
    expect(result.sections).toBe(definition.sections);
  });
});

describe('React table editing', () => {
  it('merges rectangles and restores all covered cell contents when split', () => {
    const table = createTable(3, 3);
    table.cells['1_1'].content = '{rateableValue}';
    const merged = mergeCells(table, ['0_0', '1_1']);
    expect(merged.cells['0_0']).toMatchObject({ rowSpan: 2, colSpan: 2 });
    expect(merged.cells['1_1']).toMatchObject({ content: '{rateableValue}', hidden: true });
    const split = splitCell(merged, '1_1');
    expect(split.cells['1_1']).toMatchObject({ content: '{rateableValue}', hidden: false });
    expect(table.cells['1_1'].hidden).toBeUndefined();
  });
  it('inserts and deletes rows and columns without losing neighboring bindings', () => {
    const table = createTable(3, 3);
    table.cells['1_1'].content = '{oldPropertyNo}';
    const inserted = changeTableAxis(table, 'row', 1);
    expect(inserted.cells['2_1'].content).toBe('{oldPropertyNo}');
    const removed = changeTableAxis(inserted, 'row', 1, true);
    expect(removed.cells['1_1'].content).toBe('{oldPropertyNo}');
    const column = changeTableAxis(removed, 'column', 1);
    expect(column.cells['1_2'].content).toBe('{oldPropertyNo}');
    expect(changeTableAxis(column, 'column', 1, true)).toMatchObject(table);
  });
  it('prevents a zero-row table and rejects conflicting merge spans', () => {
    const one = createTable(1, 1);
    expect(changeTableAxis(one, 'row', 0, true)).toBe(one);
    const merged = mergeCells(createTable(2, 2), ['0_0', '0_1']);
    expect(() => mergeCells(merged, ['0_0', '1_0'])).toThrow('Split');
  });
  it('retains merged headers when inserting or deleting a row within their span', () => {
    const table = createTable(3, 3);
    table.cells['0_0'].content = 'Residential';
    const merged = mergeCells(table, ['0_0', '1_1']);
    const inserted = changeTableAxis(merged, 'row', 1);
    expect(inserted.cells['0_0']).toMatchObject({ content: 'Residential', rowSpan: 3, colSpan: 2 });
    expect(inserted.cells['2_1']).toMatchObject({ hidden: true, mergedInto: '0_0' });
    const removed = changeTableAxis(inserted, 'row', 0, true);
    expect(removed.cells['0_0']).toMatchObject({ content: 'Residential', rowSpan: 2, colSpan: 2 });
  });
});
