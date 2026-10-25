'use server';

/**
 * Grievance Tracking Server Actions (Layer 2 - Next.js RPC)
 * Path: src/lib/actions/grievance/citizen/track-grievance.actions.ts
 *
 * Delegates all HTTP and data mapping to citizenGrievanceService.
 */

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { locales } from '@/i18n/config';
import type { ApiResponse } from '@/types/common.types';
import type {
  TrackingTicket,
  GrievanceTrackingDetailsDto,
  UpdateGrievancePayload,
  GrievanceKpiMetrics,
} from '@/types/grievance/tracking.types';
import type { Grievance } from '@/types/grievance';
import type { PublicGrievanceApplication } from '@/types/grievance/public-dashboard.types';
import { citizenGrievanceService } from '@/lib/api/grievance/citizen/citizen-grievance.service';
import { publicDashboardService } from '@/lib/api/grievance/citizen/public-dashboard.service';
import { citizenAuthService } from '@/lib/api/grievance/citizen/citizen-auth.service';
import { getUserIdFromCookies } from '@/lib/utils/cookie';

export async function trackGrievanceDetailsAction(
  grievanceNo: string,
  mobileNo?: string
): Promise<ApiResponse<GrievanceTrackingDetailsDto>> {
  const cookieStore = await cookies();
  const sessionMobile = cookieStore.get('citizen_mobile')?.value;
  const res = await citizenGrievanceService.getTrackingDetails(grievanceNo, mobileNo || sessionMobile);
  if (!res.success || !res.data) {
    return {
      success: false,
      message: res.message || `No grievance details found for "${grievanceNo}"`,
    };
  }
  return {
    success: true,
    data: res.data,
    message: res.message || 'Grievance tracking details fetched successfully',
  };
}

export async function trackGrievanceTicketAction(
  grievanceNo: string,
  mobileNo?: string
): Promise<ApiResponse<TrackingTicket>> {
  const cookieStore = await cookies();
  const sessionMobile = cookieStore.get('citizen_mobile')?.value;
  const sessionNameRaw = cookieStore.get('citizen_name')?.value;
  const sessionName = sessionNameRaw ? decodeURIComponent(sessionNameRaw).trim() : undefined;

  const res = await citizenGrievanceService.trackTicket(grievanceNo, mobileNo || sessionMobile);
  if (!res.success || !res.data) {
    return {
      success: false,
      message: res.message || 'Tracking ticket not found',
    };
  }

  const ticket = res.data;
  // Restore unmasked citizen name if backend returned masked string like "A****g"
  if (sessionName && (!ticket.citizenName || ticket.citizenName.includes('*'))) {
    ticket.citizenName = sessionName;
  }
  // Restore unmasked 10-digit mobile number if backend returned masked "XXXXXX1554"
  if (sessionMobile && (!ticket.citizenMobile || ticket.citizenMobile.includes('*') || ticket.citizenMobile.replace(/\D/g, '').length < 10)) {
    ticket.citizenMobile = sessionMobile.replace(/\D/g, '').slice(-10);
  }

  return {
    success: true,
    data: ticket,
    message: res.message,
  };
}

export async function trackGrievanceDomainAction(
  grievanceNo: string,
  mobileNo?: string
): Promise<ApiResponse<Grievance>> {
  const res = await citizenGrievanceService.getGrievanceByTicket(grievanceNo, mobileNo);
  if (!res.success || !res.data) {
    return {
      success: false,
      data: undefined as unknown as Grievance,
      message: res.message || 'Grievance not found',
    };
  }
  return {
    success: true,
    data: res.data,
    message: res.message,
  };
}

