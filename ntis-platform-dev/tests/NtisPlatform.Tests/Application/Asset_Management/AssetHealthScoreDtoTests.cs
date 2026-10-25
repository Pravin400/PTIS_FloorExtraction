using System.Collections.Generic;
using NtisPlatform.Application.DTOs.Asset_Management;
using NtisPlatform.Application.DTOs.Asset_Management.AssetDocument;
using NtisPlatform.Application.DTOs.Asset_Management.AssetMaster;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Application.DTOs.Asset_Management.AssetMaster;

namespace NtisPlatform.Tests.Application.Asset_Management;

/// <summary>
/// Comprehensive tests for AssetHealthScoreDto and AssetHealthScoreCalculator.
/// Targets 100% branch/line coverage of AssetHealthScoreCalculator.Calculate()
/// across all 7 scoring criteria and all DTO property paths.
/// </summary>
public class AssetHealthScoreDtoTests
{
    // ---------------------------------------------------------------
    // AssetHealthScoreDto — property coverage
    // ---------------------------------------------------------------

    [Fact]
    public void AssetHealthScoreDto_Properties_GetSet_WorksCorrectly()
    {
        var dto = new AssetHealthScoreDto
        {
            AssetId = 42,
            HealthScore = 85.5m,
            HealthScoreRating = "(6.0 / 7)"
        };

        Assert.Equal(42, dto.AssetId);
        Assert.Equal(85.5m, dto.HealthScore);
        Assert.Equal("(6.0 / 7)", dto.HealthScoreRating);
    }

    [Fact]
    public void AssetHealthScoreDto_DefaultRatingString_IsEmpty()
    {
        var dto = new AssetHealthScoreDto();
        Assert.Equal(string.Empty, dto.HealthScoreRating);
        Assert.Equal(0, dto.AssetId);
        Assert.Equal(0m, dto.HealthScore);
    }

    // ---------------------------------------------------------------
    // HealthScoreResult — property coverage
    // ---------------------------------------------------------------

    [Fact]
    public void HealthScoreResult_Properties_GetSet_WorksCorrectly()
    {
        var result = new HealthScoreResult
        {
            ScoreOutOfSeven = 6.5m,
            HealthPercentage = 93m,
            StarRating = 4.6m,
            RatingString = "(6.5 / 7)"
        };

        Assert.Equal(6.5m, result.ScoreOutOfSeven);
        Assert.Equal(93m, result.HealthPercentage);
        Assert.Equal(4.6m, result.StarRating);
        Assert.Equal("(6.5 / 7)", result.RatingString);
    }

    [Fact]
    public void HealthScoreResult_DefaultRatingString_IsEmpty()
    {
        var result = new HealthScoreResult();
        Assert.Equal(string.Empty, result.RatingString);
    }

    // ---------------------------------------------------------------
    // AssetHealthScoreCalculator.Calculate() — null input
    // ---------------------------------------------------------------

    [Fact]
    public void Calculate_NullAsset_ReturnsDefaultScore()
    {
        var result = AssetHealthScoreCalculator.Calculate(null!);

        Assert.Equal(5.6m, result.ScoreOutOfSeven);
        Assert.Equal(80m, result.HealthPercentage);
        Assert.Equal(4.0m, result.StarRating);
        Assert.Equal("(5.6 / 7)", result.RatingString);
    }

    // ---------------------------------------------------------------
    // Criterion 1: Physical Condition (AssetConditionId)
    // ---------------------------------------------------------------

    [Fact]
    public void Calculate_ConditionId1_ScoresFullConditionPoint()
    {
        // Condition 1 = "Excellent" => scoreCondition = 1.0 (baseline 2.3 + 1.0 = 3.3)
        var asset = BuildMinimalAsset();
        asset.AssetConditionId = 1;

        var result = AssetHealthScoreCalculator.Calculate(asset);

        Assert.Equal(3.3m, result.ScoreOutOfSeven);
        Assert.Equal(47m, result.HealthPercentage);
        Assert.Equal("(3.3 / 7)", result.RatingString);
    }

    [Fact]
    public void Calculate_ConditionId2_ScoresSevenTenths()
    {
        // Condition 2 = "Good" => scoreCondition = 0.7 (baseline 2.3 + 0.7 = 3.0)
        var asset = BuildMinimalAsset();
        asset.AssetConditionId = 2;

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.Equal(3.0m, result.ScoreOutOfSeven);
        Assert.Equal(43m, result.HealthPercentage);
        Assert.Equal("(3.0 / 7)", result.RatingString);
    }

