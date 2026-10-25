import { describe, expect, it } from 'vitest';
import {
  canonicalProviderCode,
  flattenDesignerFields,
  matchDesignerDataSource,
  matchRegisteredProviderCode,
  mergeFieldCatalogs,
} from '@/lib/utils/reports/designer/provider-schema';
import type { DesignerDataSource } from '@/types/report-designer.types';

const sources: DesignerDataSource[] = [{
  code: 'PRARUP_YADI',
  name: 'PrarupYadi',
  executionReportCode: 'PrarupYadiDataProvider',
  fields: [
    {
      path: 'PrarupYadi',
      label: 'Rows',
      elementType: 'table',
      group: 'Prarup Yadi',
      valueType: 'collection',
    },
    {
      path: 'PrarupYadi.OwnerName',
      label: 'Owner Name',
      elementType: 'field',
      group: 'Prarup Yadi',
      valueType: 'string',
    },
  ],
}];

describe('report provider schema helpers', () => {
  it('matches provider, data-source, and display-name forms to one canonical provider', () => {
    expect(matchDesignerDataSource(sources, 'PrarupYadiDataProvider')).toBe(sources[0]);
    expect(matchDesignerDataSource(sources, 'PRARUP_YADI')).toBe(sources[0]);
    expect(matchDesignerDataSource(sources, 'Prarup Yadi')).toBe(sources[0]);
    expect(canonicalProviderCode(sources[0])).toBe('PrarupYadiDataProvider');
    expect(matchRegisteredProviderCode(
      ['TransferCertificateDataProvider', 'PrarupYadiDataProvider'],
      'PRARUP_YADI',
    )).toBe('PrarupYadiDataProvider');
  });

  it('marks flat child paths with their owning collection for subreport binding', () => {
    expect(flattenDesignerFields(sources[0].fields)).toEqual([
      expect.objectContaining({ name: 'PrarupYadi', type: 'collection' }),
      expect.objectContaining({
        name: 'PrarupYadi.OwnerName',
        collectionPath: 'PrarupYadi',
      }),
    ]);
  });

  it('keeps API metadata while adding RPT-only fields', () => {
    const merged = mergeFieldCatalogs(
      flattenDesignerFields(sources[0].fields),
      [{ name: 'OwnerName', label: 'RPT Owner', type: 'string', elementType: 'field' }],
    );
    expect(merged.map((field) => field.name)).toEqual([
      'PrarupYadi',
      'PrarupYadi.OwnerName',
      'OwnerName',
    ]);
  });
});
