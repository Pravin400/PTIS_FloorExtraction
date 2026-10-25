import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QualificationMasterView } from '@/components/modules/payroll/MasterModule/OrganizationMaster/QualificationMaster/QualificationMasterView';
import type { QualificationMasterItem } from '@/types/payroll/MasterModule';
import { toast } from 'sonner';
import {
  deleteQualificationMasterAction,
} from '@/app/[locale]/payroll/organisation-masters/qualification-master/action';

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
  usePathname: () => '/en/payroll/organisation-masters/qualification-master',
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/app/[locale]/payroll/organisation-masters/qualification-master/action', () => ({
  deleteQualificationMasterAction: vi.fn(),
  createQualificationMasterAction: vi.fn(),
  updateQualificationMasterAction: vi.fn(),
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
  'title': 'Qualification Master',
  'subtitle': 'Configure approved educational, technical, and professional credentials',
  'list.buttons.add': 'Add Qualification',
  'list.filters.searchPlaceholder': 'Search qualifications...',
  'form.title.add': 'Add New Qualification',
  'form.title.edit': 'Edit Qualification',
  'list.table.qualificationCode': 'Qualification Code',
  'list.table.qualificationName': 'Qualification Name',
  'list.table.qualificationNameLocal': 'Qualification Name (Regional)',
  'list.table.qualificationDescription': 'Description',
  'list.table.status': 'Status',
  'list.table.actions': 'Actions',
  'list.buttons.editTitle': 'Edit Qualification',
  'list.buttons.deleteTitle': 'Delete Qualification',
  'delete.confirmTitle': 'Delete Qualification',
  'delete.confirmDescription': 'Are you sure you want to delete "{name}"?',
  'delete.success': '"{name}" removed successfully.',
  'status.all': 'All Status',
  'status.active': 'Active',
  'status.inactive': 'Inactive',
  'confirm.delete.confirm': 'Delete',
  'confirm.cancel': 'Cancel',
};

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    let str = translations[key] ?? key;
    if (values) {
      Object.entries(values).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  },
}));

const mockItems: QualificationMasterItem[] = [
  {
    id: 1,
    qualificationId: 'QUAL-1',
    qualificationCode: 'BCOM',
    qualificationName: 'Bachelor of Commerce',
    qualificationNameRegional: 'वाणिज्य पदवी',
    description: 'Commerce degree',
    isActive: true,
  },
  {
    id: 2,
    qualificationId: 'QUAL-2',
    qualificationCode: 'BE',
    qualificationName: 'Bachelor of Engineering',
    qualificationNameRegional: 'अभियांत्रिकी पदवी',
    description: 'Engineering degree',
    isActive: false,
  },
];

describe('QualificationMasterView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSearchParams = new URLSearchParams('');
  });

  it('renders page header title and subtitle correctly', () => {
    render(
      <QualificationMasterView
        initialItems={mockItems}
        pageNumber={1}
        pageSize={10}
        totalCount={2}
        totalPages={1}
      />
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Qualification Master' })).toBeInTheDocument();
    expect(
      screen.getByText('Configure approved educational, technical, and professional credentials')
    ).toBeInTheDocument();
  });

  it('renders the search input, add button, and table records', () => {
    render(
      <QualificationMasterView
        initialItems={mockItems}
        pageNumber={1}
        pageSize={10}
        totalCount={2}
        totalPages={1}
      />
    );

    expect(
      screen.getByPlaceholderText('Search qualifications...')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add qualification/i })
    ).toBeInTheDocument();

    expect(screen.getByText('BCOM')).toBeInTheDocument();
    expect(screen.getByText('Bachelor of Commerce')).toBeInTheDocument();
    expect(screen.getByText('BE')).toBeInTheDocument();
    expect(screen.getByText('Bachelor of Engineering')).toBeInTheDocument();
  });

  it('opens create drawer when "Add Qualification" is clicked', () => {
    render(
      <QualificationMasterView
        initialItems={mockItems}
        pageNumber={1}
        pageSize={10}
        totalCount={2}
        totalPages={1}
      />
    );

    const addBtn = screen.getByRole('button', { name: /add qualification/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Add New Qualification')).toBeInTheDocument();
  });

  it('opens edit drawer when edit button is clicked', () => {
    render(
      <QualificationMasterView
        initialItems={mockItems}
        pageNumber={1}
        pageSize={10}
        totalCount={2}
        totalPages={1}
      />
    );

    const editBtns = screen.getAllByTitle('Edit Qualification');
    fireEvent.click(editBtns[0]);

    expect(screen.getByText('Edit Qualification')).toBeInTheDocument();
  });

  it('triggers delete flow when delete button is clicked and confirmed', async () => {
    (deleteQualificationMasterAction as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
    });

    mockConfirm.mockImplementation(({ onConfirm }: { onConfirm: () => Promise<void> }) => {
      void onConfirm();
    });

    render(
      <QualificationMasterView
        initialItems={mockItems}
        pageNumber={1}
        pageSize={10}
        totalCount={2}
        totalPages={1}
      />
    );

    const deleteBtns = screen.getAllByTitle('Delete Qualification');
    fireEvent.click(deleteBtns[0]);

    expect(mockConfirm).toHaveBeenCalled();

    await waitFor(() => {
      expect(deleteQualificationMasterAction).toHaveBeenCalledWith('1');
      expect(toast.success).toHaveBeenCalledWith('"Bachelor of Commerce" removed successfully.');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
