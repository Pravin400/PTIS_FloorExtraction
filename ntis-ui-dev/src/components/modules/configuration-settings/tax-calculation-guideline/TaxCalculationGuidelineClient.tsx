'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Button, SaveButton } from '@/components/common';
import { useTaxCalculationGuidelineForm } from '@/hooks/configuration-settings/tax-calculation-guideline/useTaxCalculationGuidelineForm';
import type { TaxCalculationGuidelineModuleProps } from '@/types/tax-calculation-guideline.types';
import { TaxGuidelineNoteFooter } from './TaxGuidelineNoteFooter';
import { GuidelineSectionCard } from './components/GuidelineSectionCard';
import { isGuidelineDisabled } from '@/lib/api/configuration-settings/tax-calculation-guideline/tax-calculation-guideline.rules';
import {
  groupGuidelines,
  KNOWN_SECTION_GROUPS,
  PRIMARY_LEFT_SECTIONS,
  PRIMARY_RIGHT_SECTIONS,
  ADVANCED_LEFT_SECTIONS,
  ADVANCED_RIGHT_SECTIONS,
} from '@/lib/utils/guideline-layout.utils';

/**
 * Client orchestrator for the Tax Calculation Guideline configuration screen.
 * 100% dynamic component rendering driven by layout utilities.
 */
