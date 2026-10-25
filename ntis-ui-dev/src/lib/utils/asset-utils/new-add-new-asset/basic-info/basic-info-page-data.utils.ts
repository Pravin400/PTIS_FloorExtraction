 
import { getZones } from "@/lib/api/zone.services";
import { getOwningDepartments } from "@/lib/api/asset-masters/designation-crud.service";
import { getMoujasAllActive } from "@/lib/api/asset-masters/mouja-subzone.service";
import { ownershipTypeService } from "@/lib/api/asset-masters/ownership-type.service";
import { assetConditionService } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/asset-condition.service";
import {
  getBuildingFieldDefinitionsQuery,
  getWardsByZoneQuery,
  getSubzonesByMoujaQuery,
  getDesignationsByDepartmentQuery,
  getInitialWizardDataQuery,
  getAssetMasterByIdQuery,
  type InitialWizardData,
} from "@/lib/api/asset/municipal-Asset/new-add-new-asset/basic-info.service";
import {
  fetchAssetPhotoTypesAction,
  fetchAssetPhotosAction,
} from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions/asset-photos.actions";
import type {
  Zone,
  Ward,
  Department,
  Mouja,
  OwnershipType,
  Designation,
  SubZone,
  AssetConditionOption,
} from "@/types/asset/municipal-Asset/new-add-new-asset/master-data.types";
import type { ProcessedField } from "@/lib/utils/asset-utils/new-add-new-asset/FieldRendererUtils";
import type { OwningDepartment } from "@/types/asset-masters/designation.types";
import type { RawDbAsset, RawDbAssetDetails, RawFieldValue } from "@/lib/utils/asset-utils/new-add-new-asset/mapDbAssetToFormData";
import type { AssetMasterResponse } from "@/types/asset/municipal-Asset/new-add-new-asset/asset-wizard.types";
import type { AssetFloorDetailItem } from "@/types/asset/municipal-Asset/new-add-new-asset/detail-tabs.types";
import type { ParentSubunitLookupItem } from "@/types/asset/municipal-Asset/new-add-new-asset/basic-info-actions.types";

import type { BasicInfoPageParams } from "@/types/asset/municipal-Asset/new-add-new-asset";

export type { BasicInfoPageParams };