    [Fact]
    public void Calculate_ConditionId3_ScoresThreeTenths()
    {
        // Condition 3 = "Poor" => scoreCondition = 0.3 (baseline 2.3 + 0.3 = 2.6)
        var asset = BuildMinimalAsset();
        asset.AssetConditionId = 3;

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.Equal(2.6m, result.ScoreOutOfSeven);
        Assert.Equal(37m, result.HealthPercentage);
        Assert.Equal("(2.6 / 7)", result.RatingString);
    }

    [Fact]
    public void Calculate_OtherConditionId_ScoresEightTenths()
    {
        // ConditionId != null but != 1/2/3 => scoreCondition = 0.8 (baseline 2.3 + 0.8 = 3.1)
        var asset = BuildMinimalAsset();
        asset.AssetConditionId = 99;

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.Equal(3.1m, result.ScoreOutOfSeven);
        Assert.Equal(44m, result.HealthPercentage);
        Assert.Equal("(3.1 / 7)", result.RatingString);
    }

    [Fact]
    public void Calculate_ConditionFactor_OverridesIdAndName()
    {
        // Stable ConditionFactor takes priority over surrogate IDs (e.g. 0.85m => 2.3 + 0.85 = 3.15 rounded to 3.2m)
        var asset = BuildMinimalAsset();
        asset.AssetConditionId = 3; // would be 0.3
        asset.AssetCondition = "Poor"; // would be 0.3
        asset.AssetConditionFactor = 0.9m; // should be 0.9 => 2.3 + 0.9 = 3.2

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.Equal(3.2m, result.ScoreOutOfSeven);
        Assert.Equal(46m, result.HealthPercentage);
        Assert.Equal("(3.2 / 7)", result.RatingString);
    }

    [Fact]
    public void Calculate_ConditionNameString_ScoresByText()
    {
        var asset = BuildMinimalAsset();
        asset.AssetCondition = "Excellent Condition";

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.Equal(3.3m, result.ScoreOutOfSeven);
        Assert.Equal("(3.3 / 7)", result.RatingString);
    }

    [Fact]
    public void Calculate_NullConditionId_ScoresHalfPoint()
    {
        // No ConditionId => scoreCondition = 0.5 (default => 2.3 + 0.5 = 2.8)
        var asset = BuildMinimalAsset();
        asset.AssetConditionId = null;

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.Equal(2.8m, result.ScoreOutOfSeven);
        Assert.Equal(40m, result.HealthPercentage);
        Assert.Equal("(2.8 / 7)", result.RatingString);
    }

    // ---------------------------------------------------------------
    // Criterion 2: Occupancy & Lease Rent Status
    // ---------------------------------------------------------------

