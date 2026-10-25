/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { SearchSelectPaginated } from "@/components/common";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface PropertyRangeFieldsProps {
  t: (key: string, values?: Record<string, string | number>) => string;
  activeScopeDetails: any;
  filterValues: any;
  propertyOptions?: any[];
  fromPropertyOptions: any[];
  toPropertyOptions: any[];
  handlePropertyDropdownFocus: () => void;
  handleFromPropertyChange: (val: string) => void;
  handleToPropertyChange: (val: string) => void;
  loadingPropertyOptions: boolean;
  isPropertyDropdownDisabled: boolean;
  filterSubmitted: boolean;
  hasMore?: boolean;
  onLoadMore?: (searchQuery?: string) => void;
  isLoadingMore?: boolean;
  propertySearchTerm?: string;
  onPropertySearchChange?: (val: string) => void;
  fromHasMore?: boolean;
  onFromLoadMore?: (searchQuery?: string) => void;
  isFromLoadingMore?: boolean;
  fromPropertySearchTerm?: string;
  onFromPropertySearchChange?: (val: string) => void;
  loadingFromPropertyOptions?: boolean;
  toHasMore?: boolean;
  onToLoadMore?: (searchQuery?: string) => void;
  isToLoadingMore?: boolean;
  toPropertySearchTerm?: string;
  onToPropertySearchChange?: (val: string) => void;
  loadingToPropertyOptions?: boolean;
  fieldClassName?: string;
}

export const PropertyRangeFields = ({
  t,
  activeScopeDetails,
  filterValues,
  propertyOptions,
  fromPropertyOptions,
  toPropertyOptions,
  handlePropertyDropdownFocus,
  handleFromPropertyChange,
  handleToPropertyChange,
  loadingPropertyOptions,
  isPropertyDropdownDisabled,
  hasMore,
  onLoadMore,
  isLoadingMore,
  propertySearchTerm,
  onPropertySearchChange,
  fromHasMore,
  onFromLoadMore,
  isFromLoadingMore,
  fromPropertySearchTerm,
  onFromPropertySearchChange,
  loadingFromPropertyOptions,
  toHasMore,
  onToLoadMore,
  isToLoadingMore,
  toPropertySearchTerm,
  onToPropertySearchChange,
  loadingToPropertyOptions,
  fieldClassName,
}: PropertyRangeFieldsProps) => {
  const propertyNoLabel = useAliasLabel("Property_No", t("aliasFallback.propertyNo"));
  const colClass = fieldClassName || "col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2 relative z-[60] flex flex-col [&_ul]:!max-h-[240px] [&_[role=listbox]]:!max-h-[240px]";

  return (
    <>
      {activeScopeDetails?.options.includes("Property No") && (
        <div className={colClass}>
          <SearchSelectPaginated
            id="property-no-select"
            label={t("filter.propertyNo", { propertyNo: propertyNoLabel })}
            key={`prop-no-${filterValues.wardId}`}
            options={propertyOptions || fromPropertyOptions}
            value={filterValues.fromPropertyNo}
            onChange={(_, val) => handleFromPropertyChange(val)}
            onInputFocus={handlePropertyDropdownFocus}
            placeholder={loadingPropertyOptions ? t("loading.message") : t("filter.selectPropertyNo", { propertyNo: propertyNoLabel })}
            required
            disabled={isPropertyDropdownDisabled}
            isLoading={loadingPropertyOptions}
            hasMore={hasMore}
            onLoadMore={onLoadMore}
            isLoadingMore={isLoadingMore}
            forceSearchText={propertySearchTerm}
            onSearchChange={onPropertySearchChange}
          />
        </div>
      )}

      {activeScopeDetails?.options.includes("From Property") && (
        <div className={colClass}>
          <SearchSelectPaginated
            id="from-property-select"
            label={t("filter.fromPropertyNo", { propertyNo: propertyNoLabel })}
            key={`from-prop-${filterValues.wardId}`}
            options={fromPropertyOptions}
            value={filterValues.fromPropertyNo}
            onChange={(_, val) => handleFromPropertyChange(val)}
            onInputFocus={handlePropertyDropdownFocus}
            placeholder={loadingFromPropertyOptions ? t("loading.message") : t("filter.selectFromPropertyNo", { propertyNo: propertyNoLabel })}
            required
            disabled={isPropertyDropdownDisabled}
            isLoading={loadingFromPropertyOptions ?? loadingPropertyOptions}
            hasMore={fromHasMore ?? hasMore}
            onLoadMore={onFromLoadMore ?? onLoadMore}
            isLoadingMore={isFromLoadingMore ?? isLoadingMore}
            forceSearchText={fromPropertySearchTerm ?? propertySearchTerm}
            onSearchChange={onFromPropertySearchChange ?? onPropertySearchChange}
          />
        </div>
      )}

      {activeScopeDetails?.options.includes("To Property") && (
        <div className={colClass}>
          <SearchSelectPaginated
            id="to-property-select"
            label={t("filter.toPropertyNo", { propertyNo: propertyNoLabel })}
            key={`to-prop-${filterValues.fromPropertyNo}`}
            options={toPropertyOptions}
            value={filterValues.toPropertyNo}
            onChange={(_, val) => handleToPropertyChange(val)}
            onInputFocus={handlePropertyDropdownFocus}
            placeholder={loadingToPropertyOptions ? t("loading.message") : t("filter.selectToPropertyNo", { propertyNo: propertyNoLabel })}
            required
            disabled={isPropertyDropdownDisabled || !filterValues.fromPropertyNo}
            isLoading={loadingToPropertyOptions}
            hasMore={toHasMore}
            onLoadMore={onToLoadMore}
            isLoadingMore={isToLoadingMore}
            forceSearchText={toPropertySearchTerm}
            onSearchChange={onToPropertySearchChange}
          />
        </div>
      )}
    </>
  );
};
