using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.PropertyBulkUpdate;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces.Property;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.Property;

/// <summary>
/// Service for bulk-updating property data across multiple properties by their IDs.
/// Handles owner/occupier/contact, assessment, and photo updates in a single transaction.
/// </summary>
public class PropertyBulkUpdateService : IPropertyBulkUpdateService
{
    private readonly IRepository<PropertyEntity, int> _propertyRepository;
    private readonly IRepository<PropertyAssessmentEntity, int> _assessmentRepository;
    private readonly IRepository<PropertyPhotoEntity, int> _propertyPhotoRepository;
    private readonly IRepository<PropertyPhotoTypeEntity, int> _photoTypeRepository;
    private readonly IRepository<DocumentBindingEntity, int> _documentBindingRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<PropertyBulkUpdateService> _logger;

    public PropertyBulkUpdateService(
        IRepository<PropertyEntity, int> propertyRepository,
        IRepository<PropertyAssessmentEntity, int> assessmentRepository,
        IRepository<PropertyPhotoEntity, int> propertyPhotoRepository,
        IRepository<PropertyPhotoTypeEntity, int> photoTypeRepository,
        IRepository<DocumentBindingEntity, int> documentBindingRepository,
        IUnitOfWork unitOfWork,
        ILogger<PropertyBulkUpdateService> logger)
    {
        _propertyRepository = propertyRepository;
        _assessmentRepository = assessmentRepository;
        _propertyPhotoRepository = propertyPhotoRepository;
        _photoTypeRepository = photoTypeRepository;
        _documentBindingRepository = documentBindingRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<ApiResponse<bool>> UpdateIdWiseDetailsAsync(UpdatePropertyIdWiseDetailsDto dto, int updatedBy, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        // ── 1. Validate property IDs ──
        var properties = await _propertyRepository.GetQueryable()
            .Where(x => dto.PropertyIds.Contains(x.Id) && x.IsActive)
            .ToListAsync(cancellationToken);

        if (properties.Count == 0)
        {
            throw new ValidationException(nameof(dto.PropertyIds), "None of the specified properties were found or are active.", OperationType.Update);
        }

        var propertyIds = properties.Select(x => x.Id).ToList();

        int? auditUserId = updatedBy > 0 ? updatedBy : (dto.UpdatedBy.HasValue && dto.UpdatedBy.Value > 0 ? dto.UpdatedBy.Value : (int?)null);

        // ── 2. Owner / Occupier / Contact (PropertyEntity) ──
        if (dto.HasOwnerFields())
        {
            foreach (var property in properties)
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (!string.IsNullOrWhiteSpace(dto.OwnerTitle)) property.OwnerTitle = dto.OwnerTitle;
                if (!string.IsNullOrWhiteSpace(dto.OwnerName)) property.OwnerName = dto.OwnerName;
                if (!string.IsNullOrWhiteSpace(dto.OwnerTitleEnglish)) property.OwnerTitleEnglish = dto.OwnerTitleEnglish;
                if (!string.IsNullOrWhiteSpace(dto.OwnerNameEnglish)) property.OwnerNameEnglish = dto.OwnerNameEnglish;

                if (!string.IsNullOrWhiteSpace(dto.OccupierTitle)) property.OccupierTitle = dto.OccupierTitle;
                if (!string.IsNullOrWhiteSpace(dto.OccupierName)) property.OccupierName = dto.OccupierName;
                if (!string.IsNullOrWhiteSpace(dto.OccupierTitleEnglish)) property.OccupierTitleEnglish = dto.OccupierTitleEnglish;
                if (!string.IsNullOrWhiteSpace(dto.OccupierNameEnglish)) property.OccupierNameEnglish = dto.OccupierNameEnglish;

                if (!string.IsNullOrWhiteSpace(dto.MobileNo)) property.MobileNo = dto.MobileNo;

                property.UpdatedBy = auditUserId;
                property.UpdatedDate = DateTime.UtcNow;
            }
        }

        // ── 3. Assessment Details (PropertyAssessmentEntity) ──
        if (dto.HasAssessmentFields())
        {
            var assessments = await _assessmentRepository.GetQueryable()
                .Where(x => propertyIds.Contains(x.PropertyId) && x.IsActive)
                .ToListAsync(cancellationToken);

            if (assessments.Count == 0)
            {
                throw new ValidationException(nameof(dto.PropertyIds), "No active assessment records found for the specified properties.", OperationType.Update);
            }

            foreach (var assessment in assessments)
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (dto.OwnerTypeId.HasValue) assessment.OwnerTypeId = dto.OwnerTypeId.Value;
                if (dto.NoOfResidentialToilets.HasValue) assessment.NoOfResidentialToilets = dto.NoOfResidentialToilets.Value;
                if (dto.NoOfCommercialToilets.HasValue) assessment.NoOfCommercialToilets = dto.NoOfCommercialToilets.Value;

                assessment.UpdatedBy = auditUserId;
                assessment.UpdatedDate = DateTime.UtcNow;
            }
        }

