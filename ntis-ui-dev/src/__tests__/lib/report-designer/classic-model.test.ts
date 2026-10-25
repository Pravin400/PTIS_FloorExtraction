import { describe, expect, it } from 'vitest';
import type { ClassicReportDefinition } from '@/lib/utils/reports/designer/classic-adapter';
import {
  appendClassicElement,
  appendClassicSection,
  bindClassicField,
  createClassicElement,
  createClassicSection,
  createDesignerTableStructure,
  deleteDesignerTableColumn,
  deleteDesignerTableRow,
  duplicateClassicElement,
  findClassicElement,
  insertDesignerTableColumn,
  insertDesignerTableRow,
  mergeDesignerTableCells,
  removeClassicElement,
  removeClassicSection,
  resizeDesignerTableStructure,
  resizeDesignerTableColumn,
  resizeDesignerTableRow,
  splitDesignerTableCell,
  unmergeDesignerTableCell,
  updateClassicElement,
  updateClassicElementStyles,
  updateClassicElementTable,
  updateClassicSection,
  updateDesignerTableCell,
  updateDesignerTableCellStyle,
  updateClassicPageSetup,
} from '@/lib/utils/reports/designer/classic-model';

const definition: ClassicReportDefinition = {
  reportId: 'TestReport',
  reportName: 'Test Report',
  reportCode: 'TestReport',
  layoutVersion: 1,
  schemaVersion: 3,
  paperSize: 'A4',
  orientation: 'portrait',
  widthMm: 210,
  heightMm: 297,
  pageWidth: 794,
  pageHeight: 1123,
  margins: { top: 0, right: 0, bottom: 0, left: 0 },
  recordsPerPage: 1,
  coordinateMode: 'page',
  sections: [
    {
      id: 'header',
      name: 'Header',
      height: 100,
      heightMm: 26.46,
      type: 'header',
      bandType: 'pageHeader',
      visible: true,
    },
  ],
  elements: [
    {
      id: 'title',
      sectionId: 'header',
      type: 'text',
      designerType: 'text',
      x: 10,
      y: 20,
      width: 100,
      height: 30,
      xMm: 2.65,
      yMm: 5.29,
      widthMm: 26.46,
      heightMm: 7.94,
      text: 'Original',
      styles: {},
      visible: true,
    },
  ],
};

