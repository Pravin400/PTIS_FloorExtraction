'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { RolePermissionHeader } from './components/RolePermissionHeader';
import { getAccessLevelConfig } from './constants';

import {
  ScreenMasterData,
  DepartmentMasterData,
  ModuleMasterData,
  RoleMasterData,
  ScreenAccessPermissionData,
  ScreenGroupMasterData,
} from '@/types/screen-access.types';
import { getCleanErrorMessage } from '@/lib/utils/backend-error-detection';
import { updateScreenAccessAction } from '@/app/[locale]/configuration-settings/screenAccess/action.mutations';

import { toast } from 'sonner';
import { PermissionAccordion } from './components/PermissionAccordion';
import {
  usePermissionHierarchy,
  type DisplayDomain,
  type DisplayScreen,
} from '@/hooks/configuration-settings/screenAccess/usePermissionHierarchy';
import { usePermissionDeltas } from '@/hooks/configuration-settings/screenAccess/usePermissionDeltas';
import { useLoading } from '@/hooks/useLoading';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

interface RolePermissionManagerProps {
  screens: ScreenMasterData[];
  departments: DepartmentMasterData[];
  modules: ModuleMasterData[];
  roles: RoleMasterData[];
  initialRoleAccess: ScreenAccessPermissionData[];
  groups?: ScreenGroupMasterData[];
}

