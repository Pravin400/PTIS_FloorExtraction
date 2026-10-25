using System;
using System.Threading;
using System.Threading.Tasks;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Application.Interfaces; 
using Microsoft.Extensions.Logging;

namespace NtisPlatform.Infrastructure.Services.Handlers;

/// <summary>
/// Handles document upload/delete side-effects for Grievance Photos.
/// Registered in DI as <see cref="IDocumentBindingHandler"/>.
/// </summary>
public sealed class GrievancePhotoDocumentBindingHandler : IDocumentBindingHandler
{
    private readonly IRepository<GrievancePhotoEntity, int> _photoRepo;
    private readonly ILogger<GrievancePhotoDocumentBindingHandler> _logger;

    public GrievancePhotoDocumentBindingHandler(
        IRepository<GrievancePhotoEntity, int> photoRepo,
        ILogger<GrievancePhotoDocumentBindingHandler> logger)
    {
        _photoRepo = photoRepo;
        _logger = logger;
    }

    public string ReferenceTableName => "GrievancePhoto";

    public bool Handles(string referenceTableName)
    {
        return string.Equals(referenceTableName, ReferenceTableName, StringComparison.OrdinalIgnoreCase);
    }

    public async Task<bool> ReferenceExistsAsync(int referenceTableId, CancellationToken cancellationToken)
    {
        var photo = await _photoRepo.GetByIdAsync(referenceTableId, cancellationToken);
        return photo != null;
    }

    public async Task OnAfterUploadAsync(
        int documentId, 
        int bindingId, 
        int referenceTableId, 
        int uploadedBy, 
        CancellationToken cancellationToken)
    {
        var photo = await _photoRepo.GetByIdAsync(referenceTableId, cancellationToken);
        if (photo != null)
        {
            photo.LinkDocumentBinding(bindingId);
            photo.UpdatedBy = uploadedBy;
            photo.UpdatedDate = DateTime.Now;
            await _photoRepo.UpdateAsync(photo, cancellationToken);
        }
    }

    public async Task OnBeforeDeleteAsync(
        NtisPlatform.Core.Entities.DocumentBindingEntity binding, 
        int deletedBy, 
        CancellationToken cancellationToken)
    {
        // When the central Document is deleted, also delete the GrievancePhoto record!
        var photo = await _photoRepo.GetByIdAsync(binding.ReferenceTableId ?? 0, cancellationToken);
        if (photo != null && !photo.MarkedForDeletion)
        {
            photo.MarkForDeletion();
            photo.UpdatedBy = deletedBy;
            photo.UpdatedDate = DateTime.Now;
            await _photoRepo.UpdateAsync(photo, cancellationToken);
            _logger.LogInformation("GrievancePhoto {PhotoId} was soft-deleted because the underlying document was deleted by User {UserId}.", photo.Id, deletedBy);
        }
    }
}
