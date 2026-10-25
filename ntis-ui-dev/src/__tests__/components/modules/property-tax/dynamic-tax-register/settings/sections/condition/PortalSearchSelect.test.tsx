import { render, screen, fireEvent } from '@testing-library/react';
import { PortalSearchSelect } from '@/components/modules/property-tax/dynamic-tax-register/settings/sections/condition/PortalSearchSelect';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('PortalSearchSelect', () => {
  const options = [
    { label: 'Item 1', value: 'v1' },
    { label: 'Item 2', value: 'v2' },
  ];
  const props = {
    options,
    value: '',
    onChange: vi.fn(),
    placeholder: 'Search item',
  };

  it('renders input trigger', () => {
    render(<PortalSearchSelect {...props} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('opens panel on input focus', () => {
    render(<PortalSearchSelect {...props} />);
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
});
