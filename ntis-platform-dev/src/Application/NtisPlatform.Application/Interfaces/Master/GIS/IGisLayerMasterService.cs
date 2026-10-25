using System.IO;
using System.Threading;
using System.Threading.Tasks;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.DTOs.GIS;
using NtisPlatform.Core.Entities.GIS;

namespace NtisPlatform.Application.Interfaces.Master;

public interface IGisLayerMasterService : ICommonCrudService<
    GisLayerMasterEntity, 
    GisLayerMasterDto, 
    CreateGisLayerMasterDto, 
    UpdateGisLayerMasterDto, 
    GisLayerMasterQueryParameters, 
    int>
{
    /// <summary>
    /// Validates, streams, and saves an uploaded GeoJSON boundary file for a specific layer.
    /// </summary>
    Task<GisUploadResultDto> UploadGeoJsonFileAsync(int layerMasterId, Microsoft.AspNetCore.Http.IFormFile file, CancellationToken ct = default);

    /// <summary>
    /// Streams and saves large GeoJSON boundary files directly into GIS.GisLayerJson with audit logging.
    /// </summary>
    Task<GisUploadResultDto> UploadGeoJsonAsync(int layerMasterId, Stream fileStream, string fileName, long fileSizeBytes, CancellationToken ct = default);

    /// <summary>
    /// Fetches the raw or style-enriched GeoJSON boundary string stored for a specific layer.
    /// </summary>
    Task<string?> GetGeoJsonAsync(int layerMasterId, CancellationToken ct = default);
}
