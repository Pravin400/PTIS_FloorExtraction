/**
 * Screen Access Services
 *
 * This file re-exports services from the split modules.
 */

export * from './screen-master.services';
export * from './screen-group.services';

export const getMasterDataPageSize = () => 1000;

// Re-export specific types for convenience
import type { DepartmentMasterData, ModuleMasterData } from '@/types/screen-access.types';
export type { DepartmentMasterData as DepartmentItem, ModuleMasterData as ModuleItem };
export type { PagedResponse as PaginatedResponse } from '@/types/common.types';
