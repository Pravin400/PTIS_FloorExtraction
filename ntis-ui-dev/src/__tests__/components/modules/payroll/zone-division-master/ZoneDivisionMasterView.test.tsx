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
  return {
    ...actual,
    useConfirm: () => ({ confirm: confirmSpy }),
  };
});

vi.mock('@/app/[locale]/payroll/organisation-masters/zone-division-master/action', () => ({
  deleteZoneDivisionMasterAction: vi.fn(),
  createZoneDivisionMasterAction: vi.fn(),
  updateZoneDivisionMasterAction: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'sonner';
import { ZoneDivisionMasterView } from '@/components/modules/payroll/MasterModule/OrganizationMaster/ZoneDivisionMaster';
import { deleteZoneDivisionMasterAction } from '@/app/[locale]/payroll/organisation-masters/zone-division-master/action';
import type { ZoneDivisionMasterItem } from '@/types/payroll/MasterModule';
import zoneDivisionMasterMessages from '@/i18n/locales/en/payrollZoneDivisionMaster.json';

const messages = {
  common: {
    table: {
      columns: { actions: 'Actions' },
      showingEntries: 'Showing {start} to {end} of {total} entries',
      showing: 'Showing',
      to: 'to',
      of: 'of',
      rowsPerPage: 'Rows per page',
    },
    messages: { noData: 'No data available' },
    actions: { loading: 'Loading...' },
    buttons: { cancel: 'Cancel' },
    status: { all: 'All Status', active: 'Active', inactive: 'Inactive' },
    note: { mandatory: 'Fields marked with * are mandatory' },
  },
  payrollZoneDivisionMaster: zoneDivisionMasterMessages,
};

const mockDataset: ZoneDivisionMasterItem[] = [
  {
    id: 1,
    zoneDivisionId: '1',
    zoneDivisionCode: 'DIV-EAST',
    zoneDivisionName: 'East Division Administrative Office',
    zoneDivisionNameRegional: 'पूर्व विभाग प्रशासकीय कार्यालय',
    address: 'Near Shivaji Statue, Old Agra Road',
    isActive: true,
  },
  {
    id: 2,
    zoneDivisionId: '2',
    zoneDivisionCode: 'HQ-1',
    zoneDivisionName: 'Municipal Headquarters',
    zoneDivisionNameRegional: 'महानगरपालिका मुख्यालय',
    address: 'Main Municipal Building',
    isActive: false,
  },
];

function renderView(props?: {
  items?: ZoneDivisionMasterItem[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ZoneDivisionMasterView
        initialItems={props?.items ?? mockDataset}
        pageNumber={props?.pageNumber ?? 1}
        pageSize={props?.pageSize ?? 10}
        totalCount={props?.totalCount ?? 2}
        totalPages={props?.totalPages ?? 1}
      />
    </NextIntlClientProvider>
  );
}

describe('ZoneDivisionMasterView — Master Table & Presentation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    confirmSpy.mockReset();
    currentSearchParams = new URLSearchParams('');
  });

  it('renders page header title and subtitle', () => {
    renderView();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Zone / Office Master' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Manage municipal zone offices, division establishments, and regional locations')
    ).toBeInTheDocument();
  });

  it('renders search input, status filter, and Add button', () => {
    renderView();
    expect(screen.getByPlaceholderText('Search offices by code, name, address...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Zone \/ Office/i })).toBeInTheDocument();
    expect(document.getElementById('zone-status-filter')).toBeInTheDocument();
  });

  it('renders table columns, office codes, and rows', () => {
    renderView();
    expect(screen.getByText('DIV-EAST')).toBeInTheDocument();
    expect(screen.getByText('East Division Administrative Office')).toBeInTheDocument();
    expect(screen.getByText('HQ-1')).toBeInTheDocument();
    expect(screen.getByText('Municipal Headquarters')).toBeInTheDocument();
  });
});

describe('ZoneDivisionMasterView — Search and Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    confirmSpy.mockReset();
    currentSearchParams = new URLSearchParams('');
  });

  it('navigates with search parameter when typing in search input', async () => {
    renderView();
    const searchInput = screen.getByPlaceholderText('Search offices by code, name, address...');
    fireEvent.change(searchInput, { target: { value: 'EAST' } });

    await waitFor(() => {
      expect(pushSpy).toHaveBeenCalledWith(
        expect.stringContaining('?q=EAST'),
        expect.any(Object)
      );
    });
  });

  it('filters rows by status dropdown', () => {
    renderView();
    const statusSelect = document.getElementById('zone-status-filter')!;

    fireEvent.focus(statusSelect);
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Active' }));
    expect(pushSpy).toHaveBeenCalledWith('?status=active', expect.any(Object));
  });
});

describe('ZoneDivisionMasterView — CRUD Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    confirmSpy.mockReset();
    currentSearchParams = new URLSearchParams('');
  });

  it('opens drawer in Add mode when Add button is clicked', () => {
    renderView();
    fireEvent.click(screen.getByRole('button', { name: /Add Zone \/ Office/i }));

    expect(screen.getByText('Add New Zone / Office')).toBeInTheDocument();
    expect(
      screen.getByText('Create a new municipal administrative office establishment')
    ).toBeInTheDocument();
  });

  it('opens drawer in Edit mode when edit button is clicked', () => {
    renderView();
    const editButtons = screen.getAllByTitle('Edit Zone / Office');
    fireEvent.click(editButtons[0]);

    expect(screen.getByText('Edit Zone / Office')).toBeInTheDocument();
    expect(screen.getByDisplayValue('East Division Administrative Office')).toBeInTheDocument();
  });

  it('triggers confirmation modal when delete button is clicked and deletes successfully', async () => {
    vi.mocked(deleteZoneDivisionMasterAction).mockResolvedValueOnce({ success: true });
    confirmSpy.mockImplementation((opts: { onConfirm: () => Promise<void> }) => {
      opts.onConfirm();
    });

    renderView();
    const deleteButtons = screen.getAllByTitle('Delete Zone / Office');
    fireEvent.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'delete',
        title: 'Delete Zone / Office',
        description: expect.stringContaining('East Division Administrative Office'),
      })
    );

    await waitFor(() => {
      expect(deleteZoneDivisionMasterAction).toHaveBeenCalledWith('1');
      expect(refreshSpy).toHaveBeenCalled();
    });
  });

  it('shows error toast when delete action fails', async () => {
    vi.mocked(deleteZoneDivisionMasterAction).mockResolvedValueOnce({
      success: false,
      statusCode: 409,
      errorCode: 'IN_USE',
    });
    confirmSpy.mockImplementation((opts: { onConfirm: () => Promise<void> }) => {
      opts.onConfirm();
    });

    renderView();
    const deleteButtons = screen.getAllByTitle('Delete Zone / Office');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(deleteZoneDivisionMasterAction).toHaveBeenCalledWith('1');
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
