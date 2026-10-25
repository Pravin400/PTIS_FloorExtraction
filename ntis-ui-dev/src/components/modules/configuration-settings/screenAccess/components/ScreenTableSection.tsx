'use client';
import React, { useMemo } from 'react';
import { type Column } from '@/components/common/MasterTable';
import {
  ScreenMasterData,
  ScreenGroupMasterData,
  PaginationData,
  ScreenMasterDataWithExtras,
} from '@/types/screen-access.types';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/common/ActionButton';
import { Edit2, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ManagementSection } from './ManagementSection';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

interface ScreenTableSectionProps {
  screens: ScreenMasterData[];
  pagination: PaginationData;
  groups: ScreenGroupMasterData[];
  searchTerm: string;
  onSearch: (term: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (screen: ScreenMasterData) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
  filterGroup: string;
  onFilterGroupChange: (value: string | number) => void;
  filterStatus: string;
  onFilterStatusChange: (value: string | number) => void;
  isPending?: boolean;
}

export const ScreenTableSection: React.FC<ScreenTableSectionProps> = (props) => {
  const {
    screens,
    pagination,
    groups,
    searchTerm,
    onSearch,
    onPageChange,
    onPageSizeChange,
    onEdit,
    onDelete,
    onAdd,
    filterGroup,
    onFilterGroupChange,
    filterStatus,
    onFilterStatusChange,
    isPending,
  } = props;

  const t = useTranslations('screenAccess');

  const screenLabel = useAliasLabel('Screen', t('aliasFallback.screen'));
  const screenGroupLabel = useAliasLabel('Screen_Group', t('aliasFallback.screenGroup'));
  const screenCodeLabel = useAliasLabel('Screen_Code', t('aliasFallback.screenCode'));
  const screenNameLabel = useAliasLabel('Screen_Name', t('aliasFallback.screenName'));
  const routeLabel = useAliasLabel('Route', t('aliasFallback.route'));

  const columns: Column<ScreenMasterDataWithExtras>[] = useMemo(
    () => [
      {
        key: 'screenName',
        label: screenNameLabel,
        width: '25%',
        render: (_, screen) => {
          const nameToDisplay =
            screen.screenName && !/\?{2,}/.test(screen.screenName)
              ? screen.screenName
              : screen.screenNameLocal;
          return <span className="font-medium text-gray-900">{nameToDisplay}</span>;
        },
      },
      {
        key: 'screenCode',
        label: screenCodeLabel,
        width: '10%',
        render: (value) => (
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold text-blue-700 bg-blue-50 font-mono border border-blue-300 rounded-md">
            {String(value)}
          </span>
        ),
      },
      {
        key: 'routePath',
        label: routeLabel,
        width: '40%',
        render: (value) => (
          <span
            className="font-mono text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-200 truncate block max-w-[450px]"
            title={String(value)}
          >
            {String(value)}
          </span>
        ),
      },
      {
        key: 'isActive',
        label: t('screenManagement.screens.table.status'),
        width: '10%',
        render: (value) => (
          <StatusBadge
            value={!!value}
            activeLabel={t('filters.active')}
            inactiveLabel={t('filters.inactive')}
          />
        ),
      },
    ],
    [t, screenNameLabel, screenCodeLabel, routeLabel]
  );

  return (
    <ManagementSection<ScreenMasterData>
      data={screens}
      columns={columns as unknown as Column<ScreenMasterData & Record<string, unknown>>[]}
      pagination={pagination}
      searchTerm={searchTerm}
      onSearch={onSearch}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onAdd={onAdd}
      isPending={isPending}
      searchPlaceholder={t('screenManagement.screens.searchPlaceholder', { screen: screenLabel })}
      addButtonLabel={t('screenManagement.screens.addScreen', { screen: screenLabel })}
      filters={[
        {
          id: 'filter-group',
          value: filterGroup,
          onChange: onFilterGroupChange,
          options: [
            { value: 'all', label: t('filters.allGroups', { screenGroup: screenGroupLabel }) },
            ...groups
              .filter((g) => g.isActive !== false)
              .map((g) => ({
                value: String(g.screenGroupId),
                label:
                  g.screenGroupName && !/\?{2,}/.test(g.screenGroupName)
                    ? g.screenGroupName
                    : g.screenGroupLocalName || g.screenGroupName,
              })),
          ],
          className: 'w-48',
        },
        {
          id: 'filter-status',
          value: filterStatus,
          onChange: onFilterStatusChange,
          options: [
            { value: 'all', label: t('filters.allStatus') },
            { value: 'active', label: t('filters.active') },
            { value: 'inactive', label: t('filters.inactive') },
          ],
          className: 'w-40',
        },
      ]}
      renderActions={(screen) => {
        const id = screen.screenMasterId;
        const hasValidId = id !== undefined && id !== null && id !== 0;

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => hasValidId && onEdit(screen)}
              disabled={!hasValidId}
              aria-label={t('screenManagement.screens.table.actions.edit', { screen: screenLabel })}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => hasValidId && onDelete(id)}
              disabled={!hasValidId}
              className="text-red-600 disabled:opacity-30"
              aria-label={t('screenManagement.screens.table.actions.delete', {
                screen: screenLabel,
              })}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      }}
    />
  );
};
