/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaxZoningForm } from '@/components/modules/property-tax/taxzoningmaster/TaxZoningForm';

// Mock common components
vi.mock('@/components/common', () => ({
  Card: ({ children, ...p }: any) => <div data-testid="card" {...p}>{children}</div>,
  CardContent: ({ children, ...p }: any) => <div {...p}>{children}</div>,
  CardHeader: ({ children, ...p }: any) => <div {...p}>{children}</div>,
  CardTitle: ({ children, ...p }: any) => <span {...p}>{children}</span>,
  Select: ({ placeholder, disabled, value }: any) => <select data-testid="select" disabled={disabled} defaultValue={value}><option>{placeholder}</option></select>,
  ValidationMessage: ({ visible, message }: any) => visible ? <span data-testid="validation-msg">{message}</span> : null,
  SaveButton: ({ label, disabled, ...p }: any) => <button data-testid="save-btn" disabled={disabled} {...p}>{label}</button>,
  CancelButton: ({ label, onClick, ...p }: any) => <button data-testid="cancel-btn" onClick={onClick} {...p}>{label}</button>,
}));
vi.mock('@/components/common/Dropdown', () => ({
  MultiSelectDropdown: ({ placeholder }: any) => <div data-testid="multi-select">{placeholder}</div>,
}));
vi.mock('@/components/common/label', () => ({
  Label: ({ children }: any) => <label>{children}</label>,
}));
vi.mock('@/lib/utils/cn', () => ({ cn: (...args: any[]) => args.filter(Boolean).join(' ') }));

const t = (key: string) => key;
const baseProps = {
  t,
  zone: '', setZone: vi.fn(),
  zoneOptions: [{ label: 'Zone 1', value: '1' }],
  isTaxZoneValid: true, submitted: false,
  ward: [] as string[], setWard: vi.fn(),
  wardOptions: [{ label: 'W1', value: '1' }],
  isWardValid: true,
  fromProps: '', setFromProps: vi.fn(),
  toProps: '', setToProps: vi.fn(),
  propertyOptionsByWard: [],
  isPropertyValid: true, isPropertyRangeValid: true, saving: false, isFormValid: true,
  handleSubmit: vi.fn(), onClear: vi.fn(),
};

describe('TaxZoningForm', () => {
  it('should render form with labels', () => {
    render(<TaxZoningForm {...baseProps} />);
    expect(screen.getByText('form.taxZone')).toBeInTheDocument();
    expect(screen.getByText('form.ward')).toBeInTheDocument();
    expect(screen.getByText('form.fromProperty')).toBeInTheDocument();
    expect(screen.getByText('form.toProperty')).toBeInTheDocument();
  });

  it('should show validation messages when submitted and invalid', () => {
    render(<TaxZoningForm {...baseProps} submitted={true} isTaxZoneValid={false} isWardValid={false} />);
    const msgs = screen.getAllByTestId('validation-msg');
    expect(msgs.length).toBeGreaterThanOrEqual(2);
  });

  it('should disable save button when form is invalid or saving', () => {
    render(<TaxZoningForm {...baseProps} isFormValid={false} />);
    expect(screen.getByTestId('save-btn')).toBeDisabled();
  });

  it('should show updating label when saving', () => {
    render(<TaxZoningForm {...baseProps} saving={true} />);
    expect(screen.getByTestId('save-btn')).toHaveTextContent('form.updating');
  });

  it('should show multiple wards message when more than 1 ward selected', () => {
    render(<TaxZoningForm {...baseProps} ward={['1', '2']} />);
    expect(screen.getByText('preview.multipleWardsSelected')).toBeInTheDocument();
  });

  it('should show property validation when single ward and invalid property', () => {
    render(<TaxZoningForm {...baseProps} ward={['1']} submitted={true} isPropertyValid={false} />);
    expect(screen.getByText('messages.propertyRequired')).toBeInTheDocument();
  });
});
