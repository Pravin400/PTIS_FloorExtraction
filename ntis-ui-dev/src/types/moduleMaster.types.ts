/**
 * Module Master Types
 * Historically referred to as Submodules in the Configuration Master UI
 */

export interface ModuleMaster {
    moduleId: number;
    departmentId?: number;
    moduleCode?: string;
    moduleName?: string;
    moduleNameLocal?: string | null;
    moduleIcon?: string | null;
    moduleLabel?: string | null;
    moduleDescription?: string | null;
    departmentName?: string;
    isActive: boolean;
    createdBy?: number;
    createdAt?: string;
    createdDate?: string;
    updatedBy?: number;
    updatedAt?: string;
    updatedDate?: string | null;
    [key: string]: unknown;
}

export interface ModuleMasterResponse {
    items: ModuleMaster[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
}

// Use shared PagedResponse from common.types instead of duplicating
export type { PagedResponse } from './common.types';

export interface CreateModuleMasterRequest {
    departmentId: number;
    moduleCode: string;
    moduleName: string;
    moduleNameLocal: string | null;
    moduleIcon: string | null;
    moduleLabel: string | null;
    moduleDescription: string | null;
    isActive: boolean;
    createdBy: number;
}

export interface UpdateModuleMasterRequest {
    moduleId: number;
    departmentId: number;
    moduleCode: string;
    moduleName: string;
    moduleNameLocal: string | null;
    moduleIcon: string | null;
    moduleLabel: string | null;
    moduleDescription: string | null;
    isActive: boolean;
    updatedBy: number;
}

export interface ModuleMasterFormModel {
    moduleId?: number;
    departmentId: number;
    moduleCode: string;
    moduleName: string;
    moduleNameLocal: string;
    moduleIcon: string;
    moduleLabel: string;
    moduleDescription: string;
    isActive: boolean;
}

export interface ModuleMasterFormData {
    departmentId: number;
    moduleCode: string;
    moduleName: string;
    moduleNameLocal: string;
    moduleIcon: string;
    moduleLabel: string;
    moduleDescription: string;
    isActive: boolean;
}

export interface ModuleMasterFormProps {
    open: boolean;
    onClose: () => void;
    editingModule: ModuleMaster | null;
    onSuccess: () => void;
    departmentOptions: { label: string; value: string; disabled?: boolean }[];
}

export interface Props {
    initialData: ModuleMaster[];
    allData?: ModuleMaster[];
    initialPageNumber: number;
    initialPageSize: number;
    initialTotalCount: number;
    initialTotalPages: number;
    initialSearchTerm?: string;
    departmentOptions: { label: string; value: string; disabled?: boolean }[];
}
