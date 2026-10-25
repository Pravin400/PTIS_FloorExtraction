/**
 * Grievance API Data Transfer Objects (DTOs)
 */

import type { GrievancePriority, GrievanceStatus, IssueCategory } from './grievance.types';

export interface CreateGrievanceDto {
  title: string;
  titleMr?: string;
  description: string;
  descriptionMr?: string;
  category: Exclude<IssueCategory, 'all'> | string;
  subCategory?: string;
  wardNumber: number;
  address: string;
  landmark?: string;
  lat?: number;
  lng?: number;
  reporterName?: string;
  reporterPhone: string;
  reporterEmail?: string;
  reporterId?: string;
  imageUrls?: string[];
  priority?: GrievancePriority;
}

export interface UpdateGrievanceDto {
  status?: GrievanceStatus | string;
  priority?: GrievancePriority;
  assignedOfficerId?: string;
  assignedDepartmentId?: string;
  notes?: string;
  slaDeadline?: string;
}

export interface GrievanceFilterDto {
  status?: GrievanceStatus | 'all';
  category?: IssueCategory;
  priority?: GrievancePriority | 'all';
  wardNumber?: number;
  zone?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface GrievanceQueryParams extends GrievanceFilterDto {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GrievanceStatsDto {
  total: number;
  submitted: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  slaBreached: number;
  slaComplianceRate: number;
}

export interface GrievanceApplicationResult {
  id: number;
  grievanceNo: string;
  citizenId: number;
  grievanceDepartmentId: number;
  grievanceTypeId?: number | null;
  roadLandmark: string;
  description: string;
  submittedDate: string;
  token?: string;
  wardId?: number | null;
  wardNo?: string | null;
  wardName?: string | null;
  zoneId?: number | null;
  zoneNo?: string | null;
  zoneName?: string | null;
}

export interface SubmitGrievanceApplicationPayload {
  citizenId?: number;
  fullName: string;
  mobile: string;
  email?: string;
  departmentId: number;
  grievanceTypeId?: number | null;
  roadLandmark: string;
  description: string;
  images?: string[];
  latitude?: string;
  longitude?: string;
  zoneId?: number | null;
  wardId?: number | null;
  zoneName?: string | null;
  wardName?: string | null;
  createdBy?: number | null;
  token?: string;
}

