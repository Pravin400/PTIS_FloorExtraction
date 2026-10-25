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

vi.mock('@/app/[locale]/payroll/organisation-masters/emp-type-master/action', () => ({
  deleteEmpTypeMasterAction: vi.fn(),
}));

import { EmpTypeMaster as EmpTypeMasterView } from '@/components/modules/payroll/MasterModule/OrganizationMaster/EmpTypeMaster/EmpTypeMaster';
import { deleteEmpTypeMasterAction } from '@/app/[locale]/payroll/organisation-masters/emp-type-master/action';
import type { EmpTypeMasterItem } from '@/types/payroll/MasterModule';

import empTypeMasterMessages from '@/i18n/locales/en/payrollEmployeeTypeMaster.json';

// ── i18n mock messages (Property Tax FloorMaster.test.tsx pattern) ────────────
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
  empTypeMaster: empTypeMasterMessages,
  payrollEmployeeTypeMaster: empTypeMasterMessages,
};

// ── Test fixtures ─────────────────────────────────────────────────────────────
const mockDataset: EmpTypeMasterItem[] = [
  {
    employeeTypeId: 'TYPE-001',
    employeeTypeCode: 'PERM',
    employeeTypeName: 'Permanent',
    employeeTypeNameMarathi: 'कायम',
    sequenceNo: 1,
    isActive: true,
  },
  {
    employeeTypeId: 'TYPE-002',
    employeeTypeCode: 'TEMP',
    employeeTypeName: 'Temporary',
    employeeTypeNameMarathi: 'तात्पुरता',
    sequenceNo: 2,
    isActive: false,
  },
];

function renderView(props?: {
  items?: EmpTypeMasterItem[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <EmpTypeMasterView
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
beforeEach(() => {
  currentSearchParams = new URLSearchParams('');
});

describe('EmpTypeMasterView — Master Table & Presentation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSearchParams = new URLSearchParams('');
  });

  it('renders page header title and subtitle', () => {
    renderView();
    expect(screen.getByText('Employee Type Master')).toBeInTheDocument();
    expect(
      screen.getByText('Configure employee employment contracts, terms, and engagement types')
    ).toBeInTheDocument();
  });

  it('renders Add Employee Type action button and search controls', () => {
    renderView();
    expect(screen.getByRole('button', { name: /add employee type/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search employee types...')).toBeInTheDocument();
    expect(document.getElementById('status-filter')).toBeInTheDocument();
  });

  it('renders all table columns, item codes, and regional descriptions', () => {
    renderView();
    expect(screen.getByText('PERM')).toBeInTheDocument();
    expect(screen.getByText('Permanent')).toBeInTheDocument();
    expect(screen.getByText('कायम')).toBeInTheDocument();

    expect(screen.getByText('TEMP')).toBeInTheDocument();
    expect(screen.getByText('Temporary')).toBeInTheDocument();
    expect(screen.getByText('तात्पुरता')).toBeInTheDocument();
  });

  it('renders status badges with appropriate visual indicators (Active vs Inactive)', () => {
    renderView();
    expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Inactive').length).toBeGreaterThanOrEqual(1);
  });
});

describe('EmpTypeMasterView — Search and Status Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filters rows live by search term', async () => {
    renderView();
    expect(screen.getByText('Permanent')).toBeInTheDocument();
    expect(screen.getByText('Temporary')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Search employee types...');
    fireEvent.change(searchInput, { target: { value: 'TEMP' } });

    await waitFor(
      () => {
        expect(pushSpy).toHaveBeenCalledWith('?q=TEMP', expect.any(Object));
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

describe('EmpTypeMasterView — CRUD User Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens drawer in Add Mode when Add Employee Type button is clicked', () => {
    renderView();
    const addBtn = screen.getByRole('button', { name: /add employee type/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Add New Employee Type')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create type/i })).toBeInTheDocument();
  });

  it('opens drawer in Edit Mode with populated fields when edit button is clicked', () => {
    renderView();
    const editBtn = screen.getByRole('button', { name: /edit permanent/i });
    fireEvent.click(editBtn);

    expect(screen.getByText('Edit Employee Type')).toBeInTheDocument();
    expect(screen.getByDisplayValue('PERM')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Permanent')).toBeInTheDocument();
  });

  it('triggers confirmation dialog before deleting an employee type', () => {
    renderView();
    const deleteBtn = screen.getByRole('button', { name: /delete permanent/i });
    fireEvent.click(deleteBtn);

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'delete',
        title: 'Delete Employee Type',
        description: expect.stringContaining('Permanent'),
        confirmText: 'Delete',
      })
    );
  });

  it('calls delete action and refreshes router on confirmation', async () => {
    vi.mocked(deleteEmpTypeMasterAction).mockResolvedValue({ success: true });
    confirmSpy.mockImplementation((opts: { onConfirm: () => Promise<void> }) => {
      opts.onConfirm();
    });

    renderView();
    const deleteBtn = screen.getByRole('button', { name: /delete permanent/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(deleteEmpTypeMasterAction).toHaveBeenCalledWith('TYPE-001');
      expect(refreshSpy).toHaveBeenCalled();
    });
  });
});

describe('EmpTypeMasterView — Rendering server items', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders server items passed to it without client-side double filtering', () => {
    const dataset: EmpTypeMasterItem[] = [
      {
        employeeTypeId: 'TYPE-001',
        employeeTypeCode: 'PERM',
        employeeTypeName: 'Permanent',
        employeeTypeNameMarathi: 'कायम',
        sequenceNo: 1,
        isActive: true,
        markedForDeletion: false,
      },
      {
        employeeTypeId: 'TYPE-002',
        employeeTypeCode: 'TEMP',
        employeeTypeName: 'Temporary',
        employeeTypeNameMarathi: 'तात्पुरता',
        sequenceNo: 2,
        isActive: false,
        markedForDeletion: false,
      },
    ];

    renderView({ items: dataset, totalCount: 2 });

    expect(screen.getByText('PERM')).toBeInTheDocument();
    expect(screen.getByText('TEMP')).toBeInTheDocument();

    const statusSelect = document.getElementById('status-filter')!;
    fireEvent.focus(statusSelect);
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Inactive' }));

    expect(pushSpy).toHaveBeenCalledWith('?status=inactive', expect.any(Object));
  });
});
