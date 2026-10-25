 
import type { TypeOfUseMasterData } from "@/types/typeOfUse.types";
 
// Re-export error constants
export { TypeOfUseErrorMessages } from "./typeofuse.errors";
 
// Re-export all group service functions
export {
  getUseGroupsPagedServer,
  getUseGroupById,
  createUseGroupApi,
  updateUseGroupApi,
  deleteUseGroupApi,
} from "./typeofusegroup.service";
 
// Re-export all type service functions
export {
  getUseTypesPagedServer,
  getUseTypeById,
  createUseTypeApi,
  updateUseTypeApi,
  deleteUseTypeApi,
} from "./typeofuse.service";
 
// Re-export all category service functions
export {
  getUseCategoriesPagedServer,
  getTypeOfUseCategoryById,
  createTypeOfUseCategoryApi,
  updateTypeOfUseCategoryApi,
  deleteTypeOfUseCategoryApi,
} from "./typeofusecategory.service";

// Re-export all subtype service functions
export {
  getSubTypesPagedServer,
  getSubTypeByIdApi,
  createSubTypeApi,
  updateSubTypeApi,
  deleteSubTypeApi,
  getSubTypeCountByTypeIds,
} from "./typeofusesubtype.service";
 
// Re-export mapping functions
export { iconKeyToApi } from "./typeofuse.mappers";
 
/** -------------------- ✅ MASTER GET (Groups + Types) -------------------- */
/**
 * Fetch the complete Type Of Use Master data (Groups + Types)
 * Subtypes are loaded separately per type for performance
 */
export async function getTypeOfUseMaster(): Promise<TypeOfUseMasterData> {
  const { getUseGroupsPagedServer } = await import("./typeofusegroup.service");
  const { getUseTypesPagedServer } = await import("./typeofuse.service");
 
  const [groupsPaged, typesPaged] = await Promise.all([
    getUseGroupsPagedServer({ pageNumber: 1, pageSize: 1000 }),
    getUseTypesPagedServer({ pageNumber: 1, pageSize: 5000 }),
  ]);
 
  return {
    groups: groupsPaged.items,
    types: typesPaged.items,
    subTypes: [], // ✅ keep empty (subtypes will load paged per type)
  };
}
 
 
