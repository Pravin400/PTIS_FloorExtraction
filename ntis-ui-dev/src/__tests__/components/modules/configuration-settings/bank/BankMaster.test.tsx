import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BankMaster } from '@/components/modules/configuration-settings/bank/BankMaster';
import type { BankMasterData } from '@/types/bank-master.types';
import * as bankActions from '@/app/[locale]/configuration-settings/bank-master/actions';
import { toast } from 'sonner';
import { AliasLabelsProvider } from '@/lib/providers/AliasLabelsProvider';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockPermissions = {
  canView: true,
  canEdit: true,
  canDelete: true,
  haveFullAccess: true,
  hasAccess: true,
};

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => mockPermissions,
}));

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => '/en/configuration-settings/bank-master',
  useSearchParams: () => new URLSearchParams(''),
}));

vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: () => ({
    confirm: vi.fn().mockImplementation(async (options) => {
      if (options.onConfirm) {
        await options.onConfirm();
      }

      return true;
    }),
  }),
}));

vi.mock('@/app/[locale]/configuration-settings/bank-master/actions', () => ({
  createBankAction: vi.fn(),
  updateBankAction: vi.fn(),
  deleteBankAction: vi.fn(),
}));

const mockBanks: BankMasterData[] = [
  {
    id: '1',
    bankCode: 'SBI001',
    bankName: 'State Bank of India',
    branchName: 'Main Branch',
    ifscCode: 'SBIN0000001',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    address: 'MG Road, Mumbai',
    isActive: true,
  },
];

const defaultProps = {
  data: mockBanks,
  statsData: { activeCount: 1, uniqueStates: ['Maharashtra'] },
  pageNumber: 1,
  pageSize: 10,
  totalCount: 1,
  totalPages: 1,
};

describe('BankMaster', () => {
  let user: ReturnType<typeof userEvent.setup>;

  const renderComponent = () => render(<BankMaster {...defaultProps} />);

  beforeEach(() => {
    vi.clearAllMocks();

    user = userEvent.setup();

    mockPermissions.canView = true;
    mockPermissions.canEdit = true;
    mockPermissions.canDelete = true;
    mockPermissions.haveFullAccess = true;
    mockPermissions.hasAccess = true;

    vi.mocked(bankActions.createBankAction).mockReset();
    vi.mocked(bankActions.updateBankAction).mockReset();
    vi.mocked(bankActions.deleteBankAction).mockReset();

    vi.mocked(bankActions.createBankAction).mockResolvedValue({ success: true });
    vi.mocked(bankActions.updateBankAction).mockResolvedValue({ success: true });
    vi.mocked(bankActions.deleteBankAction).mockResolvedValue({ success: true });

    mockPush.mockReset();
    mockRefresh.mockReset();

    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the header and stats correctly', () => {
    renderComponent();

    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('stats.totalBanks')).toBeInTheDocument();
    expect(screen.getByTestId('stat-value-total-banks')).toHaveTextContent('1');
    expect(screen.getByText('stats.active')).toBeInTheDocument();
    expect(screen.getByTestId('stat-value-active-banks')).toHaveTextContent('1');
    expect(screen.getByText('stats.states')).toBeInTheDocument();
    expect(screen.getByTestId('stat-value-states-count')).toHaveTextContent('1');
  });

  it('renders the bank table with data', () => {
    renderComponent();

    expect(screen.getByText('State Bank of India')).toBeInTheDocument();
    expect(screen.getByText('SBI001')).toBeInTheDocument();
    expect(screen.getByText('SBIN0000001')).toBeInTheDocument();
  });

  it('navigates to add page when Add Bank is clicked', async () => {
    renderComponent();

    const addButton = screen.getByText('addBank').closest('button');

    expect(addButton).toBeInTheDocument();

    await user.click(addButton!);

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/add'));
  });

  it('updates the URL when search term changes', () => {
    vi.useFakeTimers();

    renderComponent();

    const searchInput = screen.getByPlaceholderText('filters.searchPlaceholder');

    fireEvent.change(searchInput, {
      target: {
        value: 'HDFC',
      },
    });

    expect(mockPush).not.toHaveBeenCalledWith(expect.stringContaining('search=HDFC'));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('search=HDFC'));
  });

  it('handles delete bank success', async () => {
    renderComponent();

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });

    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(bankActions.deleteBankAction).toHaveBeenCalledWith('1');
      expect(toast.success).toHaveBeenCalledWith('messages.deleteSuccess');
    });
  });

  it('renders custom aliases when wrapped in AliasLabelsProvider', () => {
    const customLabels = {
      Bank: 'Treasury',
      Bank_Code: 'Treasury Code',
      Bank_Name: 'Treasury Name',
      Branch_Name: 'Sub-Division',
      IFSC_Code: 'Routing Code',
      State: 'Province',
    };

    render(
      <AliasLabelsProvider labels={customLabels}>
        <BankMaster {...defaultProps} />
      </AliasLabelsProvider>
    );

    expect(screen.getByText('Treasury Code')).toBeInTheDocument();
    expect(screen.getByText('Treasury Name & Sub-Division')).toBeInTheDocument();
    expect(screen.getByText('Routing Code')).toBeInTheDocument();
  });
});
