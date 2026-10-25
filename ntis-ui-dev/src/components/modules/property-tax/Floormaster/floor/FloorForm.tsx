'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

import { Layers, Home, Building } from 'lucide-react';
import { toast } from 'sonner';
import { Drawer, Tabs, CancelButton, SaveButton } from '@/components/common';

import {
  createFloorAction,
  createFloorRangeAction,
  updateFloorAction,
  getMaxFlatGenerationSeqAction,
  fetchFlatGenerationGroupsAction,
} from '@/app/[locale]/property-tax/floormaster/actions';

import { FloorFormModel, FloorRangeFormModel, FloorRangePayload, Floor } from '@/types/floor.types';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';
import { FloorFormFields } from './FloorFormFields';
import { FloorRangeFields } from './FloorRangeFields';
import type React from 'react';
import { getApiErrorMessage, parseApiFieldErrors } from '../form-errors';
import { StatusToggleField } from '../StatusToggleField';
import { MandatoryFieldsNotice } from '../MandatoryFieldsNotice';
import {
  validateFloorForm,
  sanitizeFloorCode,
  sanitizeDescription,
  sanitizeDescriptionEnglish,
} from './validation';


/* ================= CONSTANTS ================= */
type FloorMode = 'single' | 'range';
const DEFAULT_GROUP_OPTIONS = [
  { label: 'UPPER', value: '1' },
  { label: 'GENERAL', value: '2' },
  { label: 'OPENPLOT', value: '3' },
  { label: 'PODIUM', value: '4' },
  { label: 'MEZZANINE', value: '5' },
  { label: 'LOWER', value: '6' },
  { label: 'BASEMENT', value: '7' },
];


const DEFAULT_RANGE_DATA: FloorRangeFormModel = {
  rangeFrom: 0,
  rangeTo: 0,
  isActive: true,
  autoGenerateSubFloor: false,
  fLatGenerationGroupId: 1,
  fLatGenerationSeq: 1,
};

/* ================= PROPS ================= */
export interface FloorFormProps {
  id: number | null;
  initialData?: Floor;
}

