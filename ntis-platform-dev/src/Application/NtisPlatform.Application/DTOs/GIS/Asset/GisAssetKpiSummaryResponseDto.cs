using System;
using System.Collections.Generic;

namespace NtisPlatform.Application.DTOs.GIS.Asset;

/// <summary>
/// Response DTO containing all calculated GIS KPI Cards and applied filter context.
/// </summary>
public class GisAssetKpiSummaryResponseDto
{
    public int DepartmentId { get; set; } = 3;
    public string DepartmentCode { get; set; } = "AMS";
    public string DepartmentName { get; set; } = "Asset Management";
    public int TotalAssets { get; set; }
    public List<GisAssetKpiCardDto> Cards { get; set; } = new();
    public GisAssetDataRequestDto AppliedFilters { get; set; } = new();
    public DateTime GeneratedAtUtc { get; set; } = DateTime.UtcNow;
}
