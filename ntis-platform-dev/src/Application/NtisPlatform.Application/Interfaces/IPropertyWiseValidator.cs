using NtisPlatform.Application.DTOs.propertywise;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Application.Interfaces;

/// <summary>
/// Validator for property-wise allocations and business rule enforcement.
/// </summary>
public interface IPropertyWiseValidator
{
    /// <summary>
    /// Validates request data and business rules for creating property-wise allocations.
    /// </summary>
    Task ValidateCreateAsync(CreatePropertyWiseDto createDto, CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates request data, business rules, and duplicate constraints for updating a property-wise allocation.
    /// </summary>
    Task ValidateUpdateAsync(int id, GlobalSurveyWardAllocationEntity existingEntity, UpdatePropertyWiseDto updateDto, PropertyWisePair requestedPair, CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates property-wise allocation data, relationships, and user module constraints.
    /// </summary>
    Task ValidatePropertyWiseAsync(
        int userId,
        int departmentId,
        int moduleId,
        List<PropertyWiseZoneWardDto> allocations,
        string? fromPropertyNo,
        string? toPropertyNo,
        CancellationToken cancellationToken,
        int? excludeId = null,
        bool isZoneWardChanged = true);

    /// <summary>
    /// Validates reference constraints before deactivating a property-wise allocation.
    /// </summary>
    Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        GlobalSurveyWardAllocationEntity currentEntity,
        GlobalSurveyWardAllocationEntity updatedEntity,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates reference constraints and active status before deleting a property-wise allocation.
    /// </summary>
    Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        GlobalSurveyWardAllocationEntity entity,
        CancellationToken cancellationToken = default);
}
