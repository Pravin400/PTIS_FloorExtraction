import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getZoneDivisionMasterPagedAction,
  createZoneDivisionMasterAction,
  updateZoneDivisionMasterAction,
  deleteZoneDivisionMasterAction,
} from '@/app/[locale]/payroll/organisation-masters/zone-division-master/action';
import {
  getZoneDivisionMasterPaged,
  createZoneDivisionMaster,
  updateZoneDivisionMaster,
  deleteZoneDivisionMaster,
} from '@/lib/api/payroll/ZoneDivisionMaster/zoneDivisionMaster.service';
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

vi.mock('@/lib/api/payroll/ZoneDivisionMaster/zoneDivisionMaster.service', () => ({
  getZoneDivisionMasterPaged: vi.fn(),
  createZoneDivisionMaster: vi.fn(),
  updateZoneDivisionMaster: vi.fn(),
  deleteZoneDivisionMaster: vi.fn(),
}));

describe('zone-division-master action.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validPayload = {
    zoneDivisionCode: 'DIV-EAST',
    zoneDivisionName: 'East Division Administrative Office',
    zoneDivisionNameRegional: 'पूर्व विभाग प्रशासकीय कार्यालय',
    address: 'Near Shivaji Statue, Old Agra Road',
    isActive: true,
  };

  describe('getZoneDivisionMasterPagedAction', () => {
    it('throws 400 ApiError when pageNumber or pageSize is out of bounds', async () => {
      await expect(getZoneDivisionMasterPagedAction(-5, 10)).rejects.toThrow('Invalid pagination parameters');
      await expect(getZoneDivisionMasterPagedAction(1, 99999)).rejects.toThrow('Invalid pagination parameters');
    });

    it('delegates to getZoneDivisionMasterPaged with all parameters', async () => {
      vi.mocked(getZoneDivisionMasterPaged).mockResolvedValueOnce({
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      });

      const res = await getZoneDivisionMasterPagedAction(
        1,
        10,
        'EAST',
        'zoneDivisionName',
        'asc',
        true
      );

      expect(getZoneDivisionMasterPaged).toHaveBeenCalledWith(
        1,
        10,
        'EAST',
        'zoneDivisionName',
        'asc',
        true
      );
      expect(res.items).toEqual([]);
    });
  });

  describe('createZoneDivisionMasterAction', () => {
    it('returns error on schema validation failure', async () => {
      const res = await createZoneDivisionMasterAction({
        ...validPayload,
        zoneDivisionCode: '',
      });

      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(400);
      expect(res.errorCode).toBe('VALIDATION_ERROR');
      expect(createZoneDivisionMaster).not.toHaveBeenCalled();
    });

    it('creates record successfully and revalidates paths', async () => {
      vi.mocked(createZoneDivisionMaster).mockResolvedValueOnce({
        ...validPayload,
        zoneDivisionId: '1',
      });

      const res = await createZoneDivisionMasterAction(validPayload);
      expect(res.success).toBe(true);
      expect(createZoneDivisionMaster).toHaveBeenCalledWith(
        expect.objectContaining({ zoneDivisionCode: 'DIV-EAST' })
      );
    });

    it('redirects on 401 ApiError', async () => {
      vi.mocked(createZoneDivisionMaster).mockRejectedValueOnce(
        new ApiError(401, 'Unauthorized', 'Session expired')
      );

      await expect(createZoneDivisionMasterAction(validPayload)).rejects.toThrow('NEXT_REDIRECT');
      expect(redirect).toHaveBeenCalledWith('/en/login');
    });

    it('handles ApiError 409 conflict gracefully with typed error code', async () => {
      vi.mocked(createZoneDivisionMaster).mockRejectedValueOnce(
        new ApiError(409, 'Duplicate code', 'Conflict')
      );

      const res = await createZoneDivisionMasterAction(validPayload);
      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(409);
      expect(res.errorCode).toBe('DUPLICATE');
    });

    it('handles generic downstream failure gracefully', async () => {
      vi.mocked(createZoneDivisionMaster).mockRejectedValueOnce(new Error('Network failure'));

      const res = await createZoneDivisionMasterAction(validPayload);
      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(500);
      expect(res.errorCode).toBe('INTERNAL_ERROR');
    });
  });

  describe('updateZoneDivisionMasterAction', () => {
    it('returns error when ID is empty', async () => {
      const res = await updateZoneDivisionMasterAction('', { zoneDivisionName: 'Updated' });
      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(400);
      expect(res.errorCode).toBe('INVALID_ID');
    });

    it('returns error when payload fails validation', async () => {
      const res = await updateZoneDivisionMasterAction('1', { zoneDivisionName: 'x'.repeat(200) });
      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(400);
      expect(res.errorCode).toBe('VALIDATION_ERROR');
    });

    it('redirects to login on 401 ApiError', async () => {
      vi.mocked(updateZoneDivisionMaster).mockRejectedValueOnce(
        new ApiError(401, 'Unauthorized', 'Session expired')
      );

      await expect(
        updateZoneDivisionMasterAction('1', { zoneDivisionName: 'Updated' })
      ).rejects.toThrow('NEXT_REDIRECT');
      expect(redirect).toHaveBeenCalledWith('/en/login');
    });

    it('updates record successfully', async () => {
      vi.mocked(updateZoneDivisionMaster).mockResolvedValueOnce({
        ...validPayload,
        zoneDivisionId: '1',
        zoneDivisionName: 'Updated Name',
      });

      const res = await updateZoneDivisionMasterAction('1', { zoneDivisionName: 'Updated Name' });
      expect(res.success).toBe(true);
      expect(updateZoneDivisionMaster).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ zoneDivisionName: 'Updated Name' })
      );
    });

    it('handles ApiError 409 conflict on update', async () => {
      vi.mocked(updateZoneDivisionMaster).mockRejectedValueOnce(
        new ApiError(409, 'Duplicate office name', 'Conflict')
      );

      const res = await updateZoneDivisionMasterAction('1', { zoneDivisionName: 'Duplicate' });
      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(409);
      expect(res.errorCode).toBe('DUPLICATE');
    });
  });

  describe('deleteZoneDivisionMasterAction', () => {
    it('returns error when ID is invalid', async () => {
      const res = await deleteZoneDivisionMasterAction('');
      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(400);
      expect(res.errorCode).toBe('INVALID_ID');
    });

    it('redirects to login on 401 ApiError', async () => {
      vi.mocked(deleteZoneDivisionMaster).mockRejectedValueOnce(
        new ApiError(401, 'Unauthorized', 'Session expired')
      );

      await expect(deleteZoneDivisionMasterAction('1')).rejects.toThrow('NEXT_REDIRECT');
      expect(redirect).toHaveBeenCalledWith('/en/login');
    });

    it('handles 409 conflict when record is in use', async () => {
      vi.mocked(deleteZoneDivisionMaster).mockRejectedValueOnce(
        new ApiError(409, 'In use', 'Conflict')
      );

      const res = await deleteZoneDivisionMasterAction('1');
      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(409);
      expect(res.errorCode).toBe('IN_USE');
    });

    it('deletes record successfully', async () => {
      vi.mocked(deleteZoneDivisionMaster).mockResolvedValueOnce(undefined);

      const res = await deleteZoneDivisionMasterAction('1');
      expect(res.success).toBe(true);
      expect(deleteZoneDivisionMaster).toHaveBeenCalledWith('1');
    });
  });
});
