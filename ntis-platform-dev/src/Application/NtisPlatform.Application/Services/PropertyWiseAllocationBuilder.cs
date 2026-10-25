using NtisPlatform.Application.DTOs.propertywise;
using NtisPlatform.Application.Interfaces;

namespace NtisPlatform.Application.Services;

/// <summary>
/// Handles mapping and pair generation for property-wise zone and ward allocations.
/// </summary>
public class PropertyWiseAllocationBuilder : IPropertyWiseAllocationBuilder
{
    public List<PropertyWisePair> BuildPairs(List<PropertyWiseZoneWardDto> allocations)
    {
        var result = new List<PropertyWisePair>();
        if (allocations == null) return result;

        foreach (var allocation in allocations)
        {
            var wardIds = allocation.WardIds;
            var oldWardIds = allocation.OldWardIds;

            if (oldWardIds == null || oldWardIds.Count == 0)
            {
                foreach (var wardId in wardIds)
                {
                    result.Add(new PropertyWisePair { ZoneId = allocation.ZoneId, WardId = wardId, OldWardId = null });
                }
            }
            else if (oldWardIds.Count == 1)
            {
                var singleOldWardId = oldWardIds[0];
                foreach (var wardId in wardIds)
                {
                    result.Add(new PropertyWisePair { ZoneId = allocation.ZoneId, WardId = wardId, OldWardId = singleOldWardId });
                }
            }
            else if (wardIds.Count == 1)
            {
                var singleWardId = wardIds[0];
                foreach (var oldWardId in oldWardIds)
                {
                    result.Add(new PropertyWisePair { ZoneId = allocation.ZoneId, WardId = singleWardId, OldWardId = oldWardId });
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
                    result.Add(new PropertyWisePair { ZoneId = allocation.ZoneId, WardId = wardIds[i], OldWardId = oldWardIds[i] });
                }
            }
        }

        return result;
    }

    public void PrepareExistingForDeactivation(
        Core.Entities.GlobalSurveyWardAllocationEntity existing,
        int? updatedBy,
        DateTime timestamp)
    {
        if (existing == null) return;
        existing.IsActive = false;
        existing.MarkedForDeletion = true;
        existing.MarkedForDeletionDate = timestamp;
        existing.UpdatedBy = updatedBy;
        existing.UpdatedDate = timestamp;
    }
}
