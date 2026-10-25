import { apiClient } from '@/services/api.service';
import type { UserScreenAccess } from '@/types/user-screen-access.types';
import type { ApiResponse } from '@/types/common.types';

function authHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

class UserScreenAccessService {
  /**
   * Menu/screens for a specific user (preferred for sidebar).
   * Primary: GET /api/users/{userId}/screens (returns all accessible screens without pagination limit)
   * Fallback: GET /api/users/access?UserId={userId} (paginated, with multi-page handling)
   */
  async getScreensForUser(userId: number, token?: string): Promise<ApiResponse<UserScreenAccess[]>> {
    // 1. Try dedicated unpaginated user screens endpoint (/users/{userId}/screens)
    try {
      const userScreensResponse = await apiClient.get<unknown>(`/users/${userId}/screens`, {
        headers: authHeaders(token),
      });

      if (userScreensResponse.success && userScreensResponse.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = userScreensResponse.data as any;
        const screens = Array.isArray(data) ? data : (data.items || data.data || data.result || []);
        if (screens.length > 0) {
          return {
            ...userScreensResponse,
            data: screens as UserScreenAccess[],
          };
        }
      }
    } catch {
      // Fallback to /users/access below
    }

    // 2. Fallback to /users/access (which has a server-side MaxPageSize=100 limit, so handle all pages resiliently)
    const response = await apiClient.get<unknown>(`/users/access?UserId=${userId}&PageSize=100&PageNumber=1`, {
      headers: authHeaders(token),
    });

    if (response.success && response.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = response.data as any;
      const firstPageScreens: UserScreenAccess[] = Array.isArray(data) ? data : (data.items || data.data || data.result || []);

      // Deduplicate screens by unique screenCode or routePath per department
      const screenMap = new Map<string, UserScreenAccess>();
      const addScreensToMap = (items: UserScreenAccess[]) => {
        for (const s of items) {
          const key = s.screenCode
            ? `${s.departmentId ?? 'global'}_${s.screenCode}`
            : `${s.departmentId ?? 'global'}_${s.routePath || s.screenName}`;
          if (!screenMap.has(key)) {
            screenMap.set(key, s);
          }
        }
      };

      addScreensToMap(firstPageScreens);

      const totalPages = Math.min(Number(data.totalPages || 1), 50); // Safe upper bound of 5,000 screens
      if (totalPages > 1) {
        // Fetch remaining pages in controlled concurrent batches of 4 to avoid socket congestion
        const remainingPageNumbers: number[] = [];
        for (let p = 2; p <= totalPages; p++) {
          remainingPageNumbers.push(p);
        }

        const BATCH_SIZE = 4;
        for (let i = 0; i < remainingPageNumbers.length; i += BATCH_SIZE) {
          const batch = remainingPageNumbers.slice(i, i + BATCH_SIZE);
          const batchPromises = batch.map((p) =>
            apiClient.get<unknown>(`/users/access?UserId=${userId}&PageSize=100&PageNumber=${p}`, {
              headers: authHeaders(token),
            })
          );

          const settledResults = await Promise.allSettled(batchPromises);
          for (const res of settledResults) {
            if (res.status === 'fulfilled' && res.value.success && res.value.data) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const epData = res.value.data as any;
              const epItems: UserScreenAccess[] = Array.isArray(epData) ? epData : (epData.items || epData.data || epData.result || []);
              addScreensToMap(epItems);
            }
          }
        }
      }

      return {
        ...response,
        data: Array.from(screenMap.values()),
      };
    }

    return response as ApiResponse<UserScreenAccess[]>;
  }

  /** Legacy: screens by role id */
  async getRoleScreens(roleId: number, token?: string): Promise<ApiResponse<UserScreenAccess[]>> {
    return apiClient.get<UserScreenAccess[]>(`/UserScreenAccess/role/${roleId}`, {
      headers: authHeaders(token),
    });
  }
}

export const userScreenAccessService = new UserScreenAccessService();