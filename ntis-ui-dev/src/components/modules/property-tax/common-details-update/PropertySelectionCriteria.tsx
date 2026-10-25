"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { SearchSelect, SaveButton, CancelButton } from "@/components/common";
import { PropertyRangeFields } from "./PropertyRangeFields";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface PropertySelectionCriteriaProps {
  t: (key: string, values?: Record<string, string | number>) => string;
  selectedScopeId: number | null;
  handleScopeChange: (val: number) => void;
  scopeOptions: any[];
  loadingScopeOptions: boolean;
  activeScopeDetails: any;
  filterValues: any;
  setFilterValues: any;
  handleZoneChange: (val: string) => void;
  zoneOptions: any[];
  handleWardChange: (val: string) => void;
  wardOptions: any[];
  propertyTypeOptions: any[];
  propertyOptions?: any[];
  fromPropertyOptions: any[];
  toPropertyOptions: any[];
  handlePropertyDropdownFocus: () => void;
  loadingPropertyOptions: boolean;
  isPropertyDropdownDisabled: boolean;
  filterSubmitted: boolean;
  loadingShowProperties: boolean;
  canShowProperties: boolean;
  handleShowProperties: () => void;
  handleFilterCancel: () => void;
  hasAnyFilterValue: boolean;
  handleFromPropertyChange: (val: string) => void;
  handleToPropertyChange: (val: string) => void;
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
  hideActionButtons?: boolean;
  fieldClassName?: string;
  renderChildrenInline?: boolean;
  children?: React.ReactNode;
}

export const PropertySelectionCriteria = ({
  t,
  selectedScopeId,
  handleScopeChange,
  scopeOptions,
  loadingScopeOptions,
  activeScopeDetails,
  filterValues,
  setFilterValues,
  handleZoneChange,
  zoneOptions,
  handleWardChange,
  wardOptions,
  propertyTypeOptions,
  propertyOptions,
  fromPropertyOptions,
  toPropertyOptions,
  handlePropertyDropdownFocus,
  handleFromPropertyChange,
  handleToPropertyChange,
  loadingPropertyOptions,
  isPropertyDropdownDisabled,
  filterSubmitted,
  loadingShowProperties,
  canShowProperties,
  handleShowProperties,
  handleFilterCancel,
  hasAnyFilterValue,
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
  hideActionButtons,
  fieldClassName,
  renderChildrenInline = false,
  children,
}: PropertySelectionCriteriaProps) => {
  const zoneLabel = useAliasLabel("Zone", t("aliasFallback.zone"));
  const wardLabel = useAliasLabel("Ward", t("aliasFallback.ward"));
  const colClass = fieldClassName || "col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2 relative z-[60] flex flex-col [&_ul]:!max-h-[240px] [&_[role=listbox]]:!max-h-[240px]";

  return (
    <div className="grid grid-cols-12 gap-2.5 sm:gap-3 items-start relative z-50 [&_ul]:!max-h-[240px] [&_[role=listbox]]:!max-h-[240px]">
      <div className={colClass}>
        <SearchSelect
          id="scope-select"
          label={t("propertyCriteria.selectionCriteria")}
          value={selectedScopeId ? String(selectedScopeId) : ""}
          onChange={(_, val) => handleScopeChange(Number(val))}
          options={scopeOptions.map(opt => ({
            label: (opt.name === "WardSector" ? t("propertyCriteria.scopes.WardSector", { ward: wardLabel }) : t(`propertyCriteria.scopes.${opt.name}`)) || opt.displayName,
            value: String(opt.id)
          }))}
          disabled={loadingScopeOptions}
          isLoading={loadingScopeOptions}
          placeholder={t("propertyCriteria.selectCriteria") || "Select Criteria"}
        />
      </div>

      {activeScopeDetails?.options.includes("Zone") && (
        <div className={colClass}>
          <SearchSelect
            id="zone-select"
            label={t("filter.zoneNumber", { zone: zoneLabel })}
            value={filterValues.zoneId}
            onChange={(_, val) => handleZoneChange(val)}
            options={zoneOptions}
            placeholder={t("filter.selectZone", { zone: zoneLabel })}
            required
          />
        </div>
      )}

      {activeScopeDetails?.options.includes("Ward") && (
        <div className={colClass}>
          <SearchSelect
            id="ward-select"
            label={t("filter.wardNumber", { ward: wardLabel })}
            value={filterValues.wardId}
            onChange={(_, val) => handleWardChange(val)}
            options={wardOptions}
            placeholder={t("filter.selectWard", { ward: wardLabel })}
            required
            disabled={activeScopeDetails?.options.includes("Zone") && !filterValues.zoneId}
          />
        </div>
      )}

      {activeScopeDetails?.options.includes("Property Type") && activeScopeDetails?.name !== "WardSector" && (
        <div className={colClass}>
          <SearchSelect
            id="property-type-select"
            label={t("filter.propertyType")}
            options={propertyTypeOptions}
            value={filterValues.propertyTypeId}
            onChange={(_, val) =>
              setFilterValues((prev: any) => ({
                ...prev,
                propertyTypeId: val,
              }))
            }
            placeholder={t("filter.selectPropertyType")}
            required
          />
        </div>
      )}

      <PropertyRangeFields
        t={t}
        activeScopeDetails={activeScopeDetails}
        filterValues={filterValues}
        propertyOptions={propertyOptions}
        fromPropertyOptions={fromPropertyOptions}
        toPropertyOptions={toPropertyOptions}
        handlePropertyDropdownFocus={handlePropertyDropdownFocus}
        handleFromPropertyChange={handleFromPropertyChange}
        handleToPropertyChange={handleToPropertyChange}
        loadingPropertyOptions={loadingPropertyOptions}
        isPropertyDropdownDisabled={isPropertyDropdownDisabled}
        filterSubmitted={filterSubmitted}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        isLoadingMore={isLoadingMore}
        propertySearchTerm={propertySearchTerm}
        onPropertySearchChange={onPropertySearchChange}
        fromHasMore={fromHasMore}
        onFromLoadMore={onFromLoadMore}
        isFromLoadingMore={isFromLoadingMore}
        fromPropertySearchTerm={fromPropertySearchTerm}
        onFromPropertySearchChange={onFromPropertySearchChange}
        loadingFromPropertyOptions={loadingFromPropertyOptions}
        toHasMore={toHasMore}
        onToLoadMore={onToLoadMore}
        isToLoadingMore={isToLoadingMore}
        toPropertySearchTerm={toPropertySearchTerm}
        onToPropertySearchChange={onToPropertySearchChange}
        loadingToPropertyOptions={loadingToPropertyOptions}
        fieldClassName={fieldClassName}
      />

      {!hideActionButtons && (
        <div className="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2 flex flex-col justify-end">
          <div className="h-[20px] mb-1.5 hidden sm:block" />
          <div className="flex gap-2 shrink-0 items-center">
            <SaveButton
              label={loadingShowProperties ? t("loading.message") : t("filter.show")}
              onClick={handleShowProperties}
              disabled={loadingShowProperties || !canShowProperties}
              size="sm"
            />
            <CancelButton
              label={t("filter.clear")}
              onClick={handleFilterCancel}
              size="sm"
              disabled={!hasAnyFilterValue}
            />
          </div>
        </div>
      )}

      {children && !renderChildrenInline && (
        <div className="col-span-12 mt-2 pt-2 border-t border-gray-100 flex items-center gap-x-2 flex-wrap">
          {children}
        </div>
      )}
      {children && renderChildrenInline && (
        <>{children}</>
      )}
    </div>
  );
};
