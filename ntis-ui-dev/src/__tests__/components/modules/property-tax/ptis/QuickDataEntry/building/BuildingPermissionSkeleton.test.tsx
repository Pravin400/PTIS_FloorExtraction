import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BuildingPermissionSkeleton } from '@/components/modules/property-tax/ptis/QuickDataEntry/building/BuildingPermissionSkeleton';

describe('BuildingPermissionSkeleton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with accessibility label and animation class', () => {
    render(<BuildingPermissionSkeleton />);
    const container = screen.getByLabelText('Loading building permissions');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('animate-pulse');
  });

  it('renders grid with left sidebar and right detail pane placeholders', () => {
    const { container } = render(<BuildingPermissionSkeleton />);
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(container.querySelector('.lg\\:col-span-4')).toBeInTheDocument();
    expect(container.querySelector('.lg\\:col-span-8')).toBeInTheDocument();
  });
});
