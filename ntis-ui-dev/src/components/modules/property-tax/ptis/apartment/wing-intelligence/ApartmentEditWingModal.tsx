/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Modal, Button } from '@/components/common';
import { updateApartmentQcWingDetailsAction } from '@/app/[locale]/property-tax/ptis/apartment/action';
import { WingData } from '@/types/property-tax/apartment';
import { ApartmentEditWingForm } from './ApartmentEditWingForm';

export interface EditWingFormData {
  wingDetailId: number;
  wingName: string;
  managerName: string;
  managerNameEnglish: string;
  managerMobileNo: string;
  managerEmailId: string;
  secretaryName: string;
  secretaryNameEnglish: string;
  secretaryMobileNo: string;
  secretaryEmailId: string;
}

export interface EditWingDetailsModalProps {
  open: boolean;
  onClose: () => void;
  wing: WingData | null;
  onSuccess?: () => void;
}

export const ApartmentEditWingModal: React.FC<EditWingDetailsModalProps> = ({
  open,
  onClose,
  wing,
  onSuccess,
}) => {
  const t = useTranslations('quickDataEntry');
  const [formData, setFormData] = useState<EditWingFormData>({
    wingDetailId: 0,
    wingName: '',
    managerName: '',
    managerNameEnglish: '',
    managerMobileNo: '',
    managerEmailId: '',
    secretaryName: '',
    secretaryNameEnglish: '',
    secretaryMobileNo: '',
    secretaryEmailId: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (wing && open) {
      const extra = wing as unknown as Record<string, unknown>;
      setFormData({
        wingDetailId: Number(wing.wingDetailId || wing.wingId || 0),
        wingName: wing.name || wing.wingNo || '',
        managerName: String(extra.managerName || ''),
        managerNameEnglish: String(extra.managerNameEnglish || ''),
        managerMobileNo: String(extra.managerMobileNo || ''),
        managerEmailId: String(extra.managerEmailId || ''),
        secretaryName: String(extra.secretaryName || ''),
        secretaryNameEnglish: String(extra.secretaryNameEnglish || ''),
        secretaryMobileNo: String(extra.secretaryMobileNo || ''),
        secretaryEmailId: String(extra.secretaryEmailId || ''),
      });
      setErrors({});
    }
  }, [wing, open]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.wingName.trim()) {
      errs.wingName = t('wing.validation.wingNameRequired') || 'Wing Name is required';
    }
    if (formData.managerMobileNo && formData.managerMobileNo.length !== 10) errs.managerMobileNo = 'Manager Mobile Number must be 10 digits';
    if (formData.secretaryMobileNo && formData.secretaryMobileNo.length !== 10) errs.secretaryMobileNo = 'Secretary Mobile Number must be 10 digits';
    if (formData.managerEmailId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.managerEmailId)) errs.managerEmailId = 'Invalid manager email format';
    if (formData.secretaryEmailId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.secretaryEmailId)) errs.secretaryEmailId = 'Invalid secretary email format';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!formData.wingDetailId) { toast.error('Wing detail ID is missing.'); return; }
    setIsSubmitting(true);
    try {
      const payload = {
        wingName: formData.wingName.trim() || null,
        managerName: formData.managerName.trim() || null,
        managerNameEnglish: formData.managerNameEnglish.trim() || null,
        managerMobileNo: formData.managerMobileNo.trim() || null,
        managerEmailId: formData.managerEmailId.trim() || null,
        secretaryName: formData.secretaryName.trim() || null,
        secretaryNameEnglish: formData.secretaryNameEnglish.trim() || null,
        secretaryMobileNo: formData.secretaryMobileNo.trim() || null,
        secretaryEmailId: formData.secretaryEmailId.trim() || null,
      };

      const result = await updateApartmentQcWingDetailsAction(formData.wingDetailId, payload);
      if (!result.success) {
        toast.error(result.error || 'Failed to update wing details');
        return;
      }
      toast.success('Wing details updated successfully!');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('wing.editWing') || 'Edit Wing Details'} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4 p-2">
        <ApartmentEditWingForm formData={formData} setFormData={setFormData} errors={errors} setErrors={setErrors} />
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting} className="text-xs">
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting} className="text-xs">
            {t('common.save') || 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ApartmentEditWingModal;
