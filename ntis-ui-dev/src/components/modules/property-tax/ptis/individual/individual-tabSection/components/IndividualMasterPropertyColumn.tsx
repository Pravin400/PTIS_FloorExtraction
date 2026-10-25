'use client';

import React, { memo, useMemo } from 'react';
import { MapPin, Compass, Landmark, Crosshair, FileSpreadsheet, Grid, Layers } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { IndividualPropertyMasterData } from '@/types/property-tax/individual';
import { PropertyMasterInfoRow } from '@/components/modules/property-tax/ptis/apartment/apartment-tabSection/components/PropertyMasterInfoRow';

export interface IndividualMasterPropertyColumnProps {
  data?: IndividualPropertyMasterData;
}

export const IndividualMasterPropertyColumn: React.FC<IndividualMasterPropertyColumnProps> = memo(
  ({ data }) => {
    const t = useTranslations('individual');

    const taxZoneDisplay = useMemo(() => {
      const zoneNo = data?.taxZoneNo?.trim();
      if (zoneNo && zoneNo !== '-') {
        return zoneNo.replace(/^zone\s*[-_]?\s*/i, '') || zoneNo;
      }
      const rawZone = data?.taxZone?.trim();
      if (rawZone && rawZone !== '-') {
        const pureZone = rawZone.split(' - ')[0]?.trim();
        if (pureZone) {
          return pureZone.replace(/^zone\s*[-_]?\s*/i, '') || pureZone;
        }
      }
      return '-';
    }, [data?.taxZone, data?.taxZoneNo]);

    const plotOrUnitDisplay = useMemo(() => {
      if (data?.flatOrShopNo && data?.plotNo && data.plotNo !== '-') {
        return `${data.plotNo} (Unit: ${data.flatOrShopNo})`;
      }
      return data?.plotNo || data?.flatOrShopNo || '-';
    }, [data?.plotNo, data?.flatOrShopNo]);

    const subZoneDisplay: string = useMemo(() => {
      const sz = data?.subZoneNo || data?.subZone;
      return typeof sz === 'string' && sz ? sz : '-';
    }, [data?.subZoneNo, data?.subZone]);

    return (
      <div className="flex flex-col gap-1 md:border-r md:border-slate-100 md:pr-2.5 min-w-0 overflow-hidden">
        <PropertyMasterInfoRow
          icon={MapPin}
          label={t('grid.division') || 'Division'}
          value={data?.division || '-'}
          minWidth="min-w-[65px] lg:min-w-[70px] xl:min-w-[78px] 2xl:min-w-[95px]"
        />
        <PropertyMasterInfoRow
          icon={Compass}
          label={t('grid.subZoneNo') || 'Sub Zone No.'}
          value={subZoneDisplay}
          minWidth="min-w-[65px] lg:min-w-[70px] xl:min-w-[78px] 2xl:min-w-[95px]"
        />
        <PropertyMasterInfoRow
          icon={Landmark}
          label={t('grid.moujaName') || 'Mouja Name'}
          value={data?.moujaName || '-'}
          minWidth="min-w-[65px] lg:min-w-[70px] xl:min-w-[78px] 2xl:min-w-[95px]"
        />
        <PropertyMasterInfoRow
          icon={Layers}
          label={t('grid.rateSectionName') || 'Rate Section Name'}
          value={data?.rateSectionName || '-'}
          minWidth="min-w-[65px] lg:min-w-[70px] xl:min-w-[78px] 2xl:min-w-[95px]"
        />
        <PropertyMasterInfoRow
          icon={Crosshair}
          label={t('grid.surveyNo') || 'Survey No.'}
          value={data?.surveyNo || '-'}
          minWidth="min-w-[65px] lg:min-w-[70px] xl:min-w-[78px] 2xl:min-w-[95px]"
        />
        <PropertyMasterInfoRow
          icon={FileSpreadsheet}
          label={t('grid.taxZoneNo') || t('grid.taxZone') || 'Tax Zone No.'}
          value={taxZoneDisplay}
          minWidth="min-w-[65px] lg:min-w-[70px] xl:min-w-[78px] 2xl:min-w-[95px]"
        />
        <PropertyMasterInfoRow
          icon={Grid}
          label={t('grid.plotNo') || 'Plot No.'}
          value={plotOrUnitDisplay}
          minWidth="min-w-[65px] lg:min-w-[70px] xl:min-w-[78px] 2xl:min-w-[95px]"
        />
      </div>
    );
  }
);

IndividualMasterPropertyColumn.displayName = 'IndividualMasterPropertyColumn';
