import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import './test-setup';
import DepartmentMasterForm from '@/components/modules/configuration-settings/department-master/DepartmentMasterForm';
import { mockToastSuccess, mockToastError } from './test-setup';
import * as deptActions from '@/app/[locale]/configuration-settings/department-master/action';

describe('DepartmentMasterForm', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders add department form correctly', () => {
    render(<DepartmentMasterForm open={true} onClose={vi.fn()} editingDepartment={null} />);
    expect(screen.getByText('form.title.add')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('form.fields.departmentNamePlaceholder')).toBeInTheDocument();
  });

  it('renders edit department form with initial data', () => {
    const initialData = {
      departmentId: 1,
      departmentCode: 'IT01',
      departmentName: 'Information Technology',
      departmentNameLocal: 'आईटी',
      departmentDescription: 'IT Dept',
      isActive: true,
    };
    render(<DepartmentMasterForm open={true} onClose={vi.fn()} editingDepartment={initialData} />);
    expect(screen.getByText('form.title.edit')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Information Technology')).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields on submit', async () => {
    render(<DepartmentMasterForm open={true} onClose={vi.fn()} editingDepartment={null} />);
    const form = document.getElementById('department-form') as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      // Assuming it uses standard HTML validation or Zod/React Hook Form
      // If it shows a toast on validation error:
      expect(mockToastError).toHaveBeenCalled();
    });
  });

  it('handles successful department creation', async () => {
    render(<DepartmentMasterForm open={true} onClose={vi.fn()} editingDepartment={null} />);

    fireEvent.change(screen.getByPlaceholderText('form.fields.departmentCodePlaceholder'), { target: { value: 'NEW01' } });
    fireEvent.change(screen.getByPlaceholderText('form.fields.departmentNamePlaceholder'), { target: { value: 'New Dept' } });
    fireEvent.change(screen.getByPlaceholderText('form.fields.departmentNameLocalPlaceholder'), { target: { value: 'नया विभाग' } });
    fireEvent.change(screen.getByPlaceholderText('form.fields.departmentDescriptionPlaceholder'), { target: { value: 'Description' } });

    const submitButton = screen.getByText('form.buttons.save');
    await user.click(submitButton);

    await waitFor(() => {
      expect(deptActions.saveDepartmentMasterAction).toHaveBeenCalled();
      expect(mockToastSuccess).toHaveBeenCalledWith('success.created');
    });
  });

  it('handles API failure during creation', async () => {
    vi.mocked(deptActions.saveDepartmentMasterAction).mockResolvedValueOnce({
      success: false,
      error: 'API Error',
    });

    render(<DepartmentMasterForm open={true} onClose={vi.fn()} editingDepartment={null} />);

    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText('form.fields.departmentCodePlaceholder'), { target: { value: 'ERR01' } });
    fireEvent.change(screen.getByPlaceholderText('form.fields.departmentNamePlaceholder'), { target: { value: 'Error Dept' } });

    await user.click(screen.getByText('form.buttons.save'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('API Error');
    });
  });

  it('shows validation error immediately on change for invalid department code', async () => {
    render(<DepartmentMasterForm open={true} onClose={vi.fn()} editingDepartment={null} />);
    const codeInput = screen.getByPlaceholderText('form.fields.departmentCodePlaceholder');
    
    // Type an invalid code (consisting only of zeros)
    fireEvent.change(codeInput, { target: { value: '00' } });
    
    // The validation message should be visible on change
    expect(screen.getByText('Department Code cannot consist only of zeros')).toBeInTheDocument();
  });

  it('strips special characters and spaces from department code immediately on change', async () => {
    render(<DepartmentMasterForm open={true} onClose={vi.fn()} editingDepartment={null} />);
    const codeInput = screen.getByPlaceholderText('form.fields.departmentCodePlaceholder') as HTMLInputElement;
    
    // Type with special characters and space
    fireEvent.change(codeInput, { target: { value: 'D E ! P @' } });
    
    // The value should be sanitized to DEP (spaces, exclamation marks, @ stripped)
    expect(codeInput.value).toBe('DEP');
  });

  it('strips numbers and special characters from department name immediately on change', async () => {
    render(<DepartmentMasterForm open={true} onClose={vi.fn()} editingDepartment={null} />);
    const nameInput = screen.getByPlaceholderText('form.fields.departmentNamePlaceholder') as HTMLInputElement;
    
    // Type with numbers and special characters
    fireEvent.change(nameInput, { target: { value: 'Dept 123!' } });
    
    // The value should be sanitized to "Dept "
    expect(nameInput.value).toBe('Dept ');
  });

  it('truncates department name to 50 characters', async () => {
    render(<DepartmentMasterForm open={true} onClose={vi.fn()} editingDepartment={null} />);
    const nameInput = screen.getByPlaceholderText('form.fields.departmentNamePlaceholder') as HTMLInputElement;
    
    // Type 55 characters
    const longName = 'A'.repeat(55);
    fireEvent.change(nameInput, { target: { value: longName } });
    
    // The value should be truncated to 50
    expect(nameInput.value).toHaveLength(50);
  });

  it('does not show required validation error on change when field is cleared', async () => {
    render(<DepartmentMasterForm open={true} onClose={vi.fn()} editingDepartment={null} />);
    const codeInput = screen.getByPlaceholderText('form.fields.departmentCodePlaceholder') as HTMLInputElement;

    // Type a value first
    fireEvent.change(codeInput, { target: { value: 'NEW' } });
    expect(screen.queryByText('validation.required')).not.toBeInTheDocument();

    // Clear the field
    fireEvent.change(codeInput, { target: { value: '' } });
    
    // Required error should still not be shown
    expect(screen.queryByText('validation.required')).not.toBeInTheDocument();
  });

  it('allows Marathi/Devanagari characters and spaces in department name', async () => {
    render(<DepartmentMasterForm open={true} onClose={vi.fn()} editingDepartment={null} />);
    const nameInput = screen.getByPlaceholderText('form.fields.departmentNamePlaceholder') as HTMLInputElement;

    // Type Marathi characters
    fireEvent.change(nameInput, { target: { value: 'मराठी विभाग' } });

    // The value should be accepted completely without being stripped
    expect(nameInput.value).toBe('मराठी विभाग');
  });
});
