"use client";

import { useTaxZoning } from "@/hooks/taxZoning/useTaxZoning";
import { TaxZoningPageProps } from "@/types/taxzoning.types";
import { TaxZoningForm } from "./TaxZoningForm";
import { TaxZoningPreview } from "./TaxZoningPreview";
import { TaxZoningTable } from "./TaxZoningTable";

export default function TaxZoningPage(props: TaxZoningPageProps) {
  const {
    t,
    zone,
    setZone,
    ward,
    setWard,
    fromProps,
    setFromProps,
    toProps,
    setToProps,
    fileInputRef,
    zoneOptions,
    wardOptions,
    propertyOptionsByWard,
    loading,
    pageSizeOptions,
    pageSizes,
    currentPage,
    submitted,
    saving,
    previewPage,
    setPreviewPage,
    PREVIEW_PAGE_SIZE,
    hasImportedData,
    changePage,
    changePageSize,
    tableRecords,
    previewData,
    pagedPreviewData,
    columns,
    previewColumns,
    handleExportCSV,
    handleImportFile,
    handleSubmit,
    handleBulkUpdate,
    handleClearImported,
    isTaxZoneValid,
    isWardValid,
    isPropertyValid,
    isPropertyRangeValid,
    isFormValid,
    onFormClear,
    wardLabel,
    taxZoneLabel
  } = useTaxZoning(props);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaxZoningForm
          t={t}
          zone={zone}
          setZone={setZone}
          zoneOptions={zoneOptions}
          isTaxZoneValid={isTaxZoneValid}
          submitted={submitted}
          ward={ward}
          setWard={setWard}
          wardOptions={wardOptions}
          isWardValid={isWardValid}
          fromProps={fromProps}
          setFromProps={setFromProps}
          toProps={toProps}
          setToProps={setToProps}
          propertyOptionsByWard={propertyOptionsByWard}
          isPropertyValid={isPropertyValid}
          isPropertyRangeValid={isPropertyRangeValid}
          saving={saving}
          isFormValid={isFormValid}
          handleSubmit={handleSubmit}
          onClear={onFormClear}
          wardLabel={wardLabel}
          taxZoneLabel={taxZoneLabel}
        />

        <TaxZoningPreview
          t={t}
          previewData={previewData}
          pagedPreviewData={pagedPreviewData}
          previewColumns={previewColumns}
          previewPage={previewPage}
          setPreviewPage={setPreviewPage}
          PREVIEW_PAGE_SIZE={PREVIEW_PAGE_SIZE}
          zone={zone}
          ward={ward}
          fromProps={fromProps}
          toProps={toProps}
          taxZones={props.taxZones}
          wardsData={props.wardsData}
          wardLabel={wardLabel}
          taxZoneLabel={taxZoneLabel}
        />
      </div>

      <TaxZoningTable
        t={t}
        columns={columns}
        tableRecords={tableRecords}
        currentPage={currentPage}
        pageSizes={pageSizes}
        totalCount={props.totalCount}
        totalPages={props.totalPages}
        loading={loading}
        changePage={changePage}
        changePageSize={changePageSize}
        pageSizeOptions={pageSizeOptions}
        hasImportedData={hasImportedData}
        saving={saving}
        handleBulkUpdate={handleBulkUpdate}
        handleClearImported={handleClearImported}
        handleImportFile={handleImportFile}
        handleExportCSV={handleExportCSV}
        fileInputRef={fileInputRef}
      />
    </div>
  );
}
