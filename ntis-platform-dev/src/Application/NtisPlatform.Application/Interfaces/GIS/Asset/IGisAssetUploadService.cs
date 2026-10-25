using System.IO;
using System.Threading;
using System.Threading.Tasks;
using NtisPlatform.Application.DTOs.GIS.Asset;

namespace NtisPlatform.Application.Interfaces.GIS;

/// <summary>
/// Service contract for high-performance streaming GeoJSON ingestion and atomic refresh of asset parcel polygons into AMS.GisAssetGeometry.
/// </summary>
public interface IGisAssetUploadService
{
    
    Task<GisAssetUploadResultDto> ProcessAssetGeoJsonAsync(
        Stream fileStream,
        string fileName,
        string uploadedBy,
        string mode = "replace",
        int? ulbId = null,
        CancellationToken ct = default);
}
