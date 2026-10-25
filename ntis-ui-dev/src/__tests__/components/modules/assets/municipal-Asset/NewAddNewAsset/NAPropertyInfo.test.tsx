import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NAPropertyInfo } from '@/components/modules/assets/municipal-Asset/NewAddNewAsset/components/NAPropertyInfo';
import enTranslations from '@/i18n/locales/en/newAddNewAsset.json';

import type { BuildingBasicInfoFormData, NAPropertyInfoProps } from '@/types/asset/municipal-Asset/new-add-new-asset/buildBasicInfo.types';

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    let text = getNestedValue(enTranslations, key);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  },
  useLocale: () => 'en',
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
}));

describe('NAPropertyInfo Component', () => {
  const mockFormData = {
    assetName: 'Main Municipal School',
    assetNameRegional: 'मुख्य महानगरपालिका शाळा',
    department: '1',
    ownershipType: 'municipal',
    inChargeName: 'Rajesh Sharma',
    inChargeNameRegional: 'राजेश शर्मा',
    inChargeDesignation: '2',
    inChargeMobile: '9876543210',
    inChargeEmail: 'rajesh@example.com',
    pinCode: '400001',
    fullAddress: 'Station Road, Mumbai',
    fullAddressRegional: 'स्टेशन रोड, मुंबई',
  } as unknown as BuildingBasicInfoFormData;

  const defaultProps: NAPropertyInfoProps = {
    formData: mockFormData,
    errors: {},
    showError: vi.fn(() => false),
    handleChange: vi.fn(),
    updateFormData: vi.fn(),
    departments: [{ id: 1, departmentName: 'Education Dept' }],
    ownershipTypes: [
      { id: 1, ownershipTypeName: 'Municipal', isActive: true },
      { id: 2, ownershipTypeName: 'Leased', isActive: true },
      { id: 3, ownershipTypeName: 'Private', isActive: true },
    ],
    designations: [{ id: 2, designationName: 'Headmaster' }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders localized card header and KYC fields', () => {
    render(<NAPropertyInfo {...defaultProps} />);

    expect(screen.getByText('KYC Details')).toBeInTheDocument();
    expect(screen.getByText('Asset Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Main Municipal School')).toBeInTheDocument();
    expect(screen.getByText('Asset Regional Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('मुख्य महानगरपालिका शाळा')).toBeInTheDocument();
    expect(screen.getByText('Owning Department')).toBeInTheDocument();
    expect(screen.getByText('Education Dept')).toBeInTheDocument();
    expect(screen.getByText('Ownership Type')).toBeInTheDocument();
  });

  it('renders In-Charge section with designation and digit boxes', () => {
    render(<NAPropertyInfo {...defaultProps} />);

    expect(screen.getByText('In-Charge Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Rajesh Sharma')).toBeInTheDocument();
    expect(screen.getByText('Designation')).toBeInTheDocument();
    expect(screen.getByText('Headmaster')).toBeInTheDocument();

    expect(screen.getByText('Contact Number')).toBeInTheDocument();
    '9876543210'.split('').forEach((d) => {
      expect(screen.getAllByDisplayValue(d).length).toBeGreaterThan(0);
    });

    expect(screen.getByText('Pin Code')).toBeInTheDocument();
    '400001'.split('').forEach((d) => {
      expect(screen.getAllByDisplayValue(d).length).toBeGreaterThan(0);
    });
  });

  it('renders email, full address, and regional address with localized placeholders', () => {
    render(<NAPropertyInfo {...defaultProps} />);

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByDisplayValue('rajesh@example.com')).toBeInTheDocument();

    expect(screen.getByText(/Full Address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Full Address')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Station Road, Mumbai')).toBeInTheDocument();

    expect(screen.getByText('Regional Address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Regional Address')).toBeInTheDocument();
    expect(screen.getByDisplayValue('स्टेशन रोड, मुंबई')).toBeInTheDocument();
  });

  it('handles input changes for address fields', () => {
    const handleChangeMock = vi.fn();
    render(<NAPropertyInfo {...defaultProps} handleChange={handleChangeMock} />);

    const addressTextarea = screen.getByPlaceholderText('Enter Full Address');
    fireEvent.change(addressTextarea, { target: { name: 'fullAddress', value: 'New Street 12' } });

    expect(handleChangeMock).toHaveBeenCalled();
  });
});
