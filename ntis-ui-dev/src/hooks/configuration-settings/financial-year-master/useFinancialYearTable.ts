import { useState, useEffect, useTransition, useCallback, useMemo, ChangeEvent } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast, useConfirm } from '@/components/common';
import { FinancialYear, FinancialYearFormValues } from '@/types/financialYear.types';
import { deleteFinancialYearAction, setAsCurrentAction, closeYearAction } from '@/app/[locale]/configuration-settings/financial-year-master/actions';
import { getFinancialYearColumns } from '../../../components/modules/configuration-settings/financial-year-master/FinancialYearTableColumns';
import { translateBackendMessage } from '@/lib/utils/backend-error-detection';

export function useFinancialYearTable({
  initialData,
  drawer = null,
  initialEditingData = null,
}: {
  initialData: FinancialYear[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  drawer?: 'add' | 'edit' | null;
  initialEditingData?: FinancialYear | null;
}) {
  const t = useTranslations('financialYear'), tCommon = useTranslations('common'), toast = useToast(), router = useRouter();
  const { confirm } = useConfirm(), [isPending, startTransition] = useTransition(), pathname = usePathname();
  const [loadingState, setLoadingState] = useState<{ id: number; action: 'setCurrent' | 'close' | 'delete' | 'edit' } | null>(null);
  const [activeDrawer, setActiveDrawer] = useState<'add' | 'edit' | null>(drawer);
  const [editingData, setEditingData] = useState<FinancialYear | null>(initialEditingData);
  const [tableData, setTableData] = useState<FinancialYear[]>(initialData);
  const [isPageNavigating, setIsPageNavigating] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [prevProps, setPrevProps] = useState({ drawer, initialEditingData, initialData });

  if (
    drawer !== prevProps.drawer ||
    initialEditingData !== prevProps.initialEditingData ||
    initialData !== prevProps.initialData
  ) {
    setPrevProps({ drawer, initialEditingData, initialData });
    if (drawer !== prevProps.drawer) {
      if (!isClosed) setActiveDrawer(drawer);
      if (!drawer) setIsClosed(false);
    }
    if (initialEditingData !== prevProps.initialEditingData && initialEditingData) {
      setEditingData(initialEditingData);
    }
    if (initialData !== prevProps.initialData) {
      setTableData(initialData);
      setIsPageNavigating(false);
    }
  }

  const basePath = useMemo(() => {
    let path = pathname;
    if (path.endsWith('/add')) path = path.slice(0, -4);
    else if (path.includes('/edit/')) path = path.slice(0, path.indexOf('/edit/'));
    return path;
  }, [pathname]);

  const handleEdit = useCallback((id: number) => {
    setIsClosed(false);
    setActiveDrawer('edit');
    setEditingData(tableData.find(item => item.id === id) || null);
    window.history.pushState(null, '', `${basePath}/edit/${id}`);
  }, [basePath, tableData]);

  const handleAdd = useCallback(() => {
    setIsClosed(false);
    setActiveDrawer('add');
    setEditingData(null);
    window.history.pushState(null, '', `${basePath}/add`);
  }, [basePath]);

  const handleCloseDrawer = useCallback(() => {
    setIsClosed(true);
    setActiveDrawer(null);
    setEditingData(null);
    const search = window.location.search;
    const targetUrl = `${basePath}${search}`;
    window.history.pushState(null, '', targetUrl);
    if (pathname !== basePath) {
      router.push(targetUrl);
    }
  }, [basePath, pathname, router]);

  const handleFormSuccess = useCallback((savedData?: FinancialYearFormValues, id?: number) => {
    if (savedData && id) {
      setTableData((prev) => {
        const updated = prev.map((item) =>
          item.id === id
            ? {
                ...item,
                yearCode: savedData.yearCode.toUpperCase(),
                year: Number(savedData.year),
                startDate: savedData.startDate,
                endDate: savedData.endDate,
                description: savedData.description || null,
                isActive: savedData.isCurrent,
              }
            : savedData.isCurrent ? { ...item, isActive: false } : item
        );
        return updated.sort((a, b) => {
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          return b.year - a.year;
        });
      });
      handleCloseDrawer();
    } else {
      handleCloseDrawer();
    }
  }, [handleCloseDrawer]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.endsWith('/add')) {
        setActiveDrawer('add');
        setEditingData(null);
      } else if (path.includes('/edit/')) {
        const id = parseInt(path.split('/').pop() || '', 10);
        const item = !isNaN(id) ? initialData.find(item => item.id === id) || null : null;
        setActiveDrawer(item ? 'edit' : null);
        setEditingData(item);
      } else {
        setActiveDrawer(null);
        setEditingData(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [initialData]);

  const handleSearch = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setIsPageNavigating(true);
    const term = e.target.value;
    const cleanTerm = term.replace(/[^\p{L}\p{M}\p{N}\s\-]/gu, "");
    const params = new URLSearchParams(window.location.search);
    if (cleanTerm) params.set('search', cleanTerm);
    else params.delete('search');
    params.set('page', '1');
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, [pathname, router]);

  const handlePageChange = useCallback((page: number) => {
    setIsPageNavigating(true);
    const params = new URLSearchParams(window.location.search);
    params.set('page', page.toString());
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
  }, [pathname, router]);

  const handlePageSizeChange = useCallback((size: number) => {
    setIsPageNavigating(true);
    const params = new URLSearchParams(window.location.search);
    params.set('pageSize', size.toString());
    params.set('page', '1');
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
  }, [pathname, router]);

  const handleDelete = useCallback(async (id: number) => {
    confirm({
      variant: 'delete',
      title: t('table.messages.confirmDeleteTitle') || tCommon('confirm.delete.title'),
      description: t('table.messages.confirmDelete'),
      onConfirm: () => {
        setLoadingState({ id, action: 'delete' });
        startTransition(async () => {
          try {
            const result = await deleteFinancialYearAction(id);
            if (result.success) {
              setTableData((prev) => prev.filter((item) => item.id !== id));
              toast.success(t('table.messages.deleteSuccess'));
              router.refresh();
            } else {
              const errorMsg = result.error ? translateBackendMessage(result.error, tCommon) : tCommon('errors.deleteError');
              toast.error(errorMsg);
            }
          } finally {
            setLoadingState(null);
          }
        });
      }
    });
  }, [confirm, t, tCommon, toast, router]);

  const handleSetCurrent = useCallback(async (id: number) => {
    setLoadingState({ id, action: 'setCurrent' });
    startTransition(async () => {
      try {
        const result = await setAsCurrentAction(id);
        if (result.success) {
          setTableData((prev) => {
            const updated = prev.map((item) =>
              item.id === id
                ? { ...item, isActive: true, status: 'Active' }
                : { ...item, isActive: false }
            );
            return updated.sort((a, b) => {
              if (a.isActive && !b.isActive) return -1;
              if (!a.isActive && b.isActive) return 1;
              return b.year - a.year;
            });
          });
          toast.success(t('table.messages.setCurrentSuccess'));
          router.refresh();
        } else {
          const errorMsg = result.error ? translateBackendMessage(result.error, tCommon) : tCommon('errors.updateError');
          toast.error(errorMsg);
        }
      } finally {
        setLoadingState(null);
      }
    });
  }, [t, tCommon, toast, router]);

  const handleClose = useCallback(async (id: number) => {
    confirm({
      variant: 'warning',
      title: t('table.messages.confirmCloseTitle') || tCommon('confirm.warning.title'),
      description: t('table.messages.confirmClose') || t('table.messages.confirmDelete'),
      onConfirm: () => {
        setLoadingState({ id, action: 'close' });
        startTransition(async () => {
          try {
            const result = await closeYearAction(id);
            if (result.success) {
              setTableData((prev) =>
                prev.map((item) =>
                  item.id === id ? { ...item, status: 'Closed', isActive: false } : item
                )
              );
              toast.success(t('table.messages.closeSuccess'));
              router.refresh();
            } else {
              const errorMsg = result.error ? translateBackendMessage(result.error, tCommon) : tCommon('errors.updateError');
              toast.error(errorMsg);
            }
          } finally {
            setLoadingState(null);
          }
        });
      }
    });
  }, [confirm, t, tCommon, toast, router]);

  const columns = useMemo(() => getFinancialYearColumns({
    t,
    tCommon,
    handleEdit,
    handleSetCurrent,
    handleClose,
    handleDelete,
    loadingState,
  }), [t, tCommon, handleEdit, handleSetCurrent, handleClose, handleDelete, loadingState]);

  return {
    data: tableData,
    activeDrawer,
    editingData,
    loadingState,
    isPending,
    isPageNavigating,
    handleAdd,
    handleCloseDrawer,
    handleFormSuccess,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    columns,
    t,
    router,
    handleSetCurrent,
    handleClose,
    handleDelete,
    handleEdit,
  };
}
