import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScreenMasterManagement } from '@/components/modules/configuration-settings/screenAccess/ScreenMasterManagement';
import { NextIntlClientProvider } from 'next-intl';
import { ConfirmProvider } from '@/components/common/ConfirmProvider';
import { AliasLabelsProvider } from '@/lib/providers/AliasLabelsProvider';

// Mock router with dynamic search params
const mockSearchParams = new Map<string, string | null>();

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/configuration-settings/screenAccess',
  useSearchParams: () => {
    const params = new URLSearchParams();
    mockSearchParams.forEach((val, key) => {
      if (val !== null) params.append(key, val);
    });
    return params;
  },
}));

// Mock actions
const mockCreateScreenAction = vi
  .fn()
  .mockResolvedValue({ success: true, message: 'Screen created' });
const mockUpdateScreenAction = vi
  .fn()
  .mockResolvedValue({ success: true, message: 'Screen updated' });
const mockDeleteScreenAction = vi
  .fn()
  .mockResolvedValue({ success: true, message: 'Screen deleted' });
const mockCreateScreenGroupAction = vi
  .fn()
  .mockResolvedValue({ success: true, message: 'Group created' });
const mockUpdateScreenGroupAction = vi
  .fn()
  .mockResolvedValue({ success: true, message: 'Group updated' });
const mockDeleteScreenGroupAction = vi
  .fn()
  .mockResolvedValue({ success: true, message: 'Group deleted' });

