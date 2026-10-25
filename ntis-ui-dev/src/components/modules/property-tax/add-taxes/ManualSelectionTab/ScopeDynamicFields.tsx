import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MultiSelect } from '@/components/common/MultiSelect';
import { Select } from '@/components/common/select';
import { SearchSelect } from '@/components/common/SearchSelect';
import { SearchSelectPaginated } from '@/components/common/SearchSelectPaginated';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/ActionButton';
import { Info, Calculator } from 'lucide-react';
import { getFieldConfig, getHeaderTitle } from './utils/ScopeSelectionUtils';
import { Scope, ScopeOptionItem } from '@/types/addTaxes.types';

interface ScopeDynamicFieldsProps {
  selectedScope: Scope;
  currentScopeData: ScopeOptionItem | undefined;
  optionsToRender: string[];
  selectionData: Record<string, string[]>;
  handleSelectionChange: (key: string, values: string[], labels?: string[]) => void;
  zoneOptions: { value: string; label: string }[];
  fetchedWards: { value: string; label: string; zoneId: string }[];
  fetchWards: () => void;
  propertyTypeOptions: { value: string; label: string }[];
  fetchedBuildings: { value: string; label: string }[];
  fetchBuildings: (zones: string[] | null, wards: string[]) => void;
  hasMoreBuildings?: boolean;
  loadMoreBuildings?: () => void;
  isLoadingMoreBuildings?: boolean;
  isFetchingBuildings?: boolean;
  fetchedToBuildings?: { value: string; label: string }[];
  hasMoreToBuildings?: boolean;
  loadMoreToBuildings?: () => void;
  isLoadingMoreToBuildings?: boolean;
  isFetchingToBuildings?: boolean;
  isCalculating: boolean;
  isValidated: boolean;
  eligibleCount: number | null;
  handleCalculateEligible: () => void;
  assessmentStatusOptions?: { value: string; label: string }[];
  fetchAssessmentStatuses?: () => void;
  fetchZones?: () => void;
  fetchPropertyTypes?: () => void;
  fetchToBuildings?: (wardId: string, propertyFrom: string) => void;
  onBuildingSearch?: (text: string) => void;
  onToBuildingSearch?: (text: string) => void;
}

