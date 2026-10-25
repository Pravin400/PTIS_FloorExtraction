using System;

namespace NtisPlatform.Application.DTOs.GIS;

public class GisDebugInfoResponseDto
{
    public int TotalFeatures { get; set; }
    public int LoadedTiles { get; set; }
    public long MemoryUsageBytes { get; set; }
    public DateTime ServerTime { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "HEALTHY";
    public string Engine { get; set; } = "NetTopologySuite-EFCore-Spatial-Engine";
}
