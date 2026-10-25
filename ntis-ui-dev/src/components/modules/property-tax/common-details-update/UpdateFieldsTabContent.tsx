"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { PropertySelectionCriteria } from "./PropertySelectionCriteria";
import { EnabledFieldList } from "./EnabledFieldList";
import { PropertyPreviewGrid } from "./PropertyPreviewGrid";
import { BulkUpdateForm } from "./BulkUpdateForm";
import { cn } from "@/lib/utils/cn";

interface UpdateFieldsTabContentProps {
  t: (key: string) => string;
  updateData: any;
  isFieldListCollapsed: boolean;
  setIsFieldListCollapsed: (collapsed: boolean) => void;
  locale: string;
}

export const UpdateFieldsTabContent = (props: UpdateFieldsTabContentProps) => {
  const { updateData } = props;
  return (
    <div className="space-y-2">
      {/* Section 1: Property Selection Criteria */}
      <div className="border border-blue-200 rounded-xl bg-white overflow-visible">
        <div className="flex items-center justify-between px-4 py-3 border-b border-blue-200 bg-[#F8FAFF] rounded-t-xl">
          <div>
            <h3 className="text-sm font-semibold text-[#1E3A8A]">
              {props.t("propertyCriteria.title")}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {props.t("propertyCriteria.subtitle")}
            </p>
          </div>
        </div>

        <div className="p-2">
          <PropertySelectionCriteria
            key={updateData.resetKey}
            t={props.t}
            selectedScopeId={updateData.selectedScopeId}
            handleScopeChange={updateData.handleScopeChange}
            scopeOptions={updateData.scopeOptions}
            loadingScopeOptions={updateData.loadingScopeOptions}
            activeScopeDetails={updateData.activeScopeDetails}
            filterValues={updateData.filterValues}
            setFilterValues={updateData.setFilterValues}
            handleZoneChange={updateData.handleZoneChange}
            zoneOptions={updateData.zoneOptions}
            handleWardChange={updateData.handleWardChange}
            wardOptions={updateData.wardOptions}
            propertyTypeOptions={updateData.propertyTypeOptions}
            propertyOptions={updateData.propertyOptions}
            fromPropertyOptions={updateData.fromPropertyOptions}
            toPropertyOptions={updateData.toPropertyOptions}
            handlePropertyDropdownFocus={updateData.handlePropertyDropdownFocus}
            handleFromPropertyChange={updateData.handleFromPropertyChange}
            handleToPropertyChange={updateData.handleToPropertyChange}
            loadingPropertyOptions={updateData.loadingPropertyOptions}
            isPropertyDropdownDisabled={!updateData.filterValues.wardId}
            filterSubmitted={updateData.filterSubmitted}
            loadingShowProperties={updateData.loadingShowProperties}
            canShowProperties={updateData.canShowProperties}
            handleShowProperties={updateData.handleShowProperties}
            handleFilterCancel={updateData.handleBack}
            hasAnyFilterValue={updateData.hasAnyFilterValue}
            hasMore={updateData.propertyDropdownHasMore}
            onLoadMore={updateData.handleLoadMorePropertyOptions}
            isLoadingMore={updateData.loadingMorePropertyOptions}
            propertySearchTerm={updateData.propertySearchTerm}
            onPropertySearchChange={updateData.handlePropertyDropdownSearch}
            fromHasMore={updateData.fromPropertyDropdownHasMore}
            onFromLoadMore={updateData.handleLoadMoreFromPropertyOptions}
            isFromLoadingMore={updateData.loadingMoreFromPropertyOptions}
            fromPropertySearchTerm={updateData.fromPropertySearchTerm}
            onFromPropertySearchChange={updateData.handleFromPropertyDropdownSearch}
            loadingFromPropertyOptions={updateData.loadingFromPropertyOptions}
            toHasMore={updateData.toPropertyDropdownHasMore}
            onToLoadMore={updateData.handleLoadMoreToPropertyOptions}
            isToLoadingMore={updateData.loadingMoreToPropertyOptions}
            toPropertySearchTerm={updateData.toPropertySearchTerm}
            onToPropertySearchChange={updateData.handleToPropertyDropdownSearch}
            loadingToPropertyOptions={updateData.loadingToPropertyOptions}
          />
        </div>
      </div>

      {/* Lower Section: Flex Layout */}
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-490px)] min-h-[350px]">
        {/* Left: Enabled Field List */}
        <div className="w-full lg:w-4/12 h-full">
          <EnabledFieldList
            t={props.t}
            filteredMenuItems={updateData.filteredMenuItems}
            selectedCodes={updateData.selectedCodes}
            handleMenuSelect={(code) => updateData.handleMenuSelect(code, true)}
            locale={props.locale}
            selectionType="multi"
            searchValue={updateData.menuSearch}
            onSearchChange={updateData.setMenuSearch}
            isSearching={updateData.searchingMenu}
          />
        </div>

        {/* Center: Property Preview Grid */}
        <div className="flex flex-col min-h-0 h-full overflow-hidden transition-all duration-300 flex-1">
          <PropertyPreviewGrid
            t={props.t}
            properties={updateData.properties}
            filteredProperties={updateData.filteredProperties}
            pagedProperties={updateData.pagedProperties}
            totalCount={updateData.totalCount}
            loading={updateData.loadingProperties}
            selectedPropertyIds={updateData.selectedPropertyIds}
            allSelected={updateData.allSelected}
            isPropertySelected={updateData.isPropertySelected}
            onSelectAll={updateData.handleSelectAll}
            onPropertySelect={updateData.handlePropertySelect}
            propertiesPage={updateData.propertiesPage}
            setPropertiesPage={updateData.setPropertiesPage}
            pageSize={updateData.propertiesPageSize}
            onPageSizeChange={updateData.handlePropertiesPageSizeChange}
            pageSizeOptions={updateData.pageSizeOptions}
            searchTerm={updateData.propertiesSearchTerm}
            onSearchChange={updateData.handlePropertiesSearch}
            selectedMenuItem={updateData.selectedMenuItem}
            fieldConfigs={updateData.fieldConfigs}
            paginationInfo={updateData.paginationInfo}
            wardId={updateData.filterValues.wardId}
            fromPropertyNo={updateData.filterValues.fromPropertyNo}
            toPropertyNo={updateData.filterValues.toPropertyNo}
            optionsMap={updateData.optionsMap}
            lookupMap={updateData.lookupMap}
          />
        </div>

        {/* Right: New Values Form */}
        <div
          className={cn(
            "flex flex-col min-h-0 h-full shrink-0 transition-all duration-300",
            props.isFieldListCollapsed ? "flex-1" : "w-full lg:w-2/12"
          )}
        >
          <BulkUpdateForm
            t={props.t}
            selectedMenuItem={updateData.selectedMenuItem}
            fieldConfigs={updateData.fieldConfigs}
            loadingConfigs={updateData.loadingConfigs}
            formValues={updateData.formValues}
            formErrors={updateData.formErrors}
            formWarnings={updateData.formWarnings}
            formSubmitted={updateData.formSubmitted}
            saving={updateData.saving}
            selectedCount={updateData.selectedCount}
            onFieldChange={updateData.handleFormValueChange}
            onUpdate={updateData.handleSubmitBulkUpdate}
            onClear={updateData.handleFormClear}
            showValidationStatus={false}
            matchedProperties={updateData.totalCount}
            selectedFieldsCount={updateData.selectedCode ? 1 : 0}
            optionsMap={updateData.optionsMap}
            loadingMap={updateData.bindApiLoadingMap}
            hasMoreMap={updateData.bindApiHasMoreMap}
            loadingMoreMap={updateData.bindApiLoadingMoreMap}
            onFocus={updateData.handleBindApiFocus}
            onLoadMore={updateData.handleBindApiLoadMore}
            onSearchChange={updateData.handleBindApiSearchChange}
          />
        </div>
      </div>
    </div>
  );
};
