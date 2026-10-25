 
/**
 * basic-info.service.ts
 *
 * Dedicated server-side read/query service for New Add New Asset SSR.
 * These functions run directly in Server Components (page.tsx / layout.tsx)
 * without the "use server" action transport, ensuring ZERO client network calls on load.
 */

import { cookies } from "next/headers";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import { assetFieldDefinitionService } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/asset-field-definition.service";
import { basicInfoLookupService } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/basic-info-lookup.service";
import { assetMasterService } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/asset-master.service";
import { assetCategoryService } from "@/lib/api/asset-masters/asset-category-crud.service";
import { assetTypeService } from "@/lib/api/asset-masters/asset-type-crud.service";
import { getWards } from "@/lib/api/ward.services";
import { logger } from "@/lib/utils/logger";
import {
  groupAndMergeFields,
  processFieldDefinitions,
} from "@/lib/utils/asset-utils/new-add-new-asset/FieldRendererUtils";

import type { Ward, SubZone, Designation, AssetFieldDefinition } from "@/types/asset/municipal-Asset/new-add-new-asset/master-data.types";
import type { AssetCategory, AssetType } from "@/types/asset/municipal-Asset/new-add-new-asset/add-new-asset.types";
import type { AssetMasterResponse } from "@/types/asset/municipal-Asset/new-add-new-asset/asset-wizard.types";
import type { AssetRegisterApiRecord } from "@/types/asset/asset-register/municipal-asset-service.types";

import type { InitialWizardData, FetchFieldDefinitionsResponse } from "@/types/asset/municipal-Asset/new-add-new-asset";
import {
  buildBasicInfoPayload,
  buildSubmitFormPayload,
  extractAssetIdFromResponse,
  fetchFieldDefsForSubmit,
  parseSubmitInput,
  persistSubmitPayload,
  resolveAssetCondition,
  resolveAssetNo,
  resolveCategoryAndType,
} from "@/lib/utils/asset-utils/new-add-new-asset/submit/submit-asset-form.utils";
import type {
  BuildingBasicInfoFormData,
  BasicInfoFilesPayload,
  SubmitAssetFormResult,
} from "@/types/asset/municipal-Asset/new-add-new-asset";
import type { ExtraBasicInfoFileItem } from "@/types/asset/municipal-Asset/new-add-new-asset/asset-wizard.types";

export type { InitialWizardData };

export async function getWardsByZoneQuery(zoneId: number | string) {
  try {
    const res = await getWards(1, -1, undefined, Number(zoneId));
    return { success: true, data: res.items || [] };
  } catch (error) {
    return { success: false, data: [] as Ward[], error: error instanceof Error ? error.message : "Failed to load wards" };
  }
}

export async function getSubzonesByMoujaQuery(moujaId: number | string) {
  try {
    return await basicInfoLookupService.getSubzonesByMouja(moujaId);
  } catch (error) {
    return { success: false, data: [] as SubZone[], error: error instanceof Error ? error.message : "Failed to load subzones" };
  }
}

export async function getDesignationsByDepartmentQuery(departmentId: number | string) {
  try {
    return await basicInfoLookupService.getDesignationsByDepartment(departmentId);
  } catch (error) {
    return { success: false, data: [] as Designation[], error: error instanceof Error ? error.message : "Failed to load designations" };
  }
}

export async function getBuildingFieldDefinitionsQuery(
  categoryId: number,
  typeId: number
): Promise<FetchFieldDefinitionsResponse> {
  if (!categoryId || !typeId || categoryId <= 0 || typeId <= 0) {
    return { success: false, data: [], error: "Invalid categoryId or typeId." };
  }

  try {
    const response = await assetFieldDefinitionService.getFieldDefinitions(categoryId, typeId);
    if (!response.success || !response.data) {
      return { success: false, data: [], error: response.error ?? "Failed to fetch field definitions." };
    }

    const fieldsArray: AssetFieldDefinition[] = Array.isArray(response.data) ? response.data : [];

    const filtered = fieldsArray.filter((field) => {
      const rawCatId = field.assetCategoryId ?? field.AssetCategoryId;
      const rawTypeId = field.assetTypeId ?? field.AssetTypeId;
      if (rawCatId === undefined || rawCatId === null) return true;
      const catNum = Number(rawCatId);
      if (catNum !== 0 && catNum !== categoryId) return false;
      if (rawTypeId === undefined || rawTypeId === null) return true;
      const typeNum = Number(rawTypeId);
      return typeNum === 0 || typeNum === typeId;
    });

    const processed = processFieldDefinitions({
      success: true,
      data: filtered,
    });
    const sections = groupAndMergeFields(processed);

    return { success: true, data: processed, sections };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error fetching fields.";
    return { success: false, data: [], error: message };
  }
}

