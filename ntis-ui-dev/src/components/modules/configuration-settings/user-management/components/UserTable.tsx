'use client';

import {
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
} from 'lucide-react';
import { MasterTable, Badge, Button } from '@/components/common';
import { useTranslations } from 'next-intl';
import { User, UserTableProps } from '@/types/user-management';

import { useActivePagePermissions } from '@/hooks/useActivePagePermissions';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

export function UserTable({
  users,
  totalCount,
  totalPages,
  onEdit,
  onDelete,
  pageNumber,
  pageSize,
  onPageChange,
  onPageSizeChange,
  deletingId,
}: UserTableProps) {
  const t = useTranslations('userManagement');
  const userLabel = useAliasLabel('User', t('aliasFallback.user'));
  const roleLabel = useAliasLabel('Role', t('aliasFallback.role'));
  const departmentLabel = useAliasLabel('Department', t('aliasFallback.department'));
  const moduleLabel = useAliasLabel('Module', t('aliasFallback.module'));
  const userCodeLabel = useAliasLabel('User_Code', t('aliasFallback.userCode'));

  const { canEdit, canDelete, haveFullAccess } = useActivePagePermissions();
  const showEdit = canEdit || haveFullAccess;
  const showDelete = canDelete || haveFullAccess;
  const showActions = showEdit || showDelete;

  const columns = [
    {
      label: t('table.user', { user: userLabel }),
      key: 'userName' as const,
      render: (value: unknown, row: User) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-linear-to-br from-primary/10 to-primary/20 flex items-center justify-center border border-primary/20">
            <span className="text-sm font-bold text-primary">{(value as string).charAt(0)}</span>
          </div>
          <div>
            <div className="font-bold text-slate-800">{value as string}</div>
            <div className="text-xs text-slate-500">
              {[row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ')}
            </div>
          </div>
        </div>
      ),
    },
    {
      label: userCodeLabel || t('form.userCode', { userCode: userCodeLabel }),
      key: 'userCode' as const,
      render: (value: unknown) => (
        <div className="flex items-center">
          <span className="font-mono text-slate-700 font-semibold text-xs bg-gradient-to-r from-indigo-50 to-purple-50 px-2.5 py-1 rounded-md border border-indigo-100 shadow-xs">
            {(value as string) || '-'}
          </span>
        </div>
      ),
    },
    {
      label: t('table.contact'),
      key: 'mobileNo' as const,
      render: (value: unknown, row: User) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Phone className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-mono">{value as string}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Mail className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-xs">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      label: `${departmentLabel}s - ${roleLabel}`,
      key: 'roles' as const,
      render: (_: unknown, row: User) => {
        const isUserActive = row.isActive;
        const activeDeptIds = new Set(row.departmentIds || []);

        // 1. Match roles to their respective departments using raw allocations
        const allocations = (row.rawRoleAllocations || []).filter(
          (ra) => ra && (ra.isActive || !isUserActive) && activeDeptIds.has(String(ra.departmentId))
        );

        let pairs: string[] = [];
        if (allocations.length > 0) {
          pairs = allocations.map((ra) => {
            const dept = (row.rawDepartments || []).find(
              (d) => String(d.departmentId) === String(ra.departmentId)
            );
            const deptName = dept?.departmentName || `Dept ${ra.departmentId}`;
            const roleName = ra.userRoleName || '';
            return `${deptName} - ${roleName}`;
          });
        } else {
          // 2. Fallback to index-based alignment of departmentNames and roles
          const depts = row.departmentNames || [];
          const roles = row.roles || [];
          const maxLen = Math.max(depts.length, roles.length);
          for (let i = 0; i < maxLen; i++) {
            const deptName = depts[i] || '';
            const roleName = roles[i] || '';
            if (deptName && roleName) {
              pairs.push(`${deptName} - ${roleName}`);
            } else if (deptName) {
              pairs.push(deptName);
            } else if (roleName) {
              pairs.push(roleName);
            }
          }
        }

        return (
          <div className="flex flex-wrap gap-1 max-w-[450px]">
            {pairs.map((val, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="px-2 py-0.5 text-[10px] bg-slate-50 text-slate-700 border-slate-200"
              >
                {val}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      label: t('table.modules', { module: moduleLabel }),
      key: 'moduleNames' as const,
      render: (value: unknown) => {
        const items = value as string[];
        return (
          <div className="flex flex-wrap gap-1 max-w-[300px]">
            {items.map((val, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="px-1.5 py-0 text-[10px] bg-indigo-50 text-indigo-600 border-indigo-100"
              >
                {val}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      label: t('table.status'),
      key: 'status' as const,
      render: (value: unknown) => (
        <div className="flex items-center gap-1.5">
          {(value as string) === 'Active' ? (
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase">{t('filters.active')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-100">
              <XCircle className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase">{t('filters.inactive')}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      label: t('table.twoFactor'),
      key: 'twoFactorEnabled' as const,
      render: (_: unknown, row: User) =>
        row.twoFactorEnabled ? (
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100 w-fit">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase">{t('twoFactor.enabled')}</span>
          </div>
        ) : row.twoFactorRequired ? (
          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100 w-fit">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase">{t('twoFactor.pendingSetup')}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 w-fit">
            <ShieldOff className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase">{t('twoFactor.off')}</span>
          </div>
        ),
    },
    {
      label: t('actions.title'),
      key: 'id' as const,
      render: (_: unknown, row: User) => (
        <div className="flex items-center gap-2">
          {showEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(row)}
              className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600"
              title={t('actions.edit')}
              aria-label={t('actions.edit')}
              actionType="edit"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          {showDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(row.id)}
              className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 disabled:opacity-50"
              title={t('actions.delete')}
              aria-label={t('actions.delete')}
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
      ),
    },
  ];

  const activeColumns = showActions ? columns : columns.filter((col) => col.key !== 'id');

  return (
    <MasterTable
      data={users}
      columns={activeColumns}
      pageNumber={pageNumber}
      pageSize={pageSize}
      totalCount={totalCount}
      totalPages={totalPages}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      isPagination={true}
      isPageSize={true}
      containerClassName="border-none shadow-none bg-transparent"
    />
  );
}
