import { vi } from 'vitest';

// Mock next/navigation
export const nextNavMocks = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => nextNavMocks),
  usePathname: vi.fn(() => '/en/configuration-settings/department-master'),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(),
    toString: vi.fn(() => ''),
    forEach: vi.fn(),
  })),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
  useLocale: vi.fn(() => 'en'),
}));

// Mock sonner toast
export const mockToastSuccess = vi.fn();
export const mockToastError = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
  },
}));

// Mock useConfirm
export const mockConfirm = vi.fn().mockImplementation(async (options) => {
    if (options.onConfirm) {
        await options.onConfirm();
    }
    return true;
});

vi.mock('@/components/common', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return {
        ...actual,
        useConfirm: () => ({ confirm: mockConfirm }),
    };
});

// Mock actions
vi.mock('@/app/[locale]/configuration-settings/department-master/action', () => ({
    saveDepartmentMasterAction: vi.fn().mockResolvedValue({ success: true, message: 'success.created' }),
    deleteDepartmentAction: vi.fn().mockResolvedValue({ success: true }),
}));
