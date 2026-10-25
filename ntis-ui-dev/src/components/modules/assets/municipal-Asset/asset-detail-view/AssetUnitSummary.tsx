'use client';
import Image from 'next/image';
import type { UnitSummarySectionProps } from '@/types/asset/municipal-Asset/asset-detail.types';
import { useTranslations } from 'next-intl';

import React, { useState } from 'react';
import { SectionCard } from './SectionCard';
import type { ShopUnit } from '@/types/asset/municipal-Asset/asset-detail.types';
import { Store, Eye, Camera } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useRouter, useParams } from 'next/navigation';
import { getViewDocumentUrl } from '@/lib/utils/document-utils';
import { MasterTable } from '@/components/common';
import { Badge } from '@/components/common';
import { Button } from '@/components/common';
import type { Column } from '@/components/common';



function OccupancyBadge({ status }: { status: ShopUnit['occupancyStatus'] }): React.ReactElement {
  const t = useTranslations('asset-detail');
  const isOccupied = status?.toLowerCase() === 'occupied' || status?.toLowerCase() === 'rented' || status?.toLowerCase() === 'lease' || status?.toLowerCase() === 'leased';

  let displayStatus = status || '-';
  if (isOccupied) {
    displayStatus = t('occupied') || 'Rented';
  } else if (status?.toLowerCase() === 'vacant') {
    displayStatus = t('vacant') || 'Vacant';
  }

  return (
    <Badge
      variant={isOccupied ? 'success' : 'destructive'}
      size="sm"
      className="text-[9px] min-w-[60px] justify-center"
    >
      {displayStatus}
    </Badge>
  );
}

export function UnitSummarySection({ data }: UnitSummarySectionProps): React.ReactElement {
  const t = useTranslations('asset-detail');
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'en';

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(3);

  const totalShops = data.totalShops;
  const totalPages = Math.max(1, Math.ceil(data.shopUnits.length / pageSize));

  const startIdx = (currentPage - 1) * pageSize;
  const visibleRows = data.shopUnits.slice(startIdx, startIdx + pageSize);





  const handleViewSubAsset = (subAssetId: string | number) => {
    router.push(`/${locale}/assets/municipal-Asset/sub-asset-detail-view/${subAssetId}`);

  };

  const columns: Column<ShopUnit>[] = [
    { key: 'sNo', label: t('sNo'), render: (_, r) => <span className="font-medium text-blue-700">{r.sNo}</span> },
    { key: 'shopNo', label: t('shopNo'), render: (_, r) => <span className="font-medium text-blue-700">{r.shopNo}</span> },
    { key: 'floor', label: t('floor'), render: (_, r) => <span className="font-medium text-blue-700">{r.floor}</span> },
    { key: 'shopArea', label: t('shopArea'), render: (_, r) => <span className="font-medium text-blue-700">{r.floorArea.toFixed(2)}</span> },
    { key: 'usage', label: t('usageCol'), render: (_, r) => <span className="font-medium text-blue-700">{r.usage}</span> },
    { key: 'tenantName', label: t('tenantName'), render: (_, r) => <span className="font-medium text-blue-700 whitespace-nowrap">{r.tenantName}</span> },
    { key: 'contactNo', label: t('contactNo'), render: (_, r) => <span className="font-medium text-blue-700">{r.contactNo}</span> },
    { key: 'monthlyRent', label: t('monthlyRent'), render: (_, r) => <span className="font-medium text-blue-700">{r.monthlyRent.toLocaleString('en-IN')}</span> },
    { key: 'arrears', label: t('arrearsCol'), render: (_, r) => <span className="font-medium text-blue-700">{r.arrears.toLocaleString('en-IN')}</span> },
    { key: 'occupancyStatus', label: t('occupancyStatus'), render: (_, r) => <OccupancyBadge status={r.occupancyStatus} /> },
    {
      key: 'agreementEnd', label: t('agreementEnd'), render: (_, r) => (
        <span className={cn('font-bold', r.isAgreementExpired ? 'text-red-600' : 'text-[#285aa5]')}>
          {r.agreementEnd}
        </span>
      )
    },
    {
      key: 'shopPhoto', label: t('shopPhoto'), render: (_, r) => {
        if (r.assetPhotoGuid) {
          return (
            <div className="flex justify-center w-full">
              <Image unoptimized
                src={getViewDocumentUrl(r.assetPhotoGuid)}
                alt={`Shop ${r.shopNo}`}
                width={32} height={20} className="object-cover rounded shadow-sm"
                onError={(e) => {
                  // Fallback to camera icon if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  e.currentTarget.nextElementSibling?.classList.add('flex');
                }}
              />
              <div className="w-8 h-5 bg-slate-100 items-center justify-center rounded shadow-sm hidden">
                <Camera className="w-3 h-3 text-slate-400" />
              </div>
            </div>
          );
        }
        return (
          <div className="flex justify-center w-full">
            <div className="w-8 h-5 bg-slate-100 flex items-center justify-center rounded shadow-sm">
              <Camera className="w-3 h-3 text-slate-400" />
            </div>
          </div>
        );
      }
    },
    {
      key: 'actions', label: t('actions'), render: (_, r) => (
        <Button
          variant="ghost"
          className="text-[#285aa5] hover:text-blue-700 transition-colors flex items-center justify-center mx-auto !w-7 !h-7 !min-w-0 !p-0"
          aria-label={`View ${r.shopNo}`}
          onClick={() => handleViewSubAsset(r.subAssetId || r.shopNo)}
        >
          <Eye className="w-3.5 h-3.5" />
        </Button>
      )
    }
  ];

  return (
    <SectionCard
      title={t('unitSubAssetSummary')}
      titleIcon={<Store className="w-3.5 h-3.5 text-white" />} iconBgClass="bg-indigo-500"
    >
      <MasterTable
        data={visibleRows}
        columns={columns}
        containerClassName="!gap-0"
        tableClassName="!min-w-[1200px]"
        theadClassName="!bg-none !bg-[#002D62] [&_th]:!text-white [&_th]:!text-center [&_th]:!font-bold [&_th]:!px-1.5 [&_th]:!py-1 [&_th]:!text-[10px] [&_th]:!border-r [&_th]:!border-[#004080] [&_th]:last:!border-r-0 [&_th]:!uppercase [&_th]:!tracking-normal"
        rowClassName={() => "!bg-white !border-b !border-blue-100 hover:!bg-blue-50 !transition-colors [&_td]:!px-1.5 [&_td]:!py-1 [&_td]:!text-[11px] [&_td]:!leading-tight [&_td]:!text-center [&_td]:!border-r [&_td]:!border-blue-50 [&_td]:last:!border-r-0"}
        footerClassName="!py-1.5 !px-3"
        footerLeftClassName="[&_select]:!h-6 [&_select]:!text-[10px] [&_select]:!py-0 [&_span]:!text-[10px]"
        footerRightClassName="[&_button]:!h-6 [&_button]:!min-w-[24px] [&_button]:!w-auto [&_button]:!px-1.5 [&_button]:!text-[10px] [&_button_svg]:!w-3.5 [&_button_svg]:!h-3.5 [&_span]:!text-[10px]"
        pageNumber={currentPage}
        pageSize={pageSize}
        totalCount={totalShops}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        paginationConfig={{ enabled: true, showPageSizeSelector: false }}
      />
    </SectionCard>
  );
}

