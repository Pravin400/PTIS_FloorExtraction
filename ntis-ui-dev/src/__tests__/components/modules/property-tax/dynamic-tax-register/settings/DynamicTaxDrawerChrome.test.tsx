import { render, screen } from '@testing-library/react';
import { DynamicTaxDrawerTitle, DynamicTaxDrawerFooter } from '@/components/modules/property-tax/dynamic-tax-register/settings/DynamicTaxDrawerChrome';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('DynamicTaxDrawerChrome', () => {
  it('renders title component correctly', () => {
    render(
      <DynamicTaxDrawerTitle
        isNew={true}
        taxName="New Tax"
        taxRow={null}
        taxCode="TAX1"
        ruleLabel="Condition Based"
      />
    );
    expect(screen.getByText('New Tax')).toBeInTheDocument();
  });

  it('renders footer component correctly', () => {
    render(
      <DynamicTaxDrawerFooter
        isNew={true}
        savingSettings={false}
        handleClose={vi.fn()}
        handleSaveSettings={vi.fn()}
        selectedCategory="Field"
        routeBase="/test"
        numericId={0}
        startTransition={vi.fn()}
        router={{ push: vi.fn() }}
      />
    );
    expect(screen.getByText('drawer.savingHint')).toBeInTheDocument();
  });
});
