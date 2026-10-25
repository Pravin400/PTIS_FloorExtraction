using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Document;
using NtisPlatform.Application.DTOs.PropertySocialDetails;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Exceptions;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Interfaces.Property;
using System.Security.Claims;

namespace NtisPlatform.Application.Services;

/// <summary>
/// Application service for the Property "Social Info" tab. Owns the hierarchy/upsert business flow;
/// all social-attribute and social-detail queries are delegated to <see cref="IPropertySocialDetailsRepository"/>
/// so this service contains no EF Core query expressions. Generic CRUD is provided by the base service.
///
/// <para>
/// Document operations are routed exclusively through <see cref="IDocumentApplicationService"/>
/// — this service never accesses document or binding repositories directly.
/// </para>
/// </summary>
public class PropertySocialDetailsService : BaseCommonCrudService<PropertySocialDetailsEntity, PropertySocialDetailsDto, CreatePropertySocialDetailsDto, UpdatePropertySocialDetailsDto, PropertySocialDetailsQueryParameters, int>, IPropertySocialDetailsService
{
    private readonly IPropertySocialDetailsRepository _socialDetailsRepository;
    private readonly IDocumentApplicationService _documentApplicationService;
    private readonly IHttpContextAccessor? _httpContextAccessor;

    public PropertySocialDetailsService(
        IRepository<PropertySocialDetailsEntity, int> repository,
        IPropertySocialDetailsRepository socialDetailsRepository,
        IDocumentApplicationService documentApplicationService,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IHttpContextAccessor? httpContextAccessor = null) : base(repository, unitOfWork, mapper, null, null, httpContextAccessor)
    {
        _socialDetailsRepository = socialDetailsRepository;
        _documentApplicationService = documentApplicationService;
        _httpContextAccessor = httpContextAccessor;
    }

   

    // ── Generic CRUD overrides ─────────────────────────────────────────────────────────
    // PropertySocialDetailsDto carries IsPhotoRequired/IsDocumentRequired (from the SocialAttribute)
    // and PhotoGuid/DocumentGuid (from polymorphic DocumentBinding+Document). The AutoMapper profile
    // intentionally ignores those members because they cannot be mapped from the entity alone, so the
    // base CRUD result must be enriched here — otherwise GET/POST/PUT would return false/null defaults.

    public override async Task<PagedResult<PropertySocialDetailsDto>> GetAllAsync(PropertySocialDetailsQueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var result = await base.GetAllAsync(queryParameters, cancellationToken);
        var allSocialAttributes = await _socialDetailsRepository.GetActiveSocialAttributesAsync(cancellationToken);
        var allowedSocialAttributes = FilterOutDiscountApplicableAttributes(allSocialAttributes);
        var allowedIds = allowedSocialAttributes.Select(x => x.Id).ToHashSet();

        var filteredItems = result.Items.Where(x => allowedIds.Contains(x.SocialAttributeId)).ToList();
        await EnrichDtosAsync(filteredItems, cancellationToken);

        return new PagedResult<PropertySocialDetailsDto>(filteredItems, filteredItems.Count, result.PageNumber, result.PageSize);
    }

