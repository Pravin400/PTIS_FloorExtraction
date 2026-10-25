import { describe, expect, it } from 'vitest';
import {
  buildPdfReportDefinition,
  buildRptReportDefinition,
  fieldCatalogFromRptAnalysis,
} from '@/lib/utils/reports/import/build-imported-report';

const options = {
  reportId: 'ImportedReport',
  reportName: 'Imported Report',
  paperSize: 'A4',
  orientation: 'portrait' as const,
  moduleId: 7,
  moduleName: 'Property Tax',
  dataProviderCode: 'TransferCertificateDataProvider',
  dataSourceCode: 'TRANSFER_CERTIFICATE',
  tenantId: 101,
  currentTenantId: 101,
  referencePdf: {
    documentGuid: '11111111-1111-1111-1111-111111111111',
    fileName: 'reference.pdf',
    contentType: 'application/pdf',
    sizeBytes: 1234,
  },
};

describe('imported report builders', () => {
  it('normalizes Crystal sections, fields, and detected parameters', () => {
    const definition = buildRptReportDefinition({
      isValidRpt: true,
      metadata: {
        paperSize: 'A4',
        orientation: 'landscape',
        widthMm: 297,
        heightMm: 210,
        pageWidth: 1123,
        pageHeight: 794,
      },
      sections: [{ id: 'details', name: 'Details', type: 'detail', height: 30 }],
      elements: [
        {
          id: 'owner-name',
          sectionId: 'details',
          type: 'field',
          fieldName: 'OwnerName',
          x: 10,
          y: 4,
          width: 180,
          height: 20,
        },
        {
          id: 'invalid-page-height-line',
          sectionId: 'details',
          type: 'line',
          x: 300,
          y: 0,
          width: 1,
          height: 700,
        },
        {
          id: 'valid-horizontal-line',
          sectionId: 'details',
          type: 'line',
          x: 10,
          y: 28,
          width: 300,
          height: 1,
        },
      ],
      parametersDetected: ['@PropertyId'],
    }, options);

    expect(definition.orientation).toBe('landscape');
    expect(definition.sections[0].bandType).toBe('detail');
    expect(definition.elements[0]).toMatchObject({
      designerType: 'field',
      fieldName: 'OwnerName',
    });
    expect(definition.ntis?.dataProviderCode).toBe('TransferCertificateDataProvider');
    expect(definition.ntis?.parameters?.[0].key).toBe('PropertyId');
    expect(definition.elements.some((element) => element.id === 'invalid-page-height-line')).toBe(false);
    expect(definition.elements.some((element) => element.id === 'valid-horizontal-line')).toBe(true);
    expect(definition.sourceAssets?.referencePdf?.documentGuid).toBe(
      '11111111-1111-1111-1111-111111111111',
    );
  });

  it('maps Crystal table-qualified fields to provider API bindings', () => {
    const definition = buildRptReportDefinition({
      isValidRpt: true,
      sections: [{ id: 'header', name: 'Header', type: 'header', height: 40 }],
      elements: [{
        id: 'council-name',
        sectionId: 'header',
        type: 'field',
        fieldName: 'ReportData.CouncilName',
        text: '{ReportData.CouncilName}',
        x: 10,
        y: 5,
        width: 120,
        height: 20,
      }],
    }, {
      ...options,
      fieldCatalog: [{
        name: 'CouncilName',
        label: 'Council Name',
        type: 'string',
        elementType: 'field',
      }],
    });

    expect(definition.elements[0]).toMatchObject({
      fieldName: 'CouncilName',
      text: '{CouncilName}',
    });
  });

  it('creates a persisted field fallback from database fields embedded in an RPT', () => {
    expect(fieldCatalogFromRptAnalysis({
      elements: [
        { type: 'field', fieldName: 'ReportData.CouncilName' },
        { type: 'field', fieldName: 'TaxCommand;1.TaxName' },
        { type: 'formula', fieldName: 'TotalFormula' },
      ],
    })).toEqual([
      expect.objectContaining({ name: 'CouncilName', group: 'RPT Database Fields' }),
      expect.objectContaining({ name: 'TaxName', group: 'RPT Database Fields' }),
    ]);
  });

  it('keeps extracted embedded-subreport bands and binds their detail collection', () => {
    const definition = buildRptReportDefinition({
      isValidRpt: true,
      metadata: {
        paperSize: 'A4',
        orientation: 'portrait',
        pageWidth: 794,
        pageHeight: 1123,
      },
      sections: [
        { id: 'main', name: 'Details', type: 'detail', height: 80 },
        {
          id: 'embedded_tax_header',
          name: 'Subreport: Tax Details / Report Header',
          type: 'header',
          height: 28,
          isSubreport: true,
          subreportName: 'Tax Details',
        },
        {
          id: 'embedded_tax_details',
          name: 'Subreport: Tax Details / Details',
          type: 'detail',
          height: 24,
          isSubreport: true,
          subreportName: 'Tax Details',
        },
      ],
      elements: [
        {
          id: 'tax-heading',
          sectionId: 'embedded_tax_header',
          type: 'text',
          text: 'Tax Details',
          x: 0,
          y: 0,
          width: 200,
          height: 24,
        },
        {
          id: 'tax-name',
          sectionId: 'embedded_tax_details',
          type: 'field',
          fieldName: 'TaxCommand;1.TaxName',
          text: '{TaxCommand;1.TaxName}',
          x: 0,
          y: 0,
          width: 120,
          height: 20,
          properties: {
            importRole: 'embeddedSubreportObject',
            sourceSubreport: 'Tax Details',
          },
        },
      ],
    }, {
      ...options,
      fieldCatalog: [{
        name: 'taxRows.taxName',
        label: 'Tax Name',
        type: 'string',
        elementType: 'field',
        collectionPath: 'taxRows',
      }],
    });

    const headerSection = definition.sections.find((section) => section.id === 'embedded_tax_header');
    expect(headerSection).toMatchObject({ bandType: 'subreport' });
    expect(headerSection?.dataPath).toBeUndefined();
    expect(definition.sections.find((section) => section.id === 'embedded_tax_details')).toMatchObject({
      bandType: 'subreport',
      dataPath: 'taxRows',
    });
    expect(definition.elements.find((element) => element.id === 'tax-name')).toMatchObject({
      fieldName: 'taxName',
      text: '{taxName}',
      properties: {
        importRole: 'embeddedSubreportObject',
        sourceSubreport: 'Tax Details',
      },
    });
  });

  it('creates an editable, provider-bound first-page layout from PDF geometry', () => {
    const definition = buildPdfReportDefinition({
      pageWidth: 794,
      pageHeight: 1123,
      widthMm: 210,
      heightMm: 297,
      pageCount: 2,
      graphics: [{
        type: 'rectangle',
        x: 20,
        y: 20,
        width: 754,
        height: 1083,
        fill: 'none',
        stroke: '#1d4ed8',
        strokeWidth: 2,
      }],
      items: [
        {
          text: 'Property Tax Bill',
          x: 100,
          y: 45,
          width: 240,
          height: 24,
          fontSize: 18,
          fontWeight: 700,
          color: '#1d4ed8',
        },
        {
          text: 'Owner Name: Example Owner',
          x: 80,
          y: 120,
          width: 280,
          height: 18,
          fontSize: 12,
        },
        {
          text: 'PT-1042',
          x: 80,
          y: 160,
          width: 90,
          height: 18,
          fontSize: 12,
        },
      ],
    }, {
      ...options,
      fieldCatalog: [
        {
          name: 'ownerName',
          label: 'Owner Name',
          type: 'string',
          elementType: 'field',
        },
        {
          name: 'propertyNumber',
          label: 'Property Number',
          type: 'string',
          elementType: 'field',
        },
      ],
      sampleData: { propertyNumber: 'PT-1042' },
    });

    expect(definition.sections).toHaveLength(1);
    expect(definition.sections[0].bandType).toBe('detail');
    expect(definition.elements).toContainEqual(expect.objectContaining({
      type: 'box',
      designerType: 'rectangle',
      x: 20,
      y: 20,
      styles: expect.objectContaining({ border: '2px solid #1d4ed8' }),
    }));
    expect(definition.elements).toContainEqual(expect.objectContaining({
      text: 'Property Tax Bill',
      x: 100,
      designerType: 'text',
      styles: expect.objectContaining({
        color: '#1d4ed8',
        overflow: 'visible',
        lineHeight: '1.15',
      }),
    }));
    expect(definition.elements).toContainEqual(expect.objectContaining({
      type: 'field',
      designerType: 'field',
      fieldName: 'ownerName',
      text: '{ownerName}',
    }));
    expect(definition.elements).toContainEqual(expect.objectContaining({
      fieldName: 'propertyNumber',
      text: '{propertyNumber}',
    }));
  });

  it('keeps a scanned PDF page as the locked report background', () => {
    const pageImage = `data:image/webp;base64,${'a'.repeat(128)}`;
    const definition = buildPdfReportDefinition({
      pageWidth: 794,
      pageHeight: 1123,
      widthMm: 210,
      heightMm: 297,
      extractionMode: 'ocr',
      items: [
        {
          text: 'मालमत्ता क्र.',
          x: 80,
          y: 120,
          width: 110,
          height: 18,
          fontSize: 12,
        },
        {
          text: 'PT-1042',
          x: 220,
          y: 120,
          width: 80,
          height: 18,
          fontSize: 12,
        },
      ],
      graphics: [{
        type: 'image',
        x: 0,
        y: 0,
        width: 794,
        height: 1123,
        dataUrl: pageImage,
        locked: true,
        objectFit: 'fill',
      }],
    }, {
      ...options,
      fieldCatalog: [{
        name: 'propertyNumber',
        label: 'Property Number',
        type: 'string',
        elementType: 'field',
      }],
      sampleData: { propertyNumber: 'PT-1042' },
    });

    expect(definition.elements).toContainEqual(expect.objectContaining({
      id: 'pdf-template-bg-1',
      type: 'image',
      src: pageImage,
      locked: true,
      styles: expect.objectContaining({ objectFit: 'fill', zIndex: 0 }),
    }));
    expect(definition.elements).toContainEqual(expect.objectContaining({
      id: 'pdf-ocr-text-1',
      text: 'मालमत्ता क्र.',
      styles: expect.objectContaining({ opacity: 0 }),
      properties: expect.objectContaining({
        importRole: 'ocrText',
        ocrEdited: false,
        sourceX: 80,
        sourceY: 120,
      }),
    }));
    expect(definition.elements).toContainEqual(expect.objectContaining({
      id: 'pdf-ocr-text-2',
      type: 'field',
      fieldName: 'propertyNumber',
      styles: expect.objectContaining({
        opacity: 1,
        backgroundColor: 'transparent',
      }),
      properties: expect.objectContaining({ importRole: 'dynamicField' }),
    }));
    expect(definition.elements).toContainEqual(expect.objectContaining({
      type: 'box',
      locked: true,
      properties: expect.objectContaining({
        importRole: 'ocrMask',
        sourceElementId: 'pdf-ocr-text-2',
      }),
    }));
  });
});
