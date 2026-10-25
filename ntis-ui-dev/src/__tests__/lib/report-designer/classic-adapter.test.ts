import { describe, expect, it } from 'vitest';
import {
  classicToNativeTemplate,
  createBlankClassicReportDefinition,
  nativeTemplateToClassic,
} from '@/lib/utils/reports/designer/classic-adapter';
import { paginateReportTemplate } from '@/lib/utils/reports/designer/layout';
import type { DesignerTemplate } from '@/types/report-designer.types';

const DYNAMIC_TEMPLATE: DesignerTemplate = {
  schemaVersion: 3,
  reportCode: 'DynamicAssessment',
  recordsPerPage: 1,
  page: {
    size: 'A4',
    orientation: 'portrait',
    widthMm: 210,
    heightMm: 297,
    margin: { topMm: 10, rightMm: 10, bottomMm: 10, leftMm: 10 },
    background: '#ffffff',
  },
  elements: [],
  bands: [
    {
      id: 'report-header',
      type: 'reportHeader',
      heightMm: 25,
      elements: [
        { id: 'frame', type: 'rectangle', x: 0, y: 0, w: 190, h: 24, style: {} },
        { id: 'title', type: 'text', x: 5, y: 5, w: 100, h: 8, text: 'Dynamic report', style: {} },
      ],
    },
    {
      id: 'property-detail',
      type: 'detail',
      dataPath: 'properties',
      heightMm: 20,
      elements: [
        { id: 'property-no', type: 'field', path: 'propertyNo', x: 5, y: 5, w: 60, h: 8, style: {} },
      ],
    },
    {
      id: 'page-footer',
      type: 'pageFooter',
      heightMm: 10,
      elements: [],
    },
  ],
};

const SAMPLE_DYNAMIC_DATA = { properties: [{ propertyNo: 'PT-001' }] };

