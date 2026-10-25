using System.Threading;
using System.Threading.Tasks;
using NtisPlatform.Application.DTOs.GIS;
using NtisPlatform.Application.DTOs.GIS.Asset;
using NtisPlatform.Core.Entities.GIS;

namespace NtisPlatform.Application.Interfaces.GIS;

/// <summary>
/// Service interface for resolving dynamic GIS layer styling and feature color rules.
/// Supports layer database configuration (GIS.GisLayerMaster.StyleConfigJson),
/// application configuration (appsettings.json), and dynamic request overrides.
/// </summary>
public interface IGisStyleConfigService
{
    /// <summary>
    /// Fetches the dynamic style configuration for a layer, merging database config, appsettings, and cache.
    /// </summary>
    Task<GisLayerStyleConfigDto> GetLayerStyleConfigAsync(string? layerCode, int? departmentId, CancellationToken ct = default);

    /// <summary>
    /// Dynamically evaluates and resolves the hex color code for an asset geometry entity.
    /// </summary>
    string ResolveAssetColor(GisAssetGeometryEntity entity, GisLayerStyleConfigDto styleConfig, GisAssetDataRequestDto? filters);
}
