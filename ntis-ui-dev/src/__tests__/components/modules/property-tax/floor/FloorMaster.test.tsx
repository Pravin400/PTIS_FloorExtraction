import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────
const useRouterMock = vi.hoisted(() => vi.fn());

// ── Module mocks (must be before imports that use them) ──────────────────────
vi.mock('next/navigation', () => ({
  useRouter: useRouterMock,
  useSearchParams: () => ({ get: () => '' }),
}));

vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>();
  return {
    ...actual,
    useLocale: () => 'en',
  };
});

vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: () => ({ confirm: vi.fn() }),
}));

vi.mock('@/app/[locale]/property-tax/floormaster/actions', () => ({
  deleteFloorAction: vi.fn(),
}));

import FloorMaster from '@/components/modules/property-tax/Floormaster/floor/FloorMaster';
import type { FloorPagedResponse } from '@/types/floor.types';

// ── i18n messages ────────────────────────────────────────────────────────────
const messages = {
  common: {
    table: {
      columns: { actions: 'Actions' },
      showingEntries: 'Showing {start}-{end} of {total}',
      showing: 'Showing',
      to: 'to',
      of: 'of',
      entries: 'entries',
      rowsPerPage: 'Rows per page',
      sort: {
        verb: 'Sort',
        ascending: 'ascending',
        descending: 'descending',
        by: 'Sort by',
      },
    },
    messages: { noData: 'No data available' },
    actions: { loading: 'Loading...', update: 'Update' },
    buttons: { cancel: 'Cancel' },
    errors: {
      deleteError: 'Delete failed',
      notFound: 'Not found',
    },
  },
  floor: {
    floor: {
      aliasFallback: { floor: 'Floor' },
      table: {
        columns: {
          floorCode: 'Floor Code',
          descriptionEnglish: 'English Description',
          descriptionRegional: 'Regional Description',
          sequenceNo: 'Seq No',
          status: 'Status',
        },
      },
      delete: { confirmDescription: 'Are you sure?' },
      messages: {
        deleteSuccess: 'Deleted successfully',
        deleteInUse: 'Record in use',
      },
    },
  },
};

// ── Test fixtures ─────────────────────────────────────────────────────────────
const makePagedResponse = (overrides?: Partial<FloorPagedResponse>): FloorPagedResponse => ({
  items: [
    {
      id: 1,
      floorCode: 'GF',
      description: 'तळमजला',
      descriptionEnglish: 'Ground Floor',
      fLatGenerationGroupId: 1,
      fLatGenerationSeq: 1,
      sequenceNo: 1,
      isActive: true,
      createdDate: '2024-01-01',
      updatedDate: null,
    },
    {
      id: 2,
      floorCode: 'FF',
      description: 'पहिला मजला',
      descriptionEnglish: 'First Floor',
      fLatGenerationGroupId: 1,
      fLatGenerationSeq: 1,
      sequenceNo: 2,
      isActive: false,
      createdDate: '2024-01-01',
      updatedDate: null,
    },
  ],
  totalCount: 2,
  pageNumber: 1,
  pageSize: 10,
  totalPages: 1,
  hasPrevious: false,
  hasNext: false,
  ...overrides,
});

function setup(pagedOverrides?: Partial<FloorPagedResponse>) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <FloorMaster
        floorPaged={makePagedResponse(pagedOverrides)}
        sortBy="floorCode"
        sortOrder="asc"
      />
    </NextIntlClientProvider>
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe('FloorMaster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default useRouter return value
    useRouterMock.mockReturnValue({
      push: vi.fn(),
      refresh: vi.fn(),
    });
  });

  it('renders floor data rows', () => {
    setup();
    expect(screen.getByText('GF')).toBeInTheDocument();
    expect(screen.getByText('Ground Floor')).toBeInTheDocument();
    expect(screen.getByText('FF')).toBeInTheDocument();
    expect(screen.getByText('First Floor')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    setup();
    expect(screen.getByText('Floor Code')).toBeInTheDocument();
    expect(screen.getByText('English Description')).toBeInTheDocument();
    expect(screen.getByText('Regional Description')).toBeInTheDocument();
    expect(screen.getByText('Seq No')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders Actions column header', () => {
    setup();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders Edit and Delete buttons for each row', () => {
    setup();
    const editBtns = screen.getAllByRole('button', { name: /edit/i });
    const deleteBtns = screen.getAllByRole('button', { name: /delete/i });
    expect(editBtns.length).toBe(2);
    expect(deleteBtns.length).toBe(2);
  });

  it('shows empty state when no data', () => {
    setup({ items: [], totalCount: 0 });
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('shows page count info in footer', () => {
    setup();
    expect(screen.getByText(/Showing/)).toBeInTheDocument();
    expect(screen.getByText(/of 2/)).toBeInTheDocument();
  });

  it('renders pagination buttons when multiple pages', () => {
    setup({
      items: [
        {
          id: 1,
          floorCode: 'GF',
          description: 'तळमजला',
          descriptionEnglish: 'Ground Floor',
          fLatGenerationGroupId: 1,
          fLatGenerationSeq: 1,
          sequenceNo: 1,
          isActive: true,
          createdDate: '2024-01-01',
          updatedDate: null,
        },
      ],
      totalCount: 20,
      pageNumber: 2,
      pageSize: 10,
      totalPages: 2,
      hasPrevious: true,
      hasNext: false,
    });
    expect(screen.getByRole('button', { name: /Go to previous page/i })).toBeInTheDocument();
  });

  it('clicking Edit navigates to edit route', () => {
    const pushSpy = vi.fn();
    useRouterMock.mockReturnValue({
      push: pushSpy,
      refresh: vi.fn(),
    });

    setup();
    const editBtns = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editBtns[0]);
    // Edit navigates to edit page
    expect(pushSpy).toHaveBeenCalledWith(
      expect.stringContaining('/property-tax/floormaster/floor/edit/1')
    );
  });
});
