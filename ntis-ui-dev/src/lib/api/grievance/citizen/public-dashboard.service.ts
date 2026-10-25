/**
 * Public Grievance Dashboard API Service
 * Path: src/lib/api/grievance/citizen/public-dashboard.service.ts
 *
 * Dedicated citizen API service for fetching public grievance statistics,
 * department breakdown, and resolution rate KPIs.
 * Built on centralized base `apiClient` (@/services/api.service).
 * Line ceiling: <= 300 lines.
 */

import { apiClient } from '@/services/api.service';
import { createLogger } from '@/lib/utils/server-logger';
import type { ApiResponse } from '@/types/common.types';
import type {
  PublicDashboardResponse,
  PublicDashboardSummary,
  PublicGrievanceApplication,
} from '@/types/grievance/public-dashboard.types';
import type { GrievanceKpiMetrics } from '@/types/grievance/tracking.types';

const logger = createLogger('grievance/public-dashboard');

export class PublicDashboardService {
  /**
   * GET /api/grievance/public-dashboard
   * Fetches public grievance dashboard summary and departmental breakdown.
   */
  async getPublicDashboard(): Promise<ApiResponse<PublicDashboardResponse>> {
    try {
      const response = await apiClient.get<PublicDashboardResponse>(
        '/grievance/public-dashboard',
        undefined,
        false
      );
      if (response.success && response.data) {
        return response;
      }
      return {
        success: false,
        message: response.message || response.error || 'Failed to fetch public dashboard',
      };
    } catch (err) {
      logger.error('Public dashboard API error', { error: (err as Error).message });
      return {
        success: false,
        message: (err as Error).message || 'Failed to connect to public dashboard API',
      };
    }
  }

  /**
   * Helper to retrieve only the public dashboard summary.
   */
  async getSummary(): Promise<PublicDashboardSummary | null> {
    const res = await this.getPublicDashboard();
    return res.success && res.data?.summary ? res.data.summary : null;
  }

  /**
   * Aggregates live database statistics for the Grievance KPI cards.
   * Primary: GET /api/grievance/public-dashboard
   * Fallback: GET /api/GrievanceApplication?PageNumber=1&PageSize=100
   */
  async getKpiMetrics(token?: string): Promise<ApiResponse<GrievanceKpiMetrics>> {
    const emptyMetrics: GrievanceKpiMetrics = { total: 0, pending: 0, inProgress: 0, resolved: 0 };

    // 1. Primary: live summary from /grievance/public-dashboard
    try {
      const dashRes = await this.getPublicDashboard();
      if (dashRes.success && dashRes.data?.summary) {
        const s = dashRes.data.summary;
        const total = Number(s.totalReceived ?? 0);
        const resolved = Number(s.totalResolved ?? 0);
        const inProgress = Number(s.inProgress ?? 0);
        const pending = Number((s.pendingWithinTime ?? 0) + (s.pendingOverdue ?? 0));
        return {
          success: true,
          data: { total, pending, inProgress, resolved },
          message: 'Live grievance metrics loaded from database',
        };
      }
    } catch (err) {
      logger.warn('Public dashboard summary error, falling back to applications query', {
        error: (err as Error).message,
      });
    }

    // 2. Fallback: query /GrievanceApplication
    try {
      type PagedRes = { totalCount?: number; items?: Array<Record<string, unknown>> };
      const res = await apiClient.get<PagedRes>(
        '/GrievanceApplication?PageNumber=1&PageSize=100',
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
        !token
      );
      if (res.success && res.data) {
        const raw = res.data;
        const items = raw.items || (Array.isArray(raw) ? raw : []);
        let pending = 0, inProgress = 0, resolved = 0;
        for (const it of items) {
          const sid = Number(it['currentStateId'] ?? it['CurrentStateId'] ?? 0);
          const s = String(it['currentStateName'] ?? it['status'] ?? '').toUpperCase();
          const isDone = Boolean(it['isResolved'] || it['isClosed'] || sid === 3 || sid === 4 || s.includes('RESOLV') || s.includes('CLOSE'));
          if (isDone) resolved++;
          else if (sid === 2 || s.includes('PROGRESS')) inProgress++;
          else pending++;
        }
        const total = Number(raw.totalCount) || items.length || (pending + inProgress + resolved);
        return {
          success: true,
          data: { total, pending, inProgress, resolved },
          message: 'Live grievance metrics loaded from database',
        };
      }
    } catch (err) {
      logger.warn('Failed to fetch KPI metrics from applications', { error: (err as Error).message });
    }

    return { success: false, data: emptyMetrics, message: 'Could not load grievance metrics' };
  }

  /**
   * GET /api/GrievanceApplication/public
   * Fetches public citizen grievances with photos and timelines for civic feed cards.
   */
  async getPublicApplications(): Promise<ApiResponse<PublicGrievanceApplication[]>> {
    try {
      const res = await apiClient.get<PublicGrievanceApplication[] | { items?: PublicGrievanceApplication[] }>(
        '/GrievanceApplication/public',
        undefined,
        false
      );
      if (res.success && res.data) {
        const raw = res.data;
        const items = (Array.isArray(raw) ? raw : (raw as { items?: PublicGrievanceApplication[] })?.items || []) as PublicGrievanceApplication[];
        return { success: true, data: items, message: 'Public grievances loaded successfully' };
      }
      return { success: false, data: [], message: res.message || 'No public grievances returned' };
    } catch (err) {
      logger.error('Failed to fetch public grievance applications', { error: (err as Error).message });
      return { success: false, data: [], message: (err as Error).message || 'Failed to fetch public grievances' };
    }
  }
}

export { resolveGrievancePhotoUrl } from '@/lib/utils/grievance/grievance-photo-url';

export const publicDashboardService = new PublicDashboardService();


