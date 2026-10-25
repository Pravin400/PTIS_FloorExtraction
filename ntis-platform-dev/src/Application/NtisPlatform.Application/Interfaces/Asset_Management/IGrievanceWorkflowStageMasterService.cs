using NtisPlatform.Application.DTOs.Asset_Management;
using NtisPlatform.Core.Entities.Asset_Management;

namespace NtisPlatform.Application.Interfaces.Asset_Management
{
    public interface IGrievanceWorkflowStageMasterService : ICommonCrudService<
        GrievanceWorkflowStageMasterEntity,
        GrievanceWorkflowStageMasterDto,
        CreateGrievanceWorkflowStageMasterDto,
        UpdateGrievanceWorkflowStageMasterDto,
        GrievanceWorkflowStageQueryParameters,
        int>
    {
        Task<List<GrievanceWorkflowStageMasterDto>> GetStagesByUlbTypeAsync(int ulbTypeId, CancellationToken cancellationToken = default);
    }
}