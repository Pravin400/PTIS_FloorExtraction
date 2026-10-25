/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TaxZoningUpdateFormWrapper from '@/components/modules/property-tax/taxZoningmasterNew/TaxZoningUpdateFormWrapper';

const pushMock = vi.fn();
const replaceMock = vi.fn();
const backMock = vi.fn();
let searchParamsString = '';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock, back: backMock, refresh: vi.fn() }),
  usePathname: () => '/property-tax/taxzoningmaster/0',
  useSearchParams: () => new URLSearchParams(searchParamsString),
  useParams: () => ({ locale: 'en' }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/common/Drawer', () => ({
  Drawer: ({ open, title, footer, children, onClose }: any) => (open ? (
    <div data-testid="drawer">
      <div data-testid="drawer-title">{title}</div>
      <div data-testid="drawer-body">{children}</div>
      <div data-testid="drawer-footer">{footer}</div>
      <button data-testid="drawer-close" onClick={onClose}>Close</button>
    </div>
  ) : null),
}));

vi.mock('@/components/common/ActionButtons', () => ({
  ClearButton: ({ label, onClick, ...p }: any) => <button data-testid="clear-btn" onClick={onClick} {...p}>{label}</button>,
  SaveButton: ({ label, disabled, ...p }: any) => <button data-testid="save-btn" disabled={disabled} {...p}>{label}</button>,
}));

let capturedProps: any = null;
vi.mock('@/components/modules/property-tax/taxZoningmasterNew/TaxZoningUpdateForm', () => ({
  default: (props: any) => {
    capturedProps = props;
    return (
      <form id="tax-zoning-form" data-testid="child-form" onSubmit={props.onSubmit}>
        <button type="submit" data-testid="child-submit">Submit</button>
      </form>
    );
  },
}));

const resetFormMock = vi.fn();
const setSubmittedMock = vi.fn();
const setWardIdsMock = vi.fn();
const setFromPropertyNoMock = vi.fn();
const setToPropertyNoMock = vi.fn();

let formState: any;
function makeFormState(overrides: any = {}) {
  return {
    form: { wardIds: [], fromPropertyNo: '', toPropertyNo: '', zoneDescription: '', taxZoneId: '', ...overrides.form },
    setWardIds: setWardIdsMock,
    setTaxZoneId: vi.fn(),
    setFromPropertyNo: setFromPropertyNoMock,
    setToPropertyNo: setToPropertyNoMock,
    setZoneDescription: vi.fn(),
    resetForm: resetFormMock,
    submitted: false,
    setSubmitted: setSubmittedMock,
    isMultiWard: false,
    isWardValid: true,
    isZoneValid: true,
    isDescriptionValid: true,
    isRangeValid: true,
    isFormValid: true,
    ...overrides,
  };
}

vi.mock('@/hooks/taxZoningRange/useTaxZoningRange', () => ({
  useTaxZoningRangeForm: (..._args: any[]) => formState,
  comparePropertyNo: (a: string, b: string) => a.localeCompare(b),
}));

let actionsState: any;
const handleSaveMock = vi.fn();
vi.mock('@/hooks/taxZoningRange/useTaxZoningRangeActions', () => ({
  useTaxZoningRangeActions: () => actionsState,
}));

const baseWrapperProps = {
  wardsData: { items: [] } as any,
  taxZones: { items: [] } as any,
  initialRange: null,
  propertyOptions: [],
};

describe('TaxZoningUpdateFormWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsString = '';
    capturedProps = null;
    formState = makeFormState();
    actionsState = { saving: false, handleSave: handleSaveMock };
  });

  it('clicking the close button navigates to the taxzoningmaster screen', () => {
    render(<TaxZoningUpdateFormWrapper id="0" {...baseWrapperProps} />);
    fireEvent.click(screen.getByTestId('drawer-close'));
    expect(pushMock).toHaveBeenCalledWith('/en/property-tax/taxzoningmaster');
    expect(backMock).not.toHaveBeenCalled();
  });

  it('navigates to the taxzoningmaster screen after a successful save', () => {
    render(<TaxZoningUpdateFormWrapper id="0" {...baseWrapperProps} />);
    fireEvent.submit(screen.getByTestId('child-form'));
    expect(handleSaveMock).toHaveBeenCalled();
    const onSuccess = handleSaveMock.mock.calls[0][1] as () => void;
    onSuccess();
    expect(pushMock).toHaveBeenCalledWith('/en/property-tax/taxzoningmaster');
    expect(backMock).not.toHaveBeenCalled();
  });

  it('renders "Add Zoning Range" title when id is "0"', () => {
    render(<TaxZoningUpdateFormWrapper id="0" {...baseWrapperProps} />);
    expect(screen.getByTestId('drawer-title')).toHaveTextContent('addTitle');
  });

  it('renders "Update Zoning Range" title when id is a real id', () => {
    render(<TaxZoningUpdateFormWrapper id="5" {...baseWrapperProps} />);
    expect(screen.getByTestId('drawer-title')).toHaveTextContent('updateTitle');
  });

  it('shows saving label when saving is true', () => {
    actionsState = { saving: true, handleSave: handleSaveMock };
    render(<TaxZoningUpdateFormWrapper id="0" {...baseWrapperProps} />);
    expect(screen.getByTestId('save-btn')).toHaveTextContent('savingBtn');
    expect(screen.getByTestId('save-btn')).toBeDisabled();
  });

  it('calls handleSave on form submit when valid', () => {
    render(<TaxZoningUpdateFormWrapper id="0" {...baseWrapperProps} />);
    fireEvent.submit(screen.getByTestId('child-form'));
    expect(setSubmittedMock).toHaveBeenCalledWith(true);
    expect(handleSaveMock).toHaveBeenCalled();
  });

  it('does not call handleSave when form invalid', () => {
    formState = makeFormState({ isFormValid: false });
    render(<TaxZoningUpdateFormWrapper id="0" {...baseWrapperProps} />);
    fireEvent.submit(screen.getByTestId('child-form'));
    expect(setSubmittedMock).toHaveBeenCalledWith(true);
    expect(handleSaveMock).not.toHaveBeenCalled();
  });

  it('clicking Reset calls resetForm and removes wardId from URL', () => {
    searchParamsString = 'wardId=3&foo=bar';
    render(<TaxZoningUpdateFormWrapper id="0" {...baseWrapperProps} />);
    fireEvent.click(screen.getByTestId('clear-btn'));
    expect(resetFormMock).toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalled();
    const calledUrl = replaceMock.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('wardId=3');
    expect(calledUrl).toContain('foo=bar');
  });

  it('handleWardChange pushes wardId to URL for single ward selection', () => {
    render(<TaxZoningUpdateFormWrapper id="0" {...baseWrapperProps} />);
    capturedProps.setSelectedWards([7]);
    expect(setWardIdsMock).toHaveBeenCalledWith([7]);
    expect(replaceMock).toHaveBeenCalled();
    const calledUrl = replaceMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('wardId=7');
  });

  it('handleWardChange removes wardId from URL for multi ward selection', () => {
    searchParamsString = 'wardId=7';
    render(<TaxZoningUpdateFormWrapper id="0" {...baseWrapperProps} />);
    capturedProps.setSelectedWards([7, 8]);
    expect(setWardIdsMock).toHaveBeenCalledWith([7, 8]);
    const calledUrl = replaceMock.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('wardId=7');
  });

  it('handleFromPropertyChange clears toPropertyNo if from moves past it', () => {
    formState = makeFormState({ form: { toPropertyNo: 'A', wardIds: [], fromPropertyNo: '', zoneDescription: '', taxZoneId: '' } });
    render(<TaxZoningUpdateFormWrapper id="0" {...baseWrapperProps} />);
    capturedProps.setPropertyFrom('Z');
    expect(setFromPropertyNoMock).toHaveBeenCalledWith('Z');
    expect(setToPropertyNoMock).toHaveBeenCalledWith('');
  });
});
