using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Interfaces.Asset_Management;

namespace NtisPlatform.Application.Services.Asset_Management;

/// <summary>
/// Applies PHOTO-type grievance media corrections via <see cref="IAssetPhotoService"/>.
/// </summary>
public class AssetPhotoGrievanceMediaCorrectionApplier : IAssetGrievanceMediaCorrectionApplier
{
    private readonly IAssetPhotoService _photoService;

    public AssetPhotoGrievanceMediaCorrectionApplier(IAssetPhotoService photoService)
    {
        _photoService = photoService;
    }

    public bool CanApply(string targetMediaType)
        => string.Equals(targetMediaType, "PHOTO", StringComparison.OrdinalIgnoreCase);

    public async Task ApplyAsync(AssetGrievanceMediaCorrectionEntity row, int assetId, int userId, CancellationToken cancellationToken = default)
    {
        switch (row.ActionType.ToUpperInvariant())
        {
            case "ADD":
            {
                var photoTypeId = row.PhotoTypeId ?? throw new InvalidOperationException("GrievanceMedia_PhotoTypeId_Required");
                var bindingId = row.NewDocumentBindingId ?? throw new InvalidOperationException("GrievanceMedia_NewDocumentBindingId_Required");
                var newPhotoId = await _photoService.CreateAsync(assetId, photoTypeId, null, null, row.Remarks, userId, cancellationToken);
                await _photoService.UpdateDocumentBindingAsync(newPhotoId, bindingId, userId, cancellationToken);
                break;
            }
            case "REPLACE":
            {
                var existingId = row.ExistingMediaRecordId;
                var photoTypeId = row.PhotoTypeId ?? throw new InvalidOperationException("GrievanceMedia_PhotoTypeId_Required");
                var bindingId = row.NewDocumentBindingId ?? throw new InvalidOperationException("GrievanceMedia_NewDocumentBindingId_Required");
                if (existingId.HasValue && existingId.Value > 0)
                {
                    var existingPhoto = await _photoService.GetByIdAsync(existingId.Value, cancellationToken);
                    if (existingPhoto == null || existingPhoto.AssetId != assetId)
                    {
                        throw new InvalidOperationException($"Existing photo {existingId.Value} does not belong to asset {assetId}.");
                    }
                    await _photoService.MarkAsSupersededAsync(existingId.Value, userId, cancellationToken);
                }
                var newPhotoId = await _photoService.CreateAsync(assetId, photoTypeId, null, null, row.Remarks, userId, cancellationToken);
                await _photoService.UpdateDocumentBindingAsync(newPhotoId, bindingId, userId, cancellationToken);
                break;
            }
            case "DELETE":
            {
                var toDelete = row.ExistingMediaRecordId ?? throw new InvalidOperationException("GrievanceMedia_ExistingMediaRecordId_Required");
                var existingPhoto = await _photoService.GetByIdAsync(toDelete, cancellationToken);
                if (existingPhoto == null || existingPhoto.AssetId != assetId)
                {
                    throw new InvalidOperationException($"Existing photo {toDelete} does not belong to asset {assetId}.");
                }
                await _photoService.DeleteAsync(toDelete, userId, cancellationToken);
                break;
            }
            default:
                throw new InvalidOperationException($"GrievanceMedia_UnknownActionType:{row.ActionType}");
        }
    }
}
