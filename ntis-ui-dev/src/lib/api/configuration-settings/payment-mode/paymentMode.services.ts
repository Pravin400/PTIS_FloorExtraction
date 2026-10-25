import { apiClient } from "@/services/api.service";
import { PaymentMode, PaymentModeFormModel, PagedResponse } from "@/types/paymentMode.types";

const API_ENDPOINTS = {
    getAll: '/PaymentMode',
    create: '/PaymentMode',
    update: (id: number) => `/PaymentMode/${id}`,
    delete: (id: number) => `/PaymentMode/${id}`,
};

/**
 * Build query string from params
 */
function buildQueryString(params: Record<string, string | number>): string {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        query.append(key, String(value));
    });
    return query.toString();
}

interface ServiceResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Get Paged Payment Mode Masters (Server Side)
 * @param pageNumber - The current page number (1-indexed).
 * @param pageSize - Number of items per page.
 * @param searchTerm - Optional string to filter payment modes by code or name.
 * @returns A promise that resolves to a paged service result.
 */
export async function getPaymentModeMastersPagedServer(
    pageNumber: number,
    pageSize: number,
    searchTerm?: string
): Promise<ServiceResult<PagedResponse<PaymentMode>>> {
    const queryParams: Record<string, string | number> = {
        PageNumber: pageNumber,
        PageSize: pageSize,
    };

    if (searchTerm?.trim()) {
        queryParams.SearchTerm = searchTerm.trim();
    }

    const queryString = buildQueryString(queryParams);
    const response = await apiClient.get<PagedResponse<PaymentMode>>(
        `${API_ENDPOINTS.getAll}?${queryString}`
    );

    if (!response.success || !response.data) {
        return { success: false, error: response.error || "Failed to fetch payment modes" };
    }

    return { success: true, data: response.data };
}

/**
 * Create Payment Mode Master
 * @param data - The form data model for the new payment mode.
 * @param userId - The ID of the authenticated user creating the record.
 * @throws Error if the API request fails.
 */
export async function createPaymentModeMaster(data: PaymentModeFormModel, userId: number): Promise<void> {
    const payload = {
        id: 0,
        code: data.code,
        paymentModeName: data.paymentModeName,
        type: data.type,
        category: data.category,
        description: data.description,
        chargeType: data.chargeType,
        transactionCharge: data.transactionCharge === "" ? 0 : data.transactionCharge,
        isActive: data.isActive,
        createdBy: userId,
    };

    const response = await apiClient.post(
        API_ENDPOINTS.create,
        payload
    );

    if (!response.success) {
        throw new Error(response.error || "Failed to create payment mode");
    }
}

/**
 * Update Payment Mode Master
 * @param data - The form data model including the ID of the record to update.
 * @param userId - The ID of the authenticated user updating the record.
 * @throws Error if the API request fails or if ID is missing.
 */
export async function updatePaymentModeMaster(data: PaymentModeFormModel, userId: number): Promise<void> {
    if (!data.id) throw new Error("Payment Mode ID is required for update");

    const payload = {
        id: data.id,
        code: data.code,
        paymentModeName: data.paymentModeName,
        type: data.type,
        category: data.category,
        description: data.description,
        chargeType: data.chargeType,
        transactionCharge: data.transactionCharge === "" ? 0 : data.transactionCharge,
        isActive: data.isActive,
        updatedBy: userId,
    };

    const response = await apiClient.put(
        API_ENDPOINTS.update(data.id),
        payload
    );

    if (!response.success) {
        throw new Error(response.error || "Failed to update payment mode");
    }
}

/**
 * Delete Payment Mode Master
 * @param id - The ID of the payment mode to delete.
 * @throws Error if the API request fails.
 */
export async function deletePaymentModeMaster(id: number): Promise<void> {
    const response = await apiClient.delete(
        API_ENDPOINTS.delete(id)
    );

    if (!response.success) {
        throw new Error(response.error || `Failed to delete payment mode ${id}`);
    }
}

