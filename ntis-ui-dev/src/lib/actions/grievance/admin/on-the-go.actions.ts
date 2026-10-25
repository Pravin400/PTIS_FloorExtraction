'use server';

/**
 * On-The-Go Grievance Server Actions (Layer 3 - Next.js RPC)
 * Path: src/lib/actions/grievance/admin/on-the-go.actions.ts
 *
 * Coordinates atomic complaint creation and officer assignment for
 * commissioner/field officer triage.
 * Line ceiling: <= 300 lines.
 */

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { ApiResponse } from '@/types/common.types';
import type {
  SubmitOnTheGoPayload,
  OnTheGoSubmissionResult,
} from '@/types/grievance/on-the-go.types';
import { adminGrievanceService } from '@/lib/api/grievance/admin/admin-grievance.service';
import { citizenGrievanceService } from '@/lib/api/grievance/citizen/citizen-grievance.service';
import { citizenAuthService } from '@/lib/api/grievance/citizen/citizen-auth.service';
import { grievanceTypeService } from '@/lib/api/grievance/admin/grievance-type.service';
import { isAccessTokenExpired } from '@/lib/utils/jwt-expiry';
import { createLogger } from '@/lib/utils/server-logger';
import { resolveGrievanceTypeItem } from '@/lib/utils/grievance/citizen-form-validation';

const logger = createLogger('grievance/on-the-go-actions');

function getValidToken(token?: string | null): string | undefined {
  if (!token || !token.trim()) return undefined;
  if (isAccessTokenExpired(token.trim())) return undefined;
  return token.trim();
}

async function getSessionToken(): Promise<string | undefined> {
  try {
    const store = await cookies();
    const authToken = getValidToken(store.get('auth_token')?.value);
    if (authToken) return authToken;
    const citizenToken = getValidToken(store.get('citizen_token')?.value);
    if (citizenToken) return citizenToken;
    return undefined;
  } catch {
    return undefined;
  }
}

function extractUserIdFromSession(cookieStore: Awaited<ReturnType<typeof cookies>>, token?: string): number | null {
  const cookieUid = cookieStore.get('user_id')?.value || cookieStore.get('userId')?.value || cookieStore.get('staff_user_id')?.value;
  if (cookieUid && !isNaN(Number(cookieUid)) && Number(cookieUid) > 0) return Number(cookieUid);
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        const jwtId = decoded.userId ?? decoded.UserId ?? decoded.sub ?? decoded.nameid ?? decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
        if (jwtId && !isNaN(Number(jwtId)) && Number(jwtId) > 0) return Number(jwtId);
      }
    } catch {}
  }
  return null;
}

/**
 * 1. Submit and Assign Grievance Atomically
 * Creates the grievance application and immediately dispatches it to the selected officer.
 */
