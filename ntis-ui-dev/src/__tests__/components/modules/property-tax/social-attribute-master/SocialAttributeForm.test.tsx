import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRouter } from 'next/navigation';
import { useConfirm } from '@/components/common/ConfirmProvider';
import SocialAttributeForm from '@/components/modules/property-tax/social-attribute-master/SocialAttributeForm';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(() => ''),
  })),
  redirect: vi.fn(),
}));

vi.mock('next-intl', () => {
  return {
    useTranslations: vi.fn((ns?: string) => {
      const t = (key: string, values?: Record<string, string>) => {
        let result = ns ? `${ns}.${key}` : key;
        if (values) {
          Object.entries(values).forEach(([k, v]) => {
            result = result.replace(`{${k}}`, v);
          });
        }
        return result;
      };
      return t;
    }),
    useLocale: vi.fn(() => 'en'),
  };
});

vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: vi.fn(() => ({ confirm: vi.fn() })),
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const mockRouterPush = vi.fn();
const mockRouterReplace = vi.fn();
const mockRouterRefresh = vi.fn();
vi.mocked(useRouter).mockImplementation(() => ({
  push: mockRouterPush,
  refresh: mockRouterRefresh,
  back: vi.fn(),
  forward: vi.fn(),
  replace: mockRouterReplace,
  prefetch: vi.fn(),
} as unknown as ReturnType<typeof useRouter>));

describe('SocialAttributeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders fields correctly', () => {
    render(<SocialAttributeForm id={null} />);
    expect(document.getElementById('form')).toBeInTheDocument();
  });

  it('calls confirm dialog on cancel if form is dirty', () => {
    const confirmMock = vi.fn();
    vi.mocked(useConfirm).mockImplementation(() => ({ confirm: confirmMock }));

    render(<SocialAttributeForm id={null} />);

    // Change input value to make the form dirty
    const codeInput = screen.getByLabelText(
      /socialAttribute.form.fields.socialAttributeCode.label/i
    );
    fireEvent.change(codeInput, { target: { value: 'NEW_CODE' } });

    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: 'common.buttons.cancel' });
    fireEvent.click(cancelButton);

    expect(confirmMock).toHaveBeenCalled();
  });

  it('does not call confirm dialog on cancel if form is clean', () => {
    const confirmMock = vi.fn();
    vi.mocked(useConfirm).mockImplementation(() => ({ confirm: confirmMock }));

    render(<SocialAttributeForm id={null} />);

    // Click cancel button without making changes
    const cancelButton = screen.getByRole('button', { name: 'common.buttons.cancel' });
    fireEvent.click(cancelButton);

    expect(confirmMock).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(mockRouterPush).toHaveBeenCalledWith('/en/property-tax/social-attribute-master');
  });
});
