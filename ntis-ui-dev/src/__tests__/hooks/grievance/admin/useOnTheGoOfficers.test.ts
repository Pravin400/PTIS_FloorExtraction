/**
 * Unit Tests for useOnTheGoOfficers hook
 * Path: src/__tests__/hooks/grievance/admin/useOnTheGoOfficers.test.ts
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOnTheGoOfficers } from '@/hooks/grievance/admin/useOnTheGoOfficers';

const { mockDepartments, mockOfficers } = vi.hoisted(() => ({
  mockDepartments: [
    { id: '1', nameEn: 'Solid Waste Management' },
    { id: '2', nameEn: 'Roads & Traffic' },
  ],
  mockOfficers: [
    {
      id: 101,
      fullName: 'Ramesh Patil',
      designation: 'Sanitary Inspector',
      departmentId: 1,
      zoneId: 1,
      wardId: 3,
      mobileNo: '9822001122',
      email: 'ramesh@amc.gov.in',
    },
    {
      id: 102,
      fullName: 'Suresh Deshmukh',
      designation: 'Health Officer',
      departmentId: 1,
      zoneId: 2,
      wardId: 8,
      mobileNo: '9822001133',
      email: 'suresh@amc.gov.in',
    },
  ],
}));

vi.mock('@/lib/actions/grievance/admin/grievance-department-master.actions', () => ({
  fetchDepartmentsAction: vi.fn().mockResolvedValue({
    success: true,
    data: { items: mockDepartments },
  }),
}));

vi.mock('@/lib/actions/grievance/admin/grievance-department-user.actions', () => ({
  fetchGrievanceDepartmentUsersAction: vi.fn().mockResolvedValue({
    success: true,
    data: mockOfficers,
  }),
}));

describe('useOnTheGoOfficers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads departments and zones on initialization', async () => {
    const { result } = renderHook(() => useOnTheGoOfficers());

    expect(result.current.zones.length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(result.current.departments.length).toBe(2);
      expect(result.current.departments[0].nameEn).toBe('Solid Waste Management');
    });
  });

  it('loads officers for selected department and returns all when no zone/ward is selected', async () => {
    const { result } = renderHook(() => useOnTheGoOfficers(null, null, '1'));

    await waitFor(() => {
      expect(result.current.officers.length).toBe(2);
      expect(result.current.officers[0].name).toBe('Ramesh Patil');
      expect(result.current.officers[1].name).toBe('Suresh Deshmukh');
    });
  });

  it('filters officers strictly when matching zone and ward', async () => {
    const { result } = renderHook(() => useOnTheGoOfficers(1, 3, '1'));

    await waitFor(() => {
      expect(result.current.officers.length).toBe(1);
      expect(result.current.officers[0].name).toBe('Ramesh Patil');
    });
  });

  it('returns empty array without falling back to all officers when no officer matches zone/ward', async () => {
    // Zone 3 has no officers in mock data
    const { result } = renderHook(() => useOnTheGoOfficers(3, 12, '1'));

    await waitFor(() => {
      expect(result.current.officers).toEqual([]);
    });
  });
});
