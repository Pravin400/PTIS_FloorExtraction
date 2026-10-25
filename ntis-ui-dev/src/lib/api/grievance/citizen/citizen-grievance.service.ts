/**
 * Citizen Grievance API Service
 * Built on centralized base `apiClient` (@/services/api.service).
 * Handles tracking, listing, submitting, updating, and reminders for citizen grievances.
 *
 * Path: src/lib/api/grievance/citizen/citizen-grievance.service.ts
 */

import { apiClient } from '@/services/api.service';
import { createLogger } from '@/lib/utils/server-logger';
import type { ApiResponse } from '@/types/common.types';
import type { Grievance, CreateGrievanceDto } from '@/types/grievance';
import type {
  TrackingTicket,
  GrievanceTrackingDetailsDto,
  UpdateGrievancePayload,
  GrievanceKpiMetrics,
} from '@/types/grievance/tracking.types';
import { normalizeGrievance, normalizeGrievanceList } from '../guards/grievance-guards';
import {
  normalizeTrackingDetailsDto,
  toTrackingTicket,
  toGrievanceDomain,
  toTrackingTicketFromListItem,
} from './track-grievance-mapper';
import { publicDashboardService } from './public-dashboard.service';

const logger = createLogger('grievance/citizen');

export class CitizenGrievanceService {
  /**
   * GET /api/Grievance/citizen/my-grievances
   */
  async getMyGrievances(mobileOrEmail?: string): Promise<ApiResponse<Grievance[]>> {
    try {
      const query = mobileOrEmail ? `?phone=${encodeURIComponent(mobileOrEmail.trim())}` : '';
      const response = await apiClient.get<unknown>(
        `/Grievance/citizen/my-grievances${query}`,
        undefined,
        false
      );
      if (response.success && response.data) {
        return { success: true, data: normalizeGrievanceList(response.data) };
      }
    } catch (err) {
      logger.warn('Grievance API unavailable', { error: (err as Error).message });
    }
    return { success: true, data: [] };
  }

  /**
   * GET /api/GrievanceApplication/track/{grievanceNo} 
   */
  async getTrackingDetails(
    grievanceNo: string,
    mobileNo?: string
  ): Promise<ApiResponse<GrievanceTrackingDetailsDto | null>> {
    const cleanNo = (grievanceNo || '').trim();
    if (!cleanNo) return { success: false, data: null, message: 'Grievance number is required' };

    try {
      const query = mobileNo ? `?mobileNo=${encodeURIComponent(mobileNo.trim())}` : '';
      const res = await apiClient.get<unknown>(
        `/GrievanceApplication/track/${encodeURIComponent(cleanNo)}${query}`,
        undefined,
        false // Anonymous
      );

      if (!res.success || !res.data) {
        return { success: false, data: null, message: res.message || `No grievance found for "${cleanNo}"` };
      }

      const normalized = normalizeTrackingDetailsDto(res.data);
      if (!normalized) return { success: false, data: null, message: `Grievance details not found for "${cleanNo}"` };

      const rawJson = res.data as Record<string, unknown>;
      const inner = (rawJson['data'] ?? rawJson) as Record<string, unknown>;
      const rawActive = inner['isActive'] ?? inner['IsActive'];
      if (rawActive === false || rawActive === 0 || String(rawActive).toLowerCase() === 'false') {
        return { success: false, data: null, message: `Grievance #${cleanNo} has been deleted or is inactive` };
      }

      return { success: true, data: normalized, message: 'Grievance tracking details fetched successfully' };
    } catch (error) {
      return { success: false, data: null, message: (error as Error).message || 'Failed to connect to Tracking API' };
    }
  }

  /**
   * GET /api/GrievanceApplication/track/{grievanceNo} 
   */
  async trackTicket(ticketId: string, mobileNo?: string): Promise<ApiResponse<TrackingTicket | null>> {
    const res = await this.getTrackingDetails(ticketId, mobileNo);
    if (!res.success || !res.data) return { success: false, data: null, message: res.message || 'Tracking ticket not found' };
    return { success: true, data: toTrackingTicket(res.data), message: res.message };
  }