describe('classic dynamic report designer adapter', () => {
  it('preserves tax row visibility conditions when a template is edited and saved', () => {
    const template = structuredClone(DYNAMIC_TEMPLATE);
    const visibility = {
      operator: 'equals' as const,
      left: { path: 'rowType' },
      right: { literal: 'subtotal' },
    };
    template.bands![1].elements[0].visibility = visibility;
    const restored = classicToNativeTemplate(nativeTemplateToClassic(template));
    expect(restored.bands![1].elements[0].visibility).toEqual(visibility);
  });
  it.each([
    { type: 'text' as const, text: 'THANE DRAFT', fontFamily: 'Arial', fontSize: 64,
      color: 'rgba(148, 163, 184, 0.35)', rotation: -45, semitransparent: true },
    { type: 'image' as const, imageUrl: 'data:image/png;base64,aGVsbG8=',
      scale: '50%', washout: true, opacity: 0.18 },
  ])('retains the $type page watermark when saving and reopening a report', (watermark) => {
    const classic = nativeTemplateToClassic(DYNAMIC_TEMPLATE);
    const original = classicToNativeTemplate(classic);
    classic.watermark = watermark;

    const saved = classicToNativeTemplate(classic);
    const reopened = nativeTemplateToClassic(saved);

    expect(saved.watermark).toEqual(watermark);
    expect(reopened.watermark).toEqual(watermark);
    expect(saved.bands).toEqual(original.bands);
    expect(saved.elements).toEqual(original.elements);
    expect(saved.watermark).not.toBe(watermark);
    expect(reopened.watermark).not.toBe(saved.watermark);
  });

  it('removes a saved page watermark when Remove Watermark is applied', () => {
    const classic = nativeTemplateToClassic({
      ...DYNAMIC_TEMPLATE, watermark: { type: 'text', text: 'DRAFT' },
    });
    classic.watermark = null;

    const saved = classicToNativeTemplate(classic);

    expect(saved).not.toHaveProperty('watermark');
    expect(nativeTemplateToClassic(saved)).not.toHaveProperty('watermark');
  });

  it('creates a generic blank A4 definition for any report code', () => {
    const blank = createBlankClassicReportDefinition('FutureReport');

    expect(blank.reportId).toBe('FutureReport');
    expect(blank.reportCode).toBe('FutureReport');
    expect(blank.ntis?.dataSourceCode).toBe('UNASSIGNED');
    expect(blank.sections.map((section) => section.id)).toEqual([
      'report-header',
      'details',
      'page-footer',
    ]);
  });

  it('exposes native dynamic bands and fields to the classic designer', () => {
    const classic = nativeTemplateToClassic(DYNAMIC_TEMPLATE);

    expect(classic.reportId).toBe('DynamicAssessment');
    expect(classic.reportCode).toBe('DynamicAssessment');
    expect(classic.coordinateMode).toBe('page');
    expect(classic.paperSize).toBe('A4');
    expect(classic.orientation).toBe('portrait');
    expect(classic.sections.some((section) => section.id === 'property-detail')).toBe(true);
    expect(classic.sections.find((section) => section.id === 'property-detail')?.dataPath)
      .toBe('properties');
    expect(classic.elements.some((element) => element.id === 'frame')).toBe(true);
    expect(classic.elements.some((element) => element.fieldName === 'propertyNo')).toBe(true);
  });

  it('round-trips the editable layout back to the NTIS v3 contract', () => {
    const classic = nativeTemplateToClassic(DYNAMIC_TEMPLATE);
    const propertyNo = classic.elements.find((element) => element.fieldName === 'propertyNo');
    expect(propertyNo).toBeDefined();

    if (propertyNo) {
      propertyNo.x = 120;
      propertyNo.xMm = 31.75;
      propertyNo.styles.verticalAlign = 'bottom';
    }

    const native = classicToNativeTemplate(classic);
    const savedPropertyNo = native.bands
      ?.flatMap((band) => band.elements)
      .find((element) => element.path === 'propertyNo');

    expect(native.schemaVersion).toBe(3);
    expect(native.reportCode).toBe('DynamicAssessment');
    expect(native.recordsPerPage).toBe(1);
    expect(native.page.margin).toEqual(DYNAMIC_TEMPLATE.page.margin);
    expect(savedPropertyNo?.x).toBe(31.75);
    expect(savedPropertyNo?.style?.verticalAlign).toBe('bottom');
  });

  it('does not persist legacy designer-only field borders', () => {
    const classic = nativeTemplateToClassic(DYNAMIC_TEMPLATE);
    const propertyNo = classic.elements.find((element) => element.fieldName === 'propertyNo');
    expect(propertyNo).toBeDefined();

    if (propertyNo) {
      propertyNo.styles = {
        ...propertyNo.styles,
        border: '1px solid #000000',
        backgroundColor: '#ffffff',
        padding: '2px',
      };
    }

    const savedPropertyNo = classicToNativeTemplate(classic).bands
      ?.flatMap((band) => band.elements)
      .find((element) => element.path === 'propertyNo');

    expect(savedPropertyNo?.style?.borderWidth).toBeUndefined();
    expect(savedPropertyNo?.style?.borderColor).toBeUndefined();
  });

  it('keeps the converted template valid for one-property pagination', () => {
    const native = classicToNativeTemplate(
      nativeTemplateToClassic(DYNAMIC_TEMPLATE)
    );
    const layout = paginateReportTemplate(native, SAMPLE_DYNAMIC_DATA);

    expect(layout.pages).toHaveLength(1);
    expect(layout.warnings).toEqual([]);
  });

  it('normalizes legacy classic-only element types before backend save', () => {
    const classic = nativeTemplateToClassic(DYNAMIC_TEMPLATE);
    const importedBox = classic.elements.find((element) => element.type === 'box');
    expect(importedBox).toBeDefined();

    if (importedBox) importedBox.designerType = 'box' as never;
    const legacySubreport = classic.elements.find((element) => element.type === 'field');
    if (legacySubreport) {
      legacySubreport.type = 'subreport';
      legacySubreport.designerType = 'subreport' as never;
    }
    const native = classicToNativeTemplate(classic);
    const savedBox = native.bands
      ?.flatMap((band) => band.elements)
      .find((element) => element.id === importedBox?.id);

    expect(savedBox?.type).toBe('rectangle');
    expect(
      native.bands
        ?.flatMap((band) => band.elements)
        .find((element) => element.id === legacySubreport?.id)?.type
    ).toBe('container');
  });

  it('persists an inferred field catalog used by the subreport wizard', () => {
    const classic = nativeTemplateToClassic(DYNAMIC_TEMPLATE);
    classic.fieldCatalog = [
      { name: 'properties', label: 'Properties', type: 'collection', elementType: 'table' },
      {
        name: 'properties.propertyNo',
        label: 'Property Number',
        type: 'string',
        elementType: 'field',
        collectionPath: 'properties',
      },
    ];

    const restored = nativeTemplateToClassic(classicToNativeTemplate(classic));

    expect(restored.fieldCatalog).toEqual(classic.fieldCatalog);
  });

  it('round-trips OCR editing metadata used by scanned PDF layers', () => {
    const classic = nativeTemplateToClassic(DYNAMIC_TEMPLATE);
    const title = classic.elements.find((element) => element.id === 'title');
    expect(title).toBeDefined();
    if (title) {
      title.properties = {
        importRole: 'ocrText',
        sourceText: 'Dynamic report',
        ocrEdited: false,
      };
      title.styles.opacity = 0;
      title.styles.objectFit = 'fill';
    }

    const restored = nativeTemplateToClassic(classicToNativeTemplate(classic));
    const restoredTitle = restored.elements.find((element) => element.id === 'title');

    expect(restoredTitle?.properties).toEqual(title?.properties);
    expect(restoredTitle?.styles.opacity).toBe(0);
    expect(restoredTitle?.styles.objectFit).toBe('fill');
  });

  it('round-trips merged static table cells and sizing metadata', () => {
    const classic = nativeTemplateToClassic(DYNAMIC_TEMPLATE);
    classic.elements.push({
      id: 'merged-table',
      sectionId: classic.sections[0].id,
      type: 'table',
      designerType: 'table',
      x: 10,
      y: 10,
      width: 240,
      height: 80,
      xMm: 2.65,
      yMm: 2.65,
      widthMm: 63.5,
      heightMm: 21.17,
      cols: 3,
      rows: 2,
      table: {
        version: 1,
        rows: 2,
        cols: 3,
        columnWidths: [80, 90, 70],
        rowHeights: [30, 50],
        cells: {
          '0_0': { content: 'Merged heading', colSpan: 3, style: { textAlign: 'center', fontWeight: 700 } },
          '0_1': { content: '', hidden: true, mergedInto: '0_0' },
          '0_2': { content: '', hidden: true, mergedInto: '0_0' },
          '1_0': { content: '{propertyNo}' },
          '1_1': { content: 'Owner' },
          '1_2': { content: 'Amount', style: { backgroundColor: '#fef3c7', wrap: false } },
        },
      },
      styles: {},
      visible: true,
    });

    const restored = nativeTemplateToClassic(classicToNativeTemplate(classic));
    const table = restored.elements.find((element) => element.id === 'merged-table');

    expect(table?.table?.cells['0_0'].colSpan).toBe(3);
    expect(table?.table?.cells['0_2'].mergedInto).toBe('0_0');
    expect(table?.table?.columnWidths).toEqual([80, 90, 70]);
    expect(table?.table?.rowHeights).toEqual([30, 50]);
    expect(table?.table?.cells['1_2'].style?.backgroundColor).toBe('#fef3c7');
  });

  it('normalizes encoded imported text before displaying and saving it', () => {
    const encodedTemplate: DesignerTemplate = {
      ...DYNAMIC_TEMPLATE,
      bands: DYNAMIC_TEMPLATE.bands?.map((band) => ({
        ...band,
        elements: band.elements.map((element) => (
          element.id === 'title'
            ? { ...element, text: '&amp;#x20;Notice &lt;119&gt;' }
            : element
        )),
      })),
    };

    const classic = nativeTemplateToClassic(encodedTemplate);
    const title = classic.elements.find((element) => element.id === 'title');
    expect(title?.text).toBe(' Notice <119>');

    const savedTitle = classicToNativeTemplate(classic).bands
      ?.flatMap((band) => band.elements)
      .find((element) => element.id === 'title');
    expect(savedTitle?.text).toBe(' Notice <119>');
  });
});
