import { MASTER_IDS, type MasterDataRecord } from "@/types/asset-masters/master-data.types";
import { ownershipTypeService } from "./ownership-type.service";


interface ApiItem {
  id: number;
  typeCode?: string;
  code?: string;
  categoryCode?: string;
  modelCode?: string;
  subTypeCode?: string;
  typeName?: string;
  name?: string;
  categoryName?: string;
  modelName?: string;
  subTypeName?: string;
  description?: string;
  isActive?: boolean | number;
  [key: string]: unknown;
}

function mapMasterResponse(res: { items?: unknown[]; totalCount?: number; totalPages?: number; pageNumber?: number; pageSize?: number }, nameField: string, codeField?: string) {
  return {
    records: (res.items as unknown as ApiItem[])?.map((item) => {
      const codeVal = codeField ? (item[codeField] ?? item[codeField.charAt(0).toUpperCase() + codeField.slice(1)]) : item.code;
      const nameVal = item[nameField] ?? item[nameField.charAt(0).toUpperCase() + nameField.slice(1)] ?? item.name;
      return {
        ...item,
        id: String(item.id),
        code: String(codeVal || item.id),
        name: String(nameVal ?? ""),
        assetCategoryId: item.assetCategoryId as number | undefined ?? item["AssetCategoryId"] as number | undefined,
        assetCategoryName: (item.assetCategoryName ?? item["AssetCategoryName"]) ? String(item.assetCategoryName ?? item["AssetCategoryName"]) : undefined,
        inventoryItemNameId: (item.inventoryItemNameId ?? item["InventoryItemNameId"]) !== undefined ? Number(item.inventoryItemNameId ?? item["InventoryItemNameId"]) : undefined,
        inventoryItemName: (item.inventoryItemName ?? item["InventoryItemName"]) ? String(item.inventoryItemName ?? item["InventoryItemName"]) : undefined,
        displayOrder: (item.displayOrder ?? item["DisplayOrder"]) !== undefined ? Number(item.displayOrder ?? item["DisplayOrder"]) : undefined,
        description: (item.description ?? item["Description"]) ? String(item.description ?? item["Description"]) : undefined,
        status: (String(item.status ?? "").toLowerCase() === "inactive" || 
                 item.isActive === false || String(item.isActive).toLowerCase() === "false" || 
                 item.isActive === 0 || item["IsActive"] === false || item["IsActive"] === 0) ? 
                 "Inactive" : "Active",
      };
    }) as MasterDataRecord[] || [],
    totalCount: res.totalCount ?? 0,
    totalPages: res.totalPages ?? 1,
    pageNumber: res.pageNumber ?? 1,
    pageSize: res.pageSize ?? 10,
  };
}

export async function getAssetMasterDataProvider(
  masterId: string,
  _selectedGroup: string,
  pageNumber: number = 1,
  pageSize: number = 10,
  searchTerm: string = "",
  sortBy: string = "",
  sortOrder: "asc" | "desc" = "asc"
) {
  try {
    let data: { records: MasterDataRecord[]; totalCount: number; totalPages: number; pageNumber: number; pageSize: number } = { records: [], totalCount: 0, totalPages: 1, pageNumber, pageSize };

    const commonParams = {
      PageNumber: pageNumber,
      PageSize: pageSize,
      SearchTerm: searchTerm,
      SortBy: sortBy || undefined,
      SortOrder: sortBy ? sortOrder : undefined,
    };

    if (masterId === MASTER_IDS.OWNERSHIP_TYPE) {
      const res = await ownershipTypeService.getAll(commonParams);
      data = mapMasterResponse(res, 'ownershipTypeName');
    } else if (masterId === MASTER_IDS.CATEGORY) {
      const { assetCategoryService } = await import('./asset-category-crud.service');
      const res = await assetCategoryService.getAll(commonParams);
      data = mapMasterResponse(res, 'categoryName', 'categoryCode');
    } else if (masterId === MASTER_IDS.TYPE) {
      const { assetTypeService } = await import('./asset-type-crud.service');
      const res = await assetTypeService.getAll(commonParams);
      data = mapMasterResponse(res, 'typeName', 'typeCode');
    } else if (masterId === MASTER_IDS.INVENTORY_CATEGORY) {
      const { inventoryCategoryService } = await import('./inventory-category.service');
      const res = await inventoryCategoryService.getAll(commonParams);
      data = mapMasterResponse(res, 'typeName', 'typeCode');
    } else if (masterId === MASTER_IDS.INVENTORY_MODEL) {
      const { inventoryModelService } = await import('./inventory-model.service');
      const res = await inventoryModelService.getAll(commonParams);
      data = mapMasterResponse(res, 'modelName', 'modelCode');
    } else if (masterId === MASTER_IDS.INVENTORY_NAME) {
      const { inventoryItemNameService } = await import('./inventory-item-name.service');
      const res = await inventoryItemNameService.getAll(commonParams);
      data = mapMasterResponse(res, 'subTypeName', 'subTypeCode');
    }

    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch master data" };
  }
}
