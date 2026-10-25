/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCommonDetailsUpdateActions } from '@/hooks/commonDetailsUpdate/useCommonDetailsUpdateActions';
import { useRouter } from 'next/navigation';

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  toast: vi.fn(),
};
const toast = mockToast;

vi.mock('@/components/common', () => ({
  useToast: () => mockToast,
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('useCommonDetailsUpdateActions', () => {
  const mockT = vi.fn((key) => key);
  const mockRouter = { refresh: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter as any);
  });

  it('should load field configs successfully', async () => {
    const mockAction = vi.fn().mockResolvedValue({ success: true, data: [{ fieldName: 'test' }] });
    const { result } = renderHook(() => 
      useCommonDetailsUpdateActions(mockT, { getFieldConfigsAction: mockAction })
    );

    const onSuccess = vi.fn();
    await act(async () => {
      await result.current.loadFieldConfigs('UPDATE_CODE', onSuccess);
    });

    expect(mockAction).toHaveBeenCalledWith('UPDATE_CODE');
    expect(onSuccess).toHaveBeenCalledWith([{ fieldName: 'test' }]);
  });

  it('should handle load properties failure', async () => {
    const mockAction = vi.fn().mockResolvedValue({ success: false, error: 'Custom Error' });
    const { result } = renderHook(() => 
      useCommonDetailsUpdateActions(mockT, { getFilteredPropertiesAction: mockAction })
    );

    const onSuccess = vi.fn();
    await act(async () => {
      await result.current.loadProperties({} as any, onSuccess);
    });

    expect(toast.error).toHaveBeenCalledWith('Custom Error');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should handle bulk update success', async () => {
    const mockAction = vi.fn().mockResolvedValue({ 
      success: true, 
      data: { message: 'Updated', items: { successCount: 1, failedCount: 0 } } 
    });
    
    const { result } = renderHook(() => 
      useCommonDetailsUpdateActions(mockT, { executeBulkUpdateAction: mockAction })
    );

    const onSuccess = vi.fn();
    const payload = {
      updateCode: 'TEST_CODE',
      propertyIds: [1, 2, 3],
      updateData: { field1: 'value1' }
    };
    await act(async () => {
      await result.current.handleBulkUpdate('/api', payload, onSuccess);
    });

    expect(mockAction).toHaveBeenCalledWith({ apiRoute: '/api', payload });
    expect(toast.success).toHaveBeenCalledWith('Updated');
    expect(mockRouter.refresh).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });
});
