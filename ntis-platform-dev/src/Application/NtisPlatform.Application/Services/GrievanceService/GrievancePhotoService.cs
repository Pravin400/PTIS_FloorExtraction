using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.Common;
using NtisPlatform.Application.DTOs.Document;
using NtisPlatform.Application.DTOs.Grievance;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.Common;

namespace NtisPlatform.Application.Services.GrievanceService;

public class GrievancePhotoService : IGrievancePhotoService
{
    private readonly IRepository<GrievancePhotoEntity, int> _photoRepository;
    private readonly IRepository<GrievancePhotoTypeEntity, int> _photoTypeRepository;
    private readonly IDocumentApplicationService _documentApplicationService;
    private readonly IModuleLookupService _moduleLookupService;
    private readonly IRepository<GrievanceApplicationEntity, int> _grievanceRepository;
    private readonly ILogger<GrievancePhotoService> _logger;
    private readonly IUnitOfWork _unitOfWork;

    public GrievancePhotoService(
        IRepository<GrievancePhotoEntity, int> photoRepository,
        IRepository<GrievancePhotoTypeEntity, int> photoTypeRepository,
        IDocumentApplicationService documentApplicationService,
        IModuleLookupService moduleLookupService,
        IRepository<GrievanceApplicationEntity, int> grievanceRepository,
        ILogger<GrievancePhotoService> logger,
        IUnitOfWork unitOfWork)
    {
        _photoRepository = photoRepository;
        _photoTypeRepository = photoTypeRepository;
        _documentApplicationService = documentApplicationService;
        _moduleLookupService = moduleLookupService;
        _grievanceRepository = grievanceRepository;
        _logger = logger;
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<GrievancePhotoDto>> GetPhotosByGrievanceIdAsync(int grievanceId, CancellationToken cancellationToken = default)
    {
        Guard.AgainstNegativeOrZero(grievanceId, nameof(grievanceId));

        var query = _photoRepository.GetQueryable();
        var photosList = await query
            .Include(p => p.PhotoType)
            .Include(p => p.DocumentBinding)
            .ThenInclude(b => b!.Document)
            .Where(p => p.GrievanceApplicationId == grievanceId && p.IsActive && !p.MarkedForDeletion && p.IsLatest)
            .ToListAsync(cancellationToken);

        return photosList.Select(p => new GrievancePhotoDto
        {
            Id = p.Id,
            GrievanceApplicationId = p.GrievanceApplicationId,
            PhotoTypeId = p.PhotoTypeId,
            PhotoTypeCode = p.PhotoType?.PhotoTypeCode ?? string.Empty,
            PhotoTypeName = p.PhotoType?.PhotoTypeName ?? string.Empty,
            DocumentBindingId = p.DocumentBindingId,
            IsLatest = p.IsLatest,
            Remarks = p.Remarks,
            DocumentGuid = DocumentBindingHelper.GetSafeDocumentGuid(p.DocumentBinding),
            FileName = DocumentBindingHelper.GetSafeFileName(p.DocumentBinding),
            FileExtension = p.DocumentBinding?.Document?.FileExtension,
            MimeType = DocumentBindingHelper.GetSafeMimeType(p.DocumentBinding),
            StoragePath = p.DocumentBinding?.Document?.StoragePath
        });
    }

    public async Task<int> UploadPhotoAsync(UploadGrievancePhotoDto dto, int userId, CancellationToken cancellationToken = default)
    {
        Guard.AgainstNull(dto, nameof(dto));
        Guard.AgainstNegativeOrZero(dto.GrievanceApplicationId, nameof(dto.GrievanceApplicationId));
        Guard.AgainstNegativeOrZero(dto.PhotoTypeId, nameof(dto.PhotoTypeId));
        Guard.AgainstInvalidStream(dto.File.OpenReadStream(), "File");

        var allowedMimeTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp", "image/jfif" };
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".jfif" };
        var extension = Path.GetExtension(dto.File.FileName).ToLowerInvariant();

        if (!allowedMimeTypes.Contains(dto.File.ContentType.ToLowerInvariant()) || 
            !allowedExtensions.Contains(extension))
        {
            throw new ArgumentException("Only image files (.jpg, .jpeg, .png, .gif, .webp, .jfif) are allowed.");
        }

        var grievance = await _grievanceRepository.GetByIdAsync(dto.GrievanceApplicationId, cancellationToken);
        if (grievance == null)
            throw new KeyNotFoundException("Grievance not found.");
            
        if (grievance.CreatedBy != userId && grievance.CurrentAssignedToUserId != userId)
            throw new UnauthorizedAccessException("You are not authorized to upload photos for this grievance.");

        var photoType = await _photoTypeRepository.GetByIdAsync(dto.PhotoTypeId, cancellationToken);
        if (photoType == null || !photoType.IsActive)
        {
            throw new ArgumentException("Invalid or inactive PhotoType", nameof(dto.PhotoTypeId));
        }

        var (departmentId, moduleId) = await _moduleLookupService.GetDepartmentAndModuleAsync("GRV", "GRV_M", cancellationToken);

        // 1. Create the GrievancePhoto DB Entity first (without document)
        var entity = GrievancePhotoEntity.Create(dto.GrievanceApplicationId, dto.PhotoTypeId, dto.Remarks);
        
        await _photoRepository.AddAsync(entity, cancellationToken);
        entity.CreatedBy = userId;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        int photoId = entity.Id;

        try
        {
            // 2. Upload Document via central service
            var uploadDto = new DocumentUploadDto
            {
                DepartmentId = departmentId,
                ModuleId = moduleId,
                ReferenceTableName = "GrievancePhoto", // Note this maps to the GrievancePhoto table now!
                ReferenceTableId = photoId,
                ReferencePropertyName = "Id",
                BindingPurpose = photoType.PhotoTypeCode,
                IsPrimaryDocument = false,
                AuthDepartmentId = departmentId,
                AuthReferenceId = dto.GrievanceApplicationId,
                DocumentType = photoType.PhotoTypeCode
            };

            var docResponse = await _documentApplicationService.UploadDocumentAsync(
                dto.File.OpenReadStream(),
                dto.File.FileName,
                dto.File.ContentType,
                dto.File.Length,
                uploadDto,
                userId,
                cancellationToken);

            // 3. Link DocumentBindingId to our GrievancePhoto row
            if (docResponse.DocumentBindingId.HasValue)
            {
                entity.LinkDocumentBinding(docResponse.DocumentBindingId.Value);
                entity.UpdatedBy = userId;
                entity.UpdatedDate = DateTime.Now;
                await _photoRepository.UpdateAsync(entity, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }

            return photoId;
        }
        catch
        {
            // Clean up the DB row if file upload failed
            await _photoRepository.DeleteAsync(photoId, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            throw;
        }
    }

    public async Task DeletePhotoAsync(int id, int userId, CancellationToken cancellationToken = default)
    {
        Guard.AgainstNegativeOrZero(id, nameof(id));

        var query = _photoRepository.GetQueryable();
        var photo = await query
            .Include(p => p.DocumentBinding)
            .ThenInclude(b => b!.Document)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (photo == null || photo.MarkedForDeletion) return;

        var grievance = await _grievanceRepository.GetByIdAsync(photo.GrievanceApplicationId, cancellationToken);
        if (grievance != null && grievance.CreatedBy != userId && grievance.CurrentAssignedToUserId != userId)
            throw new UnauthorizedAccessException("You are not authorized to delete photos for this grievance.");

        photo.MarkForDeletion();
        photo.UpdatedBy = userId;
        photo.UpdatedDate = DateTime.Now;

        await _photoRepository.UpdateAsync(photo, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Explicitly delete the physical file from the core vault as per business requirements
        if (photo.DocumentBinding?.Document?.DocumentGuid != null)
        {
            await _documentApplicationService.DeleteDocumentAsync(photo.DocumentBinding.Document.DocumentGuid, userId, cancellationToken);
        }
    }

    public async Task<List<int>> UploadMultiplePhotosAsync(UploadMultipleGrievancePhotosDto dto, int userId, CancellationToken cancellationToken = default)
    {
        Guard.AgainstNull(dto, nameof(dto));
        Guard.AgainstNegativeOrZero(dto.GrievanceApplicationId, nameof(dto.GrievanceApplicationId));
        if (dto.Files == null || !dto.Files.Any())
            throw new ArgumentException("At least one photo must be provided", nameof(dto.Files));

        var photoIds = new List<int>();
        foreach (var file in dto.Files)
        {
            var uploadDto = new UploadGrievancePhotoDto
            {
                GrievanceApplicationId = dto.GrievanceApplicationId,
                PhotoTypeId = dto.PhotoTypeId,
                Remarks = dto.Remarks,
                File = file
            };
            int photoId = await UploadPhotoAsync(uploadDto, userId, cancellationToken);
            photoIds.Add(photoId);
        }
        return photoIds;
    }

    public async Task<(Stream? FileStream, string FileName, string MimeType)> ViewPhotoAsync(int id, CancellationToken cancellationToken = default)
    {
        Guard.AgainstNegativeOrZero(id, nameof(id));
        var query = _photoRepository.GetQueryable();
        var photo = await query
            .Include(p => p.DocumentBinding)
            .ThenInclude(b => b!.Document)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (photo == null || photo.MarkedForDeletion)
            throw new KeyNotFoundException($"Photo with ID {id} not found.");

        var documentGuid = photo.DocumentBinding?.Document?.DocumentGuid;
        if (!documentGuid.HasValue)
            throw new InvalidOperationException("No physical document is associated with this photo.");

        return await _documentApplicationService.ViewDocumentAsync(documentGuid.Value, cancellationToken);
    }
}
