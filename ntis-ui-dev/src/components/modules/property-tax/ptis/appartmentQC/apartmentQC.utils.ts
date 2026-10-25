import { ApartmentQCDetail, PagedResponse } from '@/types/apartmentQC.types';
import { formatNumericDate } from '@/lib/utils/format';
import type { RowGroup } from './ApartmentQCMasterTable';
const safe = (v: unknown) => (v === null || v === undefined || v === '' ? '-' : v);
const formatAreaPair = (sqFt: unknown, sqMtr: unknown) => {
  const ft = safe(sqFt);
  const mtr = safe(sqMtr);
  return ft === '-' && mtr === '-' ? '-' : `${ft} / ${mtr}`;
};

export const emptyPagedResponse: PagedResponse<ApartmentQCDetail> = {
  items: [],
  totalCount: 0,
  pageNumber: 1,
  pageSize: 10,
  totalPages: 1,
  hasPrevious: false,
  hasNext: false,
};

export const mainTabs = [
  { value: 'amenities', label: 'Amenities', icon: 'Building2' },
  { value: 'commercial', label: 'Commercial Units', icon: 'Building' },
  { value: 'residential', label: 'Residential Units', icon: 'Home' },
];

export const subTabsList = [
  { value: 'rateable', label: 'Rateable', icon: 'Calculator' },
  { value: 'capital', label: 'Capital', icon: 'IndianRupee' },
  { value: 'dual-method', label: 'Dual Method', icon: 'GitMerge' },
];

/**
 * Transforms raw API items into a format suitable for the table display.
 */
export const transformApartmentData = (items: ApartmentQCDetail[], _activeMainTab: string) => {
  if (_activeMainTab === 'commercial' || _activeMainTab === 'residential') {
    return items.map((item) => ({
      ...item,
      oldPropertyNo: item.oldPropertyNo,
      oldConstructionCarpetAreaSqFt: item.oldConstructionCarpetAreaSqFt,
      oldConstructionCarpetAreaSqMtr: item.oldConstructionCarpetAreaSqMtr,
      oldConstructionBuiltUpSqFt: item.oldConstructionBuiltUpSqFt,
      oldConstructionBuiltUpSqMtr: item.oldConstructionBuiltUpSqMtr,
      flatOrShopNo: safe(item.flatOrShopNo),
      flatOrShopName: safe(item.flatOrShopName),
      ownerName: safe(item.ownerName),
      occupierName: safe(item.occupierName),
      rentMonthly: safe(item.rentMonthly),
      renterName: safe(item.renterName),
      typeOfUse: safe(item.typeOfUse),
      type: safe(item.type),
      floor: safe(item.floor),
      assessmentYear: safe(item.assessmentYear),
      constructionYear: safe(item.constructionYear),
      oldUseType: safe(item.oldUseType),
      carpetASqFt: safe(item.carpetASqFt),
      carpetASqMtr: safe(item.carpetASqMtr),
      builtupASqFt: safe(item.builtupASqFt),
      builtupASqMtr: safe(item.builtupASqMtr),
      oldRV: safe(item.oldRV),
      oldTotalTax: safe(item.oldTotalTax),
      rateableValue: safe(item.rateableValue),
      capitalValue: safe(item.capitalValue),
      newTaxTotal: safe(item.newTaxTotal),
      newTaxTotalRV: safe(item.newTaxTotalRV),
      newTaxTotalCV: safe(item.newTaxTotalCV),
      depreciation: safe(item.depreciation),
      mobileNo: safe(item.mobileNo),
      emailId: safe(item.emailId),
      ocDate: safe(formatNumericDate(item.ocDate)),
    }));
  }

  return items.map((item) => ({
    ...item,
    oldConstructionCarpetAreaSqFt: item.oldConstructionCarpetAreaSqFt,
    oldConstructionCarpetAreaSqMtr: item.oldConstructionCarpetAreaSqMtr,
    oldConstructionBuiltUpSqFt: item.oldConstructionBuiltUpSqFt,
    oldConstructionBuiltUpSqMtr: item.oldConstructionBuiltUpSqMtr,
    propertyNo: item.propertyNo || '-',
    floor: item.floor || '-',
    assessmentYear: item.assessmentYear || '-',
    constructionYear: item.constructionYear || '-',
    typeOfUse: safe(item.typeOfUse),
    carpetArea: `${item.carpetASqFt || 0} / ${item.carpetASqMtr || 0}`,
    builtupArea: `${item.builtupASqFt || 0} / ${item.builtupASqMtr || 0}`,
    oldRV: item.oldRV || '-',
    newRV: item.newTaxTotalRV || '-',
    cv: item.newTaxTotalCV || '-',
    totalTax: item.newTaxTotal || 0,
    ocDate: formatNumericDate(item.ocDate),
  }));
};

export const getTabTitle = (activeMainTab: string, t: (key: string) => string) => {
  switch (activeMainTab) {
    case 'commercial':
      return t('apartmentTabs.commercialTitle');
    case 'residential':
      return t('apartmentTabs.residentialTitle');
    default:
      return t('apartmentTabs.amenitiesTitle');
  }
};

