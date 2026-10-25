import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/modules/property-tax/reports/WorkspaceEmptyState';

describe('EmptyState', () => {
  it('renders the title text', () => {
    render(<EmptyState title="No data" subtitle="Please try again" />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('renders the subtitle text', () => {
    render(<EmptyState title="No data" subtitle="Please try again" />);
    expect(screen.getByText('Please try again')).toBeInTheDocument();
  });

  it('applies centered layout classes', () => {
    const { container } = render(<EmptyState title="Title" subtitle="Sub" />);
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain('flex');
    expect(wrapper.className).toContain('items-center');
    expect(wrapper.className).toContain('justify-center');
  });
});