    public override async Task<PropertySocialDetailsDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var result = await base.GetByIdAsync(id, cancellationToken);
        if (result != null)
        {
            var allSocialAttributes = await _socialDetailsRepository.GetActiveSocialAttributesAsync(cancellationToken);
            var allowedSocialAttributes = FilterOutDiscountApplicableAttributes(allSocialAttributes);
            var allowedIds = allowedSocialAttributes.Select(x => x.Id).ToHashSet();

            if (!allowedIds.Contains(result.SocialAttributeId))
            {
                return null;
            }

            await EnrichDtosAsync(new List<PropertySocialDetailsDto> { result }, cancellationToken);
        }
        return result;
    }

    public override async Task<PropertySocialDetailsDto> CreateAsync(CreatePropertySocialDetailsDto createDto, CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(createDto.EntityType) && !PropertySocialDetailsConstants.EntityTypes.IsValid(createDto.EntityType))
        {
            throw new PropertyValidationException($"Invalid EntityType '{createDto.EntityType}'. Allowed values are 'P', 'W', 'S'.");
        }
        createDto.EntityType = PropertySocialDetailsConstants.EntityTypes.Normalize(createDto.EntityType);

        if (createDto.DocumentBindingId.HasValue && createDto.DocumentBindingId.Value <= 0)
        {
            createDto.DocumentBindingId = null;
        }

        if (createDto.DocumentBindingId.HasValue && createDto.DocumentBindingId.Value > 0)
        {
            await ValidateDocumentBindingForAttachmentAsync(createDto.DocumentBindingId.Value, currentEntityId: null, cancellationToken);
        }

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var result = await base.CreateAsync(createDto, cancellationToken);
            if (createDto.DocumentBindingId.HasValue && createDto.DocumentBindingId.Value > 0 && result.Id > 0)
            {
                var userId = GetCurrentUserId();
                await _documentApplicationService.UpdateDocumentBindingReferenceAsync(
                    createDto.DocumentBindingId.Value,
                    result.Id,
                    userId,
                    cancellationToken);
            }

            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            await EnrichDtosAsync(new List<PropertySocialDetailsDto> { result }, cancellationToken);
            return result;
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    public override async Task<PropertySocialDetailsDto?> UpdateAsync(int id, UpdatePropertySocialDetailsDto updateDto, CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(updateDto.EntityType) && !PropertySocialDetailsConstants.EntityTypes.IsValid(updateDto.EntityType))
        {
            throw new PropertyValidationException($"Invalid EntityType '{updateDto.EntityType}'. Allowed values are 'P', 'W', 'S'.");
        }
        updateDto.EntityType = PropertySocialDetailsConstants.EntityTypes.Normalize(updateDto.EntityType);

        // Read and store existing entity and its DocumentBindingId BEFORE base.UpdateAsync
        var existingEntity = await _repository.GetByIdAsync(id, cancellationToken);
        if (existingEntity == null)
        {
            return null;
        }

        var oldDocumentBindingId = existingEntity.DocumentBindingId;
        var newDocumentBindingId = (updateDto.DocumentBindingId.HasValue && updateDto.DocumentBindingId.Value > 0)
            ? updateDto.DocumentBindingId.Value
            : (int?)null;

        // Ensure updateDto has null if client sent 0 or negative
        updateDto.DocumentBindingId = newDocumentBindingId;

        // If new document is provided and differs from old, validate before saving
        if (newDocumentBindingId.HasValue && newDocumentBindingId != oldDocumentBindingId)
        {
            await ValidateDocumentBindingForAttachmentAsync(newDocumentBindingId.Value, id, cancellationToken);
        }

        var userId = GetCurrentUserId();

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var result = await base.UpdateAsync(id, updateDto, cancellationToken);
            if (result != null)
            {
                // Explicit transitions:
                // 1. old -> new: deactivate old, link new
                // 2. old -> null: deactivate old
                // 3. null -> new: link new (and deactivate any orphaned bindings for this entity)
                // 4. same -> same: no deactivation needed
                if (oldDocumentBindingId != newDocumentBindingId || newDocumentBindingId == null)
                {
                    await DeactivateOldDocumentBindingsAsync(id, oldDocumentBindingId, newDocumentBindingId, userId, cancellationToken);
                }

                if (newDocumentBindingId.HasValue && newDocumentBindingId != oldDocumentBindingId)
                {
                    await _documentApplicationService.UpdateDocumentBindingReferenceAsync(
                        newDocumentBindingId.Value,
                        id,
                        userId,
                        cancellationToken);
                }

                await _unitOfWork.CommitTransactionAsync(cancellationToken);

                await EnrichDtosAsync(new List<PropertySocialDetailsDto> { result }, cancellationToken);
                return result;
            }

            await _unitOfWork.CommitTransactionAsync(cancellationToken);
            return null;
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    public override async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetByIdAsync(id, cancellationToken);
        return entity != null && await SoftDeleteEntityAsync(entity, cancellationToken);
    }

    public async Task<bool> DeleteByPropertyAndAttributeAsync(int propertyId, int socialAttributeId, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetQueryable()
            .FirstOrDefaultAsync(x => x.PropertyId == propertyId && x.SocialAttributeId == socialAttributeId, cancellationToken);
            
        return entity != null && await SoftDeleteEntityAsync(entity, cancellationToken);
    }

    private async Task<bool> SoftDeleteEntityAsync(PropertySocialDetailsEntity entity, CancellationToken cancellationToken)
    {
        var updatedBy = GetCurrentUserId();

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            // Deactivate all associated document bindings to avoid orphans
            await DeactivateAllSocialDetailBindingsAsync(entity.Id, entity.DocumentBindingId, updatedBy, cancellationToken);

            // Mark the record for deletion
            entity.MarkedForDeletion = true;
            entity.MarkedForDeletionDate = DateTime.Now;
            entity.UpdatedBy = updatedBy;
            entity.UpdatedDate = DateTime.Now;

            // Keep IsActive as-is (do not change to false/0)
            await _repository.UpdateAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            return true;
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    /// <inheritdoc />
    public async Task<int> SoftDeleteByHierarchyAsync(SoftDeleteByHierarchyRequest request, CancellationToken cancellationToken = default)
    {
        var entityType = request.EntityType.Trim();

        // ── Build the base query ─────────────────────────────────────────────────────
        // Always filter by EntityType and SocialAttributeId, and only touch active, non-deleted rows.
        var query = _repository.GetQueryable()
            .Where(x => x.SocialAttributeId == request.SocialAttributeId
                     && x.IsActive
                     && !x.MarkedForDeletion);

        query = entityType == PropertySocialDetailsConstants.EntityTypes.Property
            ? query.Where(x => x.EntityType == PropertySocialDetailsConstants.EntityTypes.Property || string.IsNullOrEmpty(x.EntityType))
            : query.Where(x => x.EntityType == entityType);

        // Optional: SocietyDetailsId
        if (request.SocietyDetailsId.HasValue)
            query = query.Where(x => x.SocietyDetailId == request.SocietyDetailsId.Value);

        // Optional: DocumentBindingId
        // When provided → narrows the delete to only the record tied to that specific binding
        // (e.g. two rows share the same SocialAttributeId + SocietyDetailId but have different bindings).
        // When not provided → all matching rows for the given hierarchy level are deleted.
        if (request.DocumentBindingId.HasValue && request.DocumentBindingId.Value > 0)
            query = query.Where(x => x.DocumentBindingId == request.DocumentBindingId.Value);

        var propertyIds = request.ToPropertyIds();

        var hasWing = request.WingDetailId.HasValue;
        var hasProperties = propertyIds.Count > 0;

        if (hasProperties)
        {
            if (hasWing)
                query = query.Where(x => x.WingDetailId == request.WingDetailId!.Value);

            query = query.Where(x => x.PropertyId != null
                                      && x.PropertyId != 0
                                      && propertyIds.Contains(x.PropertyId.Value));
        }
        else if (hasWing)
        {
            query = query.Where(x => x.WingDetailId == request.WingDetailId!.Value);
        }
        else
        {
            query = query.Where(x => (x.WingDetailId == null || x.WingDetailId == 0)
                                      && (x.PropertyId == null || x.PropertyId == 0));
        }

        // ── Fetch matching rows ──────────────────────────────────────────────────────
        var entities = await query.ToListAsync(cancellationToken);

        if (entities.Count == 0)
            return 0;

        var updatedBy = GetCurrentUserId();
        var now = DateTime.Now;

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            // ── Collect IDs upfront before any mutations ──────────────────────────────
            // We need the full set of entity IDs and DocumentBindingIds BEFORE the loop
            // so that the "used elsewhere" check can correctly exclude the entire current
            // batch (not just the current entity). Without this, sibling entities in the
            // same batch appear as still-active during the loop (SaveChanges hasn't run yet),
            // causing bindings to never be deactivated in multi-record deletes.
            var deletedEntityIds = entities.Select(e => e.Id).ToHashSet();

            // Collect binding IDs from both supported binding models.
            var bindingIdsToEvaluate = entities
                .Where(e => e.DocumentBindingId.HasValue && e.DocumentBindingId.Value > 0)
                .Select(e => e.DocumentBindingId!.Value)
                .ToHashSet();

            var referenceBindings = await _documentApplicationService.GetDocumentsByReferenceTableAsync(
                "PropertySocialDetails",
                deletedEntityIds.ToList(),
                cancellationToken);

            foreach (var binding in referenceBindings)
                bindingIdsToEvaluate.Add(binding.BindingId);

            // Soft-delete each selected social-detail row.
            foreach (var entity in entities)
            {
                entity.IsActive = false;
                entity.MarkedForDeletion = true;
                entity.MarkedForDeletionDate = now;
                entity.UpdatedBy = updatedBy;
                entity.UpdatedDate = now;

                await _repository.UpdateAsync(entity, cancellationToken);
            }

            foreach (var bindingId in bindingIdsToEvaluate)
            {
                // Property-level deletes can be partial. Keep the binding while another
                // active PropertySocialDetails row still references it.
                if (hasProperties)
                {
                    var isUsedByOtherRows = await _repository.GetQueryable()
                        .Where(x => x.DocumentBindingId == bindingId
                                 && !deletedEntityIds.Contains(x.Id)
                                 && x.IsActive
                                 && !x.MarkedForDeletion)
                        .AnyAsync(cancellationToken);

                    if (isUsedByOtherRows)
                        continue;
                }

                await _documentApplicationService.DeactivateDocumentBindingAsync(bindingId, updatedBy, cancellationToken);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            return entities.Count;

        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }


    private int GetCurrentUserId()
    {
        var user = _httpContextAccessor?.HttpContext?.User;
        var claim = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? user?.FindFirst("sub")?.Value
            ?? user?.FindFirst("userId")?.Value;

        if (!string.IsNullOrEmpty(claim) && int.TryParse(claim, out var id) && id > 0)
        {
            return id;
        }
        return 1; // Default fallback for system/audit processes if context is not available
    }

    /// <summary>
    /// Page-load service method for the Property Social Details screen.
    /// Loads applied attributes matching the filter criteria and available non-applied attributes,
    /// returning them in two separate arrays with zero N+1 queries.
    /// </summary>
    public async Task<PropertySocialDetailsFilterResponseDto> GetByFiltersAsync(
        int? socialAttributeId,
        int? societyDetailId,
        int? wingDetailId,
        int? propertyId = null,
        CancellationToken cancellationToken = default)
    {
        // 1. Bulk-fetch applied entities matching the provided filters
        var appliedEntities = await _socialDetailsRepository.GetSocialDetailsByFiltersAsync(
            socialAttributeId,societyDetailId,wingDetailId,propertyId,cancellationToken);

        var appliedList = _mapper.Map<List<AppliedSocialAttributeDto>>(appliedEntities);

        // Enrich appliedList with polymorphic document and photo bindings
        var detailIds = appliedList.Select(x => x.PropertySocialDetailId).Where(id => id > 0).ToList();
        var bindings = new List<PropertySocialDetailBindingInfo>();
        if (detailIds.Count > 0)
        {
            var bindingInfos = await _documentApplicationService.GetDocumentsByReferenceTableAsync(
                "PropertySocialDetails",
                detailIds,
                cancellationToken);

            bindings = bindingInfos.Select(b => new PropertySocialDetailBindingInfo
            {
                PropertySocialDetailId = b.ReferenceTableId,
                BindingId = b.BindingId,
                DocumentGuid = b.DocumentGuid,
                BindingPurpose = b.BindingPurpose
            }).ToList();
        }

        foreach (var item in appliedList)
        {
            var docBinding = bindings.FirstOrDefault(b => b.PropertySocialDetailId == item.PropertySocialDetailId && b.BindingId == item.DocumentBindingId)
                          ?? bindings.FirstOrDefault(b => b.PropertySocialDetailId == item.PropertySocialDetailId && !IsPhotoPurpose(b.BindingPurpose));

            if (docBinding != null)
            {
                item.DocumentGuid = docBinding.DocumentGuid;
                item.DocumentBindingId = docBinding.BindingId;
            }
            else if (item.DocumentBindingId.HasValue && (!item.DocumentGuid.HasValue || item.DocumentGuid == Guid.Empty))
            {
                var doc = await _documentApplicationService.GetDocumentByBindingAsync(item.DocumentBindingId.Value, cancellationToken);
                if (doc != null)
                {
                    item.DocumentGuid = doc.DocumentGuid;
                }
            }

            var photoBinding = bindings.FirstOrDefault(b => b.PropertySocialDetailId == item.PropertySocialDetailId && IsPhotoPurpose(b.BindingPurpose));
            if (photoBinding != null)
            {
                item.PhotoBindingId = photoBinding.BindingId;
                item.PhotoGuid = photoBinding.DocumentGuid;
            }
        }

        // 2. Fetch all active available master attributes (excluding discount-applicable)
        var allMasterAttributes = await _socialDetailsRepository.GetActiveSocialAttributesAsync(cancellationToken);
        var allowedMasterAttributes = FilterOutDiscountApplicableAttributes(allMasterAttributes);

        if (socialAttributeId.HasValue && socialAttributeId.Value > 0)
        {
            allowedMasterAttributes = allowedMasterAttributes
                .Where(x => x.Id == socialAttributeId.Value)
                .ToList();
        }

        // 3. Partition: Attributes already present in applied results are excluded from NonAppliedAttributes
        var appliedAttributeIds = appliedList
            .Select(x => x.SocialAttributeId)
            .ToHashSet();

        var nonAppliedEntities = allowedMasterAttributes
            .Where(attr => !appliedAttributeIds.Contains(attr.Id))
            .OrderBy(attr => attr.DisplayOrder ?? int.MaxValue)
            .ThenBy(attr => attr.SocialAttributeCode);

        var nonAppliedList = _mapper.Map<List<NonAppliedSocialAttributeDto>>(nonAppliedEntities);

        return new PropertySocialDetailsFilterResponseDto
        {
            AppliedAttributes = appliedList,
            NonAppliedAttributes = nonAppliedList
        };
    }

    /// <summary>
    /// Populates the DTO members the AutoMapper profile cannot derive from the entity alone:
    /// requirement flags from the parent <see cref="SocialAttributeEntity"/>, and the document/photo
    /// GUIDs + binding ids from the polymorphic DocumentBinding→Document association.
    /// Binding data is fetched via <see cref="IDocumentApplicationService"/> — no direct repo access.
    /// </summary>
    private async Task EnrichDtosAsync(List<PropertySocialDetailsDto> dtos, CancellationToken cancellationToken)
    {
        if (dtos == null || dtos.Count == 0) return;

        var psdIds = dtos.Select(d => d.Id).ToList();
        var attributeIds = dtos.Select(d => d.SocialAttributeId).Distinct().ToList();

        // 1. Requirement flags come from the SocialAttribute the detail belongs to.
        var requirements = (await _socialDetailsRepository.GetActiveSocialAttributesAsync(cancellationToken))
            .Where(sa => attributeIds.Contains(sa.Id))
            .ToDictionary(sa => sa.Id, sa => (sa.IsPhotoRequired, sa.IsDocumentRequired));

        // 2. Fetch all active document bindings for these detail rows via the global document service.
        var bindingInfos = await _documentApplicationService.GetDocumentsByReferenceTableAsync(
            "PropertySocialDetails",
            psdIds,
            cancellationToken);

        // Project to internal binding summary (BindingPurpose is the key discriminator)
        var bindings = bindingInfos.Select(b => new PropertySocialDetailBindingInfo
        {
            PropertySocialDetailId = b.ReferenceTableId,
            BindingId = b.BindingId,
            DocumentGuid = b.DocumentGuid,
            BindingPurpose = b.BindingPurpose
        }).ToList();

        // 3. Project enrichment onto each DTO.
        foreach (var dto in dtos)
        {
            if (requirements.TryGetValue(dto.SocialAttributeId, out var req))
            {
                dto.IsPhotoRequired = req.IsPhotoRequired;
                dto.IsDocumentRequired = req.IsDocumentRequired;
            }

            // Prefer the explicitly referenced binding; otherwise the first non-photo (document) binding.
            var docBinding = bindings.FirstOrDefault(b => b.PropertySocialDetailId == dto.Id && b.BindingId == dto.DocumentBindingId)
                          ?? bindings.FirstOrDefault(b => b.PropertySocialDetailId == dto.Id && b.BindingPurpose != "Photo");
            if (docBinding != null)
            {
                dto.DocumentGuid = docBinding.DocumentGuid;
                dto.DocumentBindingId = docBinding.BindingId;
            }
            else if (dto.DocumentBindingId.HasValue)
            {
                // Fallback: the reference-table lookup missed (e.g. binding's ReferenceTableId was
                // never back-filled to this row's id), but the detail row already stores its
                // DocumentBindingId. Resolve the GUID directly by binding id.
                var document = await _documentApplicationService.GetDocumentByBindingAsync(dto.DocumentBindingId.Value, cancellationToken);
                if (document != null)
                {
                    dto.DocumentGuid = document.DocumentGuid;
                }
            }

            var photoBinding = bindings.FirstOrDefault(b => b.PropertySocialDetailId == dto.Id && b.BindingPurpose == "Photo");
            if (photoBinding != null)
            {
                dto.PhotoBindingId = photoBinding.BindingId;
                dto.PhotoGuid = photoBinding.DocumentGuid;
            }
        }
    }

    public async Task<PropertySocialInfoResponseDto> GetPropertySocialInfoAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        // Step 1: Get ALL active social attributes
        var allSocialAttributes = await _socialDetailsRepository.GetActiveSocialAttributesAsync(cancellationToken);
        var allowedSocialAttributes = FilterOutDiscountApplicableAttributes(allSocialAttributes);

        // Step 2: Get existing property social details for this property
        var existingDetails = await _socialDetailsRepository.GetSocialDetailsByPropertyAsync(propertyId, cancellationToken) 
            ?? new List<PropertySocialDetailsEntity>();

        // Step 2.5: Load polymorphic bindings (including photos and fallback documents) for existing details
        var detailIds = existingDetails.Select(x => x.Id).ToList();
        var bindings = new List<PropertySocialDetailBindingInfo>();

        if (detailIds.Any())
        {
            var bindingInfos = await _documentApplicationService.GetDocumentsByReferenceTableAsync(
                "PropertySocialDetails",
                detailIds,
                cancellationToken);

            bindings = bindingInfos.Select(b => new PropertySocialDetailBindingInfo
            {
                PropertySocialDetailId = b.ReferenceTableId,
                BindingId = b.BindingId,
                DocumentGuid = b.DocumentGuid,
                BindingPurpose = b.BindingPurpose
            }).ToList();
        }

        // Step 3: Build parent-child hierarchy
        var parentAttributes = allowedSocialAttributes.Where(x => x.ParentAttributeId == null).ToList();
        var result = new PropertySocialInfoResponseDto
        {
            PropertyId = propertyId,
            SocialAttributes = parentAttributes.Select(parent => BuildHierarchy(parent, allowedSocialAttributes, existingDetails, bindings)).ToList()
        };

        return result;
    }

    private static bool IsPhotoPurpose(string? purpose) =>
        string.Equals(purpose?.Trim(), "Photo", StringComparison.OrdinalIgnoreCase);

    private static string NormalizeForNaturalSort(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        return System.Text.RegularExpressions.Regex.Replace(
            value.Trim(),
            @"\d+",
            m => m.Value.PadLeft(10, '0'));
    }

    private static int GetLevelRank(string? level) => level switch
    {
        PropertySocialDetailsConstants.HierarchyLevels.Apartment => 1,
        PropertySocialDetailsConstants.HierarchyLevels.Wing => 2,
        PropertySocialDetailsConstants.HierarchyLevels.Unit => 3,
        PropertySocialDetailsConstants.HierarchyLevels.Property => 4,
        _ => 5
    };

    /// <summary>
    /// Dedicated service method for Apartment Society Discount &amp; Social Data grid across Apartment, Wing, and Unit levels.
    /// </summary>
    public async Task<PropertyDiscountAndSocialGridResponseDto> GetApartmentSocietyDiscountAndSocialGridAsync(
        int societyDetailId,
        int? propertyId = null,
        CancellationToken cancellationToken = default)
    {
        if (propertyId.HasValue && propertyId.Value <= 0)
        {
            throw new PropertyValidationException("propertyId must be greater than zero when provided.");
        }

        var (society, societyProperty, wings, units, socialDetails, masterAttributes) =
            await _socialDetailsRepository.GetDiscountAndSocialHierarchyDataAsync(societyDetailId, propertyId, cancellationToken);

        if (society == null)
        {
            throw new SocietyNotFoundException(societyDetailId);
        }

        var wingMap = wings.ToDictionary(w => w.Id, w => (w.WingName ?? "").Trim());
        var unitMap = units.ToDictionary(u => u.Id, u => u);
        var mainPropertyNo = (societyProperty?.PropertyNo ?? "").Trim();

        // Polymorphic document and photo enrichment
        var detailIds = socialDetails.Select(x => x.Id).Where(id => id > 0).ToList();
        var bindings = new List<PropertySocialDetailBindingInfo>();
        if (detailIds.Count > 0)
        {
            var bindingInfos = await _documentApplicationService.GetDocumentsByReferenceTableAsync(
                "PropertySocialDetails",
                detailIds,
                cancellationToken);

            bindings = bindingInfos.Select(b => new PropertySocialDetailBindingInfo
            {
                PropertySocialDetailId = b.ReferenceTableId,
                BindingId = b.BindingId,
                DocumentGuid = b.DocumentGuid,
                BindingPurpose = b.BindingPurpose
            }).ToList();
        }

        var bindingsByDetailId = bindings
            .GroupBy(b => b.PropertySocialDetailId)
            .ToDictionary(g => g.Key, g => g.ToList());

        // Batch-resolve any direct/legacy DocumentBindingIds that were not resolved via polymorphic reference
        var unresolvedBindingIds = socialDetails
            .Where(e => e.DocumentBindingId.HasValue && e.DocumentBindingId.Value > 0)
            .Select(e => e.DocumentBindingId!.Value)
            .Distinct()
            .Where(bId => !bindings.Any(b => b.BindingId == bId))
            .ToList();

        var directDocsByBindingId = new Dictionary<int, DocumentDto?>();
        if (unresolvedBindingIds.Count > 0)
        {
            using var semaphore = new SemaphoreSlim(10, 10);
            var docTasks = unresolvedBindingIds.Select(async bId =>
            {
                await semaphore.WaitAsync(cancellationToken);
                try
                {
                    var doc = await _documentApplicationService.GetDocumentByBindingAsync(bId, cancellationToken);
                    return (BindingId: bId, Doc: doc);
                }
                finally
                {
                    semaphore.Release();
                }
            });
            var resolvedDocs = await Task.WhenAll(docTasks);
            foreach (var r in resolvedDocs)
            {
                directDocsByBindingId[r.BindingId] = r.Doc;
            }
        }

        var appliedDiscountItems = new List<AppliedDiscountSocialItemDto>();
        var appliedSocialItems = new List<AppliedDiscountSocialItemDto>();

        foreach (var entity in socialDetails)
        {
            bindingsByDetailId.TryGetValue(entity.Id, out var entityBindings);
            entityBindings ??= new List<PropertySocialDetailBindingInfo>();

            var docBinding = entityBindings
                .OrderByDescending(b => b.BindingId)
                .FirstOrDefault(b => b.BindingId == entity.DocumentBindingId && !IsPhotoPurpose(b.BindingPurpose))
                ?? entityBindings
                    .OrderByDescending(b => b.BindingId)
                    .FirstOrDefault(b => !IsPhotoPurpose(b.BindingPurpose));

            var photoBinding = entityBindings
                .OrderByDescending(b => b.BindingId)
                .FirstOrDefault(b => IsPhotoPurpose(b.BindingPurpose));

            int? resolvedDocBindingId = null;
            Guid? resolvedDocGuid = null;

            if (docBinding != null)
            {
                resolvedDocBindingId = docBinding.BindingId;
                resolvedDocGuid = docBinding.DocumentGuid;
            }
            else if (entity.DocumentBindingId.HasValue && entity.DocumentBindingId.Value > 0)
            {
                if (directDocsByBindingId.TryGetValue(entity.DocumentBindingId.Value, out var directDoc) && directDoc != null)
                {
                    resolvedDocBindingId = entity.DocumentBindingId.Value;
                    resolvedDocGuid = directDoc.DocumentGuid;
                }
                else if (entity.DocumentBinding != null && entity.DocumentBinding.IsActive && !entity.DocumentBinding.MarkedForDeletion
                         && entity.DocumentBinding.Document != null && entity.DocumentBinding.Document.IsActive && !entity.DocumentBinding.Document.MarkedForDeletion)
                {
                    resolvedDocBindingId = entity.DocumentBinding.Id;
                    resolvedDocGuid = entity.DocumentBinding.Document.DocumentGuid;
                }
            }

            int? resolvedPhotoBindingId = photoBinding?.BindingId;
            Guid? resolvedPhotoGuid = photoBinding?.DocumentGuid;

            bool hasActiveDoc = resolvedDocGuid.HasValue && resolvedDocGuid != Guid.Empty;
            bool hasActivePhoto = resolvedPhotoGuid.HasValue && resolvedPhotoGuid != Guid.Empty;

            var hasScalarValue = (entity.BitValue == true)
                || (entity.IntValue.HasValue && entity.IntValue.Value > 0)
                || (entity.DecimalValue.HasValue && entity.DecimalValue.Value > 0)
                || (!string.IsNullOrWhiteSpace(entity.TextValue) && entity.TextValue.Trim() != "-" && !entity.TextValue.Trim().Equals("no", StringComparison.OrdinalIgnoreCase) && !entity.TextValue.Trim().Equals("false", StringComparison.OrdinalIgnoreCase))
                || entity.DateValue.HasValue;

            var isApplied = hasScalarValue || hasActiveDoc || hasActivePhoto;
            if (!isApplied) continue;

            var wId = entity.WingDetailId;
            var pId = entity.PropertyId;

            bool isChildUnit = pId.HasValue && pId.Value > 0 && (society.PropertyId == null || pId.Value != society.PropertyId.Value);
            bool isWing = !isChildUnit && wId.HasValue && wId.Value > 0;
            bool isApartment = !isChildUnit && !isWing;

            // Reject/skip malformed/inconsistent rows that do not belong to this society hierarchy
            if (isChildUnit && !unitMap.ContainsKey(pId!.Value))
            {
                continue;
            }
            if (isWing && !wingMap.ContainsKey(wId!.Value))
            {
                continue;
            }

            string level;
            string entityType;
            string? wingName = null;
            string? partitionNo = null;
            string? displayLabel;
            int? normalizedSocietyId = societyDetailId;
            int? normalizedWingId = null;
            int? normalizedPropertyId = null;

            if (isApartment)
            {
                level = PropertySocialDetailsConstants.HierarchyLevels.Apartment;
                entityType = PropertySocialDetailsConstants.EntityTypes.Society;
                normalizedWingId = null;
                normalizedPropertyId = entity.PropertyId ?? society.PropertyId;
                displayLabel = !string.IsNullOrEmpty(mainPropertyNo) ? $"Apartment Level ({mainPropertyNo})" : "Apartment Level";
            }
            else if (isWing)
            {
                level = PropertySocialDetailsConstants.HierarchyLevels.Wing;
                entityType = PropertySocialDetailsConstants.EntityTypes.Wing;
                normalizedWingId = wId;
                normalizedPropertyId = null;
                var rawWingName = wingMap.GetValueOrDefault(wId!.Value, "");
                var cleanWing = System.Text.RegularExpressions.Regex.Replace(rawWingName, @"\s*Wing$", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase).Trim();
                wingName = !string.IsNullOrEmpty(cleanWing) ? cleanWing : null;
                displayLabel = !string.IsNullOrEmpty(cleanWing) ? $"{cleanWing} Wing" : "Wing Level";
            }
            else
            {
                level = PropertySocialDetailsConstants.HierarchyLevels.Unit;
                entityType = PropertySocialDetailsConstants.EntityTypes.Property;

                PropertyEntity? matchedUnit = null;
                if (pId.HasValue && pId.Value > 0)
                {
                    unitMap.TryGetValue(pId.Value, out matchedUnit);
                }

                var effectiveWingId = wId ?? matchedUnit?.WingDetailId;
                normalizedWingId = effectiveWingId;
                normalizedPropertyId = pId;

                var rawPart = (matchedUnit?.PartitionNo ?? matchedUnit?.FlatOrShopNo ?? "").Trim();
                var rawWing = effectiveWingId.HasValue && wingMap.TryGetValue(effectiveWingId.Value, out var wName)
                    ? System.Text.RegularExpressions.Regex.Replace(wName, @"\s*Wing$", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase).Trim()
                    : "";

                wingName = !string.IsNullOrEmpty(rawWing) ? rawWing : null;
                partitionNo = !string.IsNullOrEmpty(rawPart) && rawPart != "-" ? rawPart : null;

                if (!string.IsNullOrEmpty(partitionNo))
                {
                    if (!string.IsNullOrEmpty(wingName) && !partitionNo.StartsWith(wingName, StringComparison.OrdinalIgnoreCase))
                    {
                        displayLabel = $"{wingName} - {partitionNo} Unit";
                    }
                    else
                    {
                        displayLabel = $"{partitionNo} Unit";
                    }
                }
                else if (!string.IsNullOrEmpty(wingName))
                {
                    displayLabel = $"{wingName} Unit";
                }
                else
                {
                    displayLabel = "Unit Level";
                }
            }

            var itemDto = new AppliedDiscountSocialItemDto
            {
                SocialAttributeId = entity.SocialAttributeId,
                PropertySocialDetailId = entity.Id,
                SocietyDetailId = normalizedSocietyId,
                WingDetailId = normalizedWingId,
                PropertyId = normalizedPropertyId,
                Level = level,
                EntityType = entityType,
                WingName = wingName,
                PartitionNo = partitionNo,
                MainPropertyNo = mainPropertyNo,
                DisplayLevelLabel = displayLabel,
                BitValue = entity.BitValue,
                IntValue = entity.IntValue,
                DecimalValue = entity.DecimalValue,
                TextValue = entity.TextValue,
                DateValue = entity.DateValue,
                DocumentBindingId = resolvedDocBindingId,
                DocumentGuid = resolvedDocGuid,
                PhotoBindingId = resolvedPhotoBindingId,
                PhotoGuid = resolvedPhotoGuid,
                Remark = entity.Remark,
                SocialAttributeCode = entity.SocialAttribute?.SocialAttributeCode ?? string.Empty,
                SocialAttributeName = entity.SocialAttribute?.SocialAttributeName ?? string.Empty,
                DataType = entity.SocialAttribute?.DataType ?? string.Empty,
                Unit = entity.SocialAttribute?.Unit,
                DisplayOrder = entity.SocialAttribute?.DisplayOrder,
                ParentAttributeId = entity.SocialAttribute?.ParentAttributeId,
                IsRequiredWhenParentTrue = entity.SocialAttribute?.IsRequiredWhenParentTrue ?? false,
                IsDiscountApplicable = entity.SocialAttribute?.IsDiscountApplicable ?? false,
                PhotoTypeId = entity.SocialAttribute?.PhotoTypeId,
                AttributeCategory = entity.SocialAttribute?.AttributeCategory,
                IsPhotoRequired = entity.SocialAttribute?.IsPhotoRequired ?? false,
                IsDocumentRequired = entity.SocialAttribute?.IsDocumentRequired ?? false,
                IsActive = entity.SocialAttribute?.IsActive ?? true,
                IsCommonAreaAttribute = entity.SocialAttribute?.IsCommonAreaAttribute ?? false
            };

            if (entity.SocialAttribute?.IsDiscountApplicable == true)
            {
                appliedDiscountItems.Add(itemDto);
            }
            else
            {
                appliedSocialItems.Add(itemDto);
            }
        }

        // Build Non-Applied attributes per target entity and hierarchy level
        var nonAppliedDiscountItems = new List<NonAppliedDiscountSocialItemDto>();
        var nonAppliedSocialItems = new List<NonAppliedDiscountSocialItemDto>();

        // 1. Apartment level non-applied
        var aptAppliedDiscountIds = appliedDiscountItems.Where(x => x.Level == PropertySocialDetailsConstants.HierarchyLevels.Apartment).Select(x => x.SocialAttributeId).ToHashSet();
        var aptAppliedSocialIds = appliedSocialItems.Where(x => x.Level == PropertySocialDetailsConstants.HierarchyLevels.Apartment).Select(x => x.SocialAttributeId).ToHashSet();

        foreach (var a in masterAttributes)
        {
            if (a.IsDiscountApplicable && !aptAppliedDiscountIds.Contains(a.Id))
            {
                nonAppliedDiscountItems.Add(CreateNonAppliedDto(a, PropertySocialDetailsConstants.HierarchyLevels.Apartment, PropertySocialDetailsConstants.EntityTypes.Society, societyDetailId, null, null, null, null, !string.IsNullOrEmpty(mainPropertyNo) ? $"Apartment Level ({mainPropertyNo})" : "Apartment Level"));
            }
            else if (!a.IsDiscountApplicable && !aptAppliedSocialIds.Contains(a.Id))
            {
                nonAppliedSocialItems.Add(CreateNonAppliedDto(a, PropertySocialDetailsConstants.HierarchyLevels.Apartment, PropertySocialDetailsConstants.EntityTypes.Society, societyDetailId, null, null, null, null, !string.IsNullOrEmpty(mainPropertyNo) ? $"Apartment Level ({mainPropertyNo})" : "Apartment Level"));
            }
        }

        // 2. Wing level non-applied per active wing
        foreach (var w in wings)
        {
            var cleanWing = System.Text.RegularExpressions.Regex.Replace(w.WingName ?? "", @"\s*Wing$", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase).Trim();
            var wingAppliedDiscountIds = appliedDiscountItems.Where(x => x.Level == PropertySocialDetailsConstants.HierarchyLevels.Wing && x.WingDetailId == w.Id).Select(x => x.SocialAttributeId).ToHashSet();
            var wingAppliedSocialIds = appliedSocialItems.Where(x => x.Level == PropertySocialDetailsConstants.HierarchyLevels.Wing && x.WingDetailId == w.Id).Select(x => x.SocialAttributeId).ToHashSet();

            foreach (var a in masterAttributes)
            {
                if (a.IsDiscountApplicable && !wingAppliedDiscountIds.Contains(a.Id))
                {
                    nonAppliedDiscountItems.Add(CreateNonAppliedDto(a, PropertySocialDetailsConstants.HierarchyLevels.Wing, PropertySocialDetailsConstants.EntityTypes.Wing, societyDetailId, w.Id, null, cleanWing, null, !string.IsNullOrEmpty(cleanWing) ? $"{cleanWing} Wing" : "Wing Level"));
                }
                else if (!a.IsDiscountApplicable && !wingAppliedSocialIds.Contains(a.Id))
                {
                    nonAppliedSocialItems.Add(CreateNonAppliedDto(a, PropertySocialDetailsConstants.HierarchyLevels.Wing, PropertySocialDetailsConstants.EntityTypes.Wing, societyDetailId, w.Id, null, cleanWing, null, !string.IsNullOrEmpty(cleanWing) ? $"{cleanWing} Wing" : "Wing Level"));
                }
            }
        }

        // 3. Unit level non-applied: scoped to specific propertyId if supplied, or all active units if omitted
        List<PropertyEntity> targetUnits;
        string unitScope;

        if (propertyId.HasValue && propertyId.Value > 0)
        {
            if (society.PropertyId.HasValue && propertyId.Value == society.PropertyId.Value)
            {
                // Main society property passed - it is an Apartment, not a child unit.
                targetUnits = new List<PropertyEntity>();
                unitScope = PropertySocialDetailsConstants.UnitEvaluationScopes.None;
            }
            else if (unitMap.TryGetValue(propertyId.Value, out var singleUnit))
            {
                targetUnits = new List<PropertyEntity> { singleUnit };
                unitScope = PropertySocialDetailsConstants.UnitEvaluationScopes.SingleUnit;
            }
            else
            {
                targetUnits = new List<PropertyEntity>();
                unitScope = PropertySocialDetailsConstants.UnitEvaluationScopes.None;
            }
        }
        else
        {
            targetUnits = units;
            unitScope = PropertySocialDetailsConstants.UnitEvaluationScopes.AllUnits;
        }

        // Findings 1 & 4: Scope applied Unit-level attributes according to unitScope
        if (unitScope == PropertySocialDetailsConstants.UnitEvaluationScopes.SingleUnit)
        {
            appliedDiscountItems = appliedDiscountItems
                .Where(x => x.Level != PropertySocialDetailsConstants.HierarchyLevels.Unit || x.PropertyId == propertyId.Value)
                .ToList();
            appliedSocialItems = appliedSocialItems
                .Where(x => x.Level != PropertySocialDetailsConstants.HierarchyLevels.Unit || x.PropertyId == propertyId.Value)
                .ToList();
        }
        else if (unitScope == PropertySocialDetailsConstants.UnitEvaluationScopes.None)
        {
            appliedDiscountItems = appliedDiscountItems
                .Where(x => x.Level != PropertySocialDetailsConstants.HierarchyLevels.Unit)
                .ToList();
            appliedSocialItems = appliedSocialItems
                .Where(x => x.Level != PropertySocialDetailsConstants.HierarchyLevels.Unit)
                .ToList();
        }

        foreach (var unitProp in targetUnits)
        {
            var cleanWing = unitProp.WingDetailId.HasValue && wingMap.TryGetValue(unitProp.WingDetailId.Value, out var wName)
                ? System.Text.RegularExpressions.Regex.Replace(wName, @"\s*Wing$", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase).Trim()
                : null;
            var rawPart = (unitProp.PartitionNo ?? unitProp.FlatOrShopNo ?? "").Trim();
            var partitionNo = !string.IsNullOrEmpty(rawPart) && rawPart != "-" ? rawPart : null;

            string unitLabel;
            if (!string.IsNullOrEmpty(partitionNo))
            {
                unitLabel = (!string.IsNullOrEmpty(cleanWing) && !partitionNo.StartsWith(cleanWing, StringComparison.OrdinalIgnoreCase))
                    ? $"{cleanWing} - {partitionNo} Unit"
                    : $"{partitionNo} Unit";
            }
            else if (!string.IsNullOrEmpty(cleanWing))
            {
                unitLabel = $"{cleanWing} Unit";
            }
            else
            {
                unitLabel = "Unit Level";
            }

            var unitAppliedDiscountIds = appliedDiscountItems.Where(x => x.Level == PropertySocialDetailsConstants.HierarchyLevels.Unit && x.PropertyId == unitProp.Id).Select(x => x.SocialAttributeId).ToHashSet();
            var unitAppliedSocialIds = appliedSocialItems.Where(x => x.Level == PropertySocialDetailsConstants.HierarchyLevels.Unit && x.PropertyId == unitProp.Id).Select(x => x.SocialAttributeId).ToHashSet();

            foreach (var a in masterAttributes)
            {
                if (a.IsCommonAreaAttribute) continue;
                if (a.IsDiscountApplicable && !unitAppliedDiscountIds.Contains(a.Id))
                {
                    nonAppliedDiscountItems.Add(CreateNonAppliedDto(a, PropertySocialDetailsConstants.HierarchyLevels.Unit, PropertySocialDetailsConstants.EntityTypes.Property, societyDetailId, unitProp.WingDetailId, unitProp.Id, cleanWing, partitionNo, unitLabel));
                }
                else if (!a.IsDiscountApplicable && !unitAppliedSocialIds.Contains(a.Id))
                {
                    nonAppliedSocialItems.Add(CreateNonAppliedDto(a, PropertySocialDetailsConstants.HierarchyLevels.Unit, PropertySocialDetailsConstants.EntityTypes.Property, societyDetailId, unitProp.WingDetailId, unitProp.Id, cleanWing, partitionNo, unitLabel));
                }
            }
        }

        // Deterministic natural sort Ordering
        appliedDiscountItems = appliedDiscountItems
            .OrderBy(x => GetLevelRank(x.Level))
            .ThenBy(x => NormalizeForNaturalSort(x.WingName))
            .ThenBy(x => NormalizeForNaturalSort(x.PartitionNo))
            .ThenBy(x => x.DisplayOrder ?? int.MaxValue)
            .ThenBy(x => x.SocialAttributeId)
            .ThenBy(x => x.PropertySocialDetailId)
            .ToList();

        appliedSocialItems = appliedSocialItems
            .OrderBy(x => GetLevelRank(x.Level))
            .ThenBy(x => NormalizeForNaturalSort(x.WingName))
            .ThenBy(x => NormalizeForNaturalSort(x.PartitionNo))
            .ThenBy(x => x.DisplayOrder ?? int.MaxValue)
            .ThenBy(x => x.SocialAttributeId)
            .ThenBy(x => x.PropertySocialDetailId)
            .ToList();

        nonAppliedDiscountItems = nonAppliedDiscountItems
            .OrderBy(x => GetLevelRank(x.Level))
            .ThenBy(x => NormalizeForNaturalSort(x.WingName))
            .ThenBy(x => NormalizeForNaturalSort(x.PartitionNo))
            .ThenBy(x => x.DisplayOrder ?? int.MaxValue)
            .ThenBy(x => x.SocialAttributeId)
            .ToList();

        nonAppliedSocialItems = nonAppliedSocialItems
            .OrderBy(x => GetLevelRank(x.Level))
            .ThenBy(x => NormalizeForNaturalSort(x.WingName))
            .ThenBy(x => NormalizeForNaturalSort(x.PartitionNo))
            .ThenBy(x => x.DisplayOrder ?? int.MaxValue)
            .ThenBy(x => x.SocialAttributeId)
            .ToList();

        int apartmentCount = appliedDiscountItems.Count(x => x.Level == PropertySocialDetailsConstants.HierarchyLevels.Apartment) + appliedSocialItems.Count(x => x.Level == PropertySocialDetailsConstants.HierarchyLevels.Apartment);
        int wingCount = appliedDiscountItems.Count(x => x.Level == PropertySocialDetailsConstants.HierarchyLevels.Wing) + appliedSocialItems.Count(x => x.Level == PropertySocialDetailsConstants.HierarchyLevels.Wing);
        int unitCount = appliedDiscountItems.Count(x => x.Level == PropertySocialDetailsConstants.HierarchyLevels.Unit) + appliedSocialItems.Count(x => x.Level == PropertySocialDetailsConstants.HierarchyLevels.Unit);
        int propertyCount = appliedDiscountItems.Count(x => x.Level == PropertySocialDetailsConstants.HierarchyLevels.Property) + appliedSocialItems.Count(x => x.Level == PropertySocialDetailsConstants.HierarchyLevels.Property);

        return new PropertyDiscountAndSocialGridResponseDto
        {
            DiscountData = new DiscountSectionDataDto
            {
                AppliedAttributes = appliedDiscountItems,
                NonAppliedAttributes = nonAppliedDiscountItems
            },
            SocialData = new DiscountSectionDataDto
            {
                AppliedAttributes = appliedSocialItems,
                NonAppliedAttributes = nonAppliedSocialItems
            },
            LevelCounts = new DiscountSocialLevelCountsDto
            {
                All = appliedDiscountItems.Count + appliedSocialItems.Count,
                Apartment = apartmentCount,
                Wing = wingCount,
                Unit = unitCount,
                Property = propertyCount
            },
            UnitEvaluationScope = unitScope
        };
    }

    public Task<PropertyDiscountAndSocialGridResponseDto> GetDiscountAndSocialGridAsync(
        int societyDetailId,
        int? propertyId = null,
        CancellationToken cancellationToken = default)
        => GetApartmentSocietyDiscountAndSocialGridAsync(societyDetailId, propertyId, cancellationToken);

    /// <summary>
    /// Dedicated service method for Individual Property Discount &amp; Social Data grid.
    /// </summary>
    public async Task<PropertyDiscountAndSocialGridResponseDto> GetIndividualPropertyDiscountAndSocialGridAsync(
        int propertyId,
        CancellationToken cancellationToken = default)
    {
        var (property, wing, socialDetails, masterAttributes) =
            await _socialDetailsRepository.GetIndividualPropertyDiscountAndSocialDataAsync(propertyId, cancellationToken);

        if (property == null)
        {
            throw new PropertyNotFoundException(propertyId);
        }

        var wingName = (wing?.WingName ?? "").Trim();
        var cleanWing = !string.IsNullOrEmpty(wingName)
            ? System.Text.RegularExpressions.Regex.Replace(wingName, @"\s*Wing$", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase).Trim()
            : null;

        var rawPart = (property.PartitionNo ?? property.FlatOrShopNo ?? "").Trim();
        var partitionNo = !string.IsNullOrEmpty(rawPart) && rawPart != "-" ? rawPart : null;
        var mainPropertyNo = (property.PropertyNo ?? "").Trim();

        bool isUnit = property.WingDetailId.HasValue && property.WingDetailId.Value > 0;
        string level = isUnit ? PropertySocialDetailsConstants.HierarchyLevels.Unit : PropertySocialDetailsConstants.HierarchyLevels.Property;
        string entityType = PropertySocialDetailsConstants.EntityTypes.Property;

        string displayLabel;
        if (!string.IsNullOrEmpty(partitionNo))
        {
            if (!string.IsNullOrEmpty(cleanWing) && !partitionNo.StartsWith(cleanWing, StringComparison.OrdinalIgnoreCase))
            {
                displayLabel = $"{cleanWing} - {partitionNo} Unit";
            }
            else
            {
                displayLabel = $"{partitionNo} Unit";
            }
        }
        else if (!string.IsNullOrEmpty(cleanWing))
        {
            displayLabel = $"{cleanWing} Unit";
        }
        else if (!string.IsNullOrEmpty(mainPropertyNo))
        {
            displayLabel = $"Property ({mainPropertyNo})";
        }
        else
        {
            displayLabel = isUnit ? "Unit Level" : "Property Level";
        }

        // Polymorphic document and photo enrichment
        var detailIds = socialDetails.Select(x => x.Id).Where(id => id > 0).ToList();
        var bindings = new List<PropertySocialDetailBindingInfo>();
        if (detailIds.Count > 0)
        {
            var bindingInfos = await _documentApplicationService.GetDocumentsByReferenceTableAsync(
                "PropertySocialDetails",
                detailIds,
                cancellationToken);

            bindings = bindingInfos.Select(b => new PropertySocialDetailBindingInfo
            {
                PropertySocialDetailId = b.ReferenceTableId,
                BindingId = b.BindingId,
                DocumentGuid = b.DocumentGuid,
                BindingPurpose = b.BindingPurpose
            }).ToList();
        }

        var bindingsByDetailId = bindings
            .GroupBy(b => b.PropertySocialDetailId)
            .ToDictionary(g => g.Key, g => g.ToList());

        // Batch-resolve unresolved direct DocumentBindingIds
        var unresolvedBindingIds = socialDetails
            .Where(e => e.DocumentBindingId.HasValue && e.DocumentBindingId.Value > 0)
            .Select(e => e.DocumentBindingId!.Value)
            .Distinct()
            .Where(bId => !bindings.Any(b => b.BindingId == bId))
            .ToList();

        var directDocsByBindingId = new Dictionary<int, DocumentDto?>();
        if (unresolvedBindingIds.Count > 0)
        {
            using var semaphore = new SemaphoreSlim(10, 10);
            var docTasks = unresolvedBindingIds.Select(async bId =>
            {
                await semaphore.WaitAsync(cancellationToken);
                try
                {
                    var doc = await _documentApplicationService.GetDocumentByBindingAsync(bId, cancellationToken);
                    return (BindingId: bId, Doc: doc);
                }
                finally
                {
                    semaphore.Release();
                }
            });
            var resolvedDocs = await Task.WhenAll(docTasks);
            foreach (var r in resolvedDocs)
            {
                directDocsByBindingId[r.BindingId] = r.Doc;
            }
        }

        var appliedDiscountItems = new List<AppliedDiscountSocialItemDto>();
        var appliedSocialItems = new List<AppliedDiscountSocialItemDto>();

        foreach (var entity in socialDetails)
        {
            bindingsByDetailId.TryGetValue(entity.Id, out var entityBindings);
            entityBindings ??= new List<PropertySocialDetailBindingInfo>();

            var docBinding = entityBindings
                .OrderByDescending(b => b.BindingId)
                .FirstOrDefault(b => b.BindingId == entity.DocumentBindingId && !IsPhotoPurpose(b.BindingPurpose))
                ?? entityBindings
                    .OrderByDescending(b => b.BindingId)
                    .FirstOrDefault(b => !IsPhotoPurpose(b.BindingPurpose));

            var photoBinding = entityBindings
                .OrderByDescending(b => b.BindingId)
                .FirstOrDefault(b => IsPhotoPurpose(b.BindingPurpose));

            int? resolvedDocBindingId = null;
            Guid? resolvedDocGuid = null;

            if (docBinding != null)
            {
                resolvedDocBindingId = docBinding.BindingId;
                resolvedDocGuid = docBinding.DocumentGuid;
            }
            else if (entity.DocumentBindingId.HasValue && entity.DocumentBindingId.Value > 0)
            {
                if (directDocsByBindingId.TryGetValue(entity.DocumentBindingId.Value, out var directDoc) && directDoc != null)
                {
                    resolvedDocBindingId = entity.DocumentBindingId.Value;
                    resolvedDocGuid = directDoc.DocumentGuid;
                }
                else if (entity.DocumentBinding != null && entity.DocumentBinding.IsActive && !entity.DocumentBinding.MarkedForDeletion
                         && entity.DocumentBinding.Document != null && entity.DocumentBinding.Document.IsActive && !entity.DocumentBinding.Document.MarkedForDeletion)
                {
                    resolvedDocBindingId = entity.DocumentBinding.Id;
                    resolvedDocGuid = entity.DocumentBinding.Document.DocumentGuid;
                }
            }

            int? resolvedPhotoBindingId = photoBinding?.BindingId;
            Guid? resolvedPhotoGuid = photoBinding?.DocumentGuid;

            bool hasActiveDoc = resolvedDocGuid.HasValue && resolvedDocGuid != Guid.Empty;
            bool hasActivePhoto = resolvedPhotoGuid.HasValue && resolvedPhotoGuid != Guid.Empty;

            var hasScalarValue = (entity.BitValue == true)
                || (entity.IntValue.HasValue && entity.IntValue.Value > 0)
                || (entity.DecimalValue.HasValue && entity.DecimalValue.Value > 0)
                || (!string.IsNullOrWhiteSpace(entity.TextValue) && entity.TextValue.Trim() != "-" && !entity.TextValue.Trim().Equals("no", StringComparison.OrdinalIgnoreCase) && !entity.TextValue.Trim().Equals("false", StringComparison.OrdinalIgnoreCase))
                || entity.DateValue.HasValue;

            var isApplied = hasScalarValue || hasActiveDoc || hasActivePhoto;
            if (!isApplied) continue;

            var itemDto = new AppliedDiscountSocialItemDto
            {
                SocialAttributeId = entity.SocialAttributeId,
                PropertySocialDetailId = entity.Id,
                SocietyDetailId = entity.SocietyDetailId ?? wing?.SocietyDetailsMastId,
                WingDetailId = entity.WingDetailId ?? property.WingDetailId,
                PropertyId = propertyId,
                Level = level,
                EntityType = entityType,
                WingName = cleanWing,
                PartitionNo = partitionNo,
                MainPropertyNo = mainPropertyNo,
                DisplayLevelLabel = displayLabel,
                BitValue = entity.BitValue,
                IntValue = entity.IntValue,
                DecimalValue = entity.DecimalValue,
                TextValue = entity.TextValue,
                DateValue = entity.DateValue,
                DocumentBindingId = resolvedDocBindingId,
                DocumentGuid = resolvedDocGuid,
                PhotoBindingId = resolvedPhotoBindingId,
                PhotoGuid = resolvedPhotoGuid,
                Remark = entity.Remark,
                SocialAttributeCode = entity.SocialAttribute?.SocialAttributeCode ?? string.Empty,
                SocialAttributeName = entity.SocialAttribute?.SocialAttributeName ?? string.Empty,
                DataType = entity.SocialAttribute?.DataType ?? string.Empty,
                Unit = entity.SocialAttribute?.Unit,
                DisplayOrder = entity.SocialAttribute?.DisplayOrder,
                ParentAttributeId = entity.SocialAttribute?.ParentAttributeId,
                IsRequiredWhenParentTrue = entity.SocialAttribute?.IsRequiredWhenParentTrue ?? false,
                IsDiscountApplicable = entity.SocialAttribute?.IsDiscountApplicable ?? false,
                PhotoTypeId = entity.SocialAttribute?.PhotoTypeId,
                AttributeCategory = entity.SocialAttribute?.AttributeCategory,
                IsPhotoRequired = entity.SocialAttribute?.IsPhotoRequired ?? false,
                IsDocumentRequired = entity.SocialAttribute?.IsDocumentRequired ?? false,
                IsActive = entity.SocialAttribute?.IsActive ?? true,
                IsCommonAreaAttribute = entity.SocialAttribute?.IsCommonAreaAttribute ?? false
            };

            if (entity.SocialAttribute?.IsDiscountApplicable == true)
            {
                appliedDiscountItems.Add(itemDto);
            }
            else
            {
                appliedSocialItems.Add(itemDto);
            }
        }

        var appliedDiscountAttrIds = appliedDiscountItems.Select(x => x.SocialAttributeId).ToHashSet();
        var appliedSocialAttrIds = appliedSocialItems.Select(x => x.SocialAttributeId).ToHashSet();

        var nonAppliedDiscountItems = masterAttributes
            .Where(a => a.IsDiscountApplicable && !appliedDiscountAttrIds.Contains(a.Id))
            .Select(a => CreateNonAppliedDto(a, level, entityType, wing?.SocietyDetailsMastId, property.WingDetailId, propertyId, cleanWing, partitionNo, displayLabel))
            .OrderBy(x => x.DisplayOrder ?? int.MaxValue)
            .ThenBy(x => x.SocialAttributeId)
            .ToList();

        var nonAppliedSocialItems = masterAttributes
            .Where(a => !a.IsDiscountApplicable && !appliedSocialAttrIds.Contains(a.Id))
            .Select(a => CreateNonAppliedDto(a, level, entityType, wing?.SocietyDetailsMastId, property.WingDetailId, propertyId, cleanWing, partitionNo, displayLabel))
            .OrderBy(x => x.DisplayOrder ?? int.MaxValue)
            .ThenBy(x => x.SocialAttributeId)
            .ToList();

        appliedDiscountItems = appliedDiscountItems
            .OrderBy(x => NormalizeForNaturalSort(x.PartitionNo))
            .ThenBy(x => x.DisplayOrder ?? int.MaxValue)
            .ThenBy(x => x.SocialAttributeId)
            .ThenBy(x => x.PropertySocialDetailId)
            .ToList();

        appliedSocialItems = appliedSocialItems
            .OrderBy(x => NormalizeForNaturalSort(x.PartitionNo))
            .ThenBy(x => x.DisplayOrder ?? int.MaxValue)
            .ThenBy(x => x.SocialAttributeId)
            .ThenBy(x => x.PropertySocialDetailId)
            .ToList();

        int appliedTotal = appliedDiscountItems.Count + appliedSocialItems.Count;

        return new PropertyDiscountAndSocialGridResponseDto
        {
            DiscountData = new DiscountSectionDataDto
            {
                AppliedAttributes = appliedDiscountItems,
                NonAppliedAttributes = nonAppliedDiscountItems
            },
            SocialData = new DiscountSectionDataDto
            {
                AppliedAttributes = appliedSocialItems,
                NonAppliedAttributes = nonAppliedSocialItems
            },
            LevelCounts = new DiscountSocialLevelCountsDto
            {
                All = appliedTotal,
                Apartment = 0,
                Wing = 0,
                Unit = isUnit ? appliedTotal : 0,
                Property = !isUnit ? appliedTotal : 0
            },
            UnitEvaluationScope = PropertySocialDetailsConstants.UnitEvaluationScopes.SingleUnit
        };
    }

    private static NonAppliedDiscountSocialItemDto CreateNonAppliedDto(
        SocialAttributeEntity a,
        string level,
        string entityType,
        int? societyDetailId,
        int? wingDetailId,
        int? propertyId,
        string? wingName,
        string? partitionNo,
        string? displayLevelLabel)
    {
        return new NonAppliedDiscountSocialItemDto
        {
            Id = a.Id,
            SocialAttributeId = a.Id,
            Level = level,
            EntityType = entityType,
            SocietyDetailId = societyDetailId,
            WingDetailId = wingDetailId,
            PropertyId = propertyId,
            WingName = wingName,
            PartitionNo = partitionNo,
            DisplayLevelLabel = displayLevelLabel,
            SocialAttributeCode = a.SocialAttributeCode,
            SocialAttributeName = a.SocialAttributeName,
            DataType = a.DataType,
            Unit = a.Unit,
            DisplayOrder = a.DisplayOrder,
            ParentAttributeId = a.ParentAttributeId,
            IsRequiredWhenParentTrue = a.IsRequiredWhenParentTrue,
            IsDiscountApplicable = a.IsDiscountApplicable,
            PhotoTypeId = a.PhotoTypeId,
            AttributeCategory = a.AttributeCategory,
            IsPhotoRequired = a.IsPhotoRequired,
            IsDocumentRequired = a.IsDocumentRequired,
            IsActive = a.IsActive,
            IsCommonAreaAttribute = a.IsCommonAreaAttribute
        };
    }

    private SocialAttributeHierarchyDto BuildHierarchy(
        SocialAttributeEntity attribute,
        List<SocialAttributeEntity> allAttributes,
        List<PropertySocialDetailsEntity> existingDetails,
        List<PropertySocialDetailBindingInfo> bindings)
    {
        // Find existing value for this attribute
        var existingValue = existingDetails.FirstOrDefault(x => x.SocialAttributeId == attribute.Id);

        Guid? docGuid = null;
        int? docBindingId = existingValue?.DocumentBindingId;
        int? photoBindingId = null;
        Guid? photoGuid = null;

        if (existingValue != null)
        {
            var psdId = existingValue.Id;
            var photoBinding = bindings.FirstOrDefault(b => b.PropertySocialDetailId == psdId && b.BindingPurpose == "Photo");
            if (photoBinding != null)
            {
                photoBindingId = photoBinding.BindingId;
                photoGuid = photoBinding.DocumentGuid;
            }

            if (docBindingId.HasValue)
            {
                var dbObj = bindings.FirstOrDefault(b => b.PropertySocialDetailId == psdId && b.BindingId == docBindingId.Value);
                docGuid = dbObj?.DocumentGuid;
            }
            else
            {
                var dbObj = bindings.FirstOrDefault(b => b.PropertySocialDetailId == psdId && b.BindingPurpose != "Photo");
                docGuid = dbObj?.DocumentGuid;
                docBindingId = dbObj?.BindingId;
            }
        }

        var dto = _mapper.Map<SocialAttributeHierarchyDto>(attribute);

        if (existingValue != null)
        {
            dto.PropertySocialDetailId = existingValue.Id;
            dto.BitValue = existingValue.BitValue;
            dto.IntValue = existingValue.IntValue;
            dto.DecimalValue = existingValue.DecimalValue;
            dto.TextValue = existingValue.TextValue;
            dto.DateValue = existingValue.DateValue;
            dto.DocumentBindingId = docBindingId;
            dto.DocumentGuid = docGuid;
            dto.PhotoBindingId = photoBindingId;
            dto.PhotoGuid = photoGuid;
            dto.Remark = existingValue.Remark;
        }

        // Recursively build children
        var children = allAttributes.Where(x => x.ParentAttributeId == attribute.Id).ToList();
        dto.Children = children.Select(child => BuildHierarchy(child, allAttributes, existingDetails, bindings)).ToList();

        return dto;
    }

    public async Task<List<PropertySocialDetailsDto>> UpsertPropertySocialInfoAsync(UpsertPropertySocialInfoDto dto, CancellationToken cancellationToken = default)
    {
        var allSocialAttributes = await _socialDetailsRepository.GetActiveSocialAttributesAsync(cancellationToken);
        var allowedSocialAttributes = FilterOutDiscountApplicableAttributes(allSocialAttributes);
        var allowedIds = allowedSocialAttributes.Select(x => x.Id).ToHashSet();

        if (dto.SocialAttributes != null && dto.SocialAttributes.Any())
        {
            foreach (var item in dto.SocialAttributes)
            {
                if (!allowedIds.Contains(item.SocialAttributeId))
                {
                    throw new PropertyValidationException(
                        $"SocialAttribute with ID {item.SocialAttributeId} is marked as discount-applicable or has a discount-applicable parent/child. " +
                        "It cannot be updated via the social-details endpoint.");
                }
            }
        }

        if (dto.SocialAttributeIdsToRemove != null && dto.SocialAttributeIdsToRemove.Any())
        {
            foreach (var id in dto.SocialAttributeIdsToRemove)
            {
                if (!allowedIds.Contains(id))
                {
                    throw new PropertyValidationException(
                        $"SocialAttribute with ID {id} is marked as discount-applicable or has a discount-applicable parent/child. " +
                        "It cannot be removed via the social-details endpoint.");
                }
            }
        }

        var existingRecords = await _socialDetailsRepository.GetSocialDetailsByPropertyAsync(dto.PropertyId, cancellationToken)
            ?? new List<PropertySocialDetailsEntity>();

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            // Step 1: Soft delete (mark as inactive) the social attributes to remove
            if (dto.SocialAttributeIdsToRemove != null && dto.SocialAttributeIdsToRemove.Any())
            {
                var recordsToRemove = existingRecords
                    .Where(x => dto.SocialAttributeIdsToRemove.Contains(x.SocialAttributeId))
                    .ToList();

                foreach (var record in recordsToRemove)
                {
                    record.IsActive = false;
                    record.UpdatedBy = dto.UpdatedBy;
                    record.UpdatedDate = DateTime.Now;
                    await _repository.UpdateAsync(record, cancellationToken);

                    await DeactivateAllSocialDetailBindingsAsync(record.Id, record.DocumentBindingId, dto.UpdatedBy, cancellationToken);
                }
            }

            var newBindingsToUpdate = new List<(int BindingId, PropertySocialDetailsEntity Record)>();

            // Step 2: Process social attributes to add or update
            if (dto.SocialAttributes != null && dto.SocialAttributes.Count > 0)
            {
                foreach (var item in dto.SocialAttributes)
                {
                    var existingRecord = (item.Id.HasValue && item.Id.Value > 0)
                        ? existingRecords.FirstOrDefault(x => x.Id == item.Id.Value)
                        : existingRecords.FirstOrDefault(x => x.SocialAttributeId == item.SocialAttributeId);

                    if (existingRecord != null)
                    {
                        await DeactivateOldDocumentBindingsAsync(existingRecord.Id, existingRecord.DocumentBindingId, item.DocumentBindingId, dto.UpdatedBy, cancellationToken);
                        UpdateEntityValues(existingRecord, item, dto.UpdatedBy);
                        await _repository.UpdateAsync(existingRecord, cancellationToken);

                        if (item.DocumentBindingId.HasValue && item.DocumentBindingId.Value > 0)
                        {
                            newBindingsToUpdate.Add((item.DocumentBindingId.Value, existingRecord));
                        }
                    }
                    else
                    {
                        // Create new record
                        var newRecord = new PropertySocialDetailsEntity
                        {
                            PropertyId = dto.PropertyId,
                            SocialAttributeId = item.SocialAttributeId,
                            EntityType = PropertySocialDetailsConstants.EntityTypes.Property,
                            BitValue = item.BitValue,
                            IntValue = item.IntValue,
                            DecimalValue = item.DecimalValue,
                            TextValue = item.TextValue,
                            DateValue = item.DateValue,
                            DocumentBindingId = (item.DocumentBindingId.HasValue && item.DocumentBindingId.Value > 0) ? item.DocumentBindingId : null,
                            Remark = item.Remark,
                            CreatedBy = dto.UpdatedBy,
                            CreatedDate = DateTime.Now,
                            IsActive = true
                        };
                        await _repository.AddAsync(newRecord, cancellationToken);

                        if (item.DocumentBindingId.HasValue && item.DocumentBindingId.Value > 0)
                        {
                            newBindingsToUpdate.Add((item.DocumentBindingId.Value, newRecord));
                        }
                    }
                }
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Update ReferenceTableId for new document bindings so the binding points to the
            // correct entity row (its ID is only known after SaveChanges).
            foreach (var tuple in newBindingsToUpdate)
            {
                await _documentApplicationService.UpdateDocumentBindingReferenceAsync(
                    tuple.BindingId,
                    tuple.Record.Id,
                    dto.UpdatedBy,
                    cancellationToken);
            }

            if (newBindingsToUpdate.Any())
            {
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }

            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }

        // Step 3: Return updated list
        var updatedRecords = await _socialDetailsRepository.GetActiveSocialDetailsWithAttributeByPropertyAsync(dto.PropertyId, cancellationToken);

        var dtos = _mapper.Map<List<PropertySocialDetailsDto>>(updatedRecords);
        await EnrichDtosAsync(dtos, cancellationToken);
        return dtos;
    }

    /// <summary>
    /// Validates that a document binding exists and is active.
    /// </summary>
    private async Task ValidateDocumentBindingForAttachmentAsync(int documentBindingId, int? currentEntityId, CancellationToken cancellationToken)
    {
        var document = await _documentApplicationService.GetDocumentByBindingAsync(documentBindingId, cancellationToken);
        if (document == null)
        {
            throw new PropertyValidationException(
                $"Document binding with ID {documentBindingId} does not exist or has no active document.");
        }
    }

    /// <summary>
    /// Deactivates all document bindings for a given social detail row via the global document service.
    /// </summary>
    private async Task DeactivateAllSocialDetailBindingsAsync(int propertySocialDetailId, int? documentBindingId, int updatedBy, CancellationToken cancellationToken)
    {
        var bindingsToDeactivate = new HashSet<int>();
        if (documentBindingId.HasValue && documentBindingId.Value > 0)
        {
            bindingsToDeactivate.Add(documentBindingId.Value);
        }

        var activeBindingInfos = await _documentApplicationService.GetDocumentsByReferenceTableAsync(
            "PropertySocialDetails",
            new[] { propertySocialDetailId },
            cancellationToken);

        foreach (var bindingInfo in activeBindingInfos)
        {
            bindingsToDeactivate.Add(bindingInfo.BindingId);
        }

        foreach (var bindingId in bindingsToDeactivate)
        {
            var isStillInUseByOthers = await _repository.GetQueryable()
                .AnyAsync(x => x.Id != propertySocialDetailId
                            && x.DocumentBindingId == bindingId
                            && x.IsActive
                            && !x.MarkedForDeletion,
                    cancellationToken);

            if (!isStillInUseByOthers)
            {
                await _documentApplicationService.DeactivateDocumentBindingAsync(
                    bindingId,
                    updatedBy,
                    cancellationToken);
            }
        }
    }

    /// <summary>
    /// Deactivates old document bindings for a social detail row, preserving the new binding if provided.
    /// Routes through the global document service — no direct repository access.
    /// </summary>
    private async Task DeactivateOldDocumentBindingsAsync(int propertySocialDetailId, int? oldDocumentBindingId, int? newDocumentBindingId, int updatedBy, CancellationToken cancellationToken)
    {
        var bindingsToDeactivate = new HashSet<int>();

        if (oldDocumentBindingId.HasValue && oldDocumentBindingId.Value > 0)
        {
            if (!newDocumentBindingId.HasValue || oldDocumentBindingId.Value != newDocumentBindingId.Value)
            {
                bindingsToDeactivate.Add(oldDocumentBindingId.Value);
            }
        }

        var activeBindingInfos = await _documentApplicationService.GetDocumentsByReferenceTableAsync(
            "PropertySocialDetails",
            new[] { propertySocialDetailId },
            cancellationToken);

        foreach (var bindingInfo in activeBindingInfos)
        {
            if (!newDocumentBindingId.HasValue || bindingInfo.BindingId != newDocumentBindingId.Value)
            {
                bindingsToDeactivate.Add(bindingInfo.BindingId);
            }
        }

        foreach (var bindingId in bindingsToDeactivate)
        {
            var isStillInUseByOthers = await _repository.GetQueryable()
                .AnyAsync(x => x.Id != propertySocialDetailId
                            && x.DocumentBindingId == bindingId
                            && x.IsActive
                            && !x.MarkedForDeletion,
                    cancellationToken);

            if (!isStillInUseByOthers)
            {
                await _documentApplicationService.DeactivateDocumentBindingAsync(
                    bindingId,
                    updatedBy,
                    cancellationToken);
            }
        }
    }

    private static void UpdateEntityValues(PropertySocialDetailsEntity entity, PropertySocialInfoItemDto item, int updatedBy)
    {
        if (string.IsNullOrWhiteSpace(entity.EntityType))
        {
            entity.EntityType = PropertySocialDetailsConstants.EntityTypes.Property;
        }
        entity.BitValue = item.BitValue;
        entity.IntValue = item.IntValue;
        entity.DecimalValue = item.DecimalValue;
        entity.TextValue = item.TextValue;
        entity.DateValue = item.DateValue;
        entity.DocumentBindingId = (item.DocumentBindingId.HasValue && item.DocumentBindingId.Value > 0) ? item.DocumentBindingId : null;
        entity.Remark = item.Remark;
        entity.IsActive = true;
        entity.MarkedForDeletion = false;
        entity.MarkedForDeletionDate = null;
        entity.UpdatedBy = updatedBy;
        entity.UpdatedDate = DateTime.Now;
    }

    private static List<SocialAttributeEntity> FilterOutDiscountApplicableAttributes(List<SocialAttributeEntity> allAttributes)
    {
        var directlyDiscountApplicableIds = allAttributes
            .Where(x => x.IsDiscountApplicable)
            .Select(x => x.Id)
            .ToHashSet();

        if (directlyDiscountApplicableIds.Count == 0)
            return allAttributes;

        var parentIdsWithDiscountApplicableChildren = allAttributes
            .Where(c => c.ParentAttributeId.HasValue && directlyDiscountApplicableIds.Contains(c.Id))
            .Select(c => c.ParentAttributeId!.Value)
            .ToHashSet();

        return allAttributes.Where(sa =>
            !directlyDiscountApplicableIds.Contains(sa.Id) &&
            (!sa.ParentAttributeId.HasValue || !directlyDiscountApplicableIds.Contains(sa.ParentAttributeId.Value)) &&
            !parentIdsWithDiscountApplicableChildren.Contains(sa.Id)
        ).ToList();
    }
}
