'use client';

import React from 'react';
import { SearchSelect, AnimatedDigitInput } from '@/components/common';
import { BasicInfoSectionProps } from '@/types/floor-details.types';
import { FloorData } from '@/types/room-details.types';
import { getSelectOptions } from '@/lib/utils/form-options.util';
import { normalizeToStringArray } from '@/lib/utils/dropdown-helpers';
import { FieldWrapper } from './SectionField';
import { validateField } from '@/lib/validations/validateFloorSubmission';
import { toast } from 'sonner';

export const BasicInfoSection: React.FC<
  BasicInfoSectionProps & { selectedFloorType?: 'Construction' | 'OpenPlot' }
> = ({
  t,
  editingFloorForm,
  setEditingFloorForm,
  formErrors,
  setFormErrors,
  floorOptions,
  floorLookup,
  subFloorOptions,
  subFloorLookup,
  getFloorDescription,
  getSubFloorDescription,
  handleOpenDropdown,
  selectedFloorType = 'Construction',
  isAddingNewFloor,
}) => {
    React.useEffect(() => {
      const timer = setTimeout(() => {
        let isRenterReturn = false;
        try {
          if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('renter_return_focus') === 'true') {
            isRenterReturn = true;
            sessionStorage.removeItem('renter_return_focus');
          }
        } catch { }

        if (isRenterReturn) {
          const renterEl = document.getElementById('floor-renter') as HTMLInputElement | null;
          if (renterEl) {
            renterEl.focus({ preventScroll: true });
            return;
          }
        }

        const inputEl = document.getElementById('floor-is-taxable') as HTMLInputElement | null;
        if (inputEl) {
          inputEl.focus({ preventScroll: true });
        }
      }, 100);
      return () => clearTimeout(timer);
    }, [editingFloorForm.id, isAddingNewFloor, selectedFloorType]);



    const handleYearValueChange = (
      field: 'conYr' | 'asstYr',
      value: string,
      errorTranslationKey: string
    ) => {
      const newForm = { ...editingFloorForm, [field]: value };
      if (selectedFloorType === 'OpenPlot' && field === 'asstYr') {
        newForm.conYr = value;
      }
      setEditingFloorForm(newForm);

      let currentError = '';
      if (value.length === 4) {
        const validation = validateField(field, value);
        if (!validation.isValid) {
          currentError = validation.error || errorTranslationKey;
        }
      }

      setFormErrors((prev) => {
        const updated = { ...prev, [field]: currentError };
        if (selectedFloorType === 'OpenPlot' && field === 'asstYr') {
          updated.conYr = '';
        }

        const conYrVal = String(newForm.conYr || '');
        const asstYrVal = String(newForm.asstYr || '');

        if (conYrVal.length === 4 && asstYrVal.length === 4) {
          const conYear = parseInt(conYrVal, 10);
          const asstYear = parseInt(asstYrVal, 10);
          if (!isNaN(conYear) && !isNaN(asstYear) && conYear > asstYear) {
            const errMsg =
              t('floor.asstYrError') || 'Assessment Year cannot be less than Construction Year';
            updated.asstYr = errMsg;
            if (prev.asstYr !== errMsg) {
              toast.error(errMsg);
            }
          } else {
            const crossFieldError =
              t('floor.asstYrError') || 'Assessment Year cannot be less than Construction Year';
            if (prev.asstYr === crossFieldError || updated.asstYr === crossFieldError) {
              updated.asstYr = '';
            }
          }
        }
        return updated;
      });
    };

    const handleYearBlur = (field: 'conYr' | 'asstYr', val: string, errorMsg: string) => {
      if (selectedFloorType === 'OpenPlot' && field === 'asstYr') {
        setEditingFloorForm((prev) => ({
          ...prev,
          asstYr: val,
          conYr: val,
        }));
      }

      const validation = validateField(field, val);
      let fieldErr = '';
      if (!validation.isValid) {
        fieldErr = validation.error || errorMsg;
      }

      setFormErrors((prev) => {
        const updated = { ...prev, [field]: fieldErr };
        if (selectedFloorType === 'OpenPlot' && field === 'asstYr') {
          updated.conYr = '';
        }
        const conYrVal = String(
          selectedFloorType === 'OpenPlot' && field === 'asstYr' ? val : editingFloorForm.conYr || ''
        );
        const asstYrVal = String(
          selectedFloorType === 'OpenPlot' && field === 'asstYr' ? val : editingFloorForm.asstYr || ''
        );

        if (conYrVal.length === 4 && asstYrVal.length === 4) {
          const conYear = parseInt(conYrVal, 10);
          const asstYear = parseInt(asstYrVal, 10);
          if (!isNaN(conYear) && !isNaN(asstYear) && conYear > asstYear) {
            const errMsg =
              t('floor.asstYrError') || 'Assessment Year cannot be less than Construction Year';
            updated.asstYr = errMsg;
            if (prev.asstYr !== errMsg) {
              toast.error(errMsg);
            }
          } else {
            const crossFieldError =
              t('floor.asstYrError') || 'Assessment Year cannot be less than Construction Year';
            if (prev.asstYr === crossFieldError || updated.asstYr === crossFieldError) {
              updated.asstYr = '';
            }
          }
        }
        return updated;
      });
    };

    const currentFloorValue = React.useMemo(() => {
      if (selectedFloorType === 'Construction') {
        const idStr = String(editingFloorForm.floorId || '');
        const rawFloor = String(editingFloorForm.floor || '').trim().toLowerCase();
        if (idStr === '77' || rawFloor === 'op' || rawFloor === 'open plot' || rawFloor.includes('open plot')) {
          return '';
        }
      }
      if (
        editingFloorForm.floorId !== undefined &&
        editingFloorForm.floorId !== null &&
        String(editingFloorForm.floorId) !== ''
      ) {
        return String(editingFloorForm.floorId);
      }
      if (editingFloorForm.floor) {
        const rawFloor = String(editingFloorForm.floor).trim();
        const found = (floorLookup || []).find((f: Record<string, unknown>) => {
          const idStr = String(f.floorId || f.id || f.ID || '');
          const descStr = String(f.description || f.floorDescription || '').trim();
          const codeStr = String(f.floorCode || f.code || '').trim();
          return (
            idStr === rawFloor ||
            descStr === rawFloor ||
            codeStr === rawFloor ||
            (codeStr && descStr && `${codeStr} - ${descStr}` === rawFloor)
          );
        });
        if (found) {
          return String(found.floorId || found.id || found.ID);
        }
      }
      return '';
    }, [
      editingFloorForm.floorId,
      editingFloorForm.floor,
      floorLookup,
      selectedFloorType,
    ]);

    return (
      <>
        {/* Is Taxable Dropdown */}
        <FieldWrapper
          label={t('floor.taxable')}
          htmlFor="floor-is-taxable"
          error={formErrors.isTaxable}
        >
          <SearchSelect
            id="floor-is-taxable"
            name="isTaxable"
            menuPlacement="top"
            options={[
              { label: t('floor.yes'), value: 'Yes' },
              { label: t('floor.no'), value: 'No' },
            ]}
            value={(editingFloorForm.isTaxable as string) ?? 'Yes'}
            onChange={(_name, value) => {
              setEditingFloorForm({ ...editingFloorForm, isTaxable: value });
            }}
            placeholder={t('floor.selectTaxableStatus')}
            openOnFocus={false}
            className="h-9 text-sm border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </FieldWrapper>

        {/* Floor */}
        <FieldWrapper
          label={t('floor.floorLabel')}
          htmlFor="floor-floor"
          required
          error={formErrors.floorId || formErrors.floor}
        >
          <div onFocusCapture={() => handleOpenDropdown('loadFloor')}>
            <SearchSelect
              id="floor-floor"
              name="floorId"
              menuPlacement="top"
              options={[
                { label: t('floor.selectFloor'), value: '' },
                ...getSelectOptions(
                  normalizeToStringArray(floorOptions),
                  floorLookup,
                  'floorId',
                  'description',
                  'floorCode',
                  currentFloorValue || undefined,
                  getFloorDescription
                ).filter(opt => {
                  const valStr = String(opt.value);
                  const lblStr = String(opt.label).toLowerCase();
                  if (selectedFloorType === 'Construction' || selectedFloorType === 'OpenPlot') {
                    return valStr !== '77' && !lblStr.includes('open plot');
                  }
                  return true;
                }),
              ]}
              value={currentFloorValue}
              onChange={(_name, value) => {
                const desc = getFloorDescription(value, floorLookup);
                setEditingFloorForm((prev: FloorData) => ({
                  ...prev,
                  floorId: value,
                  floor: desc || value,
                  floorDescription: desc || value,
                }));
                // Simple required validation: if value is empty, show error
                if (!value) {
                  setFormErrors((prev) => ({
                    ...prev,
                    floorId: t('floor.errors.floorRequired') || 'Floor selection is required',
                  }));
                } else {
                  setFormErrors((prev) => ({ ...prev, floorId: '', floor: '' }));
                }
              }}
              placeholder={t('floor.selectFloor')}
              className="h-9 text-sm"
            />
          </div>
        </FieldWrapper>

        {/* Sub Floor */}
        {selectedFloorType !== 'OpenPlot' && (
          <FieldWrapper
            label={t('floor.subFloor')}
            htmlFor="floor-sub-floor"
            error={formErrors.subFloorId || formErrors.subFloor}
          >
            <div onFocusCapture={() => handleOpenDropdown('loadSubFloor')}>
              <SearchSelect
                id="floor-sub-floor"
                name="subFloorId"
                options={[
                  { label: t('floor.selectSubFloor'), value: '' },
                  ...getSelectOptions(
                    normalizeToStringArray(subFloorOptions),
                    subFloorLookup,
                    'subFloorId',
                    'description',
                    'subFloorCode',
                    editingFloorForm.subFloorId,
                    getSubFloorDescription
                  ),
                ]}
                value={String(editingFloorForm.subFloorId ?? '')}
                onChange={(_name, value) => {
                  const desc = getSubFloorDescription(value, subFloorLookup);
                  setEditingFloorForm((prev: FloorData) => ({
                    ...prev,
                    subFloorId: value === '' ? undefined : value,
                    subFloor: value === '' ? '' : desc || value,
                    subFloorDescription: value === '' ? '' : desc || value,
                  }));
                }}
                placeholder={t('floor.selectSubFloor')}
                className="h-9 text-sm"
              />
            </div>
          </FieldWrapper>
        )}

        {/* Con Yr (Construction Year) */}
        {selectedFloorType !== 'OpenPlot' && (
          <FieldWrapper
            label={t('roomSubmission.table.conYr')}
            htmlFor="floor-con-yr"
            required
            error={formErrors.conYr}
          >
            <AnimatedDigitInput
              id="floor-con-yr"
              maxLength={4}
              value={String(editingFloorForm.conYr || '')}
              placeholder="2020"
              onChange={(val) =>
                handleYearValueChange('conYr', val, t('floor.errors.constructionYearInvalid'))
              }
              onBlur={(e) =>
                handleYearBlur('conYr', e.target.value, t('floor.errors.constructionYearInvalid'))
              }
            />
          </FieldWrapper>
        )}

        {/* Asst Yr (Assessment Year) */}
        <FieldWrapper
          label={t('roomSubmission.table.asstYr')}
          htmlFor="floor-asst-yr"
          required
          error={
            formErrors.asstYr ===
              (t('floor.asstYrError') || 'Assessment Year cannot be less than Construction Year')
              ? undefined
              : formErrors.asstYr
          }
        >
          <AnimatedDigitInput
            id="floor-asst-yr"
            maxLength={4}
            value={String(editingFloorForm.asstYr || '')}
            placeholder="2024"
            onChange={(val) =>
              handleYearValueChange('asstYr', val, t('floor.errors.assessmentYearInvalid'))
            }
            onBlur={(e) =>
              handleYearBlur('asstYr', e.target.value, t('floor.errors.assessmentYearInvalid'))
            }
          />
        </FieldWrapper>
      </>
    );
  };
