using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.PropertySocialDetailsBulk;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

public class PropertySocialDetailsBulkService : IPropertySocialDetailsBulkService
{
    private readonly IRepository<PropertySocialDetailsEntity, int> _repository;
    private readonly IRepository<SocialAttributeEntity> _socialAttributeRepository;
    private readonly IRepository<PropertyEntity, int> _propertyRepository;
    private readonly IRepository<DocumentEntity, int> _documentRepository;
    private readonly IRepository<DocumentBindingEntity, int> _documentBindingRepository;
    private readonly IRepository<SocietyDetailsEntity, int> _societyDetailsRepository;
    private readonly IRepository<WingDetailsMastEntity, int> _wingDetailsRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<PropertySocialDetailsBulkService> _logger;
    public PropertySocialDetailsBulkService(
     IRepository<PropertySocialDetailsEntity, int> repository,
     IRepository<SocialAttributeEntity> socialAttributeRepository,
     IRepository<PropertyEntity, int> propertyRepository,
     IRepository<DocumentEntity, int> documentRepository,
     IRepository<DocumentBindingEntity, int> documentBindingRepository,
     IRepository<SocietyDetailsEntity, int> societyDetailsRepository,
     IRepository<WingDetailsMastEntity, int> wingDetailsRepository,
     IUnitOfWork unitOfWork,
     IMapper mapper,
     ILogger<PropertySocialDetailsBulkService> logger)
    {
        _repository = repository;
        _socialAttributeRepository = socialAttributeRepository;
        _propertyRepository = propertyRepository;
        _documentRepository = documentRepository;
        _documentBindingRepository = documentBindingRepository;
        _societyDetailsRepository = societyDetailsRepository;
        _wingDetailsRepository = wingDetailsRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
    }
    // ──────────────────────────────────────────────────────────────────────────────────────────────────
    // GET PROPERTY SOCIAL INFO (BULK)
    // Fetches active social attributes, existing values, toilet counts, and linked documents
    // ──────────────────────────────────────────────────────────────────────────────────────────────────
    public async Task<PropertySocialInfoBulkResponseDto> GetPropertySocialInfoBulkAsync(int? propertyId, int? societyDetailId, int? wingDetailId, string? entityType, CancellationToken cancellationToken = default)
    {
        bool hasPropertyId = (propertyId ?? 0) > 0;
        bool hasSocietyId = (societyDetailId ?? 0) > 0;
        bool hasWingId = (wingDetailId ?? 0) > 0;

        if (!hasPropertyId && !hasSocietyId && !hasWingId)
        {
            throw new ValidationException("Parent_Id_Required", OperationType.Update);
        }

        if (!new[] { "P", "S", "W" }.Contains(entityType))
        {
            throw new ValidationException("Invalid_Entity_Type", OperationType.Update);
        }

        if (hasPropertyId)
        {
            var propertyExists = await _propertyRepository.GetQueryable().AnyAsync(x => x.Id == propertyId && !x.MarkedForDeletion && x.IsActive, cancellationToken);
            if (!propertyExists)
            {
                throw new ValidationException("Property_Not_Found", OperationType.Update);
            }
        }

        if (hasSocietyId)
        {
            var societyExists = await _societyDetailsRepository.GetQueryable().AnyAsync(x => x.Id == societyDetailId && !x.MarkedForDeletion && x.IsActive, cancellationToken);
            if (!societyExists)
            {
                throw new ValidationException("Society_Not_Found", OperationType.Update);
            }
        }

        if (hasWingId)
        {
            var wingExists = await _wingDetailsRepository.GetQueryable().AnyAsync(x => x.Id == wingDetailId && !x.MarkedForDeletion && x.IsActive, cancellationToken);
            if (!wingExists)
            {
                throw new ValidationException("Wing_Not_Found", OperationType.Update);
            }
        }

        // Step 1: Get all active social attributes (excluding Water category)
        var allSocialAttributes = await _socialAttributeRepository.GetQueryable()
            .Where(x =>
                x.IsActive &&
                (
                    string.IsNullOrEmpty(x.AttributeCategory) ||
                    x.AttributeCategory != "Water"
                ))
            .OrderBy(x => x.DisplayOrder ?? int.MaxValue)
            .ThenBy(x => x.SocialAttributeCode)
            .ToListAsync(cancellationToken);

        // Step 2: Get existing property social details for this scope
        var existingDetailsQuery = _repository.GetQueryable()
            .Where(x => x.IsActive && x.MarkedForDeletion != true);

        if (hasPropertyId)
        {
            existingDetailsQuery = existingDetailsQuery.Where(x =>
                x.EntityType == "P" && 
                x.SocietyDetailId == societyDetailId &&
                x.WingDetailId == wingDetailId && 
                x.PropertyId == propertyId);
        }
        else if (hasWingId)
        {
            existingDetailsQuery = existingDetailsQuery.Where(x =>
                x.EntityType == "W" &&
                x.SocietyDetailId == societyDetailId &&
                x.WingDetailId == wingDetailId &&
                (x.PropertyId == null || x.PropertyId == 0));
        }
        else if (hasSocietyId)
        {
            existingDetailsQuery = existingDetailsQuery.Where(x =>
                x.EntityType == "S" &&
                x.SocietyDetailId == societyDetailId &&
                (x.PropertyId == null || x.PropertyId == 0) &&
                (x.WingDetailId == null || x.WingDetailId == 0));
        }

        var existingDetails = await existingDetailsQuery
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        // Step 3: Fetch documents for this scope
        var documents = await GetPropertySocialDocumentsAsync(propertyId, societyDetailId, wingDetailId, cancellationToken);

        // Step 4: Build parent-child hierarchy
        var parentAttributes = allSocialAttributes.Where(x => x.ParentAttributeId == null).ToList();
        var result = new PropertySocialInfoBulkResponseDto
        {
            PropertyId = propertyId,
            SocietyDetailId = societyDetailId,
            WingDetailId = wingDetailId,
            SocialAttributes = parentAttributes
              .Select(parent => BuildHierarchy(parent, allSocialAttributes, existingDetails, documents))
              .ToList()
        };

        return result;
    }
    // ──────────────────────────────────────────────────────────────────────────────────────────────────
    // UPSERT PROPERTY SOCIAL INFO (BULK)
    // Inserts or updates social attribute values, placeholders, and cascades soft deletions
    // ──────────────────────────────────────────────────────────────────────────────────────────────────
    public async Task<List<PropertySocialDetailsBulkDto>> UpsertPropertySocialInfoBulkAsync(UpsertPropertySocialInfoBulkDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            bool hasPropertyId = (dto.PropertyId ?? 0) > 0;
            bool hasSocietyId = (dto.SocietyDetailId ?? 0) > 0;
            bool hasWingId = (dto.WingDetailId ?? 0) > 0;

            if (!hasPropertyId && !hasSocietyId && !hasWingId)
            {
                throw new ValidationException("Parent_Id_Required", OperationType.Update);
            }

            if (!new[] { "P", "S", "W" }.Contains(dto.EntityType))
            {
                throw new ValidationException("Invalid_Entity_Type", OperationType.Update);
            }

            if (hasPropertyId)
            {
                var propertyExists = await _propertyRepository.GetQueryable().AnyAsync(x => x.Id == dto.PropertyId && x.IsActive, cancellationToken);
                if (!propertyExists)
                {
                    throw new ValidationException("Property_Not_Found", OperationType.Update);
                }
            }

            if (hasSocietyId)
            {
                var societyExists = await _societyDetailsRepository.GetQueryable().AnyAsync(x => x.Id == dto.SocietyDetailId && !x.MarkedForDeletion && x.IsActive, cancellationToken);
                if (!societyExists)
                {
                    throw new ValidationException("Society_Not_Found", OperationType.Update);
                }
            }

            if (hasWingId)
            {
                var wingExists = await _wingDetailsRepository.GetQueryable().AnyAsync(x => x.Id == dto.WingDetailId && !x.MarkedForDeletion && x.IsActive, cancellationToken);
                if (!wingExists)
                {
                    throw new ValidationException("Wing_Not_Found", OperationType.Update);
                }
            }

            var existingRecordsQuery = _repository.GetQueryable()
                .Include(x => x.PropertySocialDocuments)
                .Where(x => x.IsActive && x.MarkedForDeletion != true);

            if (hasPropertyId)
            {
                existingRecordsQuery = existingRecordsQuery.Where(x =>
                    x.EntityType == "P" &&
                    x.PropertyId == dto.PropertyId && 
                    x.SocietyDetailId == dto.SocietyDetailId &&
                    x.WingDetailId == dto.WingDetailId);
            }
            else if (hasWingId)
            {
                existingRecordsQuery = existingRecordsQuery.Where(x =>
                    x.EntityType == "W" &&
                    x.SocietyDetailId == dto.SocietyDetailId &&
                    x.WingDetailId == dto.WingDetailId &&
                    (x.PropertyId == null || x.PropertyId == 0));
            }
            else if (hasSocietyId)
            {
                existingRecordsQuery = existingRecordsQuery.Where(x =>
                    x.EntityType == "S" &&
                    x.SocietyDetailId == dto.SocietyDetailId &&
                    (x.WingDetailId == null || x.WingDetailId == 0) &&
                    (x.PropertyId == null || x.PropertyId == 0));
            }
            var existingRecords = await existingRecordsQuery.ToListAsync(cancellationToken);

            if (dto.SocialAttributes != null && dto.SocialAttributes.Any())
            {
                var uniqueSocialAttributes = dto.SocialAttributes
                    .GroupBy(x => new { x.SocialAttributeId, x.Id })
                    .Select(g => g.OrderByDescending(x => x.Id.HasValue && x.Id.Value > 0).First())
                    .ToList();

                var socialAttributeIds = uniqueSocialAttributes.Select(x => x.SocialAttributeId).Distinct().ToList();
                var socialAttributes = await _socialAttributeRepository.GetQueryable()
                    .Where(x => socialAttributeIds.Contains(x.Id))
                    .ToListAsync(cancellationToken);

                foreach (var item in uniqueSocialAttributes)
                {
                    var attribute = socialAttributes.FirstOrDefault(x => x.Id == item.SocialAttributeId);
                    bool isDocumentRequired = attribute?.IsDocumentRequired ?? false;

                    PropertySocialDetailsEntity? existingRecord = null;

                    // First try with PropertySocialDetails.Id.
                    if (item.Id.HasValue && item.Id.Value > 0)
                    {
                        existingRecord = existingRecords
                            .FirstOrDefault(x => x.Id == item.Id.Value && x.IsActive);
                    }

                    // Find by Entity + Parent + SocialAttribute
                    if (existingRecord == null)
                    {
                        existingRecord = existingRecords.FirstOrDefault(x =>
                            x.IsActive &&
                            x.SocialAttributeId == item.SocialAttributeId &&
                            x.EntityType == dto.EntityType &&
                            x.PropertyId == (hasPropertyId ? dto.PropertyId : null) &&
                            x.SocietyDetailId == (hasSocietyId ? dto.SocietyDetailId : null) &&
                            x.WingDetailId == (hasWingId ? dto.WingDetailId : null));
                    }

                    if (existingRecord != null)
                    {
                        existingRecord.BitValue = item.BitValue;
                        existingRecord.IntValue = item.IntValue;
                        existingRecord.DecimalValue = item.DecimalValue;
                        existingRecord.TextValue = item.TextValue;
                        existingRecord.DateValue = item.DateValue;
                        existingRecord.Remark = item.Remark;

                        existingRecord.UpdatedBy = dto.UpdatedBy;
                        existingRecord.UpdatedDate = DateTime.Now;

                        if (isDocumentRequired && (existingRecord.PropertySocialDocuments == null || !existingRecord.PropertySocialDocuments.Any(d => d.IsActive && !d.MarkedForDeletion && d.IsActive)))
                        {
                            existingRecord.PropertySocialDocuments ??= new List<PropertySocialDocumentEntity>();
                            existingRecord.PropertySocialDocuments.Add(new PropertySocialDocumentEntity
                            {
                                DocumentBindingId = null,
                                CreatedBy = dto.UpdatedBy,
                                CreatedDate = DateTime.Now,
                                IsActive = true
                            });
                        }

                        await _repository.UpdateAsync(existingRecord, cancellationToken);
                        continue;
                    }

                    var newRecord = new PropertySocialDetailsEntity
                    {
                        PropertyId = hasPropertyId ? dto.PropertyId : null,
                        SocietyDetailId = hasSocietyId ? dto.SocietyDetailId : null,
                        WingDetailId = hasWingId ? dto.WingDetailId : null,
                        EntityType = dto.EntityType,
                        SocialAttributeId = item.SocialAttributeId,
                        BitValue = item.BitValue,
                        IntValue = item.IntValue,
                        DecimalValue = item.DecimalValue,
                        TextValue = item.TextValue,
                        DateValue = item.DateValue,
                        DocumentBindingId = null,
                        Remark = item.Remark,
                        CreatedBy = dto.UpdatedBy,
                        CreatedDate = DateTime.Now,
                        IsActive = true,
                        PropertySocialDocuments = new List<PropertySocialDocumentEntity>()
                    };

                    if (isDocumentRequired)
                    {
                        newRecord.PropertySocialDocuments.Add(new PropertySocialDocumentEntity
                        {
                            DocumentBindingId = null,
                            CreatedBy = dto.UpdatedBy,
                            CreatedDate = DateTime.Now,
                            IsActive = true
                        });
                    }

                    await _repository.AddAsync(newRecord, cancellationToken);
                }
            }

            // Delete requested documents by PropertySocialDetailIds from PTIS.PropertySocialDetails, Core.DocumentBinding, and Core.Document
            await SoftDeletePropertySocialDetailsDocumentsAsync(dto, cancellationToken);

            // Step 1: Soft delete (mark as inactive) the social attributes to remove
            if (dto.SocialAttributeIdsToRemove != null && dto.SocialAttributeIdsToRemove.Any())
            {
                var recordsToRemove = existingRecords
                    .Where(x => dto.SocialAttributeIdsToRemove.Contains(x.SocialAttributeId))
                    .ToList();

                foreach (var record in recordsToRemove)
                {
                    record.IsActive = false;
                    record.MarkedForDeletion = true;
                    record.MarkedForDeletionDate = DateTime.Now;
                    record.UpdatedBy = dto.UpdatedBy;
                    record.UpdatedDate = DateTime.Now;
                    
                    if (record.PropertySocialDocuments != null)
                    {
                        foreach (var docDetail in record.PropertySocialDocuments)
                        {
                            if (docDetail.IsActive && !docDetail.MarkedForDeletion)
                            {
                                docDetail.IsActive = false;
                                docDetail.MarkedForDeletion = true;
                                docDetail.MarkedForDeletionDate = DateTime.Now;
                                docDetail.UpdatedBy = dto.UpdatedBy;
                                docDetail.UpdatedDate = DateTime.Now;
                            }
                        }
                    }

                    await _repository.UpdateAsync(record, cancellationToken);
                }
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Step 3: Fetch documents and return updated list
            var documents = await GetPropertySocialDocumentsAsync( dto.PropertyId, dto.SocietyDetailId, dto.WingDetailId, cancellationToken);

            var updatedRecordsQuery = _repository.GetQueryable()
                .AsNoTracking()
                .Include(x => x.SocialAttribute)
                .Where(x =>
                    x.IsActive && x.MarkedForDeletion != true &&
                    (
                        x.SocialAttribute == null ||
                        x.SocialAttribute.AttributeCategory == null ||
                        x.SocialAttribute.AttributeCategory != "Water"
                    ));

            if (hasPropertyId)
            {
                updatedRecordsQuery = updatedRecordsQuery.Where(x =>
                    x.EntityType == "P" &&
                    x.SocietyDetailId == dto.SocietyDetailId &&
                    x.WingDetailId == dto.WingDetailId &&
                    x.PropertyId == dto.PropertyId);
            }
            else if (hasWingId)
            {
                updatedRecordsQuery = updatedRecordsQuery.Where(x =>
                    x.EntityType == "W" &&
                    x.SocietyDetailId == dto.SocietyDetailId &&
                    x.WingDetailId == dto.WingDetailId &&
                    (x.PropertyId == null || x.PropertyId == 0));
            }
            else if (hasSocietyId)
            {
                updatedRecordsQuery = updatedRecordsQuery.Where(x =>
                    x.EntityType == "S" &&
                    x.SocietyDetailId == dto.SocietyDetailId &&
                    (x.WingDetailId == null || x.WingDetailId == 0) &&
                    (x.PropertyId == null || x.PropertyId == 0));
            }

            var updatedRecords = await updatedRecordsQuery.ToListAsync(cancellationToken);

            var mappedRecords = _mapper.Map<List<PropertySocialDetailsBulkDto>>(updatedRecords);

            foreach (var record in mappedRecords)
            {
                record.Documents = documents
                    .Where(d =>
                        d.SocialAttributeId == record.SocialAttributeId &&
                        d.IsDocument)
                    .OrderByDescending(d => d.CreatedDate)
                    .Take(1)
                    .ToList();

                record.Photos = documents
                    .Where(d =>
                        d.SocialAttributeId == record.SocialAttributeId &&
                        d.IsPhoto)
                    .OrderByDescending(d => d.CreatedDate)
                    .Take(1)
                    .ToList();
            }

            return mappedRecords;
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Error saving social details. PropertyId={PropertyId}, SocietyDetailId={SocietyDetailId}, WingDetailId={WingDetailId}, EntityType={EntityType}",
                dto.PropertyId, dto.SocietyDetailId, dto.WingDetailId, dto.EntityType);

            throw;
        }
    }


    // ──────────────────────────────────────────────────────────────────────────────────────────────────
    // FETCH DOCUMENTS & BINDINGS
    // Retrieves documents and photos bound directly or via PropertySocialDocument junction
    // ──────────────────────────────────────────────────────────────────────────────────────────────────
    private async Task<List<SocialPropertyDocumentsDto>> GetPropertySocialDocumentsAsync(int? propertyId, int? SocietyDetailId, int? WingDetailId, CancellationToken cancellationToken)
    {
        bool hasPropertyId = (propertyId ?? 0) > 0;
        bool hasSocietyId = (SocietyDetailId ?? 0) > 0;
        bool hasWingId = (WingDetailId ?? 0) > 0;

        var psdQuery = _repository.GetQueryable()
            .Where(x => x.IsActive && !x.MarkedForDeletion);

        if (hasPropertyId)
        {
            psdQuery = psdQuery.Where(x =>
                x.EntityType == "P" &&
                x.PropertyId == propertyId &&
                x.SocietyDetailId == SocietyDetailId &&
                x.WingDetailId == WingDetailId);
        }
        else if (hasWingId)
        {
            psdQuery = psdQuery.Where(x =>
                x.EntityType == "W" &&
                x.SocietyDetailId == SocietyDetailId &&
                x.WingDetailId == WingDetailId &&
                (x.PropertyId == null || x.PropertyId == 0));
        }
        else if (hasSocietyId)
        {
            psdQuery = psdQuery.Where(x =>
                x.EntityType == "S" &&
                x.SocietyDetailId == SocietyDetailId &&
                (x.PropertyId == null || x.PropertyId == 0) &&
                (x.WingDetailId == null || x.WingDetailId == 0));
        }

        var results = await psdQuery
            .SelectMany(psd => _documentBindingRepository.GetQueryable()
                .Where(db => db.IsActive && !db.MarkedForDeletion &&
                    (
                        (db.ReferenceTableName == "PropertySocialDetails" && db.ReferenceTableId == psd.Id) || (psd.DocumentBindingId == db.Id) ||
                        (psd.PropertySocialDocuments != null && psd.PropertySocialDocuments.Any(pd => pd.IsActive && !pd.MarkedForDeletion && pd.DocumentBindingId == db.Id))
                    )
                )
                .Select(db => new 
                { 
                    psd, db,
                    IsPhoto = (psd.DocumentBindingId == db.Id) || (db.ReferenceTableName == "PropertySocialDetails" && db.ReferenceTableId == psd.Id && psd.DocumentBindingId != db.Id),
                    IsDocument = psd.PropertySocialDocuments != null && psd.PropertySocialDocuments.Any(pd => pd.IsActive && !pd.MarkedForDeletion && pd.DocumentBindingId == db.Id)
                })
            )
            .Join(_documentRepository.GetQueryable().Where(d => d.IsActive && !d.MarkedForDeletion),
                x => x.db.DocumentId,
                d => d.Id,
                (x, d) => new { x.psd, x.db, d, x.IsPhoto, x.IsDocument }
            )
            .OrderByDescending(x => x.d.CreatedDate)
            .Select(x => new SocialPropertyDocumentsDto
            {
                PropertySocialDetailId = x.psd.Id,
                SocialAttributeId = x.psd.SocialAttributeId,
                PropertyId = x.psd.PropertyId ?? 0,
                DocumentId = x.d.Id,
                DocumentGuid = x.d.DocumentGuid,
                FileName = x.d.FileName,
                OriginalFileName = x.d.OriginalFileName,
                FileExtension = x.d.FileExtension,
                MimeType = x.d.MimeType,
                FileSizeBytes = x.d.FileSizeBytes,
                DocumentBindingId = x.db.Id,
                IsPhoto = x.IsPhoto,
                IsDocument = x.IsDocument,
                CreatedDate = x.d.CreatedDate
            }).ToListAsync(cancellationToken);

        return results;
    }

    // ──────────────────────────────────────────────────────────────────────────────────────────────────
    // BUILD HIERARCHY
    // Recursively constructs the attribute tree with attached documents and photos
    // ──────────────────────────────────────────────────────────────────────────────────────────────────
    private SocialAttributeHierarchyBulkDto BuildHierarchy(SocialAttributeEntity attribute, List<SocialAttributeEntity> allAttributes, List<PropertySocialDetailsEntity> existingDetails, List<SocialPropertyDocumentsDto> allDocuments)
    {
        var existingValue = existingDetails
            .Where(x => x.SocialAttributeId == attribute.Id)
            .OrderByDescending(x => x.UpdatedDate ?? x.CreatedDate)
            .ThenByDescending(x => x.Id)
            .FirstOrDefault();

        // Get only latest 2 total files for this PhotoTypeID
        var attributeFiles = allDocuments
            .Where(d => d.SocialAttributeId == attribute.Id)
            .OrderByDescending(d => d.CreatedDate)
            .ToList();

        // Documents go into Documents[]
        var attributeDocuments = attributeFiles
             .Where(d => d.IsDocument)
             .Take(1)
             .ToList();

        var attributePhotos = attributeFiles
            .Where(d => d.IsPhoto)
            .Take(1)
            .ToList();

        var dto = new SocialAttributeHierarchyBulkDto
        {
            Id = attribute.Id,
            SocialAttributeCode = attribute.SocialAttributeCode,
            SocialAttributeName = attribute.SocialAttributeName,
            DataType = attribute.DataType,
            Unit = attribute.Unit,
            DisplayOrder = attribute.DisplayOrder,
            ParentAttributeId = attribute.ParentAttributeId,
            IsRequiredWhenParentTrue = attribute.IsRequiredWhenParentTrue,
            IsDiscountApplicable = attribute.IsDiscountApplicable,
            PhotoTypeId = attribute.PhotoTypeId,
            IsDocumentRequired = attribute.IsDocumentRequired,
            IsPhotoRequired = attribute.IsPhotoRequired,

            // Map existing values
            PropertySocialDetailId = existingValue?.Id,
            BitValue = existingValue?.BitValue,
            IntValue = existingValue?.IntValue,
            DecimalValue = existingValue?.DecimalValue,
            TextValue = existingValue?.TextValue,
            DateValue = existingValue?.DateValue,
            DocumentBindingId = existingValue?.DocumentBindingId,
            Remark = existingValue?.Remark,

            // Latest 2 total files, separated by type
            Documents = attributeDocuments,
            Photos = attributePhotos
        };

        // Recursively build children
        var children = allAttributes
            .Where(x => x.ParentAttributeId == attribute.Id)
            .ToList();

        dto.Children = children
            .Select(child => BuildHierarchy(child, allAttributes, existingDetails, allDocuments))
            .ToList();

        return dto;
    }

    // ──────────────────────────────────────────────────────────────────────────────────────────────────
    // SOFT DELETE DOCUMENTS & BINDINGS
    // Cascades deletion from PropertySocialDetails to DocumentBindings and Documents
    // ──────────────────────────────────────────────────────────────────────────────────────────────────
    private async Task SoftDeletePropertySocialDetailsDocumentsAsync(UpsertPropertySocialInfoBulkDto dto, CancellationToken cancellationToken)
    {
        int updatedBy = dto.UpdatedBy;
        var socialDetailIds = dto.PropertySocialDetailIdsToRemove
            .Where(id => id > 0)
            .Distinct()
            .ToList();

        if (socialDetailIds.Count == 0)
        {
            return;
        }

        bool hasPropertyId = (dto.PropertyId ?? 0) > 0;
        bool hasSocietyId = (dto.SocietyDetailId ?? 0) > 0;
        bool hasWingId = (dto.WingDetailId ?? 0) > 0;

        var query = _repository.GetQueryable()
            .Include(x => x.PropertySocialDocuments)
            .Where(x => socialDetailIds.Contains(x.Id) && x.IsActive);

        if (hasPropertyId)
        {
            query = query.Where(x =>
                x.EntityType == "P" &&
                x.PropertyId == dto.PropertyId &&
                x.SocietyDetailId == dto.SocietyDetailId &&
                x.WingDetailId == dto.WingDetailId);
        }
        else if (hasWingId)
        {
            query = query.Where(x =>
                x.EntityType == "W" &&
                x.SocietyDetailId == dto.SocietyDetailId &&
                x.WingDetailId == dto.WingDetailId &&
                (x.PropertyId == null || x.PropertyId == 0));
        }
        else if (hasSocietyId)
        {
            query = query.Where(x =>
                x.EntityType == "S" &&
                x.SocietyDetailId == dto.SocietyDetailId &&
                (x.PropertyId == null || x.PropertyId == 0) &&
                (x.WingDetailId == null || x.WingDetailId == 0));
        }

        // Get requested PTIS.PropertySocialDetails records for this property.
        var socialDetails = await query.ToListAsync(cancellationToken);

        var foundDetailIds = socialDetails
            .Select(x => x.Id)
            .ToHashSet();

        var invalidDetailIds = socialDetailIds
            .Where(id => !foundDetailIds.Contains(id))
            .ToList();

        if (invalidDetailIds.Count > 0)
        {
            throw new ValidationException("PropertySocialDetails_Document_Not_Found", OperationType.Update);
        }

        // Extract direct DocumentBindingIds stored on PropertySocialDetails
        var directBindingIds = socialDetails
            .Where(x => x.DocumentBindingId.HasValue && x.DocumentBindingId.Value > 0)
            .Select(x => x.DocumentBindingId!.Value)
            .Distinct()
            .ToList();

        var junctionBindingIds = socialDetails
            .Where(x => x.PropertySocialDocuments != null)
            .SelectMany(x => x.PropertySocialDocuments!)
            .Where(x => x.IsActive && !x.MarkedForDeletion && x.DocumentBindingId.HasValue && x.DocumentBindingId.Value > 0)
            .Select(x => x.DocumentBindingId!.Value)
            .Distinct()
            .ToList();

        var junctionIds = socialDetails
            .Where(x => x.PropertySocialDocuments != null)
            .SelectMany(x => x.PropertySocialDocuments!)
            .Where(x => x.IsActive && !x.MarkedForDeletion)
            .Select(x => x.Id)
            .Distinct()
            .ToList();

        var allBindingIds = directBindingIds.Concat(junctionBindingIds).Distinct().ToList();

        // Get matching Core.DocumentBinding records:
        // Linked either by ReferenceTableId == PropertySocialDetails.Id AND ReferenceTableName == "PropertySocialDetails"
        // or by ReferenceTableId == PropertySocialDocument.Id AND ReferenceTableName == "PropertySocialDocument"
        // or by direct/junction DocumentBindingId
        var documentBindings = await _documentBindingRepository
            .GetQueryable()
            .Where(db => db.IsActive && !db.MarkedForDeletion &&
                (
                    (db.ReferenceTableName == "PropertySocialDetails" && db.ReferenceTableId.HasValue && socialDetailIds.Contains(db.ReferenceTableId.Value)) ||
                    (db.ReferenceTableName == "PropertySocialDocument" && db.ReferenceTableId.HasValue && junctionIds.Contains(db.ReferenceTableId.Value)) ||
                    (allBindingIds.Count > 0 && allBindingIds.Contains(db.Id))
                ))
            .ToListAsync(cancellationToken);

        var documentIds = documentBindings
            .Select(db => db.DocumentId)
            .Where(id => id > 0)
            .Distinct()
            .ToList();

        var documents = await _documentRepository
            .GetQueryable()
            .Where(d => documentIds.Contains(d.Id) && d.IsActive && !d.MarkedForDeletion)
            .ToListAsync(cancellationToken);

        var currentDate = DateTime.Now;

        // 1. Soft-delete PTIS.PropertySocialDetails (sets IsActive = false)
        foreach (var socialDetail in socialDetails)
        {
            socialDetail.IsActive = false;
            socialDetail.MarkedForDeletion = true;
            socialDetail.MarkedForDeletionDate = currentDate;
            socialDetail.UpdatedBy = updatedBy;
            socialDetail.UpdatedDate = currentDate;

            if (socialDetail.PropertySocialDocuments != null)
            {
                foreach (var docDetail in socialDetail.PropertySocialDocuments)
                {
                    if (docDetail.IsActive && !docDetail.MarkedForDeletion)
                    {
                        docDetail.IsActive = false;
                        docDetail.MarkedForDeletion = true;
                        docDetail.MarkedForDeletionDate = currentDate;
                        docDetail.UpdatedBy = updatedBy;
                        docDetail.UpdatedDate = currentDate;
                    }
                }
            }

            await _repository.DeleteAsync(socialDetail, cancellationToken);
        }

        // 2. Soft-delete Core.DocumentBinding (sets IsActive = false, MarkedForDeletion = true, MarkedForDeletionDate = currentDate)
        foreach (var documentBinding in documentBindings)
        {
            documentBinding.IsActive = false;
            documentBinding.MarkedForDeletion = true;
            documentBinding.MarkedForDeletionDate = currentDate;
            documentBinding.UpdatedBy = updatedBy;
            documentBinding.UpdatedDate = currentDate;

            await _documentBindingRepository.DeleteAsync(documentBinding, cancellationToken);
        }

        // 3. Soft-delete Core.Document (sets IsActive = false, MarkedForDeletion = true, MarkedForDeletionDate = currentDate)
        foreach (var document in documents)
        {
            document.IsActive = false;
            document.MarkedForDeletion = true;
            document.MarkedForDeletionDate = currentDate;
            document.UpdatedBy = updatedBy;
            document.UpdatedDate = currentDate;

            await _documentRepository.DeleteAsync(document, cancellationToken);
        }
    }
}
