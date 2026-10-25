import type { Column } from '@/components/common/MasterTable';
import type { EmpClassMasterItem } from '@/types/payroll/MasterModule';
import { StatusBadge, TruncatedText } from '@/components/common';

export function getEmpClassColumns(
  t: (key: string) => string,
  tCommon: (key: string) => string
): Column<EmpClassMasterItem>[] {
  return [
    {
      key: 'classCode',
      label: t('table.columns.classCode'),
      width: '140px',
      render: (_, row) => (
        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 inline-block">
          {row.classCode}
        </span>
      ),
    },
    {
      key: 'className',
      label: t('table.columns.className'),
      render: (_, row) => (
        <span className="text-xs font-medium text-slate-800 break-words">{row.className}</span>
      ),
    },
    {
      key: 'classNameMarathi',
      label: t('drawer.labels.classNameLocal'),
      render: (_, row) => (
        <span className="text-xs text-slate-700 break-words">{row.classNameMarathi || '—'}</span>
      ),
    },
    {
      key: 'description',
      label: t('table.columns.description'),
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
      label: t('table.columns.status'),
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
