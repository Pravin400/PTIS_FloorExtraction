/**
 * Domain types for Civic Grievance Management
 */

export type GrievanceStatus =
  | 'SUBMITTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED';

export type GrievancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IssueCategory =
  | 'all'
  | 'water'
  | 'roads'
  | 'sanitation'
  | 'electricity'
  | 'drainage'
  | 'garden'
  | 'other';

export type SlaStatus = 'ON_TRACK' | 'NEAR_BREACH' | 'BREACHED';

export interface TimelineEvent {
  status: GrievanceStatus;
  timestamp: string;
  title: string;
  titleMr: string;
  note: string;
  noteMr: string;
  performedBy: string;
}

export interface GrievanceReporter {
  name: string;
  phoneMasked: string;
  citizenId?: string;
}

export interface AssignedOfficer {
  name: string;
  nameMr: string;
  department: string;
  departmentMr: string;
  designation: string;
  designationMr: string;
  contact?: string;
}

export interface GrievanceImage {
  url: string;
  caption?: string;
  type: 'BEFORE' | 'AFTER';
}

export interface Grievance {
  id: string;
  trackingId: string; // e.g. AMC-2026-0041
  title: string;
  titleMr: string;
  description: string;
  descriptionMr: string;
  category: Exclude<IssueCategory, 'all'>;
  subCategory?: string;
  status: GrievanceStatus;
  priority: GrievancePriority;
  ward: string;
  wardNumber: number;
  zone: string;
  address: string;
  landmark: string;
  lat: number;
  lng: number;
  reportedAt: string;
  updatedAt: string;
  slaHours: number;
  slaDeadline: string;
  slaStatus: SlaStatus;
  reporter: GrievanceReporter;
  assignedOfficer?: AssignedOfficer;
  timeline: TimelineEvent[];
  images: GrievanceImage[];
  upvotesCount: number;
}

export interface CategoryMaster {
  id: Exclude<IssueCategory, 'all'>;
  code: string;
  name: string;
  nameMr: string;
  description: string;
  descriptionMr: string;
  icon: string;
  color: string;
  slaHours: number;
  department: string;
  departmentMr: string;
}

export interface WardMaster {
  wardNumber: number;
  name: string;
  nameMr: string;
  zone: string;
  zoneMr: string;
  officerInCharge: string;
  officeContact: string;
  officeAddress: string;
  lat: number;
  lng: number;
}