  /**
   * GET /api/GrievanceApplication/track/{grievanceNo}
   */
  async getGrievanceByTicket(ticketId: string, mobileNo?: string): Promise<ApiResponse<Grievance | null>> {
    const res = await this.getTrackingDetails(ticketId, mobileNo);
    if (!res.success || !res.data) return { success: false, data: null, message: res.message || `No grievance found for "${ticketId}"` };
    return { success: true, data: toGrievanceDomain(res.data), message: res.message };
  }

  /**
   * GET /api/GrievanceApplication or /api/GrievanceApplication/citizen/{citizenId}
   */
  async fetchGrievanceApplications(options: {
    pageSize?: number;
    citizenId?: number | string;
    token?: string;
  } = {}): Promise<ApiResponse<TrackingTicket[]>> {
    const { pageSize = 50, citizenId, token } = options;
    const opt: RequestInit | undefined = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;

    const numCitizenId = citizenId && !isNaN(Number(citizenId)) ? Number(citizenId) : null;

    if (!numCitizenId) {
      return { success: true, data: [], message: 'Authentication required to load citizen grievances' };
    }

    type ListShape = { items?: unknown[]; data?: { items?: unknown[] } | unknown[] } | unknown[];

    const mapItems = (items: Record<string, unknown>[]): TrackingTicket[] => {
      return items
        .filter((item) => {
          const grvNo = String(item['grievanceNo'] ?? item['GrievanceNo'] ?? '');
          if (!grvNo.startsWith('GRV-')) return false;

          // Show only ACTIVE complaints (isActive === 1 or true), hiding deleted/inactive ones
          const rawActive = item['isActive'] ?? item['IsActive'];
          if (rawActive === undefined || rawActive === null) return true;
          return rawActive === true || rawActive === 1 || String(rawActive).toLowerCase() === 'true';
        })
        .map((item) =>
          toTrackingTicketFromListItem({
            id: Number(item['id'] ?? item['Id']),
            grievanceNo: String(item['grievanceNo'] ?? item['GrievanceNo']),
            description: String(item['description'] ?? item['Description'] ?? ''),
            roadLandmark: String(item['roadLandmark'] ?? item['RoadLandmark'] ?? ''),
            departmentName: String(item['departmentName'] ?? item['DepartmentName'] ?? ''),
            grievanceType: String(item['grievanceType'] ?? item['GrievanceType'] ?? ''),
            currentStateId: Number(item['currentStateId'] ?? item['CurrentStateId'] ?? 1),
            submittedDate: String(item['submittedDate'] ?? item['SubmittedDate'] ?? new Date().toISOString()),
          })
        )
        .sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0) || b.token.localeCompare(a.token, undefined, { numeric: true }));
    };

    try {
      const res = await apiClient.get<ListShape>(
        `/GrievanceApplication/citizen/${encodeURIComponent(String(numCitizenId))}?PageNumber=1&PageSize=${pageSize}`,
        opt,
        true
      );

      if (res.success && res.data) {
        const json = res.data as Record<string, unknown>;
        const raw = (json?.['items'] ?? (json?.['data'] as Record<string, unknown>)?.['items'] ?? json?.['data'] ?? (Array.isArray(json) ? json : [])) as unknown[];
        const items = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
        return { success: true, data: mapItems(items), message: 'Grievances loaded from database successfully' };
      }

      if (res.statusCode === 404 || !res.statusCode) {
        return { success: true, data: [], message: 'No grievances registered for this citizen.' };
      }

      return { success: false, data: [], message: res.message || res.error || 'Failed to fetch applications' };
    } catch (err) {
      return { success: false, data: [], message: (err as Error).message || 'Failed to fetch applications' };
    }
  }

  /**
   * PUT /api/GrievanceApplication/{id}
   */
  async updateGrievanceApplication(
    id: number | string,
    payload: UpdateGrievancePayload,
    token?: string
  ): Promise<ApiResponse<boolean>> {
    const numId = Number(id);
    if (!numId || isNaN(numId)) return { success: false, message: 'Invalid Grievance ID', data: false };

    const body: Record<string, unknown> = {
      id: numId,
      Id: numId,
      ...(payload.departmentId ? { grievanceDepartmentId: payload.departmentId, GrievanceDepartmentId: payload.departmentId } : {}),
      ...(payload.grievanceTypeId ? { grievanceTypeId: payload.grievanceTypeId, GrievanceTypeId: payload.grievanceTypeId } : {}),
      ...(payload.roadLandmark !== undefined ? { roadLandmark: payload.roadLandmark, RoadLandmark: payload.roadLandmark } : {}),
      ...(payload.description !== undefined ? { description: payload.description, Description: payload.description } : {}),
      ...(payload.latitude !== undefined ? { latitude: payload.latitude ? String(payload.latitude) : null, Latitude: payload.latitude ? String(payload.latitude) : null } : {}),
      ...(payload.longitude !== undefined ? { longitude: payload.longitude ? String(payload.longitude) : null, Longitude: payload.longitude ? String(payload.longitude) : null } : {}),
      ...(payload.zoneId !== undefined ? { zoneId: payload.zoneId, ZoneId: payload.zoneId } : {}),
      ...(payload.wardId !== undefined ? { wardId: payload.wardId, WardId: payload.wardId } : {}),
      ...(payload.updatedBy !== undefined ? { updatedBy: payload.updatedBy, UpdatedBy: payload.updatedBy } : {}),
    };

    return await apiClient.put<boolean>(
      `/GrievanceApplication/${numId}`,
      body,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      !!token
    );
  }

  /**
   * DELETE /api/GrievanceApplication/{id}
   */
  async deleteGrievanceApplication(
    id: number | string,
    token?: string
  ): Promise<ApiResponse<boolean>> {
    let numId = typeof id === 'number' ? id : parseInt(String(id), 10);
    if (isNaN(numId) || numId <= 0) {
      const match = String(id).match(/\d+$/);
      if (match) numId = parseInt(match[0], 10);
    }

    if (isNaN(numId) || numId <= 0) {
      return { success: false, data: false, message: `Invalid grievance application ID: "${id}"` };
    }

    const opt: RequestInit | undefined = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : undefined;

    return await apiClient.delete<boolean>(
      `/GrievanceApplication/${numId}`,
      opt,
      true
    );
  }

  /**
   * POST /api/GrievanceApplication
   */
  async submitGrievanceApplication(
    payload: Record<string, unknown>,
    token?: string
  ): Promise<ApiResponse<Record<string, unknown>>> {
    const opt: RequestInit | undefined = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
    return await apiClient.post<Record<string, unknown>>('/GrievanceApplication', payload, opt, true);
  }

  /**
   * POST /api/Grievance 
   */
  async submitGrievance(
    dto: CreateGrievanceDto
  ): Promise<ApiResponse<{ grievance: Grievance; trackingId: string }>> {
    try {
      type SubmitResponse = { grievance?: unknown; trackingId?: string };
      const response = await apiClient.post<SubmitResponse>('/Grievance', dto, undefined, false);
      if (response.success && response.data) {
        const normalized = normalizeGrievance(response.data.grievance ?? response.data);
        if (normalized) {
          return {
            success: true,
            data: { grievance: normalized, trackingId: response.data.trackingId || normalized.trackingId },
            message: 'Grievance registered successfully via API',
          };
        }
      }
      return { success: false, message: response.message || 'Grievance registration failed on server' };
    } catch (err) {
      logger.error('Grievance submission API error', { error: (err as Error).message });
      return { success: false, message: (err as Error).message || 'Grievance registration failed' };
    }
  }

  /**
   * POST /api/Grievance/{ticketId}/reminder 
   */
  async sendReminder(ticketId: string, reason?: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await apiClient.post<boolean>(
        `/Grievance/${encodeURIComponent(ticketId.trim())}/reminder`,
        { reason },
        undefined,
        false
      );
      if (response.success) return { success: true, data: true, message: 'Escalation reminder sent.' };
      return { success: false, data: false, message: response.message || 'Failed to send escalation reminder' };
    } catch (err) {
      logger.error('Send reminder error', { ticketId, error: (err as Error).message });
      return { success: false, data: false, message: (err as Error).message || 'Failed to send escalation reminder' };
    }
  }

  /**
   * Fetches live KPI metrics for dashboard cards (delegates to publicDashboardService).
   */
  async fetchKpiMetrics(token?: string): Promise<ApiResponse<GrievanceKpiMetrics>> {
    return publicDashboardService.getKpiMetrics(token);
  }
}

export const citizenGrievanceService = new CitizenGrievanceService();

