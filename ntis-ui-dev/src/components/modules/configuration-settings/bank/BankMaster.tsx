'use client';

import { useMemo, useCallback, useTransition } from 'react';
import { AlertCircle } from 'lucide-react';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

import { PageContainer } from '@/components/common/PageContainer';
import { EditButton, DeleteButton } from '@/components/common/ActionButtons';
import type { BankMasterData } from '@/types/bank-master.types';
import { useBankPagination } from '@/hooks/configuration-settings/bank/useBankPagination';
import { useBankSearch } from '@/hooks/configuration-settings/bank/useBankSearch';
import { useBankDelete } from '@/hooks/configuration-settings/bank/useBankDelete';
import { getBankColumns, type BankMasterTableRow } from './BankColumns';
import { BankMasterHeader } from './components/BankMasterHeader';
import { BankMasterStats } from './components/BankMasterStats';
import { BankMasterTable } from './components/BankMasterTable';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

interface BankMasterProps {
  data: BankMasterData[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  statsData: {
    activeCount: number;
    uniqueStates: string[];
  };
  /** Specific error message from server — shown inline instead of triggering the error boundary */
  errorMessage?: string;
  statusCode?: number;
}

export function BankMaster({
  data,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  statsData,
  errorMessage,
}: BankMasterProps) {
  const t = useTranslations('bankMaster');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const bankLabel = useAliasLabel('Bank', t('aliasFallback.bank'));
  const bankCodeLabel = useAliasLabel('Bank_Code', t('aliasFallback.bankCode'));
  const bankNameLabel = useAliasLabel('Bank_Name', t('aliasFallback.bankName'));
  const branchNameLabel = useAliasLabel('Branch_Name', t('aliasFallback.branchName'));
  const ifscCodeLabel = useAliasLabel('IFSC_Code', t('aliasFallback.ifscCode'));
  const stateLabel = useAliasLabel('State', t('aliasFallback.state'));

  const { search, currentSearchTerm, handleSearchChange } = useBankSearch({
    locale,
    startTransition,
  });

  const { changePage, handlePageSizeChange } = useBankPagination({
    pageNumber,
    pageSize,
    totalCount,
    locale,
    currentSearchTerm,
    filterState: 'all',
    startTransition,
  });

  const columns = useMemo(
    () =>
      getBankColumns(t, tCommon, {
        bankCode: bankCodeLabel,
        bankName: bankNameLabel,
        branchName: branchNameLabel,
        ifscCode: ifscCodeLabel,
      }),
    [t, tCommon, bankCodeLabel, bankNameLabel, branchNameLabel, ifscCodeLabel]
  );

  const handleAdd = useCallback(() => {
    startTransition(() => {
      router.push(`/${locale}/configuration-settings/bank-master/add`);
    });
  }, [locale, router, startTransition]);

  const { handleDelete, isDeleting } = useBankDelete({
    t,
    startTransition,
    bankLabel,
  });

  const handleEdit = useCallback(
    (row: BankMasterData) => {
      startTransition(() => {
        router.push(`/${locale}/configuration-settings/bank-master/edit/${row.id}`);
      });
    },
    [locale, router, startTransition]
  );

  const renderActions = useCallback(
    (row: BankMasterTableRow) => (
      <div className="flex items-center gap-1">
        <EditButton onClick={() => handleEdit(row)} />
        <DeleteButton onClick={() => handleDelete(row)} />
      </div>
    ),
    [handleEdit, handleDelete]
  );

  return (
    <PageContainer>
      <div className="space-y-4">
        {errorMessage && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold">{t('error.title')}</p>
              <p className="text-sm mt-0.5">
                {errorMessage === 'messages.unauthorizedToken' ||
                errorMessage === 'Unauthorized: Token expired or invalid' ||
                errorMessage?.toLowerCase().includes('unauthorized')
                  ? t('messages.unauthorizedToken')
                  : errorMessage}
              </p>
            </div>
          </div>
        )}
        <BankMasterHeader
          t={t}
          onAdd={handleAdd}
          search={search}
          onSearchChange={handleSearchChange}
          bankLabel={bankLabel}
        />

        <BankMasterStats
          totalCount={totalCount}
          activeCount={statsData.activeCount}
          statesCount={statsData.uniqueStates.length}
          t={t}
          bankLabel={bankLabel}
          stateLabel={stateLabel}
        />

        <BankMasterTable
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
