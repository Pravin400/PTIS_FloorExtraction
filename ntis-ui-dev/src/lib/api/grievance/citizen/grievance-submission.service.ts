/**
 * Grievance Citizen Submission Domain Service (Layer 4 - Domain Service)
 * Path: src/lib/api/grievance/citizen/grievance-submission.service.ts
 *
 * Encapsulates all backend REST communication for citizen grievance submissions
 * via the centralized core ApiClient.
 */

import { citizenGrievanceService } from './citizen-grievance.service';
import type { ApiResponse } from '@/types/common.types';
import type { GrievanceApplicationResult } from '@/types/grievance';

export type { GrievanceApplicationResult };

export interface CreateGrievanceApplicationPayload {
  citizenId: number;
  grievanceDepartmentId: number;
  grievanceTypeId?: number | null;
  roadLandmark: string;
  description: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  zoneId?: number | null;
  wardId?: number | null;
  isActive?: boolean;
  createdBy?: number | string | null;
}

export class GrievanceSubmissionService {
  /**
   * @deprecated Use citizenGrievanceService.submitGrievanceApplication instead.
   * Consolidates directly into citizenGrievanceService.
   */
  async createApplication(
    payload: CreateGrievanceApplicationPayload,
    token?: string
  ): Promise<ApiResponse<GrievanceApplicationResult>> {
    const defaultZoneId = payload.zoneId ?? 1;
    const defaultWardId = payload.wardId ?? 1;

    const parsedLat =
      payload.latitude != null && !isNaN(Number(payload.latitude))
        ? Number(payload.latitude)
        : null;
    const parsedLng =
      payload.longitude != null && !isNaN(Number(payload.longitude))
        ? Number(payload.longitude)
        : null;
    const parsedCreatedBy =
      payload.createdBy != null && !isNaN(Number(payload.createdBy))
        ? Number(payload.createdBy)
        : null;

    const body = {
      citizenId: Number(payload.citizenId),
      grievanceDepartmentId: Number(payload.grievanceDepartmentId),
      grievanceTypeId: payload.grievanceTypeId ? Number(payload.grievanceTypeId) : null,
      roadLandmark: payload.roadLandmark || '',
      description: payload.description || '',
      latitude: parsedLat,
      longitude: parsedLng,
      zoneId: defaultZoneId,
      wardId: defaultWardId,
      isActive: payload.isActive ?? true,
      createdBy: parsedCreatedBy,
    };

    const res = await citizenGrievanceService.submitGrievanceApplication(body, token);

    if (!res.success || !res.data) {
      return {
        success: false,
        message: res.message || 'Failed to register grievance application',
      };
    }

    const rootData = res.data as Record<string, unknown>;
    const item = (rootData.items ?? rootData.item ?? rootData.data ?? rootData) as Record<string, unknown>;

    return {
      success: true,
      message: 'Grievance registered and saved to database successfully',
      data: {
        id: Number(item.id ?? item.Id ?? rootData.id ?? rootData.Id ?? 0),
        grievanceNo: String(item.grievanceNo ?? item.GrievanceNo ?? rootData.grievanceNo ?? rootData.GrievanceNo ?? ''),
        citizenId: Number(item.citizenId ?? item.CitizenId ?? payload.citizenId),
        grievanceDepartmentId: Number(
          item.grievanceDepartmentId ?? item.GrievanceDepartmentId ?? payload.grievanceDepartmentId
        ),
        grievanceTypeId:
          item.grievanceTypeId || item.GrievanceTypeId
            ? Number(item.grievanceTypeId ?? item.GrievanceTypeId)
            : (payload.grievanceTypeId ? Number(payload.grievanceTypeId) : null),
        roadLandmark: String(item.roadLandmark ?? item.RoadLandmark ?? payload.roadLandmark),
        description: String(item.description ?? item.Description ?? payload.description),
        submittedDate: String(item.submittedDate ?? item.SubmittedDate ?? new Date().toISOString()),
        wardId: item.wardId != null || item.WardId != null ? Number(item.wardId ?? item.WardId) : defaultWardId,
        wardNo: (item.wardNo ?? item.WardNo ?? (item.wardId ? String(item.wardId) : null)) as string | null,
        wardName: (item.wardName ?? item.WardName) as string | null,
        zoneId: item.zoneId != null || item.ZoneId != null ? Number(item.zoneId ?? item.ZoneId) : defaultZoneId,
        zoneNo: (item.zoneNo ?? item.ZoneNo) as string | null,
        zoneName: (item.zoneName ?? item.ZoneName) as string | null,
      },
    };
  }
}

export const grievanceSubmissionService = new GrievanceSubmissionService();
