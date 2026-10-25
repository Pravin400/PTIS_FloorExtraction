import type { EncroachmentLegalSectionProps } from '@/types/asset/municipal-Asset/asset-detail.types';
import React from 'react';
import { getTranslations } from 'next-intl/server';
import { SectionCard, InfoField } from './SectionCard';
import { AlertTriangle, Check } from 'lucide-react';
import { Badge } from '@/components/common';

export async function EncroachmentLegalSection({ data, locale }: EncroachmentLegalSectionProps): Promise<React.ReactElement> {
  const t = await getTranslations({ locale, namespace: 'asset-detail' });
  const isClean = data.encroachmentStatus?.toLowerCase() === 'clean';
  const isFully = data.encroachmentStatus?.toLowerCase() === 'fully encroached';

  const sectionIcon = isClean ? <Check className="w-3.5 h-3.5 text-white" /> : <AlertTriangle className="w-3.5 h-3.5 text-white" />;
  const sectionBgClass = isClean ? "bg-emerald-500" : isFully ? "bg-red-500" : "bg-orange-500";

  const badgeVariant = isClean ? "success" : isFully ? "destructive" : "warning";
  const badgeClass = isClean
    ? "!border-emerald-200 !bg-emerald-100 !text-emerald-700"
    : isFully
      ? "!border-red-200 !bg-red-100 !text-red-700"
      : "!border-orange-200 !bg-orange-100 !text-orange-700";

  return (
    <SectionCard
      title={t('encroachmentLegal')}
      titleIcon={sectionIcon}
      iconBgClass={sectionBgClass}
    >
      <div className="flex flex-col">
        <InfoField
          label={t('encroachmentLabel')}
          value={
            <Badge size="sm" variant={badgeVariant} className={`!h-auto !px-1.5 !py-0.5 !rounded !text-[9px] !font-black ${badgeClass}`}>
              {data.encroachmentStatus || '-'}
            </Badge>
          }
        />
        <InfoField label={t('encroachmentArea')} value={data.encroachmentArea} />
        <InfoField
          label={t('legalStatus')}
          value={
            <Badge size="sm" variant="default" className="!h-auto !px-1.5 !py-0.5 !rounded !text-[9px] !font-black !bg-blue-100 !text-blue-700 !border-blue-200">
              {data.legalStatus}
            </Badge>
          }
        />
        <InfoField label={t('legalSiteReviewDate')} value={data.legalSiteReviewDate} />
      </div>
    </SectionCard>
  );
}
