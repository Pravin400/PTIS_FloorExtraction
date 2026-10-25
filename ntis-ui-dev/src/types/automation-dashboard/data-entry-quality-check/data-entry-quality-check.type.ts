export interface DataEntryStructureUnitProp {
  structure: number;
  unit: number;
}

export interface DataEntryCompletionProp {
  completedStructure: number;
  completedUnit: number;
  pendingStructure: number;
  pendingUnit: number;
}

export interface DataEntryPhotoPlanProp {
  complete: number;
  pending: number;
}

export interface DataEntryQAProp {
  completedStructure: number;
  completedUnit: number;
  pendingStructure: number;
  pendingUnit: number;
  typeWise?: number;
}

export interface DataEntryPropertyTypeProp {
  residential: number;
  nonResidential: number;
  mixed: number;
  publicUtility: number;
  underConstruction?: number;
}

export interface DataEntryAssessmentCount {
  structureCount: number;
  unitCount: number;
}

export interface DataEntryStatusAssessmentCount {
  statusId: number;
  structureCount: number;
  unitCount: number;
}

export interface DataEntryAssessmentStatusBreakdown {
  assessed: DataEntryStatusAssessmentCount;
  unassessed: DataEntryStatusAssessmentCount;
  newlyAssessedFound: DataEntryStatusAssessmentCount;
  assessmentInProcess: DataEntryStatusAssessmentCount;
}

export interface DataEntryGridData {
  divisionId: number | null;
  divisionName: string;
  zoneNo?: string;
  structure: number;
  unit: number;
  internalSurvey: DataEntryStructureUnitProp;
  dataEntry: DataEntryCompletionProp;
  photo: DataEntryPhotoPlanProp;
  plan: DataEntryPhotoPlanProp;
  qualityAnalyst: DataEntryQAProp;
  propertyType: DataEntryPropertyTypeProp;
  assessmentStatusBreakdown: DataEntryAssessmentStatusBreakdown;
}

export interface DataEntryGridItems {
  divisionData: DataEntryGridData[];
  totalRow: DataEntryGridData;
}

export interface DataEntryGridResponse {
  success: boolean;
  message: string;
  items: DataEntryGridItems[] | null;
  errors: unknown | null;
  correlationId: string | null;
}

export interface DataEntryWardData {
  wardId: number | null;
  wardNo: string;
  zoneNo?: string;
  structure: number;
  unit: number;
  internalSurvey: DataEntryStructureUnitProp;
  dataEntry: DataEntryCompletionProp;
  photo: DataEntryPhotoPlanProp;
  plan: DataEntryPhotoPlanProp;
  qualityAnalyst: DataEntryQAProp;
  propertyType: DataEntryPropertyTypeProp;
  assessmentStatusBreakdown: DataEntryAssessmentStatusBreakdown;
}

export interface DataEntryWardWiseSummaryItems {
  zoneId: number;
  zoneName: string;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  wardData: DataEntryWardData[];
  totalRow: DataEntryWardData;
}

export interface DataEntryWardWiseSummaryResponse {
  success: boolean;
  message: string;
  items: DataEntryWardWiseSummaryItems[] | null;
  errors: unknown | null;
  correlationId: string | null;
}

export type DataEntryData = {
  sr: number | string;
  division: string;
  wardNo: string;
  isTotal?: boolean;
  wardId?: number | string;
  zoneId?: number | string;
  zoneNo?: string;

  structure: string | number;
  unit: string | number;

  isStruct: string | number;
  isUnit: string | number;

  deCompStruct: string | number;
  deCompUnit: string | number;
  dePendStruct: string | number;
  dePendUnit: string | number;

  photoComp: string | number;
  photoPend: string | number;

  planComp: string | number;
  planPend: string | number;

  qaCompStruct: string | number;
  qaCompUnit: string | number;
  qaPendStruct: string | number;
  qaPendUnit: string | number;
  qaTypeWise: string | number;

  propRes: string | number;
  propNonRes: string | number;
  propMixed: string | number;
  propPublic: string | number;
  propUnder: string | number;

  assessStruct: string | number;
  assessUnit: string | number;
  unassessStruct: string | number;
  unassessUnit: string | number;
  newlyStruct: string | number;
  newlyUnit: string | number;
  inprocessStruct: string | number;
  inprocessUnit: string | number;
  assessedStatusId?: number;
  unassessedStatusId?: number;
  newlyAssessedStatusId?: number;
  inprocessStatusId?: number;
};