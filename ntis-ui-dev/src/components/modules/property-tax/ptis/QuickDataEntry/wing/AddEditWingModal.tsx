'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Modal, Input, Button, SearchSelect } from '@/components/common';
import { WingItem } from '@/types/zone-master/properties/wing.types';
import { SocietyDetailItem } from '@/types/zone-master/properties/societyDetails.types';
import { sanitizeName, sanitizeWingName, sanitizeEmailStrict, sanitizeNumericInput } from '@/lib/utils/input-sanitization';

export interface WingModalPayload {
  wingId: number;
  wingName: string;
  managerName?: string;
  managerNameEnglish?: string;
  managerMobileNo?: string;
  managerEmailId?: string;
  secretaryName?: string;
  secretaryNameEnglish?: string;
  secretaryMobileNo?: string;
  secretaryEmailId?: string;
  editingId?: number;
}

interface AddEditWingModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: WingModalPayload) => Promise<void>;
  editingRecord: SocietyDetailItem | null;
  wingMaster: WingItem[];
  existingWings: SocietyDetailItem[];
  isSubmitting: boolean;
}

interface AddEditWingFormContentProps {
  onClose: () => void;
  onSave: (data: WingModalPayload) => Promise<void>;
  editingRecord: SocietyDetailItem | null;
  wingMaster: WingItem[];
  existingWings: SocietyDetailItem[];
  isSubmitting: boolean;
}

