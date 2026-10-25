import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

const pushSpy = vi.hoisted(() => vi.fn());
const refreshSpy = vi.hoisted(() => vi.fn());
const confirmSpy = vi.hoisted(() => vi.fn());

let currentSearchParams = new URLSearchParams('');
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushSpy,
    replace: (url: string, opts?: unknown) => {
      pushSpy(url, opts);
      const qIndex = url.indexOf('?');
      currentSearchParams = new URLSearchParams(qIndex !== -1 ? url.slice(qIndex + 1) : '');
    },
    refresh: refreshSpy,
  }),
  useSearchParams: () => currentSearchParams,
  usePathname: () => '',
}));

vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>();
  return { ...actual, useLocale: () => 'en' };
});

vi.mock('@/components/common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/common')>();
  return { ...actual, useConfirm: () => ({ confirm: confirmSpy }) };
});

vi.mock('@/app/[locale]/payroll/organisation-masters/emp-class-master/action', () => ({
  deleteEmpClassMasterAction: vi.fn(),
  createEmpClassMasterAction: vi.fn(),
  updateEmpClassMasterAction: vi.fn(),
}));

import { EmpClassMasterView } from '@/components/modules/payroll/MasterModule/OrganizationMaster/EmpClassMaster';
import { deleteEmpClassMasterAction } from '@/app/[locale]/payroll/organisation-masters/emp-class-master/action';
import type { EmpClassMasterItem } from '@/types/payroll/MasterModule';
import empClassMasterMessages from '@/i18n/locales/en/payrollEmployeeClassMaster.json';

const messages = {
  common: {
    table: { columns: { actions: 'Actions' }, showingEntries: 'Showing {start}-{end} of {total}', showing: 'Showing', to: 'to', of: 'of', rowsPerPage: 'Rows per page' },
    messages: { noData: 'No data available' },
    actions: { loading: 'Loading...' },
    buttons: { cancel: 'Cancel' },
    status: { all: 'All Status', active: 'Active', inactive: 'Inactive' },
    note: { mandatory: 'Fields marked with * are mandatory' },
  },
  payrollEmployeeClassMaster: empClassMasterMessages,
};

const mockDataset: EmpClassMasterItem[] = [
  { id: 1, employeeClassId: '1', classCode: 'CLASS-I', className: 'Class I (Group A)', classNameMarathi: 'वर्ग १ (गट अ)', description: 'Senior municipal executives', isActive: true },
  { id: 2, employeeClassId: '2', classCode: 'CLASS-II', className: 'Class II (Group B)', classNameMarathi: 'वर्ग २ (गट ब)', description: 'Mid-level officers', isActive: false },
];

function renderView(props?: { items?: EmpClassMasterItem[]; pageNumber?: number; pageSize?: number; totalCount?: number; totalPages?: number }) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <EmpClassMasterView
        initialItems={props?.items ?? mockDataset}
        pageNumber={props?.pageNumber ?? 1}
        pageSize={props?.pageSize ?? 10}
        totalCount={props?.totalCount ?? 2}
        totalPages={props?.totalPages ?? 1}
      />
    </NextIntlClientProvider>
  );
}

