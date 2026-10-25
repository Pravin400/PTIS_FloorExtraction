'use server';
 
/**
 * Tax Calculation Guideline – Server Actions & API Service Layer
 * Handles GET, POST and PUT operations against the backend tax guideline endpoint.
 *
 * Endpoints:
 *   GET  /api/CertificateTaxGuideline?pageSize=-1    → fetch all guideline rows
 *   POST /api/CertificateTaxGuideline                → create a single new row
 *   PUT  /api/CertificateTaxGuideline/{id}           → update a single row by PK
 *   PUT  /api/CertificateTaxGuideline/bulk           → bulk-upsert all rows from the UI form
 */
 
import { apiClient } from '@/services/api.service';
import { ApiError } from '@/lib/utils/api';
import type { ApiResponse, PagedResponse } from '@/types/common.types';
import type {
  TaxCalculationGuidelineDto,
  TaxCalculationGuidelineFormData,
} from '@/types/tax-calculation-guideline.types';
import { mapFormDataToDto } from '@/lib/api/configuration-settings/tax-calculation-guideline/tax-calculation-guideline.mapper';
 
const ENDPOINT = 'CertificateTaxGuideline';
const CONTEXT = 'Tax Calculation Guideline';
 
// ─── Shape expected by UpdateCertificateTaxGuidelineDto on the backend ────────
 
interface UpdateCertificateTaxGuidelinePayload {
  id?: number;
  guidelineCode: string;
  guidelineName: string;
  description?: string | null;
  guidelineGroup?: string | null;
  displayOrder: number;          // NOT NULL in DB — always required
  dataType: string;
  guidelineValue?: string | null;
  allowedValues?: string | null;
  isActive?: boolean;
}
 
/**
 * Map a frontend DTO to the slim update payload shape the backend expects.
 * Fallback defaults ensure required fields are never empty.
 */
function toUpdatePayload(item: TaxCalculationGuidelineDto): UpdateCertificateTaxGuidelinePayload {
  return {
    id: item.id,
    guidelineCode: item.guidelineCode ?? '',
    guidelineName: item.guidelineName ?? item.guidelineCode ?? '',
    description: item.description ?? null,
    guidelineGroup: item.guidelineGroup ?? null,
    // DB column is NOT NULL — fall back to 999 so bulk-update never sends NULL
    displayOrder: item.displayOrder ?? 999,
    dataType: item.dataType ?? 'VARCHAR',
    guidelineValue: item.guidelineValue ?? null,
    allowedValues: item.allowedValues ?? null,
    isActive: item.isActive !== false,
  };
}
 
// ─── Public API Functions ─────────────────────────────────────────────────────
 
/**
 * Fetch the current tax calculation guideline configuration.
 * Returns the full list as an array (dynamic guideline mode).
 * Returns `null` when no records exist yet.
 */
export async function getTaxCalculationGuideline(): Promise<TaxCalculationGuidelineDto | TaxCalculationGuidelineDto[] | null> {
  const response = await apiClient.get<PagedResponse<TaxCalculationGuidelineDto>>(`${ENDPOINT}?pageSize=-1`);
  if (!response.success) {
    if (response.statusCode === 404) return null;
    throw new ApiError(
      response.statusCode ?? 500,
      response.error ?? 'Unknown error',
      `Failed to fetch ${CONTEXT}`
    );
  }
  const items = response.data?.items ?? [];
  if (items.length > 1 || (items.length === 1 && items[0].guidelineCode && items[0].guidelineValue !== undefined)) {
    return items;
  }
  return items[0] ?? null;
}
 
/**
 * Create a new tax calculation guideline row (single).
 */
export async function createTaxCalculationGuideline(
  payload: TaxCalculationGuidelineDto
): Promise<TaxCalculationGuidelineDto> {
  const response = await apiClient.post<TaxCalculationGuidelineDto>(ENDPOINT, toUpdatePayload(payload));
  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error ?? 'Unknown error',
      `Failed to create ${CONTEXT}`
    );
  }
  return response.data;
}
 
