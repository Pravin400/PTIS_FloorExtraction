import type {
  ApplicationLevel,
  CertificateTypeMasterOption,
  UnitSelectionItem,
  WingOption,
} from '@/types/building-permission.types';

interface SearchParamsLike {
  get(key: string): string | null;
}

interface ResolveInitialPermissionParamsInput {
  searchParams: SearchParamsLike;
  societyId?: number | null;
  wingDetailId?: number | string | null;
  categoryName?: string;
  categoryId?: number | null;
  wings?: WingOption[];
  units?: UnitSelectionItem[];
  certificateTypes?: CertificateTypeMasterOption[];
  initialLevel?: ApplicationLevel;
  initialCertificateTypeId?: number | null;
}

export function resolveInitialPermissionParams({
  searchParams,
  societyId,
  wingDetailId: propWingDetailId,
  categoryName,
  categoryId,
  wings = [],
  units = [],
  certificateTypes = [],
  initialLevel = 'Apartment',
  initialCertificateTypeId = 3,
}: ResolveInitialPermissionParamsInput) {
  const urlSocietyDetailId = searchParams.get('societyDetailId') || searchParams.get('societyId');
  const effectiveSocietyDetailId =
    (societyId && Number(societyId) > 0 ? Number(societyId) : null) ??
    (urlSocietyDetailId && Number(urlSocietyDetailId) > 0 ? Number(urlSocietyDetailId) : null);
  const hasSocietyDetailId = Boolean(effectiveSocietyDetailId && effectiveSocietyDetailId > 0);

  const urlWingDetailId = searchParams.get('wingDetailId') || searchParams.get('wingId');
  const parsedPropWingId =
    propWingDetailId && !isNaN(Number(propWingDetailId)) && Number(propWingDetailId) > 0
      ? Number(propWingDetailId)
      : null;
  const parsedUrlWingId =
    urlWingDetailId && !isNaN(Number(urlWingDetailId)) && Number(urlWingDetailId) > 0
      ? Number(urlWingDetailId)
      : null;
  const initialWingDetailId =
    parsedPropWingId ?? parsedUrlWingId ?? (wings && wings.length > 0 ? wings[0].wingDetailId : null);

  const rawCat = categoryName || searchParams.get('propertyCategory') || searchParams.get('categoryName') || '';
  const hasPartition = Boolean(searchParams.get('appartmentPartition') || searchParams.get('partitionNo'));
  const effectiveCategoryName = (
    (hasPartition && rawCat.toLowerCase().includes('apartment') ? 'Apartment/Individual' : rawCat) || rawCat
  ).toLowerCase();
  const isApartment =
    (categoryId === 1 ||
      effectiveCategoryName.includes('apartment') ||
      hasSocietyDetailId ||
      Boolean(searchParams.get('parentPropertyId')) ||
      wings.length > 0 ||
      units.length > 0) &&
    categoryId !== 2;
  const isApartmentIndividual = !isApartment;

  const isWingWise = searchParams.get('isWingWise') === 'true';
  const showApartmentTab = !isWingWise;
  const showWingTab = !isWingWise;
  const showLevelSelector = isApartment;

  const urlLevel = searchParams.get('level') as ApplicationLevel | null;
  const rawInitialLevel =
    urlLevel === 'Apartment' || urlLevel === 'Wing' || urlLevel === 'Unit'
      ? urlLevel
      : isWingWise && initialLevel === 'Apartment'
        ? 'Wing'
        : initialLevel;
  const effectiveInitialLevel: ApplicationLevel =
    rawInitialLevel === 'Apartment' && !showApartmentTab
      ? showWingTab
        ? 'Wing'
        : 'Unit'
      : rawInitialLevel === 'Wing' && !showWingTab
        ? 'Unit'
        : rawInitialLevel;

  const urlCertTypeId = searchParams.get('certificateTypeId') || searchParams.get('certTypeId');
  const urlCertTypeCode = searchParams.get('certificateTypeCode') || searchParams.get('certType');
  const matchedCert = urlCertTypeCode
    ? certificateTypes.find((ct) => ct.certificateTypeCode.toLowerCase() === urlCertTypeCode.toLowerCase())
    : null;
  const resolvedCertTypeId =
    urlCertTypeId && !isNaN(Number(urlCertTypeId))
      ? Number(urlCertTypeId)
      : matchedCert
        ? matchedCert.certificateTypeId
        : initialCertificateTypeId;

  return {
    initialWingDetailId,
    isApartment,
    isApartmentIndividual,
    showApartmentTab,
    showWingTab,
    showLevelSelector,
    effectiveInitialLevel,
    resolvedCertTypeId,
  };
}
