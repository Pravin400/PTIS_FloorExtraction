using NtisPlatform.Application.DTOs.wardallocation;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Application.Services;

/// <summary>
/// Handles pair building and entity generation for ward allocations
/// </summary>
public class WardAllocationBuilder : IWardAllocationBuilder
{
    public List<(int ZoneId, int WardId, int? OldWardId)> BuildPairs(List<ZoneWardAllocationDto> allocations)
    {
        var result = new List<(int ZoneId, int WardId, int? OldWardId)>();
        if (allocations == null) return result;

        foreach (var allocation in allocations)
        {
            if (allocation.WardIds == null || allocation.WardIds.Count == 0) continue;

            var wardIds = allocation.WardIds;
            var oldWardIds = allocation.OldWardIds != null && allocation.OldWardIds.Count > 0
                ? allocation.OldWardIds.Select(id => (int?)id).ToList()
                : (allocation.OldWardId.HasValue ? new List<int?> { allocation.OldWardId } : new List<int?>());

            if (oldWardIds.Count == 0)
            {
                foreach (var wardId in wardIds)
                {
                    result.Add((allocation.ZoneId, wardId, null));
                }
            }
            else if (oldWardIds.Count == 1)
            {
                var singleOldWardId = oldWardIds[0];
                foreach (var wardId in wardIds)
                {
                    result.Add((allocation.ZoneId, wardId, singleOldWardId));
                }
            }
            else if (wardIds.Count == 1)
            {
                var singleWardId = wardIds[0];
                foreach (var oldWardId in oldWardIds)
                {
                    result.Add((allocation.ZoneId, singleWardId, oldWardId));
                }
            }
            else
            {
                if (wardIds.Count != oldWardIds.Count)
                {
                    throw new ArgumentException(
                        $"When allocating multiple wards to multiple old wards, the count of WardIds ({wardIds.Count}) and OldWardIds ({oldWardIds.Count}) must match to avoid silent data loss.");
                }

                for (var i = 0; i < wardIds.Count; i++)
                {
                    result.Add((allocation.ZoneId, wardIds[i], oldWardIds[i]));
                }
            }
        }
        return result;
    }

    public List<(int ZoneId, int WardId, int? OldWardId)> GetDistinctPairs(List<(int ZoneId, int WardId, int? OldWardId)> pairs)
    {
        if (pairs == null) return new List<(int ZoneId, int WardId, int? OldWardId)>();
        return pairs.GroupBy(p => new { p.ZoneId, p.WardId, p.OldWardId }).Select(g => g.First()).ToList();
    }

    public List<GlobalSurveyWardAllocationEntity> BuildEntitiesForCreate(
        CreateFlexibleWardAllocationDto createDto,
        List<(int ZoneId, int WardId, int? OldWardId)> distinctPairs,
        DateTime timestamp)
    {
        return distinctPairs
            .Select(pair => new GlobalSurveyWardAllocationEntity
            {
                UserId = createDto.UserId,
                DepartmentId = createDto.DepartmentId,
                ModuleId = createDto.ModuleId,
                ZoneId = pair.ZoneId,
                WardId = pair.WardId,
                OldWardId = pair.OldWardId,
                IsActive = createDto.IsActive,
                MarkedForDeletion = !createDto.IsActive,
                MarkedForDeletionDate = createDto.IsActive ? null : timestamp,
                CreatedBy = createDto.CreatedBy,
                CreatedDate = timestamp
            }).ToList();
    }

    public List<GlobalSurveyWardAllocationEntity> BuildEntitiesForReplace(
        UpdateFlexibleWardAllocationDto updateDto,
        int userId,
        int moduleId,
        List<(int ZoneId, int WardId, int? OldWardId)> distinctPairs,
        DateTime timestamp)
    {
        return distinctPairs
            .Select(pair => new GlobalSurveyWardAllocationEntity
            {
                UserId = userId,
                DepartmentId = updateDto.DepartmentId,
                ModuleId = moduleId,
                ZoneId = pair.ZoneId,
                WardId = pair.WardId,
                OldWardId = pair.OldWardId,
                IsActive = updateDto.IsActive,
                MarkedForDeletion = !updateDto.IsActive,
                MarkedForDeletionDate = updateDto.IsActive ? null : timestamp,
                CreatedBy = updateDto.UpdatedBy,
                CreatedDate = timestamp
            }).ToList();
    }

    public void PrepareExistingAllocationsForDeactivation(
        List<GlobalSurveyWardAllocationEntity> existingAllocations,
        int? updatedBy,
        DateTime timestamp)
    {
        if (existingAllocations == null) return;

        foreach (var existing in existingAllocations)
        {
            existing.IsActive = false;
            existing.MarkedForDeletion = true;
            existing.MarkedForDeletionDate = timestamp;
            existing.UpdatedBy = updatedBy;
            existing.UpdatedDate = timestamp;
        }
    }
}
