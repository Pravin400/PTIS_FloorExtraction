export type AssessmentStatusColumnKey =
    | 'assessStruct'
    | 'assessUnit'
    | 'unassessStruct'
    | 'unassessUnit'
    | 'newlyStruct'
    | 'newlyUnit'
    | 'inprocessStruct'
    | 'inprocessUnit';

export interface AssessmentStatusIds {
    assessedStatusId?: number;
    unassessedStatusId?: number;
    newlyAssessedStatusId?: number;
    inprocessStatusId?: number;
}

export interface AssessmentStatusNavigationParams {
    assessmentTypeParam: string;
    structureUnitParam: string;
    isAssessmentStatusColumn: boolean;
}

export function getAssessmentStatusNavigationParams(
    columnKey: string,
    statusIds: AssessmentStatusIds
): AssessmentStatusNavigationParams {
    switch (columnKey as AssessmentStatusColumnKey) {
        case 'assessStruct':
            return {
                assessmentTypeParam: statusIds.assessedStatusId ? `&assessmentTypeId=${statusIds.assessedStatusId}` : '',
                structureUnitParam: '&structure=true',
                isAssessmentStatusColumn: true
            };
        case 'assessUnit':
            return {
                assessmentTypeParam: statusIds.assessedStatusId ? `&assessmentTypeId=${statusIds.assessedStatusId}` : '',
                structureUnitParam: '&unit=true',
                isAssessmentStatusColumn: true
            };
        case 'unassessStruct':
            return {
                assessmentTypeParam: statusIds.unassessedStatusId ? `&assessmentTypeId=${statusIds.unassessedStatusId}` : '',
                structureUnitParam: '&structure=true',
                isAssessmentStatusColumn: true
            };
        case 'unassessUnit':
            return {
                assessmentTypeParam: statusIds.unassessedStatusId ? `&assessmentTypeId=${statusIds.unassessedStatusId}` : '',
                structureUnitParam: '&unit=true',
                isAssessmentStatusColumn: true
            };
        case 'newlyStruct':
            return {
                assessmentTypeParam: statusIds.newlyAssessedStatusId ? `&assessmentTypeId=${statusIds.newlyAssessedStatusId}` : '',
                structureUnitParam: '&structure=true',
                isAssessmentStatusColumn: true
            };
        case 'newlyUnit':
            return {
                assessmentTypeParam: statusIds.newlyAssessedStatusId ? `&assessmentTypeId=${statusIds.newlyAssessedStatusId}` : '',
                structureUnitParam: '&unit=true',
                isAssessmentStatusColumn: true
            };
        case 'inprocessStruct':
            return {
                assessmentTypeParam: statusIds.inprocessStatusId ? `&assessmentTypeId=${statusIds.inprocessStatusId}` : '',
                structureUnitParam: '&structure=true',
                isAssessmentStatusColumn: true
            };
        case 'inprocessUnit':
            return {
                assessmentTypeParam: statusIds.inprocessStatusId ? `&assessmentTypeId=${statusIds.inprocessStatusId}` : '',
                structureUnitParam: '&unit=true',
                isAssessmentStatusColumn: true
            };
        default:
            return {
                assessmentTypeParam: '',
                structureUnitParam: '',
                isAssessmentStatusColumn: false
            };
    }
}
