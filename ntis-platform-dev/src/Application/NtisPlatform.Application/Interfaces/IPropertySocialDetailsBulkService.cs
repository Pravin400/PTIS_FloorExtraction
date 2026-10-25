
using NtisPlatform.Application.DTOs.PropertySocialDetailsBulk;

namespace NtisPlatform.Application.Interfaces;

public interface IPropertySocialDetailsBulkService 
{
    Task<PropertySocialInfoBulkResponseDto> GetPropertySocialInfoBulkAsync(int? propertyId, int? societyDetailId, int? wingDetailId, string? entityType, CancellationToken cancellationToken = default);
    Task<List<PropertySocialDetailsBulkDto>> UpsertPropertySocialInfoBulkAsync(UpsertPropertySocialInfoBulkDto dto, CancellationToken cancellationToken = default);
}
