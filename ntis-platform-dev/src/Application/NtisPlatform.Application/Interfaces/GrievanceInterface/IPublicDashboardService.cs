using NtisPlatform.Application.DTOs.GrievanceDTO_s.PublicDashboard;

namespace NtisPlatform.Application.Interfaces.GrievanceInterface;

public interface IPublicDashboardService
{
    Task<PublicDashboardResponseDto> GetDashboardAsync(PublicDashboardQueryParameters? queryParameters = null, CancellationToken cancellationToken = default);
}
