'use client';
import type { AssetFloorSubmissionSectionProps } from '@/types/asset/municipal-Asset/asset-detail.types';
import React, { useState } from 'react';
import { SectionCard } from './SectionCard';
import type { FloorSubmission } from '@/types/asset/municipal-Asset/asset-detail.types';
import { MasterTable } from '@/components/common';
import type { Column } from '@/components/common';
import { Badge } from '@/components/common';
import { Layers } from 'lucide-react';
import { useTranslations } from 'next-intl';
export function AssetFloorSubmissionSection({ data }: AssetFloorSubmissionSectionProps): React.ReactElement {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalItems = data.floorSubmissions.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const visibleRows = data.floorSubmissions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const t = useTranslations('asset-detail');

  const columns: Column<FloorSubmission>[] = [
    { key: 'srNo', label: t('sNo'), render: (_, r) => <span className="font-medium text-blue-700">{r.srNo}</span> },
    { key: 'floor', label: t('floorCol'), render: (_, r) => <span className="font-medium text-blue-700 whitespace-nowrap">{r.floor}</span> },
    { key: 'subFloor', label: t('subFloorCol'), render: (_, r) => <span className="font-medium text-blue-700">{r.subFloor}</span> },
    { key: 'conYr', label: t('yearOfConstruction'), render: (_, r) => <span className="font-medium text-blue-700">{r.conYr}</span> },
    { key: 'asstYr', label: t('asstYrCol'), render: (_, r) => <span className="font-medium text-blue-700">{r.asstYr}</span> },
    { key: 'conType', label: t('constructionType'), render: (_, r) => <span className="font-medium text-blue-700 whitespace-nowrap">{r.conType}</span> },
    { key: 'typeOfUse', label: t('typeOfUseCol'), render: (_, r) => <span className="font-medium text-blue-700 whitespace-nowrap">{r.typeOfUse}</span> },
    { key: 'subTypeOfUse', label: t('subTypeOfUseCol'), render: (_, r) => <span className="font-medium text-blue-700 whitespace-nowrap">{r.subTypeOfUse}</span> },
    {
      key: 'renter', label: t('renterCol'), render: (_, r) => (
        <Badge variant="secondary" size="sm" className="text-[8px] px-1.5 py-0.5 justify-center">
          {r.renter}
        </Badge>
      )
    },
    { key: 'rooms', label: t('roomsCol'), render: (_, r) => <span className="font-medium text-blue-700">{r.rooms}</span> },
    { key: 'carpetArea', label: t('carpetAreaSqm'), render: (_, r) => <span className="font-medium text-blue-700">{r.carpetArea}</span> },
    { key: 'builtupArea', label: t('builtupAreaSqm'), render: (_, r) => <span className="font-medium text-blue-700">{r.builtupArea}</span> },
    { key: 'sdrr', label: t('rrRateSqm'), render: (_, r) => <span className="font-medium text-blue-700">{r.sdrr}</span> },
    { key: 'baseValue', label: t('baseValueRs'), render: (_, r) => <span className="font-medium text-blue-700">{r.baseValue}</span> },
    { key: 'floorFactor', label: t('floorFactorCol'), render: (_, r) => <span className="font-medium text-blue-700">{r.floorFactor}</span> },
    { key: 'ageFactor', label: t('ageFactorCol'), render: (_, r) => <span className="font-medium text-blue-700">{r.ageFactor}</span> },
    { key: 'ntbFactor', label: t('ntbFactorCol'), render: (_, r) => <span className="font-medium text-blue-700">{r.ntbFactor}</span> },
    { key: 'useFactor', label: t('useFactorCol'), render: (_, r) => <span className="font-medium text-blue-700">{r.useFactor}</span> },
    { key: 'capitalValue', label: t('capitalValueRs'), render: (_, r) => <span className="font-bold text-blue-900">{r.capitalValue}</span> },
  ];

  return (
    <SectionCard
      title={t('floorWiseTitle')}
      titleIcon={<Layers className="w-3.5 h-3.5 text-white" />}
      iconBgClass="bg-blue-500"
    >
      <MasterTable
        data={visibleRows}
        columns={columns}
        containerClassName="!gap-0"
        tableClassName="!min-w-[1200px]"
        theadClassName="!bg-none !bg-[#002D62] [&_th]:!text-white [&_th]:!text-center [&_th]:!font-bold [&_th]:!px-1.5 [&_th]:!py-1 [&_th]:!text-[10px] [&_th]:!border-r [&_th]:!border-[#004080] [&_th]:last:!border-r-0 [&_th]:!uppercase [&_th]:!tracking-normal"
        rowClassName={() => "!bg-white !border-b !border-blue-100 hover:!bg-blue-50 !transition-colors [&_td]:!px-1.5 [&_td]:!py-1.5 [&_td]:!text-[13px] [&_td]:!leading-tight [&_td]:!text-center [&_td]:!border-r [&_td]:!border-blue-50 [&_td]:last:!border-r-0"}
        footerClassName="!py-2 !px-3"
        footerLeftClassName="[&_select]:!h-7 [&_select]:!text-[11px] [&_select]:!py-0 [&_span]:!text-[11px]"
        footerRightClassName="[&_button]:!h-7 [&_button]:!min-w-[28px] [&_button]:!w-auto [&_button]:!px-2 [&_button]:!text-[11px] [&_button_svg]:!w-4 [&_button_svg]:!h-4 [&_span]:!text-[11px]"
        pageNumber={currentPage}
        pageSize={pageSize}
        totalCount={totalItems}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        pageSizeOptions={[5, 10, 20, 50]}
        paginationConfig={{ enabled: true, showPageSizeSelector: true }}
      />
    </SectionCard>
  );
}