describe('native classic report model', () => {
  it('updates an element without mutating the loaded definition', () => {
    const updated = updateClassicElement(definition, 'title', { text: 'Updated' });

    expect(findClassicElement(updated, 'title')?.text).toBe('Updated');
    expect(findClassicElement(definition, 'title')?.text).toBe('Original');
  });

  it('keeps pixel and millimetre geometry synchronized for backend saves', () => {
    const updated = updateClassicElement(definition, 'title', {
      x: 96,
      y: 48,
      width: 192,
      height: 24,
    });
    const element = findClassicElement(updated, 'title');

    expect(element).toMatchObject({
      xMm: 25.4,
      yMm: 12.7,
      widthMm: 50.8,
      heightMm: 6.35,
    });
  });

  it('merges element formatting without mutating the source styles', () => {
    const styled = updateClassicElementStyles(definition, 'title', {
      fontFamily: 'Noto Sans Devanagari',
      fontSize: '16px',
      fontWeight: 700,
      textAlign: 'center',
      color: '#0f172a',
      backgroundColor: '#f8fafc',
      borderWidth: 1,
      borderColor: '#0f766e',
      padding: '6px',
    });

    expect(findClassicElement(styled, 'title')?.styles).toMatchObject({
      fontSize: '16px',
      fontWeight: 700,
      textAlign: 'center',
      padding: '6px',
    });
    expect(findClassicElement(definition, 'title')?.styles).toEqual({});
  });

  it('adds, duplicates, and removes native designer elements immutably', () => {
    const added = createClassicElement('field', 'header');
    const withAdded = appendClassicElement(definition, added);
    const duplicated = duplicateClassicElement(withAdded, added.id);

    expect(added).toMatchObject({
      sectionId: 'header',
      designerType: 'field',
      text: '{FieldName}',
    });
    expect(duplicated.element?.id).not.toBe(added.id);
    expect(duplicated.definition.elements).toHaveLength(3);

    const removed = removeClassicElement(duplicated.definition, added.id);
    expect(findClassicElement(removed, added.id)).toBeNull();
    expect(definition.elements).toHaveLength(1);
  });

  it('inserts a dynamic field in the selected header section', () => {
    const bound = bindClassicField(definition, 'ownerName', 'header');

    expect(bound.element).toMatchObject({
      sectionId: 'header',
      designerType: 'field',
      fieldName: 'ownerName',
      text: '{ownerName}',
    });
    expect(bound.definition.elements).toHaveLength(2);
  });

  it('rebinds a selected text element instead of creating another header element', () => {
    const bound = bindClassicField(definition, 'propertyNumber', 'header', 'title');

    expect(bound.element).toMatchObject({
      id: 'title',
      fieldName: 'propertyNumber',
      text: '{propertyNumber}',
    });
    expect(bound.definition.elements).toHaveLength(1);
    expect(findClassicElement(definition, 'title')?.text).toBe('Original');
  });

  it('creates, updates, and removes report sections with their elements', () => {
    const footer = createClassicSection('pageFooter', 'Page Footer');
    const withFooter = appendClassicSection(definition, footer);
    const resized = updateClassicSection(withFooter, footer.id, { height: 96 });
    const footerElement = createClassicElement('text', footer.id);
    const withFooterElement = appendClassicElement(resized, footerElement);
    const removed = removeClassicSection(withFooterElement, footer.id);

    expect(resized.sections.at(-1)).toMatchObject({
      id: footer.id,
      type: 'footer',
      height: 96,
      heightMm: 25.4,
    });
    expect(removed.sections).toHaveLength(1);
    expect(findClassicElement(removed, footerElement.id)).toBeNull();
  });

  it('creates and resizes table structure while preserving existing cell content', () => {
    const table = createDesignerTableStructure(3, 3);
    expect(table.rows).toBe(3);
    expect(table.cols).toBe(3);
    expect(Object.keys(table.cells)).toHaveLength(9);

    const withContent = updateDesignerTableCell(table, 0, 1, 'Header Col');
    expect(withContent.cells['0_1']?.content).toBe('Header Col');

    const resized = resizeDesignerTableStructure(withContent, 4, 4);
    expect(resized.rows).toBe(4);
    expect(resized.cols).toBe(4);
    expect(Object.keys(resized.cells)).toHaveLength(16);
    expect(resized.cells['0_1']?.content).toBe('Header Col');
  });

  it('updates cell styles and formats immutably', () => {
    const table = createDesignerTableStructure(2, 2);
    const styled = updateDesignerTableCellStyle(table, 0, 0, {
      textAlign: 'center',
      fontWeight: 700,
      backgroundColor: '#f1f5f9',
    });

    expect(styled.cells['0_0']?.style).toMatchObject({
      textAlign: 'center',
      fontWeight: 700,
      backgroundColor: '#f1f5f9',
    });
    expect(table.cells['0_0']?.style?.backgroundColor).toBe('#e2e8f0');
  });

  it('creates a table element and binds dynamic field into a selected table cell', () => {
    const tableElement = createClassicElement('table', 'header');
    expect(tableElement.designerType).toBe('table');
    expect(tableElement.table).toBeDefined();

    const withTable = appendClassicElement(definition, tableElement);
    const bound = bindClassicField(withTable, 'wardNumber', 'header', tableElement.id, '1_2');

    const updatedElement = findClassicElement(bound.definition, tableElement.id);
    expect(updatedElement?.table?.cells['1_2']?.content).toBe('{wardNumber}');
    expect(updatedElement?.cellData?.['1_2']).toBe('{wardNumber}');
  });

  it('updates a table element structure using updateClassicElementTable', () => {
    const tableElement = createClassicElement('table', 'header');
    const withTable = appendClassicElement(definition, tableElement);
    const resized = resizeDesignerTableStructure(tableElement.table!, 4, 4);
    const updated = updateClassicElementTable(withTable, tableElement.id, resized);
    const found = findClassicElement(updated, tableElement.id);
    expect(found?.table?.rows).toBe(4);
    expect(found?.table?.cols).toBe(4);
  });

  it('inserts and deletes table rows and columns without losing cell content', () => {
    const table = updateDesignerTableCell(createDesignerTableStructure(2, 2), 1, 1, 'Keep me');
    const withRow = insertDesignerTableRow(table, 1);
    const withColumn = insertDesignerTableColumn(withRow, 1);

    expect(withColumn.rows).toBe(3);
    expect(withColumn.cols).toBe(3);
    expect(withColumn.cells['2_2']?.content).toBe('Keep me');

    const withoutRow = deleteDesignerTableRow(withColumn, 1);
    const withoutColumn = deleteDesignerTableColumn(withoutRow, 1);
    expect(withoutColumn.rows).toBe(2);
    expect(withoutColumn.cols).toBe(2);
    expect(withoutColumn.cells['1_1']?.content).toBe('Keep me');
  });

  it('merges and unmerges a rectangular cell selection', () => {
    const table = createDesignerTableStructure(3, 3);
    const merged = mergeDesignerTableCells(table, ['0_0', '0_1', '1_0', '1_1']);

    expect(merged.cells['0_0']).toMatchObject({ rowSpan: 2, colSpan: 2, hidden: false });
    expect(merged.cells['0_1']).toMatchObject({ hidden: true, mergedInto: '0_0' });
    expect(merged.cells['1_0']).toMatchObject({ hidden: true, mergedInto: '0_0' });

    const unmerged = unmergeDesignerTableCell(merged, '1_1');
    expect(unmerged.cells['0_0']).toMatchObject({ rowSpan: 1, colSpan: 1, hidden: false });
    expect(Object.values(unmerged.cells).every((cell) => cell.hidden !== true)).toBe(true);
  });

  it('splits a cell into rows and updates row and column sizes', () => {
    const table = createDesignerTableStructure(1, 2);
    const split = splitDesignerTableCell(table, '0_0', 'rows', 3);
    const sized = resizeDesignerTableRow(resizeDesignerTableColumn(split, 0, 125), 0, 44);

    expect(split.rows).toBe(3);
    expect(['0_0', '1_0', '2_0'].every((key) => split.cells[key]?.hidden !== true)).toBe(true);
    expect(sized.columnWidths[0]).toBe(125);
    expect(sized.rowHeights[0]).toBe(44);
  });

  it('does not split beyond the supported table dimensions', () => {
    const fullWidthTable = createDesignerTableStructure(1, 12);
    const unchanged = splitDesignerTableCell(fullWidthTable, '0_0', 'columns', 2);

    expect(unchanged.cols).toBe(12);
    expect(unchanged.cells['0_0']).toMatchObject({ colSpan: 1, hidden: false });
  });

  it('updates page setup: paper size, orientation, margins, and background color', () => {
    const updated = updateClassicPageSetup(definition, {
      paperSize: 'A3',
      orientation: 'landscape',
      margins: { top: 15, right: 12, bottom: 15, left: 12 },
      pageColor: '#f8fafc',
    });

    expect(updated.paperSize).toBe('A3');
    expect(updated.orientation).toBe('landscape');
    expect(updated.widthMm).toBe(420);
    expect(updated.heightMm).toBe(297);
    expect(updated.pageWidth).toBeGreaterThan(updated.pageHeight);
    expect(updated.margins).toEqual({ top: 15, right: 12, bottom: 15, left: 12 });
    expect(updated.pageColor).toBe('#f8fafc');
  });

  it('updates page setup: portrait orientation preserves vertical dimensions', () => {
    const updated = updateClassicPageSetup(definition, {
      paperSize: 'Legal',
      orientation: 'portrait',
    });

    expect(updated.paperSize).toBe('Legal');
    expect(updated.orientation).toBe('portrait');
    expect(updated.widthMm).toBeCloseTo(215.9, 1);
    expect(updated.heightMm).toBeCloseTo(355.6, 1);
    expect(updated.pageHeight).toBeGreaterThan(updated.pageWidth);
  });
});
