import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Banner } from '@/components/layout/home/Banner';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'app.defaultUlbName': 'Default Municipality',
    };
    return translations[key] || key;
  },
}));

describe('Banner Component', () => {
  it('renders with provided ulbName', () => {
    render(<Banner ulbName="Test Municipality" />);
    expect(screen.getByText('Test Municipality')).toBeInTheDocument();
  });

  it('renders with default ulbName when not provided', () => {
    render(<Banner />);
    expect(screen.getByText('Default Municipality')).toBeInTheDocument();
  });

  it('displays the correct heading level', () => {
    render(<Banner ulbName="Test Municipality" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Test Municipality');
  });

  it('applies correct styling classes', () => {
    const { container } = render(<Banner ulbName="Test" />);
    const bannerDiv = container.querySelector('.bg-gradient-to-r');
    expect(bannerDiv).toBeInTheDocument();
    expect(bannerDiv).toHaveClass('from-blue-900', 'via-blue-800', 'to-teal-800');
  });

  it('renders responsive height classes', () => {
    const { container } = render(<Banner ulbName="Test" />);
    const bannerDiv = container.querySelector('.bg-gradient-to-r');
    expect(bannerDiv).toBeInTheDocument();
    expect(bannerDiv).toHaveClass('h-[120px]', 'sm:h-[165px]', 'md:h-[200px]', 'lg:h-[220px]');
  });

  it('renders heading with white text and proper styling', () => {
    render(<Banner ulbName="Test Municipality" />);
    const heading = screen.getByRole('heading');
    expect(heading).toHaveClass('text-white', 'font-bold', 'text-center');
  });
});
