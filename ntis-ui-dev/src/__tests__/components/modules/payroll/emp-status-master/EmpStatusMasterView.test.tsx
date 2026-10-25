import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────
const pushSpy = vi.hoisted(() => vi.fn());
const refreshSpy = vi.hoisted(() => vi.fn());
const confirmSpy = vi.hoisted(() => vi.fn());

// ── Module mocks ──────────────────────────────────────────────────────────────
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
  return {
    ...actual,
    useConfirm: () => ({ confirm: confirmSpy }),
  };
});

vi.mock('@/app/[locale]/payroll/organisation-masters/emp-status-master/action', () => ({
  deleteEmpStatusMasterAction: vi.fn(),
}));

import { EmpStatusMaster as EmpStatusMasterView } from '@/components/modules/payroll/MasterModule/OrganizationMaster/EmpStatusMaster/EmpStatusMaster';
import { deleteEmpStatusMasterAction } from '@/app/[locale]/payroll/organisation-masters/emp-status-master/action';
import type { EmpStatusMasterItem } from '@/types/payroll/MasterModule';

import empStatusMasterMessages from '@/i18n/locales/en/payrollEmployeeStatusMaster.json';

// ── i18n mock messages ────────────────────────────────────────────────────────
const messages = {
  common: {
    table: {
      columns: { actions: 'Actions' },
      showingEntries: 'Showing {start}-{end} of {total}',
    },
    messages: { noData: 'No data available' },
    actions: { loading: 'Loading...' },
    buttons: { cancel: 'Cancel' },
    status: { all: 'All Status', active: 'Active', inactive: 'Inactive' },
    note: { mandatory: 'Fields marked with * are mandatory' },
  },
  empStatusMaster: empStatusMasterMessages,
  payrollEmployeeStatusMaster: empStatusMasterMessages,
};

// ── Test fixtures ─────────────────────────────────────────────────────────────
const mockDataset: EmpStatusMasterItem[] = [
  {
    id: 1,
    employeeStatusId: '1',
    employeeStatusCode: 'ACTIVE',
    employeeStatus: 'Active in Service',
    employeeStatusMarathi: 'सेवेत कार्यरत',
    description: 'Employee is currently active in service',
    isActive: true,
  },
  {
    id: 2,
    employeeStatusId: '2',
    employeeStatusCode: 'SUSPENDED',
    employeeStatus: 'Suspended',
    employeeStatusMarathi: 'निलंबित',
    description: 'Employee under suspension',
    isActive: false,
  },
];

function renderView(props?: {
  items?: EmpStatusMasterItem[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <EmpStatusMasterView
        initialItems={props?.items ?? mockDataset}
        pageNumber={props?.pageNumber ?? 1}
        pageSize={props?.pageSize ?? 10}
        totalCount={props?.totalCount ?? 2}
        totalPages={props?.totalPages ?? 1}
      />
    </NextIntlClientProvider>
  );
}

// ── Test Suites ───────────────────────────────────────────────────────────────
describe('EmpStatusMasterView — Master Table & Presentation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page header title and subtitle', () => {
    renderView();
    expect(screen.getByText('Employee Status Master')).toBeInTheDocument();
    expect(
      screen.getByText('Manage municipal employment statuses and service availability')
    ).toBeInTheDocument();
  });

  it('renders Add Employee Status action button and search controls', () => {
    renderView();
    expect(screen.getByRole('button', { name: /add employee status/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search employee status...')).toBeInTheDocument();
    expect(document.getElementById('status-filter')).toBeInTheDocument();
  });

  it('renders all table columns, item codes, and regional descriptions', () => {
    renderView();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('Active in Service')).toBeInTheDocument();
    expect(screen.getByText('सेवेत कार्यरत')).toBeInTheDocument();

    expect(screen.getByText('SUSPENDED')).toBeInTheDocument();
    expect(screen.getByText('Suspended')).toBeInTheDocument();
    expect(screen.getByText('निलंबित')).toBeInTheDocument();
  });

  it('renders status badges with appropriate visual indicators (Active vs Inactive)', () => {
    renderView();
    expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Inactive').length).toBeGreaterThanOrEqual(1);
  });
});

describe('EmpStatusMasterView — Search and Status Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSearchParams = new URLSearchParams('');
  });

  it('filters rows live by search term', async () => {
    renderView();
    expect(screen.getByText('Active in Service')).toBeInTheDocument();
    expect(screen.getByText('Suspended')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Search employee status...');
    fireEvent.change(searchInput, { target: { value: 'SUSPENDED' } });

    await waitFor(
      () => {
        expect(pushSpy).toHaveBeenCalledWith('?q=SUSPENDED', expect.any(Object));
      },
      { timeout: 1000 }
    );
  });

  it('filters rows strictly by status dropdown (Active / Inactive / All)', () => {
    renderView();
    const statusSelect = document.getElementById('status-filter')!;

    // Filter to Active
    fireEvent.focus(statusSelect);
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Active' }));
    expect(pushSpy).toHaveBeenCalledWith('?status=active', expect.any(Object));

    // Filter to Inactive
    fireEvent.focus(statusSelect);
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Inactive' }));
    expect(pushSpy).toHaveBeenCalledWith('?status=inactive', expect.any(Object));

    // Reset to All
    fireEvent.focus(statusSelect);
    fireEvent.mouseDown(screen.getByRole('option', { name: 'All Status' }));
    expect(pushSpy).toHaveBeenCalledWith('', expect.any(Object));
  });
});

