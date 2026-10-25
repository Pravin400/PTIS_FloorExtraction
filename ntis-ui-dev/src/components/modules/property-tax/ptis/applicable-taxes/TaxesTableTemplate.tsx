'use client';

import { MasterTable } from '@/components/common';
import type { Column } from '@/components/common';
import { TaxCalculationItem } from '@/types/applicable-taxes.types';

interface TaxesTableTemplateProps {
  columns: Column<TaxCalculationItem>[];
  data: TaxCalculationItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const TaxesTableTemplate = ({
  columns,
  data,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
}: TaxesTableTemplateProps) => {
  return (
    <MasterTable<TaxCalculationItem>
      columns={columns}
      data={data}
      pageNumber={pageNumber}
      pageSize={pageSize}
      totalCount={totalCount}
      totalPages={totalPages}
      onPageChange={onPageChange}
      paginationConfig={{ enabled: false, showPageSizeSelector: false }}
      maxBodyHeightClassName="max-h-[calc(100vh-350px)]"
      tableClassName="w-full table-fixed text-left border-collapse"
      theadClassName="bg-blue-50 border-b border-blue-100 [&_th]:!text-slate-500 [&_th]:!text-[10px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-wider [&_th]:!py-3 [&_th]:!px-4"
      containerClassName="w-full h-full overflow-x-hidden"
      rowClassName={() => "border-b border-slate-100 hover:bg-slate-50/50 transition-colors"}
    />
  );
};

export default TaxesTableTemplate;