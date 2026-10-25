using NtisPlatform.Application.DTOs.Property;
using NtisPlatform.Application.DTOs.Property.ApartmentQcTopSection;

namespace NtisPlatform.Application.Interfaces.Property;

/// <summary>
/// Service interface for retrieving aggregated individual property details,
/// combining Basic Details, KYC Information, and Individual-level Additional Revenue.
/// </summary>
public interface IPropertyIndividualService
{
    /// <summary>
    /// Retrieves individual property details and tax revenue metrics for the specified property.
    /// </summary>
    Task<PropertyIndividualDto?> GetIndividualDetailsAsync(int propertyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates relevant editable fields for an individual property.
    /// </summary>
    Task<TopSectionUpdateOutcome> UpdateIndividualDetailsAsync(
        int propertyId,
        UpdatePropertyIndividualDto dto,
        int updatedBy,
        CancellationToken cancellationToken = default);
}
