/**
 * Grievance Department User Allocation Types (Layer 1 - Domain Types)
 * Path: src/types/grievance/department-user.types.ts
 *
 * Aligns with backend NtisPlatform endpoint:
 * GET /api/GrievanceDepartment/{grievanceDepartmentId}/users
 */

export interface GrievanceDepartmentUser {
  id: number;
  userId: number;
  departmentId: number;
  userName?: string;
  fullName: string;
  fullNameLocal?: string;
  email?: string;
  mobileNo?: string;
  designation?: string;
  designationLocal?: string;
  roleName?: string;
  zoneId?: number | null;
  wardId?: number | null;
  isActive: boolean;
}
