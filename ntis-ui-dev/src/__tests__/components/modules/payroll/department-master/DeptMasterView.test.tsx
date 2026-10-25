import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeptMasterView } from '@/components/modules/payroll/MasterModule/OrganizationMaster/DepartmentMaster/DeptMasterView';
import type { DeptMasterItem } from '@/types/payroll/MasterModule';
import { toast } from 'sonner';
import {
  deleteDeptMasterAction,
} from '@/app/[locale]/payroll/organisation-masters/department-master/action';

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockReplace = vi.fn();

let currentSearchParams = new URLSearchParams('');
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: (url: string, opts?: unknown) => {
      mockReplace(url, opts);
      const qIndex = url.indexOf('?');
      currentSearchParams = new URLSearchParams(qIndex !== -1 ? url.slice(qIndex + 1) : '');
    },
    refresh: mockRefresh,
    back: vi.fn(),
    forward: vi.fn(),
  }),
  useSearchParams: () => currentSearchParams,
  usePathname: () => '/en/payroll/organisation-masters/department-master',
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/app/[locale]/payroll/organisation-masters/department-master/action', () => ({
  deleteDeptMasterAction: vi.fn(),
  createDeptMasterAction: vi.fn(),
  updateDeptMasterAction: vi.fn(),
}));

const mockConfirm = vi.fn();
vi.mock('@/components/common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/common')>();
  return {
    ...actual,
    useConfirm: () => ({
      confirm: mockConfirm,
    }),
  };
});

const translations: Record<string, string> = {
  'title': 'Department Master',
  'subtitle': 'Manage application departments and their hierarchical configuration',
  'list.buttons.add': 'Add Department',
  'list.filters.searchPlaceholder': 'Search departments...',
  'form.title.add': 'Add New Department',
  'form.title.edit': 'Edit Department',
  'form.subtitle.add': 'Configure new department details',
  'form.subtitle.edit': 'Update department information',
  'form.fields.departmentCode': 'Department Code',
  'form.fields.departmentName': 'Department Name',
  'form.fields.departmentNameLocal': 'Department Name (Regional)',
  'form.fields.departmentDescription': 'Description',
  'form.fields.status': 'Status',
  'list.table.departmentCode': 'Department Code',
  'list.table.departmentName': 'Department Name',
  'list.table.departmentNameLocal': 'Department Name (Regional)',
  'list.table.departmentDescription': 'Description',
  'list.table.status': 'Status',
  'list.table.actions': 'Actions',
  'list.buttons.editTitle': 'Edit Department',
  'list.buttons.deleteTitle': 'Delete Department',
  'status.all': 'All Status',
  'status.active': 'Active',
  'status.inactive': 'Inactive',
  'delete.confirmTitle': 'Delete Department',
  'delete.confirmDescription': 'Are you sure you want to delete "{name}"? This will permanently remove it.',
  'delete.deleteInUse': '"{name}" is currently linked to employee or organizational records and cannot be deleted.',
  'delete.success': '"{name}" removed successfully.',
  'confirm.delete.confirm': 'Delete',
  'confirm.cancel': 'Cancel',
};

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string, values?: Record<string, string>) => {
    let text = translations[key] ?? key;
    if (values) {
      Object.entries(values).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  },
}));

const mockItems: DeptMasterItem[] = [
  {
    id: 1,
    departmentId: 'DEPT-1',
    departmentCode: 'GEN_ADMIN',
    departmentName: 'General Administration',
    departmentNameMarathi: 'सामान्य प्रशासन',
    description: 'Overall municipal administration',
    isActive: true,
  },
  {
    id: 2,
    departmentId: 'DEPT-2',
    departmentCode: 'FINANCE',
    departmentName: 'Finance & Accounts',
    departmentNameMarathi: 'वित्त व लेखा',
    description: 'Budget and accounts',
    isActive: false,
  },
];

