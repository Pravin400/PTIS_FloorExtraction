import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ModuleMaster } from '@/components/modules/configuration-settings/module-master/ModuleMaster';
import type { ModuleMaster as ModuleMasterType } from '@/types/moduleMaster.types';
import * as moduleActions from '@/app/[locale]/configuration-settings/module-master/actions';
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
  useActivePagePermissions: () => mockPermissions,
}));

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => '/en/configuration-settings/module-master',
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

vi.mock('@/app/[locale]/configuration-settings/module-master/actions', () => ({
  createModuleMasterAction: vi.fn(),
  updateModuleMasterAction: vi.fn(),
  deleteModuleMasterAction: vi.fn(),
}));

const mockModules: ModuleMasterType[] = [
  {
    moduleId: 1,
    departmentId: 10,
    moduleCode: 'MOD001',
    moduleName: 'Admin Settings',
    moduleNameLocal: 'एडमिन सेटिंग्स',
    moduleIcon: 'settings',
    moduleLabel: 'Admin',
    moduleDescription: 'Admin configuration settings',
    departmentName: 'IT Department',
    isActive: true,
  },
];

const defaultProps = {
  data: mockModules,
  statsData: { totalCount: 1, activeCount: 1, inactiveCount: 0 },
  pageNumber: 1,
  pageSize: 10,
  totalCount: 1,
  totalPages: 1,
};

describe('ModuleMaster', () => {
  let user: ReturnType<typeof userEvent.setup>;

  const renderComponent = () => render(<ModuleMaster {...defaultProps} />);

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();

    mockPermissions.canView = true;
    mockPermissions.canEdit = true;
    mockPermissions.canDelete = true;
    mockPermissions.haveFullAccess = true;
    mockPermissions.hasAccess = true;

    vi.mocked(moduleActions.createModuleMasterAction).mockReset();
    vi.mocked(moduleActions.updateModuleMasterAction).mockReset();
    vi.mocked(moduleActions.deleteModuleMasterAction).mockReset();

    vi.mocked(moduleActions.createModuleMasterAction).mockResolvedValue({ success: true });
    vi.mocked(moduleActions.updateModuleMasterAction).mockResolvedValue({ success: true });
    vi.mocked(moduleActions.deleteModuleMasterAction).mockResolvedValue({ success: true });

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
    expect(screen.getByText('stats.totalModules')).toBeInTheDocument();
    expect(screen.getByTestId('stat-value-total-modules')).toHaveTextContent('1');
    expect(screen.getByText('stats.active')).toBeInTheDocument();
    expect(screen.getByTestId('stat-value-active-modules')).toHaveTextContent('1');
    expect(screen.getByText('stats.inactive')).toBeInTheDocument();
    expect(screen.getByTestId('stat-value-inactive-modules')).toHaveTextContent('0');
  });

  it('renders the module table with data', () => {
    renderComponent();

    expect(screen.getByText('Admin Settings')).toBeInTheDocument();
    expect(screen.getByText('MOD001')).toBeInTheDocument();
    expect(screen.getByText('IT Department')).toBeInTheDocument();
  });

  it('navigates to add page when Add Module is clicked', async () => {
    renderComponent();

    const addButton = screen.getByText('addLabel').closest('button');
    expect(addButton).toBeInTheDocument();

    await user.click(addButton!);
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/add'));
  });

  it('updates the URL when search term changes', () => {
    vi.useFakeTimers();
    renderComponent();

    const searchInput = screen.getByPlaceholderText('filters.searchPlaceholder');
    fireEvent.change(searchInput, {
      target: { value: 'Billing' },
    });

    expect(mockPush).not.toHaveBeenCalledWith(expect.stringContaining('search=Billing'));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('search=Billing'));
  });

  it('handles delete module success', async () => {
    renderComponent();

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(moduleActions.deleteModuleMasterAction).toHaveBeenCalledWith(1);
      expect(toast.success).toHaveBeenCalledWith('messages.deleteSuccess');
    });
  });

  it('renders fetchError alert when fetchError is provided', () => {
    render(
      <ModuleMaster
        data={[]}
        statsData={{ totalCount: 0, activeCount: 0, inactiveCount: 0 }}
        pageNumber={1}
        pageSize={10}
        totalCount={0}
        totalPages={0}
        fetchError="Database connection refused"
      />
    );

    expect(screen.getByText('messages.fetchFailed')).toBeInTheDocument();
    expect(screen.getByText('Database connection refused')).toBeInTheDocument();
  });

  it('renders custom aliases when wrapped in AliasLabelsProvider', () => {
    const customLabels = {
      Module: 'Sub-System',
      Department: 'Agency',
      Module_Code: 'Sub-System Code',
      Module_Name: 'Sub-System Name',
      Local_Name: 'Native Name',
      Description: 'Summary Details',
    };

    render(
      <AliasLabelsProvider labels={customLabels}>
        <ModuleMaster {...defaultProps} />
      </AliasLabelsProvider>
    );

    expect(screen.getByText('Sub-System Code')).toBeInTheDocument();
    expect(screen.getByText('Sub-System Name & Agency')).toBeInTheDocument();
    expect(screen.getByText('Native Name')).toBeInTheDocument();
    expect(screen.getByText('Summary Details')).toBeInTheDocument();
  });
});
