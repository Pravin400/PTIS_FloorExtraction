import { User, ModuleAccess, UserFormData, MasterModule } from '@/types/user-management';

export type FormAction =
  | { type: 'SET_FIELD'; field: keyof UserFormData; value: UserFormData[keyof UserFormData] }
  | { type: 'SET_FORM'; data: Partial<UserFormData> }
  | { type: 'TOGGLE_DEPARTMENT'; deptId: string }
  | { type: 'TOGGLE_MODULE'; deptId: string; moduleId: string }
  | { type: 'SELECT_ALL_MODULES'; deptId: string; modules: MasterModule[] }
  | { type: 'DESELECT_ALL_MODULES'; deptId: string }
  | { type: 'TOGGLE_ROLE'; deptId: string; roleId: number }
  | { type: 'RESET_ERRORS' }
  | { type: 'SET_ERRORS'; errors: Record<string, string> };

export function getInitialState(initialData?: User): UserFormData {
  return {
    userName: initialData?.userName || '',
    userCode: initialData?.userCode || '',
    firstName: initialData?.firstName || '',
    middleName: initialData?.middleName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    mobileNo: initialData?.mobileNo || '',
    alternateMobileNo: initialData?.alternateMobileNo || '',
    userRoleIds: initialData?.userRoleIds || [],
    address: (initialData?.address as string) || '',
    remark: (initialData?.remark as string) || '',
    departmentIds: initialData?.departmentIds || [],
    moduleAccess: (initialData?.moduleAccess as unknown as ModuleAccess) || {},
    roleAccess: initialData?.roleAccess || {},
    isActive:
      initialData?.isActive !== undefined
        ? initialData.isActive === true || String(initialData.isActive).toLowerCase() === 'true'
        : true,
    status: (initialData?.status || 'Active') as User['status'],
    rawDepartments: initialData?.rawDepartments || [],
    rawModuleAccess: initialData?.rawModuleAccess || [],
    rawRoleAllocations: initialData?.rawRoleAllocations || [],
    createdBy: initialData?.createdBy,
    createdDate: initialData?.createdDate,
  };
}

export function formReducer(state: UserFormData, action: FormAction): UserFormData {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_FORM':
      return { ...state, ...action.data };
    case 'TOGGLE_DEPARTMENT': {
      const isSelected = state.departmentIds.includes(action.deptId);
      const newDepts = isSelected
        ? state.departmentIds.filter((id) => id !== action.deptId)
        : [...state.departmentIds, action.deptId];

      const newModuleAccess = { ...state.moduleAccess };
      const newRoleAccess = { ...state.roleAccess };
      if (isSelected) {
        delete newModuleAccess[action.deptId];
        delete newRoleAccess[action.deptId];
      }
      return {
        ...state,
        departmentIds: newDepts,
        moduleAccess: newModuleAccess,
        roleAccess: newRoleAccess,
      };
    }
    case 'TOGGLE_ROLE': {
      const current = state.roleAccess[action.deptId] || [];
      const isSelected = current.includes(action.roleId);
      const newRoles = isSelected
        ? current.filter((id) => id !== action.roleId)
        : [...current, action.roleId];
      return {
        ...state,
        roleAccess: { ...state.roleAccess, [action.deptId]: newRoles },
      };
    }
    case 'TOGGLE_MODULE': {
      const current = state.moduleAccess[action.deptId] || [];
      const isSelected = current.includes(action.moduleId);
      const newModules = isSelected
        ? current.filter((id) => id !== action.moduleId)
        : [...current, action.moduleId];
      return {
        ...state,
        moduleAccess: { ...state.moduleAccess, [action.deptId]: newModules },
      };
    }
    case 'SELECT_ALL_MODULES': {
      const ids = action.modules
        .filter((m) => {
          const mDeptId = String(
            m.departmentMasterId || m.departmentId || m.departmentID || m.departmentMasterID || ''
          );
          return mDeptId === action.deptId;
        })
        .map((m) => String(m.id || m.moduleMasterId));
      return {
        ...state,
        moduleAccess: { ...state.moduleAccess, [action.deptId]: ids },
      };
    }
    case 'DESELECT_ALL_MODULES': {
      const newModuleAccess = { ...state.moduleAccess };
      newModuleAccess[action.deptId] = [];
      return { ...state, moduleAccess: newModuleAccess };
    }
    default:
      return state;
  }
}
