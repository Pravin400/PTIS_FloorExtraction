/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';
import { CreateChildAssetRequest } from '@/types/asset/floor-details.types';

/** Maps the CreateChildAssetRequest DTO fields (basic-info + rent info +
 * room details) into the flat shape /ManageSubUnits/create expects. */
export function buildChildAssetApiPayload(data: CreateChildAssetRequest, userId: number | undefined): any {
  const normalizedRentInfo = data.rentInformation
    ? {
      ...data.rentInformation,
      leaseStart: data.rentInformation.leaseStart
        ? new Date(data.rentInformation.leaseStart).toISOString()
        : null,
      leaseEnd: data.rentInformation.leaseEnd
        ? new Date(data.rentInformation.leaseEnd).toISOString()
        : null,
      tenantName: (data.rentInformation as any)?.tenantName || data.renterName || null,
      tenantRegionalName: (data.rentInformation as any)?.tenantRegionalName || (data.rentInformation as any)?.renterNameLocal || data.renterNameLocal || (data as any).tenantRegionalName || null,
      TenantRegionalName: (data.rentInformation as any)?.tenantRegionalName || (data.rentInformation as any)?.renterNameLocal || data.renterNameLocal || (data as any).tenantRegionalName || null,
      renterNameLocal: (data.rentInformation as any)?.renterNameLocal || (data.rentInformation as any)?.tenantRegionalName || data.renterNameLocal || (data as any).tenantRegionalName || null,
      shopName: (data.rentInformation as any)?.shopName || data.shopUnitName || null,
      shopRegionalName: (data.rentInformation as any)?.shopRegionalName || data.shopUnitNameLocal || (data as any).unitNameLocal || null,
      ShopRegionalName: (data.rentInformation as any)?.shopRegionalName || data.shopUnitNameLocal || (data as any).unitNameLocal || null,
      tenantAddress: (data.rentInformation as any)?.tenantAddress || (data as any).tenantAddress || null,
    }
    : null;

  const apiPayload: any = {
    parentAssetId: data.parentAssetId,
    assetId: data.assetId || 0,
    floorDetailsId: data.floorDetailsId ?? null,
    floorId: data.floorId ?? data.floorDetailsId ?? null,
    subFloorId: data.subFloorId ?? null,
    constructionTypeId: data.constructionTypeId ?? null,
    typeOfUseId: data.typeOfUseId ?? null,
    subTypeOfUseId: data.subTypeOfUseId ?? null,
    carpetAreaSqMeter: data.carpetAreaSqMeter ?? null,
    carpetAreaSqFeet: data.carpetAreaSqFeet ?? null,
    builtupAreaSqMeter: data.builtupAreaSqMeter ?? null,
    builtupAreaSqFeet: data.builtupAreaSqFeet ?? null,
    departmentId: data.departmentId ?? null,
    complexName: data.complexName || null,
    renterName: data.renterName || null,
    renterNameLocal: data.renterNameLocal || (data as any).tenantRegionalName || null,
    tenantRegionalName: data.renterNameLocal || (data as any).tenantRegionalName || null,
    TenantRegionalName: data.renterNameLocal || (data as any).tenantRegionalName || null,
    RenterNameLocal: data.renterNameLocal || (data as any).tenantRegionalName || null,
    isRenter: data.isRenter !== undefined ? !!data.isRenter : false,
    isRented: data.isRenter !== undefined ? !!data.isRenter : false,
    propertyDescription: data.propertyDescription || null,
    shopUnitName: data.shopUnitName || null,
    shopUnitNameLocal: data.shopUnitNameLocal || (data as any).unitNameLocal || null,
    shopRegionalName: data.shopUnitNameLocal || (data as any).unitNameLocal || null,
    ShopRegionalName: data.shopUnitNameLocal || (data as any).unitNameLocal || null,
    ShopUnitNameLocal: data.shopUnitNameLocal || (data as any).unitNameLocal || null,
    unitNameLocal: data.shopUnitNameLocal || (data as any).unitNameLocal || null,
    zoneNo: data.zoneNo ?? null,
    unitNo: data.unitNo || null,
    wardNo: data.wardNo ?? null,
    propertyNo: data.propertyNo || null,
    partitionNo: data.partitionNo || null,
    mpmsNo: data.mpmsNo || null,
    pTaxId: (data as any).pTaxId || (data as any).PTaxId || null,
    PTaxId: (data as any).pTaxId || (data as any).PTaxId || null,
    upicId: data.upicId || null,
    assetWardNo: data.assetWardNo || null,
    mobileNo: data.mobileNo || null,
    surveyNo: data.surveyNo || null,
    emailId: data.emailId || null,
    gstNo: data.gstNo || null,
    totalAreaSqFt: data.totalAreaSqFt ?? null,
    aadhaarCardNo: data.aadhaarCardNo || null,
    panCardNo: data.panCardNo || null,
    createdBy: userId ?? data.createdBy ?? 1,
    constructionYear: data.constructionYear || String(new Date().getFullYear()),
    assessmentYear: data.assessmentYear || String(new Date().getFullYear()),
    isRoomWiseValuationActive: data.isRoomWiseValuationActive,
    floorConfiguration: data.floorConfiguration ? {
      unitAreaSqFt: data.floorConfiguration.unitAreaSqFt ?? null,
      calculatedCapitalValue: data.floorConfiguration.calculatedCapitalValue ?? null,
    } : null,
    rentInformation: normalizedRentInfo,
    leaseType: normalizedRentInfo?.leaseRentType || null,
    leaseRentType: normalizedRentInfo?.leaseRentType || null,
    leaseStartDate: normalizedRentInfo?.leaseStart || null,
    leaseEndDate: normalizedRentInfo?.leaseEnd || null,
    duration: normalizedRentInfo?.duration ?? null,
    paymentFrequency: normalizedRentInfo?.rentFrequency || null,
    rentFrequency: normalizedRentInfo?.rentFrequency || null,
    rentAmount: normalizedRentInfo?.rentAmount ?? null,
    securityDeposit: normalizedRentInfo?.securityDeposit ?? null,
    depositType: normalizedRentInfo?.depositType || null,
    tenantAddress: (data as any).tenantAddress || normalizedRentInfo?.tenantAddress || null,
    TenantAddress: (data as any).tenantAddress || normalizedRentInfo?.tenantAddress || null,
  };

  if (data.roomDetails) {
    apiPayload.roomDetails = data.roomDetails.map((r: any) => ({
      lengthMtr: r.lengthMtr ?? null,
      widthMtr: r.widthMtr ?? null,
      heightMtr: r.heightMtr ?? null,
      areaSqMtr: r.areaSqMtr ?? null,
      base1Mtr: r.base1Mtr ?? null,
      base2Mtr: r.base2Mtr ?? null,
      noOfRooms: r.noOfRooms ?? null,
      totalAreaSqMtr: r.totalAreaSqMtr ?? null,
      roomNo: r.roomNo || null,
      roomType: r.roomType || null,
      shape: r.shape || null,
      submissionType: r.submissionType || null,
      outerYesNo: !!r.outerYesNo,
      minusYesNo: !!(r.minusYesNo || (Array.isArray(r.offsets) && r.offsets.length > 0)),
      offsets: Array.isArray(r.offsets) ? r.offsets.map((off: any) => ({
        shape: off.shape || "Rectangle",
        length: off.length ?? null,
        width: off.width ?? null,
        height: off.height ?? null,
        base1: off.base1 ?? null,
        base2: off.base2 ?? null,
        radius: off.radius ?? null,
        areaSqM: off.areaSqM ?? null,
        op: off.op || "Subtract",
      })) : null
    }));
  }

  return apiPayload;
}
