using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceWorkflowTransition;
using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Application.Interfaces.GrievanceInterface;

/// <summary>
/// Service interface for Grievance Workflow Transition CRUD operations
/// </summary>
public interface IGrievanceWorkflowTransitionService : ICommonCrudService<
    GrievanceWorkflowTransitionEntity,
    GrievanceWorkflowTransitionDto,
    CreateGrievanceWorkflowTransitionDto,
    UpdateGrievanceWorkflowTransitionDto,
    GrievanceWorkflowTransitionQueryParameters,
    int>
{
}
