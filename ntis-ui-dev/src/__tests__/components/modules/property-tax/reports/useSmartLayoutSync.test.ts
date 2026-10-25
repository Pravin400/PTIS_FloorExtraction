import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  buildCanonicalSmartLayoutParameters,
  buildSmartLayoutMetadataParameters,
  parseSelectedPropertyValue,
  prepareReportSubmissionParameters,
  useSmartLayoutSync,
} from '@/hooks/reports/useSmartLayoutSync';
import type { ReportParameterDefinition } from '@/types/report.types';

function reportParameter(parameterKey: string, label: string): ReportParameterDefinition {
  return {
    id: 1,
    reportDefinitionId: 1,
    parameterKey,
    label,
    parameterType: 'text',
    optionsSource: null,
    cascadeFromKey: null,
    isRequired: false,
    sortOrder: 1,
  };
}

describe('parseSelectedPropertyValue', () => {
  it('separates the exact property id and partition from a selected option', () => {
    expect(parseSelectedPropertyValue('1-1|456', '1')).toEqual({
      propertyNo: '1',
      propertyId: '456',
    });
  });

  it('preserves slashes that are part of the property number', () => {
    expect(parseSelectedPropertyValue('101/A-1|789', '1')).toEqual({
      propertyNo: '101/A',
      propertyId: '789',
    });
  });

  it('supports an unpartitioned property', () => {
    expect(parseSelectedPropertyValue('25|123', '')).toEqual({
      propertyNo: '25',
      propertyId: '123',
    });
  });

  it('builds property number and id directly for an individual submission', () => {
    expect(buildCanonicalSmartLayoutParameters({
      financialYear: '2026',
      zoneId: '15',
      wardId: ['60'],
      fromProperty: '',
      toProperty: '',
      propertyNo: '1-A4|552377',
      partitionNo: 'A4',
      ownerIdList: '',
      selectedProperties: [],
      selectionMode: 'property',
      amountOperator: 'greater_than',
      amountValue: '',
      propertyDescription: [],
      assessmentStatus: [],
    })).toMatchObject({
      propertyNo: '1',
      propertyId: '552377',
      ownerId: '552377',
      partitionNo: 'A4',
    });
  });

  it('passes parameters through unchanged for all reports', () => {
    expect(prepareReportSubmissionParameters('WarrentNotice', 'property', {
      financeyear: '2026',
      wardId: '60',
    })).toEqual({ financeyear: '2026', wardId: '60' });

    expect(prepareReportSubmissionParameters('DocumentNotice', 'ward', {
      financeyear: '2026',
    })).toEqual({ financeyear: '2026' });
  });

  it('maps an individual selection to the exact property id and partition filters', async () => {
    const handleParamChange = vi.fn();
    const parameters = [
      reportParameter('PropertyNo', 'Property No'),
      reportParameter('PropertyPartitionNo', 'Partition No'),
      reportParameter('PropertyId', 'Property Id'),
    ];

    renderHook(() => useSmartLayoutSync({
      financialYear: '2026',
      zoneId: '10',
      wardId: ['20'],
      fromProperty: '',
      toProperty: '',
      propertyNo: '1-2|456',
      partitionNo: '2',
      ownerIdList: '',
      selectedProperties: [],
      selectionMode: 'property',
      amountOperator: 'greater_than',
      amountValue: '',
      propertyDescription: [],
      assessmentStatus: [],
      parameters,
      handleParamChange,
    }));

    await waitFor(() => {
      expect(handleParamChange).toHaveBeenCalledWith('PropertyNo', '1');
      expect(handleParamChange).toHaveBeenCalledWith('PropertyPartitionNo', '2');
      expect(handleParamChange).toHaveBeenCalledWith('PropertyId', '456');
    });
  });

  it('maps selected property type and assessment type IDs to report filters', async () => {
    const handleParamChange = vi.fn();
    const parameters = [
      reportParameter('PropertyTypeId', 'Property Description'),
      reportParameter('AssessmentTypeId', 'Assessment Type'),
    ];

    renderHook(() => useSmartLayoutSync({
      financialYear: '2026',
      zoneId: '10',
      wardId: ['20'],
      fromProperty: '',
      toProperty: '',
      propertyNo: '',
      partitionNo: '',
      ownerIdList: '',
      selectedProperties: [],
      selectionMode: 'ward',
      amountOperator: 'greater_than',
      amountValue: '',
      propertyDescription: ['11', '12'],
      assessmentStatus: ['3', '4'],
      parameters,
      handleParamChange,
    }));

    await waitFor(() => {
      expect(handleParamChange).toHaveBeenCalledWith('PropertyTypeId', '11,12');
      expect(handleParamChange).toHaveBeenCalledWith('AssessmentTypeId', '3,4');
    });

    expect(buildCanonicalSmartLayoutParameters({
      financialYear: '2026',
      zoneId: '10',
      wardId: ['20'],
      fromProperty: '',
      toProperty: '',
      propertyNo: '',
      partitionNo: '',
      ownerIdList: '',
      selectedProperties: [],
      selectionMode: 'ward',
      amountOperator: 'greater_than',
      amountValue: '',
      propertyDescription: ['11', '12'],
      assessmentStatus: ['3', '4'],
    })).toMatchObject({
      PropertyTypeId: '11,12',
      AssessmentTypeId: '3,4',
    });
  });

  it('builds exact ward-wise report metadata at submit time', () => {
    const parameters = [
      reportParameter('FinanceYear', 'Financial Year'),
      reportParameter('ZoneId', 'Zone No.'),
      reportParameter('WardId', 'Ward No.'),
      reportParameter('SearchCategory', 'Property Selection'),
      reportParameter('PropertyTypeId', 'Property Description'),
      reportParameter('AssessmentTypeId', 'Assessment Type'),
    ];

    expect(buildSmartLayoutMetadataParameters({
      financialYear: '2026',
      zoneId: '15',
      wardId: ['60'],
      fromProperty: '',
      toProperty: '',
      propertyNo: '',
      partitionNo: '',
      ownerIdList: '',
      selectedProperties: [],
      selectionMode: 'ward',
      amountOperator: 'greater_than',
      amountValue: '',
      propertyDescription: [],
      assessmentStatus: [],
    }, parameters)).toEqual({
      FinanceYear: '2026',
      ZoneId: '15',
      WardId: '60',
      SearchCategory: '2',
      PropertyTypeId: '',
      AssessmentTypeId: '',
    });
  });
});
