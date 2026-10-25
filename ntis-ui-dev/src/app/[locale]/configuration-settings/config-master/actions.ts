/**
 * Configuration Master Server Actions
 * This file acts as a barrel for all configuration actions, explicitly exporting only async functions
 * as required by Next.js Server Components.
 */

// Types
export type { ActionResult } from '@/types/common.types';

// Category Actions
export {
  createConfigCategoryAction,
  updateConfigCategoryAction,
  updateConfigCategoryStatusAction,
  deleteConfigCategoryAction
} from './actions/category';

// Config Key Actions
export {
  getConfigItemsByCategoryAction,
  getAllConfigItemsAction,
  createConfigKeyAction,
  updateConfigKeyAction,
  deleteConfigKeyAction,
} from './actions/key';
export { updateAllConfigKeysStatusByCategoryIdAction } from './actions/key-bulk';

// Config Value Actions
export {
  createConfigValueAction,
  updateConfigItemAction,
  deleteConfigValueAction
} from './actions/value';

// Department Configuration Actions
export {
  getDepartmentConfigurationAction,
  saveDepartmentConfigurationAction
} from './actions/department';

// Submodule Actions
export {
  getModulesByDepartmentAction,
  createModuleAction,
  updateModuleAction,
  deleteModuleAction
} from './actions/module';
