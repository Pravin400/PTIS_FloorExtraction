import { describe, expect, it } from 'vitest';
import {
  dataSourceForProvider,
  detectPdfPaper,
  detectReportImportMetadata,
  suggestedImportedReportId,
} from '@/lib/utils/reports/import/client/import-client-model';

const options = {
  currentTenantId: 42,
  modules: [
    { id: 1, name: 'Water Billing' },
    { id: 7, name: 'Property Tax' },
  ],
  dataProviderCodes: [
    'PropertyTaxReportDataProvider',
    'Notice119DataProvider',
    'WaterBillDataProvider',
  ],
};

const dataSources = [
  {
    code: 'PROPERTY_TAX',
    name: 'Property Tax',
    executionReportCode: 'PropertyTaxReportDataProvider',
    fields: [],
  },
  {
    code: 'NOTICE_119',
    name: 'Notice 119',
    executionReportCode: 'Notice119DataProvider',
    fields: [],
  },
];

describe('native report import detection', () => {
  it('creates a valid report ID from the source file name', () => {
    expect(suggestedImportedReportId('119 Notice Final.pdf')).toBe('Report_119_Notice_Final');
    expect(suggestedImportedReportId('PropertyTaxCollection.rpt')).toBe('PropertyTaxCollection');
  });

  it('detects module, provider, data source and page defaults from a report source', () => {
    const result = detectReportImportMetadata(
      'Notice119_Property_Tax_A3.rpt',
      options,
      dataSources
    );

    expect(result).toMatchObject({
      moduleId: 7,
      moduleName: 'Property Tax',
      dataProviderCode: 'Notice119DataProvider',
      dataSourceCode: 'NOTICE_119',
      paperSize: 'A3',
      orientation: 'landscape',
    });
  });

  it('resolves a data source after the provider is changed manually', () => {
    expect(dataSourceForProvider('PropertyTaxReportDataProvider', dataSources)).toBe(
      'PROPERTY_TAX'
    );
  });

  it('detects paper size and orientation from PDF dimensions', () => {
    expect(detectPdfPaper(420, 297)).toEqual({
      paperSize: 'A3',
      orientation: 'landscape',
    });
  });
});
