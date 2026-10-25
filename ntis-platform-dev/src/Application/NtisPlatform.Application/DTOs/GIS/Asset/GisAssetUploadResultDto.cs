namespace NtisPlatform.Application.DTOs.GIS.Asset;

/// <summary>
/// Result DTO returned upon uploading and ingesting Asset GeoJSON spatial polygons into AMS.GisAssetGeometry.
/// </summary>
public class GisAssetUploadResultDto
{
    public bool Success { get; set; } = true;
    public string FileName { get; set; } = string.Empty;
    public int TotalFeatures { get; set; }
    public int ImportedFeatures { get; set; }
    public int SkippedFeatures { get; set; }
    public string Mode { get; set; } = "replace";
    public double DurationSeconds { get; set; }
    public string Message { get; set; } = string.Empty;
}
