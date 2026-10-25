import { getTranslations } from 'next-intl/server';
import { apiClient } from '@/services/api.service';
import { parseApiBoolean, normalizePagedResponse } from '@/lib/utils/water-bill/utils';
import { logger } from '@/lib/utils/server-logger';
import type { ApiResponse } from '@/types/common.types';
import type {
  ChargeHead,
  CreateChargeHeadDto,
  UpdateChargeHeadDto,
  ChargeHeadsPagedResponse,
  ChargeHeadsQueryParameters,
} from '@/types/water-bill/chargeHeads.types';

const BASE_ENDPOINT = '/ChargeHeadMaster';

export { parseApiBoolean };

async function getChargeHeadTranslation(key: string, fallback: string): Promise<string> {
  try {
    const t = await getTranslations('chargeHeads');
    const val = t(key);
    return val && val !== key ? val : fallback;
  } catch {
    return fallback;
  }
}

export function normalizeChargeHead(data: unknown): ChargeHead {
  if (!data || typeof data !== 'object') {
    return {
      id: 0,
      chargeHeadCode: '',
      chargeHeadName: '',
      code: '',
      name: '',
      chargeHeadNameLocal: '',
      chargeType: '',
      isRefundable: false,
      sequenceNo: 1,
      description: '',
      isRegularPay: false,
      isActive: false,
    };
  }

  const obj = data as Record<string, unknown>;

  const idVal =
    obj.id ??
    obj.Id ??
    obj.chargeHeadId ??
    obj.ChargeHeadId ??
    obj.chargeHeadMasterId ??
    obj.ChargeHeadMasterId;
  const numId = Number(idVal);
  const id = Number.isFinite(numId) ? numId : 0;

  const codeVal =
    obj.chargeHeadCode ??
    obj.ChargeHeadCode ??
    obj.code ??
    obj.Code ??
    obj.chargeCode ??
    obj.ChargeCode ??
    '';
  const chargeHeadCode = String(codeVal).trim();

  const nameVal =
    obj.chargeHeadName ??
    obj.ChargeHeadName ??
    obj.name ??
    obj.Name ??
    obj.chargeName ??
    obj.ChargeName ??
    '';
  const chargeHeadName = String(nameVal).trim();

  const chargeHeadNameLocalVal =
    obj.chargeHeadNameLocal ??
    obj.ChargeHeadNameLocal ??
    obj.chargeHeadNameMar ??
    obj.ChargeHeadNameMar ??
    obj.chargeHeadName_Local ??
    obj.ChargeHeadName_Local ??
    obj.nameLocal ??
    obj.NameLocal ??
    '';
  const chargeHeadNameLocal = String(chargeHeadNameLocalVal).trim();

  const chargeTypeVal = obj.chargeType ?? obj.ChargeType ?? obj.type ?? obj.Type ?? '';
  const chargeType = String(chargeTypeVal).trim();

  const isRefundableVal = obj.isRefundable ?? obj.IsRefundable ?? obj.refundable ?? obj.Refundable;
  const isRefundable = parseApiBoolean(isRefundableVal, false);

  const sequenceNoVal = obj.sequenceNo ?? obj.SequenceNo;
  const sequenceNo = Number.isFinite(Number(sequenceNoVal)) ? Number(sequenceNoVal) : 1;

  const descriptionVal =
    obj.description ??
    obj.Description ??
    obj.remark ??
    obj.Remark ??
    obj.remarks ??
    obj.Remarks ??
    '';
  const description = String(descriptionVal).trim();

  const isRegularPayVal =
    obj.isRegularPay ?? obj.IsRegularPay ?? obj.isRegularPayment ?? obj.IsRegularPayment;
  const isRegularPay = parseApiBoolean(isRegularPayVal, false);

  const isActiveVal =
    obj.isActive ?? obj.IsActive ?? obj.active ?? obj.Active ?? obj.status ?? obj.Status;
  const isActive = parseApiBoolean(isActiveVal, true);

  return {
    id,
    chargeHeadCode,
    chargeHeadName,
    code: chargeHeadCode,
    name: chargeHeadName,
    chargeHeadNameLocal: chargeHeadNameLocal || undefined,
    chargeType,
    isRefundable,
    sequenceNo,
    description: description || undefined,
    isRegularPay,
    isActive,
  };
}

