'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { getLoggedInUserId } from '@/lib/utils/cookie.server';

// ==========================================
// Billing Frequency Imports
// ==========================================
import {
  getBillingFrequenciesPaged,
  getBillingFrequencyById,
  createBillingFrequency,
  updateBillingFrequency,
  purgeBillingFrequency,
} from '@/lib/api/water-bill/billing-configuration/billingFrequencyMaster.service';
import {
  validateBillingFrequencyInput,
  mapToCreateBillingFrequencyDto,
  mapToUpdateBillingFrequencyDto,
  BillingFrequencyInput,
} from '@/hooks/water-bill/billing-configuration/billing-frequency-master/useBillingFrequencyServer';
import {
  BillingFrequencyFormState,
  BillingFrequencyMaster,
  BillingFrequencyMasterPagedResponse,
  BillingFrequencyMasterQueryParameters,
} from '@/types/water-bill/billing-configuration/billingFrequencyMaster.types';

// ==========================================
// Billing Period Imports
// ==========================================
import {
  getBillingPeriodsPaged,
  getBillingPeriodById,
  createBillingPeriod,
  updateBillingPeriod,
  purgeBillingPeriod,
  getFinancialYearDropdownOptions,
  getBillingFrequencyDropdownOptions,
} from '@/lib/api/water-bill/billing-configuration/billingPeriodMaster.service';
import {
  validateBillingPeriodInput,
  mapToCreateBillingPeriodDto,
  mapToUpdateBillingPeriodDto,
  BillingPeriodInput,
} from '@/hooks/water-bill/billing-configuration/billing-period-master/useBillingPeriodServer';
import {
  BillingPeriodFormState,
  BillingPeriodMaster,
  BillingPeriodPagedResponse,
  BillingPeriodQueryParameters,
  DropdownOption,
} from '@/types/water-bill/billing-configuration/billingPeriodMaster.types';

// ==========================================
// Shared Page Data Fetchers
// ==========================================
type SearchParamsInput = Record<string, string | string[] | undefined> | undefined;

export async function parseSearchParams(sParams: SearchParamsInput) {
  const pageNumber = Math.max(1, Number(sParams?.pageNumber) || 1);
  const pageSize = Math.max(1, Number(sParams?.pageSize) || 10);
  const searchTerm = typeof sParams?.searchTerm === 'string' ? sParams.searchTerm : undefined;
  const sortBy = typeof sParams?.sortBy === 'string' ? sParams.sortBy : undefined;
  const sortOrder: 'asc' | 'desc' | undefined =
    sParams?.sortOrder === 'desc' || sParams?.sortOrder === 'asc'
      ? sParams.sortOrder
      : undefined;

  return { pageNumber, pageSize, searchTerm, sortBy, sortOrder };
}

export async function getBillingFrequencyTableData(sParams: SearchParamsInput) {
  const { pageNumber, pageSize, searchTerm, sortBy, sortOrder } = await parseSearchParams(sParams);

  const effectiveSortBy = sortBy ?? 'sequenceNo';
  const effectiveSortOrder: 'asc' | 'desc' = sortOrder ?? 'asc';

  const pagedData = await fetchBillingFrequenciesAction({
    pageNumber,
    pageSize,
    searchTerm,
    sortBy: effectiveSortBy,
    sortOrder: effectiveSortOrder,
  });

  return {
    pagedData,
    pageParams: { sortBy, sortOrder, searchTerm }
  };
}

export async function getBillingPeriodTableData(sParams: SearchParamsInput) {
  const { pageNumber, pageSize, searchTerm, sortBy, sortOrder } = await parseSearchParams(sParams);

  const effectiveSortBy = sortBy ?? 'financialYear';
  const effectiveSortOrder: 'asc' | 'desc' = sortOrder ?? 'desc';

  const [pagedData, financialYearOptions, billingFrequencyOptions] = await Promise.all([
    fetchBillingPeriodsAction({
      pageNumber,
      pageSize,
      searchTerm,
      sortBy: effectiveSortBy,
      sortOrder: effectiveSortOrder,
    }),
    fetchFinancialYearsDropdownAction(),
    fetchBillingFrequenciesDropdownAction(),
  ]);

  return {
    pagedData,
    financialYearOptions,
    billingFrequencyOptions,
    pageParams: { sortBy, sortOrder, searchTerm }
  };
}

