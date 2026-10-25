import { describe, expect, it } from 'vitest';
import { buildPdfReportDefinition, type PdfImportLayout } from '@/lib/utils/reports/import/build-imported-report';

describe('buildPdfReportDefinition', () => {
  it('imports PDF layout as first-class visible editable elements under details section', () => {
    const layout: PdfImportLayout = {
      pageWidth: 794,
      pageHeight: 1123,
      widthMm: 210,
      heightMm: 297,
      pageCount: 1,
      extractionMode: 'unicode',
      items: [
        {
          text: 'ठाणे महानगरपालिका',
          x: 250,
          y: 60,
          width: 294,
          height: 28,
          fontSize: 24,
          fontFamily: "'Noto Sans Devanagari', Arial, sans-serif",
          fontWeight: 700,
          color: '#111827',
          textAlign: 'center',
        },
        {
          text: 'मालमत्ता क्रमांक:',
          x: 40,
          y: 120,
          width: 120,
          height: 18,
          fontSize: 14,
          fontFamily: "'Noto Sans Devanagari', Arial, sans-serif",
          fontWeight: 600,
          color: '#111827',
        },
        {
          text: '{{PropertyNo}}',
          x: 170,
          y: 120,
          width: 100,
          height: 18,
          fontSize: 14,
          fontFamily: "'Noto Sans Devanagari', Arial, sans-serif",
        },
      ],
      graphics: [
        {
          type: 'line',
          x: 40,
          y: 100,
          width: 714,
          height: 2,
          stroke: '#000000',
          strokeWidth: 1.5,
        },
        {
          type: 'rectangle',
          x: 35,
          y: 50,
          width: 724,
          height: 300,
          stroke: '#1e293b',
          strokeWidth: 1,
          fill: 'transparent',
        },
      ],
    };

    const definition = buildPdfReportDefinition(layout, {
      reportId: 'TestPdfReport',
      reportName: 'Test PDF Report',
      paperSize: 'A4',
      orientation: 'portrait',
      dataProviderCode: 'KarakarniDataProvider',
      dataSourceCode: 'KARAKARNI',
      moduleId: null,
      moduleName: 'Property Tax',
      tenantId: null,
    });

    expect(definition.reportId).toBe('TestPdfReport');
    expect(definition.sections).toHaveLength(1);
    expect(definition.sections[0].id).toBe('details');
    expect(definition.sections[0].bandType).toBe('detail');
    expect(definition.sections[0].height).toBe(1123);

    // All elements should have sectionId = 'details' and visible = true
    definition.elements.forEach(elem => {
      expect(elem.sectionId).toBe('details');
      expect(elem.visible).toBe(true);
    });

    // Verify text elements are visible and have opacity 1
    const titleElem = definition.elements.find(e => e.text === 'ठाणे महानगरपालिका');
    expect(titleElem).toBeDefined();
    expect(titleElem?.type).toBe('text');
    expect(titleElem?.styles.opacity).toBe(1);
    expect(titleElem?.styles.fontSize).toBe('24.0px');
    expect(titleElem?.styles.fontWeight).toBe(700);

    const labelElem = definition.elements.find(e => e.text === 'मालमत्ता क्रमांक:');
    expect(labelElem).toBeDefined();
    expect(labelElem?.type).toBe('text');
    expect(labelElem?.styles.opacity).toBe(1);

    // Placeholder was bound as dynamic field
    const fieldElem = definition.elements.find(e => e.fieldName === 'PropertyNo');
    expect(fieldElem).toBeDefined();
    expect(fieldElem?.type).toBe('field');
    expect(fieldElem?.text).toBe('{PropertyNo}');

    // Verify graphics
    const lineElem = definition.elements.find(e => e.type === 'line');
    expect(lineElem).toBeDefined();
    expect(lineElem?.x1).toBe(40);
    expect(lineElem?.x2).toBe(40 + 714);

    const boxElem = definition.elements.find(e => e.type === 'box');
    expect(boxElem).toBeDefined();
    expect(boxElem?.width).toBe(724);
  });
});
