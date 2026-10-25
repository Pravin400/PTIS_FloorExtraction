import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoleDesignationMasterClient } from '@/components/modules/configuration-settings/user-management/RoleDesignationMasterClient';
import { NextIntlClientProvider } from 'next-intl';
import { ConfirmProvider } from '@/components/common/ConfirmProvider';
import { User, Role, Designation } from '@/types/user-management';

// Mock server actions
vi.mock('@/app/[locale]/configuration-settings/user-management/actions.mutations', () => ({
  createUserRoleAction: vi.fn(),
  updateUserRoleAction: vi.fn(),
  deleteUserRoleAction: vi.fn(),
  createDesignationAction: vi.fn(),
  updateDesignationAction: vi.fn(),
  deleteDesignationAction: vi.fn(),
}));

vi.mock('@/app/[locale]/configuration-settings/user-management/actions', () => ({
  getUserRolesAction: vi.fn(),
  getDesignationsAction: vi.fn(),
}));

vi.mock('@/hooks/useActivePagePermissions', () => ({
  useActivePagePermissions: () => ({
    canView: true,
    canEdit: true,
    canDelete: true,
    haveFullAccess: true,
    hasAccess: true,
  }),
}));

const mockPush = vi.fn();
let mockSubtab = 'roles';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn((path) => {
      mockPush(path);
      if (path.includes('subtab=designations')) mockSubtab = 'designations';
      if (path.includes('subtab=roles')) mockSubtab = 'roles';
    }),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/en/configuration-settings/user-management',
  useParams: () => ({ locale: 'en' }),
  useSearchParams: () => ({
    get: vi.fn((key) => {
      if (key === 'subtab') return mockSubtab;
      return null;
    }),
    toString: () => `subtab=${mockSubtab}`,
  }),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const messages = {
  userManagement: {
    aliasFallback: {
      user: 'User',
      role: 'Role',
      designation: 'Designation',
      department: 'Department',
      module: 'Module',
      userCode: 'User Code',
      username: 'Username',
      firstName: 'First Name',
      middleName: 'Middle Name',
      lastName: 'Last Name',
      email: 'Email Address',
      mobileNo: 'Mobile Number',
      description: 'Description',
      designationCode: 'Code',
      designationName: 'Designation Name',
    },
    title: '{user} Management',
    stats: {
      totalRoles: 'Total {role}s',
      totalDesignations: 'Total {designation}s',
      assignedTo: 'Assigned to',
      usersCount: '{count} {user}s',
    },
    filters: {
      search: 'Search',
      searchRole: 'Search {role}',
      searchDesignation: 'Search {designation}',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
    },
    actions: {
      add: 'Add',
      edit: 'Edit',
      delete: 'Delete',
      cancel: 'Cancel',
      submit: 'Submit',
      createRole: 'Create {role}',
      updateRole: 'Update {role}',
      createDesignation: 'Create {designation}',
      updateDesignation: 'Update {designation}',
      title: 'Actions',
    },
    form: {
      code: 'Code',
      description: 'Description',
      hierarchy: 'Hierarchy',
      departments: '{department}s',
      moduleAccess: '{module} Access',
      selectLevel: 'Select Level',
      selectDept: 'Select Dept',
      alldepartmentNames: 'All Departments',
    },
    table: {
      role: '{role}',
      actions: 'Actions',
    },
    messages: {
      noRoles: 'No {role}s found',
      noDesignations: 'No {designation}s found',
      roleDeleteSuccess: '{role} deleted successfully',
      roleDeleteError: 'Failed to delete {role}',
      designationDeleteSuccess: '{designation} deleted successfully',
      designationDeleteError: 'Failed to delete {designation}',
    },
    roles: {
      title: '{role} Master',
      subtitle: 'Manage system roles and designations',
      subtitleDesignation: 'Manage designations',
      rolesTab: '{role}s',
      designationsTab: '{designation}s',
      addRole: 'Add {role}',
      editRole: 'Edit {role}',
      addDesignation: 'Add {designation}',
      editDesignation: 'Edit {designation}',
    },
    permissions: {
      create: 'Create',
      read: 'Read',
      update: 'Update',
      delete: 'Delete',
      selected: '{count} permissions selected',
    },
  },
  common: {
    confirm: {
      delete: {
        title: 'Delete',
        description: 'Are you sure you want to delete',
        confirm: 'Delete',
      },
      cancel: 'Cancel',
    },
    table: {
      columns: { actions: 'Actions' },
      showingEntries: 'Showing {start} to {end} of {total} entries',
      page: 'Page {current} of {total}',
    },
  },
};

