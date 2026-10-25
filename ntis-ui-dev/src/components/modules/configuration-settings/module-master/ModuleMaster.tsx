'use client';

import { useMemo, useCallback, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

import { PageContainer } from '@/components/common/PageContainer';
import { EditButton, DeleteButton } from '@/components/common/ActionButtons';
import type { ModuleMaster as ModuleMasterType } from '@/types/moduleMaster.types';
import { useModulePagination } from '@/hooks/configuration-settings/module-master/useModulePagination';
import { useModuleSearch } from '@/hooks/configuration-settings/module-master/useModuleSearch';
import { useModuleDelete } from '@/hooks/configuration-settings/module-master/useModuleDelete';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

import { getModuleColumns, type ModuleMasterTableRow } from './ModuleColumns';
import { ModuleMasterHeader } from './components/ModuleMasterHeader';
import { ModuleMasterStats } from './components/ModuleMasterStats';
import { ModuleMasterTable } from './components/ModuleMasterTable';

interface ModuleMasterProps {
  data: ModuleMasterType[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  statsData: {
    totalCount: number;
    activeCount: number;
    inactiveCount: number;
  };
  fetchError?: string;
  statusCode?: number;
}

export function ModuleMaster({
  data,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  statsData,
  fetchError,
}: ModuleMasterProps) {
  const t = useTranslations('moduleMaster');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const moduleLabel = useAliasLabel('Module', t('aliasFallback.module'));
  const departmentLabel = useAliasLabel('Department', t('aliasFallback.department'));
  const moduleCodeLabel = useAliasLabel('Module_Code', t('aliasFallback.moduleCode'));
  const moduleNameLabel = useAliasLabel('Module_Name', t('aliasFallback.moduleName'));
  const localNameLabel = useAliasLabel('Local_Name', t('aliasFallback.localName'));
  const descriptionLabel = useAliasLabel('Description', t('aliasFallback.description'));

  const { search, currentSearchTerm, handleSearchChange } = useModuleSearch({
    locale,
    startTransition,
  });

  const { changePage, handlePageSizeChange } = useModulePagination({
    pageNumber,
    pageSize,
    totalCount,
    locale,
    currentSearchTerm,
    startTransition,
  });

  const columns = useMemo(
    () =>
      getModuleColumns(t, tCommon, {
        moduleCode: moduleCodeLabel,
        moduleName: moduleNameLabel,
        department: departmentLabel,
        localName: localNameLabel,
        description: descriptionLabel,
      }),
    [
      t,
      tCommon,
      moduleCodeLabel,
      moduleNameLabel,
      departmentLabel,
      localNameLabel,
      descriptionLabel,
    ]
  );

  const handleAdd = useCallback(() => {
    startTransition(() => {
      router.push(`/${locale}/configuration-settings/module-master/add`);
    });
  }, [locale, router, startTransition]);

  const { handleDelete, isDeleting } = useModuleDelete({
    t,
    startTransition,
    moduleLabel,
  });

  const handleRowEdit = useCallback(
    (row: ModuleMasterTableRow) => {
      startTransition(() => {
        router.push(`/${locale}/configuration-settings/module-master/edit/${row.moduleId}`);
      });
    },
    [locale, router, startTransition]
  );

  const handleRowDelete = useCallback(
    (row: ModuleMasterTableRow) => {
      handleDelete(row);
    },
    [handleDelete]
  );

  const renderActions = useCallback(
    (row: ModuleMasterTableRow) => (
      <div className="flex items-center gap-1">
        <EditButton onClick={() => handleRowEdit(row)} />
        <DeleteButton onClick={() => handleRowDelete(row)} />
      </div>
    ),
    [handleRowEdit, handleRowDelete]
  );

  return (
    <PageContainer>
      <div className="space-y-4">
        <ModuleMasterHeader
          t={t}
          onAdd={handleAdd}
          search={search}
          onSearchChange={handleSearchChange}
          moduleLabel={moduleLabel}
          departmentLabel={departmentLabel}
        />

        {fetchError && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl shadow-sm flex items-start gap-3 animate-in fade-in duration-300">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-800">{t('messages.fetchFailed')}</h3>
              <p className="text-xs text-red-700 mt-1 font-mono">
                {typeof t.has === 'function' && t.has(fetchError) ? t(fetchError) : fetchError}
              </p>
            </div>
          </div>
        )}

        <ModuleMasterStats
          totalCount={statsData.totalCount}
          activeCount={statsData.activeCount}
          inactiveCount={statsData.inactiveCount}
          t={t}
          moduleLabel={moduleLabel}
        />

        <ModuleMasterTable
          columns={columns}
          data={data}
          loading={isPending || isDeleting}
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={changePage}
          onPageSizeChange={(size) => handlePageSizeChange(String(size))}
          renderActions={renderActions}
        />
      </div>
    </PageContainer>
  );
}
