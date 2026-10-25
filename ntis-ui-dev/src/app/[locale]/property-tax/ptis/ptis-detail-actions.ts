'use server';

import { ptisService } from '@/lib/api/ptis/tab/ptis.service';
import { propertyIdActionSchema } from '@/lib/validations/ptis.schema';
import { getPropertyRuleLogs } from '@/lib/api/rule-engine/property-rule-log.service';
import { createAction } from './actions';

export async function fetchKycDetailsOnlyAction(propertyId: number) {
  const validation = propertyIdActionSchema.safeParse({ propertyId });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  return createAction(() => ptisService.getKycDetails(propertyId));
}

export async function fetchSocietyDetailsOnlyAction(propertyId: number) {
  const validation = propertyIdActionSchema.safeParse({ propertyId });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  return createAction(() => ptisService.getSocietyDetails(String(propertyId)));
}

export async function fetchOldDetailsOnlyAction(propertyId: number) {
  const validation = propertyIdActionSchema.safeParse({ propertyId });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  return createAction(() => ptisService.getOldDetails(propertyId));
}

export async function fetchOldFloorDetailsAction(propertyId: number) {
  const validation = propertyIdActionSchema.safeParse({ propertyId });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  return createAction(() => ptisService.getOldFloorDetails(propertyId));
}

export async function fetchOldTaxesDetailsAction(propertyId: number) {
  const validation = propertyIdActionSchema.safeParse({ propertyId });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  return createAction(() => ptisService.getOldTaxesDetails(propertyId));
}

export async function fetchApartmentQCDetailsAction(propertyId?: number) {
  if (propertyId === undefined) {
    return { success: false, error: 'Property ID is required' };
  }
  const validation = propertyIdActionSchema.safeParse({ propertyId });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }
  return { success: false, error: 'Apartment QC details action is not implemented' };
}

export async function fetchDiscountDetailsOnlyAction(propertyId: number) {
  const validation = propertyIdActionSchema.safeParse({ propertyId });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const { getIndividualSocialAndDiscountDetailsService } = await import(
    '@/lib/api/ptis/individual/individual-discount-social.service'
  );
  const result = await getIndividualSocialAndDiscountDetailsService(propertyId);
  return {
    success: result.success,
    data: result.discountData,
    error: result.error,
  };
}

export async function fetchSocialDetailsOnlyAction(propertyId: number) {
  const validation = propertyIdActionSchema.safeParse({ propertyId });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const { getIndividualSocialAndDiscountDetailsService } = await import(
    '@/lib/api/ptis/individual/individual-discount-social.service'
  );
  const result = await getIndividualSocialAndDiscountDetailsService(propertyId);
  return {
    success: result.success,
    data: result.socialData,
    error: result.error,
  };
}

export async function fetchBuildingPermissionOnlyAction(propertyId: number) {
  const validation = propertyIdActionSchema.safeParse({ propertyId });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  return createAction(() => ptisService.getBuildingPermissionDetails(propertyId));
}

export async function fetchPropertyRuleLogsAction(
  propertyId: number,
  propertyDetailsId?: number,
  financeYear?: number
) {
  const validation = propertyIdActionSchema.safeParse({ propertyId });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  return createAction(async () => {
    const data = await getPropertyRuleLogs(propertyId, propertyDetailsId, financeYear);
    return { success: true, data };
  });
}

export async function fetchTabHeaderInfoAction(propertyId: number) {
  const validation = propertyIdActionSchema.safeParse({ propertyId });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  return createAction(() => ptisService.getTabHeaderInfo(propertyId));
}

export async function fetchMappedPropertiesAction(propertyId: number) {
  const validation = propertyIdActionSchema.safeParse({ propertyId });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  return createAction(() => ptisService.getMappedProperties(propertyId));
}
