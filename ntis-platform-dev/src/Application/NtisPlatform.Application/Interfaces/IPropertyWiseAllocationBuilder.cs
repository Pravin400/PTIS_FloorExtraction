using NtisPlatform.Application.DTOs.propertywise;

namespace NtisPlatform.Application.Interfaces;

/// <summary>
/// Service responsible for building zone, ward, and old ward allocation pairs.
/// </summary>
public interface IPropertyWiseAllocationBuilder
{
    /// <summary>
    /// Builds flattened property wise pairs from zone ward allocation DTOs.
    /// </summary>
    /// <param name="allocations">List of zone and ward allocations.</param>
    /// <returns>List of mapped PropertyWisePair records.</returns>
    List<PropertyWisePair> BuildPairs(List<PropertyWiseZoneWardDto> allocations);

    /// <summary>
    /// Prepares an existing allocation entity for soft deactivation.
    /// </summary>
    void PrepareExistingForDeactivation(Core.Entities.GlobalSurveyWardAllocationEntity existing, int? updatedBy, DateTime timestamp);
}
