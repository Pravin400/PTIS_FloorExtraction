import { Shield, Edit2, Trash2, Loader2, Building2 } from 'lucide-react';
import { MasterTable, Badge, Button } from '@/components/common';
import { useTranslations } from 'next-intl';
import { Role, RoleTableProps } from '@/types/user-management';
import { useActivePagePermissions } from '@/hooks/useActivePagePermissions';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

export function RoleTable({
  roles,
  pageNumber,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  deletingId,
}: RoleTableProps) {
  const t = useTranslations('userManagement');
  const departmentLabel = useAliasLabel('Department', t('aliasFallback.department'));
  const roleLabel = useAliasLabel('Role', t('aliasFallback.role'));

  const { canEdit, canDelete, haveFullAccess } = useActivePagePermissions();
  const showEdit = canEdit || haveFullAccess;
  const showDelete = canDelete || haveFullAccess;
  const showActions = showEdit || showDelete;

  const columns = [
    {
      key: 'departmentName',
      label: t('form.departments', { department: departmentLabel }) || `${departmentLabel}s`,
      width: '35%',
      render: (value: unknown, row: Role) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded shadow-sm">
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-sm font-medium text-slate-700">
            {(row.departmentName as string) || (value as string) || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'name',
      label: t('table.role', { role: roleLabel }),
      width: '35%',
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-primary/10 to-primary/20 rounded shadow-sm">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium">{value as string}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: t('filters.status'),
      width: '15%',
      render: (_: unknown, row: Role) => (
        <Badge
          className={
            row.isActive
              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
              : 'bg-red-100 text-red-700 border-red-200'
          }
        >
          {row.isActive ? t('filters.active') : t('filters.inactive')}
        </Badge>
      ),
    },
  ];

  return (
    <MasterTable<Role>
      data={roles}
      emptyText={t('messages.noRoles', { role: roleLabel })}
      columns={columns}
      pageSize={pageSize}
      pageNumber={pageNumber}
      totalCount={totalCount}
      totalPages={Math.ceil(totalCount / pageSize)}
      onPageChange={onPageChange}
      renderActions={
        showActions
          ? (row) => (
              <div className="flex items-center gap-2">
                {showEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(row)}
                    aria-label={t('actions.edit')}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600"
                    actionType="edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
                {showDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(row)}
                    aria-label={t('actions.delete')}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 disabled:opacity-50"
                    disabled={deletingId === row.id}
                    actionType="delete"
                  >
                    {deletingId === row.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            )
          : undefined
      }
      isPagination={true}
      isPageSize={true}
      onPageSizeChange={onPageSizeChange}
      actionLabel={showActions ? t('table.actions') : undefined}
      getRowKey={(role) => role.id}
    />
  );
}
