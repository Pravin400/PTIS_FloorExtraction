'use client';

import { User, Plus } from 'lucide-react';
import { Button } from "@/components/common";
import { Drawer } from '@/components/common/Drawer';
import { useTranslations } from 'next-intl';
import { RenterDetailsDrawerProps } from '@/types/asset/new-renter.types';
import { useNARenterDetails } from '@/hooks/asset-hooks/floor-details/useNARenterDetails';
import { RenterDetailsForm } from './RenterDetailsForm';

export function RenterDetailsDrawer({
  isOpen,
  onClose,
  renterData,
  onSave,
}: RenterDetailsDrawerProps) {
  const t = useTranslations('addAssetForm');

  const { form, errors, handleMonthlyRentChange, handleFieldChange, handleLocalNameBlur, handleSave } =
    useNARenterDetails(renterData, isOpen, onSave, onClose, t);

  if (!isOpen) return null;

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      
      
      
      
      
      
      title={
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
            <User className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div>
            <h3 id="drawer-title" className="text-[15px] font-bold text-slate-800">
              {t('floorDetails.renterDetailsTitle') || 'Renter / Tenant Details'}
            </h3>
            <p className="text-[12px] font-medium text-slate-500 mt-0.5">{'Enter details to configure tenant and agreement information.'}</p>
          </div>
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-between">
          <Button
            variant="ghost"
            onClick={onClose}
            className="!text-slate-600 hover:!bg-slate-100 text-xs font-bold"
          >
            {t('floorDetails.cancel') || 'Cancel'}
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={handleSave}
            className="!bg-blue-600 hover:!bg-blue-700 shadow-sm text-xs font-bold px-5 py-2"
          >
            {t('floorDetails.saveRenterDetails') || 'Save Renter Details'}
          </Button>
        </div>
      }
    >
      <div className="p-5 bg-slate-50/50 min-h-full space-y-4">
        <RenterDetailsForm
          form={form}
          errors={errors}
          handleMonthlyRentChange={handleMonthlyRentChange}
          handleFieldChange={handleFieldChange}
          handleLocalNameBlur={handleLocalNameBlur}
          t={t}
        />
      </div>
    </Drawer>
  );
}
