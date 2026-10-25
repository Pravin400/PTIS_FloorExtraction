import {
  AssetRegisterRow,
} from '@/types/asset/asset-register/municipal-asset-register.types';
import type { AssetRegisterSubUnitItem } from '@/lib/api/asset/asset-register/municipal-asset-register.service';
import { ExpandableMasterTable, type Column } from '@/components/common';
import { AssetRegisterTableHeader } from './AssetRegisterTableHeader';
import { AssetRegisterTableRow } from './AssetRegisterTableRow';
import { AssetRegisterSubunitRow } from './AssetRegisterSubunitRow';

interface TableContentProps {
  assets: AssetRegisterRow[];
  openSubunitRows: Record<number, boolean>;
  expandedAssets: Record<number, AssetRegisterSubUnitItem[]>;
  subunitMeta?: Record<number, { totalCount: number; totalPages: number; pageNumber: number; pageSize: number }>;
  subunitSearchMap: Record<number, string>;
  subunitPageSizeMap: Record<number, number>;
  subunitPageMap: Record<number, number>;
  noRecordsLabel: string;
  handleToggleExpand: (row: AssetRegisterRow) => void;
  handleViewImage: (row: AssetRegisterRow, mediaType?: 'photo' | 'document') => void;
  handleViewDetails: (row: AssetRegisterRow) => void;
  handleEdit: (row: AssetRegisterRow) => void;
  handlePrint: (row: AssetRegisterRow) => void;
  handleGisMap: (row: AssetRegisterRow) => void;
  handleSubunitSearchChange: (parentId: number, val: string) => void;
  handleSubunitPageSizeChange: (parentId: number, size: number) => void;
  handleSubunitPageChange: (parentId: number, page: number) => void;
}

export function AssetRegisterTableContent({
  assets,
  openSubunitRows,
  expandedAssets,
  subunitMeta,
  subunitSearchMap,
  subunitPageSizeMap,
  subunitPageMap,
  noRecordsLabel,
  handleToggleExpand,
  handleViewImage,
  handleViewDetails,
  handleEdit,
  handlePrint,
  handleGisMap,
  handleSubunitSearchChange,
  handleSubunitPageSizeChange,
  handleSubunitPageChange,
}: TableContentProps) {
  // Define columns matching the 13 columns of AssetRegisterTableHeader
  const dummyColumns: Column<AssetRegisterRow>[] = [
    { key: 'id', label: '' },
    { key: 'id', label: '' },
    { key: 'id', label: '' },
    { key: 'id', label: '' },
    { key: 'id', label: '' },
    { key: 'id', label: '' },
    { key: 'id', label: '' },
    { key: 'id', label: '' },
    { key: 'id', label: '' },
    { key: 'id', label: '' },
    { key: 'id', label: '' },
    { key: 'id', label: '' },
    { key: 'id', label: '' },
  ];

  return (
    <ExpandableMasterTable<AssetRegisterRow>
      columns={dummyColumns}
      data={assets}
      emptyText={noRecordsLabel}
      bareCard={true}
      maxBodyHeightClassName="overflow-x-auto overflow-y-auto relative flex-1 max-h-[calc(100vh-320px)]"
      tableClassName="w-full text-left border-collapse min-w-full text-xs"
      customThead={<AssetRegisterTableHeader />}
      tbodyClassName="divide-y divide-slate-100 text-xs bg-[#FFFFFF]"
      getRowKey={(row) => `parent-${row.id ?? row.assetCode}`}
      renderRow={(row) => {
          const parentId = row.id;
          const isExpanded = parentId != null && Boolean(openSubunitRows[parentId]);
          return (
            <AssetRegisterTableRow
              key={`parent-row-${row.id ?? row.assetCode}`}
              row={row}
              isExpanded={isExpanded}
              subUnitCount={row.totalSubUnits || 0}
              handleToggleExpand={handleToggleExpand}
              handleViewImage={handleViewImage}
              handleViewDetails={handleViewDetails}
              handleEdit={handleEdit}
              handlePrint={handlePrint}
              handleGisMap={handleGisMap}
            />
          );
        }}
        renderCustomExpandedRows={(row) => {
          const parentId = row.id;
          const isExpanded = parentId != null && Boolean(openSubunitRows[parentId]);
          if (!isExpanded) return null;

          const subunits = parentId != null ? expandedAssets[parentId] || [] : [];
          const meta = parentId != null ? subunitMeta?.[parentId] : undefined;
          const pId = row.id ?? -1;

          return (
            <AssetRegisterSubunitRow
              key={`subunits-${row.id ?? row.assetCode}`}
              row={row}
              subunits={subunits}
              searchVal={subunitSearchMap[pId] || ''}
              subPageSize={subunitPageSizeMap[pId] || 10}
              subPage={subunitPageMap[pId] || 1}
              totalSubUnits={meta?.totalCount}
              totalSubPages={meta?.totalPages}
              handleViewImage={handleViewImage}
              handleEdit={handleEdit}
              handlePrint={handlePrint}
              handleSubunitSearchChange={handleSubunitSearchChange}
              handleSubunitPageSizeChange={handleSubunitPageSizeChange}
              handleSubunitPageChange={handleSubunitPageChange}
            />
          );
        }}
      />
  );
}
