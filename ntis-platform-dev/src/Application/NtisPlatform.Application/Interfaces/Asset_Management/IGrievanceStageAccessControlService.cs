using NtisPlatform.Application.DTOs.Asset_Management;
using NtisPlatform.Core.Entities.Asset_Management;

namespace NtisPlatform.Application.Interfaces.Asset_Management
{
    public interface IGrievanceStageAccessControlService : ICommonCrudService<
        GrievanceStageAccessControlEntity,
        GrievanceStageAccessControlDto,
        CreateGrievanceStageAccessControlDto,
        UpdateGrievanceStageAccessControlDto,
        GrievanceStageAccessControlQueryParameters,
        int>
    {
        Task<bool> HasAccessToStageAsync(int stageId, int userId, CancellationToken cancellationToken = default);
    }
}