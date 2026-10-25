import { render, screen } from '@testing-library/react';
import { GeneralSection } from '@/components/modules/property-tax/dynamic-tax-register/settings/sections/GeneralSection';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('GeneralSection', () => {
  const genMock = {
    status: 'active',
    assessmentStatus: 'active',
    setAssessmentStatus: vi.fn(),
    oldTaxStatus: 'active',
    setOldTaxStatus: vi.fn(),
    ruleDefinitionId: '',
    taxName: '',
    setTaxName: vi.fn(),
    taxNameAlias: '',
    setTaxNameAlias: vi.fn(),
    taxCode: '',
    setTaxCode: vi.fn(),
    taxCategoryId: '',
    setTaxCategoryId: vi.fn(),
    ruleLabel: '',
    handleRuleDefinitionChange: vi.fn(),
    handleStatusChange: vi.fn(),
    handleConfigureClick: vi.fn(),
    handleManageRuleCategoryClick: vi.fn(),
  };

  it('renders general section form fields', () => {
    render(
      <GeneralSection
        isNew={true}
        taxRow={null}
        ruleOptions={[]}
        taxCategoryOptions={[]}
        general={genMock as unknown as Parameters<typeof GeneralSection>[0]['general']}
      />
    );
    expect(screen.getAllByText((content) => content.startsWith('general.taxName'))[0]).toBeInTheDocument();
  });
});
