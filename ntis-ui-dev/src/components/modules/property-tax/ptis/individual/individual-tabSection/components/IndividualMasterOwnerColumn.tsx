'use client';

import React, { memo, useMemo } from 'react';
import { User, Tag, Store, Hash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { IndividualPropertyMasterData } from '@/types/property-tax/individual';
import { PropertyMasterInfoRow } from '@/components/modules/property-tax/ptis/apartment/apartment-tabSection/components/PropertyMasterInfoRow';
import { formatAadharNumber } from '@/lib/utils/format';

export interface IndividualMasterOwnerColumnProps {
  data?: IndividualPropertyMasterData;
}

export const IndividualMasterOwnerColumn: React.FC<IndividualMasterOwnerColumnProps> = memo(({ data }) => {
  const t = useTranslations('individual');

  const aadharValue = useMemo(() => {
    if (data?.aadharNo) {
      return formatAadharNumber(data.aadharNo);
    }
    if (data?.aadharWithTitle && data.aadharWithTitle !== '-') {
      const cleaned = data.aadharWithTitle.includes('/')
        ? data.aadharWithTitle.split('/')[0].trim()
        : data.aadharWithTitle.trim();
      if (/\d/.test(cleaned)) {
        return formatAadharNumber(cleaned);
      }
    }
    return '-';
  }, [data?.aadharNo, data?.aadharWithTitle]);

  const shopNameDisplay: string = useMemo(() => {
    const name =
      data?.shopName ||
      data?.shopNameRegional ||
      data?.flatOrShopName ||
      data?.flatOrShopNameEnglish;
    return typeof name === 'string' && name ? name : '-';
  }, [data?.shopName, data?.shopNameRegional, data?.flatOrShopName, data?.flatOrShopNameEnglish]);

  return (
    <div className="flex flex-col gap-1 md:border-r md:border-slate-100 md:pr-2.5 min-w-0 overflow-hidden">
      <PropertyMasterInfoRow
        icon={User}
        label={t('grid.ownerRegional') || 'Owner (Regional)'}
        value={data?.ownerNameRegional || data?.holderRegional || '-'}
        minWidth="min-w-[75px] lg:min-w-[80px] xl:min-w-[92px] 2xl:min-w-[115px]"
      />
      <PropertyMasterInfoRow
        icon={User}
        label={t('grid.occupierName') || 'Occupier Name'}
        value={data?.occupierName || '-'}
        minWidth="min-w-[75px] lg:min-w-[80px] xl:min-w-[92px] 2xl:min-w-[115px]"
      />
      <PropertyMasterInfoRow
        icon={User}
        label={t('grid.occupierRegional') || 'Occupier (Regional)'}
        value={data?.occupierNameRegional || data?.occupierRegional || '-'}
        minWidth="min-w-[75px] lg:min-w-[80px] xl:min-w-[92px] 2xl:min-w-[115px]"
      />
      <PropertyMasterInfoRow
        icon={Tag}
        label={t('grid.ownerCategory') || 'Owner Category'}
        value={data?.ownerCategory || '-'}
        minWidth="min-w-[75px] lg:min-w-[80px] xl:min-w-[92px] 2xl:min-w-[115px]"
      />
      <PropertyMasterInfoRow
        icon={Tag}
        label={t('grid.propertyCategory') || 'Property Category'}
        value={(data?.category || data?.propertyCategory || '-') as string}
        minWidth="min-w-[75px] lg:min-w-[80px] xl:min-w-[92px] 2xl:min-w-[115px]"
      />
      <PropertyMasterInfoRow
        icon={Store}
        label={t('grid.shopName') || 'Shop Name'}
        value={shopNameDisplay}
        minWidth="min-w-[75px] lg:min-w-[80px] xl:min-w-[92px] 2xl:min-w-[115px]"
      />
      <PropertyMasterInfoRow
        icon={Hash}
        label={t('grid.aadharNo') || t('grid.aadhar') || t('grid.aadharTitle') || 'Aadhar No.'}
        value={aadharValue}
        minWidth="min-w-[75px] lg:min-w-[80px] xl:min-w-[92px] 2xl:min-w-[115px]"
      />
    </div>
  );
});

IndividualMasterOwnerColumn.displayName = 'IndividualMasterOwnerColumn';
