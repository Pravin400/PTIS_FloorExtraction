/**
 * @deprecated — DEPRECATED: This file contains mock/seed-data bridge code
 * (now superseded by Server Actions in src/lib/actions/grievance/).
 *
 * Original description:
 * Grievance Service Layer — mock data bridge.
 */

import { appConfig } from '@/config/app.config';

import type {
  Grievance,
  IssueCategory,
  CategoryMaster,
  WardMaster,
} from '@/types/grievance.types';
import type {
  GrievanceQueryParams,
  PaginatedResponse,
  CreateGrievanceDto,
  GrievanceStatsDto,
  MapMarker,
} from '@/types/grievance';

export class GrievanceService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = appConfig.api.baseUrl;
  }

  /**
   * Fetch all grievances with optional category, search, and pagination filters
   */
  async getGrievances(params: GrievanceQueryParams = {}): Promise<PaginatedResponse<Grievance>> {

    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.category && params.category !== 'all') searchParams.set('category', params.category);
    if (params.status) searchParams.set('status', params.status);
    if (params.wardNumber) searchParams.set('wardNumber', String(params.wardNumber));
    if (params.search) searchParams.set('search', params.search);

    const res = await fetch(`${this.baseUrl}/grievances?${searchParams.toString()}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch grievances: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  /**
   * Fetch map markers for rendering pins on OpenStreetMap
   */
  async getMapMarkers(category?: IssueCategory, search?: string): Promise<MapMarker[]> {
    const searchParams = new URLSearchParams();
    if (category && category !== 'all') searchParams.set('category', category);
    if (search) searchParams.set('search', search);

    const res = await fetch(`${this.baseUrl}/grievances/map-markers?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Failed to load map markers from backend');
    return res.json();
  }

  /**
   * Search / Track a grievance by Tracking ID or phone
   */
  async getByTrackingId(trackingId: string): Promise<Grievance | null> {
    const res = await fetch(`${this.baseUrl}/grievances/track/${encodeURIComponent(trackingId)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to track grievance');
    const result = await res.json();
    return result.data || result;
  }

  /**
   * Register a new grievance
   */
  async createGrievance(dto: CreateGrievanceDto): Promise<Grievance> {
    const res = await fetch(`${this.baseUrl}/grievances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });

    if (!res.ok) throw new Error('Failed to submit grievance');
    const result = await res.json();
    return result.data || result;
  }

  /**
   * Get overall performance statistics (SLA compliance, counts by category)
   */
  async getStats(): Promise<GrievanceStatsDto> {
    const res = await fetch(`${this.baseUrl}/grievances/stats`);
    if (!res.ok) throw new Error('Failed to fetch statistics');
    const result = await res.json();
    return result.data || result;
  }

  /**
   * Fetch categories master
   */
  async getCategories(): Promise<CategoryMaster[]> {
    const res = await fetch(`${this.baseUrl}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    const result = await res.json();
    return result.data || result;
  }

  /**
   * Fetch wards master
   */
  async getWards(): Promise<WardMaster[]> {
    const res = await fetch(`${this.baseUrl}/wards`);
    if (!res.ok) throw new Error('Failed to fetch wards');
    const result = await res.json();
    return result.data || result;
  }
}

// Singleton export
export const grievanceService = new GrievanceService();
