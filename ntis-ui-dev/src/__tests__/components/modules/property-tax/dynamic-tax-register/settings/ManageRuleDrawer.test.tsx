import { render, screen } from '@testing-library/react';
import ManageRuleDrawer from '@/components/modules/property-tax/dynamic-tax-register/settings/ManageRuleDrawer';

vi.mock('next-intl', () => {
  const t = (key: string) => key;
  t.rich = (key: string) => key;
  return {
    useTranslations: () => t,
  };
});

vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: () => vi.fn(() => Promise.resolve(true)),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/property-tax/dynamic-tax-register/manageRule',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: 'en' }),
}));

describe('ManageRuleDrawer', () => {
  const props: Parameters<typeof ManageRuleDrawer>[0] = {
    initialRules: [],
    usedRuleIds: [],
    calculationModes: [],
  };

  it('renders drawer with correct title', () => {
    render(<ManageRuleDrawer {...props} />);
    expect(screen.getByText('manageRule.title')).toBeInTheDocument();
  });
});
