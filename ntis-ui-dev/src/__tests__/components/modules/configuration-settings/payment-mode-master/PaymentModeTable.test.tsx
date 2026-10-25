import { vi } from 'vitest';

// Mock Next.js and server-only modules before any other imports
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
  }),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { PaymentModeTable } from '@/components/modules/configuration-settings/payment-mode-master/PaymentModeTable';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '@/i18n/locales/en/paymentModeMaster.json';
import commonMessages from '@/i18n/locales/en/common.json';

// Mock next/navigation
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  usePathname: () => '/en/configuration-settings/payment-mode-master',
}));

// Mock PaymentModeRowActions to avoid server-side imports
vi.mock('@/components/modules/configuration-settings/payment-mode-master/PaymentModeRowActions', () => ({
  PaymentModeRowActions: () => <div data-testid="row-actions" />,
}));

const mockData = [
  {
    id: 1,
    code: 'CASH',
    paymentModeName: 'Cash Payment',
    type: 'Offline',
    category: 'Cash',
    description: 'Physical cash collection',
    chargeType: 'None',
    transactionCharge: 0,
    isActive: true,
    createdDate: '2026-01-01T00:00:00Z',
    updatedDate: '2026-01-01T00:00:00Z',
    createdBy: 1,
    updatedBy: 1,
  },
  {
    id: 2,
    code: 'ONLINE',
    paymentModeName: 'Credit Card',
    type: 'Online',
    category: 'Card',
    description: 'Online card payment',
    chargeType: 'Percentage',
    transactionCharge: 2.5,
    isActive: true,
    createdDate: '2026-01-01T00:00:00Z',
    updatedDate: '2026-01-01T00:00:00Z',
    createdBy: 1,
    updatedBy: 1,
  },
];

const renderWithIntl = (ui: React.ReactElement) => {
  return render(
    <NextIntlClientProvider 
      locale="en" 
      messages={{ 
        paymentModeMaster: enMessages as Record<string, unknown>,
        common: commonMessages as Record<string, unknown>
      }}
    >
      {ui}
    </NextIntlClientProvider>
  );
};

describe('PaymentModeTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with multiple rows of data', () => {
    renderWithIntl(
      <PaymentModeTable 
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={2}
        totalPages={1}
        searchTerm=""
      />
    );

    // Check if table headers are present (from columns config)
    expect(screen.getByText(enMessages.table.code)).toBeInTheDocument();
    expect(screen.getByText(enMessages.table.name)).toBeInTheDocument();

    // Check if data rows are rendered
    expect(screen.getByText('CASH')).toBeInTheDocument();
    expect(screen.getByText('Cash Payment')).toBeInTheDocument();
    expect(screen.getByText('ONLINE')).toBeInTheDocument();
    expect(screen.getByText('Credit Card')).toBeInTheDocument();
  });

  it('handles search input changes by updating URL params', async () => {
    renderWithIntl(
      <PaymentModeTable 
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={2}
        totalPages={1}
        searchTerm=""
      />
    );

    const searchInput = screen.getByPlaceholderText(enMessages.searchPlaceholder);
    fireEvent.change(searchInput, { target: { value: 'Online' } });

    // Wait for debounced router.push to be called (500ms debounce)
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('search=Online'));
      expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('page=1'));
    }, { timeout: 1000 });
  });

  it('handles page size changes correctly', async () => {
    renderWithIntl(
      <PaymentModeTable 
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={2}
        totalPages={1}
        searchTerm=""
      />
    );

    // Find the select element for page size by its data-testid
    const user = userEvent.setup();
    const pageSizeSelect = screen.getByTestId('page-size-select');
    
    // Change the value to 20
    await user.selectOptions(pageSizeSelect, '20');

    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('pageSize=20'));
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('page=1'));
  });

  it('displays correct "Showing X to Y of Z" text', () => {
    renderWithIntl(
      <PaymentModeTable 
        data={mockData}
        pageNumber={1}
        pageSize={10}
        totalCount={25}
        totalPages={3}
        searchTerm=""
      />
    );

    // The new structure uses commonT.rich("table.paginationFooter")
    expect(screen.getByText(/Showing 1/i)).toBeInTheDocument();
    expect(screen.getByText(/of 25 entries/i)).toBeInTheDocument();
  });

  it('renders "No data" state when data array is empty', () => {
    renderWithIntl(
      <PaymentModeTable 
        data={[]}
        pageNumber={1}
        pageSize={10}
        totalCount={0}
        totalPages={0}
        searchTerm=""
      />
    );

    // The component is now passed enMessages.noDataFound as the emptyText prop
    expect(screen.getByText(enMessages.noDataFound)).toBeInTheDocument();
  });
});
