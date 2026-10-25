'use client';

import { useState, useEffect } from 'react';
import { useBaseForm } from './useBaseForm';
import {
  createScreenAction,
  updateScreenAction,
} from '@/app/[locale]/configuration-settings/screenAccess/action.mutations';
import { getAllScreensAction } from '@/app/[locale]/configuration-settings/screenAccess/action';

import { ScreenMasterData } from '@/types/screen-access.types';
import { commonValidations } from '@/lib/utils/validation';
import { SCREEN_CODE_MAX, SCREEN_NAME_MAX } from '@/lib/constants/screen-access.constants';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

interface UseScreenFormProps {
  initialData?: Partial<ScreenMasterData>;
  isEdit?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function useScreenForm({
  initialData,
  isEdit: isEditProp,
  onSuccess,
  onCancel,
}: UseScreenFormProps) {
  const isEdit = isEditProp ?? Boolean(initialData?.screenMasterId);
  const [existingScreens, setExistingScreens] = useState<ScreenMasterData[]>([]);

  const screenLabel = useAliasLabel('Screen', 'Screen');
  const screenGroupLabel = useAliasLabel('Screen_Group', 'Screen Group');
  const departmentLabel = useAliasLabel('Department', 'Department');
  const moduleLabel = useAliasLabel('Module', 'Module');

  useEffect(() => {
    getAllScreensAction().then((res) => {
      if (res.success && res.data) {
        setExistingScreens(res.data);
      }
    });
  }, []);

  return {
    ...useBaseForm<ScreenMasterData>({
      initialData: initialData
        ? {
            ...initialData,
            screenName:
              initialData.screenName &&
              initialData.screenName.includes('???') &&
              initialData.screenNameLocal &&
              !initialData.screenNameLocal.includes('???')
                ? initialData.screenNameLocal
                : initialData.screenName,
          }
        : undefined,
      onSuccess,
      onCancel,
      successMessageKey: isEdit
        ? 'screenManagement.screens.messages.updateSuccess'
        : 'screenManagement.screens.messages.createSuccess',
      successMessageParams: { screen: screenLabel },
      redirectPath: '/configuration-settings/screenAccess?tab=screen-management&subTab=screens',
      saveAction: (data) => {
        if (isEdit) {
          if (!data.screenMasterId) {
            return Promise.resolve({
              success: false,
              message: 'screenManagement.screens.messages.updateError',
            });
          }
          return updateScreenAction(data.screenMasterId, data);
        }
        return createScreenAction(data);
      },
      validationSchema: {
        screenCode: (val, _data, t, tCommon) => {
          if (!val || (typeof val === 'string' && !val.trim())) {
            return t('screenManagement.screens.form.errors.codeRequired', { screen: screenLabel });
          }

          const basicError = commonValidations.masterCode(tCommon, SCREEN_CODE_MAX, {
            required: 'form.validation.codeRequired',
            format: 'form.validation.codeFormat',
            maxLength: 'form.validation.codeMaxLength',
          })(val);
          if (basicError) return basicError;

          if (isEdit && String(val || '') === String(initialData?.screenCode || ''))
            return undefined;

          const currentId =
            Number(
              _data.screenMasterId ||
                (_data as { id?: number }).id ||
                initialData?.screenMasterId ||
                (initialData as { id?: number })?.id
            ) || 0;
          const codeVal = (String(val) || '').trim().toLowerCase();

          const isDuplicate = existingScreens.some((s) => {
            const sId = Number(
              s.screenMasterId ||
                (s as { id?: number }).id ||
                (s as { screenId?: number }).screenId ||
                0
            );
            const sCode = (s.screenCode || '').trim().toLowerCase();
            const initCode = (initialData?.screenCode || '').trim().toLowerCase();
            const sName = (s.screenName || '').trim().toLowerCase();
            const initName = (initialData?.screenName || '').trim().toLowerCase();
            const sRoute = (s.routePath || '').trim().toLowerCase();
            const initRoute = (initialData?.routePath || '').trim().toLowerCase();

            const isSameRecord =
              (currentId > 0 && sId === currentId) ||
              (isEdit && sCode && initCode && sCode === initCode) ||
              (isEdit &&
                sName &&
                initName &&
                sRoute &&
                initRoute &&
                sName === initName &&
                sRoute === initRoute);

            return !isSameRecord && sCode === codeVal;
          });

          if (
            !isEdit &&
            existingScreens.some((s) => s.screenCode.trim().toLowerCase() === codeVal)
          ) {
            return t('screenManagement.screens.form.errors.duplicateCode', { screen: screenLabel });
          }
          if (isDuplicate) {
            return t('screenManagement.screens.form.errors.duplicateCode', { screen: screenLabel });
          }
          return undefined;
        },
        screenName: (val, _data, t, tCommon) => {
          if (!val || (typeof val === 'string' && !val.trim())) {
            return t('screenManagement.screens.form.errors.nameRequired', { screen: screenLabel });
          }

          if (/[&()\/-]/.test(String(val))) {
            return tCommon('form.validation.descriptionFormat');
          }

          const basicError = commonValidations.masterDescription(tCommon, SCREEN_NAME_MAX, {
            required: 'form.validation.descriptionRequired',
            format: 'form.validation.descriptionFormat',
            maxLength: 'form.validation.descriptionMaxLength',
          })(val);
          if (basicError) return basicError;

          if (isEdit && String(val || '') === String(initialData?.screenName || ''))
            return undefined;

          const currentId =
            Number(
              _data.screenMasterId ||
                (_data as { id?: number }).id ||
                initialData?.screenMasterId ||
                (initialData as { id?: number })?.id
            ) || 0;
          const nameVal = (String(val) || '').trim().toLowerCase();

          const isDuplicate = existingScreens.some((s) => {
            const sId = Number(
              s.screenMasterId ||
                (s as { id?: number }).id ||
                (s as { screenId?: number }).screenId ||
                0
            );
            const sCode = (s.screenCode || '').trim().toLowerCase();
            const initCode = (initialData?.screenCode || '').trim().toLowerCase();
            const sName = (s.screenName || '').trim().toLowerCase();
            const initName = (initialData?.screenName || '').trim().toLowerCase();
            const sRoute = (s.routePath || '').trim().toLowerCase();
            const initRoute = (initialData?.routePath || '').trim().toLowerCase();

            const isSameRecord =
              (currentId > 0 && sId === currentId) ||
              (isEdit && sCode && initCode && sCode === initCode) ||
              (isEdit &&
                sName &&
                initName &&
                sRoute &&
                initRoute &&
                sName === initName &&
                sRoute === initRoute);

            return !isSameRecord && sName === nameVal;
          });

          if (
            !isEdit &&
            existingScreens.some((s) => s.screenName.trim().toLowerCase() === nameVal)
          ) {
            return t('screenManagement.screens.form.errors.duplicateName', { screen: screenLabel });
          }
          if (isDuplicate) {
            return t('screenManagement.screens.form.errors.duplicateName', { screen: screenLabel });
          }
          return undefined;
        },
        screenGroupId: (val, _data, t) =>
          !val
            ? t('screenManagement.screens.form.errors.groupRequired', {
                screenGroup: screenGroupLabel,
              })
            : undefined,
        departmentMasterId: (val, _data, t) =>
          !val
            ? t('screenManagement.screens.form.errors.departmentRequired', {
                department: departmentLabel,
              })
            : undefined,
        moduleId: (val, _data, t) =>
          !val
            ? t('screenManagement.screens.form.errors.moduleRequired', { module: moduleLabel })
            : undefined,
        routePath: (val, _data, t, tCommon) => {
          if (!val || (typeof val === 'string' && !val.trim())) {
            return t('screenManagement.screens.form.errors.routeRequired');
          }

          if (/[&()]/.test(String(val))) {
            return tCommon('form.validation.descriptionFormat');
          }

          if (isEdit && String(val || '') === String(initialData?.routePath || ''))
            return undefined;

          const currentId =
            Number(
              _data.screenMasterId ||
                (_data as { id?: number }).id ||
                initialData?.screenMasterId ||
                (initialData as { id?: number })?.id
            ) || 0;
          const routeVal = (String(val) || '').trim().toLowerCase();

          const isDuplicate = existingScreens.some((s) => {
            const sId = Number(
              s.screenMasterId ||
                (s as { id?: number }).id ||
                (s as { screenId?: number }).screenId ||
                0
            );
            const sCode = (s.screenCode || '').trim().toLowerCase();
            const initCode = (initialData?.screenCode || '').trim().toLowerCase();
            const sName = (s.screenName || '').trim().toLowerCase();
            const initName = (initialData?.screenName || '').trim().toLowerCase();
            const sRoute = (s.routePath || '').trim().toLowerCase();
            const initRoute = (initialData?.routePath || '').trim().toLowerCase();

            const isSameRecord =
              (currentId > 0 && sId === currentId) ||
              (isEdit && sCode && initCode && sCode === initCode) ||
              (isEdit &&
                sName &&
                initName &&
                sRoute &&
                initRoute &&
                sName === initName &&
                sRoute === initRoute);

            return !isSameRecord && sRoute === routeVal;
          });

          if (
            !isEdit &&
            existingScreens.some((s) => s.routePath.trim().toLowerCase() === routeVal)
          ) {
            return t('screenManagement.screens.form.errors.duplicateRoute', {
              screen: screenLabel,
            });
          }
          if (isDuplicate) {
            return t('screenManagement.screens.form.errors.duplicateRoute', {
              screen: screenLabel,
            });
          }
          return undefined;
        },
        isActive: (val, _data, _t, tCommon) =>
          commonValidations.masterActiveStatus(
            tCommon,
            isEdit,
            'form.validation.mustBeActive'
          )(val),
      },
    }),
    isEdit,
  };
}
