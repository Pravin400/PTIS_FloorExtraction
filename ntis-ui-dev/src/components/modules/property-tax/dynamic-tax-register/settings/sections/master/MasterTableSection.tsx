import { useTranslations } from 'next-intl';
import { MasterTable } from '@/components/common/MasterTable';
import { TaxMasterMappingRow, YearRangeOption } from '@/types/dynamic-tax-register.types';
import { getMasterColumns } from './masterColumns';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

const MST_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export interface MasterTableSectionProps {
  mstRows: TaxMasterMappingRow[];
  mstBusy: boolean;
  mstPage: number;
  mstPageSize: number;
  mstTotalPages: number;
  mstTotalCount: number;
  yearRangeOptions: YearRangeOption[];
  patchMstRow: (rowId: number, patch: Partial<TaxMasterMappingRow>) => void;
  onMstPageChange: (page: number) => void;
  onMstPageSizeChange: (size: number) => void;
}

/** The Master/Data mapping grid — reused identically by the standalone Data tab and Hybrid's nested Data section. */
export function MasterTableSection({
  mstRows, mstBusy, mstPage, mstPageSize, mstTotalPages, mstTotalCount,
  yearRangeOptions, patchMstRow, onMstPageChange, onMstPageSizeChange,
}: MasterTableSectionProps) {
  const t = useTranslations('dynamicTaxRegister');
  const assessmentYearLabel = `${useAliasLabel('Assessment', t('aliasFallback.assessment'))} ${t('aliasFallback.yearSuffix')}`;
  return (
    <MasterTable<TaxMasterMappingRow>
      columns={getMasterColumns({
        mstPage,
        mstPageSize,
        yearRangeOptions,
        patchMstRow,
        labels: {
          sr: t('master.columns.sr'),
          displayValue: t('master.columns.displayValue'),
          assessmentYear: assessmentYearLabel,
          resultMode: t('master.columns.resultMode'),
          resultBase: t('master.columns.resultBase'),
          resultValue: t('master.columns.resultValue'),
          unsavedRowAria: t('master.unsavedRowAria'),
        },
      })}
      data={mstRows}
      loading={mstBusy}
      pageNumber={mstPage}
      totalPages={mstTotalPages}
      totalCount={mstTotalCount}
      pageSize={mstPageSize}
      height="lg"
      pageSizeOptions={MST_PAGE_SIZE_OPTIONS}
      onPageChange={onMstPageChange}
      onPageSizeChange={onMstPageSizeChange}
      paginationConfig={{ enabled: true, showPageSizeSelector: true }}
      getRowKey={(row) => String((row as TaxMasterMappingRow).id)}
      tableClassName="text-xs"
      theadClassName="text-[10px] font-extrabold uppercase tracking-widest"
    />
  );
}
