'use server';

import { apiClient } from '@/services/api.service';
import { ApiResponse } from '@/types/common.types';

export async function pauseTaxCalculationJobAction(
  jobId: string
): Promise<ApiResponse<{ jobId: string; status: string }>> {
  try {
    const res = await apiClient.post<{ jobId: string; status: string; success: boolean; message: string }>(
      `/TaxCalculationJob/${encodeURIComponent(jobId)}/pause`,
      {}
    );
    return {
      success: true,
      data: res.data || { jobId, status: 'Paused' },
      message: res.data?.message || 'Job paused successfully.',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to pause tax calculation job.',
    };
  }
}

export async function resumeTaxCalculationJobAction(
  jobId: string
): Promise<ApiResponse<{ jobId: string; status: string }>> {
  try {
    const res = await apiClient.post<{ jobId: string; status: string; success: boolean; message: string }>(
      `/TaxCalculationJob/${encodeURIComponent(jobId)}/resume`,
      {}
    );
    return {
      success: true,
      data: res.data || { jobId, status: 'Processing' },
      message: res.data?.message || 'Job resumed successfully.',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resume tax calculation job.',
    };
  }
}

export async function cancelTaxCalculationJobAction(
  jobId: string
): Promise<ApiResponse<{ jobId: string; status: string }>> {
  try {
    const res = await apiClient.post<{ jobId: string; status: string; success: boolean; message: string }>(
      `/TaxCalculationJob/${encodeURIComponent(jobId)}/cancel`,
      {}
    );
    return {
      success: true,
      data: res.data || { jobId, status: 'Cancelled' },
      message: res.data?.message || 'Job cancelled successfully.',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel tax calculation job.',
    };
  }
}
