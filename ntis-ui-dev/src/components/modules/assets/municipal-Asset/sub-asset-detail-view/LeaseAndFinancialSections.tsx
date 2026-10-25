'use client';
import { useTranslations } from 'next-intl';
import React from 'react';
import { FileText, DollarSign } from 'lucide-react';
import { SectionCard, InfoField } from '../asset-detail-view/SectionCard';
import type { LeaseAndFinancialSectionsProps } from '@/types/asset/municipal-Asset/sub-asset-detail-ui.types';

export function LeaseRentDetailsSection({ data }: LeaseAndFinancialSectionsProps): React.ReactElement {
  const t = useTranslations('subAssetDetail');

  return (
    <SectionCard title={t('leaseRentDetails')} titleIcon={<FileText className="w-3.5 h-3.5 text-white" />}
      iconBgClass="bg-orange-500">
      <div className="flex flex-col">
        <InfoField label={t('agreementNo')} value={data.agreementNo} />
        <InfoField label={t('agreementDate')} value={data.agreementDate} />
        <InfoField label={t('leasePeriod')} value={data.leasePeriod} />
        <InfoField label={t('allotmentMethod')} value={data.allotmentMethod} />
        <InfoField label={t('allotmentDate')} value={data.allotmentDate} />
        <InfoField label={t('rentBasis')} value={data.rentBasis} />
        <InfoField label={t('revisionMethod')} value={data.revisionMethod} />
        <InfoField label={t('escalation')} value={data.escalation} />
        <InfoField label={t('nextRevisionDate')} value={data.nextRevisionDate} />
      </div>
    </SectionCard>
  );
}

export function FinancialDetailsSection({ data }: LeaseAndFinancialSectionsProps): React.ReactElement {
  const t = useTranslations('subAssetDetail');

  const fmt = (n: number) => `₹ ${n.toLocaleString('en-IN')}`;
  return (
    <SectionCard title={t('financialDetails')} titleIcon={<DollarSign className="w-3.5 h-3.5 text-white" />}
      iconBgClass="bg-green-500">
      <div className="flex flex-col">
        <InfoField label={data.rentFrequency?.toLowerCase() === 'yearly' ? t('rentAmountYearly') : t('rentAmountMonthly')} value={fmt(data.rentAmountMonthly)} />
        <InfoField label={t('securityDeposit')} value={fmt(data.securityDeposit)} />
        <InfoField label={t('sdMethod')} value={data.sdMethod} />
        <InfoField label={t('refundable')} value={data.refundable} />
        <InfoField label={t('gstApplicable')} value={data.gstApplicable} />
        <InfoField label={t('gstRate')} value={data.gstRate} />
        <InfoField label={t('otherCharges')} value={<span className="whitespace-pre-line">{data.otherCharges}</span>} />
        <InfoField label={t('billingCycle')} value={data.billingCycle} />
      </div>
    </SectionCard>
  );
}