export async function submitOnTheGoGrievanceAction(
  payload: SubmitOnTheGoPayload
): Promise<ApiResponse<OnTheGoSubmissionResult>> {
  try {
    // 1. Session and auth resolution
    const token = await getSessionToken();
    const cookieStore = await cookies();
    const currentUserId = extractUserIdFromSession(cookieStore, token);

    // 2. Validate mandatory fields
    if (!payload.description?.trim()) {
      return { success: false, message: 'Description is required' };
    }
    if (!payload.departmentId) {
      return { success: false, message: 'Department is required' };
    }
    if (!payload.assignedOfficerUserId) {
      return { success: false, message: 'Officer assignment is required' };
    }

    // 3. Resolve active citizen ID from CitizenMaster (required by backend foreign key)
    const cleanMobile = payload.citizenMobile ? payload.citizenMobile.replace(/\D/g, '').slice(-10) : '';
    const cleanName = payload.citizenName?.trim() || '';
    if (cleanMobile && !cleanName) {
      return { success: false, message: 'Citizen name is required when citizen mobile is provided' };
    }
    let citizenId: number | null = null;
    if (cleanMobile) {
      try {
        const lookupRes = await citizenAuthService.getCitizenByMobile(cleanMobile);
        const rawFound = lookupRes.data as unknown as Record<string, unknown> | null | undefined;
        const found = (rawFound?.items ?? rawFound?.data ?? rawFound?.item ?? rawFound) as Record<string, unknown> | null | undefined;
        const foundId = found?.id ?? found?.Id ?? (lookupRes.data as { id?: number })?.id;
        if (lookupRes.success && foundId && Number(foundId) > 0) {
          citizenId = Number(foundId);
        }
      } catch (lookupErr) {
        logger.warn('Citizen lookup failed during On-The-Go submission', { error: (lookupErr as Error).message });
      }
    }

    if (!citizenId && cleanMobile) {
      try {
        const createRes = await citizenAuthService.createCitizen({
          name: cleanName,
          mobileNo: cleanMobile,
          isActive: true,
          ...(currentUserId ? { createdBy: currentUserId } : {}),
        });
        const rawCreated = createRes.data as unknown as Record<string, unknown> | null | undefined;
        const created = (rawCreated?.items ?? rawCreated?.Items ?? rawCreated?.data ?? rawCreated?.item ?? rawCreated) as Record<string, unknown> | null | undefined;
        const createdId = created?.id ?? created?.Id ?? (createRes.data as { id?: number })?.id;
        if (createRes.success && createdId && Number(createdId) > 0) {
          citizenId = Number(createdId);
        }
      } catch (createErr) {
        logger.warn('Citizen auto-registration failed during On-The-Go submission', { error: (createErr as Error).message });
      }
    }

    // 4. Auto-resolve valid grievance category (GrievanceTypeId) for the selected department
    let resolvedGrievanceTypeId: number | null = payload.grievanceTypeId ? Number(payload.grievanceTypeId) : null;
    if (!resolvedGrievanceTypeId) {
      try {
        const typesRes = await grievanceTypeService.getAll(
          { grievanceDepartmentId: Number(payload.departmentId), isActive: true },
          token
        );
        if (typesRes.success && Array.isArray(typesRes.data) && typesRes.data.length > 0) {
          const match = resolveGrievanceTypeItem(payload.description, typesRes.data);
          resolvedGrievanceTypeId = match?.id ?? typesRes.data[0].id;
        }
      } catch (typeErr) {
        logger.warn('Failed to resolve category for department during On-The-Go triage', {
          departmentId: payload.departmentId,
          error: (typeErr as Error).message,
        });
      }
    }

    // 5. Assemble creation DTO for backend /GrievanceApplication
    const creationBody: Record<string, unknown> = {
      ...(citizenId && citizenId > 0 ? { citizenId: Number(citizenId), CitizenId: Number(citizenId) } : {}),
      grievanceDepartmentId: Number(payload.departmentId),
      ...(resolvedGrievanceTypeId && resolvedGrievanceTypeId > 0
        ? { grievanceTypeId: resolvedGrievanceTypeId, GrievanceTypeId: resolvedGrievanceTypeId }
        : {}),
      description: payload.description.trim(),
      ...(payload.roadLandmark?.trim() ? { roadLandmark: payload.roadLandmark.trim() } : {}),
      zoneId: Number(payload.zoneId),
      wardId: Number(payload.wardNumber),
      ...(cleanMobile ? { applicantMobileNo: cleanMobile } : {}),
      ...(cleanName ? { applicantName: cleanName } : {}),
      latitude: payload.latitude ? String(payload.latitude) : null,
      longitude: payload.longitude ? String(payload.longitude) : null,
      Latitude: payload.latitude ? String(payload.latitude) : null,
      Longitude: payload.longitude ? String(payload.longitude) : null,
      isActive: true,
      ...(currentUserId ? { createdBy: currentUserId, CreatedBy: currentUserId } : {}),
      ...(payload.assignedOfficerUserId
        ? {
            currentAssignedToUserId: Number(payload.assignedOfficerUserId),
            CurrentAssignedToUserId: Number(payload.assignedOfficerUserId),
            assignedToUserId: Number(payload.assignedOfficerUserId),
            AssignedToUserId: Number(payload.assignedOfficerUserId),
          }
        : {}),
    };

    // 5. Call CitizenGrievanceService to create the application
    const createRes = await citizenGrievanceService.submitGrievanceApplication(
      creationBody,
      token
    );

    if (!createRes.success || !createRes.data) {
      return {
        success: false,
        message: createRes.message || 'Failed to register grievance application',
      };
    }

    const rootData = (createRes.data ?? {}) as Record<string, unknown>;
    const raw = (
      rootData?.items ??
      rootData?.item ??
      rootData?.data ??
      rootData
    ) as Record<string, unknown>;

    const grievanceId = Number(
      raw?.id ??
      raw?.Id ??
      raw?.grievanceApplicationId ??
      raw?.GrievanceApplicationId ??
      raw?.applicationId ??
      raw?.ApplicationId ??
      raw?.grievanceId ??
      raw?.GrievanceId ??
      rootData?.id ??
      rootData?.Id ??
      0
    );
    const grievanceNo = String(
      raw?.grievanceNo ??
      raw?.GrievanceNo ??
      raw?.token ??
      raw?.Token ??
      raw?.ticketNo ??
      raw?.TicketNo ??
      rootData?.grievanceNo ??
      rootData?.GrievanceNo ??
      ''
    );

    // 5. Track uploaded photo IDs if provided
    if (payload.photoIds && payload.photoIds.length > 0) {
      logger.info('Photos attached to grievance application', {
        photoCount: payload.photoIds.length,
        grievanceId,
      });
    }

    // 6. Immediately assign application to the selected officer
    if (grievanceId > 0 && payload.assignedOfficerUserId) {
      const assignRes = await adminGrievanceService.assignApplication(
        grievanceId,
        {
          assignedToUserId: payload.assignedOfficerUserId,
          remark: payload.initialRemark?.trim() || '',
        },
        token
      );

      if (!assignRes.success) {
        logger.warn('Immediate officer assignment failed after creation', {
          grievanceId,
          officerId: payload.assignedOfficerUserId,
          error: assignRes.message,
        });
      }
    }

    // 7. Invalidate complaint caches for fresh lists
    revalidatePath('/[locale]/grievance/complaints', 'page');
    revalidatePath('/[locale]/grievance/dashboard', 'page');

    const result: OnTheGoSubmissionResult = {
      grievanceId,
      grievanceNo,
      trackingToken: grievanceNo,
      assignedOfficerName: String(payload.assignedOfficerUserId),
      departmentName: String(payload.departmentId),
      submittedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: result,
      message: 'Grievance created and assigned successfully.',
    };
  } catch (error) {
    logger.error('submitOnTheGoGrievanceAction unexpected error', {
      error: (error as Error).message,
    });
    return {
      success: false,
      message: (error as Error).message || 'Server error while submitting grievance',
    };
  }
}
