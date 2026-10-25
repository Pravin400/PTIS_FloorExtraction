/**
 * Admin Complaints Types & Contracts
 * Path: src/types/grievance/admin-complaints.types.ts
 *
 * Models for viewing, filtering, and managing citizen grievances in the Admin portal.
 */

import type { GrievancePhotoItem } from './grievance-photo.types';
import type { PublicGrievancePhoto } from './public-dashboard.types';

export interface AdminGrievanceRecord {
  id: number;
  grievanceNo: string;
  citizenId?: number;
  citizenName: string;
  citizenMobileNo: string;
  departmentId: number;
  departmentName: string;
  grievanceTypeId: number;
  grievanceType: string;
  roadLandmark: string;
  latitude?: number | null;
  longitude?: number | null;
  description: string;
  currentStateId: number;
  currentStateName: string;
  submittedDate: string;
  resolvedDate?: string | null;
  closedDate?: string | null;
  isActive?: boolean;
  photos?: (GrievancePhotoItem | PublicGrievancePhoto)[];
  beforeImageUrl?: string | null;
  afterImageUrl?: string | null;
}

export interface ComplaintsFilterParams {
  search?: string;
  departmentId?: number | 'all';
  statusId?: number | 'all';
  sortOrder?: 'asc' | 'desc';
  sortBy?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface ComplaintsPagedResult {
  items: AdminGrievanceRecord[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface DepartmentOption {
  id: number;
  nameEn: string;
  nameMr: string;
  code?: string;
}

export type ComplaintStatusTab = 'all' | 'pending' | 'in_progress' | 'resolved' | 'closed';

export interface ForwardGrievanceDto {
  forwardedToDeptId: number;
  assignedToUserId?: number;
  remark: string;
  updatePrimaryDepartment?: boolean;
}

export interface AssignGrievanceDto {
  assignedToUserId: number;
  remark: string;
}

export interface DepartmentOfficerOption {
  id: number;
  name: string;
  departmentId?: number;
  departmentName?: string;
  designation?: string;
  mobileNo?: string;
}

