using NtisPlatform.Application.DTOs.Asset_Management.AssetMaster;
using NtisPlatform.Application.DTOs.Asset_Management.AssetFieldValue;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Asset_Management;

namespace NtisPlatform.Application.Interfaces.Asset_Management;

/// <summary>
/// Service interface for asset master CRUD operations and dashboard statistics.
/// </summary>
public interface IAssetMasterService : ICommonCrudService<AssetMasterEntity, AssetMasterDto, CreateAssetMasterDto, UpdateAssetMasterDto, AssetMasterQueryParameters, int>
{


    /// <summary>
    /// Activates an asset, all field values linked to the asset, and child assets that reference it as parent.
    /// </summary>
    Task<bool> ActivateAssetAndFieldValuesAsync(int assetId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all child assets by parent asset ID and floor details ID.
    /// </summary>
    Task<List<AssetMasterDto>> GetByParentAssetIdAsync(int parentAssetId, int floorDetailsId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets shop-wise details including asset and renter information by parent asset ID.
    /// </summary>
    Task<List<ShopWiseDetailsDto>> GetShopWiseDetailsByParentAssetIdAsync(int parentAssetId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all sub-assets (child assets) grouped by parent asset ID with their related
    /// floor details, room-wise submissions, and renter details.
    /// </summary>
    /// <param name="parentAssetId">The parent asset ID to get sub-assets for.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>A grouped response containing parent asset info and all sub-assets with related details.</returns>
    Task<SubAssetGroupedResponseDto> GetSubAssetsGroupedByParentAsync(int parentAssetId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the paged main-asset list for the Asset Register grid: each main asset with its sub-unit
    /// count and roll-ups (area, capital value, rent, outstanding, documents) and its uploaded photo /
    /// document files (with DocumentGuid), plus totals over the whole filtered set.
    /// <c>ParentAssetId</c> in <paramref name="queryParameters"/> is ignored.
    /// </summary>
    Task<ParentAssetListResponseDto> GetParentAssetDetailsAsync(AssetMasterQueryParameters queryParameters, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets one page of the sub-units of a parent asset (non-deleted child assets that are not
    /// inventory items), each with its active floor / sub-floor rows and the uploaded photo and
    /// document files (with their DocumentGuid). Supports search (unit number, name, regional name,
    /// active-lease tenant) and sort (AssetNo, AssetName, CreatedDate). Returns null when the parent
    /// asset does not exist.
    /// </summary>
    /// <exception cref="NtisPlatform.Application.Exceptions.FilterValidationException">SortBy names an unsupported field.</exception>
    Task<ParentSubUnitDetailsResponseDto?> GetSubUnitDetailsByParentAsync(int parentAssetId, SubUnitDetailsQueryParameters queryParameters, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the combined payload used by the floor and other details tab for a single asset.
    /// </summary>
    Task<AssetFloorAndOtherDetailsResponseDto?> GetAssetFloorAndOtherDetailsAsync(int assetId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates a unique AssetNo using the ULB code prefix, category segment, type segment, and incremental sequence.
    /// </summary>
    Task<string> GenerateAssetNoAsync(int assetCategoryId, int assetTypeId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates a batch of unique AssetNos.
    /// </summary>
    Task<List<string>> GenerateAssetNosAsync(int assetCategoryId, int assetTypeId, int count, string? subunitPrefix = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the ULB code prefix from ULBMasterEntity.
    /// </summary>
    Task<string> GetUlbCodeAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates a batch of unique AssetNos starting with the specified prefix and padded sequence numbers.
    /// </summary>
    Task<List<string>> GenerateAssetNosWithPrefixAsync(string prefix, int count, int padding, CancellationToken cancellationToken = default);

    /// <summary>
    /// Bulk saves field values for an asset, updating existing ones and inserting new ones.
    /// </summary>
    Task<bool> BulkSaveFieldValuesAsync(int assetId, List<CreateAssetFieldValueDto> fieldValues, CancellationToken cancellationToken = default);

    /// <summary>
    /// Exports filtered asset master records to an Excel spreadsheet.
    /// </summary>
    Task<byte[]> ExportToExcelAsync(AssetMasterQueryParameters queryParameters, CancellationToken cancellationToken = default);

    /// <summary>
    /// Computes a real HealthScore/HealthScoreRating (from actual condition, occupancy, ownership,
    /// documents, photos, sub-units, and capital value) for each given asset id in one batch — used
    /// for child/sub-unit rows, which are full AssetMaster rows with their own id but aren't part of
    /// a parent's paginated list response and so never get a HealthScore computed for them otherwise.
    /// Ids that don't resolve to an asset are simply omitted from the result.
    /// </summary>
    Task<List<AssetHealthScoreDto>> GetHealthScoresBatchAsync(List<int> assetIds, CancellationToken cancellationToken = default);
}
