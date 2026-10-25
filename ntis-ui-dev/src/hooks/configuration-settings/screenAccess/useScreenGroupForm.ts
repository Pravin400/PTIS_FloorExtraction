'use client';

import { useState, useEffect } from 'react';
import { useBaseForm } from './useBaseForm';
import {
  createScreenGroupAction,
  updateScreenGroupAction,
} from '@/app/[locale]/configuration-settings/screenAccess/action.mutations';
import { getScreenGroupsAction } from '@/app/[locale]/configuration-settings/screenAccess/action';

import { ScreenGroupMasterData } from '@/types/screen-access.types';
import { commonValidations } from '@/lib/utils/validation';
import { GROUP_CODE_MAX, GROUP_NAME_MAX } from '@/lib/constants/screen-access.constants';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

interface UseScreenGroupFormProps {
  initialData?: Partial<ScreenGroupMasterData>;
  isEdit?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function useScreenGroupForm({
  initialData,
  isEdit: isEditProp,
  onSuccess,
  onCancel,
}: UseScreenGroupFormProps) {
  const isEdit = isEditProp ?? Boolean(initialData?.screenGroupId);
  const [existingGroups, setExistingGroups] = useState<ScreenGroupMasterData[]>([]);

  const screenGroupLabel = useAliasLabel('Screen_Group', 'Screen Group');

  useEffect(() => {
    getScreenGroupsAction(1, 2000).then((res) => {
      if (res.success && res.data?.items) {
        setExistingGroups(res.data.items);
      }
    });
  }, []);

  return {
    ...useBaseForm<ScreenGroupMasterData>({
      initialData,
      onSuccess,
      onCancel,
      successMessageKey: isEdit
        ? 'screenManagement.groups.messages.updateSuccess'
        : 'screenManagement.groups.messages.createSuccess',
      successMessageParams: { screenGroup: screenGroupLabel },
      redirectPath: '/configuration-settings/screenAccess?tab=screen-management&subTab=groups',
      saveAction: (data) => {
        if (isEdit) {
          if (!data.screenGroupId) {
            return Promise.resolve({
              success: false,
              message: 'screenManagement.groups.messages.updateError',
            });
          }
          return updateScreenGroupAction(data.screenGroupId, data);
        }
        return createScreenGroupAction(data);
      },
      validationSchema: {
        screenGroupCode: (val, _data, t, tCommon) => {
          if (!val || (typeof val === 'string' && !val.trim())) {
            return t('screenManagement.groups.form.errors.codeRequired', {
              screenGroup: screenGroupLabel,
            });
          }

          const basicError = commonValidations.masterCode(tCommon, GROUP_CODE_MAX, {
            required: 'form.validation.codeRequired',
            format: 'form.validation.codeFormat',
            maxLength: 'form.validation.codeMaxLength',
          })(val);
          if (basicError) return basicError;

          const currentId = initialData?.screenGroupId;
          const codeVal = (String(val) || '').trim().toLowerCase();
          const isDuplicate = existingGroups.some(
            (g) =>
              (!currentId || g.screenGroupId !== currentId) &&
              g.screenGroupCode.trim().toLowerCase() === codeVal
          );
          if (isDuplicate) {
            return t('screenManagement.groups.form.errors.duplicateCode', {
              screenGroup: screenGroupLabel,
            });
          }
          return undefined;
        },
        screenGroupName: (val, _data, t, tCommon) => {
          if (!val || (typeof val === 'string' && !val.trim())) {
            return t('screenManagement.groups.form.errors.nameRequired', {
              screenGroup: screenGroupLabel,
            });
          }

          if (/[&()]/.test(String(val))) {
            return tCommon('form.validation.descriptionFormat');
          }

          const basicError = commonValidations.masterDescription(tCommon, GROUP_NAME_MAX, {
            required: 'form.validation.descriptionRequired',
            format: 'form.validation.descriptionFormat',
            maxLength: 'form.validation.descriptionMaxLength',
          })(val);
          if (basicError) return basicError;

          const currentId = initialData?.screenGroupId;
          const nameVal = (String(val) || '').trim().toLowerCase();
          const isDuplicate = existingGroups.some(
            (g) =>
              (!currentId || g.screenGroupId !== currentId) &&
              g.screenGroupName.trim().toLowerCase() === nameVal
          );
          if (isDuplicate) {
            return t('screenManagement.groups.form.errors.duplicateName', {
              screenGroup: screenGroupLabel,
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
