using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using NetTopologySuite.Geometries;
using NtisPlatform.Core.Entities.GIS;
using NtisPlatform.Core.Models.GIS;

namespace NtisPlatform.Core.Interfaces.GIS;

/// <summary>
/// Repository Interface for Asset GIS Spatial Operations using EF Core LINQ against AMS.GisAssetGeometry.
/// </summary>
public interface IGisAssetRepository
{
    Task<List<GisAssetGeometryEntity>> GetIntersectingAssetGeometriesAsync(Geometry envelope, CancellationToken ct = default);
    Task<int?> FindAssetMasterIdAtPointAsync(Point point, CancellationToken ct = default);
    Task<GisAssetGeometryEntity?> GetAssetGeometryByAssetMasterIdAsync(int assetMasterId, CancellationToken ct = default);
    Task<GisAssetGeometryEntity?> GetAssetGeometryByBuildingIdAsync(string buildingId, CancellationToken ct = default);
    Task ReplaceAllGeometriesAsync(IEnumerable<GisAssetGeometryEntity> entities, int? ulbId = null, CancellationToken ct = default);
    Task UpsertGeometriesAsync(IEnumerable<GisAssetGeometryEntity> entities, CancellationToken ct = default);
    Task<(HashSet<int> ValidIds, Dictionary<string, int> AssetNoToIdMap)> GetAssetMasterValidationLookupAsync(CancellationToken ct = default);

    /// <summary>
    /// Computes aggregated KPI metrics for Asset GIS based on active dynamic filters.
    /// </summary>
    Task<AssetKpiMetricsRawDto> GetAssetKpiMetricsAsync(
        int? zoneId,
        int? wardId,
        int? assetCategoryId,
        int? assetTypeId,
        string? kpiCode,
        int? financeYear,
        string? searchTerm,
        int? departmentId = null,
        CancellationToken ct = default);

    /// <summary>
    /// Retrieves active cascading master lookup data for Zone, Ward, Asset Category, and Asset Type.
    /// </summary>
    Task<(List<(int Id, string Name)> Zones, 
          List<(int Id, string Name, int ZoneId)> Wards, 
          List<(int Id, string Name, string Code)> Categories, 
          List<(int Id, string Name, string Code, int CategoryId, string? ColorCode, string? BorderColor, string? AssetWardNo)> Types)> GetFilterLookupsAsync(
        int? zoneId, 
        int? assetCategoryId, 
        CancellationToken ct = default);

    /// <summary>
    /// Retrieves active configured KPI card mappings for a department from GIS.GisDepartmentKpiMapping and GIS.GisKpiMaster.
    /// Only mappings where IsActive == true (on both mapping and master) are returned.
    /// </summary>
    Task<List<GisDepartmentKpiConfigDto>> GetActiveDepartmentKpisAsync(int departmentId, CancellationToken ct = default);

    /// <summary>
    /// Retrieves active configured filter mappings for a department from GIS.GisDepartmentFilterMapping and GIS.GisFilterMaster.
    /// Only mappings where IsActive == true (on both mapping and master) are returned.
    /// </summary>
    Task<List<GisDepartmentFilterConfigDto>> GetActiveDepartmentFiltersAsync(int departmentId, CancellationToken ct = default);

    /// <summary>
    /// Retrieves all 21 structured attributes for an asset popup across AMS.AssetMaster, AMS.AssetDetails, 
    /// AMS.SubUnitsDetails, AMS.RoomWiseSubmissionDetails, AMS.MonthWiseDemand, and AMS.GisAssetGeometry.
    /// </summary>
    Task<GisAssetPopupDetailsDto?> GetAssetPopupDetailsAsync(int assetId, CancellationToken ct = default);

    /// <summary>
    /// Retrieves all filtered asset records formatted for Excel spreadsheet export based on active dynamic filters.
    /// </summary>
    Task<List<GisAssetExportRowDto>> GetFilteredAssetExportListAsync(
        int? zoneId,
        int? wardId,
        int? assetCategoryId,
        int? assetTypeId,
        int? departmentId,
        string? encroachmentStatus,
        string? ownershipType,
        string? searchTerm,
        string? kpiCode,
        int? financeYear,
        double? minLat,
        double? minLng,
        double? maxLat,
        double? maxLng,
        int? ulbId = null,
        CancellationToken ct = default);
}
