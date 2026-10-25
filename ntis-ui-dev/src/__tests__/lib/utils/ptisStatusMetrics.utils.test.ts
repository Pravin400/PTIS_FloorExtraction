import { describe, it, expect } from 'vitest';
import {
  buildBadgesFromPayload,
  parseBooleanStatus,
  formatWorkflowDate,
  formatWorkflowDateTime,
} from '@/lib/utils/ptis/ptisStatusMetrics.utils';

describe('ptisStatusMetrics.utils', () => {
  const userApiResponse = {
    success: true,
    message: 'Record found successfully',
    items: {
      propertyId: 2243451,
      workflowStages: [
        {
          stageId: 1,
          stageName: 'GeoSequencing',
          description: 'Geo-tagging and property numbering completed',
          isCompleted: true,
          createdBy: 1,
          createdByName: 'Admin scipl',
          createdDate: '2026-09-16T17:16:07.963',
          updatedBy: null,
          updatedByName: null,
          updatedDate: null,
        },
        {
          stageId: 2,
          stageName: 'InternalSurvey',
          description: 'Property survey completed',
          isCompleted: false,
          createdBy: null,
          createdByName: null,
          createdDate: null,
          updatedBy: null,
          updatedByName: null,
          updatedDate: null,
        },
        {
          stageId: 3,
          stageName: 'DataEntry',
          description: 'Survey floor data entered in system',
          isCompleted: false,
          createdBy: null,
          createdByName: null,
          createdDate: null,
          updatedBy: null,
          updatedByName: null,
          updatedDate: null,
        },
      ],
      certificateTypes: [
        {
          certificateTypeId: 1,
          certificateTypeCode: 'CC',
          certificateTypeName: 'Completion Certificate',
          description: 'Completion Certificate used for CC based occupation tax calculation.',
          isIssued: true,
          certificateNo: 'test1',
          issueDate: '2026-09-16T00:00:00',
          createdBy: 1,
          createdByName: 'Admin scipl',
          createdDate: '2026-09-16T12:07:38.43',
          updatedBy: 1,
          updatedByName: 'Admin scipl',
          updatedDate: '2026-09-16T12:43:47.11',
        },
        {
          certificateTypeId: 2,
          certificateTypeCode: 'OC',
          certificateTypeName: 'Occupancy Certificate',
          description: 'Occupancy Certificate used for OC based occupation tax calculation.',
          isIssued: true,
          certificateNo: '20coe G',
          issueDate: '2026-09-16T00:00:00',
          createdBy: 1,
          createdByName: 'Admin scipl',
          createdDate: '2026-09-16T12:07:38.44',
          updatedBy: 1,
          updatedByName: 'Admin scipl',
          updatedDate: '2026-09-16T12:43:47.113',
        },
        {
          certificateTypeId: 3,
          certificateTypeCode: 'EleBillDt',
          certificateTypeName: 'Electric Bill Date',
          description: 'Electric Bill Date used as fallback certificate date for occupation tax calculation.',
          isIssued: true,
          certificateNo: 'test3',
          issueDate: '2026-09-16T00:00:00',
          createdBy: 1,
          createdByName: 'Admin scipl',
          createdDate: '2026-09-16T12:07:38.443',
          updatedBy: 1,
          updatedByName: 'Admin scipl',
          updatedDate: '2026-09-16T12:43:47.113',
        },
        {
          certificateTypeId: 4,
          certificateTypeCode: 'POSSESSION_CERTIFICATE',
          certificateTypeName: 'Possession Certificate',
          description: 'Possession Certificate for document record purpose.',
          isIssued: false,
          certificateNo: null,
          issueDate: null,
          createdBy: null,
          createdByName: null,
          createdDate: null,
          updatedBy: null,
          updatedByName: null,
          updatedDate: null,
        },
      ],
    },
    totalCount: null,
    errors: null,
    correlationId: null,
  };

  it('maps the user API response accurately with Completed and Issued statuses', () => {
    const badges = buildBadgesFromPayload(userApiResponse);
    expect(badges).toHaveLength(7);

    // 1. GeoSequencing should be Completed
    const geo = badges.find((b) => b.id === 'stage-1');
    expect(geo).toBeDefined();
    expect(geo?.label).toBe('GeoSequencing');
    expect(geo?.value).toBe('Completed');
    expect(geo?.isCompletedOrIssued).toBe(true);
    expect(geo?.valueColorClass).toContain('text-emerald-700');
    expect(geo?.description).toBe('Geo-tagging and property numbering completed');
    expect(geo?.createdByName).toBe('Admin scipl');
    expect(geo?.secondaryValue).toBe('16/09/2026');

    // 2. InternalSurvey should be Pending
    const survey = badges.find((b) => b.id === 'stage-2');
    expect(survey).toBeDefined();
    expect(survey?.label).toBe('InternalSurvey');
    expect(survey?.value).toBe('Pending');
    expect(survey?.isCompletedOrIssued).toBe(false);
    expect(survey?.valueColorClass).toContain('text-amber-700');

    // 3. Completion Certificate should be Issued with certificateNo
    const cc = badges.find((b) => b.id === 'cert-1');
    expect(cc).toBeDefined();
    expect(cc?.label).toBe('Completion Certificate');
    expect(cc?.code).toBe('CC');
    expect(cc?.value).toBe('Issued: test1');
    expect(cc?.certificateNo).toBe('test1');
    expect(cc?.isCompletedOrIssued).toBe(true);
    expect(cc?.valueColorClass).toContain('text-emerald-700');
    expect(cc?.issueDateFormatted).toBe('16/09/2026');
    expect(cc?.createdByName).toBe('Admin scipl');

    // 4. Occupancy Certificate should be Issued with certificateNo
    const oc = badges.find((b) => b.id === 'cert-2');
    expect(oc?.value).toBe('Issued: 20coe G');
    expect(oc?.certificateNo).toBe('20coe G');
    expect(oc?.isCompletedOrIssued).toBe(true);

    // 5. Electric Bill Date should be Issued
    const ele = badges.find((b) => b.id === 'cert-3');
    expect(ele?.value).toBe('Issued: test3');
    expect(ele?.certificateNo).toBe('test3');
    expect(ele?.isCompletedOrIssued).toBe(true);

    // 6. Possession Certificate should be Not Issued
    const pc = badges.find((b) => b.id === 'cert-4');
    expect(pc?.value).toBe('Not Issued');
    expect(pc?.isCompletedOrIssued).toBe(false);
    expect(pc?.valueColorClass).toContain('text-rose-700');
  });

  it('handles PascalCase backend payloads and string/number boolean variations', () => {
    const pascalPayload = {
      WorkflowStages: [
        {
          StageId: 1,
          StageName: 'GeoSequencing',
          IsCompleted: 1,
          CreatedByName: 'Admin',
        },
      ],
      CertificateTypes: [
        {
          CertificateTypeId: 10,
          CertificateTypeName: 'Special Certificate',
          IsIssued: 'true',
          CertificateNo: 'SPEC-99',
        },
      ],
    };

    const badges = buildBadgesFromPayload(pascalPayload);
    expect(badges).toHaveLength(2);
    expect(badges[0].value).toBe('Completed');
    expect(badges[0].isCompletedOrIssued).toBe(true);
    expect(badges[1].value).toBe('Issued: SPEC-99');
    expect(badges[1].isCompletedOrIssued).toBe(true);
  });

  it('correctly handles parseBooleanStatus for all edge cases', () => {
    expect(parseBooleanStatus(true)).toBe(true);
    expect(parseBooleanStatus(1)).toBe(true);
    expect(parseBooleanStatus('true')).toBe(true);
    expect(parseBooleanStatus('True')).toBe(true);
    expect(parseBooleanStatus('1')).toBe(true);
    expect(parseBooleanStatus('completed')).toBe(true);
    expect(parseBooleanStatus('issued')).toBe(true);

    expect(parseBooleanStatus(false)).toBe(false);
    expect(parseBooleanStatus(0)).toBe(false);
    expect(parseBooleanStatus('false')).toBe(false);
    expect(parseBooleanStatus('0')).toBe(false);
    expect(parseBooleanStatus(null)).toBe(false);
    expect(parseBooleanStatus(undefined)).toBe(false);
  });

  it('formats dates properly', () => {
    expect(formatWorkflowDate('2026-09-16T17:16:07.963')).toBe('16/09/2026');
    expect(formatWorkflowDate(null)).toBe(null);
    expect(formatWorkflowDateTime('2026-09-16T17:16:07.963')).toContain('16/09/2026');
  });
});