export async function getInitialWizardDataQuery(
  assetId: number,
  categoryId: number,
  typeId: number,
  categoryStr: string,
  assetTypeStr: string
): Promise<{ success: boolean; data?: InitialWizardData; error?: string }> {
  try {
    const categoryPromise = categoryId > 0
      ? assetCategoryService.getById(categoryId).then((cat) => ({
          items: [
            {
              id: cat.id,
              categoryName: cat.categoryName,
              categoryCode: cat.categoryCode,
              isActive: cat.isActive,
              description: cat.description,
              backendId: cat.id,
              isMovable: Boolean(cat.isMovable),
              hasFloorDetails: Boolean(cat.hasFloorDetails),
              hasInventory: Boolean(cat.hasInventory),
              isInventoryMandatory: Boolean(cat.isInventoryMandatory),
              hasLegalCompliance: Boolean(cat.hasLegalCompliance),
              createdDate: cat.createdDate || "",
              updatedDate: cat.updatedDate ?? null,
              valuationType: cat.valuationType || "",
            } as AssetCategory,
          ],
        })).catch(() => assetCategoryService.getAll({ PageSize: -1, IsActive: "true" }).catch(() => ({ items: [] as AssetCategory[] })))
      : assetCategoryService.getAll({ PageSize: -1, IsActive: "true" }).catch(() => ({ items: [] as AssetCategory[] }));

    const typePromise = typeId > 0
      ? assetTypeService.getById(typeId).then((typ) => ({
          items: [
            {
              id: Number(typ.id ?? 0),
              typeCode: String(typ.typeCode ?? ""),
              typeName: String(typ.typeName ?? ""),
              categoryId: Number(typ.categoryId ?? 0),
              categoryName: String(typ.categoryName ?? ""),
              isActive: Boolean(typ.isActive),
              createdDate: String(typ.createdDate ?? ""),
              updatedDate: typ.updatedDate ? String(typ.updatedDate) : null,
              allowRoomRegistration: typ.allowRoomRegistration ?? false,
              allowUnitRegistration: typ.allowUnitRegistration ?? true,
            } as AssetType,
          ],
        })).catch(() => assetTypeService.getAll({ PageSize: -1, IsActive: "true", CategoryId: categoryId > 0 ? categoryId : undefined }).catch(() => ({ items: [] as AssetType[] })))
      : Promise.resolve({ items: [] as AssetType[] });

    const [categoriesRes, assetRes, typesRes] = await Promise.all([
      categoryPromise,
      assetId > 0 ? assetMasterService.getAssetById(assetId) : Promise.resolve(null),
      typePromise,
    ]);

    const initialData: InitialWizardData = {
      categoryId,
      typeId,
      assetType: assetTypeStr,
      category: categoryStr,
      hydrated: true,
    };

    if (assetRes && assetRes.success && assetRes.data) {
      initialData.dbAsset = assetRes.data;
    }

    const categoryList: AssetCategory[] = (categoriesRes && (Array.isArray(categoriesRes.items) ? categoriesRes.items : [])) || [];
    if (categoryList.length > 0) {
      const catId = Number(categoryId) || Number(initialData.dbAsset?.categoryId) || 0;
      const cat = categoryList.find((c: AssetCategory) => 
        (catId > 0 && Number(c.id) === catId) ||
        (categoryStr && (
          String(c.categoryCode || '').toLowerCase() === categoryStr.toLowerCase() || 
          String(c.categoryName || '').toLowerCase() === categoryStr.toLowerCase()
        ))
      );
      if (cat) {
        initialData.categoryId = cat.id;
        initialData.categoryCode = cat.categoryCode;
        initialData.category = cat.categoryName || cat.categoryCode || initialData.category;
        initialData.valuationType = cat.valuationType;
        initialData.isMovableCategory = Boolean(cat.isMovable);
        initialData.hasFloorDetails = Boolean(cat.hasFloorDetails);
        initialData.hasInventory = Boolean(cat.hasInventory);
        initialData.isInventoryMandatory = Boolean(cat.isInventoryMandatory);
        initialData.hasLegalCompliance = Boolean(cat.hasLegalCompliance);
      }
    }

    const typeList: AssetType[] = (typesRes && (Array.isArray(typesRes.items) ? typesRes.items : [])) || [];
    if (typeList.length > 0) {
      const currentTypeId = typeId || (initialData.dbAsset?.assetTypeId);
      const type = typeList.find((t: AssetType) => t.id === currentTypeId);
      if (type) {
        initialData.allowUnitRegistration = type.allowUnitRegistration ?? true;
        initialData.allowRoomRegistration = type.allowRoomRegistration ?? false;
      }
    }

    return { success: true, data: initialData };
  } catch (error) {
    logger.error("Failed to query initial wizard data", { error: error instanceof Error ? error : undefined });
    return { success: false, error: "Failed to query initial wizard data" };
  }
}

