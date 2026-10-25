import 'server-only';
import { apiClient } from '@/services/api.service';
import {
  SearchWingWiseFilters,
  ApartmentDetailsWingWiseResponseDto,
  WingWisePaginationContainerDto,
} from '@/types/property-tax/apartment';
import {
  isWingWisePaginationContainerShape,
  normalizeWingWisePaginationContainer,
  isApartmentWingWiseItemShape,
  normalizeApartmentWingWiseItem,
} from '@/lib/api/ptis/apartment-details-types-guard';

/**
 * Fetches wing-wise apartment assessment details with pagination and filters
 */
export async function getApartmentDetailsWingWise(
  filters: SearchWingWiseFilters
): Promise<ApartmentDetailsWingWiseResponseDto> {
  try {
    const params = new URLSearchParams();

    const hasWingDetailId =
      filters.wingDetailId !== undefined &&
      filters.wingDetailId !== null &&
      Number.isFinite(Number(filters.wingDetailId)) &&
      Number(filters.wingDetailId) > 0;

    if (hasWingDetailId) {
      params.append('WingDetailId', Number(filters.wingDetailId).toString());
    } else {
      if (filters.propertyId !== undefined && filters.propertyId !== null) {
        const propIdNum = Number(filters.propertyId);
        if (Number.isFinite(propIdNum) && propIdNum > 0) {
          params.append('PropertyId', propIdNum.toString());
        }
      }

      if (filters.wingId !== undefined && filters.wingId !== null) {
        const wingIdNum = Number(filters.wingId);
        if (Number.isFinite(wingIdNum) && wingIdNum > 0) {
          params.append('WingId', wingIdNum.toString());
        }
      }
    }

    if (filters.pageNumber !== undefined && filters.pageNumber !== null) {
      const pageNum = Number(filters.pageNumber);
      if (Number.isFinite(pageNum) && pageNum > 0) {
        params.append('PageNumber', pageNum.toString());
      }
    }

    if (filters.pageSize !== undefined && filters.pageSize !== null) {
      const pageSizeNum = Number(filters.pageSize);
      if (Number.isFinite(pageSizeNum) && pageSizeNum > 0) {
        params.append('PageSize', pageSizeNum.toString());
      }
    }

    if (typeof filters.floor === 'string' && filters.floor.trim()) {
      params.append('Floor', filters.floor.trim());
    }

    if (typeof filters.searchTerm === 'string' && filters.searchTerm.trim()) {
      params.append('SearchTerm', filters.searchTerm.trim());
    }

    if (typeof filters.sortBy === 'string' && filters.sortBy.trim()) {
      params.append('SortBy', filters.sortBy.trim());
    }

    if (typeof filters.sortOrder === 'string' && filters.sortOrder.trim()) {
      params.append('SortOrder', filters.sortOrder.trim());
    }

    if (filters.filterLogic !== undefined && filters.filterLogic !== null) {
      const logicNum = Number(filters.filterLogic);
      if (Number.isFinite(logicNum)) {
        params.append('FilterLogic', logicNum.toString());
      }
    }

    const queryString = params.toString();
    const endpoint = `/ApartmentQC/apartment-details-wing-wise${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get<Record<string, unknown>>(endpoint, { cache: 'no-store' });

    if (!response.success) {
      return {
        success: false,
        message: response.error || 'Failed to fetch apartment details from backend API',
        errors: response.error ? [response.error] : null,
      };
    }

    const responseData = response.data as Record<string, unknown> | null;
    if (!responseData) {
      return {
        success: true,
        message: 'No data returned from backend API',
        data: null,
        items: null,
      };
    }

    const rawContainer =
      responseData.items && typeof responseData.items === 'object'
        ? (responseData.items as Record<string, unknown>)
        : responseData.data && typeof responseData.data === 'object'
        ? (responseData.data as Record<string, unknown>)
        : responseData;

    let normalizedContainer: WingWisePaginationContainerDto;

    if (isWingWisePaginationContainerShape(rawContainer)) {
      normalizedContainer = normalizeWingWisePaginationContainer(rawContainer);
    } else if (Array.isArray(responseData.items)) {
      const validItems = responseData.items
        .filter(isApartmentWingWiseItemShape)
        .map(normalizeApartmentWingWiseItem);
      normalizedContainer = {
        items: validItems,
        totalCount: validItems.length,
        pageNumber: Number(filters.pageNumber) || 1,
        pageSize: Number(filters.pageSize) || validItems.length || 10,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      };
    } else {
      normalizedContainer = {
        items: [],
        totalCount: 0,
        pageNumber: Number(filters.pageNumber) || 1,
        pageSize: Number(filters.pageSize) || 10,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false,
      };
    }

    return {
      success: true,
      message: typeof responseData.message === 'string' ? responseData.message : 'Record found successfully',
      data: normalizedContainer,
      items: normalizedContainer,
      errors: Array.isArray(responseData.errors) ? (responseData.errors as string[]) : null,
      correlationId: typeof responseData.correlationId === 'string' ? responseData.correlationId : null,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network connection error',
    };
  }
}

// Re-export all apartment services directly from this central service module
export * from './apartment-wing.service';
export * from './apartment-tax-details.service';
export * from './apartment-qc-below-flex.service';
export * from './apartment-qc-top-section.service';
