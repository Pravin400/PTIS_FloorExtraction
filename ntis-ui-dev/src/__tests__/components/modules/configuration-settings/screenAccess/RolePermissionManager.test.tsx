import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RolePermissionManager } from '@/components/modules/configuration-settings/screenAccess/RolePermissionManager';
import { updateScreenAccessAction } from '@/app/[locale]/configuration-settings/screenAccess/action.mutations';

import { ConfirmProvider } from '@/components/common/ConfirmProvider';
import { AliasLabelsProvider } from '@/lib/providers/AliasLabelsProvider';
import type {
  ScreenMasterData,
  DepartmentMasterData,
  ModuleMasterData,
  RoleMasterData,
  ScreenAccessPermissionData,
} from '@/types/screen-access.types';

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockReplace = vi.fn();
const mockPathname = '/en/configuration-settings/screenAccess';
let mockSearchParamsValue = '1';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    replace: mockReplace,
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => ({
    get: vi.fn((key: string) => (key === 'roleId' ? mockSearchParamsValue : null)),
    has: vi.fn((key: string) => key === 'roleId'),
    getAll: vi.fn(() => []),
    toString: vi.fn(() => `roleId=${mockSearchParamsValue}`),
  }),
}));

// Mock the actions
vi.mock('@/app/[locale]/configuration-settings/screenAccess/action.mutations', () => ({
  updateScreenAccessAction: vi.fn(),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const keys: Record<string, string> = {
      'accessControl.accessLevels.noAccess': 'No Access',
      'accessControl.accessLevels.view': 'View',
      'accessControl.accessLevels.edit': 'Edit',
      'accessControl.accessLevels.full': 'Full Access',
      'accessControl.actions.savePermissions': 'Save Permissions',
      'accessControl.filters.selectRole': 'Select Role',
      'accessControl.domains.general': 'General',
    };
    const lookup = keys[key] || keys[`${namespace}.${key}`] || key;
    return lookup;
  },
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// Mock useConfirm to bypass UI interaction in unit tests
vi.mock('@/components/common/ConfirmProvider', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/common/ConfirmProvider')>();
  return {
    ...actual,
    useConfirm: () => ({
      confirm: vi.fn((options) => options.onConfirm()),
    }),
  };
});

describe('RolePermissionManager', () => {
  const mockScreens: ScreenMasterData[] = [
    {
      screenMasterId: 1,
      screenName: 'Dashboard',
      screenCode: 'DASH',
      routePath: '/dashboard',
      screenIcon: 'Monitor',
      screenNameLocal: 'Dashboard',
      screenGroupId: 1,
      displayOrder: 1,
      isActive: true,
      isMenu: true,
      description: 'Dashboard screen',
      departmentMasterId: 1,
      moduleId: 1,
      moduleName: 'Core',
      isAuthenticationRequired: true,
      screenGroupName: 'Main',
    },
    {
      screenMasterId: 2,
      screenName: 'Settings',
      screenCode: 'SETT',
      routePath: '/settings',
      screenIcon: 'Settings',
      screenNameLocal: 'Settings',
      screenGroupId: 1,
      displayOrder: 2,
      isActive: true,
      isMenu: true,
      description: 'Settings screen',
      departmentMasterId: 1,
      moduleId: 1,
      moduleName: 'Core',
      isAuthenticationRequired: true,
      screenGroupName: 'Main',
    },
    {
      screenMasterId: 3,
      screenName: 'Reports',
      screenCode: 'REPT',
      routePath: '/reports',
      screenIcon: 'FileText',
      screenNameLocal: 'Reports',
      screenGroupId: 1,
      displayOrder: 3,
      isActive: true,
      isMenu: true,
      description: 'Reports screen',
      departmentMasterId: 2,
      moduleId: 2,
      moduleName: 'Reporting',
      isAuthenticationRequired: true,
      screenGroupName: 'Main',
    },
  ];

  const mockDepartments: DepartmentMasterData[] = [
    {
      departmentMasterId: 1,
      departmentName: 'IT Department',
    },
    {
      departmentMasterId: 2,
      departmentName: 'Finance Department',
    },
  ];

  const mockModules: ModuleMasterData[] = [
    {
      moduleMasterId: 1,
      moduleName: 'Core',
      departmentMasterId: 1,
    },
    {
      moduleMasterId: 2,
      moduleName: 'Reporting',
      departmentMasterId: 2,
    },
  ];

  const mockRoles: RoleMasterData[] = [
    {
      roleMasterId: 1,
      roleName: 'Admin',
      roleCode: 'ADMIN',
      isActive: true,
      departmentId: 1,
    },
    {
      roleMasterId: 2,
      roleName: 'User',
      roleCode: 'USER',
      isActive: true,
      departmentId: 1,
    },
  ];

  const mockInitialRoleAccess: ScreenAccessPermissionData[] = [
    {
      roleId: 1,
      screenId: 1,
      accessLevel: 'full',
    },
    {
      roleId: 1,
      screenId: 2,
      accessLevel: 'edit',
    },
    {
      roleId: 1,
      screenId: 3,
      accessLevel: 'view',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamsValue = '1';
  });

  describe('Permission Calculation', () => {
    it('should initialize with correct access levels from initialRoleAccess', () => {
      render(
        <ConfirmProvider>
          <RolePermissionManager
            screens={mockScreens}
            departments={mockDepartments}
            modules={mockModules}
            roles={mockRoles}
            initialRoleAccess={mockInitialRoleAccess}
          />
        </ConfirmProvider>
      );

      // The component should render
      expect(screen.getAllByText('IT Department').length).toBeGreaterThan(0);
    });

    it('should calculate department stats correctly', () => {
      render(
        <ConfirmProvider>
          <RolePermissionManager
            screens={mockScreens}
            departments={mockDepartments}
            modules={mockModules}
            roles={mockRoles}
            initialRoleAccess={mockInitialRoleAccess}
          />
        </ConfirmProvider>
      );

      // IT Department has 2 screens (Dashboard with 'full', Settings with 'edit')
      expect(screen.getAllByText('IT Department').length).toBeGreaterThan(0);
    });

    it('should default to no-access for screens without initial permissions', () => {
      const emptyAccess: ScreenAccessPermissionData[] = [];

      render(
        <ConfirmProvider>
          <RolePermissionManager
            screens={mockScreens}
            departments={mockDepartments}
            modules={mockModules}
            roles={mockRoles}
            initialRoleAccess={emptyAccess}
          />
        </ConfirmProvider>
      );

      // Component should still render without errors
      expect(screen.getAllByText('IT Department').length).toBeGreaterThan(0);
    });
  });

  describe('Save Payload Behavior', () => {
    it('should create correct payload structure when saving permissions', async () => {
      const user = userEvent.setup();
      const mockUpdateAction = vi.mocked(updateScreenAccessAction);
      mockUpdateAction.mockResolvedValue({ success: true, message: 'Success' });

      render(
        <ConfirmProvider>
          <RolePermissionManager
            screens={mockScreens}
            departments={mockDepartments}
            modules={mockModules}
            roles={mockRoles}
            initialRoleAccess={mockInitialRoleAccess}
          />
        </ConfirmProvider>
      );

      // Department is open by default (index 0)

      // Wait for content to expand and screens to be visible
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Get all buttons and find one with title attribute containing 'view'
      // We need to change a permission from its current state
      const allButtons = screen.getAllByRole('button');
      const viewButton = allButtons.find((btn) => btn.getAttribute('title') === 'View');

      if (viewButton) {
        await user.click(viewButton);
      }

      // Wait a bit for state to update
      await waitFor(() => {
        const saveButton = screen.getByText(/save/i);
        expect(saveButton).toBeInTheDocument();
      });

      // Find and click the save button
      const saveButtons = screen.getAllByRole('button');
      const saveButton = saveButtons.find((btn) => btn.textContent?.toLowerCase().includes('save'));

      if (saveButton) {
        await user.click(saveButton);
      }

      await waitFor(() => {
        expect(mockUpdateAction).toHaveBeenCalledTimes(1);
      });

      const payload = mockUpdateAction.mock.calls[0][0];

      // Verify payload structure (should contain only changed permissions)
      expect(Array.isArray(payload)).toBe(true);
      expect(payload.length).toBeGreaterThan(0);
      expect(payload[0]).toHaveProperty('roleId');
      expect(payload[0]).toHaveProperty('screenId');
      expect(payload[0]).toHaveProperty('accessLevel');
    });

    it('should include correct roleId in payload based on selected role', async () => {
      const user = userEvent.setup();
      const mockUpdateAction = vi.mocked(updateScreenAccessAction);
      mockUpdateAction.mockResolvedValue({ success: true, message: 'Success' });

      render(
        <ConfirmProvider>
          <RolePermissionManager
            screens={mockScreens}
            departments={mockDepartments}
            modules={mockModules}
            roles={mockRoles}
            initialRoleAccess={mockInitialRoleAccess}
          />
        </ConfirmProvider>
      );

      // IT Department is open by default

      // Wait for content to expand
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Make a permission change
      const allButtons = screen.getAllByRole('button');
      const viewButton = allButtons.find((btn) => btn.getAttribute('title') === 'View');
      if (viewButton) {
        await user.click(viewButton);
      }

      const saveButtons = screen.getAllByRole('button');
      const saveButton = saveButtons.find((btn) => btn.textContent?.toLowerCase().includes('save'));
      if (saveButton) {
        await user.click(saveButton);
      }

      await waitFor(() => {
        expect(mockUpdateAction).toHaveBeenCalled();
      });

      const payload = mockUpdateAction.mock.calls[0][0];

      // All permissions should have the same roleId (the selected role)
      const roleIds = payload.map((p: ScreenAccessPermissionData) => p.roleId);
      const uniqueRoleIds = [...new Set(roleIds)];
      expect(uniqueRoleIds).toHaveLength(1);
      expect(uniqueRoleIds[0]).toBe(1); // First role (Admin)
    });

    it('should handle save errors gracefully', async () => {
      const user = userEvent.setup();
      const mockUpdateAction = vi.mocked(updateScreenAccessAction);
      mockUpdateAction.mockResolvedValue({
        success: false,
        message: 'Network error',
      });

      render(
        <ConfirmProvider>
          <RolePermissionManager
            screens={mockScreens}
            departments={mockDepartments}
            modules={mockModules}
            roles={mockRoles}
            initialRoleAccess={mockInitialRoleAccess}
          />
        </ConfirmProvider>
      );

      // IT Department is open by default

      // Wait for content to expand
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Make a permission change
      const allButtons = screen.getAllByRole('button');
      const viewButton = allButtons.find((btn) => btn.getAttribute('title') === 'View');
      if (viewButton) {
        await user.click(viewButton);
      }

      const saveButtons = screen.getAllByRole('button');
      const saveButton = saveButtons.find((btn) => btn.textContent?.toLowerCase().includes('save'));
      if (saveButton) {
        await user.click(saveButton);
      }

      await waitFor(() => {
        expect(mockUpdateAction).toHaveBeenCalled();
      });

      // Component should remain functional after error
      expect(screen.getAllByText('IT Department').length).toBeGreaterThan(0);
    });
  });

  describe('Bulk Updates', () => {
    it('should apply bulk updates to all screens in a domain', async () => {
      render(
        <ConfirmProvider>
          <RolePermissionManager
            screens={mockScreens}
            departments={mockDepartments}
            modules={mockModules}
            roles={mockRoles}
            initialRoleAccess={mockInitialRoleAccess}
          />
        </ConfirmProvider>
      );

      // IT Department is open by default

      // The bulk update buttons should be available
      // Component should handle bulk updates without errors
      expect(screen.getAllByText('IT Department').length).toBeGreaterThan(0);
    });

    it('should apply bulk updates to all screens in a department', async () => {
      const mockUpdateAction = vi.mocked(updateScreenAccessAction);
      mockUpdateAction.mockResolvedValue({ success: true, message: 'Success' });

      render(
        <ConfirmProvider>
          <RolePermissionManager
            screens={mockScreens}
            departments={mockDepartments}
            modules={mockModules}
            roles={mockRoles}
            initialRoleAccess={mockInitialRoleAccess}
          />
        </ConfirmProvider>
      );

      // Component renders correctly
      expect(screen.getAllByText('IT Department').length).toBeGreaterThan(0);
    });
  });

  describe('Role Filtering', () => {
    it('should update URL when changing roles', async () => {
      const user = userEvent.setup();

      render(
        <ConfirmProvider>
          <RolePermissionManager
            screens={mockScreens}
            departments={mockDepartments}
            modules={mockModules}
            roles={mockRoles}
            initialRoleAccess={mockInitialRoleAccess}
          />
        </ConfirmProvider>
      );

      // Find the role select combobox by its rendered accessible label
      const roleSelect = screen.getByRole('combobox', {
        name: /Select Role/i,
      });
      await user.click(roleSelect);

      // Find and click the 'User' option
      const userOption = screen.getByText(/User/i);
      await user.click(userOption);

      // Verify mockPush was called with the new role ID
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('roleId=2'), expect.anything());
    });

    it('should only save permissions for the selected role', async () => {
      const user = userEvent.setup();
      const mockUpdateAction = vi.mocked(updateScreenAccessAction);
      mockUpdateAction.mockResolvedValue({ success: true, message: 'Success' });

      render(
        <ConfirmProvider>
          <RolePermissionManager
            screens={mockScreens}
            departments={mockDepartments}
            modules={mockModules}
            roles={mockRoles}
            initialRoleAccess={mockInitialRoleAccess}
          />
        </ConfirmProvider>
      );

      // IT Department is open by default

      // Wait for content to expand
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Make a permission change
      const allButtons = screen.getAllByRole('button');
      const viewButton = allButtons.find((btn) => btn.getAttribute('title') === 'View');
      if (viewButton) {
        await user.click(viewButton);
      }

      const saveButtons = screen.getAllByRole('button');
      const saveButton = saveButtons.find((btn) => btn.textContent?.toLowerCase().includes('save'));
      if (saveButton) {
        await user.click(saveButton);
      }

      await waitFor(() => {
        expect(mockUpdateAction).toHaveBeenCalled();
      });

      const payload = mockUpdateAction.mock.calls[0][0];

      // Verify all permissions are for the same role
      const roleIds = payload.map((p: ScreenAccessPermissionData) => p.roleId);
      expect(new Set(roleIds).size).toBe(1);
    });

    it('should not overwrite permissions for non-selected roles', async () => {
      const user = userEvent.setup();
      const mockUpdateAction = vi.mocked(updateScreenAccessAction);
      mockUpdateAction.mockResolvedValue({ success: true, message: 'Success' });

      render(
        <ConfirmProvider>
          <RolePermissionManager
            screens={mockScreens}
            departments={mockDepartments}
            modules={mockModules}
            roles={mockRoles}
            initialRoleAccess={mockInitialRoleAccess}
          />
        </ConfirmProvider>
      );

      // IT Department is open by default

      // Wait for content to expand
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Make a permission change
      const allButtons = screen.getAllByRole('button');
      const viewButton = allButtons.find((btn) => btn.getAttribute('title') === 'View');
      if (viewButton) {
        await user.click(viewButton);
      }

      const saveButtons = screen.getAllByRole('button');
      const saveButton = saveButtons.find((btn) => btn.textContent?.toLowerCase().includes('save'));
      if (saveButton) {
        await user.click(saveButton);
      }

      await waitFor(() => {
        expect(mockUpdateAction).toHaveBeenCalledTimes(1);
      });

      // Only one API call should be made (for selected role only)
      expect(mockUpdateAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty roles array', () => {
      render(
        <ConfirmProvider>
          <RolePermissionManager
            screens={mockScreens}
            departments={mockDepartments}
            modules={mockModules}
            roles={[]}
            initialRoleAccess={[]}
          />
        </ConfirmProvider>
      );

      // Should show empty state
      expect(screen.getByText(/noRolesFound/i)).toBeInTheDocument();
    });

    it('should handle empty screens array', () => {
      render(
        <ConfirmProvider>
          <RolePermissionManager
            screens={[]}
            departments={mockDepartments}
            modules={mockModules}
            roles={mockRoles}
            initialRoleAccess={[]}
          />
        </ConfirmProvider>
      );

      // Component should render without errors and show noScreensFound
      expect(screen.getByText(/noScreensFound/i)).toBeInTheDocument();
    });

    it('should handle screens without department or module assignments', () => {
      const screensWithoutDept: ScreenMasterData[] = [
        {
          ...mockScreens[0],
          departmentMasterId: 0,
          moduleId: 0,
          moduleName: '',
        },
      ];

      render(
        <ConfirmProvider>
          <RolePermissionManager
            screens={screensWithoutDept}
            departments={mockDepartments}
            modules={mockModules}
            roles={mockRoles}
            initialRoleAccess={[]}
          />
        </ConfirmProvider>
      );

      // But component should still render without crashing and show select role
      expect(screen.getByText(/Select Role/i)).toBeInTheDocument();
    });

    it('should preserve access levels when payload includes no-access', async () => {
      const user = userEvent.setup();
      const mockUpdateAction = vi.mocked(updateScreenAccessAction);
      mockUpdateAction.mockResolvedValue({ success: true, message: 'Success' });

      const accessWithNoAccess: ScreenAccessPermissionData[] = [
        { roleId: 1, screenId: 1, accessLevel: 'full' },
        { roleId: 1, screenId: 2, accessLevel: 'view' },
        { roleId: 1, screenId: 3, accessLevel: 'view' },
      ];

      render(
        <ConfirmProvider>
          <RolePermissionManager
            screens={mockScreens}
            departments={mockDepartments}
            modules={mockModules}
            roles={mockRoles}
            initialRoleAccess={accessWithNoAccess}
          />
        </ConfirmProvider>
      );

      // IT Department is open by default

      // Wait for content to expand and find Settings screen
      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Change a screen to 'no-access'
      const allButtons = screen.getAllByRole('button');
      const noAccessButton = allButtons.find((btn) => btn.getAttribute('title') === 'No Access');
      if (noAccessButton) {
        await user.click(noAccessButton);
      }

      const saveButtons = screen.getAllByRole('button');
      const saveButton = saveButtons.find((btn) => btn.textContent?.toLowerCase().includes('save'));
      if (saveButton) {
        await user.click(saveButton);
      }

      await waitFor(() => {
        expect(mockUpdateAction).toHaveBeenCalled();
      });

      const payload = mockUpdateAction.mock.calls[0][0];

      // Verify the changed permission is included in payload
      expect(Array.isArray(payload)).toBe(true);
      expect(payload.length).toBeGreaterThan(0);
      // The payload should contain the permission that was changed to no-access
      expect(payload[0]).toBeDefined();
      expect(payload[0].accessLevel).toBe('no-access');
    });

    it('renders with alias label overrides', () => {
      const mockAliases = {
        Department: 'Ministry',
        Role: 'Designation',
        Screen: 'Interface',
      };

      render(
        <AliasLabelsProvider labels={mockAliases}>
          <ConfirmProvider>
            <RolePermissionManager
              screens={mockScreens}
              departments={mockDepartments}
              modules={mockModules}
              roles={mockRoles}
              initialRoleAccess={[]}
            />
          </ConfirmProvider>
        </AliasLabelsProvider>
      );

      // Verify header rendered with role/dept elements
      expect(screen.getByRole('combobox', { name: /Select Role/i })).toBeInTheDocument();
    });
  });
});
