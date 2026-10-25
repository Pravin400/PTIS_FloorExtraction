'use client';
import { useTranslations } from 'next-intl';
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { SectionCard, InfoField } from '../asset-detail-view/SectionCard';
import { Badge, Button } from '@/components/common';
import type { SubAssetStatusSectionsProps } from '@/types/asset/municipal-Asset/sub-asset-detail-ui.types';

export function SubAssetMaintenanceSection({ data }: SubAssetStatusSectionsProps): React.ReactElement {
  const t = useTranslations('subAssetDetail');

  return (
    <SectionCard title={t('maintenanceInspection')}
      titleIcon={<svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>}
      iconBgClass="bg-cyan-500"
      headerRight={
        <Button variant="outline" size="xs" className="!text-[9px] font-bold !text-blue-600 border border-blue-200 bg-white !rounded-full !px-2 !h-4 hover:bg-blue-50 transition-colors no-underline hover:no-underline">
          {t('viewAll')}
        </Button>
      }>
      <div className="flex flex-col">
        <InfoField label={t('lastInspection')} value={data.lastInspection} />
        <InfoField label={t('nextDueDate')} value={<span className="text-blue-600 font-black">{data.nextDueDate}</span>} />
        <InfoField label={t('inspectionStatus')} value={
          data.inspectionStatus ? (
            <Badge 
              variant={data.inspectionStatus.toLowerCase() === 'overdue' || data.inspectionStatus.toLowerCase() === 'non-compliant' ? 'destructive' : (data.inspectionStatus.toLowerCase() === 'compliant' || data.inspectionStatus.toLowerCase() === 'completed' ? 'success' : 'default')} 
              size="sm" 
              className="!px-1.5 !py-0.5 !text-[8px] !h-auto border">
              {data.inspectionStatus}
            </Badge>
          ) : "-"
        } />
      </div>
    </SectionCard>
  );
}

export function SubAssetEncroachmentSection({ data }: SubAssetStatusSectionsProps): React.ReactElement {
  const t = useTranslations('subAssetDetail');

  return (
    <SectionCard title={t('encroachmentLegal')}
      titleIcon={<AlertTriangle className="w-3.5 h-3.5 text-white" />}
      iconBgClass="bg-amber-500"
      headerRight={
        <Button variant="outline" size="xs" className="!text-[9px] font-bold !text-blue-600 border border-blue-200 bg-white !rounded-full !px-2 !h-4 hover:bg-blue-50 transition-colors no-underline hover:no-underline">
          {t('viewAll')}
        </Button>
      }>
      <div className="flex flex-col">
        <InfoField label={t('encroachmentLabel')} value={
          data.encroachment ? (
            <Badge 
              variant={data.encroachment.toLowerCase() === 'yes' || data.encroachment.toLowerCase() === 'encroached' ? 'destructive' : (data.encroachment.toLowerCase() === 'no' || data.encroachment.toLowerCase() === 'clear' ? 'success' : 'default')} 
              size="sm" 
              className="!px-1.5 !py-0.5 !text-[8px] !h-auto border">
              {data.encroachment}
            </Badge>
          ) : "-"
        } />
        <InfoField label={t('legalStatusLabel')} value={
          data.legalStatus ? (
            <Badge variant="default" size="sm" className="!px-1.5 !py-0.5 !text-[8px] !h-auto border border-blue-200 bg-blue-100 text-blue-700">
              {data.legalStatus}
            </Badge>
          ) : "-"
        } />
        <InfoField label={t('lastReviewLabel')} value={data.lastReview} />
      </div>
    </SectionCard>
  );
}

