'use client';

import { useTransition, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Pencil, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { Button, useConfirm, useToast } from '@/components/common';
import { useTranslations } from 'next-intl';
import {
  deleteConfigCategoryAction,
  updateAllConfigKeysStatusByCategoryIdAction,
} from '@/app/[locale]/configuration-settings/config-master/actions';
import { useActivePagePermissions } from '@/hooks/useActivePagePermissions';

interface CategoryContextProps {
  categoryId: string;
  categoryName: string;
}

export function CategoryEditDeleteActions({ categoryId, categoryName }: CategoryContextProps) {
  const t = useTranslations('configMaster');
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { confirm: confirmAction } = useConfirm();
  const { success, error: toastError } = useToast();
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<'edit' | 'delete' | null>(null);

  const { canEdit, canDelete, haveFullAccess } = useActivePagePermissions();

  const showEdit = canEdit || canDelete || haveFullAccess;
  const showDelete = canDelete || haveFullAccess;

  if (!showEdit && !showDelete) return null;

  const handleEditCategory = () => {
    setActiveAction('edit');
    startTransition(async () => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('editCategory', categoryId);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      setActiveAction(null);
    });
  };

  const handleDeleteCategory = () => {
    confirmAction({
      variant: 'delete',
      title: t('modals.deleteCategory.title'),
      description: t('modals.deleteCategory.desc', { name: categoryName }),
      cancelText: t('confirm.discard.cancel'),
      onConfirm: () => {
        setActiveAction('delete');
        startTransition(async () => {
          const res = await deleteConfigCategoryAction(parseInt(categoryId));
          if (res.success) {
            success(t('messages.categoryDeleted') || res.message || 'Category deleted');
            // Clear active category so it defaults to next available
            const params = new URLSearchParams(searchParams.toString());
            if (params.get('categoryId') === categoryId) {
              params.delete('categoryId');
            }
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
          } else {
            toastError(res.error || res.message || t('messages.deleteFailed') || 'Delete failed');
          }
          setActiveAction(null);
        });
      },
    });
  };

  return (
    <div className="flex items-center gap-0.5 sm:gap-1 pl-1.5 sm:pl-2 ml-1.5 sm:ml-2 border-l border-slate-200">
      {showEdit && (
        <Button
          variant="ghost"
          size="xs"
          icon={isPending && activeAction === 'edit' ? undefined : Pencil}
          disabled={isPending}
          isLoading={isPending && activeAction === 'edit'}
          className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
          onClick={handleEditCategory}
          title="Edit Category"
        />
      )}
      {showDelete && (
        <Button
          variant="ghost"
          size="xs"
          icon={isPending && activeAction === 'delete' ? undefined : Trash2}
          disabled={isPending}
          isLoading={isPending && activeAction === 'delete'}
          className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
          onClick={handleDeleteCategory}
          title="Delete Category"
        />
      )}
    </div>
  );
}

export function CategoryBulkActions({ categoryId, categoryName }: CategoryContextProps) {
  const t = useTranslations('configMaster');
  const router = useRouter();
  const { confirm: confirmAction } = useConfirm();
  const { success, error: toastError, info: toastInfo } = useToast();
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<'enable' | 'disable' | null>(null);

  const { haveFullAccess } = useActivePagePermissions();

  if (!haveFullAccess) return null;

  const handleBulkToggle = (enable: boolean): void => {
    confirmAction({
      title: enable ? t('list.enableAllTitle') : t('list.disableAllTitle'),
      description: enable
        ? t('list.enableAllDesc', { category: categoryName })
        : t('list.disableAllDesc', { category: categoryName }),
      confirmText: enable ? t('list.confirmEnable') : t('list.confirmDisable'),
      cancelText: t('confirm.discard.cancel'),
      variant: enable ? 'add' : 'delete',
      onConfirm: () => {
        toastInfo(
          enable
            ? t('messages.enablingCategory') || 'Enabling...'
            : t('messages.disablingCategory') || 'Disabling...'
        );

        setActiveAction(enable ? 'enable' : 'disable');
        startTransition(async () => {
          const result = await updateAllConfigKeysStatusByCategoryIdAction(
            parseInt(categoryId),
            enable
          );

          if (result.success) {
            success(
              result.message ||
                (enable ? t('messages.configsEnabled') : t('messages.configsDisabled'))
            );
            router.refresh();
          } else {
            toastError(result.error || t('messages.saveFailed'));
          }
          setActiveAction(null);
        });
      },
    });
  };

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
      <Button
        variant="secondary"
        size="xs"
        icon={isPending && activeAction === 'enable' ? undefined : CheckCircle2}
        disabled={isPending}
        isLoading={isPending && activeAction === 'enable'}
        className="h-8 text-[10px] sm:text-xs gap-1.5 !text-[#1d4ed8] border-blue-500/30 hover:bg-blue-50 bg-white font-black uppercase tracking-widest px-3 rounded-lg border-2 shadow-sm shadow-blue-100/50 cursor-pointer"
        onClick={() => handleBulkToggle(true)}
      >
        {t('list.enableAll') || 'Enable'}
      </Button>
      <Button
        variant="secondary"
        size="xs"
        icon={isPending && activeAction === 'disable' ? undefined : XCircle}
        disabled={isPending}
        isLoading={isPending && activeAction === 'disable'}
        className="h-8 text-[10px] sm:text-xs gap-1.5 text-rose-600 border-rose-500/30 hover:bg-rose-50 bg-white font-black uppercase tracking-widest px-3 rounded-lg border-2 shadow-sm shadow-rose-100/50 cursor-pointer"
        onClick={() => handleBulkToggle(false)}
      >
        {t('list.disableAll') || 'Disable'}
      </Button>
    </div>
  );
}
