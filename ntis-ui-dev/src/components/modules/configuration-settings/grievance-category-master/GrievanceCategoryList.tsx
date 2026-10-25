'use client';

import { useTransition, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { MasterTable, useConfirm } from '@/components/common';
import { useQueryTransition } from '@/hooks/useQueryTransition';
import { deleteGrievanceCategoryAction } from '@/app/[locale]/configuration-settings/grievance-category-master/actions';
import { useGrievanceCategoryColumns } from './Column';
import type { GrievanceCategoryListProps } from '@/types/grievance-category-master/grievanceCategory.types';

export function GrievanceCategoryList({
  locale,
  categories,
  page,
  pageSize,
  departments,
  headerTitle,
  headerSubtitle,
  emptyText,
  totalCount,
  headerExtra,
}: GrievanceCategoryListProps) {
  const { updateQueries, isPending: isQueryPending, searchParams } = useQueryTransition();
  const [isActionPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { confirm } = useConfirm();
  const tCommon = useTranslations('common');
  const tGrievanceToast = useTranslations('grievanceCategory.master.toast');

  const activeDrawer = searchParams.get('drawer');
  const activeId = searchParams.get('id');

  const [prevActiveDrawer, setPrevActiveDrawer] = useState(activeDrawer);
  const [prevActiveId, setPrevActiveId] = useState(activeId);

  if (activeDrawer !== prevActiveDrawer || activeId !== prevActiveId) {
    setPrevActiveDrawer(activeDrawer);
    setPrevActiveId(activeId);
    setEditingId(null);
  }

  const isPending = isQueryPending || isActionPending;

  const handlePageChange = (newPage: number) => {
    updateQueries({ page: newPage });
  };

  const handlePageSizeChange = (newSize: number) => {
    updateQueries({ pageSize: newSize, page: 1 });
  };

  const handleEdit = useCallback(
    (id: number) => {
      setEditingId(id);
      updateQueries({
        page: page,
        pageSize: pageSize,
        drawer: 'edit',
        id: String(id),
      });
    },
    [page, pageSize, updateQueries]
  );

  const handleDelete = useCallback(
    (id: number) => {
      confirm({
        title: tCommon('confirm.delete.title'),
        description: tCommon('confirm.delete.description'),
        confirmText: tCommon('confirm.delete.confirm'),
        variant: 'delete',
        onConfirm: () => {
          if (deletingId !== null) return;
          setDeletingId(id);
          startTransition(async () => {
            try {
              const result = await deleteGrievanceCategoryAction(id, locale);
              if (result.success) {
                toast.success(tGrievanceToast('deleteSuccess'));
              } else {
                toast.error(result.error || tGrievanceToast('deleteError'));
              }
            } catch {
              toast.error(tGrievanceToast('deleteError'));
            } finally {
              setDeletingId(null);
            }
          });
        },
      });
    },
    [confirm, locale, tCommon, tGrievanceToast, startTransition, deletingId]
  );

  const columns = useGrievanceCategoryColumns({
    locale,
    departments,
    onEdit: handleEdit,
    onDelete: handleDelete,
    deletingId,
    editingId,
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-2">
      <MasterTable
        data={categories}
        columns={columns}
        headerTitle={headerTitle}
        headerSubtitle={headerSubtitle}
        headerExtra={headerExtra}
        loading={isPending}
        emptyText={emptyText}
        pageNumber={page}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        isPagination={true}
        isPageSize={true}
        pageSizeOptions={[5, 10, 20, 50]}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        data-testid="grievance-category-table"
      />
    </div>
  );
}
