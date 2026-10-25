using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Infrastructure.Services.Handlers;

/// <summary>
/// Handles document binding side-effects for PropertySocialDocument.
/// Registered in DI as <see cref="IDocumentBindingHandler"/>.
/// </summary>
public sealed class PropertySocialDocumentHandler : IDocumentBindingHandler
{
    private readonly IRepository<PropertySocialDocumentEntity> _repository;
    private readonly IRepository<PropertySocialDetailsEntity> _detailsRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<PropertySocialDocumentHandler> _logger;

    public string ReferenceTableName => "PropertySocialDocument";

    public PropertySocialDocumentHandler(
        IRepository<PropertySocialDocumentEntity> repository,
        IRepository<PropertySocialDetailsEntity> detailsRepository,
        IUnitOfWork unitOfWork,
        ILogger<PropertySocialDocumentHandler> logger)
    {
        _repository = repository;
        _detailsRepository = detailsRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public bool Handles(string referenceTableName)
        => string.Equals(referenceTableName, "PropertySocialDocument", StringComparison.OrdinalIgnoreCase)
        || string.Equals(referenceTableName, "PTIS.PropertySocialDocument", StringComparison.OrdinalIgnoreCase);

    public Task<bool> ReferenceExistsAsync(int referenceTableId, string? referencePropertyName, CancellationToken cancellationToken)
        => ReferenceExistsAsync(referenceTableId, cancellationToken);

    public async Task<bool> ReferenceExistsAsync(int referenceTableId, CancellationToken cancellationToken)
    {
        // Note: The UI passes PropertySocialDetailsId as the ReferenceTableId
        // Verify that the parent PropertySocialDetails row actually exists!
        var exists = await _detailsRepository.GetQueryable()
            .AnyAsync(x => x.Id == referenceTableId && !x.MarkedForDeletion, cancellationToken);
        
        if (!exists)
        {
            _logger.LogWarning(
                "PropertySocialDocumentHandler.ReferenceExistsAsync: no PropertySocialDetails found with ID={DocId}.",
                referenceTableId);
        }
        
        return exists; 
    }

    public async Task OnAfterUploadAsync(
        int documentId,
        int bindingId,
        int referenceTableId,
        int uploadedBy,
        CancellationToken cancellationToken)
    {
        _logger.LogDebug(
            "PropertySocialDocumentHandler.OnAfterUploadAsync: linking BindingId={BindingId} to PropertySocialDetailsId={DocId}",
            bindingId, referenceTableId);

        // Fetch active record for this PropertySocialDetailsId
        var existingEntity = await _repository.GetQueryable()
            .FirstOrDefaultAsync(x => x.PropertySocialDetailsId == referenceTableId && !x.MarkedForDeletion, cancellationToken);

        if (existingEntity != null)
        {
            existingEntity.DocumentBindingId = bindingId;
            existingEntity.UpdatedBy = uploadedBy;
            existingEntity.UpdatedDate = DateTime.Now;

            await _repository.UpdateAsync(existingEntity, cancellationToken);
        }
        else
        {
            // Create the new mapping row
            var newEntity = new PropertySocialDocumentEntity
            {
                PropertySocialDetailsId = referenceTableId,
                DocumentBindingId = bindingId,
                IsActive = true,
                MarkedForDeletion = false,
                CreatedBy = uploadedBy,
                CreatedDate = DateTime.Now
            };

            await _repository.AddAsync(newEntity, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task OnBeforeDeleteAsync(
        DocumentBindingEntity binding,
        int deletedBy,
        CancellationToken cancellationToken)
    {
        if (!binding.ReferenceTableId.HasValue || binding.ReferenceTableId.Value <= 0)
            return;

        _logger.LogDebug(
            "PropertySocialDocumentHandler.OnBeforeDeleteAsync: unlinking BindingId={BindingId}",
            binding.Id);

        var entity = await _repository.GetQueryable()
            .FirstOrDefaultAsync(x => x.DocumentBindingId == binding.Id && !x.MarkedForDeletion, cancellationToken);

        if (entity != null)
        {
            entity.IsActive = false;
            entity.MarkedForDeletion = true;
            entity.MarkedForDeletionDate = DateTime.Now;
            entity.UpdatedBy = deletedBy;
            entity.UpdatedDate = DateTime.Now;
            
            await _repository.UpdateAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }
}