export async function loadBasicInfoPageData(params: BasicInfoPageParams) {
  const {
    categoryId, typeId, assetId, categoryStr, assetTypeStr,
    zoneIdParam, moujaIdParam, departmentIdParam, parentAssetIdParam,
  } = params;

  let wards: Ward[] = [];
  let zones: Zone[] = [];
  let departments: Department[] = [];
  let moujas: Mouja[] = [];
  let designations: Designation[] = [];
  let ownershipTypes: OwnershipType[] = [];
  let prefetchedFields: ProcessedField[] = [];
  let subzones: SubZone[] = [];
  let assetConditions: AssetConditionOption[] = [];
  let initialWizardData: InitialWizardData | null = null;
  let initialParentAsset: AssetMasterResponse | null = null;
  const initialParentFloors: AssetFloorDetailItem[] = [];
  const initialParentSubunits: ParentSubunitLookupItem[] = [];

  // Fetch independent global data + DB Asset in the first wave
  const shouldFetchParentAsset = Boolean(parentAssetIdParam && parentAssetIdParam > 0 && parentAssetIdParam !== assetId);
  const designationsPromise = departmentIdParam ? getDesignationsByDepartmentQuery(departmentIdParam) : null;
  const wardsPromise = zoneIdParam ? getWardsByZoneQuery(zoneIdParam) : null;
  const subzonesPromise = moujaIdParam ? getSubzonesByMoujaQuery(moujaIdParam) : null;

  const [
    zonesRes,
    departmentsRes,
    moujasRes,
    ownershipRes,
    assetConditionsRes,
    initialWizardDataRes,
    fieldsRes,
    parentAssetRes,
    photoTypesRes,
    photosRes,
  ] = await Promise.all([
    getZones(1, -1).catch(() => ({ items: [] as Zone[] })),
    getOwningDepartments().catch(() => [] as OwningDepartment[]),
    getMoujasAllActive().catch(() => [] as Mouja[]),
    ownershipTypeService.getAll({ PageSize: -1, IsActive: true }).catch(() => ({ items: [] as OwnershipType[] })),
    categoryId > 0 ? assetConditionService.getAssetConditions(categoryId) : Promise.resolve({ success: true, data: [] as AssetConditionOption[] }),
    getInitialWizardDataQuery(assetId, categoryId, typeId, categoryStr, assetTypeStr),
    categoryId > 0 && typeId > 0
      ? getBuildingFieldDefinitionsQuery(categoryId, typeId)
      : Promise.resolve({ success: false as const, error: "Missing ids", data: [] as ProcessedField[] }),
    shouldFetchParentAsset ? getAssetMasterByIdQuery(parentAssetIdParam!) : Promise.resolve(null),
    fetchAssetPhotoTypesAction(assetId > 0 ? assetId : 0, typeId, categoryId).catch(() => ({ success: false, data: [] })),
    assetId > 0 ? fetchAssetPhotosAction(assetId).catch(() => ({ success: false, data: [] })) : Promise.resolve({ success: true, data: [] }),
  ]);

  const initialPhotoTypes = photoTypesRes?.success && Array.isArray(photoTypesRes.data) ? photoTypesRes.data : [];
  const initialDbPhotos = photosRes?.success && Array.isArray(photosRes.data) ? photosRes.data : [];

  initialWizardData = (initialWizardDataRes?.success && initialWizardDataRes.data) ? initialWizardDataRes.data : null;

  // Extract EAV dynamic attributes from the asset to find Type of Use
  const dynamicAttrs: Record<string, string | number | boolean> = {};
  const rawDbAsset = initialWizardData?.dbAsset as RawDbAsset | undefined;
  const rawFieldValues = (rawDbAsset?.fieldValues || rawDbAsset?.FieldValues || []) as RawFieldValue[];
  if (Array.isArray(rawFieldValues)) {
    rawFieldValues.forEach((fv) => {
      const key = fv.fieldName || fv.fieldCode;
      const val = fv.fieldValue ?? fv.textValue ?? fv.numberValue ?? fv.booleanValue ?? fv.dateValue;
      if (key && val !== null && val !== undefined) {
        dynamicAttrs[key] = val;
        dynamicAttrs[key.toLowerCase()] = val;
        const fieldDefId = fv.fieldDefinitionId;
        if (fieldDefId) {
          dynamicAttrs[`field_${fieldDefId}`] = val;
          dynamicAttrs[String(fieldDefId)] = val;
        }
      }
    });
  }

  const dbAssetDetails: RawDbAssetDetails = (rawDbAsset?.details || rawDbAsset?.Details || {}) as RawDbAssetDetails;

  // Resolve the effective IDs: URL param takes priority, falling back to the saved asset when editing
  const effectiveDepartmentId = departmentIdParam ?? (rawDbAsset?.departmentId ? String(rawDbAsset.departmentId) : null);
  const effectiveZoneId = (zoneIdParam ?? (dbAssetDetails.zoneId ? String(dbAssetDetails.zoneId) : null));
  const effectiveMoujaId = (moujaIdParam ?? (dbAssetDetails.moujaId ? String(dbAssetDetails.moujaId) : null));

  const [designationsRes, wardsRes, subzonesRes] = await Promise.all([
    designationsPromise ?? (effectiveDepartmentId ? getDesignationsByDepartmentQuery(effectiveDepartmentId) : Promise.resolve({ success: true, data: [] as Designation[] })),
    wardsPromise ?? (effectiveZoneId ? getWardsByZoneQuery(effectiveZoneId) : Promise.resolve({ success: true, data: [] as Ward[] })),
    subzonesPromise ?? (effectiveMoujaId ? getSubzonesByMoujaQuery(effectiveMoujaId) : Promise.resolve({ success: true, data: [] as SubZone[] })),
  ]);

  if (designationsRes?.success && Array.isArray(designationsRes.data)) {
    designations = designationsRes.data;
  }

  if (wardsRes?.success && Array.isArray(wardsRes.data)) {
    wards = wardsRes.data.map((w) => ({
      id: w.id,
      wardName: w.wardNo || `Ward ${w.id}`,
      wardNo: w.wardNo,
      zoneId: w.zoneId,
      description: w.description || undefined,
      isActive: w.isActive,
    }));
  }
  if (zonesRes && "items" in zonesRes && Array.isArray(zonesRes.items)) {
    zones = zonesRes.items.map((z) => ({
      id: z.id,
      zoneNo: z.zoneNo,
      zoneName: z.zoneNo,
      description: z.description || undefined,
      sequenceNo: z.sequenceNo ?? undefined,
      isActive: z.isActive,
    }));
  }
  if (Array.isArray(departmentsRes)) {
    departments = departmentsRes.map((d) => ({
      id: d.id,
      departmentName: d.owningDepartmentName,
      owningDepartmentName: d.owningDepartmentName,
      isActive: d.isActive,
    }));
  }
  if (Array.isArray(moujasRes)) {
    moujas = moujasRes;
  }
  if (fieldsRes.success && Array.isArray(fieldsRes.data)) {
    prefetchedFields = fieldsRes.data;
  }
  if (subzonesRes.success && Array.isArray(subzonesRes.data)) {
    subzones = subzonesRes.data;
  }
  if (ownershipRes && "items" in ownershipRes && Array.isArray(ownershipRes.items)) {
    ownershipTypes = ownershipRes.items;
  }
  if (assetConditionsRes.success && Array.isArray(assetConditionsRes.data)) {
    assetConditions = assetConditionsRes.data;
  }
  initialParentAsset = parentAssetRes;

  return {
    wards, zones, departments, moujas, designations, ownershipTypes, prefetchedFields,
    subzones, assetConditions, initialWizardData,
    initialParentAsset, initialParentFloors, initialParentSubunits,
    initialPhotoTypes, initialDbPhotos,
  };
}
