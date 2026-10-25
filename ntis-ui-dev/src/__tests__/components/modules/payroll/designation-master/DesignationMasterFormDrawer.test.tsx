import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DesignationMasterFormDrawer } from '@/components/modules/payroll/MasterModule/OrganizationMaster/DesignationMaster/DesignationMasterFormDrawer';
import type { DesignationMasterItem } from '@/types/payroll/MasterModule';

const translations: Record<string, string> = {
  'list.title': 'Designation Master',
  'form.addTitle': 'Add Designation',
  'form.editTitle': 'Edit Designation',
  'form.subtitle': 'Create new designation',
  'form.editSubtitle': 'Update designation details',
  'form.fields.designationCode.label': 'Designation Code',
  'form.fields.designationName.label': 'Designation Name',
  'form.fields.designationLocal.label': 'Designation Name (Regional)',
  'form.fields.designationDescription.label': 'Description',
  'status.label': 'Status',
  'buttons.save': 'Save',
  'buttons.update': 'Update',
  'buttons.cancel': 'Cancel',
  'form.mandatoryFields': '* Mandatory Fields',
  'form.validation.codeUnique': 'This Designation Code already exists. Codes must be unique.',
  'status.active': 'Active',
  'status.inactive': 'Inactive',
};

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => translations[key] ?? key,
}));

describe('DesignationMasterFormDrawer', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    existingCodes: ['COMMISSIONER'],
    initialItem: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly when open in create mode', () => {
    render(<DesignationMasterFormDrawer {...defaultProps} />);

    expect(screen.getByText('Add Designation')).toBeInTheDocument();
    expect(screen.getByText('* Mandatory Fields')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. COMM / CLERK')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('e.g. Municipal Commissioner / Senior Clerk')
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/उदा. महानगरपालिका आयुक्त/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('validates mandatory fields on empty submit', async () => {
    render(<DesignationMasterFormDrawer {...defaultProps} />);

    const submitBtn = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Designation Code is required.')).toBeInTheDocument();
    expect(screen.getByText('Designation Name is required.')).toBeInTheDocument();
    expect(screen.getByText('Designation Name (Regional) is required.')).toBeInTheDocument();
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('automatically allows alphanumeric Code and strips digits and invalid symbols from Name inputs', () => {
    render(<DesignationMasterFormDrawer {...defaultProps} />);

    const codeInput = screen.getByPlaceholderText('e.g. COMM / CLERK');
    fireEvent.change(codeInput, { target: { value: 'asst@123#dir' } });
    expect(codeInput).toHaveValue('ASST123DIR');

    const nameInput = screen.getByPlaceholderText('e.g. Municipal Commissioner / Senior Clerk');
    fireEvent.change(nameInput, { target: { value: 'Assistant Director @#! 2026' } });
    expect(nameInput).toHaveValue('Assistant Director  ');

    const marathiInput = screen.getByPlaceholderText(/उदा. महानगरपालिका आयुक्त/);
    fireEvent.change(marathiInput, { target: { value: 'सहाय्यक संचालक @#! 123 ४५६' } });
    expect(marathiInput).toHaveValue('सहाय्यक संचालक   ');
  });

  it('rejects duplicate designation codes', async () => {
    render(<DesignationMasterFormDrawer {...defaultProps} />);

    const codeInput = screen.getByPlaceholderText('e.g. COMM / CLERK');
    fireEvent.change(codeInput, { target: { value: 'COMMISSIONER' } });

    const submitBtn = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText('This Designation Code already exists. Codes must be unique.')
    ).toBeInTheDocument();
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('shows duplicate error immediately when entering duplicate code and blurring / moving to another input field', async () => {
    render(<DesignationMasterFormDrawer {...defaultProps} />);

    const codeInput = screen.getByPlaceholderText('e.g. COMM / CLERK');
    fireEvent.change(codeInput, { target: { value: 'COMMISSIONER' } });
    fireEvent.blur(codeInput);

    expect(
      await screen.findByText('This Designation Code already exists. Codes must be unique.')
    ).toBeInTheDocument();
  });

  it('submits valid form data and triggers onClose on success', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();

    render(<DesignationMasterFormDrawer {...defaultProps} onSave={onSave} onClose={onClose} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. COMM / CLERK'), {
      target: { value: 'DY_COMM' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. Municipal Commissioner / Senior Clerk'), {
      target: { value: 'Deputy Commissioner' },
    });
    fireEvent.change(screen.getByPlaceholderText(/उदा. महानगरपालिका आयुक्त/), {
      target: { value: 'उपायुक्त' },
    });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        designationCode: 'DY_COMM',
        designationName: 'Deputy Commissioner',
        designationNameMarathi: 'उपायुक्त',
        description: undefined,
        isActive: true,
      });
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('pre-populates fields in edit mode and allows updating', async () => {
    const mockItem: DesignationMasterItem = {
      id: 5,
      designationId: 'DESIG-5',
      designationCode: 'ENGINEER',
      designationName: 'Executive Engineer',
      designationNameMarathi: 'कार्यकारी अभियंता',
      description: 'Head of division',
      isActive: true,
    };

    const onSave = vi.fn().mockResolvedValue(true);

    render(
      <DesignationMasterFormDrawer {...defaultProps} initialItem={mockItem} onSave={onSave} />
    );

    expect(screen.getByText('Edit Designation')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. COMM / CLERK')).toHaveValue('ENGINEER');
    expect(screen.getByPlaceholderText('e.g. Municipal Commissioner / Senior Clerk')).toHaveValue(
      'Executive Engineer'
    );
    expect(screen.getByPlaceholderText(/उदा. महानगरपालिका आयुक्त/)).toHaveValue(
      'कार्यकारी अभियंता'
    );
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('e.g. Municipal Commissioner / Senior Clerk'), {
      target: { value: 'Senior Executive Engineer' },
    });

    fireEvent.click(screen.getByRole('button', { name: /update/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        designationCode: 'ENGINEER',
        designationName: 'Senior Executive Engineer',
        designationNameMarathi: 'कार्यकारी अभियंता',
        description: 'Head of division',
        isActive: true,
      });
    });
  });
});
