import { vi } from 'vitest';
import type React from 'react';

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
  usePathname: vi.fn(() => '/en/configuration-settings/config-master'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string, values?: Record<string, unknown>) => {
    if (values && Object.keys(values).length > 0) {
      return `${key} ${JSON.stringify(values)}`;
    }
    return key;
  }),
  useLocale: vi.fn(() => 'en'),
}));

// Mock next-intl/server
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string, values?: Record<string, unknown>) => {
    if (values && Object.keys(values).length > 0) {
      return `${key} ${JSON.stringify(values)}`;
    }
    return key;
  }),
  getLocale: vi.fn(async () => 'en'),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock toast functions
export const mockToastSuccess = vi.fn();
export const mockToastError = vi.fn();

// Create exportable mock functions
export const mockVerifySession = vi.fn(async () => 1);
export const mockGetLocaleFromHeaders = vi.fn(async () => 'en');

// Mock action utils
vi.mock('@/app/[locale]/configuration-settings/config-master/actions/utils', () => ({
  verifySession: mockVerifySession,
  getLocaleFromHeaders: mockGetLocaleFromHeaders,
  tConfigMessage: vi.fn(async (_key: string, fallback: string) => fallback),
  localizeConfigError: vi.fn(async (err: unknown) => err instanceof Error ? err.message : String(err)),
  localizeBackendMessage: vi.fn(async (msg: string | null | undefined, _fallbackKey: string, fallbackDefault: string) => msg || fallbackDefault),
  MAX_CONCURRENT_UPDATES: 10,
  processBatch: async <T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    _concurrency: number
  ): Promise<R[]> => Promise.all(items.map(processor)),
}));

type DrawerProps = { children: React.ReactNode; open: boolean; footer?: React.ReactNode; title?: string };
type ToggleSwitchProps = { checked: boolean; onChange: (value: boolean) => void; disabled?: boolean };
type ButtonProps = { children: React.ReactNode; onClick?: () => void; disabled?: boolean; isLoading?: boolean; icon?: React.ComponentType };
type SelectProps = { id: string; label?: string; value: string; onChange: (name: string, value: string) => void; disabled?: boolean; placeholder?: string; options?: Array<{ value: string; label: string }> };

// Mock common components
export const mockConfirm = vi.fn();
vi.mock('@/components/common', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useConfirm: () => ({ confirm: mockConfirm }),
    useToast: () => ({
      success: mockToastSuccess,
      error: mockToastError,
    }),
    Drawer: ({ children, open, footer, title }: DrawerProps) => 
      open ? (
        <div data-testid="drawer">
          <div data-testid="drawer-title">{title}</div>
          {children}
          <div data-testid="drawer-footer">{footer}</div>
        </div>
      ) : null,
    ToggleSwitch: ({ checked, onChange, disabled }: ToggleSwitchProps) => (
      <button 
        role="switch" 
        aria-checked={checked} 
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        {checked ? 'On' : 'Off'}
      </button>
    ),
    Button: ({ children, onClick, disabled, isLoading, icon: Icon }: ButtonProps) => {
      let show = true;
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useActivePagePermissions } = require('@/hooks/useActivePagePermissions');
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const perms = useActivePagePermissions();
        // Check if Icon is Plus (either by function identity or name)
        const isPlus = Icon && (Icon.name === 'Plus' || Icon.displayName === 'Plus');
        if (isPlus && !perms.haveFullAccess) {
          show = false;
        }
      } catch {}

      if (!show) return null;

      return (
        <button onClick={onClick} disabled={disabled || isLoading}>
          {Icon && <Icon data-testid="btn-icon" />}
          {children}
        </button>
      );
    },
    Select: (props: SelectProps) => (
      <div className="relative">
        <label htmlFor={props.id}>{props.label}</label>
        <select 
          id={props.id} 
          value={props.value || ''} 
          onChange={(e) => props.onChange(e.target.value, e.target.value)}
          disabled={props.disabled}
        >
          <option value="">{props.placeholder}</option>
          {props.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    )
  };
});