// ==========================================
// Billing Frequency Server Actions
// ==========================================
export async function fetchBillingFrequenciesAction(
  params?: BillingFrequencyMasterQueryParameters
): Promise<BillingFrequencyMasterPagedResponse> {
  try {
    const response = await getBillingFrequenciesPaged(params);
    if (response.success && response.data) {
      return response.data;
    }
    return {
      items: [],
      totalCount: 0,
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 10,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    };
  } catch {
    return {
      items: [],
      totalCount: 0,
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 10,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    };
  }
}

export async function fetchBillingFrequencyByIdAction(id: number): Promise<BillingFrequencyMaster | null> {
  try {
    const response = await getBillingFrequencyById(id);
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  } catch {
    return null;
  }
}

export async function createBillingFrequencyAction(
  _prevState: BillingFrequencyFormState,
  input: BillingFrequencyInput
): Promise<BillingFrequencyFormState> {
  const t = await getTranslations('billingFrequencyMaster');
  const existing = await fetchBillingFrequenciesAction({ pageSize: 1000 });
  const validation = validateBillingFrequencyInput(input, (key, values) => t(key, values), existing.items);
  if (!validation.isValid) {
    const firstErrorMessage =
      validation.errors.duplicate?.[0] ||
      validation.errors.billingFrequency?.[0] ||
      validation.errors.periodsPerYear?.[0] ||
      Object.values(validation.errors).flat()[0] ||
      t('validation.validationFailed');

    return {
      success: false,
      message: firstErrorMessage,
      errors: validation.errors,
    };
  }

  try {
    const userId = await getLoggedInUserId();
    const effectiveUserId = userId > 0 ? userId : 1;
    const dto = mapToCreateBillingFrequencyDto(input, effectiveUserId);
    const response = await createBillingFrequency(dto);

    if (!response.success) {
      return {
        success: false,
        message: response.error || t('messages.createFailed'),
      };
    }

    revalidatePath('/[locale]/water-bill/billing-configuration', 'page');
    return {
      success: true,
      message: t('messages.createSuccess'),
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : t('errors.unexpectedError'),
    };
  }
}

export async function updateBillingFrequencyAction(
  id: number,
  _prevState: BillingFrequencyFormState,
  input: BillingFrequencyInput
): Promise<BillingFrequencyFormState> {
  const t = await getTranslations('billingFrequencyMaster');
  const existing = await fetchBillingFrequenciesAction({ pageSize: 1000 });
  const inputWithId: BillingFrequencyInput = { ...input, id: id ?? input.id };
  const validation = validateBillingFrequencyInput(inputWithId, (key, values) => t(key, values), existing.items);
  if (!validation.isValid) {
    const firstErrorMessage =
      validation.errors.duplicate?.[0] ||
      validation.errors.billingFrequency?.[0] ||
      validation.errors.periodsPerYear?.[0] ||
      Object.values(validation.errors).flat()[0] ||
      t('validation.validationFailed');

    return {
      success: false,
      message: firstErrorMessage,
      errors: validation.errors,
    };
  }

  try {
    const userId = await getLoggedInUserId();
    const effectiveUserId = userId > 0 ? userId : 1;
    const dto = mapToUpdateBillingFrequencyDto(id, input, effectiveUserId);
    const response = await updateBillingFrequency(id, dto);

    if (!response.success) {
      return {
        success: false,
        message: response.error || t('messages.updateFailed'),
      };
    }

    revalidatePath('/[locale]/water-bill/billing-configuration', 'page');
    return {
      success: true,
      message: t('messages.updateSuccess'),
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : t('errors.unexpectedError'),
    };
  }
}

