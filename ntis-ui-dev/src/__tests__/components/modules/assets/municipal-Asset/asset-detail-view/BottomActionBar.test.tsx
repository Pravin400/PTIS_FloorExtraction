import { render, screen } from '@testing-library/react';
import { BottomActionBar } from '@/components/modules/assets/municipal-Asset/asset-detail-view/BottomActionBar';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ locale: 'en' }),
  usePathname: () => '/path'
}));

describe('BottomActionBar', () => {
  it('renders correctly', () => {
    render(<BottomActionBar />);
    // Just checking that it renders without throwing
    expect(screen.getByRole('button', { name: /editLabel/i })).toBeInTheDocument();
  });
});
