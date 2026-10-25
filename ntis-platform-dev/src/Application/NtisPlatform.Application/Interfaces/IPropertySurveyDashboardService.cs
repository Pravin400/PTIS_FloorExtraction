using NtisPlatform.Application.DTOs.Property.PropertySurveyDashboard;

namespace NtisPlatform.Application.Interfaces;

public interface IPropertySurveyDashboardService
{
    Task<SurveyDashboardResponseDto> GetAllAsync(SurveyDashboardQueryParameters queryParameters,int userId, CancellationToken ct);
}
