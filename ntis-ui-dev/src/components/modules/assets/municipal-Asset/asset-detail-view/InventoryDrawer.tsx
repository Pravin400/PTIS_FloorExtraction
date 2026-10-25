'use client';
import type { InventoryDrawerProps } from '@/types/asset/municipal-Asset/asset-detail.types';
import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Drawer, MasterTable, Button } from '@/components/common';
import { DocumentViewerModal } from '@/components/common';
import { Package, Eye } from 'lucide-react';
import { getViewDocumentUrl } from '@/lib/utils/document-utils';
import { InventoryKpiSummary } from './InventoryKpiSummary';
import { InventoryFilterBar } from './InventoryFilterBar';

export function InventoryDrawer({ open, onClose, items, kpiData = [], initialCategoryFilter = '' }: InventoryDrawerProps) {
  const t = useTranslations('asset-detail');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [viewerState, setViewerState] = useState<{ open: boolean; url: string; name: string }>({ open: false, url: '', name: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(initialCategoryFilter);
  const [conditionFilter, setConditionFilter] = useState('');

  const categories = useMemo(() => Array.from(new Set(items.map(i => i.category))).filter(Boolean), [items]);
  const conditions = useMemo(() => Array.from(new Set(items.map(i => i.condition))).filter(Boolean), [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = searchTerm ?
        (item.assetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.makeModel?.toLowerCase().includes(searchTerm.toLowerCase())) : true;
      const matchCat = categoryFilter ? item.category === categoryFilter : true;
      const matchCond = conditionFilter ? item.condition === conditionFilter : true;
      return matchSearch && matchCat && matchCond;
    });
  }, [items, searchTerm, categoryFilter, conditionFilter]);



  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredItems.slice(startIndex, startIndex + pageSize);
  }, [filteredItems, currentPage]);

  const totalValue = useMemo(() => items.reduce((sum, item) => sum + (Number(item.cv) || 0), 0), [items]);
  const totalQuantity = useMemo(() => items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0), [items]);



  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="xl"
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0A1A44] flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-[17px] font-black text-[#0A1A44]">{t('inventoryTitle')}</h2>
        </div>
      }
    >
      <div className="p-6 h-full flex flex-col gap-4 bg-slate-50">

        {/* KPI Section */}
        <InventoryKpiSummary totalValue={totalValue} totalQuantity={totalQuantity} kpiData={kpiData} />

        {/* Filters Section */}
        <InventoryFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          conditionFilter={conditionFilter}
          setConditionFilter={setConditionFilter}
          categories={categories}
          conditions={conditions}
          setCurrentPage={setCurrentPage}
        />

        {/* Table Section */}
        <div className="rounded-xl border border-blue-200 overflow-hidden bg-white shadow-sm flex-1 flex flex-col mt-2 [&_.table-container]:!rounded-none [&_.table-container]:!border-0">
          <MasterTable
            data={paginatedItems}
            pageNumber={currentPage}
            pageSize={pageSize}
            totalCount={filteredItems.length}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            isPagination={true}
            containerClassName="!gap-0"
            tableClassName="!min-w-[1200px]"
            theadClassName="!bg-none !bg-[#002D62] [&_th]:!text-white [&_th]:!text-center [&_th]:!font-bold [&_th]:!px-2 [&_th]:!py-3 [&_th]:!text-xs [&_th]:!border-r [&_th]:!border-[#004080] [&_th]:last:!border-r-0 [&_th]:!uppercase [&_th]:!tracking-normal"
            rowClassName={() => "!bg-white !border-b !border-blue-100 hover:!bg-blue-50 !transition-colors [&_td]:!px-2 [&_td]:!py-2 [&_td]:!text-[11px] [&_td]:!leading-tight [&_td]:!text-center [&_td]:!border-r [&_td]:!border-blue-50 [&_td]:last:!border-r-0"}
            footerClassName="!py-1.5 !px-3"
            footerLeftClassName="[&_select]:!h-6 [&_select]:!text-[10px] [&_select]:!py-0 [&_span]:!text-[10px]"
            footerRightClassName="[&_button]:!h-6 [&_button]:!min-w-[24px] [&_button]:!w-auto [&_button]:!px-1.5 [&_button]:!text-[10px] [&_button_svg]:!w-3.5 [&_button_svg]:!h-3.5 [&_span]:!text-[10px]"

            columns={[
              { key: 'srNo', label: t('sNo') },
              { key: 'category', label: t('category') },
              { key: 'assetName', label: t('assetName') },
              { key: 'makeModel', label: t('makeModel') },
              { key: 'specifications', label: t('specifications'), align: 'center' },
              { key: 'purchaseDate', label: t('purchaseDate') },
              { key: 'owningDepartment', label: t('owningDepartment') },
              { key: 'condition', label: t('condition') },
              { key: 'quantity', label: t('quantity') },
              { key: 'unitValue', label: t('unitValue'), render: (val) => Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 }) },
              { key: 'total', label: t('total'), render: (val) => Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 }) },
              { key: 'cv', label: t('cv'), render: (val) => Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 }) },
              {
                key: 'photoDocumentGuid',
                label: t('viewPhoto'),
                align: 'center',
                render: (val, row) => {
                  const hasDocs = Array.isArray(row.documents) && row.documents.length > 0;
                  const docGuid = val || (hasDocs ? row.documents?.[0]?.documentGuid : null);
                  return docGuid ? (
                    <Button variant="ghost" onClick={() => setViewerState({ open: true, url: getViewDocumentUrl(docGuid as string), name: t('viewPhoto') })} className="inline-flex h-7 w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100 items-center justify-center" title={t('viewPhoto')}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  ) : <div className="text-center text-slate-300">-</div>;
                }
              },
              {
                key: 'invoiceDocumentGuid',
                label: t('viewInvoice'),
                align: 'center',
                render: (val, row) => {
                  const hasDocs = Array.isArray(row.documents) && row.documents.length > 0;
                  const docGuid = val || (hasDocs && (row.documents?.length ?? 0) > 1 ? row.documents?.[1]?.documentGuid : null);
                  return docGuid ? (
                    <Button variant="ghost" onClick={() => setViewerState({ open: true, url: getViewDocumentUrl(docGuid as string), name: t('viewInvoice') })} className="inline-flex h-7 w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100 items-center justify-center" title={t('viewInvoice')}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  ) : <div className="text-center text-slate-300">-</div>;
                }
              },
            ]}
          />
        </div>
      </div>
      {viewerState.open && (
        <DocumentViewerModal
          isOpen={viewerState.open}
          onClose={() => setViewerState({ ...viewerState, open: false })}
          fileUrl={viewerState.url}
          fileName={viewerState.name}
        />
      )}
    </Drawer>
  );
}