export default function TaxCalculationGuidelineClient({
  initialDto,
  fetchError,
  statusCode,
  policyConfigs,
}: TaxCalculationGuidelineModuleProps) {
  const t = useTranslations('taxCalculationGuideline');
  const { formData, isSaving, isUpdate, onChangeGuideline, handleUpdate } = useTaxCalculationGuidelineForm({
    initialDto,
  });

  const { dynamicGuidelines = [], generalSettings } = formData;
  const isCertTaxDisabled = !generalSettings.enableCertificateBasedTax;

  // Group guidelines dynamically by section group
  const groupedGuidelines = useMemo(
    () => groupGuidelines(dynamicGuidelines),
    [dynamicGuidelines]
  );

  const checkIsDisabled = (code: string) =>
    isGuidelineDisabled(code, dynamicGuidelines, isCertTaxDisabled);

  // Dynamic unmapped custom groups added in DB
  const unmappedGroups = useMemo(() => {
    return Object.keys(groupedGuidelines).filter((g) => !KNOWN_SECTION_GROUPS.has(g));
  }, [groupedGuidelines]);

  return (
    <div className="flex h-full min-h-screen flex-col gap-0 bg-[#f0f4ff] relative">
      {/* ── Page Header (Sticky) ───────────────────────────────────────────── */}
      <div className="sticky top-20 z-20 flex shrink-0 items-start justify-between border-b border-slate-200/90 bg-white/95 backdrop-blur-sm px-6 py-4 shadow-md transition-shadow">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t('title')}</h1>
          <p className="mt-0.5 text-sm text-slate-500">{t('subtitle')}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Button
            id="tax-guideline-cancel-btn"
            type="button"
            variant="secondary"
            onClick={() => window.history.back()}
            className="h-9 rounded-lg px-5 text-sm font-medium"
          >
            {t('buttons.cancel')}
          </Button>
          <SaveButton
            id="tax-guideline-save-btn"
            label={
              isSaving
                ? isUpdate
                  ? t('buttons.updating')
                  : t('buttons.saving')
                : isUpdate
                  ? t('buttons.update')
                  : t('buttons.save')
            }
            onClick={() => {
              void handleUpdate();
            }}
            disabled={isSaving}
            className="h-9 rounded-lg px-6 text-sm font-semibold"
          />
        </div>
      </div>

      {/* ── Scrollable Body ────────────────────────────────────────────────── */}
      <div className="flex-1 px-6 py-5 flex flex-col gap-5">
        {fetchError && (
          <div className="shrink-0 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{t('errors.unableToLoad')}:</span>
              <span>{fetchError}</span>
              {statusCode ? (
                <span className="opacity-60">
                  {t('errors.httpStatus', { status: statusCode })}
                </span>
              ) : null}
            </div>
            <span className="text-[10px] bg-red-100 px-2 py-0.5 rounded text-red-600 font-semibold uppercase">
              {t('errors.offlineMode')}
            </span>
          </div>
        )}

        {/* ── Two-column Main Grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Left Column */}
          <div className="flex flex-col gap-5">
            {PRIMARY_LEFT_SECTIONS.map((sec) => (
              <GuidelineSectionCard
                key={sec.groupKey}
                groupKey={sec.groupKey}
                titleKey={sec.titleKey}
                guidelines={groupedGuidelines[sec.groupKey]}
                onChange={onChangeGuideline}
                isFieldDisabled={checkIsDisabled}
                t={t}
                policyConfigs={policyConfigs}
                colSpanToggle={sec.colSpanToggle}
              />
            ))}
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-5">
            {PRIMARY_RIGHT_SECTIONS.map((sec) => (
              <GuidelineSectionCard
                key={sec.groupKey}
                groupKey={sec.groupKey}
                titleKey={sec.titleKey}
                guidelines={groupedGuidelines[sec.groupKey]}
                onChange={onChangeGuideline}
                isFieldDisabled={checkIsDisabled}
                t={t}
                policyConfigs={policyConfigs}
                colSpanToggle={sec.colSpanToggle}
              />
            ))}
          </div>
        </div>

        {/* ── Dynamic Unmapped Section Groups ────────────────────────────── */}
        {unmappedGroups.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {unmappedGroups.map((group) => (
              <GuidelineSectionCard
                key={group}
                groupKey={group}
                titleKey={group}
                guidelines={groupedGuidelines[group]}
                onChange={onChangeGuideline}
                isFieldDisabled={checkIsDisabled}
                t={t}
                policyConfigs={policyConfigs}
              />
            ))}
          </div>
        )}

        {/* ── Collapsible Advanced Settings ───────────────────────────────── */}
        <details className="group bg-white border border-slate-200 rounded-xl shadow-sm transition-all duration-300">
          <summary className="flex items-center justify-between px-5 py-3.5 font-bold text-sm text-slate-800 cursor-pointer list-none select-none">
            <span>{t('sections.advancedSettings')}</span>
            <span className="transition group-open:rotate-180">
              <svg
                fill="none"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="24"
                className="text-slate-500 w-4 h-4"
              >
                <path d="M6 9l6 6 6-6"></path>
              </svg>
            </span>
          </summary>
          <div className="px-5 pb-5 pt-1 border-t border-slate-100 flex flex-col gap-5">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-1">
              <div className="flex flex-col gap-5">
                {ADVANCED_LEFT_SECTIONS.map((sec) => (
                  <GuidelineSectionCard
                    key={sec.groupKey}
                    groupKey={sec.groupKey}
                    titleKey={sec.titleKey}
                    guidelines={groupedGuidelines[sec.groupKey]}
                    onChange={onChangeGuideline}
                    isFieldDisabled={checkIsDisabled}
                    t={t}
                    policyConfigs={policyConfigs}
                    colSpanToggle={sec.colSpanToggle}
                  />
                ))}
              </div>
              <div className="flex flex-col gap-5">
                {ADVANCED_RIGHT_SECTIONS.map((sec) => (
                  <GuidelineSectionCard
                    key={sec.groupKey}
                    groupKey={sec.groupKey}
                    titleKey={sec.titleKey}
                    guidelines={groupedGuidelines[sec.groupKey]}
                    onChange={onChangeGuideline}
                    isFieldDisabled={checkIsDisabled}
                    t={t}
                    policyConfigs={policyConfigs}
                    colSpanToggle={sec.colSpanToggle}
                  />
                ))}
              </div>
            </div>
          </div>
        </details>

        <div className="shrink-0">
          <TaxGuidelineNoteFooter />
        </div>
      </div>
    </div>
  );
}
