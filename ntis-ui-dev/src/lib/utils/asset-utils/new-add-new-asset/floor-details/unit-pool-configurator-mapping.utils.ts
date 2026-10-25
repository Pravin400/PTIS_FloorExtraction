/* eslint-disable @typescript-eslint/no-explicit-any */
// Maps an active PoolUnit into the shape SubUnitDetailedConfigurator expects as `unit`.
export function buildConfiguratorUnit(activeUnit: any): any {
  const renterObj = Array.isArray(activeUnit.renterDetails)
    ? (activeUnit.renterDetails[0] || {})
    : (activeUnit.renterDetails || {});
  // Destructure 'rooms' out of renterDetails so it cannot override activeUnit.rooms
  const { rooms: _rdRooms, ...renterRest } = renterObj;
  void _rdRooms; // intentionally unused — we always use activeUnit.rooms
  return {
    ...activeUnit,
    ...renterRest,
    // Explicit ID mapping to ensure media and details can always resolve the correct asset/subunit ID
    assetId: Number(activeUnit.assetId ?? activeUnit.AssetId ?? activeUnit.dbId ?? activeUnit.id ?? 0),
    dbId: Number(activeUnit.dbId ?? activeUnit.assetId ?? activeUnit.AssetId ?? activeUnit.id ?? 0),
    id: Number(activeUnit.id ?? activeUnit.assetId ?? activeUnit.AssetId ?? activeUnit.dbId ?? 0),
    subUnitsDetailsId: Number(activeUnit.subUnitsDetailsId ?? activeUnit.SubUnitsDetailsId ?? 0) || null,
    // These always win — set explicitly after the renterDetails spread
    unitNumber: activeUnit.unitNumber,
    unitType: activeUnit.unitType,
    carpetAreaSqFeet: activeUnit.carpetAreaSqFt,
    rooms: activeUnit.rooms, // ← authoritative room list from pool
    floorId: activeUnit.selectedFloorId,
    floorDetailsId: activeUnit.floorDetailsId,
    subFloorId: activeUnit.subFloorId,
    departmentId: activeUnit.departmentId,
    locationAddress: activeUnit.locationAddress,
    locationLat: activeUnit.locationLat,
    locationLng: activeUnit.locationLng,
    conYear: activeUnit.conYear,
    conType: activeUnit.conType,
    useType: activeUnit.useType,
    subUseType: activeUnit.subUseType,
    photoFile: activeUnit.photoFile,
    planFile: activeUnit.planFile,
    // ── Top-level renter identity fields ──────────────────────
    renterName: activeUnit.renterName || renterRest.renterName || renterRest.tenantName || renterObj.tenantName || renterObj.TenantName || null,
    renterNameLocal:
      activeUnit.renterNameLocal ||
      activeUnit.tenantRegionalName ||
      activeUnit.TenantRegionalName ||
      renterRest.renterNameLocal ||
      renterRest.tenantRegionalName ||
      renterRest.TenantRegionalName ||
      renterRest.tenantNameLocal ||
      renterObj.tenantRegionalName ||
      renterObj.TenantRegionalName ||
      renterObj.renterNameLocal ||
      null,
    tenantAddress:
      activeUnit.tenantAddress ||
      activeUnit.TenantAddress ||
      renterRest.tenantAddress ||
      renterRest.TenantAddress ||
      renterObj.tenantAddress ||
      renterObj.TenantAddress ||
      (activeUnit as any).rentInformation?.tenantAddress ||
      (activeUnit as any).rentInformation?.TenantAddress ||
      null,
    shopName:
      (activeUnit as any).shopName ||
      (activeUnit as any).ShopName ||
      (activeUnit as any).shopUnitName ||
      (activeUnit as any).unitName ||
      renterRest.shopName ||
      renterRest.ShopName ||
      renterRest.shopUnitName ||
      null,
    shopRegionalName:
      (activeUnit as any).shopRegionalName ||
      (activeUnit as any).ShopRegionalName ||
      (activeUnit as any).shopUnitNameLocal ||
      (activeUnit as any).unitNameLocal ||
      renterRest.shopRegionalName ||
      renterRest.ShopRegionalName ||
      renterRest.shopUnitNameLocal ||
      null,
    mobileNo: activeUnit.mobileNo || renterRest.mobileNo || renterRest.tenantMobile || null,
    emailId: activeUnit.emailId || renterRest.emailId || renterRest.tenantEmail || null,
    gstNo: activeUnit.gstNo || renterRest.gstNo || renterRest.gSTNo || null,
    // Aadhaar/PAN: top-level uses aadhaarCardNo/panCardNo, configurator uses aadhaar/pan
    aadhaar: activeUnit.aadhaarCardNo || renterRest.aadhaar || renterRest.tenantAadhaarNo || null,
    pan: activeUnit.panCardNo || renterRest.pan || renterRest.tenantPanCardNo || null,
    // ── Property registration numbers ─────────────────────────
    propertyNo: (activeUnit as any).propertyNo || renterRest.propertyNo || null,
    unitNo: (activeUnit as any).unitNo || renterRest.unitNo || null,
    surveyNo: (activeUnit as any).surveyNo || renterRest.surveyNo || null,
    partitionNo: (activeUnit as any).partitionNo || renterRest.partitionNo || null,
    mpmsNo: (activeUnit as any).mpmsNo || (activeUnit as any).MPMSNo || renterRest.mpmsNo || null,
    propertyDescription: activeUnit.propertyDescription || renterRest.propertyDescription || null,
    unitName:
      (activeUnit as any).unitName ||
      (activeUnit as any).shopUnitName ||
      (activeUnit as any).shopName ||
      (activeUnit as any).ShopName ||
      (activeUnit as any).rentInformation?.shopName ||
      renterRest.unitName ||
      renterRest.shopName ||
      renterRest.ShopName ||
      renterRest.shopUnitName ||
      null,
    unitNameLocal:
      (activeUnit as any).unitNameLocal ||
      (activeUnit as any).shopUnitNameLocal ||
      (activeUnit as any).shopRegionalName ||
      (activeUnit as any).ShopRegionalName ||
      (activeUnit as any).rentInformation?.shopRegionalName ||
      renterRest.unitNameLocal ||
      renterRest.shopUnitNameLocal ||
      renterRest.shopRegionalName ||
      renterRest.ShopRegionalName ||
      null,
    capitalValue: activeUnit.capitalValue || renterRest.capitalValue || 0,
    // ── Rent information from normalized rentInformation ──────
    rentType: (activeUnit as any).rentInformation?.leaseRentType || renterRest.rentType || null,
    leaseStart: (activeUnit as any).rentInformation?.leaseStart || renterRest.leaseStart || null,
    leaseEnd: (activeUnit as any).rentInformation?.leaseEnd || renterRest.leaseEnd || null,
    duration: (activeUnit as any).rentInformation?.duration || renterRest.duration || null,
    rentFreq:
      (activeUnit as any).rentInformation?.rentFrequency || renterRest.rentFreq || null,
    rentAmount: (activeUnit as any).rentInformation?.rentAmount || renterRest.rentAmount || null,
    securityDeposit:
      (activeUnit as any).rentInformation?.securityDeposit || renterRest.securityDeposit || null,
    depositType:
      (activeUnit as any).rentInformation?.depositType || renterRest.depositType || null,
    agreementId:
      (activeUnit as any).agreementId ||
      (activeUnit as any).agreementNo ||
      (activeUnit as any).rentInformation?.agreementId ||
      (activeUnit as any).rentInformation?.agreementNo ||
      (activeUnit as any).renterDetails?.agreementId ||
      (activeUnit as any).renterDetails?.agreementNo ||
      renterRest.agreementId ||
      renterRest.agreementNo ||
      null,
    agreementNo:
      (activeUnit as any).agreementNo ||
      (activeUnit as any).agreementId ||
      (activeUnit as any).rentInformation?.agreementNo ||
      (activeUnit as any).rentInformation?.agreementId ||
      (activeUnit as any).renterDetails?.agreementNo ||
      (activeUnit as any).renterDetails?.agreementId ||
      renterRest.agreementNo ||
      renterRest.agreementId ||
      null,
  };
}
