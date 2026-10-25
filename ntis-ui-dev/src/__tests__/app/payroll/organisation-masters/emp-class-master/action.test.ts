import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getEmpClassMasterPagedAction,
  createEmpClassMasterAction,
  updateEmpClassMasterAction,
  deleteEmpClassMasterAction,
} from '@/app/[locale]/payroll/organisation-masters/emp-class-master/action';
import {
  getEmpClassMasterPaged,
  createEmpClassMaster,
  updateEmpClassMaster,
  deleteEmpClassMaster,
} from '@/lib/api/payroll/EmpClassMaster/empClassMaster.service';
import { ApiError } from '@/lib/utils/api';
import { redirect } from 'next/navigation';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    const err = new Error(`NEXT_REDIRECT: ${url}`) as Error & { digest: string };
    err.digest = `NEXT_REDIRECT;replace;${url};307;;`;
    throw err;
  }),
}));

vi.mock('next-intl/server', () => ({
  getLocale: vi.fn().mockResolvedValue('en'),
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
}));

vi.mock('@/lib/api/payroll/EmpClassMaster/empClassMaster.service', () => ({
  getEmpClassMasterPaged: vi.fn(),
  createEmpClassMaster: vi.fn(),
  updateEmpClassMaster: vi.fn(),
  deleteEmpClassMaster: vi.fn(),
}));

describe('emp-class-master action.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validPayload = {
    classCode: 'CLASS-I',
    className: 'Class I Group A',
    classNameMarathi: 'वर्ग १ (गट अ)',
    description: 'Senior municipal executives',
    isActive: true,
  };

  describe('getEmpClassMasterPagedAction', () => {
    it('throws 400 ApiError when pageNumber or pageSize is out of bounds', async () => {
      await expect(getEmpClassMasterPagedAction(-5, 10)).rejects.toThrow('Invalid pagination parameters');
      await expect(getEmpClassMasterPagedAction(1, 99999)).rejects.toThrow('Invalid pagination parameters');
    });

    it('delegates to getEmpClassMasterPaged with all parameters', async () => {
      vi.mocked(getEmpClassMasterPaged).mockResolvedValueOnce({
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      });

      const res = await getEmpClassMasterPagedAction(
        1,
        10,
        'CLASS',
        'className',
        'asc',
        true
      );

      expect(getEmpClassMasterPaged).toHaveBeenCalledWith(
        1,
        10,
        'CLASS',
        'className',
        'asc',
        true
      );
      expect(res.items).toEqual([]);
    });
  });

  describe('createEmpClassMasterAction', () => {
    it('returns error on schema validation failure', async () => {
      const res = await createEmpClassMasterAction({
        ...validPayload,
        classCode: '',
      });

      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(400);
      expect(res.errorCode).toBe('VALIDATION_ERROR');
      expect(createEmpClassMaster).not.toHaveBeenCalled();
    });

    it('creates record successfully and revalidates paths', async () => {
      vi.mocked(createEmpClassMaster).mockResolvedValueOnce({
        ...validPayload,
        employeeClassId: '1',
      });

      const res = await createEmpClassMasterAction(validPayload);
      expect(res.success).toBe(true);
      expect(createEmpClassMaster).toHaveBeenCalledWith(
        expect.objectContaining({ classCode: 'CLASS-I' })
      );
    });

    it('redirects on 401 ApiError', async () => {
      vi.mocked(createEmpClassMaster).mockRejectedValueOnce(
        new ApiError(401, 'Unauthorized', 'Session expired')
      );

      await expect(createEmpClassMasterAction(validPayload)).rejects.toThrow('NEXT_REDIRECT');
      expect(redirect).toHaveBeenCalledWith('/en/login');
    });

    it('handles ApiError 409 conflict gracefully with typed error code', async () => {
      vi.mocked(createEmpClassMaster).mockRejectedValueOnce(
        new ApiError(409, 'Duplicate code', 'Conflict')
      );

      const res = await createEmpClassMasterAction(validPayload);
      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(409);
      expect(res.errorCode).toBe('DUPLICATE');
    });

    it('handles generic downstream failure gracefully', async () => {
      vi.mocked(createEmpClassMaster).mockRejectedValueOnce(new Error('Network failure'));

      const res = await createEmpClassMasterAction(validPayload);
      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(500);
      expect(res.errorCode).toBe('INTERNAL_ERROR');
    });
  });

  describe('updateEmpClassMasterAction', () => {
    it('returns error when ID is empty', async () => {
      const res = await updateEmpClassMasterAction('', { className: 'Updated' });
      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(400);
      expect(res.errorCode).toBe('INVALID_ID');
    });

    it('returns error when payload fails validation', async () => {
      const res = await updateEmpClassMasterAction('1', { className: 'x'.repeat(200) });
      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(400);
      expect(res.errorCode).toBe('VALIDATION_ERROR');
    });

    it('redirects to login on 401 ApiError', async () => {
      vi.mocked(updateEmpClassMaster).mockRejectedValueOnce(
        new ApiError(401, 'Unauthorized', 'Session expired')
      );

      await expect(
        updateEmpClassMasterAction('1', { className: 'Updated' })
      ).rejects.toThrow('NEXT_REDIRECT');
      expect(redirect).toHaveBeenCalledWith('/en/login');
    });

    it('updates record successfully', async () => {
      vi.mocked(updateEmpClassMaster).mockResolvedValueOnce({
        ...validPayload,
        employeeClassId: '1',
        className: 'Updated Name',
      });

      const res = await updateEmpClassMasterAction('1', { className: 'Updated Name' });
      expect(res.success).toBe(true);
      expect(updateEmpClassMaster).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ className: 'Updated Name' })
      );
    });

    it('handles ApiError 409 conflict on update', async () => {
      vi.mocked(updateEmpClassMaster).mockRejectedValueOnce(
        new ApiError(409, 'Duplicate class name', 'Conflict')
      );

      const res = await updateEmpClassMasterAction('1', { className: 'Duplicate' });
      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(409);
      expect(res.errorCode).toBe('DUPLICATE');
    });
  });

  describe('deleteEmpClassMasterAction', () => {
    it('returns error when ID is invalid', async () => {
      const res = await deleteEmpClassMasterAction('');
      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(400);
      expect(res.errorCode).toBe('INVALID_ID');
    });

    it('redirects to login on 401 ApiError', async () => {
      vi.mocked(deleteEmpClassMaster).mockRejectedValueOnce(
        new ApiError(401, 'Unauthorized', 'Session expired')
      );

      await expect(deleteEmpClassMasterAction('1')).rejects.toThrow('NEXT_REDIRECT');
      expect(redirect).toHaveBeenCalledWith('/en/login');
    });

    it('handles 409 conflict when record is in use', async () => {
      vi.mocked(deleteEmpClassMaster).mockRejectedValueOnce(
        new ApiError(409, 'In use', 'Conflict')
      );

      const res = await deleteEmpClassMasterAction('1');
      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(409);
      expect(res.errorCode).toBe('IN_USE');
    });

    it('deletes record successfully', async () => {
      vi.mocked(deleteEmpClassMaster).mockResolvedValueOnce(undefined);

      const res = await deleteEmpClassMasterAction('1');
      expect(res.success).toBe(true);
      expect(deleteEmpClassMaster).toHaveBeenCalledWith('1');
    });
  });
});
