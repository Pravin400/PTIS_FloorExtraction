import type { PropertyMasterData, ApartmentQcTopSectionDto } from '@/types/property-tax/apartment';
import type { PropertySocietyDetailsApiItem } from '@/types/property-society-details.types';
import { getViewDocumentUrl } from '@/lib/utils/document-utils';
import { mapPerformanceSummary } from './apartment-qc-performance.mapper';

export { mapPerformanceSummary };

const toPositiveNumberOrNull = (val: unknown): number | null => {
  if (val === null || val === undefined) return null;
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  return !isNaN(num) && num > 0 && num !== 2147483647 ? num : null;
};

const formatPhone = (val: unknown): string => {
  if (val === null || val === undefined) return '-';
  const str = String(val).trim();
  if (!str || str === '-' || str === 'null' || str === 'undefined') return '-';
  const digits = str.replace(/\D/g, '');
  if (digits.length < 5) return '-';
  return str.startsWith('+') ? str : `+91 ${digits.slice(-10)}`;
};

export function mapApartmentQcTopSectionToPropertyMasterData(
  dto?: ApartmentQcTopSectionDto | null,
  societyDetails?: PropertySocietyDetailsApiItem | null
): PropertyMasterData {
  if (!dto) {
    return {
      propertyNo: '-', upic: '-',
      societyName: societyDetails?.societyName || '-',
      ownerName: societyDetails?.landOwnerName || '-',
      status: 'ACTIVE PROPERTY', category: 'Apartment', propertyDescriptionRegional: '-',
      division: '-', taxZone: '-', taxZoneAndName: '-', subZoneCsnNo: '-',
      plotNo: '-',
      address: societyDetails?.societyAddress || '-',
      societyAddress: societyDetails?.societyAddress || '-',
      plotArea: '-',
      carpetBuiltUpArea: '-', oldCarpetBuiltUp: '-',
      oldCarpetAreaFtMtr: undefined, oldBuiltUpAreaFtMtr: undefined,
      totalFloors: '-',
      totalPropertiesResCommAmen: '-',
      secretaryName: societyDetails?.secretaryName || '-',
      secretaryNameEnglish: societyDetails?.secretaryNameEnglish || undefined,
      secretaryMobileNo: formatPhone(societyDetails?.secretaryMobileNo),
      secretaryEmail: societyDetails?.secretaryEmailId || '-',
      managerName: societyDetails?.managerName || '-',
      managerNameEnglish: societyDetails?.managerNameEnglish || undefined,
      managerMobileNo: formatPhone(societyDetails?.managerMobileNo),
      managerEmail: societyDetails?.managerEmailId || '-',
      builderName: societyDetails?.builderName || '-',
      builderNameEnglish: societyDetails?.builderNameEnglish || undefined,
      landOwnerName: societyDetails?.landOwnerName || '-',
      landOwnerNameEnglish: societyDetails?.landOwnerNameEnglish || undefined,
      societyNameEnglish: societyDetails?.societyNameEnglish || undefined,
      societyAddressEnglish: societyDetails?.societyAddressEnglish || undefined,
      societyEmail: societyDetails?.societyEmailId || '-',
      societyBuildingPhotoGuid: undefined, imageUrl: undefined,
      latitude: societyDetails?.latitude,
      longitude: societyDetails?.longitude,
      performance: mapPerformanceSummary(null),
    };
  }

  const overview = dto.propertyOverview;
  const info = dto.propertyInfo;
  const perf = dto.performanceSummary;
  const addRev = dto.additionalRevenue || perf?.additionalRevenue;

  const rawDto = dto as unknown as Record<string, unknown>;
  const rawOverview = overview as unknown as Record<string, unknown>;
  const rawInfo = info as unknown as Record<string, unknown>;

  const propertyNo =
    (rawOverview?.propertyNo && rawOverview.propertyNo !== '-') ? String(rawOverview.propertyNo)
      : (rawDto?.propertyNo && rawDto.propertyNo !== '-') ? String(rawDto.propertyNo)
      : (overview?.propertyId && overview.propertyId !== '-') ? String(overview.propertyId) : '-';

  const upic =
    (overview?.upic && overview.upic !== '-') ? overview.upic
      : (rawOverview?.upicId && rawOverview.upicId !== '-') ? String(rawOverview.upicId)
      : (rawDto?.upic && rawDto.upic !== '-') ? String(rawDto.upic) : '-';

  const societyName =
    (overview?.societyName && overview.societyName !== '-') ? overview.societyName
      : (societyDetails?.societyName && societyDetails.societyName !== '-') ? societyDetails.societyName
      : (overview?.propertyHolder && overview.propertyHolder !== '-') ? overview.propertyHolder
      : '-';

  const ownerName =
    (societyDetails?.landOwnerName && societyDetails.landOwnerName !== '-') ? societyDetails.landOwnerName
      : (overview?.owner && overview.owner !== '-') ? overview.owner
      : (overview?.propertyHolder && overview.propertyHolder !== '-') ? overview.propertyHolder
      : '-';

  const status = overview?.propertyStatus ? `${overview.propertyStatus.toUpperCase()} PROPERTY` : 'ACTIVE PROPERTY';
  const category = overview?.propertyCategory || '-';
  const propertyDescriptionRegional = overview?.propertyDescription || '-';
  const division = info?.division || '-';
  const taxZone = info?.taxZone || '-';
  const surveyNo = info?.surveyNo || '';
  const cleanField = (val: unknown): string | null => {
    if (val === null || val === undefined) return null;
    const str = String(val).trim();
    return (str && str !== '-' && str !== 'null' && str !== 'undefined') ? str : null;
  };

  const rawSubZone = cleanField(
    overview?.subZoneNo ??
    rawOverview?.subZoneNo ??
    rawOverview?.subZone ??
    info?.subZoneNo ??
    rawInfo?.subZoneNo ??
    rawInfo?.subZone ??
    rawDto?.subZoneNo ??
    rawDto?.subZone
  );

  const rawCsn = cleanField(
    overview?.csn ??
    rawOverview?.csn ??
    info?.csn ??
    rawInfo?.csn ??
    rawDto?.csn
  );

  const subZoneCsnNo = (() => {
    if (rawSubZone && rawCsn) {
      const cleanCsn = rawCsn.replace(/^CSN\s*[-:]?\s*/i, '').trim();
      return `${rawSubZone} - ${cleanCsn}`;
    }
    if (rawSubZone) return rawSubZone;
    if (rawCsn) {
      return rawCsn.toUpperCase().startsWith('CSN') ? rawCsn : `CSN - ${rawCsn}`;
    }
    const legacy = cleanField(rawInfo?.subZoneCsnNo ?? rawDto?.subZoneCsnNo ?? rawOverview?.subZoneCsnNo);
    return legacy || '-';
  })();
  const plotNo = info?.plotNo || '-';
  const address = (info?.address && info.address !== '-') ? info.address
    : (societyDetails?.societyAddress && societyDetails.societyAddress !== '-') ? societyDetails.societyAddress
    : '-';

  const plotAreaFt = toPositiveNumberOrNull(info?.plotAreaFt ?? rawInfo?.plotAreaFt);
  const plotAreaMtr = toPositiveNumberOrNull(info?.plotAreaMtr ?? rawInfo?.plotAreaMtr);
  const formatAreaNum = (val: number): string =>
    Number.isInteger(val)
      ? val.toLocaleString('en-IN')
      : val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const plotArea = (plotAreaFt != null && plotAreaMtr != null)
    ? `${formatAreaNum(plotAreaFt)} sq.ft / ${formatAreaNum(plotAreaMtr)} sq.m`
    : plotAreaFt != null
    ? `${formatAreaNum(plotAreaFt)} sq.ft`
    : plotAreaMtr != null
    ? `${formatAreaNum(plotAreaMtr)} sq.m`
    : '-';

  const carpetAreaFt = toPositiveNumberOrNull(info?.carpetAreaFt ?? rawInfo?.carpetAreaFt ?? rawOverview?.carpetAreaFt ?? rawDto?.carpetAreaFt);
  const carpetAreaMtr = toPositiveNumberOrNull(info?.carpetAreaMtr ?? rawInfo?.carpetAreaMtr ?? rawOverview?.carpetAreaMtr ?? rawDto?.carpetAreaMtr);
  const carpetAreaFtMtr = (carpetAreaFt != null && carpetAreaMtr != null)
    ? `${formatAreaNum(carpetAreaFt)} sq.ft / ${formatAreaNum(carpetAreaMtr)} sq.m`
    : carpetAreaFt != null
    ? `${formatAreaNum(carpetAreaFt)} sq.ft`
    : carpetAreaMtr != null
    ? `${formatAreaNum(carpetAreaMtr)} sq.m`
    : undefined;

  const builtUpAreaFt = toPositiveNumberOrNull(info?.builtUpAreaFt ?? rawInfo?.builtUpAreaFt ?? rawOverview?.builtUpAreaFt ?? rawDto?.builtUpAreaFt);
  const builtUpAreaMtr = toPositiveNumberOrNull(info?.builtUpAreaMtr ?? rawInfo?.builtUpAreaMtr ?? rawOverview?.builtUpAreaMtr ?? rawDto?.builtUpAreaMtr);
  const builtUpAreaFtMtr = (builtUpAreaFt != null && builtUpAreaMtr != null)
    ? `${formatAreaNum(builtUpAreaFt)} sq.ft / ${formatAreaNum(builtUpAreaMtr)} sq.m`
    : builtUpAreaFt != null
    ? `${formatAreaNum(builtUpAreaFt)} sq.ft`
    : builtUpAreaMtr != null
    ? `${formatAreaNum(builtUpAreaMtr)} sq.m`
    : undefined;

  const hasFt = carpetAreaFt != null && builtUpAreaFt != null;
  const hasMtr = carpetAreaMtr != null && builtUpAreaMtr != null;

  const carpetBuiltUpArea = (hasFt && hasMtr)
    ? `${carpetAreaFt!.toLocaleString('en-IN')} / ${builtUpAreaFt!.toLocaleString('en-IN')} sq.ft (${carpetAreaMtr!.toLocaleString('en-IN')} / ${builtUpAreaMtr!.toLocaleString('en-IN')} sq.m)`
    : hasFt
    ? `${carpetAreaFt!.toLocaleString('en-IN')} / ${builtUpAreaFt!.toLocaleString('en-IN')} sq.ft`
    : hasMtr
    ? `${carpetAreaMtr!.toLocaleString('en-IN')} / ${builtUpAreaMtr!.toLocaleString('en-IN')} sq.m`
    : '-';

  const oldCarpetAreaFt = toPositiveNumberOrNull(info?.oldCarpetAreaFt ?? rawInfo?.oldCarpetAreaFt ?? rawDto?.oldCarpetAreaFt);
  const oldCarpetAreaMtr = toPositiveNumberOrNull(info?.oldCarpetAreaMtr ?? rawInfo?.oldCarpetAreaMtr ?? rawDto?.oldCarpetAreaMtr);
  const oldCarpetAreaFtMtr = (oldCarpetAreaFt != null && oldCarpetAreaMtr != null)
    ? `${oldCarpetAreaFt.toLocaleString('en-IN')} sq.ft / ${oldCarpetAreaMtr.toLocaleString('en-IN')} sq.m`
    : oldCarpetAreaFt != null
    ? `${oldCarpetAreaFt.toLocaleString('en-IN')} sq.ft`
    : oldCarpetAreaMtr != null
    ? `${oldCarpetAreaMtr.toLocaleString('en-IN')} sq.m`
    : undefined;

  const oldBuiltUpAreaFt = toPositiveNumberOrNull(info?.oldBuiltUpAreaFt ?? rawInfo?.oldBuiltUpAreaFt ?? rawDto?.oldBuiltUpAreaFt);
  const oldBuiltUpAreaMtr = toPositiveNumberOrNull(info?.oldBuiltUpAreaMtr ?? rawInfo?.oldBuiltUpAreaMtr ?? rawDto?.oldBuiltUpAreaMtr);
  const oldBuiltUpAreaFtMtr = (oldBuiltUpAreaFt != null && oldBuiltUpAreaMtr != null)
    ? `${oldBuiltUpAreaFt.toLocaleString('en-IN')} sq.ft / ${oldBuiltUpAreaMtr.toLocaleString('en-IN')} sq.m`
    : oldBuiltUpAreaFt != null
    ? `${oldBuiltUpAreaFt.toLocaleString('en-IN')} sq.ft`
    : oldBuiltUpAreaMtr != null
    ? `${oldBuiltUpAreaMtr.toLocaleString('en-IN')} sq.m`
    : undefined;

  const hasOldFt = oldCarpetAreaFt != null && oldBuiltUpAreaFt != null;
  const hasOldMtr = oldCarpetAreaMtr != null && oldBuiltUpAreaMtr != null;

  const oldCarpetBuiltUp = (hasOldFt && hasOldMtr)
    ? `${oldCarpetAreaFt!.toLocaleString('en-IN')} / ${oldBuiltUpAreaFt!.toLocaleString('en-IN')} sq.ft (${oldCarpetAreaMtr!.toLocaleString('en-IN')} / ${oldBuiltUpAreaMtr!.toLocaleString('en-IN')} sq.m)`
    : hasOldFt
    ? `${oldCarpetAreaFt!.toLocaleString('en-IN')} / ${oldBuiltUpAreaFt!.toLocaleString('en-IN')} sq.ft`
    : hasOldMtr
    ? `${oldCarpetAreaMtr!.toLocaleString('en-IN')} / ${oldBuiltUpAreaMtr!.toLocaleString('en-IN')} sq.m`
    : oldCarpetAreaFt != null
    ? `${oldCarpetAreaFt.toLocaleString('en-IN')} sq.ft`
    : oldBuiltUpAreaFt != null
    ? `${oldBuiltUpAreaFt.toLocaleString('en-IN')} sq.ft`
    : (() => {
        const rawOld = rawDto?.oldCarpetBuiltUp ?? rawInfo?.oldCarpetBuiltUp;
        if (rawOld && rawOld !== '-' && rawOld !== '0' && rawOld !== '0 / 0' && rawOld !== '0/0') {
          return String(rawOld);
        }
        return '-';
      })();

  const wings = overview?.wings || [];
  const firstWing = wings[0];

  const secretaryName = (societyDetails?.secretaryName && societyDetails.secretaryName !== '-') ? societyDetails.secretaryName
    : (overview?.secretaryName && overview.secretaryName !== '-') ? overview.secretaryName
    : (firstWing?.secretaryName && firstWing.secretaryName !== '-') ? firstWing.secretaryName : '-';

  const secretaryNameEnglish = (societyDetails?.secretaryNameEnglish && societyDetails.secretaryNameEnglish !== '-') ? societyDetails.secretaryNameEnglish
    : (rawDto?.secretaryNameEnglish && rawDto.secretaryNameEnglish !== '-') ? String(rawDto.secretaryNameEnglish)
    : (overview?.secretaryNameEnglish && overview.secretaryNameEnglish !== '-') ? overview.secretaryNameEnglish
    : (firstWing?.secretaryNameEnglish && firstWing.secretaryNameEnglish !== '-') ? firstWing.secretaryNameEnglish : undefined;

  const rawSecMobile =
    (societyDetails?.secretaryMobileNo && societyDetails.secretaryMobileNo !== '-') ? societyDetails.secretaryMobileNo
    : (info?.secretaryMobileNo && info.secretaryMobileNo !== '-') ? info.secretaryMobileNo
    : (rawOverview?.secretaryMobileNo && rawOverview.secretaryMobileNo !== '-') ? rawOverview.secretaryMobileNo
    : (firstWing?.secretaryMobileNo && firstWing.secretaryMobileNo !== '-') ? firstWing.secretaryMobileNo
    : (rawDto?.secretaryMobileNo && rawDto.secretaryMobileNo !== '-') ? rawDto.secretaryMobileNo : undefined;
  const secretaryMobileNo = formatPhone(rawSecMobile);

  const secretaryEmail = (societyDetails?.secretaryEmailId && societyDetails.secretaryEmailId !== '-') ? societyDetails.secretaryEmailId
    : (info?.emailId && info.emailId !== '-') ? info.emailId
    : (info?.secretaryEmailId && info.secretaryEmailId !== '-') ? info.secretaryEmailId
    : (firstWing?.secretaryEmailId && firstWing.secretaryEmailId !== '-') ? firstWing.secretaryEmailId : '-';

  const managerName = (societyDetails?.managerName && societyDetails.managerName !== '-') ? societyDetails.managerName
    : (rawDto?.managerName && rawDto.managerName !== '-') ? String(rawDto.managerName)
    : (overview?.managerName && overview.managerName !== '-') ? String(overview.managerName)
    : (firstWing?.managerName && firstWing.managerName !== '-') ? String(firstWing.managerName) : '-';

  const managerNameEnglish = (societyDetails?.managerNameEnglish && societyDetails.managerNameEnglish !== '-') ? societyDetails.managerNameEnglish
    : (rawDto?.managerNameEnglish && rawDto.managerNameEnglish !== '-') ? String(rawDto.managerNameEnglish)
    : (overview?.managerNameEnglish && overview.managerNameEnglish !== '-') ? overview.managerNameEnglish
    : (firstWing?.managerNameEnglish && firstWing.managerNameEnglish !== '-') ? firstWing.managerNameEnglish : undefined;

  const rawMgrMobile =
    (societyDetails?.managerMobileNo && societyDetails.managerMobileNo !== '-') ? societyDetails.managerMobileNo
    : (info?.managerMobileNo && info.managerMobileNo !== '-') ? info.managerMobileNo
    : (rawOverview?.managerMobileNo && rawOverview.managerMobileNo !== '-') ? rawOverview.managerMobileNo
    : (firstWing?.managerMobileNo && firstWing.managerMobileNo !== '-') ? firstWing.managerMobileNo
    : (rawDto?.managerMobileNo && rawDto.managerMobileNo !== '-') ? rawDto.managerMobileNo : undefined;
  const managerMobileNo = formatPhone(rawMgrMobile);

  const managerEmail = (societyDetails?.managerEmailId && societyDetails.managerEmailId !== '-') ? societyDetails.managerEmailId
    : (info?.managerEmailId && info.managerEmailId !== '-') ? info.managerEmailId
    : (firstWing?.managerEmailId && firstWing.managerEmailId !== '-') ? firstWing.managerEmailId : '-';

  const builderName = (societyDetails?.builderName && societyDetails.builderName !== '-') ? societyDetails.builderName
    : (rawOverview?.builderName && rawOverview.builderName !== '-') ? String(rawOverview.builderName)
    : (overview?.builderName && overview.builderName !== '-') ? overview.builderName
    : (rawDto?.builderName && rawDto.builderName !== '-') ? String(rawDto.builderName)
    : (rawInfo?.builderName && rawInfo.builderName !== '-') ? String(rawInfo.builderName) : '-';

  const landOwnerName = (societyDetails?.landOwnerName && societyDetails.landOwnerName !== '-') ? societyDetails.landOwnerName
    : (rawOverview?.landOwnerName && rawOverview.landOwnerName !== '-') ? String(rawOverview.landOwnerName)
    : (rawDto?.landOwnerName && rawDto.landOwnerName !== '-') ? String(rawDto.landOwnerName)
    : (rawInfo?.landOwnerName && rawInfo.landOwnerName !== '-') ? String(rawInfo.landOwnerName)
    : (overview?.owner && overview.owner !== '-') ? overview.owner : '-';

  const societyEmail = (societyDetails?.societyEmailId && societyDetails.societyEmailId !== '-') ? societyDetails.societyEmailId
    : (rawDto?.societyEmailId && rawDto.societyEmailId !== '-') ? String(rawDto.societyEmailId)
    : (rawOverview?.societyEmailId && rawOverview.societyEmailId !== '-') ? String(rawOverview.societyEmailId)
    : (info?.emailId && info.emailId !== '-') ? info.emailId : undefined;

  const performance = {
    ...mapPerformanceSummary(addRev),
    gradeScore: perf?.propertyGrade?.score7,
    gradeLabel: perf?.propertyGrade?.letterGrade,
    gradeDescription: perf?.propertyGrade?.label,
    starRating: perf?.propertyGrade?.stars,
    healthScore: perf?.healthScore?.percent,
    healthStatus: perf?.healthScore?.label,
  };

  const rawSecWingIds = rawDto?.secretaryTargetWingDetailIds ?? rawOverview?.secretaryTargetWingDetailIds;
  const secretaryTargetWingDetailIds = Array.isArray(rawSecWingIds)
    ? rawSecWingIds.map(toPositiveNumberOrNull).filter((id): id is number => typeof id === 'number') : undefined;

  const rawMgrWingIds = rawDto?.managerTargetWingDetailIds ?? rawOverview?.managerTargetWingDetailIds;
  const managerTargetWingDetailIds = Array.isArray(rawMgrWingIds)
    ? rawMgrWingIds.map(toPositiveNumberOrNull).filter((id): id is number => typeof id === 'number') : undefined;

  const pinCode = (rawInfo?.pincode && rawInfo.pincode !== '-') ? String(rawInfo.pincode)
    : (rawInfo?.pinCode && rawInfo.pinCode !== '-') ? String(rawInfo.pinCode)
    : (rawDto?.pinCode && rawDto.pinCode !== '-') ? String(rawDto.pinCode) : undefined;

  const builderNameEnglish = (societyDetails?.builderNameEnglish && societyDetails.builderNameEnglish !== '-') ? societyDetails.builderNameEnglish
    : (rawDto?.builderNameEnglish && rawDto.builderNameEnglish !== '-') ? String(rawDto.builderNameEnglish)
    : ((rawDto?.builderEnglish && rawDto.builderEnglish !== '-') ? String(rawDto.builderEnglish) : undefined);

  const landOwnerNameEnglish = (societyDetails?.landOwnerNameEnglish && societyDetails.landOwnerNameEnglish !== '-') ? societyDetails.landOwnerNameEnglish
    : (rawDto?.landOwnerNameEnglish && rawDto.landOwnerNameEnglish !== '-') ? String(rawDto.landOwnerNameEnglish)
    : ((rawDto?.ownerNameEnglish && rawDto.ownerNameEnglish !== '-') ? String(rawDto.ownerNameEnglish) : undefined);

  const societyNameEnglish = (societyDetails?.societyNameEnglish && societyDetails.societyNameEnglish !== '-') ? societyDetails.societyNameEnglish
    : (rawDto?.societyNameEnglish && rawDto.societyNameEnglish !== '-') ? String(rawDto.societyNameEnglish) : undefined;

  const societyAddressEnglish = (societyDetails?.societyAddressEnglish && societyDetails.societyAddressEnglish !== '-') ? societyDetails.societyAddressEnglish
    : (rawDto?.societyAddressEnglish && rawDto.societyAddressEnglish !== '-') ? String(rawDto.societyAddressEnglish) : undefined;

  return {
    propertyNo, upic, societyName, ownerName, status, category, propertyDescriptionRegional, division,
    wardNo: (overview?.wardNo && overview.wardNo !== '-') ? String(overview.wardNo)
      : (overview?.wardName && overview.wardName !== '-') ? String(overview.wardName)
      : (info?.wardNo && info.wardNo !== '-') ? String(info.wardNo)
      : (info?.wardName && info.wardName !== '-') ? String(info.wardName)
      : (rawOverview?.wardNo && rawOverview.wardNo !== '-') ? String(rawOverview.wardNo)
      : (rawOverview?.wardName && rawOverview.wardName !== '-') ? String(rawOverview.wardName)
      : (rawInfo?.wardNo && rawInfo.wardNo !== '-') ? String(rawInfo.wardNo)
      : (rawInfo?.wardName && rawInfo.wardName !== '-') ? String(rawInfo.wardName)
      : (rawDto?.wardNo && rawDto.wardNo !== '-') ? String(rawDto.wardNo)
      : '-',
    taxZone,
    taxZoneAndName: (rawInfo?.taxZoneAndName && rawInfo.taxZoneAndName !== '-') ? String(rawInfo.taxZoneAndName) : (rawInfo?.taxZone && rawInfo?.taxZoneName && rawInfo.taxZone !== '-' && rawInfo.taxZoneName !== '-') ? `${rawInfo.taxZone} - ${rawInfo.taxZoneName}` : (rawInfo?.taxZoneNo && rawInfo?.taxZoneName) ? `${rawInfo.taxZoneNo} - ${rawInfo.taxZoneName}` : taxZone,
    surveyNo, subZoneCsnNo, plotNo, address, societyAddress: address, plotArea, carpetBuiltUpArea,
    carpetAreaFtMtr, builtUpAreaFtMtr,
    oldCarpetBuiltUp, oldCarpetAreaFtMtr, oldBuiltUpAreaFtMtr,
    totalFloors: (overview?.totalFloor && overview.totalFloor !== '-') ? String(overview.totalFloor)
      : (overview?.totalFloors && overview.totalFloors !== '-') ? String(overview.totalFloors)
      : (rawOverview?.totalFloor && rawOverview.totalFloor !== '-') ? String(rawOverview.totalFloor)
      : (rawOverview?.totalFloors && rawOverview.totalFloors !== '-') ? String(rawOverview.totalFloors)
      : (info?.totalFloor && info.totalFloor !== '-') ? String(info.totalFloor)
      : (info?.totalFloors && info.totalFloors !== '-') ? String(info.totalFloors)
      : (rawInfo?.totalFloor && rawInfo.totalFloor !== '-') ? String(rawInfo.totalFloor)
      : (rawInfo?.totalFloors && rawInfo.totalFloors !== '-') ? String(rawInfo.totalFloors)
      : (rawDto?.totalFloor && rawDto.totalFloor !== '-') ? String(rawDto.totalFloor)
      : (rawDto?.totalFloors && rawDto.totalFloors !== '-') ? String(rawDto.totalFloors)
      : '-',
    totalPropertiesResCommAmen: (overview?.propertyCounts && (overview.propertyCounts.residential != null || overview.propertyCounts.commercial != null || overview.propertyCounts.amenity != null))
      ? `Res:- ${overview.propertyCounts.residential ?? 0} / Comm:- ${overview.propertyCounts.commercial ?? 0} / Amen:- ${overview.propertyCounts.amenity ?? 0}`
      : (rawOverview?.propertyCounts && typeof rawOverview.propertyCounts === 'object')
      ? `Res:- ${(rawOverview.propertyCounts as Record<string, number>).residential ?? 0} / Comm:- ${(rawOverview.propertyCounts as Record<string, number>).commercial ?? 0} / Amen:- ${(rawOverview.propertyCounts as Record<string, number>).amenity ?? 0}`
      : (rawOverview?.totalProperties && rawOverview.totalProperties !== '-') ? String(rawOverview.totalProperties)
      : (rawOverview?.totalPropertiesResCommAmen && rawOverview.totalPropertiesResCommAmen !== '-') ? String(rawOverview.totalPropertiesResCommAmen)
      : (rawInfo?.totalProperties && rawInfo.totalProperties !== '-') ? String(rawInfo.totalProperties)
      : (rawDto?.totalProperties && rawDto.totalProperties !== '-') ? String(rawDto.totalProperties)
      : '-',
    moujaId: toPositiveNumberOrNull(rawInfo?.moujaId ?? rawOverview?.moujaId ?? rawDto?.moujaId),
    taxZoneId: toPositiveNumberOrNull(rawInfo?.taxZoneId ?? rawOverview?.taxZoneId ?? rawDto?.taxZoneId),
    categoryId: toPositiveNumberOrNull(rawOverview?.categoryId ?? rawInfo?.categoryId ?? rawDto?.categoryId),
    propertyTypeId: toPositiveNumberOrNull(rawOverview?.propertyTypeId ?? rawInfo?.propertyTypeId ?? rawDto?.propertyTypeId),
    ownerTypeId: toPositiveNumberOrNull(rawOverview?.ownerTypeId ?? rawInfo?.ownerTypeId ?? rawDto?.ownerTypeId),
    aadharNo: (rawInfo?.aadharNo && rawInfo.aadharNo !== '-') ? String(rawInfo.aadharNo) : (rawDto?.aadharNo && rawDto.aadharNo !== '-') ? String(rawDto.aadharNo) : undefined,
    alternateMobileNo: (rawInfo?.alternateMobileNo && rawInfo.alternateMobileNo !== '-') ? String(rawInfo.alternateMobileNo) : (rawDto?.alternateMobileNo && rawDto.alternateMobileNo !== '-') ? String(rawDto.alternateMobileNo) : undefined,
    pinCode, pincode: pinCode,
    occupierName: (rawOverview?.occupierName && rawOverview.occupierName !== '-') ? String(rawOverview.occupierName) : (rawDto?.occupierName && rawDto.occupierName !== '-') ? String(rawDto.occupierName) : builderName,
    occupierNameEnglish: (rawOverview?.occupierNameEnglish && rawOverview.occupierNameEnglish !== '-') ? String(rawOverview.occupierNameEnglish) : (rawDto?.occupierNameEnglish && rawDto.occupierNameEnglish !== '-') ? String(rawDto.occupierNameEnglish) : builderNameEnglish,
    ownerNameEnglish: landOwnerNameEnglish || ((rawOverview?.ownerNameEnglish && rawOverview.ownerNameEnglish !== '-') ? String(rawOverview.ownerNameEnglish) : (rawDto?.ownerNameEnglish && rawDto.ownerNameEnglish !== '-') ? String(rawDto.ownerNameEnglish) : undefined),
    secretaryTargetWingDetailIds, managerTargetWingDetailIds,
    secretaryName, secretaryNameEnglish, secretaryMobileNo, secretaryEmail,
    managerName, managerNameEnglish, managerMobileNo, managerEmail,
    builderName,
    builderNameEnglish,
    builderMobileNo: (rawDto?.builderMobileNo && rawDto.builderMobileNo !== '-') ? String(rawDto.builderMobileNo) : (rawInfo?.builderMobileNo && rawInfo.builderMobileNo !== '-') ? String(rawInfo.builderMobileNo) : (rawInfo?.mobileNo && rawInfo.mobileNo !== '-') ? String(rawInfo.mobileNo) : (rawDto?.mobileNo && rawDto.mobileNo !== '-') ? String(rawDto.mobileNo) : (rawOverview?.builderMobileNo && rawOverview.builderMobileNo !== '-') ? String(rawOverview.builderMobileNo) : undefined,
    mobileNo: (rawInfo?.mobileNo && rawInfo.mobileNo !== '-') ? String(rawInfo.mobileNo) : (rawDto?.mobileNo && rawDto.mobileNo !== '-') ? String(rawDto.mobileNo) : (rawInfo?.builderMobileNo && rawInfo.builderMobileNo !== '-') ? String(rawInfo.builderMobileNo) : (rawDto?.builderMobileNo && rawDto.builderMobileNo !== '-') ? String(rawDto.builderMobileNo) : undefined,
    landOwnerName,
    landOwnerNameEnglish,
    societyNameEnglish,
    societyAddressEnglish,
    societyEmail,
    societyBuildingPhotoGuid: overview?.societyBuildingPhotoGuid || undefined,
    imageUrl: overview?.societyBuildingPhotoGuid ? getViewDocumentUrl(overview.societyBuildingPhotoGuid) : undefined,
    wings: overview?.wings || [],
    totalWings: overview?.wings?.length || 0,
    latitude: (rawOverview?.latitude ?? rawInfo?.latitude ?? rawDto?.latitude ?? societyDetails?.latitude) as string | number | null | undefined,
    longitude: (rawOverview?.longitude ?? rawInfo?.longitude ?? rawDto?.longitude ?? societyDetails?.longitude) as string | number | null | undefined,
    performance,
  };
}