export const CHARGE_HEAD_SORT_FIELD_MAP: Record<string, string> = {
  id: 'Id',
  Id: 'Id',
  chargeHeadCode: 'ChargeHeadCode',
  ChargeHeadCode: 'ChargeHeadCode',
  code: 'ChargeHeadCode',
  Code: 'ChargeHeadCode',
  chargeHeadName: 'ChargeHeadName',
  ChargeHeadName: 'ChargeHeadName',
  name: 'ChargeHeadName',
  Name: 'ChargeHeadName',
  chargeType: 'ChargeType',
  ChargeType: 'ChargeType',
  isRefundable: 'IsRefundable',
  IsRefundable: 'IsRefundable',
  isRegularPay: 'IsRegularPay',
  IsRegularPay: 'IsRegularPay',
  isActive: 'IsActive',
  IsActive: 'IsActive',
};

function isSortRejectionResponse(response: ApiResponse<unknown>): boolean {
  if (response.statusCode !== 400) {
    return false;
  }
  const raw = response.data as Record<string, unknown> | undefined;
  if (raw && (raw.errorCode === "INVALID_SORT_FIELD" || raw.errorCode === "SORT_REJECTED")) {
    return true;
  }
  const errorText = `${response.error || ''} ${response.message || ''}`.toLowerCase();
  return (
    errorText.includes('sort') ||
    errorText.includes('sortby') ||
    errorText.includes('sortorder') ||
    errorText.includes('order by') ||
    errorText.includes('orderby') ||
    errorText.includes('not sortable')
  );
}