describe('EmpStatusMasterView — CRUD User Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens drawer in Add Mode when Add Employee Status button is clicked', () => {
    renderView();
    const addBtn = screen.getByRole('button', { name: /add employee status/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Add New Employee Status')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create status/i })).toBeInTheDocument();
  });

  it('opens drawer in Edit Mode with populated fields when edit button is clicked', () => {
    renderView();
    const editBtn = screen.getByRole('button', { name: /edit active in service/i });
    fireEvent.click(editBtn);

    expect(screen.getByText('Edit Employee Status')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ACTIVE')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Active in Service')).toBeInTheDocument();
  });

  it('triggers confirmation dialog before deleting an employee status', () => {
    renderView();
    const deleteBtn = screen.getByRole('button', { name: /delete active in service/i });
    fireEvent.click(deleteBtn);

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'delete',
        title: 'Delete Employee Status',
        description: expect.stringContaining('Active in Service'),
        confirmText: 'Delete',
      })
    );
  });

  it('calls delete action and refreshes router on confirmation', async () => {
    vi.mocked(deleteEmpStatusMasterAction).mockResolvedValue({ success: true });
    confirmSpy.mockImplementation((opts: { onConfirm: () => Promise<void> }) => {
      opts.onConfirm();
    });

    renderView();
    const deleteBtn = screen.getByRole('button', { name: /delete active in service/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(deleteEmpStatusMasterAction).toHaveBeenCalledWith('1');
      expect(refreshSpy).toHaveBeenCalled();
    });
  });
});

describe('EmpStatusMasterView — Rendering server items', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders server items passed to it without client-side double filtering', () => {
    const dataset: EmpStatusMasterItem[] = [
      {
        id: 1,
        employeeStatusId: '1',
        employeeStatusCode: 'ACTIVE',
        employeeStatus: 'Active in Service',
        employeeStatusMarathi: 'सेवेत कार्यरत',
        description: 'Currently active',
        isActive: true,
        markedForDeletion: false,
      },
      {
        id: 2,
        employeeStatusId: '2',
        employeeStatusCode: 'SUSPENDED',
        employeeStatus: 'Suspended',
        employeeStatusMarathi: 'निलंबित',
        description: 'Suspended',
        isActive: false,
        markedForDeletion: false,
      },
    ];

    renderView({ items: dataset, totalCount: 2 });

    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('SUSPENDED')).toBeInTheDocument();

    const statusSelect = document.getElementById('status-filter')!;
    fireEvent.focus(statusSelect);
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Inactive' }));

    expect(pushSpy).toHaveBeenCalledWith('?status=inactive', expect.any(Object));
  });
});