describe('EmpClassMasterView — Master Table & Presentation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSearchParams = new URLSearchParams('');
  });

  it('renders page header title and subtitle', () => {
    renderView();
    expect(screen.getByText('Employee Class Master')).toBeInTheDocument();
    expect(screen.getByText('Manage employee cadres, classifications, and service group hierarchies')).toBeInTheDocument();
  });

  it('renders Add Employee Class action button and search controls', () => {
    renderView();
    expect(screen.getByRole('button', { name: /add employee class/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search employee classes...')).toBeInTheDocument();
    expect(document.getElementById('class-status-filter')).toBeInTheDocument();
  });

  it('renders all table columns, class codes, and regional descriptions', () => {
    renderView();
    expect(screen.getByText('CLASS-I')).toBeInTheDocument();
    expect(screen.getByText('Class I (Group A)')).toBeInTheDocument();
    expect(screen.getByText('वर्ग १ (गट अ)')).toBeInTheDocument();
    expect(screen.getByText('CLASS-II')).toBeInTheDocument();
    expect(screen.getByText('Class II (Group B)')).toBeInTheDocument();
  });

  it('renders status badges with appropriate visual indicators (Active vs Inactive)', () => {
    renderView();
    expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Inactive').length).toBeGreaterThanOrEqual(1);
  });
});

describe('EmpClassMasterView — Search and Status Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSearchParams = new URLSearchParams('');
  });

  it('navigates with search parameter when typing in search input', async () => {
    renderView();
    const searchInput = screen.getByPlaceholderText('Search employee classes...');
    fireEvent.change(searchInput, { target: { value: 'CLASS-II' } });

    await waitFor(() => {
      expect(pushSpy).toHaveBeenCalledWith(
        expect.stringContaining('?q=CLASS-II'),
        expect.any(Object)
      );
    });
  });

  it('filters rows strictly by status dropdown (Active / Inactive / All)', () => {
    renderView();
    const statusSelect = document.getElementById('class-status-filter')!;

    // Filter to Active
    fireEvent.focus(statusSelect);
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Active' }));
    expect(pushSpy).toHaveBeenCalledWith('?status=active', expect.any(Object));

    // Filter to Inactive
    fireEvent.focus(statusSelect);
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Inactive' }));
    expect(pushSpy).toHaveBeenCalledWith('?status=inactive', expect.any(Object));
  });
});

describe('EmpClassMasterView — CRUD User Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    confirmSpy.mockReset();
    currentSearchParams = new URLSearchParams('');
  });

  it('opens drawer in Add Mode when Add Employee Class button is clicked', () => {
    renderView();
    const addBtn = screen.getByRole('button', { name: /add employee class/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Add New Employee Class')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create class/i })).toBeInTheDocument();
  });

  it('opens drawer in Edit Mode with populated fields when edit button is clicked', () => {
    renderView();
    const editBtn = screen.getByRole('button', { name: /edit class i \(group a\)/i });
    fireEvent.click(editBtn);

    expect(screen.getByText('Edit Employee Class')).toBeInTheDocument();
    expect(screen.getByDisplayValue('CLASS-I')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Class I (Group A)')).toBeInTheDocument();
  });

  it('triggers confirmation dialog before deleting an employee class', () => {
    renderView();
    const deleteBtn = screen.getByRole('button', { name: /delete class i \(group a\)/i });
    fireEvent.click(deleteBtn);

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'delete', title: 'Delete Employee Class', confirmText: 'Delete' })
    );
  });

  it('calls delete action and refreshes router on confirmation', async () => {
    vi.mocked(deleteEmpClassMasterAction).mockResolvedValue({ success: true });
    confirmSpy.mockImplementation((opts: { onConfirm: () => Promise<void> }) => {
      opts.onConfirm();
    });

    renderView();
    const deleteBtn = screen.getByRole('button', { name: /delete class i \(group a\)/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(deleteEmpClassMasterAction).toHaveBeenCalledWith('1');
      expect(refreshSpy).toHaveBeenCalled();
    });
  });
});

describe('EmpClassMasterView — Initial Items Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSearchParams = new URLSearchParams('');
  });

  it('renders provided initial items in table', () => {
    const dataset: EmpClassMasterItem[] = [
      { id: 1, employeeClassId: '1', classCode: 'CLASS-I', className: 'Class I (Group A)', classNameMarathi: 'वर्ग १ (गट अ)', description: 'Active class', isActive: true },
      { id: 2, employeeClassId: '2', classCode: 'CLASS-II', className: 'Class II (Group B)', classNameMarathi: 'वर्ग २ (गट ब)', description: 'Inactive class', isActive: false },
    ];

    renderView({ items: dataset, totalCount: 2 });

    expect(screen.getByText('CLASS-I')).toBeInTheDocument();
    expect(screen.getByText('CLASS-II')).toBeInTheDocument();
  });
});