/* ================= MAIN ================= */
export default function FloorForm({ id, initialData }: Readonly<FloorFormProps>) {
  const router = useRouter();
  const t = useTranslations('floor.floor');
  const tCommon = useTranslations('common');
  const floorLabel = useAliasLabel('Floor', t('aliasFallback.floor'));
  const floorsLabel = useAliasLabel('Floors', t('aliasFallback.floors'));
  const isEdit = Boolean(id);

  const [open, setOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);

  // Mode selection (only for add mode)
  const [mode, setMode] = useState<FloorMode>('single');

  // Single floor form data
  const [formData, setFormData] = useState<FloorFormModel>({
    id: initialData?.id,
    floorCode: initialData?.floorCode ?? '',
    descriptionEnglish: initialData?.descriptionEnglish ?? '',
    description: initialData?.description ?? '',
    sequenceNo: initialData?.sequenceNo ?? 0,
    fLatGenerationGroupId: initialData?.fLatGenerationGroupId ?? 1,
    fLatGenerationSeq: initialData?.fLatGenerationSeq ?? 1,
    isActive: initialData?.isActive ?? true,
  });

  // Range form data
  const [rangeData, setRangeData] = useState<FloorRangeFormModel>({
    ...DEFAULT_RANGE_DATA,
    fLatGenerationGroupId: initialData?.fLatGenerationGroupId ?? 1,
    fLatGenerationSeq: initialData?.fLatGenerationSeq ?? 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [groupOptions, setGroupOptions] = useState<{ label: string; value: string }[]>(DEFAULT_GROUP_OPTIONS);

  useEffect(() => {
    fetchFlatGenerationGroupsAction()
      .then((groups) => {
        if (groups?.length) {
          setGroupOptions(groups.map((g) => ({ label: g.name, value: String(g.id) })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit && formData.fLatGenerationGroupId) {
      getMaxFlatGenerationSeqAction(formData.fLatGenerationGroupId)
        .then((maxSeq) => {
          setFormData((prev) => ({
            ...prev,
            fLatGenerationSeq: maxSeq + 1,
          }));
        })
        .catch(() => {});
    }
  }, [isEdit, formData.fLatGenerationGroupId]);

  const handleGroupChange = useCallback(async (groupId: number) => {
    setFormData((p) => ({
      ...p,
      fLatGenerationGroupId: groupId,
    }));
    setTouched((p) => ({ ...p, fLatGenerationGroupId: true }));
    if (groupId > 0) {
      try {
        const maxSeq = await getMaxFlatGenerationSeqAction(groupId);
        setFormData((p) => ({
          ...p,
          fLatGenerationGroupId: groupId,
          fLatGenerationSeq: maxSeq + 1,
        }));
      } catch {
        // keep current
      }
    }
  }, []);

  useEffect(() => {
    if (!isEdit && rangeData.fLatGenerationGroupId) {
      getMaxFlatGenerationSeqAction(rangeData.fLatGenerationGroupId)
        .then((maxSeq) => {
          setRangeData((prev) => ({
            ...prev,
            fLatGenerationSeq: maxSeq + 1,
          }));
        })
        .catch(() => {});
    }
  }, [isEdit, rangeData.fLatGenerationGroupId]);

  const handleRangeGroupChange = useCallback(async (groupId: number) => {
    setRangeData((p) => ({
      ...p,
      fLatGenerationGroupId: groupId,
    }));
    setTouched((p) => ({ ...p, fLatGenerationGroupId: true }));
    if (groupId > 0) {
      try {
        const maxSeq = await getMaxFlatGenerationSeqAction(groupId);
        setRangeData((p) => ({
          ...p,
          fLatGenerationGroupId: groupId,
          fLatGenerationSeq: maxSeq + 1,
        }));
      } catch {
        // keep current
      }
    }
  }, []);

  const locale = useLocale();
  const handleClose = useCallback(() => {
    setOpen(false);
    router.push(`/${locale}/property-tax/floormaster/floor`);
  }, [router, locale, setOpen]);

  /* ================= VALIDATION ================= */
  const validateSingle = useCallback(
    (data: FloorFormModel): Partial<Record<keyof FloorFormModel, string>> => {
      return validateFloorForm(data, t, isEdit);
    },
    [isEdit, t]
  );

  const validateRange = useCallback(
    (data: FloorRangeFormModel): Record<string, string> => {
      const newErrors: Record<string, string> = {};
      if (!data.rangeFrom || data.rangeFrom < 1) {
        newErrors.rangeFrom = t('form.validation.rangeStartMinValue');
      }
      if (!data.rangeTo || data.rangeTo < 1) {
        newErrors.rangeTo = t('form.validation.rangeEndMinValue');
      }
      if (data.rangeFrom && data.rangeTo && data.rangeFrom > data.rangeTo) {
        newErrors.rangeFrom = t('form.validation.rangeStartLessThanEnd');
      }
      if (data.rangeFrom > 999) {
        newErrors.rangeFrom = t('form.validation.rangeMaxValue', { count: 999 });
      }
      if (data.rangeTo > 999) {
        newErrors.rangeTo = t('form.validation.rangeMaxValue', { count: 999 });
      }
      if (data.rangeFrom && data.rangeTo && data.rangeFrom <= data.rangeTo) {
        const rangeCount = data.rangeTo - data.rangeFrom + 1;
        if (rangeCount > 900) {
          newErrors.rangeTo = t('form.validation.rangeMaxCount', { count: 900 });
        }
      }
      if (!data.fLatGenerationGroupId || data.fLatGenerationGroupId <= 0) {
        newErrors.fLatGenerationGroupId = t('form.validation.flatGenerationGroupRequired');
      }
      if (!data.fLatGenerationSeq || data.fLatGenerationSeq <= 0) {
        newErrors.fLatGenerationSeq = t('form.validation.flatGenerationSeqRequired');
      }
      return newErrors;
    },
    [t]
  );

  const showError = (field: string): boolean =>
    (submittedOnce || touched[field]) && !!errors[field];

  /* ================= MODE CHANGE ================= */
  const handleModeChange = (newMode: FloorMode) => {
    setMode(newMode);
    setErrors({});
    setTouched({});
    setSubmittedOnce(false);
  };

  /* ================= SINGLE FLOOR HANDLERS ================= */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === 'description') {
      newValue = sanitizeDescription(newValue);
    }

    if (name === 'descriptionEnglish') {
      newValue = sanitizeDescriptionEnglish(newValue);
    }

    if (name === 'floorCode') {
      newValue = sanitizeFloorCode(newValue);
    }

    let parsedValue: number | string = newValue;
    if (name === 'sequenceNo' || name === 'fLatGenerationSeq') {
      const num = Number(newValue);
      // Block negative numbers
      if (newValue === '' || newValue === undefined) {
        parsedValue = 0;
      } else if (num < 0) {
        parsedValue = 1;
      } else {
        parsedValue = num;
      }
    }

    setFormData((p) => ({
      ...p,
      [name]: (name === 'sequenceNo' || name === 'fLatGenerationSeq') ? parsedValue : newValue,
    }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));

    const fieldErrors = validateSingle({
      ...formData,
      [name]: (name === 'sequenceNo' || name === 'fLatGenerationSeq' || name === 'fLatGenerationGroupId') ? Number(value) : value,
    });

    setErrors((p) => {
      const newErrors = { ...p };
      const fieldName = name as keyof FloorFormModel;

      if (fieldErrors[fieldName]) {
        newErrors[fieldName] = fieldErrors[fieldName]!;
      } else {
        delete newErrors[fieldName];
      }

      return newErrors;
    });
  };

  /* ================= RANGE HANDLERS ================= */
  const handleRangeChange = (field: keyof FloorRangeFormModel, value: string | number | boolean) => {
    setRangeData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRangeBlur = (field: keyof FloorRangeFormModel) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    const fieldErrors = validateRange(rangeData);
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (fieldErrors[field]) {
        newErrors[field] = fieldErrors[field];
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSubmittedOnce(true);

    if (mode === 'range' && !isEdit) {
      // Range submission
      const rangeErrors = validateRange(rangeData);
      setErrors(rangeErrors);

      if (Object.keys(rangeErrors).length) {
        return;
      }

      setIsSubmitting(true);
      try {
        const payload: FloorRangePayload = {
          rangeFrom: rangeData.rangeFrom.toString(),
          rangeTo: rangeData.rangeTo.toString(),
          template: {
            isActive: rangeData.isActive,
            floorCode: '',
            descriptionEnglish: '',
            description: '',
            sequenceNo: 0,
            maxFloorNo: rangeData.rangeTo,
            fLatGenerationGroupId: Number(rangeData.fLatGenerationGroupId) || 1,
            fLatGenerationSeq: Number(rangeData.fLatGenerationSeq) || 1,
          },
          startSequenceNo: rangeData.rangeFrom,
        };




        const result = await createFloorRangeAction(payload);

        if (!result.success) {
          // Try to parse field-specific errors from API response
          if (result.message) {
            const { fieldErrors, genericError, isRfc9110 } = parseApiFieldErrors(result.message);
            if (Object.keys(fieldErrors).length > 0) {
              setErrors(prev => ({ ...prev, ...fieldErrors }));
              return;
            }
            // Only use genericError if it came from a valid RFC9110 payload
            if (isRfc9110 && genericError) {
              toast.error(genericError);
              return;
            }
          }
          toast.error(getApiErrorMessage(result, { t, tCommon }));
          return;
        }

        const floorsCreated = rangeData.rangeTo - rangeData.rangeFrom + 1;
        toast.success(t('messages.createRangeSuccess', { count: floorsCreated, floors: floorsLabel }));
        handleClose();
        router.refresh();
      } catch (error) {
        const errorMessage =
          error instanceof Error && error.message ? error.message : t('apiErrors.operationFailed');
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Single floor submission
      const v = validateSingle(formData);
      const normalizedErrors = Object.fromEntries(
        Object.entries(v).filter(([_key, message]) => typeof message === 'string')
      ) as Record<string, string>;
      setErrors(normalizedErrors);

      if (Object.keys(normalizedErrors).length) {
        return;
      }

      setIsSubmitting(true);
      try {
        const result = isEdit ? await updateFloorAction(formData) : await createFloorAction(formData);

        if (!result.success) {
          // Try to parse field-specific errors from API response
          if (result.message) {
            const { fieldErrors, genericError, isRfc9110 } = parseApiFieldErrors(result.message);
            if (Object.keys(fieldErrors).length > 0) {
              setErrors(prev => ({ ...prev, ...fieldErrors }));
              return;
            }
            // Only use genericError if it came from a valid RFC9110 payload
            if (isRfc9110 && genericError) {
              toast.error(genericError);
              return;
            }
          }
          toast.error(getApiErrorMessage(result, { t, tCommon }));
          return;
        }

        const successMessage = isEdit
          ? t('messages.updateSuccess', { code: formData.floorCode, floor: floorLabel })
          : t('messages.createSuccess', { code: formData.floorCode, floor: floorLabel });

        toast.success(successMessage);
        handleClose();
        router.refresh();
      } catch (error) {
        const errorMessage =
          error instanceof Error && error.message ? error.message : t('apiErrors.operationFailed');
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleToggleStatus = (): void => {
    setFormData((p) => ({ ...p, isActive: !p.isActive }));
  };

  /* ================= UI ================= */
  return (
    <Drawer
      open={open}
      onClose={handleClose}
      className="border-l-4 border-[#4F6A94]"
      width="md"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-linear-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {isEdit ? t('form.editTitle', { floor: floorLabel }) : t('form.addTitle', { floor: floorLabel })}
            </div>
            <div className="text-sm text-slate-500">
              {isEdit ? t('form.editSubtitle', { floor: floorLabel }) : t('form.addSubtitle', { floor: floorLabel })}
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton
            label={tCommon('buttons.cancel')}
            onClick={handleClose}
            disabled={isSubmitting}
          />
          <SaveButton
            label={isEdit ? tCommon('actions.update') : tCommon('actions.save')}
            type="submit"
            form="form"
            isLoading={isSubmitting}
          />
        </>
      }
    >
      <form id="form" onSubmit={handleSubmit} className="space-y-6 bg-[#F8FAFF] p-5">
        {/* Mode Selection - Only for Add mode */}
        {!isEdit && (
          <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-4">
            <div className="text-sm font-medium text-gray-700 mb-3">
              {t('form.entryMode', { floor: floorLabel })}
            </div>
            <Tabs
              value={mode}
              onChange={(val) => handleModeChange(val as FloorMode)}
              variant="pills"
              size="sm"
            >
              <Tabs.TabList className="flex gap-2 bg-gray-200 p-1 rounded-xl w-full">

                <Tabs.Tab
                  value="single"
                  icon={Home}
                  className="flex-1 py-2 px-3 rounded-lg justify-center"
                >
                  <span className="font-medium text-sm">
                    {t('form.singleFloor', { floor: floorLabel })}
                  </span>
                </Tabs.Tab>

                <Tabs.Tab
                  value="range"
                  icon={Building}
                  className="flex-1 !py-2 !px-3 rounded-lg justify-center"
                >
                  <span className="font-medium text-sm">
                    {t('form.floorRange', { floor: floorLabel })}
                  </span>
                </Tabs.Tab>

              </Tabs.TabList>
            </Tabs>
          </div>
        )}

        {/* Edit mode: Status Toggle */}
        {isEdit && (
          <StatusToggleField
            isActive={formData.isActive}
            onChange={handleToggleStatus}
            error={errors.isActive}
            labels={{
              title: t('form.activeStatusTitle', { floor: floorLabel }),
              activeText: t('form.activeStatusOn'),
              inactiveText: t('form.activeStatusOff'),
            }}
          />
        )}

        {/* Form Fields based on mode */}
        {(!isEdit && mode === 'range') ? (
          <FloorRangeFields
            formData={rangeData}
            errors={errors as Partial<Record<keyof FloorRangeFormModel, string>>}
            showError={(field) => showError(field)}
            onChange={handleRangeChange}
            onBlur={handleRangeBlur}
            groupOptions={groupOptions}
            onGroupChange={handleRangeGroupChange}
            labels={{
              flatGenerationGroup: (() => { try { return t('form.flatGenerationGroup'); } catch { return 'Flat Generation Type'; } })(),
              flatGenerationGroupPlaceholder: (() => { try { return t('form.flatGenerationGroupPlaceholder'); } catch { return 'Select Flat Generation Type'; } })(),
              flatGenerationSeq: (() => { try { return t('form.flatGenerationSeq'); } catch { return 'Flat Generation Sequence'; } })(),
              flatGenerationSeqPlaceholder: (() => { try { return t('form.flatGenerationSeqPlaceholder'); } catch { return 'Enter sequence'; } })(),
            }}
          />
        ) : (
          <FloorFormFields
            formData={formData}
            errors={errors as Partial<Record<keyof FloorFormModel, string>>}
            showError={(field) => showError(field)}
            onChange={handleChange}
            onBlur={handleBlur}
            isEdit={isEdit}
            labels={{
              floorCode: t('form.floorCode', { floor: floorLabel }),
              floorCodePlaceholder: t('form.floorCodePlaceholder'),
              descriptionEnglish: t('form.descriptionEnglish'),
              descriptionEnglishPlaceholder: t('form.descriptionEnglishPlaceholder'),
              description: t('form.description'),
              descriptionPlaceholder: t('form.descriptionPlaceholder'),
              sequenceNo: t('form.sequenceNo'),
              sequenceNoPlaceholder: t('form.sequenceNoPlaceholder'),
              flatGenerationGroup: (() => { try { return t('form.flatGenerationGroup'); } catch { return 'Flat Generation Type'; } })(),
              flatGenerationGroupPlaceholder: (() => { try { return t('form.flatGenerationGroupPlaceholder'); } catch { return 'Select Flat Generation Type'; } })(),
              flatGenerationSeq: (() => { try { return t('form.flatGenerationSeq'); } catch { return 'Flat Generation Sequence'; } })(),
              flatGenerationSeqPlaceholder: (() => { try { return t('form.flatGenerationSeqPlaceholder'); } catch { return 'Enter sequence'; } })(),
            }}
            onGroupChange={handleGroupChange}
            groupOptions={groupOptions}
          />
        )}

        <MandatoryFieldsNotice message={tCommon('note.mandatory')} />
      </form>
    </Drawer>
  );
}
