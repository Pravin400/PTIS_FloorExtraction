import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { usePermissionHierarchy } from '@/hooks/configuration-settings/screenAccess/usePermissionHierarchy';
import {
  ScreenMasterData,
  DepartmentMasterData,
  ModuleMasterData,
} from '@/types/screen-access.types';

const mockT = (key: string) => key;

describe('usePermissionHierarchy', () => {
  it('should correctly build hierarchy from flat data', () => {
    const screens = [
      { screenMasterId: 1, screenName: 'Screen 1', moduleId: 10 } as ScreenMasterData,
      { screenMasterId: 2, screenName: 'Screen 2', departmentMasterId: 100 } as ScreenMasterData,
      { screenMasterId: 3, screenName: 'Orphan Screen' } as ScreenMasterData,
    ];

    const departments = [
      { departmentMasterId: 100, departmentName: 'Dept 1' } as DepartmentMasterData,
    ];

    const modules = [
      { moduleMasterId: 10, moduleName: 'Mod 1', departmentMasterId: 100 } as ModuleMasterData,
    ];

    const { result } = renderHook(() =>
      usePermissionHierarchy({ screens, departments, modules, t: mockT })
    );

    const hierarchy = result.current.hierarchy;

    // Should have 2 departments: Dept 1 and System Unassigned
    expect(hierarchy).toHaveLength(2);

    // Dept 1 assertions
    const dept1 = hierarchy.find((d) => d.id === '100');
    expect(dept1).toBeDefined();
    expect(dept1?.domains).toHaveLength(2); // Mod 1 and General

    const mod1Domain = dept1?.domains.find((d) => d.id === '10');
    expect(mod1Domain?.screens).toHaveLength(1);
    expect(mod1Domain?.screens[0].name).toBe('Screen 1');

    const generalDomain = dept1?.domains.find((d) => d.id === 'dept-100-general');
    expect(generalDomain?.screens).toHaveLength(1);
    expect(generalDomain?.screens[0].name).toBe('Screen 2');

    // Orphan assertions
    const orphanDept = hierarchy.find((d) => d.id === 'system-unassigned');
    expect(orphanDept).toBeDefined();
    expect(orphanDept?.domains[0].screens).toHaveLength(1);
    expect(orphanDept?.domains[0].screens[0].name).toBe('Orphan Screen');
  });

  it('should ignore screens without screenMasterId', () => {
    const screens = [{ screenName: 'Invalid Screen', moduleId: 10 } as ScreenMasterData];
    const departments = [] as DepartmentMasterData[];
    const modules = [] as ModuleMasterData[];

    const { result } = renderHook(() =>
      usePermissionHierarchy({ screens, departments, modules, t: mockT })
    );

    expect(result.current.hierarchy).toHaveLength(0);
  });
});
