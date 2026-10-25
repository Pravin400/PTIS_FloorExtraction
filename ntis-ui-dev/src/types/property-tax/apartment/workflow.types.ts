/**
 * Workflow and Certificate Type Definitions for Apartment Module
 */

export interface WorkflowStageDto {
  stageId: number;
  stageName: string;
  description?: string | null;
  isCompleted: boolean;
  createdBy?: number | null;
  createdByName?: string | null;
  createdDate?: string | null;
  updatedBy?: number | null;
  updatedByName?: string | null;
  updatedDate?: string | null;
}

export interface CertificateTypeDto {
  certificateTypeId: number;
  certificateTypeCode?: string | null;
  certificateTypeName: string;
  description?: string | null;
  isIssued: boolean;
  certificateNo?: string | null;
  issueDate?: string | null;
  createdBy?: number | null;
  createdByName?: string | null;
  createdDate?: string | null;
  updatedBy?: number | null;
  updatedByName?: string | null;
  updatedDate?: string | null;
}

export interface ApartmentQCTopSectionBelowFlexItemsDto {
  propertyId: number;
  workflowStages: WorkflowStageDto[];
  certificateTypes?: CertificateTypeDto[];
}

export interface ApartmentQCTopSectionBelowFlexResponseDto {
  success: boolean;
  message?: string | null;
  items?: ApartmentQCTopSectionBelowFlexItemsDto | null;
  data?: ApartmentQCTopSectionBelowFlexItemsDto | null;
  errors?: unknown;
  correlationId?: string | null;
}

export interface PtisRedesignCopy {
  title: string;
  newSurveyTitle: string;
  differenceEngineTitle: string;
  existingAssessmentTitle: string;
  aiStatus: string;
  hiddenPanelsLabel: string;
  restoreAllTables: string;
  totalUnitsLabel: string;
  totalDeltaLabel: string;
  editUnitTitle: string;
  saveChanges: string;
  cancel: string;
  action: string;
  suggestions: {
    verifyArea: string;
    createNew: string;
    verify: string;
  };
  tableHeaders: {
    prop: string;
    wgFl: string;
    type: string;
    flr: string;
    cyr: string;
    cty: string;
    use: string;
    rent: string;
    cpt: string;
    bua: string;
    ayr: string;
    occdt: string;
    rtpd: string;
    rate: string;
    rv: string;
    cv: string;
    tax: string;
    rvVsCvm: string;
    rttx: string;
    pen: string;
    exmp: string;
    disc: string;
    owner: string;
    ocpr: string;
    rntr: string;
    carpetDelta: string;
    buaDelta: string;
    rvDelta: string;
    taxDelta: string;
    rtTaxDelta: string;
    suggestion: string;
  };
}