const AddEditWingFormContent: React.FC<AddEditWingFormContentProps> = ({
  onClose,
  onSave,
  editingRecord,
  wingMaster,
  existingWings,
  isSubmitting,
}) => {
  const t = useTranslations('quickDataEntry');

  const defaultValues = useMemo(() => {
    if (editingRecord) {
      return {
        selectedWingId: String(editingRecord.wingId || ''),
        wingName: editingRecord.wingName || '',
      };
    }
    const usedWingIds = new Set(existingWings.map((w) => w.wingId));
    const firstAvailable = wingMaster.find((w) => !usedWingIds.has(w.id));
    if (firstAvailable) {
      return {
        selectedWingId: String(firstAvailable.id),
        wingName: firstAvailable.wingNo || '',
      };
    }
    return {
      selectedWingId: wingMaster.length > 0 ? String(wingMaster[0].id) : '1',
      wingName: '',
    };
  }, [editingRecord, existingWings, wingMaster]);

  const [selectedWingId, setSelectedWingId] = useState<string>(defaultValues.selectedWingId);
  const [wingName, setWingName] = useState<string>(defaultValues.wingName);
  const [managerName, setManagerName] = useState<string>(editingRecord?.managerName || '');
  const [managerNameEnglish, setManagerNameEnglish] = useState<string>(editingRecord?.managerNameEnglish || '');
  const [managerMobileNo, setManagerMobileNo] = useState<string>(editingRecord?.managerMobileNo || '');
  const [managerEmailId, setManagerEmailId] = useState<string>(editingRecord?.managerEmailId || '');
  const [secretaryName, setSecretaryName] = useState<string>(editingRecord?.secretaryName || '');
  const [secretaryNameEnglish, setSecretaryNameEnglish] = useState<string>(editingRecord?.secretaryNameEnglish || '');
  const [secretaryMobileNo, setSecretaryMobileNo] = useState<string>(editingRecord?.secretaryMobileNo || '');
  const [secretaryEmailId, setSecretaryEmailId] = useState<string>(editingRecord?.secretaryEmailId || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleWingSelectChange = (_name: string | undefined, value: string) => {
    setSelectedWingId(value);
    const matched = wingMaster.find((w) => String(w.id) === value);
    if (matched && !editingRecord) {
      setWingName(matched.wingNo || '');
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!wingName.trim()) {
      errs.wingName = t('wing.errors.wingNameRequired') || 'Wing Name is required';
    }

    if (managerMobileNo && managerMobileNo.length !== 10) {
      errs.managerMobileNo = 'Manager Mobile Number must be 10 digits';
    }

    if (secretaryMobileNo && secretaryMobileNo.length !== 10) {
      errs.secretaryMobileNo = 'Secretary Mobile Number must be 10 digits';
    }

    if (managerEmailId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(managerEmailId)) {
      errs.managerEmailId = 'Invalid manager email format';
    }

    if (secretaryEmailId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(secretaryEmailId)) {
      errs.secretaryEmailId = 'Invalid secretary email format';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const numericWingId = Number(selectedWingId) || (wingMaster[0]?.id ?? 1);
    await onSave({
      wingId: numericWingId,
      wingName: wingName.trim(),
      managerName: managerName.trim() || undefined,
      managerNameEnglish: managerNameEnglish.trim() || undefined,
      managerMobileNo: managerMobileNo.trim() || undefined,
      managerEmailId: managerEmailId.trim() || undefined,
      secretaryName: secretaryName.trim() || undefined,
      secretaryNameEnglish: secretaryNameEnglish.trim() || undefined,
      secretaryMobileNo: secretaryMobileNo.trim() || undefined,
      secretaryEmailId: secretaryEmailId.trim() || undefined,
      editingId: editingRecord?.id,
    });
  };

  const wingOptions = wingMaster.map((w) => ({
    value: String(w.id),
    label: w.wingNo,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1">
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          {t('wing.selectWing')} <span className="text-red-500">*</span>
        </label>
        <SearchSelect
          options={wingOptions}
          value={selectedWingId}
          onChange={handleWingSelectChange}
          placeholder={t('wing.selectWing')}
          className="w-full text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          {t('wing.wingName')} <span className="text-red-500">*</span>
        </label>
        <Input
          value={wingName}
          onChange={(e) => {
            setWingName(sanitizeWingName(e.target.value));
            if (errors.wingName) setErrors((prev) => ({ ...prev, wingName: '' }));
          }}
          placeholder={t('wing.wingName')}
          maxLength={30}
          className="w-full text-sm"
        />
        {errors.wingName && <p className="text-xs text-red-500 mt-1">{errors.wingName}</p>}
      </div>

      {/* Manager Section */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          {t('wing.managerName') || 'Manager Details'}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('wing.managerName')}
            </label>
            <Input
              value={managerName}
              onChange={(e) => setManagerName(sanitizeName(e.target.value))}
              placeholder="उदा. भूषण"
              maxLength={200}
              className="w-full text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('wing.managerNameEnglish')}
            </label>
            <Input
              value={managerNameEnglish}
              onChange={(e) => setManagerNameEnglish(sanitizeName(e.target.value))}
              placeholder="e.g. Bhushan"
              maxLength={200}
              className="w-full text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('wing.managerMobileNo')}
            </label>
            <Input
              value={managerMobileNo}
              onChange={(e) => {
                const num = sanitizeNumericInput(e.target.value).slice(0, 10);
                setManagerMobileNo(num);
                if (errors.managerMobileNo) setErrors((prev) => ({ ...prev, managerMobileNo: '' }));
              }}
              placeholder="e.g. 9876543211"
              maxLength={10}
              className="w-full text-sm"
            />
            {errors.managerMobileNo && (
              <p className="text-xs text-red-500 mt-1">{errors.managerMobileNo}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('wing.managerEmailId')}
            </label>
            <Input
              type="email"
              value={managerEmailId}
              onChange={(e) => {
                const em = sanitizeEmailStrict(e.target.value);
                setManagerEmailId(em);
                if (errors.managerEmailId) setErrors((prev) => ({ ...prev, managerEmailId: '' }));
              }}
              placeholder="e.g. manager@example.com"
              maxLength={100}
              className="w-full text-sm"
            />
            {errors.managerEmailId && (
              <p className="text-xs text-red-500 mt-1">{errors.managerEmailId}</p>
            )}
          </div>
        </div>
      </div>

      {/* Secretary Section */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          {t('wing.secretaryName') || 'Secretary Details'}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('wing.secretaryName')}
            </label>
            <Input
              value={secretaryName}
              onChange={(e) => setSecretaryName(sanitizeName(e.target.value))}
              placeholder="उदा. अमित"
              maxLength={200}
              className="w-full text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('wing.secretaryNameEnglish')}
            </label>
            <Input
              value={secretaryNameEnglish}
              onChange={(e) => setSecretaryNameEnglish(sanitizeName(e.target.value))}
              placeholder="e.g. Amit"
              maxLength={200}
              className="w-full text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('wing.secretaryMobileNo')}
            </label>
            <Input
              value={secretaryMobileNo}
              onChange={(e) => {
                const num = sanitizeNumericInput(e.target.value).slice(0, 10);
                setSecretaryMobileNo(num);
                if (errors.secretaryMobileNo)
                  setErrors((prev) => ({ ...prev, secretaryMobileNo: '' }));
              }}
              placeholder="e.g. 9594089272"
              maxLength={10}
              className="w-full text-sm"
            />
            {errors.secretaryMobileNo && (
              <p className="text-xs text-red-500 mt-1">{errors.secretaryMobileNo}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('wing.secretaryEmailId')}
            </label>
            <Input
              type="email"
              value={secretaryEmailId}
              onChange={(e) => {
                const em = sanitizeEmailStrict(e.target.value);
                setSecretaryEmailId(em);
                if (errors.secretaryEmailId)
                  setErrors((prev) => ({ ...prev, secretaryEmailId: '' }));
              }}
              placeholder="e.g. secretary@example.com"
              maxLength={100}
              className="w-full text-sm"
            />
            {errors.secretaryEmailId && (
              <p className="text-xs text-red-500 mt-1">{errors.secretaryEmailId}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onClose}
          disabled={isSubmitting}
        >
          {t('wing.cancel')}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {editingRecord ? t('wing.updateWing') : t('wing.saveWing')}
        </Button>
      </div>
    </form>
  );
};

export const AddEditWingModal: React.FC<AddEditWingModalProps> = ({
  open,
  onClose,
  onSave,
  editingRecord,
  wingMaster,
  existingWings,
  isSubmitting,
}) => {
  const t = useTranslations('quickDataEntry');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingRecord ? t('wing.editWing') : t('wing.addWing')}
      maxWidth="md"
    >
      {open ? (
        <AddEditWingFormContent
          key={editingRecord ? `edit-${editingRecord.id ?? editingRecord.wingId}` : 'new'}
          onClose={onClose}
          onSave={onSave}
          editingRecord={editingRecord}
          wingMaster={wingMaster}
          existingWings={existingWings}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </Modal>
  );
};