/**
 * Update a single tax calculation guideline row by its primary key Id.
 * Endpoint: PUT /api/CertificateTaxGuideline/{id}
 */
export async function updateTaxCalculationGuideline(
  id: number,
  payload: TaxCalculationGuidelineDto
): Promise<TaxCalculationGuidelineDto> {
  const response = await apiClient.put<TaxCalculationGuidelineDto>(`${ENDPOINT}/${id}`, toUpdatePayload(payload));
  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error ?? 'Unknown error',
      `Failed to update ${CONTEXT}`
    );
  }
  return response.data;
}
 
/**
 * Bulk-upsert all guideline rows from the UI form in a single transaction.
 * Endpoint: PUT /api/CertificateTaxGuideline/bulk
 *
 * - Sends all rows with a GuidelineCode (the backend upserts by GuidelineCode and may create missing rows).
 * - The backend matches by GuidelineCode and updates or creates accordingly.
 */
export async function bulkUpdateTaxCalculationGuidelines(
  items: TaxCalculationGuidelineDto[]
): Promise<TaxCalculationGuidelineDto[]> {
  // Only send items that are real DB rows (have an id) to avoid duplicating seeded fallbacks
  const payload = items
    .filter((item) => item.guidelineCode)
    .map(toUpdatePayload);
 
  const response = await apiClient.put<TaxCalculationGuidelineDto[]>(`${ENDPOINT}/bulk`, payload);
  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error ?? 'Unknown error',
      `Failed to bulk-update ${CONTEXT}`
    );
  }
  return response.data;
}
 
/**
 * Upsert (create or update) the tax calculation guideline configuration.
 *
 * - Array payload  → PUT /api/CertificateTaxGuideline/bulk  (full form save)
 * - Single payload → PUT /api/CertificateTaxGuideline/{id}  (if id present)
 *                 → POST /api/CertificateTaxGuideline        (if new)
 */
export async function saveTaxCalculationGuideline(
  payload: TaxCalculationGuidelineDto | TaxCalculationGuidelineDto[]
): Promise<TaxCalculationGuidelineDto | TaxCalculationGuidelineDto[]> {
  if (Array.isArray(payload)) {
    return bulkUpdateTaxCalculationGuidelines(payload);
  }
 
  return payload.id
    ? updateTaxCalculationGuideline(payload.id, payload)
    : createTaxCalculationGuideline(payload);
}
 
// ─── Server Actions ───────────────────────────────────────────────────────────
 
/**
 * Server Action to fetch tax calculation guideline configuration.
 * Called by RSC pages (e.g., page.tsx).
 */
export async function getTaxCalculationGuidelineAction(): Promise<
  ApiResponse<TaxCalculationGuidelineDto | TaxCalculationGuidelineDto[] | null>
> {
  try {
    const data = await getTaxCalculationGuideline();
    return {
      success: true,
      data,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.message,
        statusCode: error.statusCode,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tax calculation guideline',
    };
  }
}
 
/**
 * Server Action to save tax calculation guideline form data.
 * Called by Client Component hooks (e.g., useTaxCalculationGuidelineForm.ts).
 */
export async function saveTaxCalculationGuidelineAction(
  formData: TaxCalculationGuidelineFormData,
  currentDto?: TaxCalculationGuidelineDto | TaxCalculationGuidelineDto[] | null
): Promise<ApiResponse<TaxCalculationGuidelineDto | TaxCalculationGuidelineDto[]>> {
  try {
    const payload = mapFormDataToDto(formData, currentDto);
    const data = await saveTaxCalculationGuideline(payload);
    return {
      success: true,
      data,
      message: 'Tax calculation guideline saved successfully',
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.message,
        statusCode: error.statusCode,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save tax calculation guideline',
    };
  }
}