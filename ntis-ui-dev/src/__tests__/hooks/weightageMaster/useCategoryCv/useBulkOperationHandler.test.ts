import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processBulkOperations } from '@/hooks/weightageMaster/useCategoryCv/useBulkOperationHandler';
import { UseFactorCVMaster } from '@/types/useCategoryCvFactor.types';

describe('useBulkOperationHandler', () => {
  describe('processBulkOperations', () => {
    const mockTw = vi.fn((key: string, values?: Record<string, unknown>) => {
      const messages: Record<string, string> = {
        'common.messages.noRecordsToUpdate': 'No records to update',
        'common.messages.created': 'created',
        'common.messages.updated': 'updated',
        'common.messages.failed': 'failed',
        'common.messages.bulkOperationSuccess': `Success: ${values?.message}`,
        'common.messages.bulkOperationPartialSuccess': `Partial success: ${values?.message}`,
        'common.messages.bulkOperationFailed': 'Operation failed',
        'common.messages.noChangesDetectedBulk': 'No changes detected',
      };
      return messages[key] || key;
    });

    const mockFindRowByUid = vi.fn((uid: string) => {
      const mockData: Record<string, UseFactorCVMaster> = {
        'row-1': {
          id: 1,
          typeOfUseId: 100,
          subTypeOfUseId: 200,
          factor: 1.5,
          yearRangeCVId: 2023,
          isActive: true,
          createdDate: '2024-01-01',
          updatedDate: '2024-01-01',
        },
        'row-0': {
          id: 0,
          typeOfUseId: 101,
          subTypeOfUseId: 201,
          factor: 2.0,
          yearRangeCVId: 2023,
          isActive: true,
          createdDate: '2024-01-01',
          updatedDate: '2024-01-01',
        },
      };
      return mockData[uid];
    });

    const mockBulkCreateAction = vi.fn();
    const mockBulkUpdateAction = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
      mockTw.mockClear();
      mockBulkCreateAction.mockResolvedValue({ success: true });
      mockBulkUpdateAction.mockResolvedValue({ success: true });
    });

    it('should return error when no editable rows exist', async () => {
      const result = await processBulkOperations({
        editableRows: {},
        findRowByUid: mockFindRowByUid,
        bulkCreateAction: mockBulkCreateAction,
        bulkUpdateAction: mockBulkUpdateAction,
        tW: mockTw,
      });

      expect(result).toEqual({
        success: false,
        createdCount: 0,
        updatedCount: 0,
        errorCount: 0,
        message: 'No records to update',
      });
      expect(mockBulkCreateAction).not.toHaveBeenCalled();
      expect(mockBulkUpdateAction).not.toHaveBeenCalled();
    });

    it('should successfully create new records (id = 0)', async () => {
      const editableRows: Record<string, UseFactorCVMaster> = {
        'row-0': {
          id: 0,
          typeOfUseId: 101,
          subTypeOfUseId: 201,
          factor: 3.0, // Changed from 2.0
          yearRangeCVId: 2023,
          isActive: true,
          createdDate: '2024-01-01',
          updatedDate: '2024-01-01',
        },
      };

      const result = await processBulkOperations({
        editableRows,
        findRowByUid: mockFindRowByUid,
        bulkCreateAction: mockBulkCreateAction,
        bulkUpdateAction: mockBulkUpdateAction,
        tW: mockTw,
      });

      expect(result.success).toBe(true);
      expect(result.createdCount).toBe(1);
      expect(result.updatedCount).toBe(0);
      expect(result.errorCount).toBe(0);
      
      expect(mockBulkCreateAction).toHaveBeenCalledWith([
        {
          isActive: true,
          typeOfUseId: 101,
          subTypeOfUseId: 201,
          factor: 3.0,
          yearRangeCVId: 2023,
        },
      ]);
      expect(mockBulkUpdateAction).not.toHaveBeenCalled();
    });

    it('should successfully update existing records (id > 0)', async () => {
      const editableRows: Record<string, UseFactorCVMaster> = {
        'row-1': {
          id: 1,
          typeOfUseId: 100,
          subTypeOfUseId: 200,
          factor: 2.5, // Changed from 1.5
          yearRangeCVId: 2023,
          isActive: true,
          createdDate: '2024-01-01',
          updatedDate: '2024-01-01',
        },
      };

      const result = await processBulkOperations({
        editableRows,
        findRowByUid: mockFindRowByUid,
        bulkCreateAction: mockBulkCreateAction,
        bulkUpdateAction: mockBulkUpdateAction,
        tW: mockTw,
      });

      expect(result.success).toBe(true);
      expect(result.createdCount).toBe(0);
      expect(result.updatedCount).toBe(1);
      expect(result.errorCount).toBe(0);
      
      expect(mockBulkCreateAction).not.toHaveBeenCalled();
      expect(mockBulkUpdateAction).toHaveBeenCalledWith([
        {
          id: 1,
          data: {
            isActive: true,
            typeOfUseId: 100,
            subTypeOfUseId: 200,
            factor: 2.5,
            yearRangeCVId: 2023,
          },
        },
      ]);
    });

    it('should handle mix of create and update operations', async () => {
      const editableRows: Record<string, UseFactorCVMaster> = {
        'row-0': {
          id: 0,
          typeOfUseId: 101,
          subTypeOfUseId: 201,
          factor: 3.0, // Changed
          yearRangeCVId: 2023,
          isActive: true,
          createdDate: '2024-01-01',
          updatedDate: '2024-01-01',
        },
        'row-1': {
          id: 1,
          typeOfUseId: 100,
          subTypeOfUseId: 200,
          factor: 2.5, // Changed
          yearRangeCVId: 2023,
          isActive: true,
          createdDate: '2024-01-01',
          updatedDate: '2024-01-01',
        },
      };

      const result = await processBulkOperations({
        editableRows,
        findRowByUid: mockFindRowByUid,
        bulkCreateAction: mockBulkCreateAction,
        bulkUpdateAction: mockBulkUpdateAction,
        tW: mockTw,
      });

      expect(result.success).toBe(true);
      expect(result.createdCount).toBe(1);
      expect(result.updatedCount).toBe(1);
      expect(result.errorCount).toBe(0);
      expect(mockBulkCreateAction).toHaveBeenCalledTimes(1);
      expect(mockBulkUpdateAction).toHaveBeenCalledTimes(1);
    });

    it('should skip records with no changes', async () => {
      const editableRows: Record<string, UseFactorCVMaster> = {
        'row-1': {
          id: 1,
          typeOfUseId: 100,
          subTypeOfUseId: 200,
          factor: 1.5, // Same as original
          yearRangeCVId: 2023,
          isActive: true,
          createdDate: '2024-01-01',
          updatedDate: '2024-01-01',
        },
      };

      const result = await processBulkOperations({
        editableRows,
        findRowByUid: mockFindRowByUid,
        bulkCreateAction: mockBulkCreateAction,
        bulkUpdateAction: mockBulkUpdateAction,
        tW: mockTw,
      });

      expect(result.success).toBe(false);
      expect(result.createdCount).toBe(0);
      expect(result.updatedCount).toBe(0);
      expect(result.message).toBe('No changes detected');
      expect(mockBulkCreateAction).not.toHaveBeenCalled();
      expect(mockBulkUpdateAction).not.toHaveBeenCalled();
    });

    it('should increment error count when original row not found', async () => {
      const editableRows: Record<string, UseFactorCVMaster> = {
        'non-existent': {
          id: 999,
          typeOfUseId: 100,
          subTypeOfUseId: 200,
          factor: 2.5,
          yearRangeCVId: 2023,
          isActive: true,
          createdDate: '2024-01-01',
          updatedDate: '2024-01-01',
        },
      };

      const result = await processBulkOperations({
        editableRows,
        findRowByUid: vi.fn(() => undefined),
        bulkCreateAction: mockBulkCreateAction,
        bulkUpdateAction: mockBulkUpdateAction,
        tW: mockTw,
      });

      expect(result.success).toBe(false);
      expect(result.errorCount).toBe(1);
      expect(result.message).toBe('Operation failed');
    });

    it('should handle create operation failures', async () => {
      mockBulkCreateAction.mockResolvedValue({ success: false });

      const editableRows: Record<string, UseFactorCVMaster> = {
        'row-0': {
          id: 0,
          typeOfUseId: 101,
          subTypeOfUseId: 201,
          factor: 3.0,
          yearRangeCVId: 2023,
          isActive: true,
          createdDate: '2024-01-01',
          updatedDate: '2024-01-01',
        },
      };

      const result = await processBulkOperations({
        editableRows,
        findRowByUid: mockFindRowByUid,
        bulkCreateAction: mockBulkCreateAction,
        bulkUpdateAction: mockBulkUpdateAction,
        tW: mockTw,
      });

      expect(result.success).toBe(false);
      expect(result.createdCount).toBe(0);
      expect(result.errorCount).toBe(1);
      expect(result.message).toBe('Operation failed');
    });

    it('should handle update operation failures', async () => {
      mockBulkUpdateAction.mockResolvedValue({ success: false });

      const editableRows: Record<string, UseFactorCVMaster> = {
        'row-1': {
          id: 1,
          typeOfUseId: 100,
          subTypeOfUseId: 200,
          factor: 2.5,
          yearRangeCVId: 2023,
          isActive: true,
          createdDate: '2024-01-01',
          updatedDate: '2024-01-01',
        },
      };

      const result = await processBulkOperations({
        editableRows,
        findRowByUid: mockFindRowByUid,
        bulkCreateAction: mockBulkCreateAction,
        bulkUpdateAction: mockBulkUpdateAction,
        tW: mockTw,
      });

      expect(result.success).toBe(false);
      expect(result.updatedCount).toBe(0);
      expect(result.errorCount).toBe(1);
      expect(result.message).toBe('Operation failed');
    });

    it('should handle partial success (some operations succeed, some fail)', async () => {
      mockBulkCreateAction.mockResolvedValue({ success: true });
      mockBulkUpdateAction.mockResolvedValue({ success: false });

      const editableRows: Record<string, UseFactorCVMaster> = {
        'row-0': {
          id: 0,
          typeOfUseId: 101,
          subTypeOfUseId: 201,
          factor: 3.0,
          yearRangeCVId: 2023,
          isActive: true,
          createdDate: '2024-01-01',
          updatedDate: '2024-01-01',
        },
        'row-1': {
          id: 1,
          typeOfUseId: 100,
          subTypeOfUseId: 200,
          factor: 2.5,
          yearRangeCVId: 2023,
          isActive: true,
          createdDate: '2024-01-01',
          updatedDate: '2024-01-01',
        },
      };

      const result = await processBulkOperations({
        editableRows,
        findRowByUid: mockFindRowByUid,
        bulkCreateAction: mockBulkCreateAction,
        bulkUpdateAction: mockBulkUpdateAction,
        tW: mockTw,
      });

      expect(result.success).toBe(true); // Some succeeded
      expect(result.createdCount).toBe(1);
      expect(result.updatedCount).toBe(0);
      expect(result.errorCount).toBe(1);
      expect(result.message).toContain('Partial success');
    });

    it('should generate correct success message format', async () => {
      const editableRows: Record<string, UseFactorCVMaster> = {
        'row-0': {
          id: 0,
          typeOfUseId: 101,
          subTypeOfUseId: 201,
          factor: 3.0,
          yearRangeCVId: 2023,
          isActive: true,
          createdDate: '2024-01-01',
          updatedDate: '2024-01-01',
        },
        'row-1': {
          id: 1,
          typeOfUseId: 100,
          subTypeOfUseId: 200,
          factor: 2.5,
          yearRangeCVId: 2023,
          isActive: true,
          createdDate: '2024-01-01',
          updatedDate: '2024-01-01',
        },
      };

      const result = await processBulkOperations({
        editableRows,
        findRowByUid: mockFindRowByUid,
        bulkCreateAction: mockBulkCreateAction,
        bulkUpdateAction: mockBulkUpdateAction,
        tW: mockTw,
      });

      expect(result.message).toContain('Success');
      expect(result.message).toContain('1 created');
      expect(result.message).toContain('1 updated');
    });
  });
});
