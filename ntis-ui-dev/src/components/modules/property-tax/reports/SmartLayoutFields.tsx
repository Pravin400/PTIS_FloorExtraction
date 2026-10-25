
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Input, SearchSelect, MultiSelect, Badge, Button } from '@/components/common';
import { SearchSelectPaginated } from '@/components/common/SearchSelectPaginated';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ReportParamField } from './ReportParamField';
import type { PropertySelectionMode } from '@/hooks/reports/useSmartLayoutState';

export function SmartLayoutFields({
  state,
  actions,
  options,
  errors,
  extraParams,
  paramValues,
  handleParamChange,
  paramFieldCopy,
  zones,
  financialYears,
  fetchWards,
  paginatedProperties,
  hasMoreProperties,
  loadMoreProperties,
  isLoadingMoreProperties,
  isFetchingProperties,
  onPropertySearchChange,
  selectedProperties,
  setIsPropertyDrawerOpen,
  wardLoading,
}: any) {
  const t = useTranslations('report.params');
  const {
    selectionMode, financialYear, zoneId, wardId, fromProperty, toProperty,
    propertyNo, amountOperator, amountValue, propertyDescription, assessmentStatus
  } = state;

  const {
    setSelectionMode, setFinancialYear, setZoneId, setWardId, setFromProperty, setToProperty,
    setPropertyNo, setPartitionNo, setAmountOperator, setAmountValue, setPropertyDescription, setAssessmentStatus
  } = actions;

  const {
    fyOptions, zoneOptions, wardOptions, propertyDescriptionOptions, assessmentStatusOptions
  } = options;

  const propertyDisplayOptions = propertyNo.includes('|') && !paginatedProperties.some(
    (option: { value: string }) =>
      String(option.value).toLowerCase() === String(propertyNo).toLowerCase()
  )
    ? [{
        value: propertyNo,
        label: propertyNo.slice(0, propertyNo.lastIndexOf('|')).replace(/\//g, '-'),
      }, ...paginatedProperties]
    : paginatedProperties;

  return (
    <>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 items-start">
        {/* 1. Select Criteria — dropdown */}
        <SearchSelect
          name="propertySelectionMode"
          label={t('propertySelection')}
          required
          placeholder={t('selectMode')}
          options={[
            { value: 'ward', label: t('wardWise') },
            { value: 'range', label: t('fromToProperty') },
            { value: 'property', label: t('individualProperty') },
          ]}
          value={selectionMode}
          onChange={(_, v) => setSelectionMode(v as PropertySelectionMode)}
          error={errors['propertySelectionMode']}
        />

        {/* 2. Financial Year */}
        <SearchSelect
          name="financialYear"
          label={t('financialYear')}
          required
          placeholder={t('selectYear')}
          options={fyOptions}
          value={financialYear}
          onChange={(_, v) => setFinancialYear(v)}
          error={errors['financialYear']}
        />

        {/* 3. Zone/Node (Shown when a criteria mode is selected) */}
        {selectionMode && (
          <SearchSelect
            name="zone"
            label={t('zoneNo')}
            required
            placeholder={t('selectZone')}
            options={zoneOptions}
            value={zoneId}
            onChange={(_, v) => setZoneId(v)}
            error={errors['zone']}
          />
        )}

        {/* 4. Ward/Sector (Shown when a criteria mode is selected) */}
        {selectionMode && (
          <MultiSelect
            name="ward"
            label={t('wardNo')}
            required
            placeholder={
              !zoneId ? t('selectZoneFirst')
                : wardLoading ? t('loading')
                  : t('selectWard')
            }
            options={wardOptions}
            value={wardId}
            disabled={!zoneId || wardLoading}
            onChange={(selected) => setWardId(selected)}
            error={!!errors['ward']}
            selectSize="sm"
            className="[&>button]:!rounded-md [&>button]:!shadow-sm"
          />
        )}

        {/* 5. Property Description (API Connected) */}
        <MultiSelect
          name="propertyDescription"
          label={t('propertyDescription')}
          placeholder={t('selectDescription')}
          options={propertyDescriptionOptions}
          value={propertyDescription}
          onChange={(selected) => setPropertyDescription(selected)}
          selectSize="sm"
          className="[&>button]:!rounded-md [&>button]:!shadow-sm"
        />

        {/* 6. Assessment Type (API Connected) */}
        <MultiSelect
          name="assessmentStatus"
          label={t('assessmentType')}
          placeholder={t('selectAssessmentType')}
          options={assessmentStatusOptions}
          value={assessmentStatus}
          onChange={(selected) => setAssessmentStatus(selected)}
          selectSize="sm"
          className="[&>button]:!rounded-md [&>button]:!shadow-sm"
        />

        {/* 7. Property Demand */}
        <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-2">
          <label className="text-xs font-semibold text-gray-700">{t('propertyDemand')}</label>
          <div className="flex w-full max-w-xs items-center gap-1.5">
            <div className="w-36 flex-shrink-0">
              <SearchSelect
                name="amountOperator"
                options={[
                  { value: 'greater_than', label: t('greaterThan') },
                  { value: 'less_than', label: t('lessThan') },
                  { value: 'top', label: t('top') },
                ]}
                value={amountOperator}
                onChange={(_, v) => setAmountOperator(v)}
                disableSearch
              />
            </div>
            <div className="flex-1 min-w-0">
              <Input
                type="number"
                name="amount"
                min={0}
                fullWidth
                placeholder={t('enterAmount')}
                value={amountValue}
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setAmountValue('');
                    return;
                  }
                  const num = Number(val);
                  if (num < 0) {
                    setAmountValue('0');
                  } else {
                    setAmountValue(val);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Row: From Property No & To Property No (Range mode) */}
      {selectionMode === 'range' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 items-start mt-4">
          <Input
            type="text"
            name="fromPropertyNo"
            label={t('fromProperty')}
            required
            fullWidth
            placeholder={t('eg1')}
            value={fromProperty}
            onChange={(e) => setFromProperty(e.target.value)}
            error={errors['fromPropertyNo']}
          />
          <Input
            type="text"
            name="toPropertyNo"
            label={t('toProperty')}
            required
            fullWidth
            placeholder={t('eg10')}
            value={toProperty}
            onChange={(e) => setToProperty(e.target.value)}
            error={errors['toPropertyNo']}
          />
        </div>
      )}

      {/* Dedicated Row: Single Property No (Individual Property mode) */}
      {selectionMode === 'property' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 items-start mt-4">
          <SearchSelectPaginated
            name="propertyNo"
            label={t('propertyNo')}
            required
            options={propertyDisplayOptions}
            placeholder={t('egPropertyNo')}
            value={propertyNo}
            onChange={(_, val) => {
              setPropertyNo(val);
              const selectedProperty = paginatedProperties.find(
                (option: { value: string; partitionNo?: string }) => option.value === val
              );
              if (selectedProperty?.partitionNo !== undefined) {
                setPartitionNo(selectedProperty.partitionNo);
                return;
              }
              let labelVal = val;
              if (val.includes('|')) {
                labelVal = val.split('|')[0];
              }
              const separatorIndex = labelVal.lastIndexOf('-');
              if (separatorIndex >= 0) {
                setPartitionNo(labelVal.slice(separatorIndex + 1).trim());
              } else {
                setPartitionNo('');
              }
            }}
            error={errors['propertyNo']}
            hasMore={hasMoreProperties}
            onLoadMore={loadMoreProperties}
            isLoadingMore={isLoadingMoreProperties}
            isLoading={isFetchingProperties}
            onSearchChange={onPropertySearchChange}
          />
        </div>
      )}

      {/* Summary chip when properties are selected in 'property' mode */}
      {selectionMode === 'property' && selectedProperties.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 mt-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <Badge variant="default" size="md">
              {selectedProperties.length} {t('propertiesSelected')}
            </Badge>
          </div>
          <Button
            type="button"
            onClick={() => setIsPropertyDrawerOpen(true)}
            className="text-xs text-blue-600 font-medium underline hover:text-blue-800 p-0 h-auto bg-transparent border-0"
            variant="ghost"
          >
            {t('viewEdit')}
          </Button>
        </div>
      )}

      {extraParams.length > 0 && (
        <div className="mt-4 grid grid-cols-1 items-start gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {extraParams.map((param: any) => (
            <ReportParamField
              key={param.parameterKey}
              param={param}
              value={paramValues[param.parameterKey] ?? ''}
              parentValue={param.cascadeFromKey ? (paramValues[param.cascadeFromKey] ?? '') : undefined}
              onChange={handleParamChange}
              onBlur={() => { }}
              error={errors[param.parameterKey]}
              copy={paramFieldCopy}
              zones={zones}
              financialYears={financialYears}
              fetchWards={fetchWards}
            />
          ))}
        </div>
      )}
    </>
  );
}
