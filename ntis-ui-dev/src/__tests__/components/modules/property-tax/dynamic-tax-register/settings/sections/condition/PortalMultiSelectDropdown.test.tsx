import { render, screen, fireEvent } from '@testing-library/react';
import { PortalMultiSelectDropdown } from '@/components/modules/property-tax/dynamic-tax-register/settings/sections/condition/PortalMultiSelectDropdown';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('PortalMultiSelectDropdown', () => {
  const options = [
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' },
  ];
  const props = {
    options,
    value: [],
    onChange: vi.fn(),
    placeholder: 'Select items',
  };

  it('renders trigger with placeholder', () => {
    render(<PortalMultiSelectDropdown {...props} />);
    expect(screen.getByRole('button')).toHaveTextContent('Select items');
  });

  it('opens portal panel on click', () => {
    render(<PortalMultiSelectDropdown {...props} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('multiSelect.selectAll')).toBeInTheDocument();
  });
});
