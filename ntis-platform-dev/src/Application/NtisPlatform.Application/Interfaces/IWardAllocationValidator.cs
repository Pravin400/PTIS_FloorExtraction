using NtisPlatform.Application.DTOs.wardallocation;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;

namespace NtisPlatform.Application.Interfaces;

/// <summary>
/// Pre-loaded validation context containing all required entities in a single batch
/// </summary>
public class WardAllocationValidationData
{
    public UserEntity? User { get; init; }
    public DepartmentMasterEntity? Department { get; init; }
    public ModuleMasterEntity? Module { get; init; }
    public bool HasDepartmentAllocation { get; init; }
    public bool HasModuleAllocation { get; init; }
    public bool IsAdmin { get; init; }
    public Dictionary<int, int> ValidWardZoneMap { get; init; } = new();
    public HashSet<int> ActiveOldWardIds { get; init; } = new();
}

/// <summary>
/// Service responsible for validating ward allocation operations
/// </summary>
public interface IWardAllocationValidator
{
    /// <summary>
    /// Batch loads all validation dependencies concurrently
    /// </summary>
    Task<WardAllocationValidationData> LoadValidationDataAsync(
        int userId,
        int departmentId,
        int moduleId,
        List<int> zoneIds,
        List<int> wardIds,
        List<int> oldWardIds,
        CancellationToken cancellationToken);

    /// <summary>
    /// Validates ward allocations for creation or update using pre-loaded batch data
    /// </summary>
    Task ValidateWardAllocationAsync(
        int userId,
        int departmentId,
        int moduleId,
        List<ZoneWardAllocationDto> allocations,
        CancellationToken cancellationToken,
        int? excludeId = null);

    /// <summary>
    /// Validates basic allocation payload structure
    /// </summary>
    void ValidateAllocations(List<ZoneWardAllocationDto> allocations, OperationType operationType);

    /// <summary>
    /// Validates single-ward restriction for specific modules
    /// </summary>
    bool ValidateSingleWardRestriction(
        WardAllocationValidationData data,
        List<int> zoneIds,
        List<int> wardIds,
        OperationType operationType);

    /// <summary>
    /// Validates cross-user allocation conflicts
    /// </summary>
    Task ValidateConflictsAsync(
        int userId,
        int departmentId,
        int moduleId,
        List<int> zoneIds,
        List<int> wardIds,
        bool isAdmin,
        bool isSingleWardModule,
        OperationType operationType,
        CancellationToken cancellationToken,
        int? excludeId = null);

    /// <summary>
    /// Validates that wards belong to the specified zones using in-memory map
    /// </summary>
    void ValidateWardZoneRelationships(
        List<ZoneWardAllocationDto> allocations,
        Dictionary<int, int> validWardDict,
        OperationType operationType);

    /// <summary>
    /// Validates active status of old wards using in-memory set
    /// </summary>
    void ValidateOldWards(
        List<int> oldWardIds,
        HashSet<int> activeOldWardIds,
        OperationType operationType);

    /// <summary>
    /// Validates user, department, and module allocations and existence
    /// </summary>
    Task ValidateUserDepartmentAndModuleAsync(
        int userId,
        int departmentId,
        int moduleId,
        CancellationToken cancellationToken,
        OperationType operationType = OperationType.Create);

    /// <summary>
    /// Validates uniqueness of allocations for flexible creation
    /// </summary>
    Task ValidateUniquenessForCreateAsync(
        int userId,
        int departmentId,
        int moduleId,
        List<(int ZoneId, int WardId, int? OldWardId)> distinctPairs,
        CancellationToken cancellationToken);

    /// <summary>
    /// Validates deactivation of a ward allocation
    /// </summary>
    Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        GlobalSurveyWardAllocationEntity currentEntity,
        GlobalSurveyWardAllocationEntity updatedEntity,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates deletion of a ward allocation
    /// </summary>
    Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        GlobalSurveyWardAllocationEntity entity,
        CancellationToken cancellationToken = default);
}
