'use client';

import React from 'react';
import { type Column } from '@/components/common/MasterTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  ScreenGroupMasterData,
  PaginationData,
  ScreenGroupMasterDataWithExtras,
} from '@/types/screen-access.types';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/common/ActionButton';
import { Edit2, Trash2 } from 'lucide-react';
import { ManagementSection } from './ManagementSection';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

interface GroupTableSectionProps {
  groups: ScreenGroupMasterData[];
  pagination: PaginationData;
  searchTerm: string;
  onSearch: (term: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (group: ScreenGroupMasterData) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
  filterStatus: string;
  onFilterStatusChange: (value: string | number) => void;
  isPending?: boolean;
}

export const GroupTableSection: React.FC<GroupTableSectionProps> = (props) => {
  const {
    groups,
    pagination,
    searchTerm,
    onSearch,
    onPageChange,
    onPageSizeChange,
    onEdit,
    onDelete,
    onAdd,
    filterStatus,
    onFilterStatusChange,
    isPending,
  } = props;

  const t = useTranslations('screenAccess');
  const commonT = useTranslations('common');

  const screenGroupLabel = useAliasLabel('Screen_Group', t('aliasFallback.screenGroup'));
  const groupCodeLabel = useAliasLabel('Group_Code', t('aliasFallback.groupCode'));
  const groupNameLabel = useAliasLabel('Group_Name', t('aliasFallback.groupName'));

  const columns = React.useMemo(
    (): Column<ScreenGroupMasterDataWithExtras>[] => [
      {
        key: 'screenGroupName',
        label: groupNameLabel,
        width: '40%',
        render: (_, group) => {
          const nameToDisplay =
            group.screenGroupName && !/\?{2,}/.test(group.screenGroupName)
              ? group.screenGroupName
              : group.screenGroupLocalName || group.screenGroupName;
          return <span className="font-medium text-gray-900">{nameToDisplay}</span>;
        },
      },
      {
        key: 'screenGroupCode',
        label: groupCodeLabel,
        width: '20%',
        render: (value) => (
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold text-violet-700 bg-violet-50 font-mono border border-violet-300 rounded-md">
            {String(value)}
          </span>
        ),
      },
      {
        key: 'isActive',
        label: t('screenManagement.groups.table.status'),
        width: '15%',
        render: (value) => (
          <StatusBadge
            value={!!value}
            activeLabel={commonT('status.active')}
            inactiveLabel={commonT('status.inactive')}
          />
        ),
      },
    ],
    [t, commonT, groupNameLabel, groupCodeLabel]
  );

  return (
    <ManagementSection<ScreenGroupMasterData>
      data={groups}
      columns={columns as unknown as Column<ScreenGroupMasterData & Record<string, unknown>>[]}
      pagination={pagination}
      searchTerm={searchTerm}
      onSearch={onSearch}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onAdd={onAdd}
      isPending={isPending}
      searchPlaceholder={t('screenManagement.groups.searchPlaceholder', {
        screenGroup: screenGroupLabel,
      })}
      addButtonLabel={t('screenManagement.groups.addGroup', { screenGroup: screenGroupLabel })}
      filters={[
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
      renderActions={(group) => {
        const id = group.screenGroupId;
        const hasValidId = id !== undefined && id !== null && id !== 0;

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => hasValidId && onEdit(group)}
              disabled={!hasValidId}
              aria-label={t('screenManagement.groups.table.actions.edit', {
                screenGroup: screenGroupLabel,
              })}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => hasValidId && onDelete(id)}
              disabled={!hasValidId}
              className="text-red-600 disabled:opacity-30"
              aria-label={t('screenManagement.groups.table.actions.delete', {
                screenGroup: screenGroupLabel,
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
