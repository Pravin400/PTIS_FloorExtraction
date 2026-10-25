using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using NtisPlatform.Application.DTOs.GIS.Asset;

namespace NtisPlatform.Application.Interfaces.GIS;

/// <summary>
/// Service interface for retrieving dynamic, cascading filter groups and options for Asset GIS.
/// </summary>
public interface IGisAssetFilterService
{
    /// <summary>
    /// Retrieves the dynamic filter groups (Zone, Ward, Asset Category, Asset Type) with cascaded options.
    /// </summary>
    Task<List<GisAssetFilterGroupDto>> GetAssetFilterGroupsAsync(int? zoneId, int? assetCategoryId, int? departmentId = null, CancellationToken ct = default);
}