export async function getChargeHeadsPaged(
  params?: ChargeHeadsQueryParameters
): Promise<ApiResponse<ChargeHeadsPagedResponse>> {
  try {
    const query = new URLSearchParams();

    if (params?.id) query.append('Id', params.id.toString());
    if (params?.pageNumber) query.append('PageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('PageSize', params.pageSize.toString());
    if (params?.searchTerm?.trim()) query.append('SearchTerm', params.searchTerm.trim());

    if (params?.sortBy) {
      const trimmedSort = params.sortBy.trim();
      const mappedSortField = CHARGE_HEAD_SORT_FIELD_MAP[trimmedSort];
      if (!mappedSortField) {
        return {
          success: false,
          statusCode: 400,
          error: `Field '${trimmedSort}' is not sortable. Allowed fields: Id, ChargeHeadCode, ChargeHeadName, ChargeType, IsRefundable, IsRegularPay, IsActive.`,
        };
      }
      query.append('SortBy', mappedSortField);
    }

    if (params?.sortOrder) query.append('SortOrder', params.sortOrder);
    if (params?.filterLogic) query.append('FilterLogic', params.filterLogic);

    const url = query.toString() ? `${BASE_ENDPOINT}?${query.toString()}` : BASE_ENDPOINT;

    const response = await apiClient.get<unknown>(url);

    // If backend rejects SortBy with HTTP 400 sort-rejection error, return an explicit error instead of returning unsorted data
    if (!response.success && query.has('SortBy') && isSortRejectionResponse(response)) {
      logger.warn('ChargeHeadMaster SortBy query specifically rejected by backend', {
        statusCode: response.statusCode,
        error: response.error,
        sortBy: params?.sortBy,
      });
      return {
        success: false,
        statusCode: response.statusCode || 400,
        error: response.error || `Sorting by '${params?.sortBy}' was rejected by the server.`,
      };
    }

    if (response.success && response.data) {
      let paged = normalizePagedResponse(response.data, normalizeChargeHead, params);

      if (params?.searchTerm?.trim() && paged.items.length > 0) {
        const term = params.searchTerm.trim().toLowerCase();
        const termNoSpecial = term.replace(/[_-\s]/g, '');

        const filteredItems = paged.items.filter((item) => {
          const rawCode = String(item.chargeHeadCode || item.code || '').toLowerCase();

          const codeMatch =
            rawCode.includes(term) ||
            (termNoSpecial !== '' && rawCode.replace(/[_-\s]/g, '').includes(termNoSpecial));

          const nameMatch = String(item.chargeHeadName || item.name || '')
            .toLowerCase()
            .includes(term);

          const localNameMatch = item.chargeHeadNameLocal
            ? String(item.chargeHeadNameLocal).toLowerCase().includes(term)
            : false;

          const typeMatch = String(item.chargeType || '')
            .toLowerCase()
            .includes(term);

          const descMatch = item.description
            ? String(item.description).toLowerCase().includes(term)
            : false;

          return codeMatch || nameMatch || localNameMatch || typeMatch || descMatch;
        });

        if (filteredItems.length <= paged.items.length) {
          const pageSize = paged.pageSize || 10;
          const totalCount = filteredItems.length;
          const totalPages = Math.ceil(totalCount / pageSize) || 1;

          paged = {
            ...paged,
            items: filteredItems,
            totalCount,
            totalPages,
            hasNextPage: paged.pageNumber < totalPages,
            hasPreviousPage: paged.pageNumber > 1,
          };
        }
      }

      return {
        success: true,
        statusCode: response.statusCode,
        data: paged,
        message: response.message,
      };
    }

    if (!response.success) {
      logger.error('getChargeHeadsPaged API error', {
        statusCode: response.statusCode,
        error: response.error,
        params,
      });
    }

    return response as ApiResponse<ChargeHeadsPagedResponse>;
  } catch (err: unknown) {
    logger.error('getChargeHeadsPaged unhandled exception', undefined, err);
    const fallbackMsg = await getChargeHeadTranslation('errors.fetchFailed', 'Failed to fetch charge heads');

    return {
      success: false,
      error: err instanceof Error ? err.message : fallbackMsg,
      statusCode: 500,
    };
  }
}

async function queryPagedFallbackById(id: number): Promise<ChargeHead | null> {
  try {
    const pagedFallback = await getChargeHeadsPaged({ id, pageSize: 1 });
    if (pagedFallback.success && pagedFallback.data?.items?.length) {
      const matched =
        pagedFallback.data.items.find((item) => Number(item.id) === Number(id)) ||
        pagedFallback.data.items[0];
      if (matched && Number(matched.id) === Number(id)) {
        return matched;
      }
    }
  } catch {
    // Continue
  }
  return null;
}

export async function getChargeHeadById(id: number): Promise<ApiResponse<ChargeHead>> {
  try {
    const response = await apiClient.get<unknown>(`${BASE_ENDPOINT}/${id}`);

    if (response.success && response.data) {
      let rawObj = response.data as Record<string, unknown>;

      if (rawObj.data && typeof rawObj.data === 'object' && !Array.isArray(rawObj.data)) {
        rawObj = rawObj.data as Record<string, unknown>;
      } else if (rawObj.result && typeof rawObj.result === 'object' && !Array.isArray(rawObj.result)) {
        rawObj = rawObj.result as Record<string, unknown>;
      } else if (rawObj.item && typeof rawObj.item === 'object' && !Array.isArray(rawObj.item)) {
        rawObj = rawObj.item as Record<string, unknown>;
      } else if (Array.isArray(rawObj.items) && rawObj.items.length > 0) {
        rawObj = rawObj.items[0] as Record<string, unknown>;
      }

      const normalized = normalizeChargeHead(rawObj);

      if (Number(normalized.id) === Number(id)) {
        return {
          success: true,
          statusCode: response.statusCode,
          data: normalized,
        };
      }
    }

    // Resilient fallback: query paged endpoint by Id parameter (?Id=${id})
    const fallbackItem = await queryPagedFallbackById(id);
    if (fallbackItem) {
      return {
        success: true,
        statusCode: 200,
        data: fallbackItem,
      };
    }

    const notFoundMsg = await getChargeHeadTranslation('errors.notFound', 'Charge head not found');

    return {
      success: false,
      error: response.error || notFoundMsg,
      statusCode: response.statusCode || 404,
    };
  } catch (err: unknown) {
    // If direct endpoint threw (e.g. network/route error), attempt query fallback by Id before failing
    const fallbackItem = await queryPagedFallbackById(id);
    if (fallbackItem) {
      return {
        success: true,
        statusCode: 200,
        data: fallbackItem,
      };
    }

    logger.error('getChargeHeadById unhandled exception', { id }, err);
    const fallbackMsg = await getChargeHeadTranslation('errors.fetchFailed', 'Failed to fetch charge head');

    return {
      success: false,
      error: err instanceof Error ? err.message : fallbackMsg,
      statusCode: 500,
    };
  }
}

export async function createChargeHead(dto: CreateChargeHeadDto): Promise<ApiResponse<ChargeHead>> {
  try {
    const fallbackMsg = await getChargeHeadTranslation('errors.createFailed', 'Failed to create charge head');

    const codeVal =
      dto.chargeHeadCode || ((dto as unknown as Record<string, unknown>).code as string) || '';

    const nameVal =
      dto.chargeHeadName || ((dto as unknown as Record<string, unknown>).name as string) || '';

    const rawLocal =
      (dto as unknown as Record<string, unknown>).chargeHeadNameLocal ??
      (dto as unknown as Record<string, unknown>).ChargeHeadNameLocal ??
      (dto as unknown as Record<string, unknown>).chargeHeadNameMar ??
      (dto as unknown as Record<string, unknown>).nameLocal;

    const localVal =
      typeof rawLocal === 'string' && rawLocal.trim() !== '' ? rawLocal.trim() : null;

    const rawDesc =
      (dto as unknown as Record<string, unknown>).description ??
      (dto as unknown as Record<string, unknown>).Description ??
      (dto as unknown as Record<string, unknown>).remark;

    const descVal = typeof rawDesc === 'string' && rawDesc.trim() !== '' ? rawDesc.trim() : null;

    const payload: Record<string, unknown> = {
      chargeHeadCode: codeVal,
      ChargeHeadCode: codeVal,
      chargeHeadName: nameVal,
      ChargeHeadName: nameVal,
      code: codeVal,
      name: nameVal,

      chargeHeadNameLocal: localVal,
      ChargeHeadNameLocal: localVal,
      chargeHeadNameMar: localVal,
      ChargeHeadNameMar: localVal,
      chargeHeadName_Local: localVal,
      ChargeHeadName_Local: localVal,
      nameLocal: localVal,
      NameLocal: localVal,

      chargeType: dto.chargeType,
      ChargeType: dto.chargeType,
      isRefundable: dto.isRefundable ?? false,
      IsRefundable: dto.isRefundable ?? false,
      sequenceNo: dto.sequenceNo ?? 1,
      SequenceNo: dto.sequenceNo ?? 1,

      description: descVal,
      Description: descVal,
      remark: descVal,
      Remark: descVal,
      remarks: descVal,
      Remarks: descVal,

      isRegularPay: dto.isRegularPay ?? false,
      IsRegularPay: dto.isRegularPay ?? false,
      isActive: dto.isActive ?? true,
      IsActive: dto.isActive ?? true,

      createdBy: 1,
      CreatedBy: 1,
      updatedBy: 1,
      UpdatedBy: 1,
    };

    const response = await apiClient.post<unknown>(BASE_ENDPOINT, payload);

    const body = response.data as Record<string, unknown> | null | undefined;

    if (response.success && body?.success !== false) {
      let rawObj: Record<string, unknown> | null = body ?? null;

      if (rawObj && typeof rawObj.items === 'object' && rawObj.items !== null && !Array.isArray(rawObj.items)) {
        rawObj = rawObj.items as Record<string, unknown>;
      } else if (rawObj && typeof rawObj.data === 'object' && rawObj.data !== null && !Array.isArray(rawObj.data)) {
        rawObj = rawObj.data as Record<string, unknown>;
      }

      const rawId = rawObj ? (rawObj.id ?? rawObj.chargeHeadId ?? rawObj.Id) : undefined;
      let entityId = Number(rawId);

      if (!Number.isFinite(entityId) || entityId <= 0) {
        if (typeof body?.data === 'number' && body.data > 0) {
          entityId = body.data;
          rawObj = { ...payload, id: entityId };
        } else if (typeof response.data === 'number' && response.data > 0) {
          entityId = response.data;
          rawObj = { ...payload, id: entityId };
        }
      }

      if (rawObj && Number.isFinite(entityId) && entityId > 0) {
        const normalized = normalizeChargeHead(rawObj);
        return {
          success: true,
          statusCode: response.statusCode,
          data: normalized,
        };
      }
    }

    const errorMsg =
      (typeof body?.message === 'string' && body.message.trim())
        ? body.message.trim()
        : (typeof body?.error === 'string' && body.error.trim())
        ? body.error.trim()
        : response.error;

    logger.warn('createChargeHead backend creation rejected or missing entity ID', {
      statusCode: response.statusCode,
      error: errorMsg,
    });

    return {
      success: false,
      error: errorMsg || fallbackMsg,
      statusCode: response.statusCode || 400,
    };
  } catch (err: unknown) {
    logger.error('createChargeHead unhandled exception', undefined, err);
    const fallbackMsg = await getChargeHeadTranslation('errors.createFailed', 'Failed to create charge head');

    return {
      success: false,
      error: err instanceof Error ? err.message : fallbackMsg,
      statusCode: 500,
    };
  }
}

export async function updateChargeHead(
  id: number,
  dto: UpdateChargeHeadDto
): Promise<ApiResponse<ChargeHead>> {
  try {
    const codeVal =
      dto.chargeHeadCode || ((dto as unknown as Record<string, unknown>).code as string) || '';

    const nameVal =
      dto.chargeHeadName || ((dto as unknown as Record<string, unknown>).name as string) || '';

    const rawLocal =
      (dto as unknown as Record<string, unknown>).chargeHeadNameLocal ??
      (dto as unknown as Record<string, unknown>).ChargeHeadNameLocal ??
      (dto as unknown as Record<string, unknown>).chargeHeadNameMar ??
      (dto as unknown as Record<string, unknown>).nameLocal;

    const localVal =
      typeof rawLocal === 'string' && rawLocal.trim() !== '' ? rawLocal.trim() : null;

    const rawDesc =
      (dto as unknown as Record<string, unknown>).description ??
      (dto as unknown as Record<string, unknown>).Description ??
      (dto as unknown as Record<string, unknown>).remark;

    const descVal = typeof rawDesc === 'string' && rawDesc.trim() !== '' ? rawDesc.trim() : null;

    const payload: Record<string, unknown> = {
      id,
      Id: id,

      chargeHeadCode: codeVal,
      ChargeHeadCode: codeVal,
      chargeHeadName: nameVal,
      ChargeHeadName: nameVal,
      code: codeVal,
      name: nameVal,

      chargeHeadNameLocal: localVal,
      ChargeHeadNameLocal: localVal,
      chargeHeadNameMar: localVal,
      ChargeHeadNameMar: localVal,
      chargeHeadName_Local: localVal,
      ChargeHeadName_Local: localVal,
      nameLocal: localVal,
      NameLocal: localVal,

      chargeType: dto.chargeType,
      ChargeType: dto.chargeType,
      isRefundable: dto.isRefundable ?? false,
      IsRefundable: dto.isRefundable ?? false,
      sequenceNo: dto.sequenceNo ?? 1,
      SequenceNo: dto.sequenceNo ?? 1,

      description: descVal,
      Description: descVal,
      remark: descVal,
      Remark: descVal,
      remarks: descVal,
      Remarks: descVal,

      isRegularPay: dto.isRegularPay ?? false,
      IsRegularPay: dto.isRegularPay ?? false,
      isActive: dto.isActive ?? true,
      IsActive: dto.isActive ?? true,

      createdBy: 1,
      CreatedBy: 1,
      updatedBy: 1,
      UpdatedBy: 1,
    };

    const response = await apiClient.put<unknown>(
      `${BASE_ENDPOINT}/${encodeURIComponent(String(id))}`,
      payload
    );

    if (response.success) {
      let rawObj = (response.data as Record<string, unknown>) ?? {};

      if (rawObj.data && typeof rawObj.data === 'object' && !Array.isArray(rawObj.data)) {
        rawObj = rawObj.data as Record<string, unknown>;
      } else if (rawObj.items && typeof rawObj.items === 'object' && !Array.isArray(rawObj.items)) {
        rawObj = rawObj.items as Record<string, unknown>;
      }

      const normalized = normalizeChargeHead(
        rawObj.id || rawObj.chargeHeadCode || rawObj.code ? rawObj : { ...payload }
      );

      return {
        success: true,
        statusCode: response.statusCode,
        data: normalized,
      };
    }

    const updateFailedMsg = await getChargeHeadTranslation('errors.updateFailed', 'Failed to update charge head');

    return {
      success: false,
      error: response.error || updateFailedMsg,
      statusCode: response.statusCode || 400,
    };
  } catch (err: unknown) {
    const updateFailedMsg = await getChargeHeadTranslation('errors.updateFailed', 'Failed to update charge head');

    return {
      success: false,
      error: err instanceof Error ? err.message : updateFailedMsg,
      statusCode: 500,
    };
  }
}

export async function deleteChargeHead(id: number): Promise<ApiResponse<void>> {
  try {
    if (!id || !Number.isFinite(id) || id <= 0) {
      const errorMsg = await getChargeHeadTranslation('errors.validationFailed', 'Valid Charge Head ID is required');
      return {
        success: false,
        error: errorMsg,
        statusCode: 400,
      };
    }

    const response = await apiClient.delete<unknown>(
      `${BASE_ENDPOINT}/${encodeURIComponent(String(id))}/purge`
    );

    const body = response.data as { success?: boolean; message?: string; errors?: string[] } | undefined;

    if (response.success && body?.success !== false) {
      return {
        success: true,
        statusCode: response.statusCode,
        message: body?.message || response.message,
      };
    }

    logger.warn('ChargeHeadMaster purge delete failed', {
      id,
      statusCode: response.statusCode,
      error: response.error,
    });

    const errorMsg = body?.message || response.error;
    const fallbackMsg = await getChargeHeadTranslation('errors.deleteFailed', 'Failed to delete charge head');

    return {
      success: false,
      error: errorMsg || fallbackMsg,
      statusCode: response.statusCode || 400,
    };
  } catch (err: unknown) {
    logger.error('deleteChargeHead unhandled exception', { id }, err);
    const fallbackMsg = await getChargeHeadTranslation('errors.deleteFailed', 'Failed to delete charge head');

    return {
      success: false,
      error: err instanceof Error ? err.message : fallbackMsg,
      statusCode: 500,
    };
  }
}

export async function purgeChargeHead(id: number): Promise<ApiResponse<void>> {
  return deleteChargeHead(id);
}