const mockUser: User = {
  id: '1',
  userId: 1,
  userName: 'johndoe',
  firstName: 'John',
  middleName: '',
  lastName: 'Doe',
  email: 'john@example.com',
  mobileNo: '1234567890',
  isActive: true,
  twoFactorEnabled: false,
  twoFactorRequired: false,
  departmentNames: [],
  departmentIds: [],
  moduleNames: [],
  moduleIds: [],
  roles: [],
  userRoleIds: [],
  status: 'Active',
};

const mockRoles: Role[] = [
  {
    id: '1',
    userRoleId: 1,
    name: 'Administrator',
    code: 'R001',
    description: 'Full access',
    permissions: ['create', 'read', 'update', 'delete'],
    status: 'Active',
    isActive: true,
    userCount: 5,
    users: [mockUser],
  },
];

const mockDesignations: Designation[] = [
  {
    id: '1',
    name: 'Senior Officer',
    code: 'D001',
    localName: 'Senior Officer',
    description: 'Senior management',
    status: 'Active',
    isActive: true,
    userCount: 3,
  },
];

describe('RoleDesignationMasterClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubtab = 'roles';
  });

  const setup = (props = {}) => {
    return render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ConfirmProvider>
          <RoleDesignationMasterClient
            initialRoles={mockRoles}
            initialDesignations={mockDesignations}
            departments={[]}
            {...props}
          />
        </ConfirmProvider>
      </NextIntlClientProvider>
    );
  };

  it('renders roles tab by default', () => {
    setup();
    expect(screen.getByText('Role Master')).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();
  });

  it('switches to designations tab', async () => {
    const { rerender } = setup();
    const designationsTab = screen.getByRole('tab', { name: /Designations/i });
    fireEvent.click(designationsTab);

    // We need to rerender because the hook won't automatically trigger a re-render in this simple mock
    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ConfirmProvider>
          <RoleDesignationMasterClient
            initialRoles={mockRoles}
            initialDesignations={mockDesignations}
            departments={[]}
          />
        </ConfirmProvider>
      </NextIntlClientProvider>
    );

    expect(screen.getByText('Senior Officer')).toBeInTheDocument();
    expect(screen.getByText('D001')).toBeInTheDocument();
  });

  it('filters roles by search term', () => {
    setup();
    const searchInput = screen.getByPlaceholderText('Search Role');
    fireEvent.change(searchInput, { target: { value: 'Admin' } });
    expect(screen.getByText('Administrator')).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'Manager' } });
    expect(screen.queryByText('Administrator')).not.toBeInTheDocument();
  });

  it('calls deleteUserRoleAction after confirmation', async () => {
    const { deleteUserRoleAction } =
      await import('@/app/[locale]/configuration-settings/user-management/actions.mutations');
    vi.mocked(deleteUserRoleAction).mockResolvedValue({ success: true, message: 'Deleted' });

    setup();
    const deleteBtn = screen.getAllByRole('button', { name: /Delete/i })[0];
    fireEvent.click(deleteBtn);

    // Confirmation dialog
    expect(await screen.findByText(/Are you sure you want to delete/i)).toBeInTheDocument();

    const dialog = screen.getByRole('dialog');
    const confirmBtn = within(dialog).getByRole('button', { name: /Delete/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteUserRoleAction).toHaveBeenCalledWith('1');
    });
  });

  it('calls deleteDesignationAction after confirmation', async () => {
    const { deleteDesignationAction } =
      await import('@/app/[locale]/configuration-settings/user-management/actions.mutations');
    vi.mocked(deleteDesignationAction).mockResolvedValue({ success: true, message: 'Deleted' });

    const { rerender } = setup();

    // Switch to designations tab
    fireEvent.click(screen.getByRole('tab', { name: /Designations/i }));
    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ConfirmProvider>
          <RoleDesignationMasterClient
            initialRoles={mockRoles}
            initialDesignations={mockDesignations}
            departments={[]}
          />
        </ConfirmProvider>
      </NextIntlClientProvider>
    );

    const deleteBtn = screen.getAllByRole('button', { name: /Delete/i })[0];
    fireEvent.click(deleteBtn);

    // Confirmation dialog
    expect(await screen.findByText(/Are you sure you want to delete/i)).toBeInTheDocument();

    const dialog = screen.getByRole('dialog');
    const confirmBtn = within(dialog).getByRole('button', { name: /Delete/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(vi.mocked(deleteDesignationAction)).toHaveBeenCalledWith('1');
    });
  });

  it('navigates to add role page', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Add Role' }));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/roles/add'));
  });

  it('navigates to add designation page', () => {
    const { rerender } = setup();
    fireEvent.click(screen.getByRole('tab', { name: /Designations/i }));

    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ConfirmProvider>
          <RoleDesignationMasterClient
            initialRoles={mockRoles}
            initialDesignations={mockDesignations}
            departments={[]}
          />
        </ConfirmProvider>
      </NextIntlClientProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Add Designation/i }));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/designations/add'));
  });
});