export function RolePermissionManager({
  screens,
  departments,
  modules,
  roles,
  initialRoleAccess,
  groups = [],
}: RolePermissionManagerProps) {
  const t = useTranslations('screenAccess');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const { isLoading: isSaving, startLoading, stopLoading } = useLoading();

  const screenLabel = useAliasLabel('Screen', t('aliasFallback.screen'));
  const departmentLabel = useAliasLabel('Department', t('aliasFallback.department'));
  const roleLabel = useAliasLabel('Role', t('aliasFallback.role'));

  const activeDepartments = useMemo(() => {
    return departments.filter((d) => (d as { isActive?: boolean }).isActive !== false);
  }, [departments]);

  const deptIdFromQuery = searchParams.get('deptId');
  const selectedDept = useMemo(() => {
    if (
      deptIdFromQuery &&
      activeDepartments.some(
        (d) => String(d.departmentMasterId ?? d.departmentId) === deptIdFromQuery
      )
    ) {
      return deptIdFromQuery;
    }
    return activeDepartments.length > 0
      ? String(activeDepartments[0].departmentMasterId ?? activeDepartments[0].departmentId)
      : '';
  }, [deptIdFromQuery, activeDepartments]);

  const filteredRoles = useMemo(() => {
    if (!selectedDept) return [];
    return roles.filter((r) => String(r.departmentId) === selectedDept && r.isActive !== false);
  }, [roles, selectedDept]);

  const roleIdFromQuery = searchParams.get('roleId');
  const selectedRole = useMemo(() => {
    if (roleIdFromQuery && filteredRoles.some((r) => String(r.roleMasterId) === roleIdFromQuery)) {
      return roleIdFromQuery;
    }
    return filteredRoles.length > 0 ? String(filteredRoles[0].roleMasterId) : '';
  }, [roleIdFromQuery, filteredRoles]);

  const accessLevelConfig = useMemo(() => getAccessLevelConfig(t), [t]);

  const [searchTerm, setSearchTerm] = useState('');

  const { hierarchy } = usePermissionHierarchy({ screens, departments, modules, groups, t });

  const filteredHierarchy = useMemo(() => {
    if (!selectedDept) return [];
    const deptList = hierarchy.filter((dept) => dept.id === selectedDept);
    if (!searchTerm.trim()) return deptList;

    const term = searchTerm.trim().toLowerCase();
    return deptList
      .map((dept) => {
        const filteredDomains = dept.domains
          .map((dom) => {
            const domainNameMatches = dom.name.toLowerCase().includes(term);
            const matchedScreens = dom.screens.filter(
              (s) =>
                domainNameMatches ||
                s.name.toLowerCase().includes(term) ||
                (s.screenCode && s.screenCode.toLowerCase().includes(term)) ||
                (s.routePath && s.routePath.toLowerCase().includes(term)) ||
                (s.screenGroupName && s.screenGroupName.toLowerCase().includes(term))
            );
            return { ...dom, screens: matchedScreens };
          })
          .filter((dom) => dom.screens.length > 0);

        return { ...dept, domains: filteredDomains };
      })
      .filter((dept) => dept.domains.length > 0);
  }, [hierarchy, selectedDept, searchTerm]);

  const { mapPermissions, deltas, roleAccess, pendingCount, updateAccess, resetDeltas } =
    usePermissionDeltas(initialRoleAccess);

  const handleSave = async () => {
    if (pendingCount === 0) return;

    startLoading();
    try {
      const changes: ScreenAccessPermissionData[] = [];

      Object.entries(deltas).forEach(([screenId, level]) => {
        changes.push({
          id: mapPermissions.ids[screenId],
          roleId: parseInt(selectedRole, 10),
          screenId: parseInt(screenId, 10),
          accessLevel: level,
        });
      });

      const res = await updateScreenAccessAction(changes);
      if (res.success) {
        toast.success(t('accessControl.messages.updateSuccess'));
        resetDeltas();
        startTransition(() => {
          router.refresh();
        });
      } else {
        let errorMsg = res.message || t('accessControl.messages.updateError');
        if (res.message) {
          if (
            res.message.startsWith('messages.') ||
            res.message.startsWith('errors.') ||
            res.message.includes('updateError')
          ) {
            errorMsg = t(res.message);
          } else {
            errorMsg = getCleanErrorMessage(res.message);
          }
        }
        toast.error(errorMsg);
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (_error) {
      toast.error(getCleanErrorMessage(_error, t('accessControl.messages.updateError')));
      startTransition(() => {
        router.refresh();
      });
    } finally {
      stopLoading();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <RolePermissionHeader
        selectedDept={selectedDept}
        departments={departments}
        selectedRole={selectedRole}
        roles={filteredRoles}
        pendingCount={pendingCount}
        isSaving={isSaving}
        onSave={handleSave}
        onCancel={resetDeltas}
        onDeptChange={(deptVal) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set('deptId', deptVal);

          // Find the first role in this new department
          const firstRoleInDept = roles.find((r) => String(r.departmentId) === deptVal);
          if (firstRoleInDept) {
            params.set('roleId', String(firstRoleInDept.roleMasterId));
          } else {
            params.delete('roleId');
          }

          startTransition(() => router.push(`?${params.toString()}`, { scroll: false }));
        }}
        onRoleChange={(val) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set('roleId', val);
          startTransition(() => router.push(`?${params.toString()}`, { scroll: false }));
        }}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        translations={{
          selectDept: t('accessControl.filters.selectDept', {
            department: departmentLabel,
            defaultValue: 'Select Department',
          }),
          selectRole: t('accessControl.filters.selectRole', { role: roleLabel }),
          searchPlaceholder: t('accessControl.filters.searchPlaceholder', {
            screen: screenLabel,
            defaultValue: 'Search screens...',
          }),
          pendingChanges: t('accessControl.status.pendingChanges', { count: pendingCount }),
          saveChanges: t('accessControl.buttons.saveChanges'),
          cancelChanges: t('accessControl.buttons.cancelChanges'),
        }}
      />

      <div className="flex-1 overflow-y-auto px-1">
        {filteredRoles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
            <p className="text-lg font-semibold">
              {t('accessControl.roles.noRolesFound', { role: roleLabel })}
            </p>
          </div>
        ) : filteredHierarchy.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
            <p className="text-lg font-semibold">
              {t('accessControl.messages.noScreensFound', { screen: screenLabel })}
            </p>
          </div>
        ) : (
          <PermissionAccordion
            hierarchy={filteredHierarchy}
            roleAccess={roleAccess}
            accessLevelConfig={accessLevelConfig}
            onUpdate={updateAccess}
            onBulkDomain={(screens, level) => screens.forEach((s) => updateAccess(s.id, level))}
            onBulkDept={(dept, level) =>
              dept.domains.forEach((d: DisplayDomain) =>
                d.screens.forEach((s: DisplayScreen) => updateAccess(s.id, level))
              )
            }
          />
        )}
      </div>
    </div>
  );
}
