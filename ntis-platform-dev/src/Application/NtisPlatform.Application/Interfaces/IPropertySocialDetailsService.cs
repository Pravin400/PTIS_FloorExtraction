using NtisPlatform.Application.DTOs.PropertySocialDetails;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Application.Interfaces;

public interface IPropertySocialDetailsService : ICommonCrudService<PropertySocialDetailsEntity, PropertySocialDetailsDto, CreatePropertySocialDetailsDto, UpdatePropertySocialDetailsDto, PropertySocialDetailsQueryParameters, int>
{
    Task<PropertySocialInfoResponseDto> GetPropertySocialInfoAsync(int propertyId, CancellationToken cancellationToken = default);
    Task<List<PropertySocialDetailsDto>> UpsertPropertySocialInfoAsync(UpsertPropertySocialInfoDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteByPropertyAndAttributeAsync(int propertyId, int socialAttributeId, CancellationToken cancellationToken = default);
    Task<int> SoftDeleteByHierarchyAsync(SoftDeleteByHierarchyRequest request, CancellationToken cancellationToken = default);
    Task<PropertySocialDetailsFilterResponseDto> GetByFiltersAsync(int? socialAttributeId, int? societyDetailId, int? wingDetailId, int? propertyId = null, CancellationToken cancellationToken = default);
    Task<PropertyDiscountAndSocialGridResponseDto> GetApartmentSocietyDiscountAndSocialGridAsync(int societyDetailId, int? propertyId = null, CancellationToken cancellationToken = default);
    Task<PropertyDiscountAndSocialGridResponseDto> GetIndividualPropertyDiscountAndSocialGridAsync(int propertyId, CancellationToken cancellationToken = default);
    Task<PropertyDiscountAndSocialGridResponseDto> GetDiscountAndSocialGridAsync(int societyDetailId, int? propertyId = null, CancellationToken cancellationToken = default);
}
