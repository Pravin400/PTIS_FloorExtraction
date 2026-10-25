/**
 * Grievance Admin and Triage Domain Types
 */

import type { GrievancePriority, GrievanceStatus, IssueCategory } from './grievance.types';

export interface AdminGrievanceStats {
  total: number;
  submitted: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  breached: number;
  slaComplianceRate: number;
}

export interface TriageFilterDto {
  status?: GrievanceStatus | 'all';
  priority?: GrievancePriority | 'all';
  category?: IssueCategory;
  departmentId?: string;
  wardNumber?: number;
  slaBreachedOnly?: boolean;
  search?: string;
}

export interface AdminOfficer {
  id: string;
  name: string;
  designation?: string;
  department?: string;
  phone?: string;
  mobile?: string;
  office?: string;
  isActive?: boolean;
  email?: string;
}
