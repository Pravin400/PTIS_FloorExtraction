using NtisPlatform.Application.DTOs.Asset_Management.AssetGrievanceDocument;

namespace NtisPlatform.Application.Interfaces.Asset_Management;

public interface IAssetGrievanceDocumentApplicationService
{
    Task<AssetGrievanceDocumentBulkSaveResponseDto> BulkSaveAsync(AssetGrievanceDocumentBulkSaveDto request, CancellationToken cancellationToken = default);
    Task<List<AssetGrievanceDocumentResponseDto>> GetDocumentsByGrievanceIdAsync(int grievanceDetailsId, CancellationToken cancellationToken = default);
}