export async function deleteBillingFrequencyAction(
  id: number
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  const t = await getTranslations('billingFrequencyMaster');
  try {
    const response = await purgeBillingFrequency(id);

    if (!response.success) {
      return {
        success: false,
        message: response.error || t('messages.deleteFailed'),
        statusCode: response.statusCode,
      };
    }

    revalidatePath('/[locale]/water-bill/billing-configuration', 'page');
    return {
      success: true,
      message: t('messages.deleteSuccess'),
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : t('errors.unexpectedError'),
    };
  }
}

// ==========================================
// Billing Period Server Actions
// ==========================================
export async function fetchBillingPeriodsAction(
  params?: BillingPeriodQueryParameters
): Promise<BillingPeriodPagedResponse> {
  try {
    const response = await getBillingPeriodsPaged(params);
    if (response.success && response.data) {
      return response.data;
    }
    return {
      items: [],
      totalCount: 0,
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 10,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    };
  } catch {
    return {
      items: [],
      totalCount: 0,
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 10,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    };
  }
}

export async function fetchBillingPeriodByIdAction(id: number): Promise<BillingPeriodMaster | null> {
  try {
    const response = await getBillingPeriodById(id);
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchFinancialYearsDropdownAction(): Promise<DropdownOption[]> {
  const options = await getFinancialYearDropdownOptions();
  return [...options].sort((a, b) => {
    const yearA = parseInt(a.label, 10) || 0;
    const yearB = parseInt(b.label, 10) || 0;
    return yearB - yearA;
  });
}

export async function fetchBillingFrequenciesDropdownAction(): Promise<DropdownOption[]> {
  return await getBillingFrequencyDropdownOptions();
}

export async function createBillingPeriodAction(
  _prevState: BillingPeriodFormState,
  input: BillingPeriodInput
): Promise<BillingPeriodFormState> {
  const t = await getTranslations('billingPeriodMaster');
  const validation = validateBillingPeriodInput(input, (key, values) => t(key, values));
  if (!validation.isValid) {
    return {
      success: false,
      message: t('validation.validationFailed'),
      errors: validation.errors,
    };
  }

  try {
    const userId = await getLoggedInUserId();
    const effectiveUserId = userId > 0 ? userId : 1;
    const dto = mapToCreateBillingPeriodDto(input, effectiveUserId);
    const response = await createBillingPeriod(dto);

    if (!response.success) {
      return {
        success: false,
        message: response.error || t('messages.createFailed'),
      };
    }

    revalidatePath('/[locale]/water-bill/billing-configuration', 'page');
    return {
      success: true,
      message: t('messages.createSuccess'),
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : t('errors.unexpectedError'),
    };
  }
}

export async function updateBillingPeriodAction(
  id: number,
  _prevState: BillingPeriodFormState,
  input: BillingPeriodInput
): Promise<BillingPeriodFormState> {
  const t = await getTranslations('billingPeriodMaster');
  const validation = validateBillingPeriodInput(input, (key, values) => t(key, values));
  if (!validation.isValid) {
    return {
      success: false,
      message: t('validation.validationFailed'),
      errors: validation.errors,
    };
  }

  try {
    const userId = await getLoggedInUserId();
    const effectiveUserId = userId > 0 ? userId : 1;
    const dto = mapToUpdateBillingPeriodDto(id, input, effectiveUserId);
    const response = await updateBillingPeriod(id, dto);

    if (!response.success) {
      return {
        success: false,
        message: response.error || t('messages.updateFailed'),
      };
    }

    revalidatePath('/[locale]/water-bill/billing-configuration', 'page');
    return {
      success: true,
      message: t('messages.updateSuccess'),
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : t('errors.unexpectedError'),
    };
  }
}

export async function deleteBillingPeriodAction(
  id: number
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  const t = await getTranslations('billingPeriodMaster');
  try {
    const response = await purgeBillingPeriod(id);

    if (!response.success) {
      return {
        success: false,
        message: response.error || t('messages.deleteFailed'),
        statusCode: response.statusCode,
      };
    }

    revalidatePath('/[locale]/water-bill/billing-configuration', 'page');
    return {
      success: true,
      message: t('messages.deleteSuccess'),
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : t('errors.unexpectedError'),
    };
  }
}
