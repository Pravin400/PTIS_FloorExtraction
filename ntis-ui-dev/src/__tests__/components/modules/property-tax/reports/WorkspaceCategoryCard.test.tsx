import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryCard } from '@/components/modules/property-tax/reports/WorkspaceCategoryCard';
import type { Category } from '@/types/report.types';
import { Home } from 'lucide-react';

// Mock next/image
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const baseCategory: Category = {
  key: 'assessment',
  icon: Home,
  color: 'text-[#800000]',
  bgColor: 'bg-transparent',
  borderColor: 'border-[#800000]',
  glowClass: 'shadow-[#800000]/20',
  iconBg: 'bg-transparent',
};

const defaultProps = {
  category: baseCategory,
  label: 'Assessment',
  count: 5,
  reportsCountTemplate: '{count} reports',
  isSelected: false,
  onClick: vi.fn(),
};

// ===========================================================================
// Rendering
// ===========================================================================
describe('CategoryCard', () => {
  it('renders the label', () => {
    render(<CategoryCard {...defaultProps} />);
    expect(screen.getByText('Assessment')).toBeInTheDocument();
  });

  it('renders the module label with the larger font size', () => {
    render(<CategoryCard {...defaultProps} />);
    expect(screen.getByText('Assessment')).toHaveClass('text-sm');
  });

  it('renders the report count using the template', () => {
    render(<CategoryCard {...defaultProps} />);
    expect(screen.getByText('5 reports')).toBeInTheDocument();
  });

  it('renders 0 count correctly', () => {
    render(<CategoryCard {...defaultProps} count={0} />);
    expect(screen.getByText('0 reports')).toBeInTheDocument();
  });

  // ===========================================================================
  // Interaction
  // ===========================================================================
  it('calls onClick when the card is clicked', () => {
    const handleClick = vi.fn();
    render(<CategoryCard {...defaultProps} onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // ===========================================================================
  // Selected state
  // ===========================================================================
  it('applies border colour classes when selected', () => {
    const { container } = render(
      <CategoryCard {...defaultProps} isSelected={true} />
    );
    const btn = container.querySelector('button')!;
    expect(btn.className).toContain('border-[#800000]');
  });

  it('does not apply the selected glow class when not selected', () => {
    const { container } = render(
      <CategoryCard {...defaultProps} isSelected={false} />
    );
    const btn = container.querySelector('button')!;
    expect(btn.className).not.toContain('shadow-[#800000]/20');
  });

  it('shows a dot indicator when selected', () => {
    const { container } = render(
      <CategoryCard {...defaultProps} isSelected={true} />
    );
    // The dot is an absolutely positioned element
    const dot = container.querySelector('.absolute');
    expect(dot).not.toBeNull();
  });

  // ===========================================================================
  // Logo vs icon rendering
  // ===========================================================================
  it('renders a logo image when category has logoBase64', () => {
    const catWithLogo: Category = {
      ...baseCategory,
      logoBase64: 'abc123',
      logoContentType: 'image/png',
    };
    render(<CategoryCard {...defaultProps} category={catWithLogo} />);
    const img = screen.getByAltText('Assessment') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('data:image/png;base64,abc123');
  });

  it('renders the icon component when there is no logo', () => {
    const { container } = render(<CategoryCard {...defaultProps} />);
    // The mock icon renders an <svg> element
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });
});
