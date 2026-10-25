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

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import type { PaymentMode } from "@/types/paymentMode.types";
import PaymentModeForm from '@/components/modules/configuration-settings/payment-mode-master/PaymentModeForm';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '@/i18n/locales/en/paymentModeMaster.json';
import commonMessages from '@/i18n/locales/en/common.json';

// Mock server actions
const mockSaveAction = vi.fn();
vi.mock('@/app/[locale]/configuration-settings/payment-mode-master/actions', () => ({
  savePaymentModeMasterAction: (formData: FormData) => mockSaveAction(formData),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/en/configuration-settings/payment-mode-master',
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

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

describe('PaymentModeForm', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    editingMode: null,
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Add New Payment Mode" title when in add mode', () => {
    renderWithIntl(<PaymentModeForm {...defaultProps} />);
    expect(screen.getByText(enMessages.form.title.add)).toBeInTheDocument();
  }, 15000);

  it('renders "Edit Payment Mode" title when editingMode is provided', () => {
    const editingMode = {
      id: 1,
      code: 'TEST',
      paymentModeName: 'Test Mode',
      type: 'Online',
      category: 'Test',
      description: 'Test description',
      chargeType: 'None',
      transactionCharge: 0,
      isActive: true,
    };
    renderWithIntl(<PaymentModeForm {...defaultProps} editingMode={editingMode as PaymentMode} />);
    expect(screen.getByText(enMessages.form.title.edit)).toBeInTheDocument();
  }, 15000);

  it('validates required fields on submit', async () => {
    renderWithIntl(<PaymentModeForm {...defaultProps} />);
    
    // Trigger submit directly on the form to avoid JSDOM button[form] issues
    fireEvent.submit(screen.getByTestId('payment-mode-form'));

    await waitFor(() => {
      expect(screen.getByText(enMessages.form.validation.codeRequired)).toBeInTheDocument();
      expect(screen.getByText(enMessages.form.validation.nameRequired)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    expect(mockSaveAction).not.toHaveBeenCalled();
  }, 15000);

  it('successfully submits the form when valid', async () => {
    mockSaveAction.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    
    renderWithIntl(<PaymentModeForm {...defaultProps} />);

    // Fill the form
    await user.type(screen.getByLabelText(/Mode Code/i), 'NETBNK');
    await user.type(screen.getByLabelText(/Mode Name/i), 'Net Banking');
    
    // Trigger submit
    fireEvent.submit(screen.getByTestId('payment-mode-form'));

    await waitFor(() => {
      expect(mockSaveAction).toHaveBeenCalled();
    }, { timeout: 2000 });
    
    await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalled();
        expect(defaultProps.onClose).toHaveBeenCalled();
    }, { timeout: 2000 });
  }, 15000);

  it('handles API errors during submission', async () => {
    mockSaveAction.mockResolvedValue({ success: false, error: 'Server validation failed' });
    const user = userEvent.setup();
    
    renderWithIntl(<PaymentModeForm {...defaultProps} />);

    // Fill the form
    await user.type(screen.getByLabelText(/Mode Code/i), 'ERROR');
    await user.type(screen.getByLabelText(/Mode Name/i), 'Error Mode');
    
    fireEvent.submit(screen.getByTestId('payment-mode-form'));

    await waitFor(() => {
      expect(mockSaveAction).toHaveBeenCalled();
    });

    // In usePaymentModeForm, errors from action are toasted
    const { toast } = await import('sonner');
    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Server validation failed');
    });
  }, 15000);
});
