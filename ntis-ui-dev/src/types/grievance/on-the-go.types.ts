/**
 * On-The-Go Grievance Domain Types & DTOs (Layer 1 - Domain Types)
 * Path: src/types/grievance/on-the-go.types.ts
 *
 * Defines contracts, form state values, payloads, and response interfaces
 * for the high-velocity Commissioner and Field Officer triage workflow.
 */

export interface OnTheGoPhoto {
  id: string;
  file?: File;
  previewUrl: string;
  uploadedUrl?: string;
  isUploading?: boolean;
  error?: string;
}

export interface OnTheGoOfficerOption {
  id: string | number;
  name: string;
  nameMr?: string;
  designation: string;
  designationMr?: string;
  departmentId: string | number;
  departmentName: string;
  zoneId?: number;
  wardNumber?: number;
  phone?: string;
  email?: string;
  isAvailable?: boolean;
}

export interface OnTheGoCategoryOption {
  id: number;
  name: string;
  departmentId: number;
}

export interface OnTheGoFormValues {
  // 1. Issue Details
  photos: OnTheGoPhoto[];
  description: string;

  // 2. Responsibility Assignment
  zoneId: number | null;
  wardNumber: number | null;
  departmentId: string | null;
  grievanceTypeId: number | null;
  officerUserId: number | null;

  // 3. Optional Additional Details
  isCitizenReported: boolean;
  citizenMobile: string;
  citizenName: string;
  landmark: string;
}

export interface OnTheGoValidationErrors {
  description?: string;
  zoneId?: string;
  wardNumber?: string;
  departmentId?: string;
  grievanceTypeId?: string;
  officerUserId?: string;
  citizenMobile?: string;
  citizenName?: string;
  landmark?: string;
  general?: string;
}

export interface SubmitOnTheGoPayload {
  description: string;
  zoneId: number;
  wardNumber: number;
  departmentId: string | number;
  grievanceTypeId?: number | null;
  assignedOfficerUserId: number;
  photoIds?: number[];
  citizenMobile?: string;
  citizenName?: string;
  roadLandmark?: string;
  latitude?: number;
  longitude?: number;
  initialRemark?: string;
}

export interface OnTheGoSubmissionResult {
  grievanceId: number;
  grievanceNo: string;
  trackingToken: string;
  assignedOfficerName: string;
  assignedOfficerDesignation?: string;
  departmentName: string;
  submittedAt: string;
}
