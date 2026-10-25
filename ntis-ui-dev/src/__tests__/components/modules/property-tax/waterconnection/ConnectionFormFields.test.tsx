/**
 * Tests for ConnectionFormFields component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { ConnectionFormFields } from '@/components/modules/property-tax/waterconnection/ConnectionFormFields';
import type { WaterConnectionFormModel } from '@/types/water-connection.types';
import {
  mockTypeOptions,
  mockSizeOptions,
  mockStatusOptions,
  createMockFormModel,
  createMockHandlers,
  waterConnectionMessages,
} from '@/__tests__/utils/waterConnectionTestUtils';

const renderWithIntl = (ui: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={waterConnectionMessages}>
      {ui}
    </NextIntlClientProvider>
  );
};

describe('ConnectionFormFields', () => {
  const defaultProps = {
    formData: createMockFormModel(),
    errors: {},
    showError: () => false,
    typeOptions: mockTypeOptions,
    sizeOptions: mockSizeOptions,
    statusOptions: mockStatusOptions,
    applicableRate: null,
    rateError: null,
    t: (key: string) => {
      // Simple translation function for tests
      const parts = key.split('.');
      const translations: Record<string, string> = {
        'connectionNo.label': 'Connection No',
        'connectionNo.placeholder': 'Enter connection number',
        'meterNo.label': 'Meter No',
        'meterNo.placeholder': 'Enter meter number',
        'type.label': 'Type',
        'type.placeholder': 'Select type',
        'tapSize.label': 'Tap Size',
        'tapSize.placeholder': 'Select size',
        'status.label': 'Status',
        'status.placeholder': 'Select status',
        'installDate.label': 'Install Date',
        'applicableRate.label': 'Applicable Rate',
      };
      return translations[parts.slice(2).join('.')] || key;
    },
  };

  let handlers: ReturnType<typeof createMockHandlers>;

  beforeEach(() => {
    handlers = createMockHandlers();
  });

  describe('rendering', () => {
    it('should render all form fields', () => {
      renderWithIntl(
        <ConnectionFormFields
          {...defaultProps}
          {...handlers}
        />
      );

      // Check for labels
      expect(screen.getByText('Connection No')).toBeInTheDocument();
      expect(screen.getByText('Meter No')).toBeInTheDocument();
      expect(screen.getByText('Install Date')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Tap Size')).toBeInTheDocument();
    });

    it('should render type dropdown', () => {
      renderWithIntl(
        <ConnectionFormFields
          {...defaultProps}
          {...handlers}
        />
      );

      expect(screen.getByText('Select type')).toBeInTheDocument();
    });

    it('should render size dropdown', () => {
      renderWithIntl(
        <ConnectionFormFields
          {...defaultProps}
          {...handlers}
        />
      );

      expect(screen.getByText('Select size')).toBeInTheDocument();
    });
  });

  describe('form data binding', () => {
    it('should display form data values in inputs', () => {
      const formData = createMockFormModel({
        connectionNo: 'WC-TEST-001',
        meterNo: 'MTR-001',
        installDate: '2024-01-15',
      });

      renderWithIntl(
        <ConnectionFormFields
          {...defaultProps}
          {...handlers}
          formData={formData}
        />
      );

      expect(screen.getByDisplayValue('WC-TEST-001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('MTR-001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument();
    });
  });

  describe('event handlers', () => {
    it('should call onChange when input is changed', () => {
      renderWithIntl(
        <ConnectionFormFields
          {...defaultProps}
          {...handlers}
        />
      );

      const inputs = screen.getAllByRole('textbox');
      fireEvent.change(inputs[0], { target: { name: 'connectionNo', value: 'WC-NEW' } });

      expect(handlers.onChange).toHaveBeenCalled();
    });

    it('should call onBlur when input loses focus', () => {
      renderWithIntl(
        <ConnectionFormFields
          {...defaultProps}
          {...handlers}
        />
      );

      const inputs = screen.getAllByRole('textbox');
      fireEvent.blur(inputs[0]);

      expect(handlers.onBlur).toHaveBeenCalled();
    });
  });

  describe('validation errors', () => {
    it('should display error when showError returns true', () => {
      const errors = { connectionNo: 'Connection number is required' };
      const showError = (field: keyof WaterConnectionFormModel) => field === 'connectionNo';

      renderWithIntl(
        <ConnectionFormFields
          {...defaultProps}
          {...handlers}
          errors={errors}
          showError={showError}
        />
      );

      expect(screen.getByText('Connection number is required')).toBeInTheDocument();
    });

    it('should not display errors when showError returns false', () => {
      const errors = { connectionNo: 'Connection number is required' };
      const showError = () => false;

      renderWithIntl(
        <ConnectionFormFields
          {...defaultProps}
          {...handlers}
          errors={errors}
          showError={showError}
        />
      );

      expect(screen.queryByText('Connection number is required')).not.toBeInTheDocument();
    });
  });

  describe('maxLength constraint', () => {
    it('should have maxLength of 20 on connectionNo input', () => {
      renderWithIntl(
        <ConnectionFormFields
          {...defaultProps}
          {...handlers}
        />
      );

      const connectionInput = screen.getByPlaceholderText('Enter connection number');
      expect(connectionInput).toHaveAttribute('maxLength', '20');
    });

    it('should have maxLength of 20 on meterNo input', () => {
      renderWithIntl(
        <ConnectionFormFields
          {...defaultProps}
          {...handlers}
        />
      );

      const meterInput = screen.getByPlaceholderText('Enter meter number');
      expect(meterInput).toHaveAttribute('maxLength', '20');
    });
  });

  describe('max date limit on installDate', () => {
    it('should have max attribute set to today', () => {
      renderWithIntl(
        <ConnectionFormFields
          {...defaultProps}
          {...handlers}
        />
      );

      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const todayStr = `${year}-${month}-${day}`;

      // In HTML structure, the input has a label with htmlFor. getByLabelText matches this.
      const installDateInput = screen.getByLabelText(/Install Date/i);
      expect(installDateInput).toHaveAttribute('max', todayStr);
    });
  });

  describe('applicable rate display', () => {
    it('should display applicable rate when provided', () => {
      renderWithIntl(
        <ConnectionFormFields
          {...defaultProps}
          {...handlers}
          applicableRate={1200}
        />
      );

      // Rate is displayed formatted with currency symbol
      expect(screen.getByDisplayValue(/1,?200/)).toBeInTheDocument();
    });
  });

  describe('dropdown options', () => {
    it('should have type options available', () => {
      expect(mockTypeOptions).toHaveLength(3);
      expect(mockTypeOptions[0].connectionTypeName).toBe('Domestic');
      expect(mockTypeOptions[1].connectionTypeName).toBe('Commercial');
      expect(mockTypeOptions[2].connectionTypeName).toBe('Industrial');
    });

    it('should have size options available', () => {
      expect(mockSizeOptions).toHaveLength(3);
      expect(mockSizeOptions[0].displayLabel).toBe('0.5 Inch');
      expect(mockSizeOptions[1].displayLabel).toBe('0.75 Inch');
      expect(mockSizeOptions[2].displayLabel).toBe('1 Inch');
    });

    it('should have status options available', () => {
      expect(mockStatusOptions).toHaveLength(3);
      expect(mockStatusOptions[0].statusName).toBe('Running');
      expect(mockStatusOptions[1].statusName).toBe('Stopped');
      expect(mockStatusOptions[2].statusName).toBe('Disconnected');
    });
  });
});
