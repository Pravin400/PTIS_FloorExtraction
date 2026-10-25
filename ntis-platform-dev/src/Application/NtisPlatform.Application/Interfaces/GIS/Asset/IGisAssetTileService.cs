using System.Threading;
using System.Threading.Tasks;
using NtisPlatform.Application.DTOs.GIS;
using NtisPlatform.Application.DTOs.GIS.Asset;

namespace NtisPlatform.Application.Interfaces.GIS;

/// <summary>
/// Interface for Asset GIS Vector Tile rendering engine, spatial point-in-polygon identify, and geometry queries.
/// </summary>
public interface IGisAssetTileService
{
    Task<byte[]> GetAssetTileAsync(TileCoordDto coord, GisAssetDataRequestDto filters, CancellationToken ct = default);
    Task<int?> FindAssetIdAtPointAsync(double lat, double lng, CancellationToken ct = default);
    Task<object?> GetAssetGeometryAsync(string targetId, CancellationToken ct = default);
    Task<GisDebugInfoResponseDto> GetDebugInfoAsync(CancellationToken ct = default);
    Task ReloadStatusCacheAsync(CancellationToken ct = default);
    Task<byte[]> ExportAssetPointsToExcelAsync(GisAssetDataRequestDto filters, CancellationToken ct = default);
}
