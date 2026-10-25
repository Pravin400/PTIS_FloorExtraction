'use client';

import { useTranslations } from 'next-intl';
import {
  FloorDetailsReassessmentTable,
  type FloorDetailsReassessmentTableColumn,
  getFloorDetailCellClasses,
} from '@/components/common/FloorDetailsReassessmentTable';
import type { MappedFloorDetail } from '@/types/reassessment.types';
import type { SharedAutoScrollController } from '@/hooks/ptis/reassessment/useSharedAutoScroll';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

interface OldFloorDetailsProps {
  data: MappedFloorDetail[];
  scrollContainerRef?: React.Ref<HTMLDivElement>;
  autoScrollController?: SharedAutoScrollController;
}

export function OldFloorDetails({ data, scrollContainerRef,  autoScrollController, }: OldFloorDetailsProps) {
  const t = useTranslations('reassessment');

  const floorLabel = useAliasLabel('Floor', t('floorDetails.columns.floor'));
  const conYearLabel = useAliasLabel('Construction_Year', t('floorDetails.columns.conYear'));
  const asstYearLabel = useAliasLabel('Assessment', t('floorDetails.columns.asstYear'));
  const constTypeLabel = useAliasLabel('Construction_Type', t('floorDetails.columns.constType'));
  const useLabel = useAliasLabel('Use', t('floorDetails.columns.use'));
  const carpetAreaLabel = useAliasLabel('Carpet_Area', t('floorDetails.columns.carpetAreaSqFtM'));
  const builtUpAreaLabel = useAliasLabel('Builtup_Area', t('floorDetails.columns.builtUpAreaSqFtM'));

  const formatNumberish = (val: unknown): string =>
    typeof val === 'number' ? val.toLocaleString() : '-';

  const oldColumns: FloorDetailsReassessmentTableColumn[] = [
    {
      key: 'floor',
      label: floorLabel,
      width: '64px',
      align: 'center',
      cellClassName: 'font-bold',
      render: (_val, row) => (
        <div className={getFloorDetailCellClasses(row.status)}>{row.floor}</div>
      ),
    },
    // {
    //   key: 'type',
    //   label: t('floorDetails.columns.type'),
    //   width: '80px',
    //   align: 'center',
    //   render: (_val, row) => <div className={getFloorDetailCellClasses(row.status)}>{row.type ?? '-'}</div>,
    // },
    {
      key: 'conYear',
      label: conYearLabel,
      width: '96px',
      align: 'center',
      render: (_val, row) => (
        <div className={getFloorDetailCellClasses(row.status)}>{row.conYear}</div>
      ),
    },
    {
      key: 'asstYear',
      label: asstYearLabel,
      width: '96px',
      align: 'center',
      render: (_val, row) => (
        <div className={getFloorDetailCellClasses(row.status)}>{row.asstYear}</div>
      ),
    },
    {
      key: 'constType',
      label: constTypeLabel,
      width: '96px',
      align: 'center',
      cellClassName: 'font-bold text-sky-800',
      render: (_val, row) => (
        <div className={getFloorDetailCellClasses(row.status)}>{row.constType}</div>
      ),
    },
    {
      key: 'use',
      label: useLabel,
      width: '128px',
      align: 'center',
      cellClassName: 'text-emerald-700',
      render: (_val, row) => (
        <div className={getFloorDetailCellClasses(row.status)}>{row.use}</div>
      ),
    },
    {
      key: 'carpetAreaSqFt',
      label: carpetAreaLabel,
      width: '144px',
      align: 'center',
      cellClassName: 'text-emerald-700 font-mono',
      render: (_val, row) => <div className={getFloorDetailCellClasses(row.status)}>{row.carpetAreaSqFt} / {row.carpetAreaSqM}</div>,
    },
    {
      key: 'builtUpAreaSqFt',
      label: builtUpAreaLabel,
      width: '144px',
      align: 'center',
      cellClassName: 'text-emerald-700 font-mono',
      render: (_val, row) => <div className={getFloorDetailCellClasses(row.status)}>{row.builtUpAreaSqFt} / {row.builtUpAreaSqM}</div>,
    },
    {
      key: 'rate',
      label: t('floorDetails.columns.rateYearlyRate'),
      width: '144px',
      align: 'center',
      cellClassName: 'text-emerald-700 font-mono',
      render: (_val, row) => <div className={getFloorDetailCellClasses(row.status)}>{row.rate} / {row.yearlyRate}</div>,
    },
    // {
    //   key: 'financialYear',
    //   label: t('floorDetails.columns.financialYear'),
    //   width: '96px',
    //   align: 'center',
    //   render: (_val, row) => (
    //     <div className={getFloorDetailCellClasses(row.status)}>{row.financialYear}</div>
    //   ),
    // },
    {
      key: 'ocCertificateNo',
      label: t('floorDetails.columns.ocCertificateNo'),
      width: '160px',
      align: 'center',
      render: (_val, row) => (
        <div className={getFloorDetailCellClasses(row.status)}>{row.ocCertificateNo || '-'}</div>
      ),
    },
    {
      key: 'ocCertificateIssueDate',
      label: t('floorDetails.columns.ocCertificateIssueDate'),
      width: '160px',
      align: 'center',
      render: (_val, row) => (
        <div className={getFloorDetailCellClasses(row.status)}>{row.ocCertificateIssueDate || '-'}</div>
      ),
    },
    {
      key: 'ccCertificateNo',
      label: t('floorDetails.columns.ccCertificateNo'),
      width: '160px',
      align: 'center',
      render: (_val, row) => (
        <div className={getFloorDetailCellClasses(row.status)}>{row.ccCertificateNo || '-'}</div>
      ),
    },
    {
      key: 'ccCertificateIssueDate',
      label: t('floorDetails.columns.ccCertificateIssueDate'),
      width: '160px',
      align: 'center',
      render: (_val, row) => (
        <div className={getFloorDetailCellClasses(row.status)}>{row.ccCertificateIssueDate || '-'}</div>
      ),
    },
    {
      key: 'renter',
      label: t('floorDetails.columns.renter'),
      width: '144px',
      align: 'center',
      cellClassName: 'text-emerald-700',
      render: (_val, row) => (
        <div className={getFloorDetailCellClasses(row.status)}>{row.renter || t('floorDetails.values.selfOccupied')}</div>
      ),
    },
    {
      key: 'isRenter',
      label: t('floorDetails.columns.isRenter'),
      width: '96px',
      align: 'center',
      render: (_val, row) => <div className={getFloorDetailCellClasses(row.status)}>{row.isRenter == null ? '-' : row.isRenter ? t('floorDetails.values.yes') : t('floorDetails.values.no')}</div>,
    },
    {
      key: 'renterName',
      label: t('floorDetails.columns.renterName'),
      width: '144px',
      align: 'center',
      cellClassName: 'text-emerald-700',
      render: (_val, row) => <div className={getFloorDetailCellClasses(row.status)}>{row.renterName ?? '-'}</div>,
    },
    // {
    //   key: 'taxLiability',
    //   label: t('floorDetails.columns.taxLiability'),
    //   width: '128px',
    //   align: 'center',
    //   cellClassName: 'font-mono',
    //   render: (_val, row) => (
    //     <div className={getFloorDetailCellClasses(row.status)}>
    //       {formatTaxLiability(row.taxLiability)}
    //     </div>
    //   ),
    // },
    {
      key: 'rentMonthly',
      label: t('floorDetails.columns.rentMonthly'),
      width: '112px',
      align: 'center',
      cellClassName: 'font-mono',
      render: (_val, row) => (
        <div className={getFloorDetailCellClasses(row.status)}>{row.rentMonthly ?? '-'}</div>
      ),
    },
    {
      key: 'finalYearlyRent',
      label: t('floorDetails.columns.finalYearlyRent'),
      width: '128px',
      align: 'center',
      cellClassName: 'font-mono',
      render: (_val, row) => <div className={getFloorDetailCellClasses(row.status)}>{formatNumberish(row.finalYearlyRent)}</div>,
    },
    {
      key: 'rentalValue',
      label: t('floorDetails.columns.rentalValue'),
      width: '128px',
      align: 'center',
      cellClassName: 'text-emerald-700 font-bold font-mono',
      render: (_val, row) => (
        <div className={getFloorDetailCellClasses(row.status)}>
          {formatNumberish(row.rentalValue)}
        </div>
      ),
    },
    {
      key: 'depreciation',
      label: t('floorDetails.columns.depreciation'),
      width: '112px',
      align: 'center',
      cellClassName: 'text-emerald-700 font-mono',
      render: (_val, row) => (
        <div className={getFloorDetailCellClasses(row.status)}>{row.depreciation}</div>
      ),
    },
    {
      key: 'alv',
      label: t('floorDetails.columns.alv'),
      width: '128px',
      align: 'center',
      cellClassName: 'text-emerald-700 font-bold font-mono',
      render: (_val, row) => (
        <div className={getFloorDetailCellClasses(row.status)}>
          {formatNumberish(row.alv)}
        </div>
      ),
    },
    {
      key: 'mr',
      label: t('floorDetails.columns.maintenance'),
      width: '96px',
      align: 'center',
      cellClassName: 'text-emerald-700 font-mono',
      render: (_val, row) => (
        <div className={getFloorDetailCellClasses(row.status)}>{row.mr}</div>
      ),
    },
    {
      key: 'yearlyRent',
      label: t('floorDetails.columns.yearlyRent'),
      width: '128px',
      align: 'center',
      cellClassName: 'font-mono',
      render: (_val, row) => <div className={getFloorDetailCellClasses(row.status)}>{formatNumberish(row.yearlyRent)}</div>,
    },
    {
      key: 'rv',
      label: t('floorDetails.columns.rv'),
      width: '128px',
      align: 'center',
      cellClassName: 'text-emerald-700 font-bold font-mono',
      render: (_val, row) => (
        <div className={getFloorDetailCellClasses(row.status)}>
          {formatNumberish(row.rv)}
        </div>
      ),
    },
    {
      key: 'status',
      label: t('floorDetails.columns.status'),
      width: '96px',
      align: 'center',
      render: (_val, row) => (
        <div className={getFloorDetailCellClasses(row.status)}>
          {row.status === 'Unchanged'
            ? t('floorDetails.statuses.unchanged')
            : row.status === 'Added'
            ? t('floorDetails.statuses.added')
            : row.status === 'Removed'
            ? t('floorDetails.statuses.removed')
            : '-'}
        </div>
      ),
    },
  ];

  return (
    <div className="flex-grow flex flex-col min-w-0">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-bold text-[#2f5597]">{t('floorDetails.oldTitle')}</h4>
      </div>

      <div className="min-w-0">
        <FloorDetailsReassessmentTable
          columns={oldColumns}
          data={data}
          showScrollButtons={true}
          scrollContainerRef={scrollContainerRef}
          containerId="old-table-container"
          autoScrollController={autoScrollController}
          instanceId="old"
        />
      </div>
    </div>
  );
}