export const groupApartmentData = <T extends Record<string, unknown>>(
  items: T[],
  pageNumber: number = 1,
  pageSize: number = 10
): RowGroup<T>[] => {
  const groups: RowGroup<T>[] = [];

  const startIdx = (pageNumber - 1) * pageSize;

  items.forEach((item, i) => {
    const hasOldPropertyNo =
      item.oldPropertyNo !== null &&
      item.oldPropertyNo !== undefined &&
      item.oldPropertyNo !== '';
    const newRow = { ...item } as Record<string, unknown>;

    newRow['Sr.No'] = startIdx + i + 1;
    newRow['Records'] = 'new';
    newRow.propertyNo = safe(item.propertyNo);
    newRow.constructionYear = safe(item.constructionYear);
    newRow.assessmentYear = safe(item.assessmentYear);
    newRow.ocDate = safe(item.ocDate);
    newRow.ownerName = safe(item.ownerName);
    newRow.occupierName = safe(item.occupierName);
    newRow.bhk = safe(item.bhk);
    newRow.carpetArea = formatAreaPair(item.carpetASqFt, item.carpetASqMtr);
    newRow.builtupArea = formatAreaPair(item.builtupASqFt, item.builtupASqMtr);
    newRow.typeOfUse = safe(item.typeOfUse);
    newRow.constructionType = safe(item.constructionType);
    newRow.rateableValue = safe(item.rateableValue ?? item.newTaxTotalRV);
    newRow.oldRV = safe(item.newTaxTotalRV);
    newRow.capitalValue = safe(item.capitalValue);
    newRow.totalTax = safe(item.newTaxTotal);
    newRow.newTaxTotalRV = safe(item.newTaxTotalRV);
    newRow.newTaxTotalCV = safe(item.newTaxTotalCV);
    newRow.depreciation = safe(item.depreciation);
    newRow.wing = safe(item.wing);
    newRow.flatOrShopNo = safe(item.flatOrShopNo);
    newRow.flatOrShopName = safe(item.flatOrShopName);
    newRow.rentMonthly = safe(item.rentMonthly);
    newRow.renterName = safe(item.renterName);
    newRow.propertyTypeName = safe(item.propertyTypeName);
    newRow.apartmentType = safe(item.apartmentType);
    newRow.floor = safe(item.floor);
    newRow.toiletCount = safe(item.toiletCount);
    newRow.mobileNo = safe(item.mobileNo);
    newRow.emailId = safe(item.emailId);
    newRow.carpetASqFt = safe(item.carpetASqFt);
    newRow.carpetASqMtr = safe(item.carpetASqMtr);
    newRow.builtupASqFt = safe(item.builtupASqFt);
    newRow.builtupASqMtr = safe(item.builtupASqMtr);

    if (hasOldPropertyNo) {
      const oldRow = { ...item } as Record<string, unknown>;
      oldRow['Sr.No'] = startIdx + i + 1;
      oldRow['Records'] = 'old';
      oldRow.propertyNo = safe(item.oldPropertyNo);
      oldRow.constructionYear = safe(item.oldConstructionYear);
      oldRow.assessmentYear = '-';
      oldRow.ocDate = '-';
      oldRow.ownerName = '-';
      oldRow.occupierName = '-';
      oldRow.bhk = '-';
      oldRow.carpetArea = formatAreaPair(item.oldConstructionCarpetAreaSqFt, item.oldConstructionCarpetAreaSqMtr);
      oldRow.builtupArea = formatAreaPair(item.oldConstructionBuiltUpSqFt, item.oldConstructionBuiltUpSqMtr);
      oldRow.typeOfUse = safe(item.oldUseType);
      oldRow.constructionType = safe(item.oldConstructionType);
      oldRow.rateableValue = safe(item.oldRV);
      oldRow.oldRV = safe(item.oldRV);
      oldRow.capitalValue = '-';
      oldRow.totalTax = safe(item.oldTotalTax);
      oldRow.oldCSN = safe(item.oldCSN);
      oldRow.newTaxTotalRV = '-';
      oldRow.newTaxTotalCV = '-';
      oldRow.depreciation = '-';
      oldRow.wing = '-';
      oldRow.flatOrShopNo = '-';
      oldRow.flatOrShopName = '-';
      oldRow.rentMonthly = '-';
      oldRow.renterName = '-';
      oldRow.propertyTypeName = '-';
      oldRow.apartmentType = '-';
      oldRow.floor = '-';
      oldRow.toiletCount = '-';
      oldRow.mobileNo = '-';
      oldRow.emailId = '-';
      oldRow.carpetASqFt = safe(item.oldConstructionCarpetAreaSqFt);
      oldRow.carpetASqMtr = safe(item.oldConstructionCarpetAreaSqMtr);
      oldRow.builtupASqFt = safe(item.oldConstructionBuiltUpSqFt);
      oldRow.builtupASqMtr = safe(item.oldConstructionBuiltUpSqMtr);

      groups.push({
        srNo: startIdx + i + 1,
        row1: oldRow as T,
        row2: newRow as T,
      });
    } else {
      groups.push({
        srNo: startIdx + i + 1,
        row2: newRow as T,
      });
    }
  });

  return groups;
};
