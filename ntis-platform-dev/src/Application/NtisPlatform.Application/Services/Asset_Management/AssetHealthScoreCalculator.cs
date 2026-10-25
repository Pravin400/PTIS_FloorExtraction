using System;
using NtisPlatform.Application.DTOs.Asset_Management.AssetMaster;

namespace NtisPlatform.Application.Services.Asset_Management;

/// <summary>
/// Service to calculate Asset Health Score based on 7 Criteria (Max Score = 7.0 Points).
/// </summary>
public static class AssetHealthScoreCalculator
{
    public static HealthScoreResult Calculate(AssetMasterDto asset)
    {
        if (asset == null)
        {
            return new HealthScoreResult
            {
                ScoreOutOfSeven = 5.6m,
                HealthPercentage = 80m,
                StarRating = 4.0m,
                RatingString = "(5.6 / 7)"
            };
        }

        // 1. Physical Condition (Max 1.0)
        decimal scoreCondition = 0.5m;
        var condName = (asset.AssetCondition ?? "").ToLowerInvariant();

        if (asset.AssetConditionFactor.HasValue && asset.AssetConditionFactor.Value > 0)
        {
            scoreCondition = Math.Clamp(asset.AssetConditionFactor.Value, 0.1m, 1.0m);
        }
        else if (condName.Contains("excellent") || condName.Contains("very good"))
        {
            scoreCondition = 1.0m;
        }
        else if (condName.Contains("good"))
        {
            scoreCondition = 0.7m;
        }
        else if (condName.Contains("poor") || condName.Contains("dilapidated") || condName.Contains("bad"))
        {
            scoreCondition = 0.3m;
        }
        else if (condName.Contains("fair") || condName.Contains("average"))
        {
            scoreCondition = 0.6m;
        }
        else if (asset.AssetConditionId == 1)
        {
            scoreCondition = 1.0m;
        }
        else if (asset.AssetConditionId == 2)
        {
            scoreCondition = 0.7m;
        }
        else if (asset.AssetConditionId == 3)
        {
            scoreCondition = 0.3m;
        }
        else if (asset.AssetConditionId.HasValue)
        {
            scoreCondition = 0.8m;
        }

        // 2. Occupancy & Lease Rent Status (Max 1.0)
        decimal scoreOccupancy = 0.5m;
        var occStatus = (asset.OccupancyStatus ?? "").ToLowerInvariant();
        if (occStatus.Contains("vacant") || occStatus.Contains("unoccupied"))
        {
            scoreOccupancy = 0.6m;
        }
        else if (occStatus.Contains("occupied") || occStatus.Contains("self"))
        {
            scoreOccupancy = 1.0m;
        }

        // 3. Ownership & Legal Title Completeness (Max 1.0)
        decimal scoreLegal = 0.2m;
        var ownType = (asset.OwnershipType ?? "").ToLowerInvariant();
        bool hasDoc = asset.AssetDocumentId.HasValue || (asset.Documents != null && asset.Documents.Count > 0);
        if ((ownType.Contains("self") || ownType.Contains("leased") || ownType.Contains("municipal")) && hasDoc)
        {
            scoreLegal = 1.0m;
        }
        else if (!string.IsNullOrWhiteSpace(ownType))
        {
            scoreLegal = hasDoc ? 0.8m : 0.6m;
        }
        else if (hasDoc)
        {
            scoreLegal = 0.6m;
        }

        // 4. Geo-Tagging & Visual Evidence (Max 1.0)
        decimal scorePhotos = 0.2m;
        int photoCount = asset.TotalPhotos > 0 ? asset.TotalPhotos : (asset.Photos != null ? asset.Photos.Count : 0);
        bool hasGis = asset.GisMapGuid.HasValue ||
                      (asset.Photos != null && asset.Photos.Any(p =>
                          (p.PhotoTypeCode?.Contains("GIS", StringComparison.OrdinalIgnoreCase) ?? false) ||
                          (p.PhotoTypeName?.Contains("gis map", StringComparison.OrdinalIgnoreCase) ?? false)));
        if (photoCount >= 1 && hasGis)
        {
            scorePhotos = 1.0m;
        }
        else if (photoCount >= 2)
        {
            scorePhotos = 0.9m;
        }
        else if (photoCount >= 1 || asset.AssetPhotoGuid.HasValue)
        {
            scorePhotos = 0.7m;
        }

        // 5. Sub-Unit & Spatial Area Completeness (Max 1.0)
        decimal scoreSpatial = 0.2m;
        int subUnits = asset.TotalSubUnits;
        if (subUnits > 0)
        {
            scoreSpatial = 1.0m;
        }
        else if (asset.TotalUnits > 0)
        {
            scoreSpatial = 0.7m;
        }

        // 6. Valuation & Assessment Freshness (Max 1.0)
        decimal scoreValuation = 0.2m;
        decimal capVal = asset.CapitalValue.HasValue ? asset.CapitalValue.Value : 0m;
        if (capVal > 0)
        {
            scoreValuation = 1.0m;
        }

        // 7. Workflow & Verification Status (Max 1.0)
        decimal scoreWorkflow = asset.IsActive ? 1.0m : 0.5m;

        decimal rawSum = scoreCondition + scoreOccupancy + scoreLegal + scorePhotos + scoreSpatial + scoreValuation + scoreWorkflow;
        decimal scoreOutOfSeven = Math.Round(Math.Min(7.0m, Math.Max(0m, rawSum)), 1);
        decimal healthPercentage = Math.Round((scoreOutOfSeven / 7.0m) * 100m, 0);
        decimal starRating = Math.Round((scoreOutOfSeven / 7.0m) * 5.0m, 1);
        string ratingString = $"({scoreOutOfSeven:0.0} / 7)";

        return new HealthScoreResult
        {
            ScoreOutOfSeven = scoreOutOfSeven,
            HealthPercentage = healthPercentage,
            StarRating = starRating,
            RatingString = ratingString
        };
    }
}
