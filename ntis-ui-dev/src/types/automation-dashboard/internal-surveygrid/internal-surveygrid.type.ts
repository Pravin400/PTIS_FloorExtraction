export interface StructureUnitProp {
  statusId?: number;
  structure: number;
  unit: number;
}

export interface StructureUnitsProp {
  structure: number;
  units: number;
}

export interface StatusStructureUnitsProp {
  statusId: number;
  structure: number;
  units: number;
}

export interface PropertyTypeProp {
  residential: number;
  nonResidential: number;
  mixed: number;
  publicUtility: number;
  underConstruction: number;
}

export interface InternalSurveyGridData {
  divisionId: number | null;
  divisionName: string;
  zoneNo: string;
  geoSequencingProperties: StructureUnitProp;
  surveyProperties: StructureUnitProp;
  propertyType: PropertyTypeProp;
  assessedProperties: StatusStructureUnitsProp;
  unassessedProperties: StatusStructureUnitsProp;
  newlyAssessedFound: StructureUnitProp;
  assessmentInprocess: StructureUnitProp;
  photoCount: number;
}

export interface InternalSurveyGridItems {
  divisionData: InternalSurveyGridData[];
  totalRow: InternalSurveyGridData;
}

export interface InternalSurveyGridResponse {
  success: boolean;
  message: string;
  items: InternalSurveyGridItems[] | null;
  errors: unknown | null;
  correlationId: string | null;
}

export interface InternalSurveyWardWiseData {
  wardId: number | null;
  wardNo: string;
  geoSequencingProperties: StructureUnitProp;
  surveyProperties: StructureUnitProp;
  propertyType: PropertyTypeProp;
  assessedProperties: StatusStructureUnitsProp;
  unassessedProperties: StatusStructureUnitsProp;
  newlyAssessedFound: StructureUnitProp;
  assessmentInprocess: StructureUnitProp;
  photoCount: number;
}

export interface InternalSurveyWardWiseItems {
  zoneId: number;
  zoneNo?: string;
  zoneName: string;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  wardData: InternalSurveyWardWiseData[];
  totalRow: InternalSurveyWardWiseData;
}

export interface InternalSurveyWardWiseResponse {
  success: boolean;
  message: string;
  items: InternalSurveyWardWiseItems[] | null;
  errors: unknown | null;
  correlationId: string | null;
}
