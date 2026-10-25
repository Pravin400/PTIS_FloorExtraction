'use server';

import { fetchApartmentQCDetailsPagedAction } from './appartmentQC/action';
import { PagedResponse, ApartmentQCDetail } from '@/types/apartmentQC.types';

const emptyPaged: PagedResponse<ApartmentQCDetail> = {
  items: [],
  totalCount: 0,
  pageNumber: 1,
  pageSize: 10,
  totalPages: 1,
  hasPrevious: false,
  hasNext: false,
};

interface FilterParams {
  wing?: string;
  flatOrShopNo?: string;
  apartmentType?: string;
  propertyType?: string;
}

interface SortParams {
  sortBy?: string;
  sortOrder?: string;
}

export async function getApartmentQCDataAction(
  wardId: number,
  propertyNo: string,
  _appartmentTab: string = 'amenities',
  pageNumber: number = 1,
  pageSize: number = 10,
  searchTerm: string = '',
  propertyId?: number,
  filters?: FilterParams,
  sort?: SortParams,
  partitionNo?: string
) {
  try {
    const baseParams = {
      wardId,
      propertyNo,
      partitionNo,
      pageNumber,
      pageSize,
      searchTerm,
      propertyDetailsId: propertyId,
      sortBy: sort?.sortBy,
      sortOrder: sort?.sortOrder,
      wing: filters?.wing,
      flatOrShopNo: filters?.flatOrShopNo,
      apartmentType: filters?.apartmentType,
      propertyType: filters?.propertyType,
    };

    const [amenitiesResult, commercialResult, residentialResult] = await Promise.all([
      fetchApartmentQCDetailsPagedAction({ ...baseParams, partType: 'Amenity' }),
      fetchApartmentQCDetailsPagedAction({ ...baseParams, partType: 'C' }),
      fetchApartmentQCDetailsPagedAction({ ...baseParams, partType: 'R' }),
    ]);

    return {
      amenities: amenitiesResult.success && amenitiesResult.data ? amenitiesResult.data : emptyPaged,
      commercial: commercialResult.success && commercialResult.data ? commercialResult.data : emptyPaged,
      residential: residentialResult.success && residentialResult.data ? residentialResult.data : emptyPaged,
    };
  } catch (error) {
    console.error('[getApartmentQCDataAction] Error:', error);
    return {
      amenities: emptyPaged,
      commercial: emptyPaged,
      residential: emptyPaged,
    };
  }
}
