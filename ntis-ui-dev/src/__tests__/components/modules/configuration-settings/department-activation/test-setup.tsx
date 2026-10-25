import { vi } from 'vitest';

// Mock next/navigation
export const mockNextNav = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => mockNextNav),
  usePathname: vi.fn(() => '/en/configuration-settings/department-activation'),
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
export const mockToastWarning = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
    warning: (msg: string) => mockToastWarning(msg),
  },
}));

vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: vi.fn(() => ({
    confirm: vi.fn(({ onConfirm }: { onConfirm?: () => void }) => onConfirm?.()),
  })),
}));

// Mock actions
vi.mock('@/app/[locale]/configuration-settings/department-activation/action', () => ({
    updateDepartmentStatusAction: vi.fn().mockResolvedValue({ success: true }),
    updateModuleStatusAction: vi.fn().mockResolvedValue({ success: true }),
    bulkUpdateDepartmentStatusAction: vi.fn().mockResolvedValue({ success: true }),
}));
