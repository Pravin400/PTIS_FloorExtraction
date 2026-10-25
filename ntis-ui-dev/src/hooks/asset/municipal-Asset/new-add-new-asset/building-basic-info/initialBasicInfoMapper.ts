import type { BuildingBasicInfoFormData } from "@/types/asset/municipal-Asset/new-add-new-asset/buildBasicInfo.types";
import type { AssetFormData } from "@/types/asset/municipal-Asset/new-add-new-asset/asset-wizard.types";

const toIdString = (val: unknown): string => {
  if (val === null || val === undefined || val === "" || val === 0 || val === "0") return "";
  return String(val);
};

/**
 * Maps context form data to the initial state shape for useBuildingBasicInfoFormState.
 */
export function mapContextToInitialBasicInfo(
  contextData: Partial<Omit<AssetFormData, "latitude" | "longitude"> & Omit<BuildingBasicInfoFormData, "latitude" | "longitude">> & {
    categoryName?: string;
    landAreaSqMeter?: string;
    latitude?: string | number | null;
    longitude?: string | number | null;
  }
): Partial<BuildingBasicInfoFormData> {
  const cData = contextData;
  const lenStr = String(cData.length || "0");
  const widStr = String(cData.width || "0");
  const len = parseFloat(lenStr);
  const wid = parseFloat(widStr);
  const autoArea = len > 0 && wid > 0 ? (len * wid).toFixed(2) : "";

  const zoneVal = toIdString(cData.zoneId) || toIdString(cData.zone);
  const wardVal = toIdString(cData.wardId) || toIdString(cData.ward);
  const moujaVal = toIdString(cData.moujaId) || toIdString(cData.mouja);
  const subzoneVal = toIdString(cData.subZoneId) || toIdString(cData.subzone);
  const deptVal = toIdString(cData.departmentId) || toIdString(cData.department);

  return {
    id: typeof cData.id === "number" ? cData.id : 0,
    assetId: typeof cData.assetId === "number" ? cData.assetId : 0,
    category: typeof cData.category === "string" ? cData.category : (typeof cData.categoryName === "string" ? cData.categoryName : ""),
    assetType: typeof cData.assetType === "string" ? cData.assetType : "",
    zone: zoneVal,
    subzone: subzoneVal,
    ward: wardVal,
    mouja: moujaVal,
    propertyNumber: typeof cData.propertyNumber === "string" ? cData.propertyNumber : "",
    surveyNumber: typeof cData.surveyNumber === "string" ? cData.surveyNumber : "",
    partitionNo: typeof cData.partitionNo === "string" ? cData.partitionNo : "",
    upicId: typeof cData.upicId === "string" ? cData.upicId : "",
    length: typeof cData.length === "string" ? cData.length : "",
    width: typeof cData.width === "string" ? cData.width : "",
    landArea:
      typeof cData.landArea === "string" && cData.landArea
        ? cData.landArea
        : typeof cData.landAreaSqMeter === "string" && cData.landAreaSqMeter
        ? cData.landAreaSqMeter
        : autoArea,
    assetName: typeof cData.assetName === "string" ? cData.assetName : "",
    assetNameRegional: typeof cData.assetNameRegional === "string" ? cData.assetNameRegional : "",
    department: deptVal,
    fullAddress: typeof cData.fullAddress === "string" ? cData.fullAddress : "",
    fullAddressRegional: typeof cData.fullAddressRegional === "string" ? cData.fullAddressRegional : "",
    locality: typeof cData.locality === "string" ? cData.locality : "",
    pinCode: typeof cData.pinCode === "string" ? cData.pinCode : "",
    ownershipType: typeof cData.ownershipType === "string" ? cData.ownershipType : "",
    encroachmentStatus: typeof cData.encroachmentStatus === "string" ? cData.encroachmentStatus : "",
    operationalControl: typeof cData.operationalControl === "string" ? cData.operationalControl : "",
    inChargeName: typeof cData.inChargeName === "string" ? cData.inChargeName : "",
    inChargeNameRegional:
      typeof cData.inChargeNameRegional === "string" && cData.inChargeNameRegional
        ? cData.inChargeNameRegional
        : typeof cData.inChargeRegionalName === "string"
        ? cData.inChargeRegionalName
        : "",
    inChargeRegionalName:
      typeof cData.inChargeRegionalName === "string" && cData.inChargeRegionalName
        ? cData.inChargeRegionalName
        : typeof cData.inChargeNameRegional === "string"
        ? cData.inChargeNameRegional
        : "",
    inChargeDesignation:
      typeof cData.inChargeDesignation === "string" && cData.inChargeDesignation
        ? cData.inChargeDesignation
        : typeof (cData as Record<string, unknown>).inChargeDesignationId === "string" || typeof (cData as Record<string, unknown>).inChargeDesignationId === "number"
        ? String((cData as Record<string, unknown>).inChargeDesignationId)
        : "",
    inChargeMobile: typeof cData.inChargeMobile === "string" ? cData.inChargeMobile : "",
    inChargeEmail: typeof cData.inChargeEmail === "string" ? cData.inChargeEmail : "",
    attributes: (cData.attributes as Record<string, string | number | boolean>) || {},
    categoryId: Number(cData.categoryId) || 0,
    typeId: Number(cData.typeId) || 0,
    latitude: typeof cData.latitude === "string" ? cData.latitude : "",
    longitude: typeof cData.longitude === "string" ? cData.longitude : "",
    zoneId: zoneVal,
    wardId: wardVal,
    departmentId: deptVal,
    moujaId: moujaVal,
    subZoneId: subzoneVal,
    status: typeof cData.status === "string" ? cData.status : "Active",
    condition: typeof cData.condition === "string" ? cData.condition : "",
    assetConditionId: typeof cData.assetConditionId === "string" || typeof cData.assetConditionId === "number" ? String(cData.assetConditionId) : "",
    assetCode: typeof cData.assetCode === "string" ? cData.assetCode : "",
    isMovableCategory: typeof cData.isMovableCategory === "boolean" ? cData.isMovableCategory : undefined,
    parentBuildingId: typeof cData.parentBuildingId === "number" ? cData.parentBuildingId : null,
    hasFloorDetails: typeof cData.hasFloorDetails === "boolean" ? cData.hasFloorDetails : undefined,
    hasInventory: typeof cData.hasInventory === "boolean" ? cData.hasInventory : undefined,
    isInventoryMandatory: typeof cData.isInventoryMandatory === "boolean" ? cData.isInventoryMandatory : undefined,
    hasLegalCompliance: typeof cData.hasLegalCompliance === "boolean" ? cData.hasLegalCompliance : undefined,
    categoryCode: typeof cData.categoryCode === "string" ? cData.categoryCode : undefined,
    valuationType: typeof cData.valuationType === "string" ? cData.valuationType : undefined,
    isRented: typeof cData.isRented === "string" ? cData.isRented : "No",
    leaseStartDate: typeof cData.leaseStartDate === "string" ? cData.leaseStartDate : "",
    leaseEndDate: typeof cData.leaseEndDate === "string" ? cData.leaseEndDate : "",
    leaseAmount: typeof cData.leaseAmount === "string" ? cData.leaseAmount : "",
    securityDeposit: typeof cData.securityDeposit === "string" ? cData.securityDeposit : "",
    paymentFrequency: typeof cData.paymentFrequency === "string" ? cData.paymentFrequency : "",
    lessorName: typeof cData.lessorName === "string" ? cData.lessorName : "",
    lessorMobile: typeof cData.lessorMobile === "string" ? cData.lessorMobile : "",
    lessorEmail: typeof cData.lessorEmail === "string" ? cData.lessorEmail : "",
    lessorAddress: typeof cData.lessorAddress === "string" ? cData.lessorAddress : "",
    plotNumber: typeof cData.plotNumber === "string" ? cData.plotNumber : "",
    pTaxId: typeof cData.pTaxId === "string" ? cData.pTaxId : "",
    mpmsNo: typeof cData.mpmsNo === "string" ? cData.mpmsNo : "",
    typeOfUseId: typeof cData.typeOfUseId === "string" ? cData.typeOfUseId : "",
    subTypeOfUseId: typeof cData.subTypeOfUseId === "string" ? cData.subTypeOfUseId : "",
    offset: typeof cData.offset === "string" ? cData.offset : "",
    offsetOp: typeof cData.offsetOp === "string" ? cData.offsetOp : "",
  };
}
