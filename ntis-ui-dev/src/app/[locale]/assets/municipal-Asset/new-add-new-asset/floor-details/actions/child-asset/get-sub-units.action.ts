/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { manageSubUnitsService } from '@/lib/api/asset/municipal-Asset/new-add-new-asset/manage-subunits.service';
import { floorLookupService } from '@/lib/api/asset/municipal-Asset/new-add-new-asset/floor-lookup.service';
import { logger } from '@/lib/utils/logger';
import { ActionResult } from '@/types/common.types';
import { isRedirectError } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/shared.utils';

/**
 * Server action to retrieve all subunits under a parent building,
 * including both child-asset subunits (from Unit Pool) and direct
 * Floor Submissions (saved directly to AMS.SubUnitsDetails without child AssetMaster),
 * and pre-populate their Renter / Tenant Details from AMS.AssetLeaseRentDetails.
 */
export async function getSubUnitsByAssetAction(
  parentAssetId: number,
  _fetchFullDetails: boolean = true
): Promise<ActionResult<any[]>> {
  try {
    // ── Fetch child-asset subunits, direct floor submissions, and lease/rent details in parallel ──
    const [completeRes, directRes, leaseRes] = await Promise.all([
      manageSubUnitsService.getCompleteDetailsByParentId(parentAssetId).catch((e) => {
        logger.warn(`[getSubUnitsByAssetAction] complete-details failed: ${e?.message}`);
        return { success: false, data: [] } as any;
      }),
      manageSubUnitsService.getFloorSubmissionsByParent(parentAssetId).catch((e) => {
        logger.warn(`[getSubUnitsByAssetAction] getFloorSubmissionsByParent failed: ${e?.message}`);
        return { success: false, data: [] } as any;
      }),
      floorLookupService.getAssetLeaseRentDetails(parentAssetId).then((items) => ({ success: true, data: items })).catch((e) => {
        logger.warn(`[getSubUnitsByAssetAction] fetch lease rent details failed: ${e?.message}`);
        return { success: false, data: [] } as any;
      }),
    ]);

    const rawList = completeRes.success && Array.isArray(completeRes.data) ? completeRes.data : [];
    const directList = directRes.success && Array.isArray(directRes.data) ? directRes.data : [];
    const rawLeaseList: any[] =
      leaseRes.success && leaseRes.data
        ? (leaseRes.data.items ?? leaseRes.data.data ?? (Array.isArray(leaseRes.data) ? leaseRes.data : []))
        : [];

    logger.info(
      `[getSubUnitsByAssetAction] parentAssetId=${parentAssetId}: found ${rawList.length} child subunits, ${directList.length} direct floor submissions, and ${rawLeaseList.length} lease/rent records.`
    );

    if (rawList.length === 0 && directList.length === 0) {
      return { success: true, data: [] };
    }

    // Map each complete subunit detail to the expected frontend shape
    const detailedSubUnits = rawList.map((item: any) => {
      const rawSubUnitsDetailsId = item.subUnitsDetailsId ?? item.SubUnitsDetailsId ?? item.id ?? item.Id;
      const rawAssetId = item.assetId ?? item.AssetId ?? item.subUnitAssetId ?? item.childAssetId ?? item.id ?? item.Id;
      const subId = Number(rawAssetId || rawSubUnitsDetailsId || 0);
      const firstFloor = item.floorDetails?.[0] || item.FloorDetails?.[0] || {};
      const fId = firstFloor.id ?? firstFloor.Id ?? null;

      const matchedRenterDetails =
        (Array.isArray(item.leaseRentDetails) && item.leaseRentDetails.length > 0)
          ? item.leaseRentDetails
          : (Array.isArray(item.LeaseRentDetails) && item.LeaseRentDetails.length > 0)
          ? item.LeaseRentDetails
          : (Array.isArray(item.renterDetails) && item.renterDetails.length > 0)
          ? item.renterDetails
          : (Array.isArray(item.RenterDetails) && item.RenterDetails.length > 0)
          ? item.RenterDetails
          : rawLeaseList.filter((l: any) => {
              const lSubUnitId = Number(l.subUnitDetailsId ?? l.SubUnitDetailsId ?? 0);
              const lAssetId = Number(l.assetId ?? l.AssetId ?? 0);
              return (subId && (lSubUnitId === subId || lAssetId === subId)) ||
                     (rawSubUnitsDetailsId && lSubUnitId === Number(rawSubUnitsDetailsId));
            });
      const firstLease = matchedRenterDetails[0] || {};
      const rentInfo = item.rentInformation || {};

      const rooms = (item.roomWiseDetails || item.RoomWiseDetails || []).map((room: any) => {
        const rawOffsets =
          room.minusDetails || room.MinusDetails || room.offsets || room.Offsets || [];
        const offsets = rawOffsets.map((off: any) => ({
          id: String(off.id ?? off.Id ?? ''),
          shape: off.shape || off.Shape || 'Rectangle',
          length: Number(off.length ?? off.Length ?? off.lengthMtr ?? off.LengthMtr ?? 0),
          width: Number(off.width ?? off.Width ?? off.widthMtr ?? off.WidthMtr ?? 0),
          height: Number(off.height ?? off.Height ?? off.heightMtr ?? off.HeightMtr ?? 0),
          base1: Number(off.base1 ?? off.Base1 ?? off.base1Mtr ?? off.Base1Mtr ?? 0),
          base2: Number(off.base2 ?? off.Base2 ?? off.base2Mtr ?? off.Base2Mtr ?? 0),
          radius: Number(off.radius ?? off.Radius ?? off.radiusMtr ?? off.RadiusMtr ?? 0),
          area: Number(off.area ?? off.Area ?? off.areaSqMtr ?? off.AreaSqMtr ?? 0),
          calculatedOffsetArea: Number(
            off.calculatedOffsetArea ??
              off.CalculatedOffsetArea ??
              off.areaSqMtr ??
              off.AreaSqMtr ??
              0
          ),
        }));

        return {
          id: room.id ?? room.Id,
          assetId: room.assetId ?? room.AssetId,
          floorDetailsId:
            room.floorDetailsId ??
            room.FloorDetailsId ??
            room.subUnitsDetailsId ??
            room.SubUnitsDetailsId,
          roomNo: room.roomNo ?? room.RoomNo,
          roomType: room.roomType ?? room.RoomType,
          shape: room.shape ?? room.Shape,
          lengthMtr: room.lengthMtr ?? room.LengthMtr,
          widthMtr: room.widthMtr ?? room.WidthMtr,
          heightMtr: room.heightMtr ?? room.HeightMtr,
          areaSqMtr: room.areaSqMtr ?? room.AreaSqMtr,
          totalAreaSqMtr: room.totalAreaSqMtr ?? room.TotalAreaSqMtr,
          outerYesNo: room.outerYesNo ?? room.OuterYesNo,
          minusYesNo: room.minusYesNo ?? room.MinusYesNo,
          isActive: room.isActive ?? room.IsActive,
          offsets,
        };
      });

      return {
        id: subId,
        assetId: subId,
        dbId: subId,
        subUnitsDetailsId: Number(rawSubUnitsDetailsId || 0),
        isDirectFloorSubmission: false,
        assetNo: item.assetNo ?? item.AssetNo ?? '',
        assetName: item.assetName ?? item.AssetName ?? '',
        parentAssetId: item.parentAssetId ?? item.ParentAssetId,
        occupancyStatus: item.occupancyStatus ?? item.OccupancyStatus,
        isActive: item.isActive ?? item.IsActive,
        departmentId: item.departmentId ?? item.DepartmentId ?? null,
        propertyNo: item.propertyNo ?? item.PropertyNo ?? item.details?.propertyNo ?? '',
        unitNo: item.unitNo ?? item.UnitNo ?? item.details?.unitNo ?? item.assetNo ?? item.AssetNo ?? '',
        partitionNo: item.partitionNo ?? item.PartitionNo ?? item.details?.partitionNo ?? '',
        mpmsNo: item.mpmsNo ?? item.MpmsNo ?? item.MPMSNo ?? item.details?.mpmsNo ?? item.details?.MpmsNo ?? item.details?.MPMSNo ?? '',
        pTaxId: item.pTaxId ?? item.PTaxId ?? item.details?.pTaxId ?? item.details?.PTaxId ?? '',
        PTaxId: item.pTaxId ?? item.PTaxId ?? item.details?.pTaxId ?? item.details?.PTaxId ?? '',
        unitType: item.unitType ?? item.UnitType ?? '',
        shopUnitName: item.shopUnitName ?? item.ShopUnitName ?? item.details?.shopUnitName ?? item.details?.ShopUnitName ?? firstLease.shopName ?? firstLease.ShopName ?? item.shopName ?? '',
        shopUnitNameLocal: item.shopUnitNameLocal ?? item.ShopUnitNameLocal ?? item.details?.shopUnitNameLocal ?? item.details?.ShopUnitNameLocal ?? item.shopRegionalName ?? item.ShopRegionalName ?? firstLease.shopRegionalName ?? firstLease.ShopRegionalName ?? firstLease.shopUnitNameLocal ?? '',
        unitName: item.shopUnitName ?? item.ShopUnitName ?? item.details?.shopUnitName ?? item.details?.ShopUnitName ?? item.unitName ?? item.UnitName ?? firstLease.shopName ?? firstLease.ShopName ?? item.shopName ?? '',
        unitNameLocal: item.shopUnitNameLocal ?? item.ShopUnitNameLocal ?? item.details?.shopUnitNameLocal ?? item.details?.ShopUnitNameLocal ?? item.unitNameLocal ?? item.UnitNameLocal ?? item.shopRegionalName ?? item.ShopRegionalName ?? firstLease.shopRegionalName ?? firstLease.ShopRegionalName ?? firstLease.shopUnitNameLocal ?? '',
        floorDetailsId: fId ? Number(fId) : null,
        details: {
          ...(item.details || {}),
          shopUnitName: item.shopUnitName ?? item.ShopUnitName ?? item.details?.shopUnitName ?? item.details?.ShopUnitName ?? firstLease.shopName ?? firstLease.ShopName ?? item.shopName ?? '',
          shopUnitNameLocal: item.shopUnitNameLocal ?? item.ShopUnitNameLocal ?? item.details?.shopUnitNameLocal ?? item.details?.ShopUnitNameLocal ?? item.shopRegionalName ?? item.ShopRegionalName ?? firstLease.shopRegionalName ?? firstLease.ShopRegionalName ?? firstLease.shopUnitNameLocal ?? '',
          partitionNo: item.partitionNo ?? item.PartitionNo ?? item.details?.partitionNo ?? '',
          mpmsNo: item.mpmsNo ?? item.MpmsNo ?? item.MPMSNo ?? item.details?.mpmsNo ?? item.details?.MpmsNo ?? item.details?.MPMSNo ?? '',
          pTaxId: item.pTaxId ?? item.PTaxId ?? item.details?.pTaxId ?? item.details?.PTaxId ?? '',
          PTaxId: item.pTaxId ?? item.PTaxId ?? item.details?.pTaxId ?? item.details?.PTaxId ?? '',
        },

        // Expose normalized room properties under all expected keys
        roomWiseSubmissions: rooms,
        roomWiseDetails: rooms,
        roomDetails: rooms,

        // Floor / Area details mapped from the first floor detail entry
        totalAreaSqFt:
          firstFloor.carpetAreaSqFeet ??
          firstFloor.CarpetAreaSqFeet ??
          firstFloor.carpetAreaSqFt ??
          firstFloor.CarpetAreaSqFt ??
          null,
        carpetAreaSqFeet: firstFloor.carpetAreaSqFeet ?? firstFloor.CarpetAreaSqFeet ?? null,
        carpetAreaSqMeter: firstFloor.carpetAreaSqMeter ?? firstFloor.CarpetAreaSqMeter ?? null,
        builtUpAreaSqFeet:
          firstFloor.builtupAreaSqFeet ??
          firstFloor.BuiltupAreaSqFeet ??
          firstFloor.builtUpAreaSqFeet ??
          firstFloor.BuiltUpAreaSqFeet ??
          null,
        builtUpAreaSqMeter:
          firstFloor.builtupAreaSqMeter ??
          firstFloor.BuiltupAreaSqMeter ??
          firstFloor.builtUpAreaSqMeter ??
          firstFloor.BuiltUpAreaSqMeter ??
          null,
        floorId: firstFloor.floorId ?? firstFloor.FloorId ?? null,
        subFloorId: firstFloor.subFloorId ?? firstFloor.SubFloorId ?? null,
        constructionTypeId: firstFloor.constructionTypeId ?? firstFloor.ConstructionTypeId ?? null,
        typeOfUseId: firstFloor.typeOfUseId ?? firstFloor.TypeOfUseId ?? null,
        subTypeOfUseId: firstFloor.subTypeOfUseId ?? firstFloor.SubTypeOfUseId ?? null,
        constructionYear: firstFloor.constructionYear ?? firstFloor.ConstructionYear ?? null,
        assessmentYear: firstFloor.assessmentYear ?? firstFloor.AssessmentYear ?? null,
        isRented: firstFloor.isRented ?? firstFloor.IsRented ?? null,

        // NOTE: ASP.NET Core camelCases first char only: CVFloorFactor → cVFloorFactor
        cvBaseRate: firstFloor.cVBaseRate ?? firstFloor.cvBaseRate ?? firstFloor.CvBaseRate ?? firstFloor.CVBaseRate ?? null,
        baseValue: firstFloor.baseValue ?? firstFloor.BaseValue ?? null,
        cvFloorFactor: firstFloor.cVFloorFactor ?? firstFloor.cvFloorFactor ?? firstFloor.CvFloorFactor ?? firstFloor.CVFloorFactor ?? null,
        cvAgeFactor: firstFloor.cVAgeFactor ?? firstFloor.cvAgeFactor ?? firstFloor.CvAgeFactor ?? firstFloor.CVAgeFactor ?? null,
        cvNatureFactor: firstFloor.cVNatureFactor ?? firstFloor.cvNatureFactor ?? firstFloor.CvNatureFactor ?? firstFloor.CVNatureFactor ?? null,
        cvUseFactor: firstFloor.cVUseFactor ?? firstFloor.cvUseFactor ?? firstFloor.CvUseFactor ?? firstFloor.CVUseFactor ?? null,
        capitalValue: firstFloor.capitalValue ?? firstFloor.CapitalValue ?? null,

        // Display names
        floorName: firstFloor.floorName ?? firstFloor.FloorName ?? null,
        subFloorName: firstFloor.subFloorName ?? firstFloor.SubFloorName ?? null,
        constructionTypeName:
          firstFloor.constructionTypeName ?? firstFloor.ConstructionTypeName ?? null,
        typeOfUseName: firstFloor.typeOfUseName ?? firstFloor.TypeOfUseName ?? null,
        subTypeOfUseName: firstFloor.subTypeOfUseName ?? firstFloor.SubTypeOfUseName ?? null,

        // Renter / Lease details
        renterName: firstLease.tenantName || firstLease.TenantName || firstLease.renterName || item.renterName || '',
        renterNameEnglish: firstLease.tenantName || firstLease.TenantName || firstLease.renterName || item.renterName || item.renterNameEnglish || '',
        renterNameLocal: firstLease.tenantRegionalName || firstLease.TenantRegionalName || firstLease.renterNameLocal || firstLease.RenterNameLocal || firstLease.tenantNameLocal || firstLease.TenantNameLocal || item.renterNameLocal || item.tenantRegionalName || '',
        shopName: firstLease.shopName || firstLease.ShopName || item.shopName || item.shopUnitName || '',
        shopRegionalName: firstLease.shopRegionalName || firstLease.ShopRegionalName || item.shopRegionalName || item.shopUnitNameLocal || '',
        tenantAddress: firstLease.tenantAddress || firstLease.TenantAddress || item.tenantAddress || rentInfo?.tenantAddress || '',
        mobileNo: firstLease.tenantMobile || firstLease.TenantMobile || firstLease.mobileNo || item.mobileNo || '',
        emailId: firstLease.tenantEmail || firstLease.TenantEmail || firstLease.emailId || item.emailId || '',
        aadhaar: firstLease.tenantAadhaarNo || firstLease.TenantAadhaarNo || firstLease.aadhaar || item.aadhaarCardNo || '',
        pan: firstLease.tenantPanCardNo || firstLease.TenantPanCardNo || firstLease.pan || item.panCardNo || '',
        agreementId: firstLease.agreementId || firstLease.AgreementId || firstLease.agreementNo || firstLease.AgreementNo || item.agreementId || rentInfo?.agreementId || '',
        agreementNo: firstLease.agreementNo || firstLease.AgreementNo || firstLease.agreementId || firstLease.AgreementId || item.agreementNo || rentInfo?.agreementNo || '',
        agreementDate: firstLease.agreementDate || firstLease.AgreementDate || '',
        agreementFromDate: firstLease.leaseStartDate || firstLease.LeaseStartDate || firstLease.fromDate || rentInfo?.leaseStart || '',
        agreementToDate: firstLease.leaseEndDate || firstLease.LeaseEndDate || firstLease.toDate || rentInfo?.leaseEnd || '',
        rentMonthly: firstLease.rentAmount || firstLease.RentAmount || firstLease.monthlyRent || rentInfo?.rentAmount || '',
        rentYearly: firstLease.rentYearly || rentInfo?.rentYearly || '',
        rentType: firstLease.leaseType || firstLease.LeaseType || rentInfo?.leaseRentType || '',
        duration: firstLease.duration || firstLease.Duration || rentInfo?.duration || '',
        rentFreq: firstLease.paymentFrequency || firstLease.PaymentFrequency || rentInfo?.rentFrequency || 'Monthly',
        securityDeposit: firstLease.securityDeposit || firstLease.SecurityDeposit || rentInfo?.securityDeposit || '',
        depositType: firstLease.depositType || firstLease.DepositType || rentInfo?.depositType || 'Refundable',

        renterDetails: matchedRenterDetails,

        // Dynamic field values
        fieldValues: [],
      };
    });

    // Map direct floor submissions (SubUnitsDetails rows where AssetId = parentAssetId)
    const detailedDirectSubUnits = directList.map((item: any) => {
      const subUnitsDetailsId = Number(item.subUnitsDetailsId ?? item.SubUnitsDetailsId ?? item.id ?? 0);
      const rooms = (item.roomWiseDetails || item.RoomWiseDetails || []).map((room: any) => {
        const rawOffsets =
          room.minusDetails || room.MinusDetails || room.offsets || room.Offsets || [];
        const offsets = rawOffsets.map((off: any) => ({
          id: String(off.id ?? off.Id ?? ''),
          shape: off.shape || off.Shape || 'Rectangle',
          length: Number(off.length ?? off.Length ?? off.lengthMtr ?? off.LengthMtr ?? 0),
          width: Number(off.width ?? off.Width ?? off.widthMtr ?? off.WidthMtr ?? 0),
          height: Number(off.height ?? off.Height ?? off.heightMtr ?? off.HeightMtr ?? 0),
          base1: Number(off.base1 ?? off.Base1 ?? off.base1Mtr ?? off.Base1Mtr ?? 0),
          base2: Number(off.base2 ?? off.Base2 ?? off.base2Mtr ?? off.Base2Mtr ?? 0),
          radius: Number(off.radius ?? off.Radius ?? off.radiusMtr ?? off.RadiusMtr ?? 0),
          area: Number(off.area ?? off.Area ?? off.areaSqMtr ?? off.AreaSqMtr ?? 0),
          calculatedOffsetArea: Number(
            off.calculatedOffsetArea ??
              off.CalculatedOffsetArea ??
              off.areaSqMtr ??
              off.AreaSqMtr ??
              0
          ),
        }));

        return {
          id: room.id ?? room.Id,
          assetId: item.assetId ?? parentAssetId,
          floorDetailsId: subUnitsDetailsId,
          roomNo: room.roomNo ?? room.RoomNo,
          roomType: room.roomType ?? room.RoomType,
          shape: room.shape ?? room.Shape,
          lengthMtr: room.lengthMtr ?? room.LengthMtr,
          widthMtr: room.widthMtr ?? room.WidthMtr,
          heightMtr: room.heightMtr ?? room.HeightMtr,
          areaSqMtr: room.areaSqMtr ?? room.AreaSqMtr,
          totalAreaSqMtr: room.totalAreaSqMtr ?? room.TotalAreaSqMtr,
          outerYesNo: room.outerYesNo ?? room.OuterYesNo,
          minusYesNo: room.minusYesNo ?? room.MinusYesNo,
          isActive: room.isActive ?? room.IsActive,
          offsets,
        };
      });

      const determinedUnitType =
        item.constructionTypeId === 11 ? 'Open Space' : 'Floor';

      // Match lease rows from AMS.AssetLeaseRentDetails for this direct floor submission
      const directMatchingLeases = rawLeaseList.filter((l: any) => {
        const lSubUnitId = Number(l.subUnitDetailsId ?? l.SubUnitDetailsId ?? 0);
        const lFloorId = Number(l.floorDetailsId ?? l.FloorDetailsId ?? 0);
        const lAssetId = Number(l.assetId ?? l.AssetId ?? 0);
        if (subUnitsDetailsId && (lSubUnitId === subUnitsDetailsId || lFloorId === subUnitsDetailsId || lAssetId === subUnitsDetailsId)) return true;
        // If there is only one direct floor submission and only one lease row for this parent asset
        if (directList.length === 1 && rawLeaseList.length === 1) return true;
        return false;
      });

      const directRenterDetails =
        directMatchingLeases.length > 0
          ? directMatchingLeases
          : (item.leaseRentDetails ??
             item.LeaseRentDetails ??
             item.renterDetails ??
             item.RenterDetails ??
             item.renterDetailsList ??
             item.RenterDetailsList ??
             []);

      const firstLease = directRenterDetails[0] || {};
      const rentInfo = item.rentInformation || {};
      const isRented = !!(
        item.isRented ??
        item.IsRented ??
        item.isRenter ??
        (directRenterDetails.length > 0 || Boolean(firstLease.tenantName) || Boolean(item.renterName))
      );

      return {
        id: subUnitsDetailsId,
        assetId: subUnitsDetailsId,
        dbId: subUnitsDetailsId,
        subUnitsDetailsId,
        isDirectFloorSubmission: true,
        assetNo: '',
        assetName: item.floorName || 'Floor',
        parentAssetId: item.assetId ?? parentAssetId,
        occupancyStatus: item.occupancyStatus ?? 'Active',
        isActive: item.isActive ?? true,
        departmentId: null,
        propertyNo: '',
        unitNo: item.unitNo ?? '',
        partitionNo: item.partitionNo ?? item.PartitionNo ?? '',
        mpmsNo: item.mpmsNo ?? item.MpmsNo ?? '',
        pTaxId: item.pTaxId ?? item.PTaxId ?? '',
        PTaxId: item.pTaxId ?? item.PTaxId ?? '',
        unitType: determinedUnitType,
        shopUnitName: item.shopUnitName ?? item.ShopUnitName ?? '',
        shopUnitNameLocal: item.shopUnitNameLocal ?? item.ShopUnitNameLocal ?? '',
        unitName: item.shopUnitName ?? item.ShopUnitName ?? item.floorName ?? '',
        unitNameLocal: item.shopUnitNameLocal ?? item.ShopUnitNameLocal ?? '',
        floorDetailsId: subUnitsDetailsId,

        roomWiseSubmissions: rooms,
        roomWiseDetails: rooms,
        roomDetails: rooms,

        totalAreaSqFt: item.carpetAreaSqFeet ?? null,
        carpetAreaSqFeet: item.carpetAreaSqFeet ?? null,
        carpetAreaSqMeter: item.carpetAreaSqMeter ?? null,
        builtUpAreaSqFeet: item.builtupAreaSqFeet ?? null,
        builtUpAreaSqMeter: item.builtupAreaSqMeter ?? null,
        floorId: item.floorId ?? null,
        subFloorId: item.subFloorId ?? null,
        constructionTypeId: item.constructionTypeId ?? null,
        typeOfUseId: item.typeOfUseId ?? null,
        subTypeOfUseId: item.subTypeOfUseId ?? null,
        constructionYear: item.constructionYear ?? null,
        assessmentYear: item.assessmentYear ?? null,
        isRented,

        // NOTE: ASP.NET Core default JSON serialiser camelCases only the first char per token:
        // C# CVFloorFactor → JSON cVFloorFactor (NOT cvFloorFactor).
        cvBaseRate: item.cVBaseRate ?? item.cvBaseRate ?? item.CVBaseRate ?? null,
        baseValue: item.baseValue ?? item.BaseValue ?? null,
        cvFloorFactor: item.cVFloorFactor ?? item.cvFloorFactor ?? item.CVFloorFactor ?? null,
        cvAgeFactor: item.cVAgeFactor ?? item.cvAgeFactor ?? item.CVAgeFactor ?? null,
        cvNatureFactor: item.cVNatureFactor ?? item.cvNatureFactor ?? item.CVNatureFactor ?? null,
        cvUseFactor: item.cVUseFactor ?? item.cvUseFactor ?? item.CVUseFactor ?? null,
        capitalValue: item.capitalValue ?? item.CapitalValue ?? null,

        floorName: item.floorName ?? null,
        subFloorName: item.subFloorName ?? null,
        constructionTypeName: item.constructionTypeName ?? null,
        typeOfUseName: item.typeOfUseName ?? null,
        subTypeOfUseName: item.subTypeOfUseName ?? null,

        // Renter / Tenant Details
        renterName: firstLease.tenantName || firstLease.TenantName || firstLease.renterName || item.renterName || '',
        renterNameEnglish: firstLease.tenantName || firstLease.TenantName || firstLease.renterName || item.renterName || item.renterNameEnglish || '',
        renterNameLocal: firstLease.tenantRegionalName || firstLease.TenantRegionalName || firstLease.renterNameLocal || item.renterNameLocal || '',
        shopName: firstLease.shopName || firstLease.ShopName || item.shopName || item.shopUnitName || '',
        shopRegionalName: firstLease.shopRegionalName || firstLease.ShopRegionalName || item.shopRegionalName || item.shopUnitNameLocal || '',
        tenantAddress: firstLease.tenantAddress || firstLease.TenantAddress || item.tenantAddress || rentInfo?.tenantAddress || '',
        mobileNo: firstLease.tenantMobile || firstLease.TenantMobile || firstLease.mobileNo || item.mobileNo || '',
        emailId: firstLease.tenantEmail || firstLease.TenantEmail || firstLease.emailId || item.emailId || '',
        aadhaar: firstLease.tenantAadhaarNo || firstLease.TenantAadhaarNo || firstLease.aadhaar || item.aadhaarCardNo || '',
        pan: firstLease.tenantPanCardNo || firstLease.TenantPanCardNo || firstLease.pan || item.panCardNo || '',
        agreementId: firstLease.agreementId || firstLease.AgreementId || firstLease.agreementNo || firstLease.AgreementNo || item.agreementId || rentInfo?.agreementId || '',
        agreementNo: firstLease.agreementNo || firstLease.AgreementNo || firstLease.agreementId || firstLease.AgreementId || item.agreementNo || rentInfo?.agreementNo || '',
        agreementDate: firstLease.agreementDate || firstLease.AgreementDate || '',
        agreementFromDate: firstLease.leaseStartDate || firstLease.LeaseStartDate || firstLease.fromDate || rentInfo?.leaseStart || '',
        agreementToDate: firstLease.leaseEndDate || firstLease.LeaseEndDate || firstLease.toDate || rentInfo?.leaseEnd || '',
        rentMonthly: firstLease.rentAmount || firstLease.RentAmount || firstLease.monthlyRent || rentInfo?.rentAmount || '',
        rentYearly: firstLease.rentYearly || rentInfo?.rentYearly || '',
        rentType: firstLease.leaseType || firstLease.LeaseType || rentInfo?.leaseRentType || '',
        duration: firstLease.duration || firstLease.Duration || rentInfo?.duration || '',
        rentFreq: firstLease.paymentFrequency || firstLease.PaymentFrequency || rentInfo?.rentFrequency || 'Monthly',
        securityDeposit: firstLease.securityDeposit || firstLease.SecurityDeposit || rentInfo?.securityDeposit || '',
        depositType: firstLease.depositType || firstLease.DepositType || rentInfo?.depositType || 'Refundable',

        renterDetails: directRenterDetails,
        fieldValues: [],
      };
    });

    return { success: true, data: [...detailedSubUnits, ...detailedDirectSubUnits] };
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    logger.error('getSubUnitsByAssetAction Error:', { error: err });
    return { success: false, error: 'Network error fetching subunits: ' + err.message };
  }
}
