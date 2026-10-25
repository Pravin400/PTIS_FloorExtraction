using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Interfaces.Asset_Management;

namespace NtisPlatform.Application.Services.Asset_Management;

/// <summary>
/// Applies DOCUMENT-type grievance media corrections via <see cref="IAssetDocumentService"/>.
/// Structural twin of <see cref="AssetPhotoGrievanceMediaCorrectionApplier"/> — IAssetDocumentService
/// mirrors IAssetPhotoService's shape exactly, keyed on DocumentDefinitionId instead of PhotoTypeId.
///  </summary>
public class AssetDocumentGrievanceMediaCorrectionApplier : IAssetGrievanceMediaCorrectionApplier
{
    private readonly IAssetDocumentService _documentService;

    public AssetDocumentGrievanceMediaCorrectionApplier(IAssetDocumentService documentService)
    {
        _documentService = documentService;
    }

    public bool CanApply(string targetMediaType)
        => string.Equals(targetMediaType, "DOCUMENT", StringComparison.OrdinalIgnoreCase);

    public async Task ApplyAsync(AssetGrievanceMediaCorrectionEntity row, int assetId, int userId, CancellationToken cancellationToken = default)
    {
        switch (row.ActionType.ToUpperInvariant())
        {
            case "ADD":
            {
                var documentDefinitionId = row.DocumentDefinitionId ?? throw new InvalidOperationException("GrievanceMedia_DocumentDefinitionId_Required");
                var bindingId = row.NewDocumentBindingId ?? throw new InvalidOperationException("GrievanceMedia_NewDocumentBindingId_Required");
                var newDocumentId = await _documentService.CreateAsync(assetId, documentDefinitionId, null, row.Remarks, userId, cancellationToken);
                await _documentService.UpdateDocumentBindingAsync(newDocumentId, bindingId, userId, cancellationToken);
                break;
            }
            case "REPLACE":
            {
                var existingId = row.ExistingMediaRecordId;
                var documentDefinitionId = row.DocumentDefinitionId ?? throw new InvalidOperationException("GrievanceMedia_DocumentDefinitionId_Required");
                var bindingId = row.NewDocumentBindingId ?? throw new InvalidOperationException("GrievanceMedia_NewDocumentBindingId_Required");
                if (existingId.HasValue && existingId.Value > 0)
                {
                    var existingDoc = await _documentService.GetByIdAsync(existingId.Value, cancellationToken);
                    if (existingDoc == null || existingDoc.AssetId != assetId)
                    {
                        throw new InvalidOperationException($"Existing document {existingId.Value} does not belong to asset {assetId}.");
                    }
                    await _documentService.MarkAsSupersededAsync(existingId.Value, userId, cancellationToken);
                }
                var newDocumentId = await _documentService.CreateAsync(assetId, documentDefinitionId, null, row.Remarks, userId, cancellationToken);
                await _documentService.UpdateDocumentBindingAsync(newDocumentId, bindingId, userId, cancellationToken);
                break;
            }
            case "DELETE":
            {
                var toDelete = row.ExistingMediaRecordId ?? throw new InvalidOperationException("GrievanceMedia_ExistingMediaRecordId_Required");
                var existingDoc = await _documentService.GetByIdAsync(toDelete, cancellationToken);
                if (existingDoc == null || existingDoc.AssetId != assetId)
                {
                    throw new InvalidOperationException($"Existing document {toDelete} does not belong to asset {assetId}.");
                }
                await _documentService.DeleteAsync(toDelete, userId, cancellationToken);
                break;
            }
            default:
                throw new InvalidOperationException($"GrievanceMedia_UnknownActionType:{row.ActionType}");
        }
    }
}
