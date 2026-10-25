/* eslint-disable @typescript-eslint/no-explicit-any */
import { assetFieldDefinitionService } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/asset-field-definition.service";
import { typeMapping } from "./submit-asset-form-mappings";

/**
 * Normalizes the raw `submitAssetForm` input (either a plain object or a
 * multipart FormData envelope) into a single `formData` object plus the
 * basic-info file attachments (front photo / building plan / extra files).
 */
export function parseSubmitInput(
  input: any | FormData,
  _basicInfoFiles?: any,
  _extraBasicInfoFiles?: any
): { formData: any; basicInfoFiles: any; extraBasicInfoFiles: any } {
  let formData: any;
  const basicInfoFiles: any = _basicInfoFiles || {};
  const extraBasicInfoFiles: any = _extraBasicInfoFiles || {};

  const isInputFormData = input !== null && typeof input === "object" && typeof (input as any).append === "function" && typeof (input as any).get === "function";
  if (isInputFormData) {
    formData = JSON.parse(input.get("formData") as string);
    if (input.has("frontPhoto")) basicInfoFiles.frontPhoto = input.get("frontPhoto");
    if (input.has("buildingPlan")) basicInfoFiles.buildingPlan = input.get("buildingPlan");

    const extraFilesCodes = input.getAll("extraFiles_typeCode");
    if (extraFilesCodes.length > 0) {
      const files = input.getAll("extraFiles");
      const remarks = input.getAll("extraFiles_remarks");
      const orders = input.getAll("extraFiles_order");
      const typeIds = input.getAll("extraFiles_typeId");

      for (let i = 0; i < extraFilesCodes.length; i++) {
        const typeCode = String(extraFilesCodes[i]);
        if (!extraBasicInfoFiles[typeCode]) extraBasicInfoFiles[typeCode] = [];

        const fileObj: any = files[i];
        fileObj.remarks = remarks[i] !== "null" ? remarks[i] : "";
        fileObj.displayOrder = orders[i] ? Number(orders[i]) : undefined;
        fileObj.photoTypeId = typeIds[i] ? Number(typeIds[i]) : undefined;

        extraBasicInfoFiles[typeCode].push(fileObj);
      }
    }
  } else {
    formData = input;
  }

  return { formData, basicInfoFiles, extraBasicInfoFiles };
}

/**
 * Resolves the asset category/type numeric IDs from the submitted formData,
 * falling back to the legacy asset-type name mapping when no explicit ID was sent.
 */
export function resolveCategoryAndType(formData: any): { categoryId: number; typeId: number } {
  const normalizedType = formData.assetType?.toLowerCase() || "";
  const categoryId = formData.categoryId ? Number(formData.categoryId) : 1;
  const typeId = formData.typeId ? Number(formData.typeId) : (typeMapping[normalizedType] || 1);
  return { categoryId, typeId };
}

/**
 * Fetches the EAV field definitions used to resolve dynamic attribute IDs.
 */
export async function fetchFieldDefsForSubmit(categoryId: number, typeId: number): Promise<any[]> {
  let fieldDefs: any[] = [];
  try {
    const defRes = await assetFieldDefinitionService.getFieldDefinitions(categoryId, typeId);
    const rawData = (defRes as any)?.data ?? defRes;
    if (rawData) {
      if (Array.isArray(rawData)) {
        fieldDefs = rawData;
      } else if (Array.isArray(rawData.items)) {
        fieldDefs = rawData.items;
      } else if (Array.isArray(rawData.Items)) {
        fieldDefs = rawData.Items;
      } else if (Array.isArray(rawData.data)) {
        fieldDefs = rawData.data;
      } else if (Array.isArray(rawData.Data)) {
        fieldDefs = rawData.Data;
      }
    }
  } catch (err) {
    console.error("Error fetching field definitions for submit:", err);
  }
  return fieldDefs;
}
