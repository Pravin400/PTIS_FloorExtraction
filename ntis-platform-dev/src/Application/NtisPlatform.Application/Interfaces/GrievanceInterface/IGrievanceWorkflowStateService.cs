using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceWorkflowState;
using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Application.Interfaces.GrievanceInterface;

/// <summary>
/// Service interface for Grievance Workflow State CRUD operations
/// </summary>
public interface IGrievanceWorkflowStateService : ICommonCrudService<
    GrievanceWorkflowStateEntity,
    GrievanceWorkflowStateDto,
    CreateGrievanceWorkflowStateDto,
    UpdateGrievanceWorkflowStateDto,
    GrievanceWorkflowStateQueryParameters,
    int>
{
}
