'use client';

import { useMemo } from 'react';
import { Database, LucideIcon } from 'lucide-react';
import {
  ScreenMasterData,
  DepartmentMasterData,
  ModuleMasterData,
  ScreenGroupMasterData,
} from '@/types/screen-access.types';

export interface DisplayScreen {
  id: string;
  name: string;
  screenGroupId?: number;
  screenGroupName?: string;
  screenCode?: string;
  routePath?: string;
}

export interface DisplayDomain {
  id: string;
  name: string;
  screens: DisplayScreen[];
  isModuleActive: boolean;
}

export interface DisplayDepartment {
  id: string;
  name: string;
  icon: LucideIcon;
  domains: DisplayDomain[];
}

interface UsePermissionHierarchyProps {
  screens: ScreenMasterData[];
  departments: DepartmentMasterData[];
  modules: ModuleMasterData[];
  groups?: ScreenGroupMasterData[];
  t: (key: string) => string;
}

export function usePermissionHierarchy({
  screens,
  departments,
  modules,
  groups = [],
  t,
}: UsePermissionHierarchyProps) {
  const hierarchy: DisplayDepartment[] = useMemo(() => {
    const validScreens = screens.filter((s) => s.screenMasterId && Number(s.screenMasterId) > 0);
    const assignedScreenIds = new Set<string>();

    // Build a map of screenGroupId to screenGroupName
    const groupNameMap = new Map<number, string>();
    groups.forEach((g) => {
      if (g.screenGroupId) {
        groupNameMap.set(g.screenGroupId, g.screenGroupName || g.screenGroupLocalName || '');
      }
    });

    // Build module lookup map
    const moduleLookup = new Map<number, ModuleMasterData>();
    modules.forEach((mod) => {
      if (mod.moduleMasterId && mod.moduleMasterId > 0) {
        moduleLookup.set(mod.moduleMasterId, mod);
      }
      if (mod.moduleId && mod.moduleId > 0) {
        moduleLookup.set(mod.moduleId, mod);
      }
    });

    const activeDepartments = departments.filter(
      (d) => (d as { isActive?: boolean }).isActive !== false
    );

    const deptHierarchy: DisplayDepartment[] = activeDepartments
      .map((dept): DisplayDepartment | null => {
        const canonicalDeptId =
          dept.departmentMasterId && dept.departmentMasterId > 0
            ? dept.departmentMasterId
            : dept.departmentId;
        if (!canonicalDeptId) return null;

        const deptNameNorm = (dept.departmentName || '').trim().toLowerCase();
        const deptCodeNorm = (dept.departmentCode || '').trim().toLowerCase();

        // Identify all screens belonging to this department
        const deptScreens = validScreens.filter((s) => {
          const sDeptId =
            s.departmentMasterId && s.departmentMasterId > 0
              ? s.departmentMasterId
              : (s as { departmentId?: number }).departmentId;

          // 1. Direct department match on screen
          if (sDeptId && sDeptId === canonicalDeptId) return true;

          // 2. Department match via screen's module
          const parentMod = s.moduleId ? moduleLookup.get(s.moduleId) : null;
          const modDeptId =
            parentMod?.departmentMasterId && parentMod.departmentMasterId > 0
              ? parentMod.departmentMasterId
              : parentMod?.departmentId;

          if (modDeptId && modDeptId === canonicalDeptId) {
            // If screen has a different explicit department, don't claim it here
            return !sDeptId || sDeptId === canonicalDeptId;
          }

          // 3. Match via moduleName / route when no explicit department ID is set
          if (!sDeptId && (!parentMod || (!parentMod.departmentMasterId && !parentMod.departmentId))) {
            const sModName = (s.moduleName || parentMod?.moduleName || '').trim().toLowerCase();
            const sRoute = (s.routePath || '').toLowerCase();

            if (sModName && (sModName === deptNameNorm || deptNameNorm.includes(sModName) || sModName.includes(deptNameNorm))) {
              return true;
            }
            if (deptNameNorm && sRoute.startsWith(`/${deptNameNorm}`)) {
              return true;
            }
            if (deptCodeNorm && (sRoute.startsWith(`/${deptCodeNorm}`) || sRoute.includes(`/${deptCodeNorm}/`))) {
              return true;
            }
          }

          return false;
        });

        // Group screens by module / domain
        const domainMap = new Map<
          string,
          { id: string; name: string; isModuleActive: boolean; screens: DisplayScreen[] }
        >();

        // Pre-populate active modules belonging to this department
        modules
          .filter((m) => {
            const mDept =
              m.departmentMasterId && m.departmentMasterId > 0 ? m.departmentMasterId : m.departmentId;
            return mDept === canonicalDeptId && m.isActive !== false;
          })
          .forEach((m) => {
            const modId = String(m.moduleMasterId || m.moduleId);
            if (!domainMap.has(modId)) {
              domainMap.set(modId, {
                id: modId,
                name: m.moduleName,
                isModuleActive: m.isActive !== false,
                screens: [],
              });
            }
          });

        deptScreens.forEach((s) => {
          const sId = String(s.screenMasterId);
          assignedScreenIds.add(sId);

          const screenDisplay: DisplayScreen = {
            id: sId,
            name: s.screenName,
            screenGroupId: s.screenGroupId,
            screenGroupName:
              s.screenGroupName ||
              (s.screenGroupId ? groupNameMap.get(s.screenGroupId) : undefined) ||
              undefined,
            screenCode: s.screenCode,
            routePath: s.routePath,
          };

          if (s.moduleId) {
            const parentMod = moduleLookup.get(s.moduleId);
            const modKey = String(parentMod?.moduleMasterId || parentMod?.moduleId || s.moduleId);
            const modName = parentMod?.moduleName || s.moduleName || `Module ${s.moduleId}`;
            const isModActive = parentMod ? parentMod.isActive !== false : true;

            if (domainMap.has(modKey)) {
              domainMap.get(modKey)!.screens.push(screenDisplay);
            } else {
              domainMap.set(modKey, {
                id: modKey,
                name: modName,
                isModuleActive: isModActive,
                screens: [screenDisplay],
              });
            }
          } else if (s.moduleName && s.moduleName.trim()) {
            const modKey = `mod-name-${s.moduleName.trim().toLowerCase()}`;
            if (domainMap.has(modKey)) {
              domainMap.get(modKey)!.screens.push(screenDisplay);
            } else {
              domainMap.set(modKey, {
                id: modKey,
                name: s.moduleName,
                isModuleActive: true,
                screens: [screenDisplay],
              });
            }
          } else {
            const genKey = `dept-${canonicalDeptId}-general`;
            if (!domainMap.has(genKey)) {
              domainMap.set(genKey, {
                id: genKey,
                name: t('accessControl.domains.general'),
                isModuleActive: true,
                screens: [],
              });
            }
            domainMap.get(genKey)!.screens.push(screenDisplay);
          }
        });

        const domains: DisplayDomain[] = Array.from(domainMap.values()).filter(
          (d) => d.screens.length > 0
        );

        return {
          id: String(canonicalDeptId),
          name: dept.departmentName,
          icon: Database,
          domains,
        };
      })
      .filter((d): d is DisplayDepartment => d !== null && d.domains.length > 0);

    // Identify Orphans (screens not assigned to any active department)
    const orphanedScreens = validScreens.filter(
      (s) => !assignedScreenIds.has(String(s.screenMasterId))
    );

    if (orphanedScreens.length > 0) {
      const orphanDomainMap = new Map<string, DisplayScreen[]>();

      orphanedScreens.forEach((s) => {
        const parentMod = s.moduleId ? moduleLookup.get(s.moduleId) : null;
        const groupKey = parentMod?.moduleName || s.moduleName || t('accessControl.domains.general');
        if (!orphanDomainMap.has(groupKey)) {
          orphanDomainMap.set(groupKey, []);
        }
        orphanDomainMap.get(groupKey)!.push({
          id: String(s.screenMasterId),
          name: s.screenName,
          screenGroupId: s.screenGroupId,
          screenGroupName:
            s.screenGroupName ||
            (s.screenGroupId ? groupNameMap.get(s.screenGroupId) : undefined) ||
            undefined,
          screenCode: s.screenCode,
          routePath: s.routePath,
        });
      });

      const orphanedDomains: DisplayDomain[] = Array.from(orphanDomainMap.entries()).map(
        ([name, domScreens], idx) => ({
          id: `orphan-${idx}`,
          name,
          isModuleActive: true,
          screens: domScreens,
        })
      );

      deptHierarchy.push({
        id: 'system-unassigned',
        name: t('accessControl.filters.systemDepartment'),
        icon: Database,
        domains: orphanedDomains,
      });
    }

    return deptHierarchy;
  }, [departments, modules, screens, groups, t]);

  return { hierarchy };
}
