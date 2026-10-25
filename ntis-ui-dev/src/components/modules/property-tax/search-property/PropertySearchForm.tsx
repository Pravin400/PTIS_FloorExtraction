'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { PropertySearchFormProps, SearchValidationKey } from '@/types/property-search';
import { usePropertySearchFilters, usePropertySearchForm } from '@/hooks/search-property';
import { TopFilterRow } from './form/TopFilterRow';
import { QuickSearchPanel } from './form/QuickSearchPanel';
import { KycSearchPanel } from './form/KycSearchPanel';
import { ValuesDuesPanel } from './form/ValuesDuesPanel';
import { SearchTabs } from './form/SearchTabs';
import { ActiveFiltersTags } from './form/ActiveFiltersTags';

/**
 * SSR-driven Property Search form.
 *
 * - All option lists (`zoneOptions`, `wardOptions`, `propertyDescriptionOptions`,
 *   `lookupOptions`) are fetched server-side and passed as props.
 * - Zone/ward changes trigger URL updates instantly; Next.js re-runs the page queries.
 * - Local draft state lives in `usePropertySearchForm`; URL → SSR → props
 *   keeps the draft in sync.
 */
export function PropertySearchForm({
  initialCriteria,
  activeTab,
  selectedStatus = null,
  zoneOptions,
  wardOptions,
  propertyTypeOptions,
  workflowStageOptions,
  propertyDescriptionOptions,
  lookupOptions,
  onSearch,
  onReset,
  onTabChange,
  onZoneChange,
  onWardChange,
  disabled = false,
  searchPending = false,
}: PropertySearchFormProps): React.ReactElement {
  const tValidation = useTranslations('propertySearch.form.validation');
  const tabDirectionRef = React.useRef<
    | 'to-kyc-first'
    | 'to-values-first'
    | 'to-starting-point'
    | 'to-quick-last'
    | 'to-kyc-last'
    | 'to-values-last'
    | null
  >(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  const validationT = React.useCallback(
    (key: SearchValidationKey) => tValidation(key),
    [tValidation]
  );

  const {
    formState,
    validationError,
    validationRef,
    fieldErrors,
    isSubmitDisabled,
    setField,
    handleInputChange,
    handleInputBlur,
    handleSelectChange,
    handleZoneChange,
    handleWardChange,
    handleSubmit,
    handleReset,
    handleClearField,
  } = usePropertySearchForm({
    initialCriteria,
    activeTab,
    selectedStatus,
    onSearch,
    onReset,
    onZoneChange,
    onWardChange,
    validationT,
  });

  const liveWardOptions = wardOptions;
  const liveLookupOptions = lookupOptions;

  const { propertyNoToOptions } = usePropertySearchFilters({
    lookupOptions: liveLookupOptions,
    propertyNoFrom: formState.propertyNoFrom,
  });

  const activeFiltersTags = (
    <ActiveFiltersTags
      formState={formState}
      propertyTypeOptions={propertyTypeOptions}
      workflowStageOptions={workflowStageOptions}
      zoneOptions={zoneOptions}
      wardOptions={liveWardOptions}
      propertyDescriptionOptions={propertyDescriptionOptions}
      onClearField={handleClearField}
    />
  );
  React.useEffect(() => {
    const focusTimer = setTimeout(() => {
      if (!formRef.current) return;

      const direction = tabDirectionRef.current;
      if (!direction) return;

      if (direction === 'to-kyc-first') {
        const kycFirst = document.getElementById('occupierName');
        if (kycFirst) kycFirst.focus();
      } else if (direction === 'to-values-first') {
        const valuesFirst = document.getElementById('valuationMethod');
        if (valuesFirst) valuesFirst.focus();
      } else if (direction === 'to-starting-point') {
        const propertyTypeInput = document.getElementById('Property Type');
        if (propertyTypeInput) propertyTypeInput.focus();
      } else if (
        direction === 'to-quick-last' ||
        direction === 'to-kyc-last' ||
        direction === 'to-values-last'
      ) {
        // Find the last focusable element in the form
        const focusableElements = Array.from(
          formRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden'
          );
        });
        if (focusableElements.length > 0) {
          focusableElements[focusableElements.length - 1].focus();
        }
      }
      tabDirectionRef.current = null;
    }, 50);
    return () => clearTimeout(focusTimer);
  }, [activeTab]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Tab') {
      const form = e.currentTarget;
      const focusableElements = Array.from(
        form.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== 'none' &&
          style.visibility !== 'hidden'
        );
      });

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          const prevTab = 'values-dues';
          tabDirectionRef.current = 'to-values-last';
          onTabChange(prevTab);
          e.preventDefault();
        } else if (
          activeTab === 'kyc' &&
          document.activeElement === document.getElementById('occupierName')
        ) {
          const prevTab = 'quick-search';
          tabDirectionRef.current = 'to-quick-last';
          onTabChange(prevTab);
          e.preventDefault();
        } else if (
          activeTab === 'values-dues' &&
          document.activeElement === document.getElementById('valuationMethod')
        ) {
          const prevTab = 'kyc';
          tabDirectionRef.current = 'to-kyc-last';
          onTabChange(prevTab);
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          if (activeTab === 'quick-search') {
            tabDirectionRef.current = 'to-kyc-first';
            onTabChange('kyc');
            e.preventDefault();
          } else if (activeTab === 'kyc') {
            tabDirectionRef.current = 'to-values-first';
            onTabChange('values-dues');
            e.preventDefault();
          } else if (activeTab === 'values-dues') {
            tabDirectionRef.current = 'to-starting-point';
            onTabChange('quick-search');
            e.preventDefault();
          }
        }
      }
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-1" onKeyDown={handleKeyDown}>
      <div data-filter-field>
        <TopFilterRow
          formState={formState}
          propertyTypeOptions={propertyTypeOptions}
          workflowStageOptions={workflowStageOptions}
          zoneOptions={zoneOptions}
          wardOptions={liveWardOptions}
          propertyDescriptionOptions={propertyDescriptionOptions}
          disabled={disabled}
          onSelectChange={handleSelectChange}
          onZoneChange={handleZoneChange}
          onWardChange={handleWardChange}
          onClearField={handleClearField}
        />
      </div>

      <SearchTabs
        activeTab={activeTab}
        validationError={validationError}
        validationRef={validationRef}
        onTabChange={onTabChange}
        activeFiltersTags={activeFiltersTags}
        quickPanel={
          <div data-filter-field>
            <QuickSearchPanel
              formState={formState}
              lookupOptions={liveLookupOptions}
              propertyNoToOptions={propertyNoToOptions}
              fieldErrors={fieldErrors}
              disabled={disabled}
              setField={setField}
              onFieldBlur={handleInputBlur}
              searchPending={searchPending}
              isSubmitDisabled={isSubmitDisabled}
              onReset={handleReset}
              onClearField={handleClearField}
            />
          </div>
        }
        kycPanel={
          <div data-filter-field>
            <KycSearchPanel
              formState={formState}
              fieldErrors={fieldErrors}
              disabled={disabled}
              onInputChange={handleInputChange}
              onInputBlur={handleInputBlur}
              searchPending={searchPending}
              isSubmitDisabled={isSubmitDisabled}
              onReset={handleReset}
              onClearField={handleClearField}
            />
          </div>
        }
        valuesDuesPanel={
          <div data-filter-field>
            <ValuesDuesPanel
              formState={formState}
              fieldErrors={fieldErrors}
              disabled={disabled}
              onSelectChange={handleSelectChange}
              onInputChange={handleInputChange}
              onInputBlur={handleInputBlur}
              searchPending={searchPending}
              isSubmitDisabled={isSubmitDisabled}
              onReset={handleReset}
              onClearField={handleClearField}
            />
          </div>
        }
      />
    </form>
  );
}
