'use client';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/ActionButton';
import { MasterTable } from '@/components/common/MasterTable';
import { Badge } from '@/components/common/Badge';
import { Select } from '@/components/common/select';
import { Info, Calculator } from 'lucide-react';

interface ExcelPreviewTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- next-intl translate functions
  t: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- next-intl translate functions
  tCommon: any;
  rows: Record<string, unknown>[];
  selectedScopeType: string;
  setSelectedScopeType: (val: string) => void;
  tableColumns: { key: string; label: string; width: string }[];
  paginatedRows: Record<string, unknown>[];
  pageNumber: number;
  pageSize: number;
  setPageNumber: (page: number) => void;
  setPageSize: (size: number) => void;
  calculatedStats: { eligible: number; total: number; skipped: number } | null;
  isCalculating: boolean;
  handleCalculateEligible: () => Promise<void>;
}

export function ExcelPreviewTable({
  t,
  tCommon,
  rows,
  selectedScopeType,
  setSelectedScopeType: _setSelectedScopeType,
  tableColumns,
  paginatedRows,
  pageNumber,
  pageSize,
  setPageNumber,
  setPageSize,
  calculatedStats,
  isCalculating,
  handleCalculateEligible
}: ExcelPreviewTableProps) {
  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-gray-900">{t('uploader.previewTitle')}</h3>
          <p className="text-xs text-gray-500 mt-1">{t('uploader.previewSubtitle')}</p>
        </div>

        {/* Scope display badge */}
        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <span className="text-xs font-semibold text-gray-500">{t('excel.scopeLabel')}</span>
          <Badge variant="default" size="md">
            {selectedScopeType === 'building'
              ? t('scopeSelection.scopes.buildingWise')
              : t('scopeSelection.scopes.propertyWise')}
          </Badge>
        </div>
      </div>

      {/* MasterTable preview of excel content */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <MasterTable
          columns={tableColumns}
          data={paginatedRows}
          totalCount={rows.length}
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalPages={Math.ceil(rows.length / pageSize)}
          onPageChange={setPageNumber}
          onPageSizeChange={setPageSize}
          paginationConfig={{ enabled: true, showPageSizeSelector: false }}
          height="sm"
          footerLeftContent={
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="text-gray-500 font-medium">
                {tCommon('table.showingEntries', {
                  start: rows.length === 0 ? 0 : (pageNumber - 1) * pageSize + 1,
                  end: Math.min(pageNumber * pageSize, rows.length),
                  total: rows.length
                })}
              </span>

              <Select
                options={[10, 20, 50, 100].map((s) => ({ label: String(s), value: String(s) }))}
                value={String(pageSize)}
                onChange={(_, val) => setPageSize(Number(val))}
                selectSize="sm"
                className="w-20"
              />

              {/* Calculated Stats Badges */}
              {calculatedStats ? (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" size="md">
                    {t('excel.total', { count: calculatedStats.total })}
                  </Badge>
                  <Badge variant="success" size="md">
                    {t('excel.eligible', { count: calculatedStats.eligible })}
                  </Badge>
                  <Badge variant="warning" size="md">
                    {t('excel.skipped', { count: calculatedStats.skipped })}
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                  <Info className="h-3.5 w-3.5" />
                  <span>{t('excel.verifyColumns')}</span>
                </div>
              )}
            </div>
          }
          footerRightContent={
            <Button
              variant="primary"
              size="sm"
              icon={Calculator}
              onClick={handleCalculateEligible}
              isLoading={isCalculating}
              disabled={isCalculating}
              className="py-1.5 h-8 text-xs font-semibold"
            >
              {t('dynamicFields.calculateEligible')}
            </Button>
          }
        />
      </div>
    </Card>
  );
}
