import { describe, it, expect } from 'vitest';
import {
  normalizeUlbMaster,
  parseUlbMasterMutationResponse,
} from '@/lib/api/configuration-settings/ulb-configuration/ulb-master-types-guard';

describe('ulb-master-types-guard', () => {
  it('normalizes camelCase ULB master record', () => {
    const result = normalizeUlbMaster({
      id: 1,
      ulbCode: 'TH001',
      ulbName: 'Thane Municipal Corporation',
      ulbTypeId: 1,
      websiteUrl: 'https://www.thane.gov.in',
      projectStartDate: '2026-01-01T00:00:00Z',
      licenceDuration: '1 Year',
      isActive: true,
    });

    expect(result).not.toBeNull();
    expect(result?.ulbCode).toBe('TH001');
    expect(result?.projectStartDate).toBe('2026-01-01');
    expect(result?.licenceDuration).toBe('1 Year');
  });

  it('returns null when required fields are missing', () => {
    expect(normalizeUlbMaster({ id: 0, ulbCode: '', ulbName: '' })).toBeNull();
  });

  it('parses wrapped POST/PUT mutation response', () => {
    const parsed = parseUlbMasterMutationResponse(
      {
        success: true,
        message: 'Record updated successfully',
        items: {
          id: 2,
          ulbCode: 'TH001',
          ulbName: 'Thane Municipal Corporation',
          ulbTypeId: 1,
        },
      },
      'Failed to save'
    );

    expect(parsed.message).toBe('Record updated successfully');
    expect(parsed.ulb.id).toBe(2);
    expect(parsed.ulb.ulbCode).toBe('TH001');
  });
});
