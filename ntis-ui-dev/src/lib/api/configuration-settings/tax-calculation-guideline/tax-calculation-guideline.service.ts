/**
 * Tax Calculation Guideline – API Service Layer
 * Handles GET, POST and PUT operations against the backend tax guideline endpoint.
 *
 * Endpoints:
 *   GET  /api/CertificateTaxGuideline?pageSize=1000  → fetch all guideline rows
 *   POST /api/CertificateTaxGuideline                → create a single new row
 *   PUT  /api/CertificateTaxGuideline/{id}           → update a single row by PK
 *   PUT  /api/CertificateTaxGuideline/bulk           → bulk-upsert all rows from the UI form
 */
import 'server-only';
import { apiClient } from '@/services/api.service';
import { ApiError } from '@/lib/utils/api';
import type { PagedResponse } from '@/types/common.types';
import type { TaxCalculationGuidelineDto } from '@/types/tax-calculation-guideline.types';

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
    guidelineCode: item.guidelineCode!,
    guidelineName: item.guidelineName || item.guidelineCode!,
    description: item.description,
    guidelineGroup: item.guidelineGroup,
    displayOrder: item.displayOrder!,
    dataType: item.dataType!,
    guidelineValue: item.guidelineValue,
    allowedValues: item.allowedValues,
    isActive: item.isActive,
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
