'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Label, Select } from '@/components/common';
import type { Option } from '@/components/common';
import type { EncroachmentStatusType } from '@/types/asset/asset-register/municipal-asset-service.types';

interface AdditionalFilterFieldsProps {
  ownershipType?: string;
  encroachmentStatus?: string;
  ownershipOptions?: Option[];
  handleOwnershipTypeChange: (val: string) => void;
  handleEncroachmentStatusChange: (val: string) => void;
}

export function AdditionalFilterFields({
  ownershipType,
  encroachmentStatus,
  ownershipOptions,
  handleOwnershipTypeChange,
  handleEncroachmentStatusChange,
}: AdditionalFilterFieldsProps) {
  const t = useTranslations('assetRegister');

  const defaultOwnershipOptions = useMemo<Option[]>(() => [
    { label: t('All'), value: 'all' },
    ...(ownershipOptions || []).filter((opt) => opt.value !== 'all'),
  ], [ownershipOptions, t]);

  // Translated encroachment options using typed value
  const encroachmentOptions = useMemo<Option[]>(() => {
    const items: { label: string; value: EncroachmentStatusType }[] = [
      { label: t('All'), value: 'all' },
      { label: t('Fully_Encroached'), value: 'Fully Encroached' },
      { label: t('Partially_Encroached'), value: 'Partially Encroached' },
      { label: t('Clean'), value: 'Clean' },
    ];
    return items;
  }, [t]);

  return (
    <>
      {/* 5. Ownership */}
      <div className="flex flex-col space-y-1">
        <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
          {t('Ownership')}
        </Label>
        <Select
          options={defaultOwnershipOptions}
          value={ownershipType || 'all'}
          onChange={(_, val) => handleOwnershipTypeChange(val || 'all')}
          ariaLabel={t('Ownership')}
          selectSize="sm"
          className="[&_button]:!h-8 [&_button]:!rounded-lg [&_button]:!border-slate-200 [&_button]:!font-bold [&_button]:!text-xs [&_button]:text-slate-700 hover:[&_button]:!border-slate-300 [&_button]:!shadow-2xs"
        />
      </div>

      {/* 7. Encroachment — values must match backend EncroachmentStatus free-text exactly */}
      <div className="flex flex-col space-y-1">
        <Label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
          {t('Encroachment')}
        </Label>
        <Select
          options={encroachmentOptions}
          value={encroachmentStatus || 'all'}
          onChange={(_, val) => handleEncroachmentStatusChange(val || 'all')}
          ariaLabel={t('Encroachment')}
          selectSize="sm"
          className="[&_button]:!h-8 [&_button]:!rounded-lg [&_button]:!border-slate-200 [&_button]:!font-bold [&_button]:!text-xs [&_button]:text-slate-700 hover:[&_button]:!border-slate-300 [&_button]:!shadow-2xs"
        />
      </div>
    </>
  );
}
