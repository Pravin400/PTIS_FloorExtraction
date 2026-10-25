import { expect, test, vi, beforeEach } from 'vitest';
import {
  syncDepartmentLicenseWithMaster,
  syncMasterDepartmentWithLicense,
} from '@/lib/api/configuration-settings/ulb-configuration/ulbConfiguration.service';
import { apiClient } from '@/services/api.service';

vi.mock('@/services/api.service', () => {
  return {
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  };
});

beforeEach(() => {
  vi.resetAllMocks();
});

test('syncDepartmentLicenseWithMaster - enables existing license when department is active', async () => {
  // Mock licenses check returns one inactive license
  vi.mocked(apiClient.get).mockResolvedValueOnce({
    success: true,
    data: {
      items: [
        {
          departmentLicenceDetailsId: 45,
          departmentId: 10,
          isActive: false,
          isEnabled: false,
        },
      ],
      pageNumber: 1,
      pageSize: -1,
      totalPages: 1,
      hasNext: false,
    },
  });

  // Mock license update success
  vi.mocked(apiClient.put).mockResolvedValueOnce({
    success: true,
    data: {
      items: {
        departmentLicenceDetailsId: 45,
        isActive: true,
      },
    },
  });

  await syncDepartmentLicenseWithMaster(10, true, 1);

  expect(apiClient.get).toHaveBeenCalledWith('/DepartmentLicenceDetails?PageNumber=1&PageSize=-1');
  expect(apiClient.put).toHaveBeenCalledWith('/DepartmentLicenceDetails/45', expect.objectContaining({
    id: 45,
    departmentId: 10,
    isActive: true,
  }));
});

test('syncDepartmentLicenseWithMaster - creates new license with default dates when department is active and no license exists', async () => {
  // Mock licenses check returns empty list
  vi.mocked(apiClient.get).mockResolvedValueOnce({
    success: true,
    data: {
      items: [],
      pageNumber: 1,
      pageSize: -1,
      totalPages: 1,
      hasNext: false,
    },
  });

  // Mock getUlbMaster call
  vi.mocked(apiClient.get).mockResolvedValueOnce({
    success: true,
    data: {
      items: [
        {
          id: 1,
          ulbCode: 'MOCK',
          ulbName: 'Mock ULB',
          licenceStartDate: '2026-01-01T00:00:00',
          licenceDuration: '12 Months',
          licenceEndDate: '2027-01-01T00:00:00',
        },
      ],
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1,
      hasNext: false,
    },
  });

  // Mock license creation success
  vi.mocked(apiClient.post).mockResolvedValueOnce({
    success: true,
    data: {
      items: {
        departmentLicenceDetailsId: 99,
        isActive: true,
      },
    },
  });

  await syncDepartmentLicenseWithMaster(12, true, 1);

  expect(apiClient.get).toHaveBeenNthCalledWith(1, '/DepartmentLicenceDetails?PageNumber=1&PageSize=-1');
  expect(apiClient.get).toHaveBeenNthCalledWith(2, '/ULBMaster?PageNumber=1&PageSize=10');
  expect(apiClient.post).toHaveBeenCalledWith('/DepartmentLicenceDetails', expect.objectContaining({
    departmentId: 12,
    licenceStartDate: '2026-01-01T00:00:00',
    licenceEndDate: '2027-01-01T00:00:00',
    isActive: true,
  }));
});

test('syncDepartmentLicenseWithMaster - disables existing active license when department is inactive', async () => {
  // Mock licenses check returns one active license
  vi.mocked(apiClient.get).mockResolvedValueOnce({
    success: true,
    data: {
      items: [
        {
          departmentLicenceDetailsId: 45,
          departmentId: 10,
          isActive: true,
          isEnabled: true,
        },
      ],
      pageNumber: 1,
      pageSize: -1,
      totalPages: 1,
      hasNext: false,
    },
  });

  // Mock license update success
  vi.mocked(apiClient.put).mockResolvedValueOnce({
    success: true,
    data: {
      items: {
        departmentLicenceDetailsId: 45,
        isActive: false,
      },
    },
  });

  await syncDepartmentLicenseWithMaster(10, false, 1);

  expect(apiClient.get).toHaveBeenCalledWith('/DepartmentLicenceDetails?PageNumber=1&PageSize=-1');
  expect(apiClient.put).toHaveBeenCalledWith('/DepartmentLicenceDetails/45', expect.objectContaining({
    id: 45,
    departmentId: 10,
    isActive: false,
  }));
});

test('syncMasterDepartmentWithLicense - updates master department if status differs', async () => {
  // Mock getDepartmentById call
  vi.mocked(apiClient.get).mockResolvedValueOnce({
    success: true,
    data: {
      departmentId: 5,
      departmentCode: 'PT',
      departmentName: 'Property Tax',
      isActive: false,
    },
  });

  // Mock updateDepartmentMaster success
  vi.mocked(apiClient.put).mockResolvedValueOnce({
    success: true,
  });

  await syncMasterDepartmentWithLicense(5, true, 1);

  expect(apiClient.get).toHaveBeenCalledWith('/DepartmentMaster/5');
  expect(apiClient.put).toHaveBeenCalledWith('/DepartmentMaster/5', expect.objectContaining({
    departmentId: 5,
    isActive: true,
  }));
});
