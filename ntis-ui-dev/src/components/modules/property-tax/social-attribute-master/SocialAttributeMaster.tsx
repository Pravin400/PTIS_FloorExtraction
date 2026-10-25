'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Layers } from 'lucide-react';
import type { SocialAttributeProps } from '@/types/social-attribute.types';
import { PageContainer } from '@/components/common';
import TableHeader from '@/components/common/TableHeader';
import { useSocialAttributeList } from '@/hooks/social-attribute-master/useSocialAttributeList';
import { AttributeFilterBar } from './components/AttributeFilterBar';
import { MasterTable } from '@/components/common/MasterTable';
import { getSocialAttributeColumns, type TableRowItem } from './SocialAttributeColumns';
import { EditButton, DeleteButton } from '@/components/common/ActionButtons';

interface ExtendedSocialAttributeProps extends SocialAttributeProps {
  dataTypeFilter?: string;
  attributeTypeFilter?: string;
  currentSearchTerm?: string;
}

export function SocialAttributeMaster({
  data,
  dataTypeFilter: dataTypeFilterProp,
  attributeTypeFilter: attributeTypeFilterProp,
  currentSearchTerm,
}: ExtendedSocialAttributeProps): React.ReactElement {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('socialAttribute');
  const [, startTransition] = React.useTransition();

  const {
    searchQueryState,
    dataTypeFilter,
    attributeFilter,
    hasActiveFilters,
    handleSearchChange,
    handleDataTypeChange,
    handleAttributeFilterChange,
    handleResetFilters,
    handleEdit,
    handleDelete,
    parentItems,
  } = useSocialAttributeList({
    data,
    dataTypeFilterProp,
    attributeTypeFilterProp,
    currentSearchTerm,
  });

  const [pageNumber, setPageNumber] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Total count is based strictly on the number of parent records
  const totalCount = parentItems.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // If the current page becomes out of bounds (e.g., after deleting the last item on the last page), go to the last available page.
  React.useEffect(() => {
    if (pageNumber > totalPages) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPageNumber(totalPages);
    }
  }, [totalPages, pageNumber]);

  // Slice the parent items first
  const paginatedParentItems = React.useMemo(() => {
    const start = (pageNumber - 1) * pageSize;
    return parentItems.slice(start, start + pageSize);
  }, [parentItems, pageNumber, pageSize]);

  // Flatten only the paginated parent items (and their children) for display in MasterTable
  const paginatedData = React.useMemo(() => {
    const flattened: TableRowItem[] = [];
    paginatedParentItems.forEach(({ parent, children }) => {
      flattened.push({
        ...parent,
        isChild: false,
      });
      children.forEach((child) => {
        flattened.push({
          ...child,
          isChild: true,
          parentCode: parent.socialAttributeCode,
        });
      });
    });
    return flattened;
  }, [paginatedParentItems]);

  const columns = React.useMemo(() => getSocialAttributeColumns(t), [t]);

  const rowClassName = React.useCallback((row: TableRowItem) => {
    return row.isChild ? 'bg-slate-50/35 hover:bg-slate-100/50' : 'bg-white font-semibold';
  }, []);

  const renderActions = React.useCallback(
    (row: TableRowItem) => (
      <div className="flex items-center justify-center gap-2">
        <EditButton
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(row);
          }}
          aria-label={t('list.buttons.edit')}
        />
        <DeleteButton
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(row);
          }}
          aria-label={t('list.buttons.delete')}
        />
      </div>
    ),
    [handleEdit, handleDelete, t]
  );

  return (
    <PageContainer>
      <div className="space-y-6">
        <TableHeader
          title={t('list.title')}
          subtitle={t('list.subtitle')}
          icon={Layers}
          actionLabel={t('list.buttons.add')}
          onActionClick={() =>
            startTransition(() =>
              router.push(`/${locale}/property-tax/social-attribute-master/add`)
            )
          }
        />

        <AttributeFilterBar
          searchValue={searchQueryState}
          dataTypeValue={dataTypeFilter}
          attributeValue={attributeFilter}
          hasActiveFilters={hasActiveFilters}
          onSearchChange={(val) => {
            handleSearchChange(val);
            setPageNumber(1);
          }}
          onDataTypeChange={(val) => {
            handleDataTypeChange(val);
            setPageNumber(1);
          }}
          onAttributeChange={(val) => {
            handleAttributeFilterChange(val);
            setPageNumber(1);
          }}
          onReset={() => {
            handleResetFilters();
            setPageNumber(1);
          }}
        />

        {/* Master Table view representing hierarchy */}
        <div className="w-full min-h-70">
          <MasterTable<TableRowItem>
            columns={columns}
            data={paginatedData}
            pageNumber={pageNumber}
            pageSize={pageSize}
            totalCount={totalCount}
            totalPages={totalPages}
            onPageChange={setPageNumber}
            onPageSizeChange={setPageSize}
            getRowKey={(row) => row.id}
            renderActions={renderActions}
            rowClassName={rowClassName}
            emptyText={t('list.filters.noResults')}
            paginationConfig={{ enabled: true, showPageSizeSelector: true }}
          />
        </div>
      </div>
    </PageContainer>
  );
}
