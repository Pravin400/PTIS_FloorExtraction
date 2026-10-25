import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DesignationMasterView } from '@/components/modules/payroll/MasterModule/OrganizationMaster/DesignationMaster/DesignationMasterView';
import type { DesignationMasterItem } from '@/types/payroll/MasterModule';
import { toast } from 'sonner';
import {
  deleteDesignationMasterAction,
} from '@/app/[locale]/payroll/organisation-masters/designation-master/action';

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
  usePathname: () => '/en/payroll/organisation-masters/designation-master',
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/app/[locale]/payroll/organisation-masters/designation-master/action', () => ({
  deleteDesignationMasterAction: vi.fn(),
  createDesignationMasterAction: vi.fn(),
  updateDesignationMasterAction: vi.fn(),
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
  'list.title': 'Designation Master',
  'list.subtitle': 'Manage designations for departments',
  'list.buttons.add': 'Add Designation',
  'list.filters.search': 'Search designations...',
  'form.addTitle': 'Add Designation',
  'form.editTitle': 'Edit Designation',
  'form.subtitle': 'Create new designation',
  'form.editSubtitle': 'Update designation details',
  'form.fields.designationCode.label': 'Designation Code',
  'form.fields.designationName.label': 'Designation Name',
  'form.fields.designationLocal.label': 'Designation Name (Regional)',
  'form.fields.designationDescription.label': 'Description',
  'form.status.label': 'Status',
  'list.table.designationCode': 'Designation Code',
  'list.table.designationName': 'Designation Name',
  'list.table.designationLocal': 'Designation Name (Regional)',
  'list.table.description': 'Description',
  'list.table.status': 'Status',
  'list.table.actions': 'Actions',
  'list.buttons.editTitle': 'Edit Designation',
  'list.buttons.deleteTitle': 'Delete Designation',
  'status.label': 'Status',
  'buttons.save': 'Save',
  'buttons.update': 'Update',
  'buttons.cancel': 'Cancel',
  'status.all': 'All Status',
  'status.active': 'Active',
  'status.inactive': 'Inactive',
  'delete.confirmTitle': 'Delete Designation',
  'delete.confirmDescription': 'Are you sure you want to delete "{name}"? This action cannot be undone.',
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

const mockItems: DesignationMasterItem[] = [
  {
    id: 1,
    designationId: 'DESIG-1',
    designationCode: 'COMM',
    designationName: 'Municipal Commissioner',
    designationNameMarathi: 'महानगरपालिका आयुक्त',
    description: 'Executive chief of administration',
    isActive: true,
  },
  {
    id: 2,
    designationId: 'DESIG-2',
    designationCode: 'CLERK_JR',
    designationName: 'Junior Clerk',
    designationNameMarathi: 'कनिष्ठ लिपिक',
    description: 'Entry administrative role',
    isActive: false,
  },
];

describe('DesignationMasterView', () => {
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

  it('renders page header, search bar, and records in table', () => {
    render(<DesignationMasterView {...defaultProps} />);

    expect(screen.getByText('Designation Master')).toBeInTheDocument();
    expect(screen.getByText('Manage designations for departments')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search designations...')).toBeInTheDocument();
    expect(screen.getByText('Municipal Commissioner')).toBeInTheDocument();
    expect(screen.getByText('Junior Clerk')).toBeInTheDocument();
  });

  it('filters table rows based on search input', async () => {
    render(<DesignationMasterView {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search designations...');
    fireEvent.change(searchInput, { target: { value: 'Commissioner' } });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('?q=Commissioner'),
        expect.any(Object)
      );
    });
  });

  it('filters table rows based on status dropdown', () => {
    render(<DesignationMasterView {...defaultProps} />);

    const statusSelect = document.getElementById('desig-status-filter')!;
    fireEvent.focus(statusSelect);
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Inactive' }));

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining('?status=inactive'),
      expect.any(Object)
    );
  });

  it('opens create drawer when Add Designation button is clicked', () => {
    render(<DesignationMasterView {...defaultProps} />);

    const addBtn = screen.getByRole('button', { name: /add designation/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Create new designation')).toBeInTheDocument();
  });

  it('triggers confirmation modal and deletes item successfully', async () => {
    vi.mocked(deleteDesignationMasterAction).mockResolvedValue({ success: true });

    render(<DesignationMasterView {...defaultProps} />);

    const deleteBtns = screen.getAllByTitle('Delete Designation');
    fireEvent.click(deleteBtns[0]);

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Delete Designation',
        description: expect.stringContaining('Municipal Commissioner'),
      })
    );

    const confirmOptions = mockConfirm.mock.calls[0][0];
    await act(async () => {
      await confirmOptions.onConfirm();
    });

    expect(deleteDesignationMasterAction).toHaveBeenCalledWith('1');
    expect(toast.success).toHaveBeenCalledWith('"Municipal Commissioner" removed successfully.');
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('displays error message when delete returns 409 conflict', async () => {
    vi.mocked(deleteDesignationMasterAction).mockResolvedValue({
      success: false,
      statusCode: 409,
      message: 'Referenced elsewhere',
    });

    render(<DesignationMasterView {...defaultProps} />);

    const deleteBtns = screen.getAllByTitle('Delete Designation');
    fireEvent.click(deleteBtns[0]);

    const confirmOptions = mockConfirm.mock.calls[0][0];
    await confirmOptions.onConfirm();

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('currently linked to employee or organizational records')
    );
  });
});
