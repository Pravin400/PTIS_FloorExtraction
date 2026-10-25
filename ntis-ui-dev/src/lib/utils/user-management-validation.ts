import { validateForm } from './validation-helpers';
import type { UserFormData } from '@/types/user-management';

const NAME_REGEX = /^[a-zA-Z\u0900-\u097F\s]+$/;

export interface UserValidationLabels {
  user?: string;
  username?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  mobileNo?: string;
  userCode?: string;
  department?: string;
  role?: string;
}

export interface RoleValidationLabels {
  role?: string;
  department?: string;
}

export interface DesignationValidationLabels {
  designation?: string;
  description?: string;
}

export const userManagementValidations = {
  validateUser: (
    data: Partial<UserFormData>,
    t: (key: string, params?: Record<string, string | number>) => string,
    _tCommon?: (key: string) => string,
    isEdit: boolean = false,
    existingUsers?: Array<{
      userName: string;
      email?: string;
      mobileNo?: string;
      address?: string;
      userCode?: string;
      id?: number | string;
      userId?: number | string;
    }>,
    excludeUserId?: number,
    labels?: UserValidationLabels
  ) => {
    const usernameLabel = labels?.username || 'Username';
    const firstNameLabel = labels?.firstName || 'First Name';
    const middleNameLabel = labels?.middleName || 'Middle Name';
    const lastNameLabel = labels?.lastName || 'Last Name';
    const emailLabel = labels?.email || 'Email';
    const mobileNoLabel = labels?.mobileNo || 'Mobile Number';
    const userCodeLabel = labels?.userCode || 'User Code';
    const departmentLabel = labels?.department || 'Department';
    const roleLabel = labels?.role || 'Role';

    return validateForm(data, {
      userName: (val) => {
        if (!isEdit && !val) return t('form.errors.usernameRequired', { username: usernameLabel });
        if (val && String(val).length > 20)
          return t('form.errors.usernameTooLong', { username: usernameLabel });
        if (val && !/^[a-zA-Z0-9.]+$/.test(String(val))) {
          return t('form.errors.usernameInvalid', { username: usernameLabel });
        }
        if (val && existingUsers) {
          const usernameVal = String(val).trim().toLowerCase();
          const isDuplicate = existingUsers.some(
            (u) =>
              u.userName.trim().toLowerCase() === usernameVal &&
              (excludeUserId === undefined ||
                (String(u.id) !== String(excludeUserId) &&
                  Number(u.userId) !== Number(excludeUserId)))
          );
          if (isDuplicate) return t('form.errors.duplicateUsername', { username: usernameLabel });
        }
        return undefined;
      },
      firstName: (val) => {
        if (!val) return t('form.errors.firstNameRequired', { firstName: firstNameLabel });
        if (String(val).length > 40)
          return t('form.errors.firstNameTooLong', { firstName: firstNameLabel });
        if (!NAME_REGEX.test(String(val)))
          return t('form.errors.firstNameInvalid', { firstName: firstNameLabel });
        return undefined;
      },
      middleName: (val) => {
        if (val) {
          if (String(val).length > 40)
            return t('form.errors.middleNameTooLong', { middleName: middleNameLabel });
          if (!NAME_REGEX.test(String(val)))
            return t('form.errors.middleNameInvalid', { middleName: middleNameLabel });
        }
        return undefined;
      },
      lastName: (val) => {
        if (!val) return t('form.errors.lastNameRequired', { lastName: lastNameLabel });
        if (String(val).length > 40)
          return t('form.errors.lastNameTooLong', { lastName: lastNameLabel });
        if (!NAME_REGEX.test(String(val)))
          return t('form.errors.lastNameInvalid', { lastName: lastNameLabel });
        return undefined;
      },
      email: (val) => {
        if (!val) return t('form.errors.emailRequired', { email: emailLabel });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val))) {
          return t('form.errors.invalidEmail');
        }
        if (existingUsers) {
          const emailVal = String(val).trim().toLowerCase();
          const isDuplicate = existingUsers.some(
            (u) =>
              u.email &&
              u.email.trim().toLowerCase() === emailVal &&
              (excludeUserId === undefined ||
                (String(u.id) !== String(excludeUserId) &&
                  Number(u.userId) !== Number(excludeUserId)))
          );
          if (isDuplicate) return t('form.errors.duplicateEmail', { email: emailLabel });
        }
        return undefined;
      },
      departmentIds: (val) =>
        !val || (val as string[]).length === 0
          ? t('form.errors.departmentRequired', { department: departmentLabel })
          : undefined,
      roleAccess: (val) => {
        const ra = (val || {}) as Record<string, number[]>;
        const deptIds = data.departmentIds || [];
        const hasMissingRoles = deptIds.some((deptId) => !ra[deptId] || ra[deptId].length === 0);
        return hasMissingRoles
          ? t('form.errors.roleRequiredPerDept', {
              role: roleLabel,
              department: departmentLabel,
            })
          : undefined;
      },
      mobileNo: (val) => {
        if (!val) return t('form.errors.mobileRequired', { mobileNo: mobileNoLabel });
        if (!/^\d{10}$/.test(String(val))) {
          return t('form.errors.invalidMobile');
        }
        if (existingUsers) {
          const mobileVal = String(val).trim().toLowerCase();
          const isDuplicate = existingUsers.some(
            (u) =>
              u.mobileNo &&
              u.mobileNo.trim().toLowerCase() === mobileVal &&
              (excludeUserId === undefined ||
                (String(u.id) !== String(excludeUserId) &&
                  Number(u.userId) !== Number(excludeUserId)))
          );
          if (isDuplicate) return t('form.errors.duplicateMobile', { mobileNo: mobileNoLabel });
        }
        return undefined;
      },
      address: () => {
        return undefined;
      },
      userCode: (val) => {
        if (val && String(val).length > 15)
          return t('form.errors.userCodeTooLong', { userCode: userCodeLabel });
        if (val && !/^[a-zA-Z0-9_]+$/.test(String(val))) {
          return t('form.errors.userCodeInvalid', { userCode: userCodeLabel });
        }
        if (val && existingUsers) {
          const codeVal = String(val).trim().toLowerCase();
          if (codeVal) {
            const isDuplicate = existingUsers.some(
              (u) =>
                u.userCode &&
                u.userCode.trim().toLowerCase() === codeVal &&
                (excludeUserId === undefined ||
                  (String(u.id) !== String(excludeUserId) &&
                    Number(u.userId) !== Number(excludeUserId)))
            );
            if (isDuplicate)
              return t('form.errors.duplicateUserCode', { userCode: userCodeLabel });
          }
        }
        return undefined;
      },
    });
  },
  validateRole: (
    data: { name: string; departmentId?: number | string },
    t: (key: string, params?: Record<string, string | number>) => string,
    labels?: RoleValidationLabels
  ) => {
    const roleLabel = labels?.role || 'Role';
    const departmentLabel = labels?.department || 'Department';

    return validateForm(data, {
      departmentId: (val) => {
        if (!val)
          return t('form.errors.departmentRequired', { department: departmentLabel });
        return undefined;
      },
      name: (val) => {
        if (!val) return t('form.errors.roleNameRequired', { role: roleLabel });
        if (String(val).length > 25)
          return t('form.errors.roleNameTooLong', { role: roleLabel });
        if (!NAME_REGEX.test(String(val)))
          return t('form.errors.roleNameInvalid', { role: roleLabel });
        return undefined;
      },
    });
  },
  validateDesignation: (
    data: { name: string; code: string; description?: string },
    t: (key: string, params?: Record<string, string | number>) => string,
    labels?: DesignationValidationLabels
  ) => {
    const designationLabel = labels?.designation || 'Designation';

    return validateForm(data, {
      name: (val) => {
        if (!val)
          return t('form.errors.designationNameRequired', {
            designation: designationLabel,
          });
        if (String(val).length > 20)
          return t('form.errors.designationNameTooLong', {
            designation: designationLabel,
          });
        if (!NAME_REGEX.test(String(val)))
          return t('form.errors.designationNameInvalid', {
            designation: designationLabel,
          });
        return undefined;
      },
      code: (val) => {
        if (!val)
          return t('form.errors.designationCodeRequired', {
            designation: designationLabel,
          });
        if (String(val).length > 10)
          return t('form.errors.designationCodeTooLong', {
            designation: designationLabel,
          });
        if (!/^[a-zA-Z\u0900-\u097F0-9]+$/.test(String(val)))
          return t('form.errors.designationCodeInvalid', {
            designation: designationLabel,
          });
        return undefined;
      },
      description: (val) => {
        if (val) {
          if (String(val).length > 50) return t('form.errors.designationDescriptionTooLong');
          if (!NAME_REGEX.test(String(val))) return t('form.errors.designationDescriptionInvalid');
        }
        return undefined;
      },
    });
  },
};
