import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Building2 } from 'lucide-react';
import { RevenueSummaryCard } from '@/components/modules/assets/dashboard/revenue-dashboard/RevenueDashboardCards';

// Mock format utils if they were needed, but RevenueSummaryCard just accepts string/number values.
describe('RevenueDashboardCards', () => {
  describe('RevenueSummaryCard', () => {
    it('renders the card with correct title, subtitle, and value', () => {
      render(
        <RevenueSummaryCard
          icon={Building2}
          value="450"
          title="Total Properties"
          subtitle="All active properties"
          className="test-class"
        />
      );

      // Verify textual content
      expect(screen.getByText('450')).toBeInTheDocument();
      expect(screen.getByText('Total Properties')).toBeInTheDocument();
      expect(screen.getByText('All active properties')).toBeInTheDocument();
    });

    it('renders the SVG icon component', () => {
      const { container } = render(
        <RevenueSummaryCard
          icon={Building2}
          value="10"
          title="Icon Test"
          subtitle="Subtitle"
        />
      );

      // lucide-react generates svg elements
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('w-7 h-7');
    });

    it('appends custom classNames to the root card correctly', () => {
      const { container } = render(
        <RevenueSummaryCard
          icon={Building2}
          value="0"
          title="Style Test"
          subtitle="Subtitle"
          className="bg-red-500 custom-test"
        />
      );

      const firstChild = container.firstChild as HTMLElement;
      expect(firstChild).toHaveClass('bg-red-500');
      expect(firstChild).toHaveClass('custom-test');
    });
  });
});
