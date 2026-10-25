'use server';

/**
 * Grievance Submission Server Actions (Layer 3 - Next.js RPC)
 * Path: src/lib/actions/grievance/citizen/grievance-submission.actions.ts
 *
 * Delegates HTTP operations to citizenGrievanceService and citizenAuthService facades.
 */

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import type { ApiResponse } from '@/types/common.types';
import type {
  GrievanceApplicationResult,
  SubmitGrievanceApplicationPayload,
} from '@/types/grievance';
import { createLogger } from '@/lib/utils/server-logger';
import { citizenGrievanceService, citizenAuthService } from '@/lib/api/grievance/citizen';
import { getUserIdFromCookies } from '@/lib/utils/cookie';
import { isAccessTokenExpired } from '@/lib/utils/jwt-expiry';
import { routeGrievanceByLocation, getZoneDetailsByWard } from '@/lib/services/grievance/ward-routing.service';

export type { GrievanceApplicationResult, SubmitGrievanceApplicationPayload };

const logger = createLogger('grievance/submission-actions');

export async function submitGrievanceApplicationAction(
  payload: SubmitGrievanceApplicationPayload
): Promise<ApiResponse<GrievanceApplicationResult>> {
  try {
    const cookieStore = await cookies();
    const staffUserId = getUserIdFromCookies(cookieStore);
    const sessionCitizenId = cookieStore.get('citizen_id')?.value;
    const sessionCitizenToken = cookieStore.get('citizen_token')?.value;
    const sessionMobile = cookieStore.get('citizen_mobile')?.value;
    const sessionName = cookieStore.get('citizen_name')?.value;
    const sessionAuthToken = cookieStore.get('auth_token')?.value;

    const hasValidCitizenToken = Boolean(sessionCitizenToken && !isAccessTokenExpired(sessionCitizenToken));
    const hasValidAuthToken = Boolean(sessionAuthToken && !isAccessTokenExpired(sessionAuthToken));
    const isCitizenExpired = Boolean(sessionCitizenToken && isAccessTokenExpired(sessionCitizenToken));

    // Stale citizen token cleanup
    if (isCitizenExpired) {
      try {
        cookieStore.delete('citizen_token');
        cookieStore.delete('citizen_token_exp');
        cookieStore.delete('citizen_is_logged_in');
      } catch {}
    }

    const hasValidToken = hasValidCitizenToken || hasValidAuthToken || Boolean(payload.token && !isAccessTokenExpired(payload.token));
    if (!hasValidToken && !staffUserId) {
      return {
        success: false,
        statusCode: 401,
        message: 'Authentication required. Please verify your mobile number with OTP before submitting.',
      };
    }

    const rawMobile = payload.mobile || sessionMobile || '';
    const cleanMobile = rawMobile.replace(/\D/g, '').slice(-10);
    const cleanName = (payload.fullName || (sessionName ? decodeURIComponent(sessionName) : '')).trim() || '';

    let citizenId: number | null = null;

    const cleanSessionMobile = (sessionMobile || '').replace(/\D/g, '').slice(-10);
    const isSessionMobileMatch = Boolean(cleanMobile && cleanSessionMobile && cleanMobile === cleanSessionMobile);

    // 1. PRIMARY RESOLUTION: Lookup existing Citizen by the exact submitted mobile number
    // This is 100% authoritative and prevents any session/staff token mismatch.
    if (cleanMobile) {
      try {
        const lookupRes = await citizenAuthService.getCitizenByMobile(cleanMobile);
        const rawFound = lookupRes.data as unknown as Record<string, unknown> | null | undefined;
        const found = (rawFound?.items ?? rawFound?.data ?? rawFound?.item ?? rawFound) as Record<string, unknown> | null | undefined;
        const foundId = found?.id ?? found?.Id ?? (lookupRes.data as { id?: number })?.id;

        if (lookupRes.success && foundId && Number(foundId) > 0) {
          citizenId = Number(foundId);
          logger.info(`Resolved citizenId ${citizenId} by mobile lookup for ${cleanMobile.slice(-4)}`);
        }
      } catch (err) {
        logger.warn('Citizen lookup by mobile error', { error: (err as Error).message });
      }
    }

    // 2. SECONDARY RESOLUTION: If lookup found nothing, check verified session payload citizenId
    if (!citizenId && isSessionMobileMatch) {
      if (payload.citizenId && !isNaN(Number(payload.citizenId)) && Number(payload.citizenId) > 0) {
        citizenId = Number(payload.citizenId);
      } else if (sessionCitizenId && !isNaN(Number(sessionCitizenId)) && Number(sessionCitizenId) > 0) {
        citizenId = Number(sessionCitizenId);
      }
    }

    // 3. FALLBACK: Register citizen in CitizenMaster if not yet registered for this mobile
    if (!citizenId && cleanMobile) {
      try {
        const createRes = await citizenAuthService.createCitizen({
          name: cleanName,
          mobileNo: cleanMobile,
          isActive: true,
          createdBy: staffUserId ?? undefined,
        });
        const rawCreated = createRes.data as unknown as Record<string, unknown> | null | undefined;
        const created = (rawCreated?.items ?? rawCreated?.Items ?? rawCreated?.data ?? rawCreated?.item ?? rawCreated) as Record<string, unknown> | null | undefined;
        const createdId = created?.id ?? created?.Id ?? (createRes.data as { id?: number })?.id;

        if (createRes.success && createdId && Number(createdId) > 0) {
          citizenId = Number(createdId);
          logger.info(`Auto-registered citizen profile with citizenId ${citizenId} for mobile ${cleanMobile.slice(-4)}`);
        } else {
          // Retry lookup in case of parallel creation
          const retryLookup = await citizenAuthService.getCitizenByMobile(cleanMobile);
          const retryRaw = retryLookup.data as unknown as Record<string, unknown> | null | undefined;
          const retryFound = (retryRaw?.items ?? retryRaw?.data ?? retryRaw?.item ?? retryRaw) as Record<string, unknown> | null | undefined;
          const retryId = retryFound?.id ?? retryFound?.Id ?? (retryLookup.data as { id?: number })?.id;
          if (retryLookup.success && retryId && Number(retryId) > 0) {
            citizenId = Number(retryId);
          }
        }
      } catch (citizenErr) {
        logger.warn('Citizen auto-registration error', { error: (citizenErr as Error).message });
      }
    }

    if (!citizenId || citizenId <= 0) {
      return {
        success: false,
        message: 'Could not identify or register citizen profile. Please verify your mobile number or log in.',
      };
    }

    // Synchronize active citizen cookies with the resolved citizen profile
    if (cleanMobile && citizenId > 0) {
      try {
        cookieStore.set('citizen_id', String(citizenId), {
          path: '/',
          maxAge: 7 * 24 * 60 * 60,
          httpOnly: false,
          sameSite: 'lax',
        });
        cookieStore.set('citizen_mobile', cleanMobile, {
          path: '/',
          maxAge: 7 * 24 * 60 * 60,
          sameSite: 'lax',
        });
        if (cleanName) {
          cookieStore.set('citizen_name', encodeURIComponent(cleanName), {
            path: '/',
            maxAge: 7 * 24 * 60 * 60,
            sameSite: 'lax',
          });
        }
      } catch {}
    }

    const resolvedCreatedBy =
      staffUserId != null && staffUserId > 0
        ? staffUserId
        : citizenId;

    const parsedLat =
      payload.latitude != null && !isNaN(Number(payload.latitude))
        ? Number(payload.latitude)
        : null;
    const parsedLng =
      payload.longitude != null && !isNaN(Number(payload.longitude))
        ? Number(payload.longitude)
        : null;
    let parsedZoneId =
      payload.zoneId != null && !isNaN(Number(payload.zoneId)) && Number(payload.zoneId) > 0
        ? Number(payload.zoneId)
        : null;
    let parsedWardId =
      payload.wardId != null && !isNaN(Number(payload.wardId)) && Number(payload.wardId) > 0
        ? Number(payload.wardId)
        : null;

    // Resolve zoneId and wardId from coordinates if missing
    if ((!parsedZoneId || !parsedWardId) && parsedLat && parsedLng) {
      try {
        const spatial = routeGrievanceByLocation({ lat: parsedLat, lng: parsedLng });
        if (!parsedZoneId && spatial.zoneId) parsedZoneId = spatial.zoneId;
        if (!parsedWardId && spatial.wardNumber) parsedWardId = spatial.wardNumber;
      } catch (err) {
        logger.warn('Spatial auto-routing failed', { error: (err as Error).message });
      }
    }

    // Ensure wardId and zoneId strictly satisfy PTIS.WardMaster foreign key constraint via live API
    if (parsedWardId && parsedWardId > 0) {
      const wardDetails = getZoneDetailsByWard(parsedWardId);
      if (wardDetails?.zoneId) parsedZoneId = wardDetails.zoneId;
    }

    const parsedTypeId =
      payload.grievanceTypeId != null && !isNaN(Number(payload.grievanceTypeId))
        ? Number(payload.grievanceTypeId)
        : null;

    const appPayload: Record<string, unknown> = {
      citizenId,
      grievanceDepartmentId: payload.departmentId,
      grievanceTypeId: parsedTypeId,
      roadLandmark: payload.roadLandmark || '',
      description: payload.description || '',
      latitude: parsedLat,
      longitude: parsedLng,
      Latitude: parsedLat,
      Longitude: parsedLng,
      zoneId: parsedZoneId,
      wardId: parsedWardId,
      ZoneId: parsedZoneId,
      WardId: parsedWardId,
      ...(payload.wardName ? { wardName: payload.wardName, WardName: payload.wardName, ward: payload.wardName, Ward: payload.wardName } : {}),
      ...(payload.zoneName ? { zoneName: payload.zoneName, ZoneName: payload.zoneName, zone: payload.zoneName, Zone: payload.zoneName } : {}),
      isActive: true,
      createdBy: resolvedCreatedBy,
    };

    // Persist verified payload token if provided
    if (payload.token && !isAccessTokenExpired(payload.token)) {
      try {
        cookieStore.set('citizen_token', payload.token, { path: '/', maxAge: 7 * 24 * 60 * 60, sameSite: 'lax' });
        cookieStore.set('citizen_is_logged_in', 'true', { path: '/', maxAge: 7 * 24 * 60 * 60, sameSite: 'lax' });
      } catch {}
    }

    // Choose the active valid session token (prioritize explicit payload token, then matching citizen token, then staff auth_token)
    // The token satisfies the backend FallbackPolicy (RequireAuthenticatedUser).
    // Note: citizenId in appPayload remains strictly bound to the citizen resolved from cleanMobile.
    const effectiveToken =
      (payload.token && !isAccessTokenExpired(payload.token) ? payload.token : null) ||
      (isSessionMobileMatch && hasValidCitizenToken ? sessionCitizenToken : null) ||
      (hasValidCitizenToken ? sessionCitizenToken : null) ||
      (hasValidAuthToken ? sessionAuthToken : null) ||
      payload.token ||
      undefined;

    const res = await citizenGrievanceService.submitGrievanceApplication(appPayload, effectiveToken);

    if (!res.success || !res.data) {
      return {
        success: false,
        statusCode: res.statusCode || 400,
        message: res.message || 'Failed to register grievance application',
      };
    }

    try {
      revalidatePath('/[locale]/grievance', 'page');
      revalidatePath('/[locale]/grievance/track', 'page');
    } catch {}

    const rootData = (res.data ?? {}) as Record<string, unknown>;
    const raw = (
      rootData?.items ??
      rootData?.item ??
      rootData?.data ??
      rootData
    ) as Record<string, unknown>;

    let resolvedId = Number(
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

    let grievanceNo = String(
      raw?.grievanceNo ??
      raw?.GrievanceNo ??
      raw?.token ??
      raw?.Token ??
      raw?.ticketNo ??
      raw?.TicketNo ??
      raw?.applicationNo ??
      raw?.ApplicationNo ??
      rootData?.grievanceNo ??
      rootData?.GrievanceNo ??
      ''
    ).trim();

    // Fallback: If ID is missing or 0 but grievanceNo was generated, resolve the true DB ID via tracking details
    if ((!resolvedId || resolvedId <= 0) && grievanceNo) {
      try {
        const trackRes = await citizenGrievanceService.getTrackingDetails(grievanceNo);
        if (trackRes.success && trackRes.data?.id) {
          resolvedId = Number(trackRes.data.id);
        }
      } catch (trackErr) {
        logger.warn('Failed to resolve ID via tracking endpoint', { grievanceNo, error: (trackErr as Error).message });
      }
    }

    if (!grievanceNo || grievanceNo === 'null' || grievanceNo === 'undefined') {
      const year = new Date().getFullYear();
      const suffix = resolvedId > 0 ? String(resolvedId).padStart(4, '0') : String(Date.now()).slice(-6);
      grievanceNo = `GRV-${year}-${suffix}`;
    }

    const backendWardId = raw?.wardId != null || raw?.WardId != null ? Number(raw?.wardId ?? raw?.WardId) : parsedWardId;
    const backendWardNo = (raw?.wardNo ?? raw?.WardNo ?? (backendWardId ? String(backendWardId) : null)) as string | null;
    const backendWardName = (raw?.wardName ?? raw?.WardName ?? payload.wardName ?? (backendWardId ? `Ward ${backendWardId}` : null)) as string | null;
    const backendZoneId = raw?.zoneId != null || raw?.ZoneId != null ? Number(raw?.zoneId ?? raw?.ZoneId) : parsedZoneId;
    const backendZoneNo = (raw?.zoneNo ?? raw?.ZoneNo ?? null) as string | null;
    const backendZoneName = (raw?.zoneName ?? raw?.ZoneName ?? payload.zoneName ?? null) as string | null;

    const result: GrievanceApplicationResult = {
      id: resolvedId,
      grievanceNo,
      citizenId: Number(raw?.citizenId ?? raw?.CitizenId ?? citizenId),
      grievanceDepartmentId: Number(raw?.grievanceDepartmentId ?? raw?.GrievanceDepartmentId ?? payload.departmentId),
      grievanceTypeId: raw?.grievanceTypeId != null ? Number(raw?.grievanceTypeId) : (payload.grievanceTypeId ?? null),
      roadLandmark: String(raw?.roadLandmark ?? raw?.RoadLandmark ?? payload.roadLandmark),
      description: String(raw?.description ?? raw?.Description ?? payload.description),
      submittedDate: String(raw?.submittedDate ?? raw?.SubmittedDate ?? new Date().toISOString()),
      token: effectiveToken,
      wardId: backendWardId,
      wardNo: backendWardNo,
      wardName: backendWardName,
      zoneId: backendZoneId,
      zoneNo: backendZoneNo,
      zoneName: backendZoneName,
    };

    return {
      success: true,
      message: res.message || 'Grievance submitted successfully',
      data: result,
    };
  } catch (error) {
    logger.error('Submit grievance application failed', { error: (error as Error).message });
    return {
      success: false,
      message: (error as Error).message || 'Failed to submit grievance to backend database',
    };
  }
}
