'use client';

import { useTranslations } from 'next-intl';
import { Modal } from '@/components/common/Modal';
import { MasterTable } from '@/components/common';
import type { Column } from '@/components/common/MasterTable';
import type {
  MappedRetrospectiveColumn,
  MappedRetrospectiveRow,
} from '@/types/reassessment.types';
import { cn } from '@/lib/utils/cn';

interface RetrospectiveTaxModalProps {
  open: boolean;
  onClose: () => void;
  columns?: MappedRetrospectiveColumn[];
  rows?: MappedRetrospectiveRow[];
  error?: string;
}

const formatAmount = (value: unknown): string => {
  const numberValue = typeof value === 'number' ? value : Number(value ?? 0);
  return numberValue.toLocaleString('en-IN');
};

/**
 * Reusable compact bordered pill wrapper for cells
 */
const cellPill = (
  content: React.ReactNode,
  opts?: {
    align?: 'left' | 'center' | 'right';
    bold?: boolean;
    highlight?: boolean;
  }
) => {
  const { align = 'center', bold = false, highlight = false } = opts ?? {};
  return (
    <div
      className={cn(
        'border border-gray-300 shadow-sm rounded h-[20px] flex items-center transition-all duration-150 hover:border-blue-500 hover:shadow px-1.5',
        align === 'left' && 'justify-start',
        align === 'center' && 'justify-center',
        align === 'right' && 'justify-end',
        highlight ? 'bg-sky-50' : 'bg-blue-50'
      )}
    >
      <span
        className={cn(
          'font-mono text-[11px] leading-[18px] text-gray-900',
          bold && 'font-bold text-sky-900'
        )}
      >
        {content}
      </span>
    </div>
  );
};

export function RetrospectiveTaxModal({
  open,
  onClose,
  columns = [],
  rows = [],
  error,
}: RetrospectiveTaxModalProps) {
  const t = useTranslations('reassessment');

  const dynamicTaxColumns: Column<MappedRetrospectiveRow>[] = columns.map((column) => ({
    key: column.key,
    label: column.label,
    width: '90px',
    align: 'center',
    render: (value) => cellPill(formatAmount(value)),
  }));

  const retroTaxColumns: Column<MappedRetrospectiveRow>[] = [
    {
      key: 'financeYear',
      label: t('retrospectiveModal.columns.financeYear'),
      width: '95px',
      align: 'center',
      render: (value) =>
        cellPill(
          typeof value === 'string' || typeof value === 'number' ? value : '-',
          { bold: true }
        ),
    },
    {
      key: 'days',
      label: t('retrospectiveModal.columns.days'),
      width: '60px',
      align: 'center',
      render: (value) =>
        cellPill(typeof value === 'string' || typeof value === 'number' ? value : '-'),
    },
    ...dynamicTaxColumns,
    {
      key: 'total',
      label: t('retrospectiveModal.columns.total'),
      width: '90px',
      align: 'right',
      headerClassName: 'whitespace-nowrap',
      render: (value) => cellPill(formatAmount(value), { align: 'right', bold: true, highlight: true }),
    },
  ];

  const modalFooter = (
    <button
      onClick={onClose}
      className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg border border-gray-200 hover:bg-gray-200 transition-colors"
    >
      {t('buttons.close')}
    </button>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('retrospectiveModal.title')}
      subtitle={t('retrospectiveModal.subtitle')}
      maxWidth="2xl"
      footer={modalFooter}
    >
      <div className="border-2 border-[#2f5597] rounded-lg overflow-hidden shadow-sm bg-[#eef4fa]">
        <div className="min-w-0 p-2">
          {error ? (
            <div className="px-4 py-8 text-center text-sm text-red-600">{error}</div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              {t('retrospectiveModal.noData')}
            </div>
          ) : (
            <MasterTable
              columns={retroTaxColumns}
              data={rows}
              paginationConfig={{ enabled: false }}
              tableClassName="w-full text-[11px] font-medium border-separate border-spacing-x-[3px] border-spacing-y-[2px]"
              theadClassName={cn(
                'bg-[#e8eef5] text-black font-bold',
                '[&_th]:bg-[#dbe5f0] [&_th]:border [&_th]:border-[#a9b8cc] [&_th]:rounded [&_th]:shadow-sm',
                '[&_th]:px-1.5 [&_th]:py-[3px] [&_th]:whitespace-nowrap [&_th]:text-[11px]',
                '[&_th]:text-[#2f4256] [&_th]:font-bold'
              )}
              rowClassName={() =>
                cn(
                  'text-gray-700 font-semibold transition-colors',
                  '[&_td]:px-0.5 [&_td]:py-[2px]'
                )
              }
              height="xl"
            />
          )}
        </div>
      </div>
    </Modal>
  );
}