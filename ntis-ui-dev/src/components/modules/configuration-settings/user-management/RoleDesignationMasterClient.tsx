'use client';

import { useState } from 'react';
import { Shield, Briefcase } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Badge, Tabs, TabPanel, TabList, Tab, Button, SearchInput } from '@/components/common';
import { Role, Designation, RoleDesignationMasterProps } from '@/types/user-management';
import {
  deleteUserRoleAction,
  deleteDesignationAction,
} from '@/app/[locale]/configuration-settings/user-management/actions.mutations';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { getCleanErrorMessage } from '@/lib/utils/backend-error-detection';
import { useRoleTable } from '@/hooks/configuration-settings/user-management/useRoleTable';
import { useDesignationTable } from '@/hooks/configuration-settings/user-management/useDesignationTable';
import { RoleTable } from './components/RoleTable';
import { DesignationTable } from './components/DesignationTable';

import { useActivePagePermissions } from '@/hooks/useActivePagePermissions';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

export function RoleDesignationMasterClient({
  initialRoles = [],
  initialDesignations = [],
}: RoleDesignationMasterProps) {
  const t = useTranslations('userManagement');
  const roleLabel = useAliasLabel('Role', t('aliasFallback.role'));
  const designationLabel = useAliasLabel('Designation', t('aliasFallback.designation'));
  const userLabel = useAliasLabel('User', t('aliasFallback.user'));

  const { confirm } = useConfirm();
  const [deletingRoleId, setDeletingRoleId] = useState<string | number | null>(null);
  const [deletingDesignationId, setDeletingDesignationId] = useState<string | number | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const locale = useLocale();
  const basePath = `/${locale}/configuration-settings/user-management`;

  const { haveFullAccess } = useActivePagePermissions();
  const showAdd = haveFullAccess;

  // Handle sub-tab selection via search params
  const activeSubTab = searchParams.get('subtab') || 'roles';

  const handleSubTabChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('subtab', val);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const {
    roles,
    setRoles,
    searchTerm: roleSearch,
    setSearchTerm: setRoleSearch,
    pageNumber: rolePage,
    setPageNumber: setRolePage,
    pageSize: rolePageSize,
    setPageSize: setRolePageSize,
    filteredRoles,
  } = useRoleTable(initialRoles);

  const {
    designations,
    setDesignations,
    searchTerm: desSearch,
    setSearchTerm: setDesSearch,
    pageNumber: desPage,
    setPageNumber: setDesPage,
    pageSize: desPageSize,
    setPageSize: setDesPageSize,
    filteredDesignations,
  } = useDesignationTable(initialDesignations);

  const handleRoleEdit = (role: Role) => {
    router.push(`${basePath}/roles/edit/${role.id}`);
  };

  const handleDeleteRole = async (role: Role) => {
    confirm({
      variant: 'delete',
      onConfirm: async () => {
        setDeletingRoleId(role.id);
        try {
          const res = await deleteUserRoleAction(role.id);
          if (res.success) {
            setRoles(
              roles.map((r) =>
                r.id === role.id ? { ...r, isActive: false, status: 'Inactive' } : r
              )
            );
            toast.success(t('messages.roleDeleteSuccess', { role: roleLabel }));
          } else {
            let errorMsg =
              res.message || t('messages.roleDeleteError', { role: roleLabel });
            if (res.message) {
              if (res.message.startsWith('messages.') || res.message.startsWith('errors.')) {
                errorMsg = t(res.message, { role: roleLabel });
              } else {
                errorMsg = getCleanErrorMessage(res.message);
              }
            }
            toast.error(errorMsg);
          }
        } catch (error) {
          toast.error(
            getCleanErrorMessage(error, t('messages.roleDeleteError', { role: roleLabel }))
          );
        } finally {
          setDeletingRoleId(null);
        }
      },
    });
  };

  const handleDesignationEdit = (des: Designation) => {
    router.push(`${basePath}/designations/edit/${des.id}`);
  };

  const handleDeleteDesignation = async (des: Designation) => {
    confirm({
      variant: 'delete',
      onConfirm: async () => {
        setDeletingDesignationId(des.id);
        try {
          const res = await deleteDesignationAction(des.id);
          if (res.success) {
            setDesignations(
              designations.map((d) =>
                d.id === des.id ? { ...d, isActive: false, status: 'Inactive' } : d
              )
            );
            toast.success(
              t('messages.designationDeleteSuccess', { designation: designationLabel })
            );
          } else {
            let errorMsg =
              res.message ||
              t('messages.designationDeleteError', { designation: designationLabel });
            if (res.message) {
              if (res.message.startsWith('messages.') || res.message.startsWith('errors.')) {
                errorMsg = t(res.message, { designation: designationLabel });
              } else {
                errorMsg = getCleanErrorMessage(res.message);
              }
            }
            toast.error(errorMsg);
          }
        } catch (error) {
          toast.error(
            getCleanErrorMessage(
              error,
              t('messages.designationDeleteError', { designation: designationLabel })
            )
          );
        } finally {
          setDeletingDesignationId(null);
        }
      },
    });
  };

  const isRoles = activeSubTab === 'roles';

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-5 border-b bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg shadow-sm">
            {isRoles ? (
              <Shield className="w-5 h-5 text-blue-600" />
            ) : (
              <Briefcase className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-black">
              {isRoles
                ? t('roles.title', { role: roleLabel })
                : t('roles.designationsTab', { designation: designationLabel })}
            </h1>
            <p className="text-slate-700 mt-0.5 text-sm">
              {isRoles
                ? t('roles.subtitle', { role: roleLabel, user: userLabel })
                : t('roles.subtitleDesignation', { designation: designationLabel })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 h-10">
            {isRoles ? (
              <>
                <Shield className="w-3 h-3 mr-1" />
                {roles.length} {t('roles.rolesTab', { role: roleLabel })}
              </>
            ) : (
              <>
                <Briefcase className="w-3 h-3 mr-1" />
                {designations.length} {t('roles.designationsTab', { designation: designationLabel })}
              </>
            )}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <Tabs value={activeSubTab} onChange={(v) => handleSubTabChange(v as string)}>
          <div className="flex items-center justify-between mb-4">
            <TabList className="bg-slate-100 p-1 rounded-lg">
              <Tab
                value="roles"
                className="flex items-center gap-2 px-4 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Shield className="w-4 h-4" />
                {t('roles.rolesTab', { role: roleLabel })}
              </Tab>
              <Tab
                value="designations"
                className="flex items-center gap-2 px-4 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Briefcase className="w-4 h-4" />
                {t('roles.designationsTab', { designation: designationLabel })}
              </Tab>
            </TabList>

            <div className="flex items-center gap-4">
              <SearchInput
                placeholder={
                  isRoles
                    ? t('filters.searchRole', { role: roleLabel })
                    : t('filters.searchDesignation', { designation: designationLabel })
                }
                value={isRoles ? roleSearch : desSearch}
                onChange={(val) => (isRoles ? setRoleSearch(val) : setDesSearch(val))}
                className="mb-0 w-64 [&_input]:text-black [&_input]:opacity-100"
              />
              {showAdd && (
                <Button
                  onClick={() =>
                    router.push(`${basePath}/${isRoles ? 'roles' : 'designations'}/add`)
                  }
                  aria-label={
                    isRoles
                      ? t('roles.addRole', { role: roleLabel })
                      : t('roles.addDesignation', { designation: designationLabel })
                  }
                  className="flex items-center gap-2"
                  actionType="add"
                  icon={isRoles ? Shield : Briefcase}
                >
                  {isRoles
                    ? t('roles.addRole', { role: roleLabel })
                    : t('roles.addDesignation', { designation: designationLabel })}
                </Button>
              )}
            </div>
          </div>

          <TabPanel value="roles" className="mt-0 border-none p-0 shadow-none">
            <RoleTable
              roles={filteredRoles.slice((rolePage - 1) * rolePageSize, rolePage * rolePageSize)}
              pageNumber={rolePage}
              pageSize={rolePageSize}
              totalCount={filteredRoles.length}
              onPageChange={setRolePage}
              onPageSizeChange={setRolePageSize}
              onEdit={handleRoleEdit}
              onDelete={handleDeleteRole}
              deletingId={deletingRoleId}
            />
          </TabPanel>

          <TabPanel value="designations" className="mt-0 border-none p-0 shadow-none">
            <DesignationTable
              designations={filteredDesignations.slice(
                (desPage - 1) * desPageSize,
                desPage * desPageSize
              )}
              pageNumber={desPage}
              pageSize={desPageSize}
              totalCount={filteredDesignations.length}
              onPageChange={setDesPage}
              onPageSizeChange={setDesPageSize}
              onEdit={handleDesignationEdit}
              onDelete={handleDeleteDesignation}
              deletingId={deletingDesignationId}
            />
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
}