export function ScopeDynamicFields({
  selectedScope,
  currentScopeData,
  optionsToRender,
  selectionData,
  handleSelectionChange,
  zoneOptions,
  fetchedWards,
  fetchWards,
  propertyTypeOptions,
  fetchedBuildings,
  fetchBuildings,
  hasMoreBuildings,
  loadMoreBuildings,
  isLoadingMoreBuildings,
  isFetchingBuildings,
  fetchedToBuildings,
  hasMoreToBuildings,
  loadMoreToBuildings,
  isLoadingMoreToBuildings,
  isFetchingToBuildings,
  isCalculating,
  isValidated,
  eligibleCount,
  handleCalculateEligible,
  assessmentStatusOptions = [],
  fetchAssessmentStatuses,
  fetchZones,
  fetchPropertyTypes,
  fetchToBuildings,
  onBuildingSearch,
  onToBuildingSearch
}: ScopeDynamicFieldsProps) {
  const t = useTranslations('addTaxes');
  const [isToFieldBlurred, setIsToFieldBlurred] = useState(false);

  let rangeError: string | null = null;
  let hasRangeError = false;

  if (selectedScope === 'range') {
    const fromKey = Object.keys(selectionData).find(k => k.toLowerCase().includes('from'));
    const toKey = Object.keys(selectionData).find(k => k.toLowerCase().includes('to'));
    const fromVal = fromKey ? selectionData[fromKey]?.[0] : null;
    const toVal = toKey ? selectionData[toKey]?.[0] : null;

    const fromIndex = fetchedBuildings.findIndex(b => b.value === fromVal);
    const toIndex = fetchedBuildings.findIndex(b => b.value === toVal);

    if (fromIndex !== -1 && toIndex !== -1 && toIndex < fromIndex) {
      hasRangeError = true;
      if (isToFieldBlurred) {
        rangeError = t('messages.invalidRange');
      }
    }
  }

  if (!currentScopeData || !optionsToRender || optionsToRender.length === 0) return null;

  const isFormValid = optionsToRender.every(option => {
    const values = selectionData[option] || [];
    return values.length > 0 && values.some(v => v !== undefined && v !== null && v.trim() !== '');
  });

  return (
    <div className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl p-5 mb-2">
      <div className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-wider">
        {getHeaderTitle(selectedScope, currentScopeData.displayName, optionsToRender, t)}
      </div>

      {selectedScope === 'range' && (
        <div className="bg-orange-50 border border-orange-100 rounded-md p-3 flex items-start gap-3 mb-6">
          <Info className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-orange-800">{t('dynamicFields.rangeWarningTitle', { fallback: 'Select a specific property number range' })}</h4>
            <p className="text-xs text-orange-700 mt-1">{t('dynamicFields.rangeWarningDesc', { fallback: 'Range will be calculated only between the selected From Property and To Property. Zone/Ward duplication is avoided on this screen.' })}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {optionsToRender.map((option, index) => {
          const hasZone = optionsToRender.some((o: string) => o.toLowerCase().includes('zone'));
          const hasWard = optionsToRender.some((o: string) => o.toLowerCase().includes('ward'));

          let isAnyPreviousFieldEmpty = false;
          for (let i = 0; i < index; i++) {
            const prevOption = optionsToRender[i];
            const prevValues = selectionData[prevOption];
            if (!prevValues || prevValues.length === 0 || prevValues.every(v => v === undefined || v === null || String(v).trim() === '')) {
              isAnyPreviousFieldEmpty = true;
              break;
            }
          }
          const config = getFieldConfig(
            option,
            zoneOptions,
            selectionData,
            fetchedWards,
            fetchWards,
            propertyTypeOptions,
            fetchBuildings,
            fetchedBuildings,
            hasZone,
            hasWard,
            t,
            assessmentStatusOptions,
            fetchAssessmentStatuses,
            selectedScope,
            {
              hasMore: hasMoreBuildings,
              onLoadMore: loadMoreBuildings,
              isLoadingMore: isLoadingMoreBuildings,
              isFetching: isFetchingBuildings
            },
            {
              hasMore: hasMoreToBuildings,
              onLoadMore: loadMoreToBuildings,
              isLoadingMore: isLoadingMoreToBuildings,
              isFetching: isFetchingToBuildings
            },
            fetchedToBuildings,
            fetchZones,
            fetchPropertyTypes,
            fetchToBuildings,
            onBuildingSearch,
            onToBuildingSearch
          );

          const isDisabled = config.disabled || isAnyPreviousFieldEmpty;
          const isFullWidth = config.inputType === 'text' || config.label.toLowerCase().includes('search');
          return (
            <div key={option} className={isFullWidth ? "col-span-1 md:col-span-2 lg:col-span-3" : ""}>
              {config.inputType === 'multiselect' ? (
                <>
                  <MultiSelect
                    label={config.label}
                    required={config.required}
                    options={config.fallbackOptions}
                    value={selectionData[option] || []}
                    onChange={(vals) => {
                      const labels = vals.map(v => config.fallbackOptions?.find(o => o.value === v)?.label).filter(Boolean) as string[];
                      handleSelectionChange(option, vals, labels.length > 0 ? labels : undefined);
                    }}
                    placeholder={config.placeholder}
                    disabled={isDisabled}
                    onOpen={config.onOpen}
                    selectSize="sm"
                  />
                </>
              ) : config.inputType === 'select' ? (
                <Select
                  label={config.label}
                  placeholder={config.placeholder}
                  required={config.required}
                  options={config.fallbackOptions}
                  value={(selectionData[option] || [])[0] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const label = config.fallbackOptions?.find(o => String(o.value) === String(val))?.label;
                    handleSelectionChange(option, [val], label ? [label] : undefined);
                  }}
                  disabled={isDisabled}
                  selectSize="sm"
                />
              ) : config.inputType === 'searchselectpaginated' ? (
                <SearchSelectPaginated
                  label={config.label}
                  required
                  options={config.fallbackOptions}
                  value={selectionData[option]?.[0] || ''}
                  onChange={(_name, val) => {
                    const selectedOption = config.fallbackOptions?.find(o => String(o.value) === String(val));
                    const label = selectedOption?.label;
                    handleSelectionChange(option, val ? [val] : [], label ? [label] : []);
                    if (option.toLowerCase().includes('to')) {
                      setIsToFieldBlurred(true);
                    }
                  }}
                  placeholder={config.placeholder}
                  disabled={isDisabled}
                  onInputFocus={config.onOpen}
                  onSearchChange={config.onSearchChange}
                  error={option.toLowerCase().includes('to') ? (rangeError || undefined) : undefined}
                  onBlur={() => {
                    if (option.toLowerCase().includes('to')) {
                      setIsToFieldBlurred(true);
                    }
                  }}
                  hasMore={config.hasMore}
                  onLoadMore={config.onLoadMore}
                  isLoadingMore={config.isLoadingMore}
                  isLoading={config.isLoading}
                  key={option}
                />
              ) : config.inputType === 'searchselect' ? (
                <>
                  <SearchSelect
                    label={config.label}
                    required
                    options={config.fallbackOptions}
                    value={selectionData[option]?.[0] || ''}
                    onChange={(_name, val) => {
                      const selectedOption = config.fallbackOptions?.find(o => String(o.value) === String(val));
                      const label = selectedOption?.label;
                      handleSelectionChange(option, val ? [val] : [], label ? [label] : undefined);
                      if (option.toLowerCase().includes('to')) {
                        setIsToFieldBlurred(true);
                      }
                    }}
                    placeholder={config.placeholder}
                    disabled={isDisabled}
                    onInputFocus={config.onOpen}
                    error={option.toLowerCase().includes('to') ? (rangeError || undefined) : undefined}
                    onBlur={() => {
                      if (option.toLowerCase().includes('to')) {
                        setIsToFieldBlurred(true);
                      }
                    }}
                  />
                </>
              ) : (
                <Input
                  label={config.label}
                  required={config.required}
                  placeholder={config.placeholder}
                  value={selectionData[option]?.[0] || ''}
                  maxLength={(option.toLowerCase().includes('search') || option.toLowerCase().includes('specific')) ? 100 : undefined}
                  onChange={(e) => {
                    const optLower = option.toLowerCase();
                    const isSearchField = optLower.includes('search') || optLower.includes('specific');
                    const rawValue = e.target.value;
                    const sanitizedValue = isSearchField
                      ? rawValue.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 100)
                      : rawValue;
                    handleSelectionChange(option, [sanitizedValue]);
                  }}
                  fullWidth
                  disabled={isDisabled}
                  className="h-9 rounded-md border-slate-200 hover:border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              )}
            </div>
          );
        })}
        {selectedScope === 'ward' && (
          <div className="flex items-end h-[58px] pb-0.5 gap-4">
            <Button
              variant="primary"
              size="sm"
              icon={Calculator}
              onClick={handleCalculateEligible}
              isLoading={isCalculating}
              disabled={isCalculating || !isFormValid}
              className="h-[38px] px-5 flex-shrink-0"
            >
              {t('dynamicFields.calculateEligible')}
            </Button>
            {isValidated && eligibleCount !== null && (
              <span className="text-sm text-gray-500 font-medium whitespace-nowrap">
                <span className="text-gray-900 font-bold mr-1">{eligibleCount}</span>
                {t('executionValidation.eligibleRecordsSub')}
              </span>
            )}
          </div>
        )}
      </div>

      {selectedScope !== 'ward' && (
        <div>
          <div className="flex items-center gap-4 mt-6">
            <Button
              variant="primary"
              size="sm"
              icon={Calculator}
              onClick={handleCalculateEligible}
              isLoading={isCalculating}
              disabled={isCalculating || !isFormValid || (selectedScope === 'range' && hasRangeError)}
              className="flex-shrink-0"
            >
              {selectedScope === 'range' ? t('dynamicFields.calculateRange') : t('dynamicFields.calculateEligible')}
            </Button>
            {isValidated && eligibleCount !== null && (
              <span className="text-sm text-gray-500 font-medium">
                <span className="text-gray-900 font-bold mr-1">{eligibleCount}</span>
                {t('executionValidation.eligibleRecordsSub')}
              </span>
            )}
          </div>
          {selectedScope === 'range' && (
            <div className="text-[10px] text-gray-500 mt-2">
              {t('dynamicFields.internalValidationNotice')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