export async function fetchAllGrievanceApplicationsAction(
  pageSize: number = 50,
  overrideCitizenId?: number | string,
  overrideToken?: string
): Promise<ApiResponse<TrackingTicket[]>> {
  try {
    const cookieStore = await cookies();
    const explicitCitizenToken = overrideToken || cookieStore.get('citizen_token')?.value;
    const citizenToken = explicitCitizenToken || cookieStore.get('auth_token')?.value;
    const cookieCitizenId = cookieStore.get('citizen_id')?.value;

    const isNumericId = (id: unknown): boolean =>
      id != null && !isNaN(Number(id)) && Number(id) > 0;

    let targetCitizenId = isNumericId(overrideCitizenId)
      ? String(overrideCitizenId)
      : isNumericId(cookieCitizenId)
        ? String(cookieCitizenId)
        : undefined;

    // Fallback 1: Extract citizen ID from JWT token claims (ONLY for genuine citizen tokens, never staff auth_token)
    if (!targetCitizenId && explicitCitizenToken) {
      try {
        const payloadBase64 = explicitCitizenToken.split('.')[1];
        if (payloadBase64) {
          const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
          const jwtId =
            payload?.nameid ||
            payload?.sub ||
            payload?.citizenId ||
            payload?.CitizenId ||
            payload?.id;
          if (isNumericId(jwtId)) {
            targetCitizenId = String(jwtId);
          }
        }
      } catch {}
    }

    // Fallback 2: Lookup citizen ID from active citizen_mobile session
    if (!targetCitizenId) {
      const citizenMobile = cookieStore.get('citizen_mobile')?.value;
      if (citizenMobile) {
        try {
          const profileRes = await citizenAuthService.getCitizenByMobile(citizenMobile);
          const rawProfile = profileRes.data as unknown as Record<string, unknown> | null | undefined;
          const found = (rawProfile?.items ?? rawProfile?.data ?? rawProfile?.item ?? rawProfile) as Record<string, unknown> | null | undefined;
          const foundId = found?.id ?? found?.Id ?? (profileRes.data as { id?: number })?.id;
          if (isNumericId(foundId)) {
            targetCitizenId = String(foundId);
          }
        } catch {}
      }
    }

    return await citizenGrievanceService.fetchGrievanceApplications({
      pageSize,
      citizenId: targetCitizenId,
      token: citizenToken,
    });
  } catch (error) {
    return {
      success: false,
      data: [],
      message: (error as Error).message || 'Failed to fetch grievance applications',
    };
  }
}

export async function updateGrievanceApplicationAction(
  id: number | string,
  payload: UpdateGrievancePayload
): Promise<ApiResponse<boolean>> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    // Public citizens do not exist in internal AUTH.UserMaster; UpdatedBy must be null
    const resolvedUpdatedBy = payload.updatedBy ?? userId ?? null;

    const token =
      cookieStore.get('citizen_token')?.value ||
      cookieStore.get('auth_token')?.value;

    const res = await citizenGrievanceService.updateGrievanceApplication(
      id,
      {
        ...payload,
        updatedBy: resolvedUpdatedBy,
      },
      token
    );
    if (res.success) {
      try {
        revalidatePath('/[locale]/grievance', 'page');
        revalidatePath('/[locale]/grievance/track', 'page');
      } catch {
        // Ignore cache revalidation errors outside request context
      }
    }
    return res;
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message || 'Failed to update grievance',
      data: false,
    };
  }
}

export async function fetchGrievanceKpiMetricsAction(): Promise<ApiResponse<GrievanceKpiMetrics>> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('citizen_token')?.value || cookieStore.get('auth_token')?.value;
    return await citizenGrievanceService.fetchKpiMetrics(token);
  } catch (error) {
    return {
      success: false,
      data: { total: 0, pending: 0, inProgress: 0, resolved: 0 },
      message: (error as Error).message || 'Failed to fetch grievance metrics',
    };
  }
}

export async function fetchPublicGrievancesAction(): Promise<ApiResponse<PublicGrievanceApplication[]>> {
  try {
    return await publicDashboardService.getPublicApplications();
  } catch (error) {
    return {
      success: false,
      data: [],
      message: (error as Error).message || 'Failed to fetch public grievances',
    };
  }
}

export async function deleteGrievanceApplicationAction(
  id: number | string
): Promise<ApiResponse<boolean>> {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get('citizen_token')?.value ||
      cookieStore.get('auth_token')?.value;

    if (!token) {
      return {
        success: false,
        data: false,
        message: 'Unauthorized: Session token missing or expired',
      };
    }

    const res = await citizenGrievanceService.deleteGrievanceApplication(id, token);
    if (res.success) {
      for (const locale of locales) {
        revalidatePath(`/${locale}/grievance/track`, 'page');
        revalidatePath(`/${locale}/grievance/workbench`, 'page');
      }
    }
    return res;
  } catch (error) {
    return {
      success: false,
      data: false,
      message: (error as Error).message || 'Failed to delete grievance application',
    };
  }
}


