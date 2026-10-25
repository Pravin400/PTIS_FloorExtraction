import { Briefcase, Edit2, Trash2, Loader2 } from 'lucide-react';
import { MasterTable, Badge, Button } from '@/components/common';
import { useTranslations } from 'next-intl';
import { Designation, DesignationTableProps } from '@/types/user-management';
import { useActivePagePermissions } from '@/hooks/useActivePagePermissions';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

export function DesignationTable({
  designations,
  pageNumber,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  deletingId,
}: DesignationTableProps) {
  const t = useTranslations('userManagement');
  const designationLabel = useAliasLabel('Designation', t('aliasFallback.designation'));
  const designationCodeLabel = useAliasLabel(
    'Designation_Code',
    t('aliasFallback.designationCode')
  );
  const descriptionLabel = useAliasLabel('Description', t('aliasFallback.description'));

  const { canEdit, canDelete, haveFullAccess } = useActivePagePermissions();
  const showEdit = canEdit || haveFullAccess;
  const showDelete = canDelete || haveFullAccess;
  const showActions = showEdit || showDelete;

  const columns = [
    {
      key: 'code',
      label: designationCodeLabel || t('form.code'),
      width: '15%',
      render: (value: unknown) => (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">{value as string}</Badge>
      ),
    },
    {
      key: 'name',
      label: t('roles.designationsTab', { designation: designationLabel }),
      width: '25%',
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded shadow-sm">
            <Briefcase className="w-4 h-4 text-emerald-700" />
          </div>
          <span className="text-sm font-medium">{value as string}</span>
        </div>
      ),
    },
    {
      key: 'description',
      label: descriptionLabel || t('form.description'),
      width: '35%',
      render: (value: unknown) => (
        <span className="text-muted-foreground text-xs line-clamp-1">{value as string}</span>
      ),
    },
    {
      key: 'status',
      label: t('filters.status'),
      width: '15%',
      render: (_: unknown, row: Designation) => (
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
    <MasterTable<Designation>
      data={designations}
      emptyText={t('messages.noDesignations', { designation: designationLabel })}
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
      getRowKey={(designation) => designation.id}
    />
  );
}
