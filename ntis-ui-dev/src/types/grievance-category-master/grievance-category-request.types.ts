/**
 * Grievance Category Request/Response Types
 */
import type { Priority, EscalationLevel, GrievanceCategory } from './grievance-category.types';

export interface CreateGrievanceCategoryRequest {
  categoryCode: string;
  categoryName: string;
  departmentId: number;
  priority: Priority;
  resolutionSla: string;
  escalationLevel: EscalationLevel;
  description: string;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string;
  createdBy?: number;
  updatedBy?: number;
}

export interface UpdateGrievanceCategoryRequest extends CreateGrievanceCategoryRequest {
  id: number;
}

export interface GetGrievanceCategoriesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  departmentId?: number;
  isActive?: boolean;
}

export interface GetGrievanceCategoriesResult {
  categories: GrievanceCategory[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
