'use client';
import type { AdditionalDetailsSectionProps } from '@/types/asset/municipal-Asset/asset-detail.types';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import { SectionCard, InfoField } from './SectionCard';
import { Button } from '@/components/common';
import { Info } from 'lucide-react';
import { Modal } from '@/components/common';

export function AdditionalDetailsSection({ data }: AdditionalDetailsSectionProps): React.ReactElement {
  const t = useTranslations('asset-detail');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fields = data.backendConfiguredFields || [];
  const previewFields = fields.slice(0, 7);
  const hasMore = fields.length > 7;

  return (
    <>
      <SectionCard
        title={t('additionalDetails')}
        titleIcon={<Info className="w-3.5 h-3.5 text-white" />}
        iconBgClass="bg-teal-500"
        headerRight={
          hasMore ? (
            <Button
              variant="secondary"
              className="!text-[9px] !font-bold !text-blue-600 !border-blue-200 !bg-white !rounded-full !px-2 !h-4 flex items-center hover:!bg-blue-50 transition-colors"
              onClick={() => setIsModalOpen(true)}
              aria-label={t('viewAll')}
            >
              {t('viewAll')}
            </Button>
          ) : undefined
        }
      >
        <div className="flex flex-col h-full">
          {previewFields.length > 0 ? (
            previewFields.map((field, idx) => (
              <InfoField
                key={idx}
                label={field.label}
                value={field.value}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full min-h-[80px] text-slate-400">
              <Info className="w-8 h-8 mb-2 opacity-20" />
              <span className="text-[10px] font-medium">{t('noAdditionalDetails')}</span>
            </div>
          )}
        </div>
      </SectionCard>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('additionalDetails')}
        maxWidth="md"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 p-2">
          {fields.map((field, idx) => (
            <InfoField
              key={idx}
              label={field.label}
              value={field.value}
            />
          ))}
        </div>
      </Modal>
    </>
  );
}
