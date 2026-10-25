import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeptMasterFormDrawer } from '@/components/modules/payroll/MasterModule/OrganizationMaster/DepartmentMaster/DeptMasterFormDrawer';
import type { DeptMasterItem } from '@/types/payroll/MasterModule';

const translations: Record<string, string> = {
  title: 'Department Master',
  'form.title.add': 'Add New Department',
  'form.title.edit': 'Edit Department',
  'form.subtitle.add': 'Configure new department details',
  'form.subtitle.edit': 'Update department information',
  'form.fields.departmentCode': 'Department Code',
  'form.fields.departmentCodePlaceholder': 'e.g. DEPT-EDU',
  'form.fields.departmentName': 'Department Name',
  'form.fields.departmentNamePlaceholder': 'e.g. Education',
  'form.fields.departmentNameLocal': 'Local Name',
  'form.fields.departmentNameLocalPlaceholder': 'उदा. शिक्षण विभाग / Education',
  'form.fields.departmentDescription': 'Description',
  'form.fields.departmentDescriptionPlaceholder': 'Brief description of the department...',
  'list.table.status': 'Status',
  'form.buttons.save': 'Create Department',
  'form.buttons.update': 'Update Department',
  'form.buttons.cancel': 'Cancel',
  'form.mandatoryFields': '* Mandatory Fields',
  'form.validation.codeUnique': 'This Department Code already exists. Codes must be unique.',
  'status.active': 'Active',
  'status.inactive': 'Inactive',
};

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => translations[key] ?? key,
}));

describe('DeptMasterFormDrawer', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    existingCodes: ['EXISTING_DEPT'],
    initialItem: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly when open in create mode', () => {
    render(<DeptMasterFormDrawer {...defaultProps} />);

    expect(screen.getByText('Add New Department')).toBeInTheDocument();
    expect(screen.getByText('* Mandatory Fields')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. DEPT-EDU')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Education')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/उदा. शिक्षण विभाग/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create department/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('validates mandatory fields on empty submit', async () => {
    render(<DeptMasterFormDrawer {...defaultProps} />);

    const submitBtn = screen.getByRole('button', { name: /create department/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Department Code is required.')).toBeInTheDocument();
    expect(screen.getByText('Department Name is required.')).toBeInTheDocument();
    expect(screen.getByText('Department Name (Regional) is required.')).toBeInTheDocument();
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('automatically allows alphanumeric Code and strips digits and invalid symbols from Name inputs', () => {
    render(<DeptMasterFormDrawer {...defaultProps} />);

    const codeInput = screen.getByPlaceholderText('e.g. DEPT-EDU');
    fireEvent.change(codeInput, { target: { value: 'dept@123#xyz' } });
    expect(codeInput).toHaveValue('DEPT123XYZ');

    const nameInput = screen.getByPlaceholderText('e.g. Education');
    fireEvent.change(nameInput, { target: { value: 'Education @#! 2026' } });
    expect(nameInput).toHaveValue('Education  ');

    const marathiInput = screen.getByPlaceholderText(/उदा. शिक्षण विभाग/);
    fireEvent.change(marathiInput, { target: { value: 'शिक्षण @#! 123 ४५६' } });
    expect(marathiInput).toHaveValue('शिक्षण   ');
  });

  it('rejects duplicate department codes', async () => {
    render(<DeptMasterFormDrawer {...defaultProps} />);

    const codeInput = screen.getByPlaceholderText('e.g. DEPT-EDU');
    fireEvent.change(codeInput, { target: { value: 'EXISTING_DEPT' } });

    const submitBtn = screen.getByRole('button', { name: /create department/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText('This Department Code already exists. Codes must be unique.')
    ).toBeInTheDocument();
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('shows duplicate error immediately when entering duplicate code and blurring / moving to another input field', async () => {
    render(<DeptMasterFormDrawer {...defaultProps} />);

    const codeInput = screen.getByPlaceholderText('e.g. DEPT-EDU');
    fireEvent.change(codeInput, { target: { value: 'EXISTING_DEPT' } });
    fireEvent.blur(codeInput);

    expect(
      await screen.findByText('This Department Code already exists. Codes must be unique.')
    ).toBeInTheDocument();
  });

  it('submits valid form data and triggers onClose on success', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();

    render(<DeptMasterFormDrawer {...defaultProps} onSave={onSave} onClose={onClose} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. DEPT-EDU'), {
      target: { value: 'HEALTH' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. Education'), {
      target: { value: 'Health Department' },
    });
    fireEvent.change(screen.getByPlaceholderText(/उदा. शिक्षण विभाग/), {
      target: { value: 'आरोग्य विभाग' },
    });

    const submitBtn = screen.getByRole('button', { name: /create department/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        departmentCode: 'HEALTH',
        departmentName: 'Health Department',
        departmentNameMarathi: 'आरोग्य विभाग',
        description: undefined,
        isActive: true,
      });
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('toggles active and inactive status switch', () => {
    render(<DeptMasterFormDrawer {...defaultProps} />);

    const statusSwitch = screen.getByRole('switch');
    expect(statusSwitch).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('Active')).toBeInTheDocument();

    fireEvent.click(statusSwitch);
    expect(statusSwitch).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('pre-populates form in edit mode and allows saving own code', async () => {
    const initialItem: DeptMasterItem = {
      id: 101,
      departmentId: 'DEPT-101',
      departmentCode: 'EXISTING_DEPT',
      departmentName: 'Existing Name',
      departmentNameMarathi: 'विद्यमान नाव',
      description: 'Existing Description',
      isActive: true,
    };

    const onSave = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();

    render(
      <DeptMasterFormDrawer
        {...defaultProps}
        initialItem={initialItem}
        onSave={onSave}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Edit Department')).toBeInTheDocument();
    expect(screen.getByDisplayValue('EXISTING_DEPT')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('विद्यमान नाव')).toBeInTheDocument();

    // Submit without changing code - should NOT be flagged as duplicate against itself
    const submitBtn = screen.getByRole('button', { name: /update department/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        departmentCode: 'EXISTING_DEPT',
        departmentName: 'Existing Name',
        departmentNameMarathi: 'विद्यमान नाव',
        description: 'Existing Description',
        isActive: true,
      });
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Cancel button is clicked', () => {
    const onClose = vi.fn();
    render(<DeptMasterFormDrawer {...defaultProps} onClose={onClose} />);

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalled();
  });
});
