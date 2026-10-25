using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceWorkflow;
using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Application.Interfaces.GrievanceInterface;

/// <summary>
/// Service interface for Grievance Workflow CRUD operations
/// </summary>
public interface IGrievanceWorkflowService : ICommonCrudService<
    GrievanceWorkflowEntity,
    GrievanceWorkflowDto,
    CreateGrievanceWorkflowDto,
    UpdateGrievanceWorkflowDto,
    GrievanceWorkflowQueryParameters,
    int>
{
}
