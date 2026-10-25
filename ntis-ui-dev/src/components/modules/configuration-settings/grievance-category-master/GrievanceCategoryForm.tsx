'use client';

import { useMemo, type ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ValidationMessage } from '@/components/common';
import { getLocalizedEscalationLabel, getLocalizedPriorityLabel } from './ColumnUtils';
import { priorities, escalationLevels } from './GrievanceCategoryConstants';
import { GrievanceCategoryFormFields } from './GrievanceCategoryFormFields';
import { GrievanceCategoryFormActions } from './GrievanceCategoryFormActions';
import { useGrievanceCategoryForm } from '@/hooks/useGrievanceCategoryForm';
import type { GrievanceCategoryFormClientProps } from '@/types/grievance-category-master/grievanceCategory.types';

export function GrievanceCategoryFormClient({
  editingCategory,
  departments,
  locale,
  isEdit,
  translations,
  serverAction,
  returnPath: providedReturnPath,
}: GrievanceCategoryFormClientProps): ReactElement {
  const router = useRouter();
  const tMasterToast = useTranslations('grievanceCategory.master.toast');
  const tCommonButtons = useTranslations('common.buttons');
  const tList = useTranslations('grievanceCategory.list');
  const tPriorityOptions = useTranslations('grievanceCategory.options.priority');
  const tEscalationOptions = useTranslations('grievanceCategory.options.escalation');
  const tCommonNote = useTranslations('common.note');

  const t = useMemo(
    () => ({
      fields: { ...translations.fields },
      errors: { ...translations.errors },
      buttons: { ...translations.buttons, cancel: tCommonButtons('cancel') },
      toast: {
        ...translations.toast,
        createSuccess: tMasterToast('createSuccess'),
        updateSuccess: tMasterToast('updateSuccess'),
      },
    }),
    [translations, tCommonButtons, tMasterToast]
  );

  const {
    formData,
    fieldErrors,
    error,
    isSubmitting,
    hasChanges,
    returnPath,
    handleFieldChange,
    handleSubmit,
  } = useGrievanceCategoryForm({
    editingCategory,
    departments,
    locale,
    isEdit,
    returnPath: providedReturnPath,
    t,
    serverAction,
  });

  const departmentOptions = useMemo(
    () =>
      departments
        .filter((d) => d && d.departmentId)
        .map((dept) => ({
          label: dept.departmentName || `${tList('deptPrefix')} ${dept.departmentId}`,
          value: String(dept.departmentId),
        })),
    [departments, tList]
  );

  const priorityOptions = useMemo(
    () =>
      priorities.map((p) => ({
        label: getLocalizedPriorityLabel(p, tPriorityOptions),
        value: p,
      })),
    [tPriorityOptions]
  );

  const escalationOptions = useMemo(
    () =>
      escalationLevels.map((l) => ({
        label: getLocalizedEscalationLabel(l, tEscalationOptions),
        value: l,
      })),
    [tEscalationOptions]
  );

  return (
    <>
      <div className="p-6 pb-0">
        <ValidationMessage
          message={error || undefined}
          visible={!!error}
          type="error"
          className="mb-6 bg-transparent border-none px-0 py-0 shadow-none text-xs"
        />
      </div>
      <GrievanceCategoryFormFields
        formData={formData}
        fieldErrors={fieldErrors}
        onFieldChange={handleFieldChange}
        departmentOptions={departmentOptions}
        priorityOptions={priorityOptions}
        escalationOptions={escalationOptions}
        t={t}
        isEdit={isEdit}
        isSubmitting={isSubmitting}
        tCommonNote={tCommonNote}
      />
      <GrievanceCategoryFormActions
        onCancel={() => router.replace(returnPath)}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        isEdit={isEdit}
        hasChanges={hasChanges}
        t={t}
        canSave={departments.length > 0}
      />
    </>
  );
}
