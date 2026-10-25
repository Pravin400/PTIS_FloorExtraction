'use client';

import { Modal } from '@/components/common/Modal';
import { CancelButton } from '@/components/common/ActionButtons';
import { DashboardCard } from '@/components/common/DashboardCard';
import { MasterTable } from '@/components/common/MasterTable';
import { OperationPreviewResponse } from '@/types/addTaxes.types';

interface ExcelPreviewModalProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- next-intl translate functions
  t: any;
  isOpen: boolean;
  onClose: () => void;
  previewData: OperationPreviewResponse | null;
  previewPage: number;
  previewPageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isLoading?: boolean;
}

export function ExcelPreviewModal({
  t,
  isOpen,
  onClose,
  previewData,
  previewPage,
  previewPageSize,
  onPageChange,
  onPageSizeChange,
  isLoading
}: ExcelPreviewModalProps) {
  const previewColumns = [
    { key: 'zone', label: 'Zone', width: '15%' },
    {
      key: 'propertyNo',
      label: 'Property No',
      width: '20%',
      render: (_: unknown, record: unknown) => {
        const rec = record as { ward?: string; propertyNo?: string; partitionNo?: string };
        const ward = rec.ward || '';
        const propNo = rec.propertyNo || '';
        const partNo = rec.partitionNo || '';
        return `${ward}-${propNo}${partNo ? `-${partNo}` : ''}`;
      }
    },
    { key: 'owner', label: 'Owner', width: '25%' },
    {
      key: 'isEligible',
      label: 'Status',
      width: '15%',
      render: (val: boolean) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${val ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {val ? 'Eligible' : 'Skipped'}
        </span>
      )
    },
    {
      key: 'skipReason',
      label: 'Skip Reason',
      width: '25%',
      render: (val: string) => <div className="text-xs text-gray-500">{val ? (t.has(val) ? t(val) : val) : '-'}</div>
    }
  ];

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={t('preview.title')}
      subtitle={t('preview.subtitle')}
      maxWidth="2xl"
      footer={
        <div className="flex justify-end w-full">
          <CancelButton label={t('preview.close')} onClick={onClose} />
        </div>
      }
    >
      {previewData && (
        <div className="flex flex-col gap-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <DashboardCard
              label={t('preview.totalSelected')}
              value={previewData.totalSelected}
              valueColor="text-slate-800"
            />
            <DashboardCard
              label={t('preview.eligible')}
              value={previewData.eligible}
              valueColor="text-green-700"
            />
            <DashboardCard
              label={t('preview.skipped')}
              value={previewData.skipped}
              valueColor="text-red-700"
            />
            <DashboardCard
              label={t('preview.alreadyTaxed')}
              value={previewData.alreadyTaxed}
              valueColor="text-amber-700"
            />
          </div>

          {/* Records Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <MasterTable
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MasterTable expects generic Record structure index signature
              columns={previewColumns as any}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic list of preview records
              data={previewData.records as any}
              totalCount={previewData.totalSelected}
              pageNumber={previewPage}
              pageSize={previewPageSize}
              totalPages={Math.ceil(previewData.totalSelected / previewPageSize)}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              loading={isLoading}
              paginationConfig={{ enabled: true, showPageSizeSelector: true }}
              height="sm"
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
