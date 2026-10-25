using System.Threading;
using System.Threading.Tasks;
using NtisPlatform.Application.DTOs.GIS.Asset;

namespace NtisPlatform.Application.Interfaces.GIS;

/// <summary>
/// Service interface for computing real-time, dynamic GIS KPI summary cards for Asset Management (DepartmentId = 3).
/// </summary>
public interface IGisAssetKpiService
{
    /// <summary>
    /// Computes aggregated KPI metric cards for the Asset GIS dashboard based on active filter parameters.
    /// </summary>
    Task<GisAssetKpiSummaryResponseDto> GetAssetKpiSummaryAsync(GisAssetDataRequestDto? filters, CancellationToken ct = default);
}