        // ── 4. Photo Details (PropertyPhotoEntity) ──
        if (dto.PhotoTypeId.HasValue || dto.DocumentBindingId.HasValue)
        {
            if (!dto.PhotoTypeId.HasValue)
                throw new ValidationException(nameof(dto.PhotoTypeId), "PhotoTypeId is required when DocumentBindingId is provided.", OperationType.Update);

            if (!dto.DocumentBindingId.HasValue)
                throw new ValidationException(nameof(dto.DocumentBindingId), "DocumentBindingId is required when PhotoTypeId is provided.",OperationType.Update);

            // Validate PhotoTypeId exists and is active
            var isPhotoTypeValid = await _photoTypeRepository.GetQueryable()
                .AsNoTracking()
                .AnyAsync(x => x.Id == dto.PhotoTypeId.Value && x.IsActive, cancellationToken);

            if (!isPhotoTypeValid)
                throw new ValidationException( nameof(dto.PhotoTypeId), $"Invalid PhotoTypeId: {dto.PhotoTypeId.Value}. Photo type not found or inactive.", OperationType.Update);

            // Validate DocumentBindingId exists and is active
            var isDocumentBindingValid = await _documentBindingRepository.GetQueryable()
               .AsNoTracking()
               .AnyAsync(b => b.Id == dto.DocumentBindingId.Value && b.IsActive && b.IsReferenceValid && !b.MarkedForDeletion, cancellationToken);

            if (!isDocumentBindingValid)
                throw new ValidationException(nameof(dto.DocumentBindingId), "Invalid DocumentBindingId. Document binding not found or inactive.", OperationType.Update);

            // Get max display orders for each property (for new photo creation)
            var photoOrders = await _propertyPhotoRepository.GetQueryable()
                .AsNoTracking()
                .Where(x => x.PropertyId.HasValue && propertyIds.Contains(x.PropertyId.Value))
                .Select(x => new { PropertyId = x.PropertyId!.Value, x.DisplayOrder })
                .ToListAsync(cancellationToken);

            var maxDisplayOrders = photoOrders
                .GroupBy(x => x.PropertyId)
                .ToDictionary(g => g.Key, g => g.Max(x => x.DisplayOrder ?? 0));

            // Check for existing active photos matching the photo type
            var existingPhotos = await _propertyPhotoRepository.GetQueryable()
                .Where(x => x.PropertyId.HasValue
                         && propertyIds.Contains(x.PropertyId.Value)
                         && x.PhotoTypeId == dto.PhotoTypeId.Value
                         && x.IsActive
                         && x.IsLatest
                         && !x.MarkedForDeletion)
                 .ToListAsync(cancellationToken);

            var existingByProperty = existingPhotos
                .GroupBy(x => x.PropertyId!.Value)
                .ToDictionary(g => g.Key, g => g.First());

            var photosToAdd = new List<PropertyPhotoEntity>();

            foreach (var propertyId in propertyIds)
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (existingByProperty.TryGetValue(propertyId, out var existingPhoto))
                {
                    existingPhoto.LinkDocumentBinding(dto.DocumentBindingId.Value);
                    existingPhoto.UpdatedBy = auditUserId;
                    existingPhoto.UpdatedDate = DateTime.UtcNow;
                }
                else
                {
                    var nextDisplayOrder = (maxDisplayOrders.TryGetValue(propertyId, out var maxOrder) ? maxOrder : 0) + 1;

                    var newPhoto = PropertyPhotoEntity.CreateWithDocument(
                        propertyId,
                        dto.PhotoTypeId.Value,
                        dto.DocumentBindingId.Value,
                        nextDisplayOrder);

                    newPhoto.CreatedBy = auditUserId;
                    newPhoto.CreatedDate = DateTime.UtcNow;
                    newPhoto.UpdatedBy = auditUserId;
                    newPhoto.UpdatedDate = DateTime.UtcNow;

                    photosToAdd.Add(newPhoto);
                }
            }

            if (photosToAdd.Count > 0)
            {
                await _propertyPhotoRepository.AddRangeAsync(photosToAdd, cancellationToken);
            }
        }

        // ── 5. Single SaveChanges for the entire transaction ──
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("UpdateIdWise completed for {Count} properties by UserId={UserId}",propertyIds.Count, updatedBy);

        return new ApiResponse<bool>
        {
            Success = true,
            Message = $"{propertyIds.Count} properties updated successfully.",
            Items = true
        };
    }
}
