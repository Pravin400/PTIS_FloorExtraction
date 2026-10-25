import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWorkbench } from '@/hooks/grievance/admin/useWorkbench';
import * as actions from '@/lib/actions/grievance/admin/admin-complaints.actions';
import * as publicActions from '@/lib/actions/grievance/citizen/track-grievance.actions';

// Mock dependencies
vi.mock('@/lib/actions/grievance/admin/admin-complaints.actions', () => ({
  fetchAdminComplaintsAction: vi.fn(),
  fetchAdminDepartmentOptionsAction: vi.fn(),
  fetchDepartmentOfficersAction: vi.fn(),
}));

vi.mock('@/lib/actions/grievance/citizen/track-grievance.actions', () => ({
  fetchPublicGrievancesAction: vi.fn(),
  trackGrievanceDetailsAction: vi.fn(),
}));

describe('useWorkbench hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(actions.fetchAdminDepartmentOptionsAction).mockResolvedValue({
      success: true,
      data: [{ id: 1, nameEn: 'Water Department', nameMr: 'जल विभाग' }],
      message: 'Success',
    });
    vi.mocked(actions.fetchAdminComplaintsAction).mockResolvedValue({
      success: true,
      data: {
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      },
      message: 'Success',
    });
    vi.mocked(publicActions.fetchPublicGrievancesAction).mockResolvedValue({
      success: true,
      data: [],
      message: 'Success',
    });
    vi.mocked(actions.fetchDepartmentOfficersAction).mockResolvedValue({
      success: true,
      data: [],
      message: 'Success',
    });
  });

  it('initializes with default tab and filter values', () => {
    const { result } = renderHook(() => useWorkbench());

    expect(result.current.activeTab).toBe('all');
    expect(result.current.departmentId).toBe('all');
    expect(result.current.statusId).toBe('all');
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.sortOrder).toBe('desc');
  });

  it('switches active tabs and resets pagination to page 1', () => {
    const { result } = renderHook(() => useWorkbench());

    act(() => {
      result.current.setPage(3);
    });
    expect(result.current.page).toBe(3);

    act(() => {
      result.current.setActiveTab('unassigned');
    });
    expect(result.current.activeTab).toBe('unassigned');
    expect(result.current.page).toBe(1);
  });

  it('updates department filter and resets page to 1', () => {
    const { result } = renderHook(() => useWorkbench());

    act(() => {
      result.current.setPage(4);
      result.current.setDepartmentId(5);
    });

    expect(result.current.departmentId).toBe(5);
    expect(result.current.page).toBe(1);
  });

  it('resets all filters back to default values', () => {
    const { result } = renderHook(() => useWorkbench());

    act(() => {
      result.current.setSearchInput('pothole');
      result.current.setDepartmentId(2);
      result.current.setStatusId(1);
      result.current.setPage(5);
    });

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.searchInput).toBe('');
    expect(result.current.departmentId).toBe('all');
    expect(result.current.statusId).toBe('all');
    expect(result.current.page).toBe(1);
  });
});
