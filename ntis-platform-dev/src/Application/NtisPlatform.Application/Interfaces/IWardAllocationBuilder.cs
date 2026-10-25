using NtisPlatform.Application.DTOs.wardallocation;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Application.Interfaces;

/// <summary>
/// Builder responsible for constructing ward allocation pairs and entity models
/// </summary>
public interface IWardAllocationBuilder
{
    /// <summary>
    /// Flattens nested ZoneWardAllocationDto allocations into individual (ZoneId, WardId, OldWardId) tuples
    /// </summary>
    List<(int ZoneId, int WardId, int? OldWardId)> BuildPairs(List<ZoneWardAllocationDto> allocations);

    /// <summary>
    /// Filters duplicate (ZoneId, WardId) pairs keeping distinct entries
    /// </summary>
    List<(int ZoneId, int WardId, int? OldWardId)> GetDistinctPairs(List<(int ZoneId, int WardId, int? OldWardId)> pairs);

    /// <summary>
    /// Builds entity models for flexible creation
    /// </summary>
    List<GlobalSurveyWardAllocationEntity> BuildEntitiesForCreate(
        CreateFlexibleWardAllocationDto createDto,
        List<(int ZoneId, int WardId, int? OldWardId)> distinctPairs,
        DateTime timestamp);

    /// <summary>
    /// Builds new entity models for replacement operation
    /// </summary>
    List<GlobalSurveyWardAllocationEntity> BuildEntitiesForReplace(
        UpdateFlexibleWardAllocationDto updateDto,
        int userId,
        int moduleId,
        List<(int ZoneId, int WardId, int? OldWardId)> distinctPairs,
        DateTime timestamp);

    /// <summary>
    /// Prepares existing allocations for soft deactivation/replacement
    /// </summary>
    void PrepareExistingAllocationsForDeactivation(
        List<GlobalSurveyWardAllocationEntity> existingAllocations,
        int? updatedBy,
        DateTime timestamp);
}
