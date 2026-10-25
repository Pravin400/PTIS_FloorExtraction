/**
 * Municipal Department Domain Types
 */

export interface DepartmentData {
  id: string;
  name: string;
  nameMr?: string;
  code?: string;
  icon?: string;
  imageUrl?: string;
  hod?: string;
  hodName?: string;
  phone?: string;
  email?: string;
  location?: string;
  description?: string;
  descriptionMr?: string;
  totalGrievances?: number;
  resolvedGrievances?: number;
  pendingGrievances?: number;
  slaComplianceRate?: number;
  activeOfficersCount?: number;
}

export interface DepartmentField {
  key: string;
  label: string;
  labelMr?: string;
  type?: 'text' | 'number' | 'select' | 'textarea' | 'date';
  required?: boolean;
}

export interface MunicipalDepartment {
  id: string;
  srNo: number;
  nameEn: string;
  nameMr: string;
  category: string;
  categoryMr: string;
  icon?: string;
  subOffices: string[];
  grievanceTypes: string[];
  fields: DepartmentField[];
  hod?: string;
  phone?: string;
  email?: string;
}


