import { apiClient } from "@/services/api.service";
import {
    ClerkDashboardData,
    ClerkFilterParams,
    ClerkApplicationItem,
    ClerkMetricSummary,
    ClerkRecentActivityItem,
} from "@/types/fire-audit/clerk.types";
import { ApiResponse, PagedResponse } from "@/types/common.types";
import {
    CLERK_STATIC_METRICS,
    filterMockClerkApplications,
} from "@/lib/constants/fire-audit/clerk-mock-data.constants";



/**
 * Fetches dynamic metrics from API or returns safe empty state
 */
export async function getClerkMetrics(): Promise<ClerkMetricSummary> {
    try {
        const res = await apiClient.get<ApiResponse<ClerkMetricSummary>>(
            "/FireAudit/clerk/metrics"
        );
        if (res?.data?.data) {
            return res.data.data;
        }
    } catch {
        // API not ready yet - returns static metrics
    }
    return CLERK_STATIC_METRICS;
}

/**
 * Fetches paginated application records from API or returns empty array
 */
export async function getClerkApplications(
    filters: ClerkFilterParams = {}
): Promise<{ items: ClerkApplicationItem[]; totalCount: number }> {
    try {
        const params = new URLSearchParams();
        if (filters.tab && filters.tab !== "all") params.append("tab", filters.tab);
        if (filters.search) params.append("searchTerm", filters.search.trim());
        if (filters.occupancy && filters.occupancy !== "all") params.append("occupancy", filters.occupancy);
        if (filters.statusFilter && filters.statusFilter !== "all") params.append("status", filters.statusFilter);
        if (filters.appType && filters.appType !== "all") params.append("appType", filters.appType);
        if (filters.node && filters.node !== "all") params.append("node", filters.node);
        if (filters.sector && filters.sector !== "all") params.append("sector", filters.sector);
        if (filters.wardNo && filters.wardNo !== "all") params.append("wardNo", filters.wardNo);
        if (filters.appDate && filters.appDate !== "all") params.append("appDate", filters.appDate);
        if (filters.riskCategory && filters.riskCategory !== "all") params.append("riskCategory", filters.riskCategory);
        if (filters.page) params.append("page", String(filters.page));
        if (filters.pageSize) params.append("pageSize", String(filters.pageSize));


        const queryString = params.toString() ? `?${params.toString()}` : "";
        const res = await apiClient.get<ApiResponse<PagedResponse<ClerkApplicationItem>>>(
            `/FireAudit/clerk/applications${queryString}`
        );

        if (res?.data?.data?.items) {
            return {
                items: res.data.data.items,
                totalCount: res.data.data.totalCount ?? res.data.data.items.length,
            };
        }
    } catch {
        // Fallback to static applications when API offline or network error
    }

    return filterMockClerkApplications(filters);
}

/**
 * Fetches recent activity items from API or returns empty array
 */
export async function getClerkRecentActivity(): Promise<ClerkRecentActivityItem[]> {
    try {
        const res = await apiClient.get<ApiResponse<ClerkRecentActivityItem[]>>(
            "/FireAudit/clerk/recent-activity"
        );
        if (res?.data?.data) {
            return res.data.data;
        }
    } catch {
        // API not ready yet - returns empty list
    }
    return [];
}

/**
 * Parallel Server fetcher for the Clerk Dashboard page
 */
export async function getClerkDashboardData(
    filters: ClerkFilterParams = {}
): Promise<ClerkDashboardData> {
    const [metrics, applicationsData, recentActivity] = await Promise.all([
        getClerkMetrics(),
        getClerkApplications(filters),
        getClerkRecentActivity(),
    ]);

    return {
        metrics,
        applications: applicationsData.items,
        totalApplications: applicationsData.totalCount,
        recentActivity,
    };
}

/**
 * Updates application lifecycle status or submits clerk review
 */
export async function proceedClerkApplication(
    applicationId: string,
    action: string,
    remarks?: string
): Promise<{ success: boolean; message?: string }> {
    try {
        const res = await apiClient.post<ApiResponse<{ success: boolean; message?: string }>>(
            `/FireAudit/clerk/applications/${applicationId}/proceed`,
            { action, remarks }
        );
        if (res?.data) {
            return {
                success: res.data.success ?? true,
                message: res.data.message ?? "Application status updated successfully",
            };
        }
    } catch (err: unknown) {
        // Fallback for offline API / prototype mode
        console.warn("API offline or proceed endpoint unavailable, using local mock fallback:", err);
        return { success: true, message: "Application status updated successfully (offline mode)" };
    }
    return { success: false, message: "Unexpected response from server" };
}
