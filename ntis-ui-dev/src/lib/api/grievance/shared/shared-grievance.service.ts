/**
 * Cross-Persona Shared Grievance API Service
 * Symmetrical Layer: src/lib/api/grievance/shared/
 */

import type { ApiResponse } from '@/types/common.types';
import type { Grievance } from '@/types/grievance.types';

export interface WardGrievanceSummary {
  wardNumber: number;
  wardName: string;
  total: number;
  pending: number;
  resolved: number;
}

export class SharedGrievanceService {
  async getGrievanceById(_id: string): Promise<ApiResponse<Grievance | null>> {
    return {
      success: false,
      data: null,
      message: 'Grievance not found',
    };
  }

  async getWardSummaries(): Promise<ApiResponse<WardGrievanceSummary[]>> {
    const wardMap: Record<number, { total: number; pending: number; resolved: number }> = {};
    for (let i = 1; i <= 22; i++) {
      wardMap[i] = { total: 0, pending: 0, resolved: 0 };
    }

    const summaries: WardGrievanceSummary[] = Object.entries(wardMap).map(([ward, stats]) => ({
      wardNumber: Number(ward),
      wardName: `Ward ${ward} - Amravati`,
      ...stats,
    }));

    return { success: true, data: summaries };
  }
}

export const sharedGrievanceService = new SharedGrievanceService();