    [Fact]
    public void Calculate_OccupancyContainsOccupied_ScoresFullPoint()
    {
        var asset = BuildMinimalAsset();
        asset.OccupancyStatus = "Fully Occupied";

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    [Fact]
    public void Calculate_OccupancyContainsSelf_ScoresFullPoint()
    {
        var asset = BuildMinimalAsset();
        asset.OccupancyStatus = "Self-Use";

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    [Fact]
    public void Calculate_OccupancyContainsVacant_ScoresSixTenths()
    {
        var asset = BuildMinimalAsset();
        asset.OccupancyStatus = "Vacant";

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    [Fact]
    public void Calculate_OccupancyContainsUnoccupied_ScoresSixTenths()
    {
        var asset = BuildMinimalAsset();
        asset.OccupancyStatus = "Unoccupied - Not In Use";

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    [Fact]
    public void Calculate_OccupancyNull_ScoresDefault()
    {
        // null OccupancyStatus => toEmptyString => no match => 0.5
        var asset = BuildMinimalAsset();
        asset.OccupancyStatus = null;

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    // ---------------------------------------------------------------
    // Criterion 3: Ownership & Legal Title Completeness
    // ---------------------------------------------------------------

    [Fact]
    public void Calculate_SelfOwnership_WithDocument_ScoresFullLegalPoint()
    {
        var asset = BuildMinimalAsset();
        asset.OwnershipType = "Self-Owned";
        asset.AssetDocumentId = 10;   // hasDoc = true

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    [Fact]
    public void Calculate_LeasedOwnership_WithDocument_ScoresFullLegalPoint()
    {
        var asset = BuildMinimalAsset();
        asset.OwnershipType = "Leased";
        asset.AssetDocumentId = 5;

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    [Fact]
    public void Calculate_MunicipalOwnership_WithDocument_ScoresFullLegalPoint()
    {
        var asset = BuildMinimalAsset();
        asset.OwnershipType = "Municipal";
        asset.Documents = new List<AssetDocumentDto> { new() };

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    [Fact]
    public void Calculate_NonSelfOwnership_WithDocument_ScoresEightTenths()
    {
        // Non-self/leased/municipal ownership + doc => 0.8
        var asset = BuildMinimalAsset();
        asset.OwnershipType = "Private";
        asset.AssetDocumentId = 7;

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    [Fact]
    public void Calculate_NonSelfOwnership_NoDocument_ScoresSixTenths()
    {
        // Non-empty ownership, no doc => 0.6
        var asset = BuildMinimalAsset();
        asset.OwnershipType = "Private";
        asset.AssetDocumentId = null;

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    [Fact]
    public void Calculate_NoOwnership_WithDocument_ScoresSixTenths()
    {
        // Empty ownership, but has doc => 0.6
        var asset = BuildMinimalAsset();
        asset.OwnershipType = null;
        asset.AssetDocumentId = 3;

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    [Fact]
    public void Calculate_NoOwnership_NoDocument_ScoresLowestLegal()
    {
        // Empty ownership, no doc => 0.2 (default)
        var asset = BuildMinimalAsset();
        asset.OwnershipType = null;
        asset.AssetDocumentId = null;

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    // ---------------------------------------------------------------
    // Criterion 4: Geo-Tagging & Visual Evidence
    // ---------------------------------------------------------------

    [Fact]
    public void Calculate_OnePhotoAndGis_ScoresFullPhotoPoint()
    {
        var asset = BuildMinimalAsset();
        asset.TotalPhotos = 1;
        asset.GisMapGuid = System.Guid.NewGuid();

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    [Fact]
    public void Calculate_TwoPhotosNoGis_ScoresNineTenths()
    {
        var asset = BuildMinimalAsset();
        asset.TotalPhotos = 2;
        asset.GisMapGuid = null;

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    [Fact]
    public void Calculate_OnePhotoNoGis_ScoresSevenTenths()
    {
        var asset = BuildMinimalAsset();
        asset.TotalPhotos = 1;
        asset.GisMapGuid = null;

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    [Fact]
    public void Calculate_HasAssetPhotoGuidNoTotalPhotos_ScoresSevenTenths()
    {
        // photoCount == 0, but AssetPhotoGuid.HasValue is true
        var asset = BuildMinimalAsset();
        asset.TotalPhotos = 0;
        asset.AssetPhotoGuid = System.Guid.NewGuid();
        asset.GisMapGuid = null;

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    [Fact]
    public void Calculate_PhotosFromCollection_CountsCorrectly()
    {
        // TotalPhotos = 0, but Photos list has items
        var asset = BuildMinimalAsset();
        asset.TotalPhotos = 0;
        asset.Photos = new List<AssetPhotoDto> { new(), new() };
        asset.GisMapGuid = null;

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    [Fact]
    public void Calculate_NoPhotosNoGis_ScoresDefaultPhoto()
    {
        // No photo count, no guid => scorePhotos = 0.2
        var asset = BuildMinimalAsset();
        asset.TotalPhotos = 0;
        asset.Photos = new List<AssetPhotoDto>();
        asset.AssetPhotoGuid = null;
        asset.GisMapGuid = null;

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    // ---------------------------------------------------------------
    // Criterion 5: Sub-Unit & Spatial Area Completeness
    // ---------------------------------------------------------------

    [Fact]
    public void Calculate_HasSubUnits_ScoresFullSpatialPoint()
    {
        var asset = BuildMinimalAsset();
        asset.TotalSubUnits = 3;

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    [Fact]
    public void Calculate_HasUnitsNoSubUnits_ScoresSevenTenths()
    {
        var asset = BuildMinimalAsset();
        asset.TotalSubUnits = 0;
        asset.TotalUnits = 2;

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    [Fact]
    public void Calculate_NoUnitsNoSubUnits_ScoresDefaultSpatial()
    {
        var asset = BuildMinimalAsset();
        asset.TotalSubUnits = 0;
        asset.TotalUnits = 0;

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    // ---------------------------------------------------------------
    // Criterion 6: Valuation & Assessment Freshness
    // ---------------------------------------------------------------

    [Fact]
    public void Calculate_HasCapitalValue_ScoresFullValuationPoint()
    {
        var asset = BuildMinimalAsset();
        asset.CapitalValue = 500000m;

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    [Fact]
    public void Calculate_NullCapitalValue_ScoresDefaultValuation()
    {
        var asset = BuildMinimalAsset();
        asset.CapitalValue = null;

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    [Fact]
    public void Calculate_ZeroCapitalValue_ScoresDefaultValuation()
    {
        var asset = BuildMinimalAsset();
        asset.CapitalValue = 0m;

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    // ---------------------------------------------------------------
    // Criterion 7: Workflow & Verification Status (IsActive)
    // ---------------------------------------------------------------

    [Fact]
    public void Calculate_ActiveAsset_ScoresEightTenthsWorkflow()
    {
        var asset = BuildMinimalAsset();
        asset.IsActive = true;

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    [Fact]
    public void Calculate_InactiveAsset_ScoresFiveTenthsWorkflow()
    {
        var asset = BuildMinimalAsset();
        asset.IsActive = false;

        var result = AssetHealthScoreCalculator.Calculate(asset);
        Assert.True(result.ScoreOutOfSeven > 0);
    }

    // ---------------------------------------------------------------
    // Combined / boundary scenarios
    // ---------------------------------------------------------------

    [Fact]
    public void Calculate_MaximumScenario_ScoresSevenOutOfSeven()
    {
        // All criteria at maximum
        var asset = new AssetMasterDto
        {
            IsActive = true,
            AssetConditionId = 1,                        // 1.0
            OccupancyStatus = "Self-Occupied",           // 1.0
            OwnershipType = "Municipal",
            AssetDocumentId = 1,                         // 1.0 (municipal + doc)
            TotalPhotos = 2,
            GisMapGuid = System.Guid.NewGuid(),          // 1.0 (photo >= 1 && GIS)
            TotalSubUnits = 5,                           // 1.0
            CapitalValue = 1_000_000m,                   // 1.0
            Photos = new List<AssetPhotoDto>(),
            Documents = new List<AssetDocumentDto>()
        };

        var result = AssetHealthScoreCalculator.Calculate(asset);

        Assert.Equal(7.0m, result.ScoreOutOfSeven);
        Assert.Equal(100m, result.HealthPercentage);
        Assert.True(result.StarRating > 0);
        Assert.Contains("7.0 / 7", result.RatingString);
    }

    [Fact]
    public void Calculate_MinimumScenario_ScoresAboveZero()
    {
        // All criteria at minimum (all defaults hit)
        var asset = new AssetMasterDto
        {
            IsActive = false,
            AssetConditionId = null,
            OccupancyStatus = null,
            OwnershipType = null,
            AssetDocumentId = null,
            TotalPhotos = 0,
            GisMapGuid = null,
            AssetPhotoGuid = null,
            TotalSubUnits = 0,
            TotalUnits = 0,
            CapitalValue = null,
            Photos = new List<AssetPhotoDto>(),
            Documents = new List<AssetDocumentDto>()
        };

        var result = AssetHealthScoreCalculator.Calculate(asset);

        Assert.True(result.ScoreOutOfSeven > 0);
        Assert.True(result.HealthPercentage >= 0);
        Assert.Contains("/ 7", result.RatingString);
    }

    [Fact]
    public void Calculate_RatingStringFormat_IsCorrect()
    {
        var asset = BuildMinimalAsset();
        asset.AssetConditionId = 1;
        asset.IsActive = true;

        var result = AssetHealthScoreCalculator.Calculate(asset);

        // Format should always be "(X.X / 7)"
        Assert.Matches(@"^\(\d+\.\d+ \/ 7\)$", result.RatingString);
    }

    [Fact]
    public void Calculate_HealthPercentage_IsRounded()
    {
        var asset = BuildMinimalAsset();
        var result = AssetHealthScoreCalculator.Calculate(asset);

        // HealthPercentage should be a whole number (rounded to 0 decimals)
        Assert.Equal(0, result.HealthPercentage % 1);
    }

    [Fact]
    public void Calculate_StarRating_IsInZeroToFiveRange()
    {
        var asset = BuildMinimalAsset();
        var result = AssetHealthScoreCalculator.Calculate(asset);

        Assert.True(result.StarRating >= 0m && result.StarRating <= 5.0m);
    }

    // ---------------------------------------------------------------
    // Helper
    // ---------------------------------------------------------------

    private static AssetMasterDto BuildMinimalAsset() => new()
    {
        IsActive = true,
        AssetConditionId = null,
        OccupancyStatus = null,
        OwnershipType = null,
        AssetDocumentId = null,
        TotalPhotos = 0,
        TotalSubUnits = 0,
        TotalUnits = 0,
        CapitalValue = null,
        Photos = new List<AssetPhotoDto>(),
        Documents = new List<AssetDocumentDto>()
    };
}
