import { StatusBadge, TruncatedText } from '@/components/common';
import type { Column } from '@/components/common';
import type { DesignationMasterItem } from '@/types/payroll/MasterModule';

/**
 * Returns the table column configuration for Designation Master.
 *
 * @param t       - Translation function for column labels
 * @param tCommon - Translation function from useTranslations('common')
 * @returns Array of column definitions
 */
export function getDesignationMasterColumns(
  t: (key: string) => string,
  tCommon: (key: string) => string
): Column<DesignationMasterItem>[] {
  return [
    {
      key: 'designationCode',
      label: t('form.fields.designationCode.label'),
      width: '140px',
      render: (_, row) => (
        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 inline-block">
          {row.designationCode || row.designationId}
        </span>
      ),
    },
    {
      key: 'designationName',
      label: t('form.fields.designationName.label'),
      render: (_, row) => (
        <span className="text-xs font-medium text-slate-800 break-words">
          {row.designationName}
        </span>
      ),
    },
    {
      key: 'designationNameMarathi',
      label: t('form.fields.designationLocal.label'),
      render: (_, row) => (
        <span className="text-xs text-slate-700 break-words">
          {row.designationNameMarathi || '—'}
        </span>
      ),
    },
    {
      key: 'description',
      label: t('form.fields.designationDescription.label'),
      render: (_, row) => (
        <TruncatedText
          text={row.description || '—'}
          maxLength={60}
          className="text-xs text-slate-600"
        />
      ),
    },
    {
      key: 'isActive',
      label: t('form.status.label'),
      align: 'center',
      width: '120px',
      render: (_, row) => (
        <StatusBadge
          value={row.isActive}
          activeLabel={tCommon('status.active')}
          inactiveLabel={tCommon('status.inactive')}
        />
      ),
    },
  ];
}
