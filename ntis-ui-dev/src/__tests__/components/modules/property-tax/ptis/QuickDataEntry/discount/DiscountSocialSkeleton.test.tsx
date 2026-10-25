import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DiscountSocialSkeleton } from '@/components/modules/property-tax/ptis/QuickDataEntry/discount/DiscountSocialSkeleton';

describe('DiscountSocialSkeleton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with accessibility label and animation class', () => {
    render(<DiscountSocialSkeleton />);
    const container = screen.getByLabelText('Loading discount and social details');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('animate-pulse');
  });

  it('renders grid with left sidebar and right detail pane placeholders', () => {
    const { container } = render(<DiscountSocialSkeleton />);
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(container.querySelector('.lg\\:col-span-4')).toBeInTheDocument();
    expect(container.querySelector('.lg\\:col-span-8')).toBeInTheDocument();
  });
});
