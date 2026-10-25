using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Application.DTOs.Asset_Management.AssetLeaseRentDetails;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Application.Interfaces.Asset_Management;

public interface IAssetLeaseRentDetailsService :
    ICommonCrudService<AssetLeaseRentDetailsEntity, AssetLeaseRentDetailsDto, CreateAssetLeaseRentDetailsDto, UpdateAssetLeaseRentDetailsDto, AssetLeaseRentDetailsQueryParameters, int>
{
    Task<AssetLeaseRentDetailsDto?> SendToVerificationAsync(int id, string? remarks, int userId, CancellationToken cancellationToken = default);
    Task<AssetLeaseRentDetailsDto?> VerifyAsync(int id, string? remarks, int userId, CancellationToken cancellationToken = default);
    Task<AssetLeaseRentDetailsDto?> ApproveAsync(int id, string? remarks, int userId, CancellationToken cancellationToken = default);
    Task<AssetLeaseRentDetailsDto?> RejectAsync(int id, string reason, int userId, CancellationToken cancellationToken = default);
    Task<AssetLeaseRentDetailsDto?> RevertToRegistrationAsync(int id, string? remarks, int userId, CancellationToken cancellationToken = default);
    Task<AssetLeaseRentDetailsDto?> RevertToVerificationAsync(int id, string? remarks, int userId, CancellationToken cancellationToken = default);
    Task<AssetLeaseRentDetailsDto?> UpdateAndSendToVerificationAsync(int id, UpdateAssetLeaseRentDetailsDto dto, int userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns all history snapshots for a given AssetLeaseRentDetails registration,
    /// projected as previous-tenant info for the "Previous Tenant Information" UI panel.
    /// </summary>
    Task<List<AssetLeaseRentPreviousTenantHistoryDto>> GetPreviousTenantHistoryAsync(int leaseRentRegistrationId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Uploads a document for AssetLeaseRentDetails.
    /// Documents are stored in Core.Document and linked via Core.DocumentBinding.
    /// </summary>
    Task<AssetLeaseRentDetailsDocumentUploadResponseDto> UploadDocumentAsync(
        Stream fileStream,
        string originalFileName,
        string mimeType,
        long fileSizeBytes,
        int assetLeaseRentDetailsId,
        int moduleId,
        string? documentType,
        string? documentTitle,
        string? remarks,
        bool isPrimaryDocument,
        string? bindingPurpose,
        int uploadedBy,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Department-scoped access check for a lease's sensitive data (documents, tenant history —
    /// Aadhaar/PAN/address/financials): does <paramref name="userId"/> have a UserRoleAllocation
    /// row for the same department as the lease's Asset? Fails closed — a lease whose asset has no
    /// department set is only accessible to an Admin.
    /// </summary>
    Task<bool> CanUserAccessLeaseAsync(
        int assetLeaseRentDetailsId,
        int userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Same department-scoped check as <see cref="CanUserAccessLeaseAsync"/>, but keyed directly by
    /// AssetId — for the paths where the caller names the asset themselves rather than an existing
    /// lease (Create's target asset; Update/SendForVerification's mutable AssetId, which can point
    /// at a different asset than the lease currently belongs to).
    /// </summary>
    Task<bool> CanUserAccessAssetAsync(
        int assetId,
        int userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all documents for a specific AssetLeaseRentDetails record.
    /// </summary>
    Task<List<AssetLeaseRentDetailsDocumentDto>> GetDocumentsByAssetLeaseRentDetailsIdAsync(
        int assetLeaseRentDetailsId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a document file stream for download. Only returns the file when the document is
    /// actually bound to <paramref name="assetLeaseRentDetailsId"/> — this is the caller's proof
    /// that they were shown this document via that lease record's document list, and prevents an
    /// authenticated user who merely obtains some other document's GUID from downloading it.
    /// </summary>
    Task<(Stream? FileStream, string FileName, string MimeType)> GetDocumentFileAsync(
        int assetLeaseRentDetailsId,
        Guid documentGuid,
        int userId,
        CancellationToken cancellationToken = default);
}
