"use client";

import { Eye } from "lucide-react";
import { Card, CardHeader } from "@/components/common";
import { MasterTable, Column } from "@/components/common/MasterTable";
import { PreviewRow, TaxZoningPageProps } from "@/types/taxzoning.types";

interface TaxZoningPreviewProps {
  t: (key: string, values?: Record<string, string | number>) => string;
  previewData: PreviewRow[];
  pagedPreviewData: PreviewRow[];
  previewColumns: Column<PreviewRow>[];
  previewPage: number;
  setPreviewPage: (page: number) => void;
  PREVIEW_PAGE_SIZE: number;
  zone: string;
  ward: string[];
  fromProps: string;
  toProps: string;
  taxZones: TaxZoningPageProps['taxZones'];
  wardsData: TaxZoningPageProps['wardsData'];
  wardLabel?: string;
  taxZoneLabel?: string;
}

export const TaxZoningPreview = ({
  t,
  previewData,
  pagedPreviewData,
  previewColumns,
  previewPage,
  setPreviewPage,
  PREVIEW_PAGE_SIZE,
  zone,
  ward,
  fromProps,
  toProps,
  taxZones,
  wardsData,
  wardLabel,
  taxZoneLabel,
}: TaxZoningPreviewProps) => {
  return (
    <Card
      variant="default"
      padding="none"
      className="border border-blue-200 rounded-xl shadow-sm min-h-[400px] max-h-[500px]"
    >
      <CardHeader className="flex items-center justify-between px-4 py-3 border-b bg-[#F8FAFF] rounded-t-xl mb-0">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-[#1E3A8A]">
            {t('preview.title')}
          </span>
        </div>
        <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
          {previewData.length} {t('columns.propertyNo')}
        </span>
      </CardHeader>

      <div className="grid grid-cols-3 gap-3 px-4 py-3">
        <div className="border border-blue-200 bg-[#F1F7FF] rounded-md px-2 py-1 flex justify-between items-center gap-2">
          <p className="text-[12px] font-semibold text-blue-700">
            {t('form.taxZone', { taxZone: taxZoneLabel ?? '' })}
          </p>
          <p className="text-[12px] text-gray-900">
            {zone
              ? (taxZones.items.find(z => String(z.id) === zone)?.taxZoneNo || zone)
              : t('form.selectTaxZone', { taxZone: taxZoneLabel ?? '' })}
          </p>
        </div>

        <div className="border border-blue-200 bg-[#F1F7FF] rounded-md px-2 py-1 flex justify-between items-center gap-2">
          <p className="text-[12px] font-semibold text-blue-700">
            {t('form.ward', { ward: wardLabel ?? '' })}
          </p>
          <p className="text-[12px] text-gray-900 text-right">
            {Array.isArray(ward) && ward.length > 0
              ? ward.map(wardId =>
                wardsData.items.find(w => String(w.id) === wardId)?.wardNo || wardId
              ).join(", ")
              : t('form.selectWard', { ward: wardLabel ?? '' })}
          </p>
        </div>

        <div className="border border-blue-200 bg-[#F1F7FF] rounded-md px-2 py-1 flex justify-between items-center gap-2">
          <p className="text-[12px] font-semibold text-blue-700">
            {t('columns.propertyNo')}
          </p>
          <p className="text-[12px] text-gray-900">
            {fromProps.length && toProps.length
              ? `${fromProps} → ${toProps}`
              : t('preview.notSpecified')}
          </p>
        </div>
      </div>

      <div className="mx-4 mb-4 overflow-hidden">
        {previewData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-10 h-10 mb-2 rounded-full bg-blue-50 flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              {t('preview.noPropertiesToPreview')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {t('preview.selectZoneWardProperty', { taxZone: taxZoneLabel ?? '', ward: wardLabel ?? '' })}
            </p>
          </div>
        )}

        {previewData.length > 0 && (
          <MasterTable
            headerTitle=""
            columns={previewColumns}
            data={pagedPreviewData}
            pageNumber={previewPage}
            pageSize={PREVIEW_PAGE_SIZE}
            totalCount={previewData.length}
            totalPages={Math.ceil(previewData.length / PREVIEW_PAGE_SIZE)}
            onPageChange={setPreviewPage}
            paginationConfig={{
              enabled: true,
              showPageSizeSelector: false,
            }}
            footerClassName="px-4 py-2"
          />
        )}
      </div>
    </Card>
  );
};