describe('DeptMasterView', () => {
  const defaultProps = {
    initialItems: mockItems,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 2,
    totalPages: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    currentSearchParams = new URLSearchParams('');
  });

  it('renders page header, search input, status filter, and Add button', () => {
    render(<DeptMasterView {...defaultProps} />);

    expect(screen.getByText('Department Master')).toBeInTheDocument();
    expect(screen.getByText('Manage application departments and their hierarchical configuration')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search departments...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add department/i })).toBeInTheDocument();
  });

  it('renders department rows in table with codes and status pills', () => {
    render(<DeptMasterView {...defaultProps} />);

    expect(screen.getByText('GEN_ADMIN')).toBeInTheDocument();
    expect(screen.getByText('General Administration')).toBeInTheDocument();
    expect(screen.getByText('सामान्य प्रशासन')).toBeInTheDocument();
    expect(screen.getByText('FINANCE')).toBeInTheDocument();
    expect(screen.getByText('Finance & Accounts')).toBeInTheDocument();
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Inactive').length).toBeGreaterThan(0);
  });

  it('filters rows by status dropdown selection', () => {
    render(<DeptMasterView {...defaultProps} />);

    const select = document.getElementById('dept-status-filter')!;

    // Filter to Active only
    fireEvent.focus(select);
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Active' }));
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining('?status=active'),
      expect.any(Object)
    );

    // Filter to Inactive only
    fireEvent.focus(select);
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Inactive' }));
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining('?status=inactive'),
      expect.any(Object)
    );
  });

  it('navigates with query parameter when searching', async () => {
    render(<DeptMasterView {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search departments...');
    fireEvent.change(searchInput, { target: { value: 'GEN_ADMIN' } });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('?q=GEN_ADMIN'),
        expect.any(Object)
      );
    });
  });

  it('opens create drawer when "+ Add Department" is clicked', () => {
    render(<DeptMasterView {...defaultProps} />);

    const addBtn = screen.getByRole('button', { name: /add department/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Add New Department')).toBeInTheDocument();
  });

  it('opens edit drawer when edit button is clicked on a row', () => {
    render(<DeptMasterView {...defaultProps} />);

    const editBtns = screen.getAllByTitle('Edit Department');
    fireEvent.click(editBtns[0]);

    expect(screen.getByText('Edit Department')).toBeInTheDocument();
    expect(screen.getByDisplayValue('GEN_ADMIN')).toBeInTheDocument();
  });

  it('prompts delete confirmation and deletes row successfully', async () => {
    vi.mocked(deleteDeptMasterAction).mockResolvedValue({ success: true });
    mockConfirm.mockImplementation((opts: { onConfirm?: () => Promise<void> | void }) => {
      opts.onConfirm?.();
    });

    render(<DeptMasterView {...defaultProps} />);

    const deleteBtns = screen.getAllByTitle('Delete Department');
    fireEvent.click(deleteBtns[0]);

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'delete',
        title: 'Delete Department',
      })
    );

    await waitFor(() => {
      expect(deleteDeptMasterAction).toHaveBeenCalledWith('1');
    });

    expect(toast.success).toHaveBeenCalledWith('"General Administration" removed successfully.');
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('handles 409 conflict when deleting a department in use', async () => {
    vi.mocked(deleteDeptMasterAction).mockResolvedValue({
      success: false,
      statusCode: 409,
      message: 'Conflict',
    });
    mockConfirm.mockImplementation((opts: { onConfirm?: () => Promise<void> | void }) => {
      opts.onConfirm?.();
    });

    render(<DeptMasterView {...defaultProps} />);

    const deleteBtns = screen.getAllByTitle('Delete Department');
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(deleteDeptMasterAction).toHaveBeenCalledWith('1');
    });

    expect(toast.error).toHaveBeenCalledWith(
      '"General Administration" is currently linked to employee or organizational records and cannot be deleted.'
    );
  });
});
