import type { MaintenanceSectionProps } from '@/types/asset/municipal-Asset/asset-detail.types';
import React from 'react';
import { getTranslations } from 'next-intl/server';
import { SectionCard, InfoField } from './SectionCard';
import { Wrench } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/common';

export async function MaintenanceSection({ data, locale }: MaintenanceSectionProps): Promise<React.ReactElement> {
  const t = await getTranslations({ locale, namespace: 'asset-detail' });
  return (
    <SectionCard
      title={t('maintenance')}
      titleIcon={<Wrench className="w-3.5 h-3.5 text-white" />} iconBgClass="bg-red-500"
    >
      <div className="flex flex-col">
        <InfoField label={t('lastMaintenance')} value={data.lastMaintenance} />
        <InfoField label={t('nextDue')} value={data.nextDue} />
        <InfoField
          label={t('workOrderStatus')}
          value={
            <Badge
              size="sm"
              variant={data.workOrderStatus === 'Open' ? 'warning' : 'secondary'}
              className={cn(
                '!h-auto !px-1.5 !py-0.5 !rounded !text-[9px] !font-black !border-transparent',
                data.workOrderStatus === 'Open'
                  ? '!bg-orange-100 !text-orange-700'
                  : '!bg-slate-100 !text-slate-600',
              )}
            >
              {data.workOrderStatus}
            </Badge>
          }
        />
        <InfoField
          label={t('maintenanceStatus')}
          value={
            <Badge size="sm" variant="success" className="!h-auto !px-1.5 !py-0.5 !rounded !text-[9px] !font-black !bg-green-100 !text-green-700 !border-transparent">
              {data.maintenanceStatus}
            </Badge>
          }
        />
      </div>
    </SectionCard>
  );
}
