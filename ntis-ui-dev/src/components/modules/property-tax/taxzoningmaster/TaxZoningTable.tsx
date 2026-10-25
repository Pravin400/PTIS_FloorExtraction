"use client";

import React from "react";
import { MapPin } from "lucide-react";
import { MasterTable, Column } from "@/components/common/MasterTable";
import { AddButton, CancelButton, ExportButton, ImportButton, Input } from "@/components/common";
import { ZoningRecord } from "@/types/taxzoning.types";

interface TaxZoningTableProps {
  t: (key: string, values?: Record<string, string | number>) => string;
  columns: Column<ZoningRecord>[];
  tableRecords: ZoningRecord[];
  currentPage: number;
  pageSizes: string;
  totalCount: number;
  totalPages: number;
  loading: boolean;
  changePage: (page: number) => void;
  changePageSize: (size: number) => void;
  pageSizeOptions: number[];
  hasImportedData: boolean;
  saving: boolean;
  handleBulkUpdate: () => void;
  handleClearImported: () => void;
  handleImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportCSV: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export const TaxZoningTable = ({
  t,
  columns,
  tableRecords,
  currentPage,
  pageSizes,
  totalCount,
  totalPages,
  loading,
  changePage,
  changePageSize,
  pageSizeOptions,
  hasImportedData,
  saving,
  handleBulkUpdate,
  handleClearImported,
  handleImportFile,
  handleExportCSV,
  fileInputRef,
}: TaxZoningTableProps) => {
  return (
    <MasterTable
      headerTitle=""
      height="xs"
      columns={columns}
      data={tableRecords}
      pageNumber={currentPage}
      pageSize={Number(pageSizes)}
      totalCount={totalCount}
      totalPages={totalPages}
      loading={loading}
      onPageChange={changePage}
      onPageSizeChange={changePageSize}
      pageSizeOptions={pageSizeOptions}
      paginationConfig={{
        enabled: true,
        showPageSizeSelector: true,
      }}
      headerExtra={
        <div className="flex flex-col gap-3 w-full md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 shrink-0">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-[#1E3A8A]">
              {t('table.zoningRecords')}
            </span>
          </div>

          <div className="flex flex-col gap-3 w-full sm:flex-row sm:flex-wrap sm:items-center sm:justify-start md:w-auto md:flex-nowrap md:justify-end ml-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <AddButton
                size="sm"
                label={t('form.bulkUpdate')}
                disabled={!hasImportedData || saving}
                onClick={handleBulkUpdate}
                className="px-3 py-1.5 text-xs rounded-md"
              />

              {hasImportedData && (
                <CancelButton
                  size="sm"
                  label={t('form.clearImported')}
                  onClick={handleClearImported}
                  className="px-3 py-1.5 text-xs rounded-md"
                />
              )}
            </div>

            <div className="flex">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleImportFile}
              />
              <ImportButton
                size="sm"
                label={t('buttons.importFile')}
                type="button"
                onClick={() => fileInputRef.current?.click()}
              />
            </div>

            <ExportButton
              size="sm"
              label={t('buttons.exportCSV')}
              onClick={handleExportCSV}
            />
          </div>
        </div>
      }
    />
  );
};
