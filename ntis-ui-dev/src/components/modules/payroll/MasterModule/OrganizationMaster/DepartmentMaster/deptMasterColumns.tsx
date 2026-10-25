import { StatusBadge, TruncatedText } from '@/components/common';
import type { Column } from '@/components/common';
import type { DeptMasterItem } from '@/types/payroll/MasterModule';

/**
 * Returns the table column configuration for Department Master.
 *
 * @param t       - Translation function for column labels
 * @param tCommon - Translation function from useTranslations('common')
 * @returns Array of column definitions
 */
export function getDeptMasterColumns(
  t: (key: string) => string,
  tCommon: (key: string) => string
): Column<DeptMasterItem>[] {
  return [
    {
      key: 'departmentCode',
      label: t('form.fields.departmentCode'),
      width: '140px',
      render: (_, row) => (
        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 inline-block">
          {row.departmentCode}
        </span>
      ),
    },
    {
      key: 'departmentName',
      label: t('form.fields.departmentName'),
      render: (_, row) => (
        <span className="text-xs font-medium text-slate-800 break-words">
          {row.departmentName}
        </span>
      ),
    },
    {
      key: 'departmentNameMarathi',
      label: t('form.fields.departmentNameLocal'),
      render: (_, row) => (
        <span className="text-xs text-slate-700 break-words">
          {row.departmentNameMarathi || '—'}
        </span>
      ),
    },
    {
      key: 'description',
      label: t('form.fields.departmentDescription'),
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
      label: t('form.fields.status'),
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
