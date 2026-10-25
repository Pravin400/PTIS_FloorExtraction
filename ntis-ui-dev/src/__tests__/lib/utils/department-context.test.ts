import { describe, it, expect } from 'vitest';
import {
  resolveDepartmentContext,
  getDepartmentIconName,
  stripLocaleFromPath,
  isConfigurationSettingsPath,
  isConfigurationSettingsItem,
} from '@/lib/utils/department-context';
import type { MenuItem } from '@/types/menu.types';
import type { UserScreenAccess } from '@/types/user-screen-access.types';

describe('department-context utils', () => {
  describe('isConfigurationSettingsPath & isConfigurationSettingsItem', () => {
    it('correctly identifies configuration settings paths with or without locale', () => {
      expect(isConfigurationSettingsPath('/en/configuration-settings')).toBe(true);
      expect(isConfigurationSettingsPath('/mr/configuration-settings/screenAccess')).toBe(true);
      expect(isConfigurationSettingsPath('/configuration-settings/user-management')).toBe(true);
      expect(isConfigurationSettingsPath('/en/property-tax')).toBe(false);
      expect(isConfigurationSettingsPath('/water-bill')).toBe(false);
      expect(isConfigurationSettingsPath(null)).toBe(false);
      expect(isConfigurationSettingsPath('#')).toBe(false);
    });

    it('correctly detects items that belong to configuration settings', () => {
      expect(isConfigurationSettingsItem({ href: '/configuration-settings/users' })).toBe(true);
      expect(isConfigurationSettingsItem({ name: 'Configuration Settings' })).toBe(true);
      expect(isConfigurationSettingsItem({ departmentName: 'Configuration Settings' })).toBe(true);
      expect(isConfigurationSettingsItem({ name: 'Property Tax', href: '/property-tax' })).toBe(false);
    });
  });

  describe('stripLocaleFromPath', () => {
    it('removes supported locale prefix', () => {
      expect(stripLocaleFromPath('/en/property-tax')).toBe('/property-tax');
      expect(stripLocaleFromPath('/mr/water-bill')).toBe('/water-bill');
      expect(stripLocaleFromPath('/hi/assets/municipal-Asset')).toBe('/assets/municipal-Asset');
    });

    it('handles paths without locale', () => {
      expect(stripLocaleFromPath('/property-tax')).toBe('/property-tax');
      expect(stripLocaleFromPath('/')).toBe('/');
    });
  });

  describe('getDepartmentIconName', () => {
    it('maps known department names to correct Lucide icons', () => {
      expect(getDepartmentIconName('Water Tax')).toBe('Droplet');
      expect(getDepartmentIconName('Water Supply & Sewerage')).toBe('Droplet');
      expect(getDepartmentIconName('Property Tax')).toBe('FileText');
      expect(getDepartmentIconName('Asset Management')).toBe('Landmark');
      expect(getDepartmentIconName('Trade License')).toBe('ShoppingCart');
      expect(getDepartmentIconName('Building Permission')).toBe('Building2');
      expect(getDepartmentIconName('Configuration Settings')).toBe('Settings');
    });

    it('falls back to LayoutGrid for unknown department', () => {
      expect(getDepartmentIconName('Custom Department')).toBe('LayoutGrid');
    });
  });

  describe('resolveDepartmentContext', () => {
    const mockMenuItems: MenuItem[] = [
      {
        name: 'Property Tax',
        nameHi: 'मालमत्ता कर',
        href: '#',
        departmentId: 1,
        departmentName: 'Property Tax',
        subItems: [
          {
            name: 'New Assessment',
            href: '/property-tax/ptis/new-assessment',
            departmentId: 1,
            departmentName: 'Property Tax',
          },
          {
            name: 'Search Property',
            href: '/property-tax/search',
            departmentId: 1,
            departmentName: 'Property Tax',
          },
        ],
      },
      {
        name: 'Asset Management',
        nameHi: 'मालमत्ता व्यवस्थापन',
        href: '#',
        departmentId: 5,
        departmentName: 'Asset Management',
        subItems: [
          {
            name: 'Municipal Asset',
            href: '/assets/municipal-Asset',
            departmentId: 5,
            departmentName: 'Asset Management',
          },
        ],
      },
      {
        name: 'Water Bill',
        nameHi: 'पाणी बिल',
        href: '#',
        departmentId: 2,
        departmentName: 'Water Tax',
        subItems: [
          {
            name: 'Consumer Connection',
            href: '/water-bill/consumer-connection',
            departmentId: 2,
            departmentName: 'Water Tax',
          },
        ],
      },
    ];

    const mockScreens: UserScreenAccess[] = [
      {
        userId: 1,
        userRoleId: 1,
        screenCode: 'MUN_ASSET',
        screenName: 'Municipal Asset',
        screenNameLocal: 'म्युन्सिपल ॲसेट',
        screenIcon: 'Landmark',
        routePath: '/assets/municipal-Asset',
        departmentId: 5,
        departmentName: 'Asset Management',
        moduleId: 12,
        moduleName: 'Asset Registry',
        isMenu: true,
        canView: true,
        canEdit: true,
        canDelete: false,
        haveFullAccess: false,
        haveNoAccess: false,
      },
    ];

    it('Tier 1: resolves context from active route match against menuItems', () => {
      const result = resolveDepartmentContext({
        pathname: '/en/water-bill/consumer-connection',
        menuItems: mockMenuItems,
      });

      expect(result.departmentId).toBe(2);
      expect(result.departmentName).toBe('Water Tax');
      expect(result.departmentIcon).toBe('Droplet');
      expect(result.isConfigurationSettings).toBe(false);
    });

    it('Tier 1: resolves context from active route match against screens', () => {
      const result = resolveDepartmentContext({
        pathname: '/mr/assets/municipal-Asset',
        screens: mockScreens,
      });

      expect(result.departmentId).toBe(5);
      expect(result.departmentName).toBe('Asset Management');
      expect(result.departmentIcon).toBe('Landmark');
      expect(result.moduleId).toBe(12);
      expect(result.moduleName).toBe('Asset Registry');
    });

    it('Tier 2: resolves context from searchParams ?deptId= when route does not match', () => {
      const searchParams = new URLSearchParams('deptId=5&modId=12');
      const result = resolveDepartmentContext({
        pathname: '/en/custom-landing-page',
        searchParams,
        menuItems: mockMenuItems,
      });

      expect(result.departmentId).toBe(5);
      expect(result.departmentName).toBe('Asset Management');
      expect(result.moduleId).toBe(12);
    });

    it('Tier 3: resolves context from ambient cookieContext when route and searchParams are absent', () => {
      const result = resolveDepartmentContext({
        pathname: '/en/unknown-route',
        cookieContext: {
          departmentId: 2,
          departmentName: 'Water Tax',
          moduleId: 8,
          moduleName: 'Water Billing',
        },
      });

      expect(result.departmentId).toBe(2);
      expect(result.departmentName).toBe('Water Tax');
      expect(result.departmentIcon).toBe('Droplet');
    });

    it('Tier 4: resolves context from route slug fallback for /water-bill', () => {
      const result = resolveDepartmentContext({
        pathname: '/en/water-bill/new-route',
        menuItems: mockMenuItems,
      });

      expect(result.departmentId).toBe(2);
      expect(result.departmentName).toBe('Water Tax');
      expect(result.departmentIcon).toBe('Droplet');
    });

    it('Tier 4: resolves context from route slug fallback for /assets', () => {
      const result = resolveDepartmentContext({
        pathname: '/en/assets/reports',
        menuItems: mockMenuItems,
      });

      expect(result.departmentId).toBe(5);
      expect(result.departmentName).toBe('Asset Management');
      expect(result.departmentIcon).toBe('Landmark');
    });

    it('Tier 4: dynamically resolves any new arbitrary department without hardcoded rules', () => {
      const dynamicMenuItems: MenuItem[] = [
        ...mockMenuItems,
        {
          name: 'Solid Waste Management',
          nameHi: 'घनकचरा व्यवस्थापन',
          href: '#',
          departmentId: 14,
          departmentName: 'Solid Waste Management',
          subItems: [
            {
              name: 'Complaint Registry',
              href: '/solid-waste/complaints',
              departmentId: 14,
              departmentName: 'Solid Waste Management',
            },
          ],
        },
      ];

      const result = resolveDepartmentContext({
        pathname: '/en/solid-waste/analytics-dashboard',
        menuItems: dynamicMenuItems,
      });

      expect(result.departmentId).toBe(14);
      expect(result.departmentName).toBe('Solid Waste Management');
    });

    it('recognizes configuration settings route', () => {
      const result = resolveDepartmentContext({
        pathname: '/en/configuration-settings/screenAccess',
        menuItems: mockMenuItems,
      });

      expect(result.isConfigurationSettings).toBe(true);
      expect(result.departmentName).toBe('Configuration Settings');
      expect(result.departmentIcon).toBe('Settings');
    });

    it('resolves root department page (/water-bill) and overrides stale Property Tax ambient cookie', () => {
      const result = resolveDepartmentContext({
        pathname: '/en/water-bill',
        menuItems: mockMenuItems,
        cookieContext: {
          departmentId: 1,
          departmentName: 'Property Tax',
          moduleId: 1,
          moduleName: 'Property Tax',
        },
      });

      expect(result.departmentId).toBe(2);
      expect(result.departmentName).toBe('Water Tax');
      expect(result.departmentIcon).toBe('Droplet');
      expect(result.isConfigurationSettings).toBe(false);
    });

    it('resolves root department page (/property-tax) correctly', () => {
      const result = resolveDepartmentContext({
        pathname: '/mr/property-tax',
        menuItems: mockMenuItems,
      });

      expect(result.departmentId).toBe(1);
      expect(result.departmentName).toBe('Property Tax');
      expect(result.departmentIcon).toBe('FileText');
    });
  });
});
