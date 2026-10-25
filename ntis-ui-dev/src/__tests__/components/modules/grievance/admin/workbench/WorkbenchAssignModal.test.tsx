import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkbenchAssignModal } from '@/components/modules/grievance/admin/workbench/WorkbenchAssignModal';
import type { AdminGrievanceRecord } from '@/types/grievance/admin-complaints.types';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('@/lib/actions/grievance/admin/admin-complaints.actions', () => ({
  assignComplaintAction: vi.fn(),
  forwardComplaintAction: vi.fn(),
  fetchDepartmentOfficersAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

describe('WorkbenchAssignModal component', () => {
  const mockComplaint: AdminGrievanceRecord = {
    id: 101,
    grievanceNo: 'GRV-2026-000101',
    grievanceType: 'Water Pipeline Burst',
    departmentId: 2,
    departmentName: 'Water Works',
    grievanceTypeId: 1,
    roadLandmark: 'Near City Hospital',
    description: 'Pipeline leakage on main road',
    citizenName: 'Jane Doe',
    citizenMobileNo: '9876543210',
    currentStateId: 1,
    currentStateName: 'Registered',
    submittedDate: '2026-10-15T10:00:00Z',
  };

  const defaultProps = {
    isOpen: true,
    complaint: mockComplaint,
    departments: [
      { id: 2, nameEn: 'Water Works', nameMr: 'जल कार्य' },
      { id: 3, nameEn: 'Roads & Drainage', nameMr: 'रस्ते व मलनिःसारण' },
    ],
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when complaint is null', () => {
    const { container } = render(
      <WorkbenchAssignModal {...defaultProps} complaint={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders complaint number in header when open', () => {
    render(<WorkbenchAssignModal {...defaultProps} />);
    expect(screen.getByText('GRV-2026-000101')).toBeDefined();
  });

  it('validates that remark is required before dispatching', () => {
    render(<WorkbenchAssignModal {...defaultProps} />);

    // Click submit button
    const submitBtn = screen.getByRole('button', { name: /actionAssign/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('remarkRequired')).toBeDefined();
  });
});
