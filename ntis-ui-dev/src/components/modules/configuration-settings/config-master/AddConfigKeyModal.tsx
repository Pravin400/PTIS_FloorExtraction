'use client';

import { useRef } from 'react';

import { Key } from 'lucide-react';
import { Drawer } from '@/components/common';
import type { AddConfigKeyModalProps } from '@/types/configMaster.types';
import { useTranslations } from 'next-intl';
import { ConfigKeyForm, type ConfigKeyFormRef } from './ConfigKeyForm';

export default function AddConfigKeyModal({
  isOpen,
  onClose,
  categoryId,
  categories = [],
  onSuccess,
  initialData,
}: AddConfigKeyModalProps) {
  const t = useTranslations('configMaster');
  const isEdit = !!initialData;
  const formRef = useRef<ConfigKeyFormRef>(null);

  return (
    <Drawer
      open={isOpen}
      onClose={() => {
        if (formRef.current) {
          formRef.current.handleClose();
        } else {
          onClose();
        }
      }}
      width="md"
      bodyClassName="overflow-hidden p-0 flex flex-col [&>div]:h-full [&>div]:flex [&>div]:flex-col"
      title={
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-sm shrink-0">
            <Key className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
              {isEdit ? t('modals.editKey.title') : t('modals.addKey.title')}
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {isEdit ? t('modals.editKey.subtitle') : t('modals.addKey.subtitle')}
            </p>
          </div>
        </div>
      }
    >
      {isOpen && (
        <ConfigKeyForm
          ref={formRef}
          key={isOpen ? `open-${initialData?.configKeyId || 'new'}` : 'closed'}
          initialData={initialData}
          categoryId={categoryId}
          categories={categories}
          onSuccess={onSuccess}
          onClose={onClose}
          isEdit={isEdit}
        />
      )}
    </Drawer>
  );
}
