import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QualificationMasterFormDrawer } from '@/components/modules/payroll/MasterModule/OrganizationMaster/QualificationMaster/QualificationMasterFormDrawer';
import type { QualificationMasterItem } from '@/types/payroll/MasterModule';

const translations: Record<string, string> = {
  title: 'Qualification Master',
  'form.title.add': 'Add New Qualification',
  'form.title.edit': 'Edit Qualification',
  'form.subtitle.add': 'Create a new qualification standard record',
  'form.subtitle.edit': 'Update qualification details and credential requirements',
  'form.fields.qualificationCode': 'Qualification Code',
  'form.fields.qualificationCodePlaceholder': 'e.g. BCOM, BE, SSC',
  'form.fields.qualificationName': 'Qualification Name',
  'form.fields.qualificationNamePlaceholder': 'e.g. Bachelor of Commerce (B.Com.)',
  'form.fields.qualificationNameLocal': 'Qualification Name (Regional)',
  'form.fields.qualificationNameLocalPlaceholder': 'उदा. वाणिज्य पदवी (बी.कॉम.)',
  'form.fields.qualificationDescription': 'Description',
  'form.fields.qualificationDescriptionPlaceholder': 'Brief description of the qualification scope...',
  'form.fields.status': 'Status',
  'form.buttons.save': 'Create Qualification',
  'form.buttons.update': 'Update Qualification',
  'form.buttons.cancel': 'Cancel',
  'form.mandatoryFields': '* Mandatory Fields',
  'form.validation.codeUnique': 'This Qualification Code already exists. Codes must be unique.',
  'status.active': 'Active',
  'status.inactive': 'Inactive',
};

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => translations[key] ?? key,
}));

describe('QualificationMasterFormDrawer', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    existingCodes: ['EXISTING_QUAL'],
    initialItem: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly when open in create mode', () => {
    render(<QualificationMasterFormDrawer {...defaultProps} />);

    expect(screen.getByText('Add New Qualification')).toBeInTheDocument();
    expect(screen.getByText('* Mandatory Fields')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. BCOM, BE, SSC')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Bachelor of Commerce (B.Com.)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/उदा. वाणिज्य पदवी/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create qualification/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('validates mandatory fields on empty submit', async () => {
    render(<QualificationMasterFormDrawer {...defaultProps} />);

    const submitBtn = screen.getByRole('button', { name: /create qualification/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Qualification Code is required.')).toBeInTheDocument();
    expect(screen.getByText('Qualification Name is required.')).toBeInTheDocument();
    expect(screen.getByText('Qualification Name (Regional) is required.')).toBeInTheDocument();
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('automatically allows alphanumeric Code, numbers, and valid punctuation in Name inputs while stripping invalid symbols', () => {
    render(<QualificationMasterFormDrawer {...defaultProps} />);

    const codeInput = screen.getByPlaceholderText('e.g. BCOM, BE, SSC');
    fireEvent.change(codeInput, { target: { value: 'qual@123#xyz' } });
    expect(codeInput).toHaveValue('QUAL123XYZ');

    const nameInput = screen.getByPlaceholderText('e.g. Bachelor of Commerce (B.Com.)');
    fireEvent.change(nameInput, { target: { value: 'Commerce 2026 (10th + 2) @#' } });
    expect(nameInput).toHaveValue('Commerce 2026 (10th + 2) ');

    const marathiInput = screen.getByPlaceholderText(/उदा. वाणिज्य पदवी/);
    fireEvent.change(marathiInput, { target: { value: 'वाणिज्य 123 ४५६ @#' } });
    expect(marathiInput).toHaveValue('वाणिज्य 123 ४५६ ');
  });

  it('rejects duplicate qualification codes', async () => {
    render(<QualificationMasterFormDrawer {...defaultProps} />);

    const codeInput = screen.getByPlaceholderText('e.g. BCOM, BE, SSC');
    fireEvent.change(codeInput, { target: { value: 'EXISTING_QUAL' } });

    const submitBtn = screen.getByRole('button', { name: /create qualification/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText('This Qualification Code already exists. Codes must be unique.')
    ).toBeInTheDocument();
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('shows duplicate error immediately when entering duplicate code and blurring / moving to another input field', async () => {
    render(<QualificationMasterFormDrawer {...defaultProps} />);

    const codeInput = screen.getByPlaceholderText('e.g. BCOM, BE, SSC');
    fireEvent.change(codeInput, { target: { value: 'EXISTING_QUAL' } });
    fireEvent.blur(codeInput);

    expect(
      await screen.findByText('This Qualification Code already exists. Codes must be unique.')
    ).toBeInTheDocument();
  });

  it('populates fields in edit mode and submits successfully', async () => {
    const editItem: QualificationMasterItem = {
      id: 5,
      qualificationId: 'QUAL-5',
      qualificationCode: 'MSC',
      qualificationName: 'Master of Science',
      qualificationNameRegional: 'विज्ञान पदव्युत्तर',
      sequenceNo: 5,
      isActive: true,
    };

    render(
      <QualificationMasterFormDrawer
        {...defaultProps}
        initialItem={editItem}
      />
    );

    expect(screen.getByText('Edit Qualification')).toBeInTheDocument();
    expect(screen.getByDisplayValue('MSC')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Master of Science')).toBeInTheDocument();
    expect(screen.getByDisplayValue('विज्ञान पदव्युत्तर')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /update qualification/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(defaultProps.onSave).toHaveBeenCalledWith({
      qualificationCode: 'MSC',
      qualificationName: 'Master of Science',
      qualificationNameRegional: 'विज्ञान पदव्युत्तर',
      sequenceNo: 5,
      isActive: true,
    });
  });
});
