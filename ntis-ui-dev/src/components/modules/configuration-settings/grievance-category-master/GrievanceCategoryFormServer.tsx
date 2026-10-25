/**
 * Grievance Category Form Server Component
 *
 * Server-rendered form for creating/editing grievance categories.
 * Uses server actions for form submission and validation.ts for server-side validation.
 *
 * @module GrievanceCategoryFormServer
 */
import type { ReactElement } from 'react';
import { getTranslations } from 'next-intl/server';
import {
  createGrievanceCategoryAction,
  updateGrievanceCategoryAction,
} from '@/app/[locale]/configuration-settings/grievance-category-master/actions';
import type { GrievanceCategoryFormServerProps } from '@/types/grievance-category-master/grievanceCategory.types';
import { GrievanceCategoryFormClient } from './GrievanceCategoryForm';

/**
 * GrievanceCategoryFormServer Component
 *
 * Server component that prepares translations, action binding, and
 * delegates interactive form rendering to GrievanceCategoryFormClient.
 */
export async function GrievanceCategoryFormServer({
  editingCategory,
  departments,
  locale,
  returnPath,
}: GrievanceCategoryFormServerProps): Promise<ReactElement> {
  const t = await getTranslations({ locale, namespace: 'grievanceCategory.form' });
  const tMaster = await getTranslations({ locale, namespace: 'grievanceCategory.master' });
  const tCommonButtons = await getTranslations({ locale, namespace: 'common.buttons' });

  const isEdit = editingCategory !== null;

  // Build translated labels for client form
  const translations = {
    fields: {
      code: t('fields.code'),
      codePlaceholder: t('fields.codePlaceholder'),
      department: t('fields.department'),
      departmentPlaceholder: t('fields.departmentPlaceholder'),
      name: t('fields.name'),
      namePlaceholder: t('fields.namePlaceholder'),
      priority: t('fields.priority'),
      priorityPlaceholder: t('fields.priorityPlaceholder'),
      sla: t('fields.sla'),
      slaPlaceholder: t('fields.slaPlaceholder'),
      escalation: t('fields.escalation'),
      escalationPlaceholder: t('fields.escalationPlaceholder'),
      description: t('fields.description'),
      descPlaceholder: t('fields.descPlaceholder'),
      active: t('fields.active'),
      activeDesc: t('fields.activeDesc'),
      missingDepartment: t('fields.missingDepartment', { id: 0 }),
      idLabel: t('fields.idLabel'),
    },
    errors: {
      codeReq: t('errors.codeReq'),
      codeMinLength: t('errors.codeMinLength'),
      codeAlphanumeric: t('errors.codeAlphanumeric'),
      codeMaxLength: t('errors.codeMaxLength'),
      nameReq: t('errors.nameReq'),
      nameMinLength: t('errors.nameMinLength'),
      nameMaxLength: t('errors.nameMaxLength'),
      descMinLength: t('errors.descMinLength'),
      descMaxLength: t('errors.descMaxLength'),
      slaReq: t('errors.slaReq'),
      slaPositiveInteger: t('errors.slaPositiveInteger'),
      slaMaxLength: t('errors.slaMaxLength'),
      slaMaxDays: t('errors.slaMaxDays'),
      departmentReq: t('errors.departmentReq'),
      invalidDept: t('errors.invalidDept'),
      noDepartments: t('errors.noDepartments'),
      operationFailed: t('errors.operationFailed'),
      unexpected: t('errors.unexpected'),
      invalidFormat: t('errors.invalidFormat'),
      invalidPriority: t('errors.invalidPriority'),
      invalidEscalation: t('errors.invalidEscalation'),
      invalidId: t('errors.invalidId'),
      invalidLocale: t('errors.invalidLocale'),
      createError: t('errors.createError'),
      updateError: t('errors.updateError'),
    },
    buttons: {
      cancel: tCommonButtons('cancel'),
      save: t('buttons.save'),
      update: t('buttons.update'),
      add: t('buttons.add'),
    },
    toast: {
      createSuccess: tMaster('toast.createSuccess'),
      updateSuccess: tMaster('toast.updateSuccess'),
    },
  };

  // Bind the server action
  const boundAction = isEdit
    ? updateGrievanceCategoryAction.bind(null, locale)
    : createGrievanceCategoryAction.bind(null, locale);

  return (
    <GrievanceCategoryFormClient
      editingCategory={editingCategory}
      departments={departments}
      locale={locale}
      isEdit={isEdit}
      translations={translations}
      serverAction={boundAction}
      returnPath={returnPath}
    />
  );
}
