import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import './test-setup';
import { DepartmentActivationClient } from '@/components/modules/configuration-settings/department-activation/DepartmentActivationClient';
import { mockToastSuccess } from './test-setup';
import * as activationActions from '@/app/[locale]/configuration-settings/department-activation/action';

const mockDepartments = [
  {
    departmentId: 1,
    departmentCode: 'DEPT01',
    departmentName: 'IT Department',
    departmentNameLocal: 'आईटी विभाग',
    departmentIcon: 'it-icon',
    departmentDescription: 'IT Dept Desc',
    isActive: true,
  },
  {
    departmentId: 2,
    departmentCode: 'DEPT02',
    departmentName: 'HR Department',
    departmentNameLocal: 'एचआर विभाग',
    departmentIcon: 'hr-icon',
    departmentDescription: 'HR Dept Desc',
    isActive: false,
  },
];

const mockModules = [
  {
    moduleId: 101,
    departmentId: 1,
    departmentName: 'IT Department',
    moduleCode: 'MOD01',
    moduleName: 'Module 1',
    moduleNameLocal: 'मॉड्यूल 1',
    moduleIcon: 'mod-icon',
    moduleLabel: 'Label 1',
    moduleDescription: 'Module 1 Desc',
    isActive: true,
  },
];

describe('DepartmentActivationClient', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
  });

  it('renders stats and department cards', () => {
    render(<DepartmentActivationClient initialDepartments={mockDepartments} initialModules={mockModules} />);
    expect(screen.getByText('IT Department')).toBeInTheDocument();
    expect(screen.getByText('HR Department')).toBeInTheDocument();
  });

  it('filters departments based on search input', async () => {
    render(<DepartmentActivationClient initialDepartments={mockDepartments} initialModules={mockModules} />);
    
    const searchInput = screen.getByPlaceholderText('searchPlaceholder');
    fireEvent.change(searchInput, { target: { value: 'IT' } });

    expect(screen.getByText('IT Department')).toBeInTheDocument();
    expect(screen.queryByText('HR Department')).not.toBeInTheDocument();
  });

  it('calls toggleDepartment when a department toggle is clicked', async () => {
    render(<DepartmentActivationClient initialDepartments={mockDepartments} initialModules={mockModules} />);
    
    // Find toggle for HR Department (which is inactive)
    const toggles = screen.getAllByRole('switch');
    await user.click(toggles[1]); // HR Department toggle

    await waitFor(() => {
      expect(activationActions.updateDepartmentStatusAction).toHaveBeenCalled();
    });
  });

  it('handles "Activate All" quick action', async () => {
    render(<DepartmentActivationClient initialDepartments={mockDepartments} initialModules={mockModules} />);
    
    const activateAllButton = screen.getByText('quickActions.activateAll');
    await user.click(activateAllButton);

    await waitFor(() => {
      // It calls updateDepartmentStatusAction for the only inactive department (HR)
      expect(activationActions.updateDepartmentStatusAction).toHaveBeenCalledTimes(1);
      
      const calls = vi.mocked(activationActions.updateDepartmentStatusAction).mock.calls;
      const formData = calls[0][0];
      expect(formData).toBeInstanceOf(FormData);
      expect(formData.get('departmentId')).toBe('2');
      expect(formData.get('isActive')).toBe('true');
      
      expect(mockToastSuccess).toHaveBeenCalled();
    });
  });

  it('opens submodule config dialog when configure button is clicked', async () => {
    render(<DepartmentActivationClient initialDepartments={mockDepartments} initialModules={mockModules} />);
    
    const configButtons = screen.getAllByText('card.configureSubmodules');
    await user.click(configButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    expect(screen.getByText('Module 1')).toBeInTheDocument();
    expect(screen.getByText('modal.saveChanges')).toBeInTheDocument();
  });
});
