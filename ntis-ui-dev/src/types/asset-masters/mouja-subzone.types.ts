export interface MoujaFormModel {
  id?: number;
  moujaNo: string;
  moujaName: string;
  isActive: boolean;
  createdBy?: number;
  updatedBy?: number;
}

export interface Mouja {
  [key: string]: unknown;
  id: number;
  moujaNo: string;
  moujaName: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface SubZoneFormModel {
  id?: number;
  moujaId: number | null;
  subZoneNo: string;
  subZoneName: string;
  isActive: boolean;
  createdBy?: number;
  updatedBy?: number;
}

export interface SubZoneDetails {
  [key: string]: unknown;
  id: number;
  moujaId: number;
  moujaName: string | null;
  subZoneNo: string;
  subZoneName: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface MoujaSubZoneProps {
  moujas: Mouja[];
  subZones: SubZoneDetails[];
  moujaTotalCount: number;
  subZoneTotalCount: number;
  moujaPageNumber: number;
  subZonePageNumber: number;
  moujaPageSize: number;
  subZonePageSize: number;
  moujaTotalPages: number;
  subZoneTotalPages: number;
  selectedMoujaId?: string;
  moujaSortBy?: string;
  moujaSortOrder?: string;
  subZoneSortBy?: string;
  subZoneSortOrder?: string;
}
