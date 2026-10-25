import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DemandCollectionSummarySection } from '@/components/modules/assets/revenue/payment/DemandCollectionSummarySection';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('DemandCollectionSummarySection', () => {
  it('renders collection summary breakdown correctly', () => {
    render(
      <DemandCollectionSummarySection
        hasSearched={true}
        demandSummary={{
          pendingDemand: 5000,
          pendingPaid: 0,
          pendingOutstanding: 5000,
          currentDemand: 900,
          currentPaid: 0,
          currentPending: 900,
          totalOutstanding: 5900,
          totalOverdue: 5000,
          totalCurrentDue: 900,
          demands: [],
        }}
      />
    );

    expect(screen.getByText('v2.demandCollectionSummary')).toBeDefined();
  });
});