vi.mock('@/app/[locale]/configuration-settings/screenAccess/action.mutations', () => ({
  createScreenAction: (...args: unknown[]) => mockCreateScreenAction(...args),
  updateScreenAction: (...args: unknown[]) => mockUpdateScreenAction(...args),
  deleteScreenAction: (...args: unknown[]) => mockDeleteScreenAction(...args),
  createScreenGroupAction: (...args: unknown[]) => mockCreateScreenGroupAction(...args),
  updateScreenGroupAction: (...args: unknown[]) => mockUpdateScreenGroupAction(...args),
  deleteScreenGroupAction: (...args: unknown[]) => mockDeleteScreenGroupAction(...args),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const keys: Record<string, string> = {
      'stats.totalScreens': 'Total Screens',
      'stats.activeScreens': 'Active Screens',
      'stats.totalGroups': 'Stat Groups',
      'filters.allGroups': 'All Groups',
      'filters.allStatus': 'All Status',
      'filters.active': 'Active',
      'filters.inactive': 'Inactive',
      'screenManagement.tabs.screens': 'Tab Screens',
      'screenManagement.tabs.screenGroups': 'Tab Groups',
      'screenManagement.screens.addScreen': 'Add Screen',
      'screenManagement.screens.searchPlaceholder': 'Search screens...',
      'screenManagement.screens.noScreensFound': 'No screens found',
      'screenManagement.screens.form.addTitle': 'Add New Screen',
      'screenManagement.screens.form.addSubtitle': 'Create a new screen',
      'screenManagement.screens.form.editTitle': 'Edit Screen',
      'screenManagement.screens.form.editSubtitle': 'Update screen details',
      'screenManagement.screens.form.screenName': 'Screen Name',
      'screenManagement.screens.form.screenNamePlaceholder': 'Enter screen name',
      'screenManagement.screens.form.screenCode': 'Screen Code',
      'screenManagement.screens.form.screenCodePlaceholder': 'Enter screen code',
      'screenManagement.screens.form.route': 'Route',
      'screenManagement.screens.form.routePlaceholder': 'Enter route path',
      'screenManagement.screens.form.screenGroup': 'Screen Group',
      'screenManagement.screens.form.selectGroup': 'Select a group',
      'screenManagement.screens.form.department': 'Department',
      'screenManagement.screens.form.selectDepartment': 'Select a department',
      'screenManagement.screens.form.module': 'Module',
      'screenManagement.screens.form.selectModule': 'Select a module',
      'screenManagement.screens.form.displayOrder': 'Display Order',
      'screenManagement.screens.form.description': 'Description',
      'screenManagement.screens.form.descriptionPlaceholder': 'Enter description',
      'screenManagement.screens.form.sectionIdentity': 'Screen Identity',
      'screenManagement.screens.form.sectionClassification': 'Classification',
      'screenManagement.screens.form.saveButton': 'Save Screen',
      'screenManagement.screens.form.cancelButton': 'Cancel',
      'screenManagement.screens.table.screenName': 'Screen Name',
      'screenManagement.screens.table.code': 'Code',
      'screenManagement.screens.table.route': 'Route',
      'screenManagement.screens.table.department': 'Department',
      'screenManagement.screens.table.module': 'Module',
      'screenManagement.screens.table.group': 'Group',
      'screenManagement.screens.table.status': 'Status',
      'screenManagement.screens.table.actions.edit': 'Edit Screen',
      'screenManagement.screens.table.actions.delete': 'Delete Screen',
      'screenManagement.screens.messages.updateSuccess': 'Screen updated successfully',
      'screenManagement.screens.messages.createSuccess': 'Screen created successfully',
      'screenManagement.screens.messages.deleteSuccess': 'Screen deleted successfully',
      'screenManagement.screens.messages.updateError': 'Failed to update screen',
      'screenManagement.screens.messages.createError': 'Failed to create screen',
      'screenManagement.screens.messages.deleteError': 'Failed to delete screen',
      'screenManagement.screens.messages.deleteConfirmTitle': 'Delete Screen',
      'screenManagement.screens.messages.deleteConfirmMessage':
        'Are you sure you want to delete this screen?',
      'screenManagement.groups.addGroup': 'Add Group',
      'screenManagement.groups.searchPlaceholder': 'Search groups...',
      'screenManagement.groups.noGroupsFound': 'No groups found',
      'screenManagement.groups.form.addTitle': 'Add New Screen Group',
      'screenManagement.groups.form.addSubtitle': 'Create a new screen group',
      'screenManagement.groups.form.editTitle': 'Edit Screen Group',
      'screenManagement.groups.form.editSubtitle': 'Update screen group details',
      'screenManagement.groups.form.groupName': 'Group Name',
      'screenManagement.groups.form.groupCode': 'Group Code',
      'screenManagement.groups.form.displayOrder': 'Display Order',
      'screenManagement.groups.form.status': 'Status',
      'screenManagement.groups.form.saveButton': 'Save Group',
      'screenManagement.groups.form.cancelButton': 'Cancel',
      'screenManagement.groups.table.groupName': 'Group Name',
      'screenManagement.groups.table.code': 'Code',
      'screenManagement.groups.table.order': 'Order',
      'screenManagement.groups.table.status': 'Status',
      'screenManagement.groups.table.actions.edit': 'Edit Group',
      'screenManagement.groups.table.actions.delete': 'Delete Group',
      'screenManagement.groups.messages.updateSuccess': 'Group updated successfully',
      'screenManagement.groups.messages.createSuccess': 'Group created successfully',
      'screenManagement.groups.messages.deleteSuccess': 'Group deleted successfully',
      'screenManagement.groups.messages.updateError': 'Failed to update group',
      'screenManagement.groups.messages.createError': 'Failed to create group',
      'screenManagement.groups.messages.deleteError': 'Failed to delete group',
      'screenManagement.groups.messages.deleteConfirmTitle': 'Delete Group',
      'screenManagement.groups.messages.deleteConfirmMessage':
        'Are you sure you want to delete this group?',
      'common.confirm.delete.confirm': 'Delete',
      'common.confirm.delete.title': 'Delete Confirm',
      'common.confirm.delete.description': 'Are you sure?',
      'common.confirm.add.confirm': 'Add',
      'common.confirm.update.confirm': 'Update',
      'common.status.active': 'Active',
      'common.status.inactive': 'Inactive',
      'common.errors.generic': 'An error occurred',
      'confirm.delete.confirm': 'Delete',
      'confirm.delete.title': 'Delete Confirm',
      'validation.screenCodeRequired': 'Screen code is required',
      'validation.screenNameRequired': 'Screen name is required',
      'validation.routeRequired': 'Route is required',
      'validation.groupRequired': 'Screen group is required',
      'validation.groupNameRequired': 'Group name is required',
      'validation.groupCodeRequired': 'Group code is required',
      // RolePermissionManager translations
      'accessControl.filters.selectRole': 'Select Role',
      'accessControl.filters.selectDepartment': 'All Departments',
      'accessControl.roles.noRolesFound': 'no roles found from API',
      'accessControl.actions.savePermissions': 'Save Permissions',
      'accessControl.accessLevels.noAccess': 'No Access',
      'accessControl.accessLevels.view': 'View',
      'accessControl.accessLevels.edit': 'Edit',
      'accessControl.accessLevels.full': 'Full Access',
      'accessControl.actions.applyToAll': 'Apply to All',
      'messages.saving': 'Saving...',
      'accessControl.domains.general': 'General',
    };
    return keys[key] || keys[`${namespace}.${key}`] || key;
  },
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('ScreenMasterManagement', () => {
  const mockScreens = [
    {
      screenMasterId: 1,
      screenName: 'Dashboard',
      screenCode: 'DASHBOARD',
      routePath: '/dashboard',
      screenIcon: 'Home',
      screenGroupId: 1,
      screenGroupName: 'General',
      displayOrder: 1,
      isActive: true,
      isMenu: true,
      isAuthenticationRequired: true,
      screenNameLocal: 'Dashboard',
      moduleId: null,
      moduleName: null,
    },
  ];

  const mockGroups = [
    {
      screenGroupId: 1,
      screenGroupName: 'General',
      screenGroupCode: 'GEN',
      screenGroupIcon: 'Home',
      displayOrder: 1,
      isActive: true,
    },
  ];

  const mockPagination = {
    pageNumber: 1,
    pageSize: 10,
    totalCount: 1,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  };

  function setup() {
    return render(
      <NextIntlClientProvider locale="en" messages={{}}>
        <ConfirmProvider>
          <ScreenMasterManagement
            initialScreens={mockScreens}
            initialGroups={mockGroups}
            screensPagination={mockPagination}
            groupsPagination={mockPagination}
          />
        </ConfirmProvider>
      </NextIntlClientProvider>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.clear();
  });

  it('renders the component with tabs', () => {
    setup();
    expect(screen.getByRole('tab', { name: /Tab Screens/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Tab Groups/i })).toBeInTheDocument();
  });

  it('displays screens list by default', () => {
    setup();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('navigates to Add Screen route when Add Screen button is clicked', async () => {
    setup();

    // Click Add Screen button
    fireEvent.click(screen.getByRole('button', { name: /Add Screen/i }));

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/screens/add'));
  });

  it('switches to Screen Groups tab and displays groups', async () => {
    const { rerender } = setup();

    // Click on Groups tab
    fireEvent.click(screen.getByRole('tab', { name: /Tab Groups/i }));

    // Re-render with subTab="groups" to simulate tab change
    rerender(
      <NextIntlClientProvider locale="en" messages={{}}>
        <ConfirmProvider>
          <ScreenMasterManagement
            subTab="groups"
            initialScreens={mockScreens}
            initialGroups={mockGroups}
            screensPagination={mockPagination}
            groupsPagination={mockPagination}
          />
        </ConfirmProvider>
      </NextIntlClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('GEN')).toBeInTheDocument();
    });
  });

  it('navigates to Edit Screen route when edit icon is clicked', async () => {
    setup();

    // Find and click edit button
    const row = screen.getByRole('row', { name: /Dashboard/i });
    fireEvent.click(within(row).getByRole('button', { name: /Edit/i }));

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/screens/edit/1'));
  });

  it('calls deleteScreenAction when deleting a screen', async () => {
    setup();
    const row = screen.getByRole('row', { name: /Dashboard/i });
    fireEvent.click(within(row).getByRole('button', { name: /Delete/i }));

    // Confirm dialog - wait for portal content
    const dialog = await screen.findByRole('dialog');
    const confirmButton = within(dialog).getByRole('button', { name: /Delete/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteScreenAction).toHaveBeenCalled();
    });
  });

  it('navigates to Add Group route when Add Group button is clicked', async () => {
    const { rerender } = setup();

    // Switch to groups tab
    fireEvent.click(screen.getByRole('tab', { name: /Tab Groups/i }));

    rerender(
      <NextIntlClientProvider locale="en" messages={{}}>
        <ConfirmProvider>
          <ScreenMasterManagement
            subTab="groups"
            initialScreens={mockScreens}
            initialGroups={mockGroups}
            screensPagination={mockPagination}
            groupsPagination={mockPagination}
          />
        </ConfirmProvider>
      </NextIntlClientProvider>
    );

    // Wait for groups tab content
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Group/i })).toBeInTheDocument();
    });

    // Click Add Group button
    fireEvent.click(screen.getByRole('button', { name: /Add Group/i }));

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/groups/add'));
  });

  it('calls deleteScreenGroupAction when deleting a group', async () => {
    const { rerender } = setup();

    // Switch to groups tab
    fireEvent.click(screen.getByRole('tab', { name: /Tab Groups/i }));

    rerender(
      <NextIntlClientProvider locale="en" messages={{}}>
        <ConfirmProvider>
          <ScreenMasterManagement
            subTab="groups"
            initialScreens={mockScreens}
            initialGroups={mockGroups}
            screensPagination={mockPagination}
            groupsPagination={mockPagination}
          />
        </ConfirmProvider>
      </NextIntlClientProvider>
    );

    // Wait for groups tab to render
    await waitFor(() => {
      expect(screen.getByText('GEN')).toBeInTheDocument();
    });

    // Find and click delete button
    const row = screen.getByRole('row', { name: /GEN/i });
    fireEvent.click(within(row).getByRole('button', { name: /Delete/i }));

    // Wait for confirm dialog
    const dialog = await screen.findByRole('dialog');
    const confirmButton = within(dialog).getByRole('button', { name: /Delete/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteScreenGroupAction).toHaveBeenCalled();
    });
  });

  it('renders dynamic alias labels when AliasLabelsProvider provides custom labels', () => {
    const mockAliases = {
      Screen: 'CustomScreen',
      Screen_Group: 'CustomGroup',
      Screen_Code: 'Screen Identifier',
      Screen_Name: 'Display Title',
      Route: 'URL Path',
    };

    render(
      <AliasLabelsProvider labels={mockAliases}>
        <NextIntlClientProvider locale="en" messages={{}}>
          <ConfirmProvider>
            <ScreenMasterManagement
              initialScreens={mockScreens}
              initialGroups={mockGroups}
              screensPagination={mockPagination}
              groupsPagination={mockPagination}
            />
          </ConfirmProvider>
        </NextIntlClientProvider>
      </AliasLabelsProvider>
    );

    // Check table headers and tab labels with custom aliases
    expect(screen.getByText('Display Title')).toBeInTheDocument();
    expect(screen.getByText('Screen Identifier')).toBeInTheDocument();
    expect(screen.getByText('URL Path')).toBeInTheDocument();
  });
});