export async function getAssetMasterByIdQuery(assetId: number | string): Promise<AssetMasterResponse | null> {
  try {
    const numericId = Number(assetId);
    let response = (!isNaN(numericId) && numericId > 0)
      ? await assetMasterService.getAssetById(numericId)
      : null;

    if (!response || !response.success || !response.data) {
      const strId = String(assetId).trim();
      if (strId && strId !== 'undefined' && strId !== 'null') {
        const paginatedRes = await assetMasterService.getAllAssetsPaginated({
          searchTerm: strId,
          pageSize: 10,
        });
        if (paginatedRes.success && paginatedRes.data?.items?.length) {
          const exactMatch = paginatedRes.data.items.find(
            (item: AssetRegisterApiRecord) =>
              item.assetNo === strId ||
              item.csn === strId ||
              item.name === strId ||
              String(item.id) === strId
          ) || paginatedRes.data.items[0];

          if (exactMatch && exactMatch.id) {
            response = await assetMasterService.getAssetById(Number(exactMatch.id));
          }
        }
      }
    }

    if (response && response.success && response.data) {
      return response.data;
    }
  } catch (err) {
    logger.error("Failed to query asset master by ID", { error: err instanceof Error ? err : undefined });
  }
  return null;
}

/**
 * Service to orchestrate the consolidated Asset Registration Form submission and updates.
 */
export async function submitAssetFormService(
  input: BuildingBasicInfoFormData | FormData,
  _basicInfoFiles?: BasicInfoFilesPayload,
  _extraBasicInfoFiles?: Record<string, ExtraBasicInfoFileItem[]>
): Promise<SubmitAssetFormResult> {
  try {
    const { formData, basicInfoFiles, extraBasicInfoFiles } = parseSubmitInput(input, _basicInfoFiles, _extraBasicInfoFiles);

    const { categoryId, typeId } = resolveCategoryAndType(formData);

    // Fetch definitions to resolve IDs for EAV dynamic fieldValues
    const fieldDefs = await fetchFieldDefsForSubmit(categoryId, typeId);

    const parsedId = Number(formData.id || formData.assetId);
    const isUpdate = !isNaN(parsedId) && parsedId > 0;

    const assetNo = await resolveAssetNo(formData, parsedId, isUpdate);

    let sessionUserId: number | null = null;
    let sessionOrgId: number | null = null;
    try {
      const cookieStore = await cookies();
      sessionUserId = getUserIdFromCookies(cookieStore);
      const rawOrg = cookieStore.get("organization_id")?.value || cookieStore.get("org_id")?.value || cookieStore.get("ulb_id")?.value;
      if (rawOrg) {
        const parsedOrg = parseInt(rawOrg, 10);
        if (!isNaN(parsedOrg) && parsedOrg > 0) sessionOrgId = parsedOrg;
      }
    } catch {
      // Graceful fallback if invoked outside request store context
    }

    const apiRequest = buildBasicInfoPayload(formData, fieldDefs, categoryId, typeId, assetNo, {
      sessionOrgId,
      sessionUserId,
    });

    apiRequest.assetConditionId = await resolveAssetCondition(formData);

    const { payload } = await buildSubmitFormPayload(apiRequest, basicInfoFiles, extraBasicInfoFiles);

    const response = await persistSubmitPayload(isUpdate, parsedId, payload);

    let assetId: number | null = null;

    // Save dynamic EAV field values to /AssetMaster in master payload; extract assetId from response
    if (response.success && response.data) {
      assetId = extractAssetIdFromResponse(response.data, isUpdate, parsedId);
    }

    // Return concise draft creation result without triggering parent route RSC revalidation
    if (response.success) {
      const itemsObj =
        response.data?.items && typeof response.data.items === "object" && !Array.isArray(response.data.items)
          ? response.data.items
          : undefined;
      const generatedCode =
        itemsObj?.assetCode ||
        itemsObj?.assetNo ||
        response.data?.assetCode ||
        response.data?.assetNo ||
        formData.assetCode ||
        "";
      return {
        success: true,
        data: response.data,
        assetId: assetId || undefined,
        assetCode: generatedCode || undefined,
      };
    }

    const errorMsg = response.error || response.message || "Failed to create draft asset.";
    return {
      success: false,
      data: response.data,
      error: errorMsg,
      message: response.message || errorMsg,
      assetId: undefined,
      assetCode: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error during asset creation.",
      assetId: undefined,
      assetCode: undefined,
    };
  }
}
