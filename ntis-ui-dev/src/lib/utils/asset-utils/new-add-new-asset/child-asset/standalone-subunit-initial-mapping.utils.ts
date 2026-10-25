/* eslint-disable @typescript-eslint/no-explicit-any */
import { mapStandaloneUnitRooms, computeStandaloneUnitCarpetArea } from '@/lib/utils/asset-utils/new-add-new-asset/child-asset/standalone-subunit-room-mapper.utils';
import { resolveStandaloneUnitFloorContext, resolveStandaloneUnitType } from '@/lib/utils/asset-utils/new-add-new-asset/child-asset/standalone-subunit-floor-context.utils';

function mapStandaloneUnitRenter(u: any) {
  const rent = Array.isArray(u.renterDetails)
    ? u.renterDetails[0]
    : (u.renterDetailsList && u.renterDetailsList[0]) || u.renterDetails;

  if (!rent) return null;
  return {
    renterName: rent.renterName || rent.tenantName || "",
    gstNo: rent.gstNo || "",
    aadhaar: rent.aadhaarCardNo || rent.tenantAadhaarNo || "",
    pan: rent.panCardNo || rent.tenantPanCardNo || "",
    mobileNo: rent.mobileNo || rent.tenantMobile || "",
    emailId: rent.emailId || rent.tenantEmail || "",
    rentType: rent.leaseRentType || "",
    leaseStart: rent.fromDate ? rent.fromDate.split("T")[0] : (rent.leaseStartDate ? rent.leaseStartDate.split("T")[0] : ""),
    leaseEnd: rent.toDate ? rent.toDate.split("T")[0] : (rent.leaseEndDate ? rent.leaseEndDate.split("T")[0] : ""),
    duration: rent.duration || "",
    rentFreq: rent.rentFrequency || rent.paymentFrequency || "",
    rentAmount: rent.rentAmount || rent.monthlyRent || "",
    securityDeposit: rent.securityDeposit || "",
    depositType: rent.depositType || "",
  };
}

export function mapInitialStandaloneUnits(initialSubUnits: any[], parentFloors: any[]) {
  return initialSubUnits.map((u: any) => {
    const mappedRooms = mapStandaloneUnitRooms(u);
    const renterData = mapStandaloneUnitRenter(u);
    const { floorDetailsId, resolvedFloorLevelId, subFloorId, conYear, conType, useType, subUseType } =
      resolveStandaloneUnitFloorContext(u, parentFloors);
    const unitType = resolveStandaloneUnitType(u);

    return {
      id: u.assetId || u.id,
      subAssetId: u.assetNo || u.assetCode || u.shopUnitName || `Unit-${u.id}`,
      unitNumber: u.assetNo || u.assetCode || "",
      unitNo: u.unitNo || "",
      unitName: u.shopUnitName || u.assetName || u.name || `${unitType} ${u.unitNo || u.assetNo || u.assetCode || ""}`,
      unitType,
      carpetAreaSqFeet: computeStandaloneUnitCarpetArea(u, mappedRooms),
      baseValue: u.calculatedCapitalValue || 0,
      status: "Active",
      floorId: resolvedFloorLevelId || floorDetailsId,
      floorDetailsId: floorDetailsId,
      subFloorId: subFloorId,
      rooms: mappedRooms,
      // Department — map from API response (departmentId / deptId)
      departmentId: u.departmentId || u.deptId || null,
      departmentName: u.departmentName || u.deptName || "",
      // Lease/rent fields for display
      rentAmount: renterData?.rentAmount || 0,
      rentType: renterData?.rentType || "",
      securityDeposit: renterData?.securityDeposit || 0,
      conYear: u.conYear || conYear,
      conType: u.conType || conType,
      useType: u.useType || useType,
      subUseType: u.subUseType || subUseType,
      // Mark as persisted in DB so handleSaveAll won't re-send them on next navigation
      isSaved: true,
      isModified: false,
      // Add all remaining properties to avoid data loss
      ...renterData,
    };
  });
}
