'use client';

import { useCallback, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  saveTaxCalculationGuidelineAction,
} from '@/app/[locale]/configuration-settings/tax-calculation-guideline/actions';
import { buildInitialFormData, FIELD_MAPPINGS } from '@/lib/api/configuration-settings/tax-calculation-guideline/tax-calculation-guideline.mapper';
import type {
  TaxCalculationGuidelineDto,
  TaxCalculationGuidelineFormData,
} from '@/types/tax-calculation-guideline.types';

interface UseTaxCalculationGuidelineFormOptions {
  initialDto: TaxCalculationGuidelineDto | TaxCalculationGuidelineDto[] | null;
}

/**
 * useTaxCalculationGuidelineForm
 *
 * Manages all form state, field-level change handlers, and the save flow
 * for the CC / OC / Electric Bill – Tax Calculation Guideline screen.
 */
export function useTaxCalculationGuidelineForm({ initialDto }: UseTaxCalculationGuidelineFormOptions) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  /** Keep track of the full API DTO to maintain all metadata */
  const [currentDto, setCurrentDto] = useState<TaxCalculationGuidelineDto | TaxCalculationGuidelineDto[] | null>(initialDto);

  /** Full form data state */
  const [formData, setFormData] = useState<TaxCalculationGuidelineFormData>(() =>
    buildInitialFormData(initialDto)
  );

  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);

  // ─── Generic field-level updater ─────────────────────────────────────────

  /**
   * Update a single field within a given section.
   * Typed so callers cannot pass an incompatible value.
   */
  const handleChange = useCallback(
    <S extends keyof TaxCalculationGuidelineFormData, K extends keyof TaxCalculationGuidelineFormData[S]>(
      section: S,
      field: K,
      value: TaxCalculationGuidelineFormData[S][K]
    ) => {
      setFormData((prev) => {
        if (section === ('dynamicGuidelines' as unknown as S)) {
          return {
            ...prev,
            dynamicGuidelines: value as unknown as TaxCalculationGuidelineFormData['dynamicGuidelines']
          };
        }

        const next = {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value,
          },
        };

        // Sync to dynamicGuidelines list
        if (prev.dynamicGuidelines && prev.dynamicGuidelines.length > 0) {
          let matchedCode: string | null = null;
          
          for (const [code, mapping] of Object.entries(FIELD_MAPPINGS)) {
            if (mapping.section === section) {
              if (mapping.field === field) {
                matchedCode = code;
                break;
              }
              // Handle nested fields like financialYearStart.month
              if (mapping.field.startsWith(String(field) + '.')) {
                const subKey = mapping.field.split('.')[1];
                const subVal = (value as unknown as Record<string, unknown>)?.[subKey];
                if (subVal !== undefined) {
                  const idx = prev.dynamicGuidelines.findIndex(item => item.guidelineCode === code);
                  if (idx > -1) {
                    const list = next.dynamicGuidelines ? [...next.dynamicGuidelines] : [...prev.dynamicGuidelines];
                    list[idx] = {
                      ...list[idx],
                      guidelineValue: subVal === 'Select' ? null : String(subVal)
                    };
                    next.dynamicGuidelines = list;
                  }
                }
              }
            }
          }

          if (matchedCode) {
            let valStr: string | null = null;
            if (typeof value === 'boolean') {
              valStr = String(value);
            } else if (value === undefined || value === null || value === 'Select') {
              valStr = null;
            } else {
              valStr = String(value);
            }

            next.dynamicGuidelines = prev.dynamicGuidelines.map(item => {
              if (item.guidelineCode === matchedCode) {
                return { ...item, guidelineValue: valStr };
              }
              return item;
            });
          }
        }

        return next;
      });
    },
    []
  );

  /**
   * Handle changes directly by GuidelineCode for dynamic UI rendering.
   */
  const onChangeGuideline = useCallback(
    (code: string, val: string | null) => {
      const mapping = FIELD_MAPPINGS[code];
      if (mapping) {
        let mappedValue: unknown = val;
        if (mapping.type === 'boolean') {
          mappedValue = val === 'true' || val === '1';
        } else if (mapping.type === 'number') {
          mappedValue = val === null || val === '' || val === undefined ? undefined : Number(val);
        } else if (mapping.type === 'priority') {
          const dict: Record<string, string> = {
            OC: 'OC Date',
            CC: 'CC Date',
            ELECTRIC_BILL: 'Electric Bill Date',
            RETROSPECTIVE: 'Retrospective (No Date)',
          };
          mappedValue = val ? (dict[val] ?? 'Select') : 'Select';
        } else if (mapping.type === 'month' || mapping.type === 'day') {
          const fieldName = mapping.field.split('.')[1];
          setFormData((prev) => {
            const newStart = {
              ...prev.generalSettings.financialYearStart,
              [fieldName]: val === null || val === 'Select' ? 'Select' : Number(val),
            };
            
            // Also sync to dynamicGuidelines list
            const list = prev.dynamicGuidelines ? [...prev.dynamicGuidelines] : [];
            const idx = list.findIndex(item => item.guidelineCode === code);
            if (idx > -1) {
              list[idx] = { ...list[idx], guidelineValue: val };
            }

            return {
              ...prev,
              generalSettings: {
                ...prev.generalSettings,
                financialYearStart: newStart,
              },
              dynamicGuidelines: list,
            };
          });
          return;
        }

        if (mapping.type !== 'month' && mapping.type !== 'day') {
          handleChange(
            mapping.section as keyof TaxCalculationGuidelineFormData,
            mapping.field as never,
            mappedValue as never
          );
        }
      } else {
        // Not a mapped field, update dynamicGuidelines list only
        setFormData((prev) => {
          const list = prev.dynamicGuidelines ? [...prev.dynamicGuidelines] : [];
          const idx = list.findIndex((item) => item.guidelineCode === code);
          if (idx > -1) {
            list[idx] = { ...list[idx], guidelineValue: val };
          } else {
            list.push({ guidelineCode: code, guidelineValue: val, isActive: true });
          }
          return {
            ...prev,
            dynamicGuidelines: list,
          };
        });
      }
    },
    [handleChange]
  );

  // ─── Save handler ─────────────────────────────────────────────────────────

  const handleUpdate = useCallback(async (): Promise<boolean> => {
    if (isSavingRef.current) return false;
    isSavingRef.current = true;
    setIsSaving(true);

    try {
      const response = await saveTaxCalculationGuidelineAction(formData, currentDto);

      if (!response.success) {
        toast.error(response.error ?? 'Failed to save tax calculation guideline');
        return false;
      }

      if (response.data) {
        setCurrentDto(response.data);
      }

      toast.success(response.message ?? 'Tax calculation guideline saved successfully');

      startTransition(() => {
        router.refresh();
      });

      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An unexpected error occurred');
      return false;
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [formData, currentDto, router]);

  const isUpdate = Array.isArray(currentDto)
    ? currentDto.length > 0 && currentDto.some((item) => !!item.id)
    : !!currentDto?.id;

  return {
    formData,
    isSaving,
    isUpdate,
    handleChange,
    onChangeGuideline,
    handleUpdate,
  };
}

export type UseTaxCalculationGuidelineForm = ReturnType<typeof useTaxCalculationGuidelineForm>;
