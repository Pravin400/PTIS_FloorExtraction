import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as individualApi from '@/lib/api/ptis/individual';
import * as discountService from '@/lib/api/discount.service';
import * as ruleEngineService from '@/lib/api/rule-engine/property-rule-log.service';
import * as taxDetailsService from '@/lib/api/ptis/ptisMain-taxdetails/taxDetails.service';
import * as basicDetailsService from '@/lib/api/ptis/propertybasicdetails/property-basic-details.service';
import * as propertyMappingService from '@/lib/api/property-mapping/property-mapping.service';
import type { PropertyRuleLogResponse } from '@/types/rule-engine';
import type { TaxDetailsData } from '@/types/ptisMain-taxdetails.types';
import type { PropertyBasicDetailsApiItem } from '@/types/property-basic-details.types';
import type {
  MappedNewPropertiesApiResponse,
  MappedNewPropertiesParams,
  MappedOldPropertiesApiResponse,
  MappedOldPropertiesParams,
} from '@/types/property-mapping';
import {
  getIndividualQcTopSectionAction,
  patchIndividualPropertyAction,
  fetchDiscountDetailsAction,
  fetchUnitTaxDetailsAction,
  fetchPropertyRuleLogsAction,
  fetchUnitQuickDataEntryAction,
  fetchMappedNewPropertiesAction,
  fetchMappedOldPropertiesAction,
} from '@/app/[locale]/property-tax/ptis/individual/action';

vi.mock('@/lib/api/ptis/individual', () => ({
  getIndividualQcTopSectionAction: vi.fn(),
  patchIndividualPropertyAction: vi.fn(),
}));

vi.mock('@/lib/api/discount.service', () => ({
  getDiscountDetails: vi.fn(),
}));

vi.mock('@/lib/api/rule-engine/property-rule-log.service', () => ({
  getPropertyRuleLogs: vi.fn(),
}));

vi.mock('@/lib/api/ptis/ptisMain-taxdetails/taxDetails.service', () => ({
  getPtisMainTaxDetailsByPropertyId: vi.fn(),
  getPtisMainTaxDetailsCvByPropertyId: vi.fn(),
}));

vi.mock('@/lib/api/ptis/propertybasicdetails/property-basic-details.service', () => ({
  getPropertyBasicDetails: vi.fn(),
}));

vi.mock('@/lib/api/property-mapping/property-mapping.service', () => ({
  getMappedNewProperties: vi.fn(),
  getMappedOldProperties: vi.fn(),
}));

describe('individual/action.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('re-exports getIndividualQcTopSectionAction and patchIndividualPropertyAction', async () => {
    vi.mocked(individualApi.getIndividualQcTopSectionAction).mockResolvedValueOnce({ success: true });
    vi.mocked(individualApi.patchIndividualPropertyAction).mockResolvedValueOnce({ success: true });

    const getRes = await getIndividualQcTopSectionAction(123);
    expect(getRes.success).toBe(true);
    expect(individualApi.getIndividualQcTopSectionAction).toHaveBeenCalledWith(123);

    const patchRes = await patchIndividualPropertyAction(123, {});
    expect(patchRes.success).toBe(true);
    expect(individualApi.patchIndividualPropertyAction).toHaveBeenCalledWith(123, {});
  });

  it('fetchDiscountDetailsAction fetches discount details correctly', async () => {
    vi.mocked(discountService.getDiscountDetails).mockResolvedValueOnce({ success: true, data: undefined });
    const res = await fetchDiscountDetailsAction(123);
    expect(res.success).toBe(true);
    expect(discountService.getDiscountDetails).toHaveBeenCalledWith('123');
  });

  it('fetchUnitTaxDetailsAction validates propertyId and fetches tax details', async () => {
    const invalidRes = await fetchUnitTaxDetailsAction(0);
    expect(invalidRes.success).toBe(false);

    vi.mocked(taxDetailsService.getPtisMainTaxDetailsByPropertyId).mockResolvedValueOnce({
      totalTax: 1000,
    } as unknown as TaxDetailsData);
    vi.mocked(taxDetailsService.getPtisMainTaxDetailsCvByPropertyId).mockResolvedValueOnce({
      totalTax: 2000,
    } as unknown as TaxDetailsData);

    const validRes = await fetchUnitTaxDetailsAction(123);
    expect(validRes.success).toBe(true);
    expect(validRes.rateable).toBeDefined();
    expect(validRes.capital).toBeDefined();
  });

  it('fetchPropertyRuleLogsAction fetches rule logs', async () => {
    vi.mocked(ruleEngineService.getPropertyRuleLogs).mockResolvedValueOnce({
      success: true,
    } as unknown as PropertyRuleLogResponse);
    const res = await fetchPropertyRuleLogsAction(123, 1, 2024);
    expect(res.success).toBe(true);
    expect(ruleEngineService.getPropertyRuleLogs).toHaveBeenCalledWith(123, 1, 2024);
  });

  it('fetchUnitQuickDataEntryAction fetches basic property details', async () => {
    const invalidRes = await fetchUnitQuickDataEntryAction(-1);
    expect(invalidRes.success).toBe(false);

    vi.mocked(basicDetailsService.getPropertyBasicDetails).mockResolvedValueOnce({
      propertyId: 123,
    } as unknown as PropertyBasicDetailsApiItem);
    const res = await fetchUnitQuickDataEntryAction(123);
    expect(res.success).toBe(true);
    expect(basicDetailsService.getPropertyBasicDetails).toHaveBeenCalledWith(123);
  });

  it('fetchMappedNewPropertiesAction and fetchMappedOldPropertiesAction work as expected', async () => {
    vi.mocked(propertyMappingService.getMappedNewProperties).mockResolvedValueOnce({
      items: [],
    } as unknown as MappedNewPropertiesApiResponse);
    vi.mocked(propertyMappingService.getMappedOldProperties).mockResolvedValueOnce({
      items: [],
    } as unknown as MappedOldPropertiesApiResponse);

    const newRes = await fetchMappedNewPropertiesAction({
      propertyId: 123,
    } as unknown as MappedNewPropertiesParams);
    expect(newRes.success).toBe(true);

    const oldRes = await fetchMappedOldPropertiesAction({
      propertyId: 123,
    } as unknown as MappedOldPropertiesParams);
    expect(oldRes.success).toBe(true);
  });
});
