using System.Threading;
using System.Threading.Tasks;
using NtisPlatform.Core.Models.GIS;

namespace NtisPlatform.Application.Interfaces.GIS;

/// <summary>
/// Service interface for retrieving formatted Asset GIS Popup details.
/// </summary>
public interface IGisAssetPopupService
{
    /// <summary>
    /// Retrieves all 21 structured attributes for the Asset GIS map popup.
    /// </summary>
    /// <param name="assetId">The primary key (AssetId) of the asset.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Formatted GisAssetPopupDetailsDto or null if asset not found.</returns>
    Task<GisAssetPopupDetailsDto?> GetAssetPopupDetailsAsync(int assetId, CancellationToken ct = default);
}
