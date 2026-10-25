using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Infrastructure.Data;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace NtisPlatform.Infrastructure.Services.Handlers;

/// <summary>
/// Handles document binding side-effects for the <c>PropertyPhoto</c> business entity.
/// Registered in DI as <see cref="IDocumentBindingHandler"/> so that
/// <c>DocumentApplicationService</c> remains fully ignorant of PropertyPhoto-specific logic.
///
/// <para>
/// Responsibilities:
/// <list type="bullet">
///   <item>Before upload commits — verify the target <c>PropertyPhoto</c> or <c>PropertyMast</c> exists (<see cref="ReferenceExistsAsync"/>).</item>
///   <item>After upload — link the new <c>DocumentBindingId</c> back to the <c>PropertyPhoto</c> row, dynamically creating it if pointing to a <c>PropertyId</c>.</item>
///   <item>Before delete — soft-delete the associated <c>PropertyPhoto</c> row.</item>
/// </list>
/// </para>
/// </summary>
public sealed class PropertyPhotoDocumentBindingHandler : IDocumentBindingHandler
{
    private readonly IPropertyPhotoService _propertyPhotoService;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PropertyPhotoDocumentBindingHandler> _logger;

    /// <summary>
    /// The one photo type that is shared across multiple properties instead of being bound
    /// 1:1 to a single PropertyId -- see <see cref="ResolvePropertyPlanBindingAsync"/>.
    /// </summary>
    private const string PropertyPlanPhotoTypeCode = "PROPERTY_PLAN";
    private const int ApartmentCategoryId = 1;
    private const int AmenityPropertyTypeId = 140;

    /// <inheritdoc/>
    public string ReferenceTableName => "PropertyPhoto";

    public PropertyPhotoDocumentBindingHandler(
        IPropertyPhotoService propertyPhotoService,
        ApplicationDbContext context,
        ILogger<PropertyPhotoDocumentBindingHandler> logger)
    {
        _propertyPhotoService = propertyPhotoService;
        _context = context;
        _logger = logger;
    }

    /// <inheritdoc/>
    public bool Handles(string referenceTableName)
        => string.Equals(referenceTableName, "PropertyPhoto", StringComparison.OrdinalIgnoreCase)
        || string.Equals(referenceTableName, "PropertyPhotos", StringComparison.OrdinalIgnoreCase);

    /// <inheritdoc/>
    public Task<bool> ReferenceExistsAsync(int referenceTableId, CancellationToken cancellationToken)
        => ReferenceExistsAsync(referenceTableId, null, cancellationToken);

    /// <inheritdoc/>
    public async Task<bool> ReferenceExistsAsync(int referenceTableId, string? referencePropertyName, CancellationToken cancellationToken)
    {
        if (string.Equals(referencePropertyName, "PropertyId", StringComparison.OrdinalIgnoreCase))
        {
            var propertyExists = await _context.PropertyMast
                .AnyAsync(x => x.Id == referenceTableId && x.IsActive && !x.MarkedForDeletion, cancellationToken);

            if (!propertyExists)
            {
                _logger.LogWarning(
                    "PropertyPhotoDocumentBindingHandler.ReferenceExistsAsync: no active Property found with ID={PropertyId}.",
                    referenceTableId);
            }

            return propertyExists;
        }

        if (string.Equals(referencePropertyName, "WingDetailId", StringComparison.OrdinalIgnoreCase))
        {
            var wingExists = await _context.Set<WingDetailsMastEntity>()
                .AnyAsync(x => x.Id == referenceTableId && x.IsActive && !x.MarkedForDeletion, cancellationToken);

            if (!wingExists)
            {
                _logger.LogWarning(
                    "PropertyPhotoDocumentBindingHandler.ReferenceExistsAsync: no active WingDetailsMast found with ID={WingDetailId}.",
                    referenceTableId);
            }

            return wingExists;
        }

        if (string.Equals(referencePropertyName, "SocietyDetailId", StringComparison.OrdinalIgnoreCase))
        {
            var societyExists = await _context.SocietyDetailsMast
                .AnyAsync(x => x.Id == referenceTableId && x.IsActive && !x.MarkedForDeletion, cancellationToken);

            if (!societyExists)
            {
                _logger.LogWarning(
                    "PropertyPhotoDocumentBindingHandler.ReferenceExistsAsync: no active SocietyDetailsMast found with ID={SocietyDetailId}.",
                    referenceTableId);
            }

            return societyExists;
        }

        var photo = await _propertyPhotoService.GetByIdAsync(referenceTableId, cancellationToken);
        var exists = photo != null;

        if (!exists)
        {
            _logger.LogWarning(
                "PropertyPhotoDocumentBindingHandler.ReferenceExistsAsync: no active PropertyPhoto found with ID={PhotoId}.",
                referenceTableId);
        }

        return exists;
    }

    /// <summary>
    /// Links the newly created <c>DocumentBindingId</c> back to the <c>PropertyPhoto</c> row.
    /// If the binding is currently pointing to a <c>PropertyId</c>, a new <c>PropertyPhoto</c>
    /// row is created on the fly and the binding is updated to reference it.
    /// </summary>
    public async Task OnAfterUploadAsync(
        int documentId,
        int bindingId,
        int referenceTableId,
        int uploadedBy,
        CancellationToken cancellationToken)
    {
        var binding = await _context.DocumentBindings
            .Include(db => db.Document)
            .FirstOrDefaultAsync(db => db.Id == bindingId, cancellationToken);

        var isPropertyId = binding != null && (
            string.Equals(binding.ReferencePropertyName, "PropertyId", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(binding.ReferencePropertyName, "WingDetailId", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(binding.ReferencePropertyName, "SocietyDetailId", StringComparison.OrdinalIgnoreCase)
        );

        if (binding != null && !isPropertyId)
        {
            var photoExists = await _context.PropertyPhotos
                .AnyAsync(x => x.Id == referenceTableId && !x.MarkedForDeletion, cancellationToken);
            if (!photoExists)
            {
                isPropertyId = true;
                var wingExists = await _context.Set<WingDetailsMastEntity>()
                    .AnyAsync(x => x.Id == referenceTableId && x.IsActive && !x.MarkedForDeletion, cancellationToken);
                if (wingExists)
                {
                    binding.ReferencePropertyName = "WingDetailId";
                }
                else
                {
                    var societyExists = await _context.SocietyDetailsMast
                        .AnyAsync(x => x.Id == referenceTableId && x.IsActive && !x.MarkedForDeletion, cancellationToken);
                    if (societyExists)
                    {
                        binding.ReferencePropertyName = "SocietyDetailId";
                    }
                    else
                    {
                        binding.ReferencePropertyName = "PropertyId";
                    }
                }
            }
        }

        if (binding != null && isPropertyId)
        {
            var docType = binding.Document?.DocumentType;
            if (string.IsNullOrEmpty(docType))
            {
                throw new InvalidOperationException("Cannot resolve photo type: DocumentType is empty.");
            }

            PropertyPhotoTypeEntity? photoType = null;
            if (int.TryParse(docType, out var typeId))
            {
                photoType = await _context.PropertyPhotoTypes
                    .FirstOrDefaultAsync(t => t.Id == typeId && t.IsActive, cancellationToken);
            }

            if (photoType == null)
            {
                var docTypeLower = docType.ToLower();
                photoType = await _context.PropertyPhotoTypes
                    .FirstOrDefaultAsync(t => t.PhotoTypeCode.ToLower() == docTypeLower && t.IsActive, cancellationToken);
            }

            if (photoType == null && (
                string.Equals(docType, "PHOTO_PLAN", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(docType, "PLAN", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(docType, "DRAW_PLAN", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(docType, "PROPERTY_PLAN", StringComparison.OrdinalIgnoreCase)))
            {
                photoType = await _context.PropertyPhotoTypes
                    .FirstOrDefaultAsync(t => t.IsActive && (
                        t.PhotoTypeCode.ToLower() == PropertyPlanPhotoTypeCode.ToLower() ||
                        t.PhotoTypeCode.ToLower() == "photo_plan" ||
                        t.PhotoTypeCode.ToLower().Contains("plan")
                    ), cancellationToken);
            }

            if (photoType == null)
            {
                throw new InvalidOperationException($"Invalid or inactive photo type code/ID: '{docType}'");
            }

            if (string.Equals(photoType.PhotoTypeCode, PropertyPlanPhotoTypeCode, StringComparison.OrdinalIgnoreCase)
                && string.Equals(binding.ReferencePropertyName, "PropertyId", StringComparison.OrdinalIgnoreCase))
            {
                await CreateOrReusePropertyPlanPhotoAsync(referenceTableId, photoType.Id, bindingId, binding, uploadedBy, cancellationToken);
                return;
            }

            int? wingDetailId = null;
            int? societyDetailId = null;
            int finalPropertyId = referenceTableId;

            if (string.Equals(binding.ReferencePropertyName, "WingDetailId", StringComparison.OrdinalIgnoreCase))
            {
                wingDetailId = referenceTableId;
                if (wingDetailId.HasValue)
                {
                    var wingInfo = await _context.Set<WingDetailsMastEntity>()
                        .Where(w => w.Id == wingDetailId.Value && w.IsActive && !w.MarkedForDeletion)
                        .Select(w => new { w.SocietyDetailsMastId })
                        .FirstOrDefaultAsync(cancellationToken);
                    societyDetailId = wingInfo?.SocietyDetailsMastId;

                    if (societyDetailId.HasValue)
                    {
                        var socInfo = await _context.SocietyDetailsMast
                            .Where(s => s.Id == societyDetailId.Value && s.IsActive && !s.MarkedForDeletion)
                            .Select(s => (int?)s.PropertyId)
                            .FirstOrDefaultAsync(cancellationToken);
                        if (socInfo.HasValue && socInfo.Value > 0)
                        {
                            finalPropertyId = socInfo.Value;
                        }
                    }
                }
            }
            else if (string.Equals(binding.ReferencePropertyName, "SocietyDetailId", StringComparison.OrdinalIgnoreCase))
            {
                // A society photo is uploaded against SocietyDetailsMast directly. Do not treat
                // its ID as a PropertyMast ID; doing so leaves SocietyDetailId null and causes
                // the property gallery query to omit the newly uploaded photo.
                societyDetailId = referenceTableId;
            }
            else
            {
                var propertyInfo = await _context.PropertyMast
                    .Where(p => p.Id == referenceTableId && p.IsActive && !p.MarkedForDeletion)
                    .Select(p => new { p.WardId, p.PropertyNo, p.WingDetailId })
                    .FirstOrDefaultAsync(cancellationToken);

                wingDetailId = propertyInfo?.WingDetailId;
                int? defaultWingId = wingDetailId;

                societyDetailId = await _context.SocietyDetailsMast
                    .Where(s => s.PropertyId == referenceTableId && s.IsActive && !s.MarkedForDeletion)
                    .Select(s => (int?)s.Id)
                    .FirstOrDefaultAsync(cancellationToken);

                if (!societyDetailId.HasValue && propertyInfo != null && !string.IsNullOrWhiteSpace(propertyInfo.PropertyNo))
                {
                    var mainPropIds = await _context.PropertyMast
                        .Where(p => p.WardId == propertyInfo.WardId && p.PropertyNo == propertyInfo.PropertyNo && p.IsActive && !p.MarkedForDeletion)
                        .Select(p => p.Id)
                        .ToListAsync(cancellationToken);

                    if (mainPropIds.Any())
                    {
                        societyDetailId = await _context.SocietyDetailsMast
                            .Where(s => s.PropertyId.HasValue && mainPropIds.Contains(s.PropertyId.Value) && s.IsActive && !s.MarkedForDeletion)
                            .Select(s => (int?)s.Id)
                            .FirstOrDefaultAsync(cancellationToken);
                    }
                }

                if (!societyDetailId.HasValue && wingDetailId.HasValue)
                {
                    var wingInfo = await _context.Set<WingDetailsMastEntity>()
                        .Where(w => w.Id == wingDetailId.Value && w.IsActive && !w.MarkedForDeletion)
                        .Select(w => new { w.SocietyDetailsMastId })
                        .FirstOrDefaultAsync(cancellationToken);
                    societyDetailId = wingInfo?.SocietyDetailsMastId;
                }

                // If this is a WING photo, attempt to resolve WingDetailId from Society/Remarks matching WingName first
                if (societyDetailId.HasValue && (string.Equals(photoType.PhotoScope, "WING", StringComparison.OrdinalIgnoreCase) || photoType.PhotoTypeCode.Contains("WING", StringComparison.OrdinalIgnoreCase)))
                {
                    var wings = await _context.Set<WingDetailsMastEntity>()
                        .Where(w => w.SocietyDetailsMastId == societyDetailId.Value && w.IsActive && !w.MarkedForDeletion)
                        .ToListAsync(cancellationToken);

                    if (wings.Any())
                    {
                        var purpose = binding.BindingPurpose ?? string.Empty;
                        var matchedWing = wings.FirstOrDefault(w =>
                            !string.IsNullOrEmpty(w.WingName) && (
                                purpose.Contains($"({w.WingName})", StringComparison.OrdinalIgnoreCase) ||
                                purpose.Contains($" {w.WingName} ", StringComparison.OrdinalIgnoreCase) ||
                                purpose.EndsWith($" {w.WingName}", StringComparison.OrdinalIgnoreCase) ||
                                purpose.Contains(w.WingName, StringComparison.OrdinalIgnoreCase)
                            )
                        );

                        wingDetailId = matchedWing != null ? matchedWing.Id : defaultWingId;
                    }
                }

                if (!wingDetailId.HasValue)
                {
                    wingDetailId = defaultWingId;
                }
            }

            // Calculate next display order based on scope
            int nextDisplayOrder = 1;
            if (string.Equals(photoType.PhotoScope, "WING", StringComparison.OrdinalIgnoreCase) && wingDetailId.HasValue)
            {
                var activePhotoDisplayOrders = await _context.PropertyPhotos
                    .Where(p => p.WingDetailId == wingDetailId.Value && p.PhotoTypeId == photoType.Id && p.IsActive && !p.MarkedForDeletion)
                    .Select(p => p.DisplayOrder)
                    .ToListAsync(cancellationToken);
                nextDisplayOrder = (activePhotoDisplayOrders.Any() ? activePhotoDisplayOrders.Max() ?? 0 : 0) + 1;
            }
            else if (string.Equals(photoType.PhotoScope, "SOCIETY", StringComparison.OrdinalIgnoreCase) && societyDetailId.HasValue)
            {
                var activePhotoDisplayOrders = await _context.PropertyPhotos
                    .Where(p => p.SocietyDetailId == societyDetailId.Value && p.PhotoTypeId == photoType.Id && p.IsActive && !p.MarkedForDeletion)
                    .Select(p => p.DisplayOrder)
                    .ToListAsync(cancellationToken);
                nextDisplayOrder = (activePhotoDisplayOrders.Any() ? activePhotoDisplayOrders.Max() ?? 0 : 0) + 1;
            }
            else
            {
                var activePhotoDisplayOrders = await _context.PropertyPhotos
                    .Where(p => p.PropertyId == finalPropertyId && p.PhotoTypeId == photoType.Id && p.IsActive && !p.MarkedForDeletion)
                    .Select(p => p.DisplayOrder)
                    .ToListAsync(cancellationToken);
                nextDisplayOrder = (activePhotoDisplayOrders.Any() ? activePhotoDisplayOrders.Max() ?? 0 : 0) + 1;
            }

            var (entityType, targetSocietyDetailId, targetWingDetailId, targetPropertyId) =
                ResolveScopeTargets(photoType.PhotoScope, wingDetailId, societyDetailId, finalPropertyId);

            var photo = PropertyPhotoEntity.CreateWithDetails(
                propertyId: targetPropertyId,
                photoTypeId: photoType.Id,
                entityType: entityType,
                societyDetailId: targetSocietyDetailId,
                wingDetailId: targetWingDetailId,
                documentBindingId: bindingId,
                displayOrder: nextDisplayOrder,
                remarks: binding.BindingPurpose);

            photo.CreatedBy = uploadedBy;
            photo.CreatedDate = DateTime.Now;

            _context.PropertyPhotos.Add(photo);
            await _context.SaveChangesAsync(cancellationToken);

            binding.ReferenceTableId = photo.Id;
            binding.ReferencePropertyName = "Id";
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "PropertyPhotoDocumentBindingHandler: Created new PropertyPhoto ID={PhotoId} (EntityType={EntityType}, WingDetailId={WingDetailId}, SocietyDetailId={SocietyDetailId}) for Property ID={PropertyId} and Type={TypeCode}, updated binding reference.",
                photo.Id, entityType, targetWingDetailId, targetSocietyDetailId, referenceTableId, photoType.PhotoTypeCode);
        }
        else
        {
            _logger.LogDebug(
                "PropertyPhotoDocumentBindingHandler.OnAfterUploadAsync: linking BindingId={BindingId} to PropertyPhotoId={PhotoId}, DocumentId={DocumentId}",
                bindingId, referenceTableId, documentId);

            var existingPhoto = await _context.PropertyPhotos
                .FirstOrDefaultAsync(x => x.Id == referenceTableId && !x.MarkedForDeletion, cancellationToken);
            if (existingPhoto != null)
            {
                int? wingDetailId = existingPhoto.WingDetailId;
                int? societyDetailId = existingPhoto.SocietyDetailId;
                int? propId = existingPhoto.PropertyId;

                if ((!wingDetailId.HasValue || !societyDetailId.HasValue) && propId.HasValue)
                {
                    var propertyInfo = await _context.PropertyMast
                        .Where(p => p.Id == propId.Value && p.IsActive && !p.MarkedForDeletion)
                        .Select(p => new { p.WardId, p.PropertyNo, p.WingDetailId })
                        .FirstOrDefaultAsync(cancellationToken);

                    wingDetailId = propertyInfo?.WingDetailId;

                    if (wingDetailId.HasValue)
                    {
                        var wingInfo = await _context.Set<WingDetailsMastEntity>()
                            .Where(w => w.Id == wingDetailId.Value && w.IsActive && !w.MarkedForDeletion)
                            .Select(w => new { w.SocietyDetailsMastId })
                            .FirstOrDefaultAsync(cancellationToken);
                        societyDetailId = wingInfo?.SocietyDetailsMastId;
                    }

                    if (!societyDetailId.HasValue)
                    {
                        societyDetailId = await _context.SocietyDetailsMast
                            .Where(s => s.PropertyId == propId.Value && s.IsActive && !s.MarkedForDeletion)
                            .Select(s => (int?)s.Id)
                            .FirstOrDefaultAsync(cancellationToken);

                        if (!societyDetailId.HasValue && propertyInfo != null && !string.IsNullOrWhiteSpace(propertyInfo.PropertyNo))
                        {
                            var mainPropIds = await _context.PropertyMast
                                .Where(p => p.WardId == propertyInfo.WardId && p.PropertyNo == propertyInfo.PropertyNo && p.IsActive && !p.MarkedForDeletion)
                                .Select(p => p.Id)
                                .ToListAsync(cancellationToken);

                            if (mainPropIds.Any())
                            {
                                societyDetailId = await _context.SocietyDetailsMast
                                    .Where(s => s.PropertyId.HasValue && mainPropIds.Contains(s.PropertyId.Value) && s.IsActive && !s.MarkedForDeletion)
                                    .Select(s => (int?)s.Id)
                                    .FirstOrDefaultAsync(cancellationToken);
                            }
                        }
                    }
                }

                var photoType = await _context.PropertyPhotoTypes
                    .FirstOrDefaultAsync(x => x.Id == existingPhoto.PhotoTypeId && x.IsActive, cancellationToken);

                // PROPERTY_PLAN rows carry their own already-correct (EntityType, SocietyDetailId,
                // PropertyId, Type) from CreateOrReusePropertyPlanPhotoAsync -- re-deriving them
                // via the generic ResolveScopeTargets (which knows nothing about the shared-plan
                // Type binding) would wipe that out on a simple re-upload.
                if (photoType != null && !string.Equals(photoType.PhotoTypeCode, PropertyPlanPhotoTypeCode, StringComparison.OrdinalIgnoreCase))
                {
                    var (entityType, targetSocietyDetailId, targetWingDetailId, targetPropertyId) =
                        ResolveScopeTargets(photoType.PhotoScope, wingDetailId, societyDetailId, propId);

                    existingPhoto.UpdateDetails(entityType, targetSocietyDetailId, targetWingDetailId, targetPropertyId);
                }
                else if (photoType != null && string.Equals(photoType.PhotoTypeCode, PropertyPlanPhotoTypeCode, StringComparison.OrdinalIgnoreCase))
                {
                    int? finalPropId = existingPhoto.PropertyId ?? propId;
                    var (entityType, targetPropertyId, targetSocietyDetailId, targetWingDetailId, _) =
                        finalPropId.HasValue
                            ? await ResolvePropertyPlanBindingAsync(finalPropId.Value, cancellationToken)
                            : (existingPhoto.EntityType, existingPhoto.PropertyId, existingPhoto.SocietyDetailId, existingPhoto.WingDetailId, existingPhoto.Type);

                    int? targetPropertyIdToSave = (existingPhoto.DisplayOrder >= 2 || existingPhoto.PropertyId.HasValue)
                        ? (existingPhoto.PropertyId ?? finalPropId)
                        : targetPropertyId;

                    existingPhoto.UpdateDetails(entityType, targetSocietyDetailId, targetWingDetailId, targetPropertyIdToSave);
                }
            }

            await _propertyPhotoService.UpdateDocumentBindingAsync(
                referenceTableId,
                bindingId,
                uploadedBy,
                cancellationToken);

            _logger.LogInformation(
                "PropertyPhotoDocumentBindingHandler: linked BindingId={BindingId} to PropertyPhotoId={PhotoId}",
                bindingId, referenceTableId);
        }
    }

    /// <summary>
    /// Creates (or reuses) the PropertyPhoto row for a PROPERTY_PLAN upload, per the confirmed
    /// business rule:
    /// <list type="bullet">
    ///   <item>Non-Apartment property: PropertyId set, SocietyDetailId/Type null (normal per-property photo).</item>
    ///   <item>Apartment + Amenity: PropertyId set, SocietyDetailId set, Type null.</item>
    ///   <item>Apartment + normal unit: Plan 1 (base plan) can be shared by SocietyDetailId + Type.
    ///     Plan 2 (or any plan specifically added for a single property) stores PropertyId so that only
    ///     that specific property receives and displays the 2 plans.</item>
    /// </list>
    /// </summary>
    private async Task CreateOrReusePropertyPlanPhotoAsync(
        int propertyId,
        int photoTypeId,
        int bindingId,
        DocumentBindingEntity binding,
        int uploadedBy,
        CancellationToken cancellationToken)
    {
        var (entityType, targetPropertyId, targetSocietyDetailId, targetWingDetailId, type) =
            await ResolvePropertyPlanBindingAsync(propertyId, cancellationToken);

        // Fetch property-specific plans for this property
        var propertySpecificPlans = await _context.PropertyPhotos
            .Where(p =>
                p.PhotoTypeId == photoTypeId &&
                p.PropertyId == propertyId &&
                p.IsLatest && p.IsActive && !p.MarkedForDeletion)
            .OrderBy(p => p.DisplayOrder)
            .ThenBy(p => p.Id)
            .ToListAsync(cancellationToken);

        // Fetch shared society-level base plans (PropertyId == null) matching society and type
        List<PropertyPhotoEntity> sharedPlans = new();
        if (targetSocietyDetailId.HasValue && !string.IsNullOrWhiteSpace(type))
        {
            sharedPlans = await _context.PropertyPhotos
                .Where(p =>
                    p.PhotoTypeId == photoTypeId &&
                    p.EntityType == "S" &&
                    p.SocietyDetailId == targetSocietyDetailId.Value &&
                    p.Type == type &&
                    p.PropertyId == null &&
                    (p.DisplayOrder == null || p.DisplayOrder <= 1) &&
                    p.IsLatest && p.IsActive && !p.MarkedForDeletion)
                .OrderBy(p => p.DisplayOrder)
                .ThenBy(p => p.Id)
                .ToListAsync(cancellationToken);
        }

        // If this is an apartment normal unit (targetPropertyId is null) and no property-specific plan exists yet,
        // reuse the shared base plan for this society and type instead of creating a duplicate.
        if (!targetPropertyId.HasValue && propertySpecificPlans.Count == 0 && sharedPlans.Count > 0)
        {
            var reusable = sharedPlans.First();
            reusable.UpdateDetails(entityType, targetSocietyDetailId, targetWingDetailId, null);
            reusable.LinkDocumentBinding(bindingId);
            reusable.UpdatedBy = uploadedBy;
            reusable.UpdatedDate = DateTime.Now;
            await _context.SaveChangesAsync(cancellationToken);

            binding.ReferenceTableId = reusable.Id;
            binding.ReferencePropertyName = "Id";
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "PropertyPhotoDocumentBindingHandler: reused shared PROPERTY_PLAN PhotoId={PhotoId} for EntityType={EntityType}, SocietyDetailId={SocietyDetailId}, Type={Type}.",
                reusable.Id, entityType, targetSocietyDetailId, type);
            return;
        }

        // Build combined existing plans for this property
        List<PropertyPhotoEntity> existingPlans = new(propertySpecificPlans);
        foreach (var shared in sharedPlans)
        {
            if (!existingPlans.Any(p => (p.DisplayOrder ?? 1) == (shared.DisplayOrder ?? 1)))
            {
                existingPlans.Add(shared);
            }
        }
        existingPlans = existingPlans.OrderBy(p => p.DisplayOrder ?? 1).ThenBy(p => p.Id).ToList();

        // Allow up to 2 plans for a single property.
        // If 2 or more plans already exist, update/reuse the last plan.
        if (existingPlans.Count >= 2)
        {
            var reusable = propertySpecificPlans.LastOrDefault() ?? existingPlans.Last();
            int? savePropertyId = propertyId;
            reusable.UpdateDetails(entityType, targetSocietyDetailId, targetWingDetailId, savePropertyId);
            reusable.LinkDocumentBinding(bindingId);
            reusable.UpdatedBy = uploadedBy;
            reusable.UpdatedDate = DateTime.Now;
            await _context.SaveChangesAsync(cancellationToken);

            binding.ReferenceTableId = reusable.Id;
            binding.ReferencePropertyName = "Id";
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "PropertyPhotoDocumentBindingHandler: reused/updated PROPERTY_PLAN PhotoId={PhotoId} for EntityType={EntityType}, PropertyId={PropertyId}, SocietyDetailId={SocietyDetailId}, Type={Type}.",
                reusable.Id, entityType, savePropertyId, targetSocietyDetailId, type);
            return;
        }

        // If 1 plan exists (e.g. shared Plan 1 or property-specific Plan 1), the new plan will be Plan 2 (DisplayOrder = 2).
        // For Plan 2 (or any plan when 1 exists), we MUST set PropertyId to this propertyId
        // so it only applies to this single property.
        int nextDisplayOrder = existingPlans.Count > 0 ? 2 : 1;
        int? finalPropertyIdToSave = propertyId;

        var photo = PropertyPhotoEntity.CreateWithDetails(
            propertyId: finalPropertyIdToSave,
            photoTypeId: photoTypeId,
            entityType: entityType,
            societyDetailId: targetSocietyDetailId,
            wingDetailId: targetWingDetailId,
            documentBindingId: bindingId,
            displayOrder: nextDisplayOrder,
            remarks: binding.BindingPurpose,
            type: type);

        photo.CreatedBy = uploadedBy;
        photo.CreatedDate = DateTime.Now;

        _context.PropertyPhotos.Add(photo);
        await _context.SaveChangesAsync(cancellationToken);

        binding.ReferenceTableId = photo.Id;
        binding.ReferencePropertyName = "Id";
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "PropertyPhotoDocumentBindingHandler: Created PROPERTY_PLAN PhotoId={PhotoId} (DisplayOrder={DisplayOrder}, EntityType={EntityType}, PropertyId={PropertyId}, SocietyDetailId={SocietyDetailId}, Type={Type}).",
            photo.Id, nextDisplayOrder, entityType, finalPropertyIdToSave, targetSocietyDetailId, type);
    }

    private async Task<(string EntityType, int? PropertyId, int? SocietyDetailId, int? WingDetailId, string? Type)> ResolvePropertyPlanBindingAsync(
        int propertyId, CancellationToken cancellationToken)
    {
        var property = await _context.PropertyMast
            .Where(p => p.Id == propertyId && p.IsActive && !p.MarkedForDeletion)
            .Select(p => new {
                p.WardId,
                p.PropertyNo,
                p.PartitionNo,
                p.CategoryId,
                p.PropertyTypeId,
                p.Type,
                p.WingDetailId,
                PropertyDescription = _context.PropertyTypeMasters
                    .Where(pt => pt.Id == p.PropertyTypeId && pt.IsActive)
                    .Select(pt => pt.PropertyDescription)
                    .FirstOrDefault(),
                PartType = _context.PropertyTypeMasters
                    .Where(pt => pt.Id == p.PropertyTypeId && pt.IsActive)
                    .Select(pt => pt.PartType)
                    .FirstOrDefault(),
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (property == null)
        {
            return ("P", propertyId, null, null, null);
        }

        bool isAmenity =
            (!string.IsNullOrEmpty(property.PropertyDescription) &&
             (property.PropertyDescription.Contains("अॅमिनीटी") ||
              property.PropertyDescription.Contains("अॅमिनीटी") ||
              property.PropertyDescription.Contains("Amenity", StringComparison.OrdinalIgnoreCase))) ||
            (!string.IsNullOrEmpty(property.PartType) &&
             property.PartType.Equals("Amenity", StringComparison.OrdinalIgnoreCase)) ||
            (property.CategoryId == 3);

        if (isAmenity)
        {
            int? amenitySocietyId = null;
            if (property.WingDetailId.HasValue)
            {
                var wingInfo = await _context.Set<WingDetailsMastEntity>()
                    .Where(w => w.Id == property.WingDetailId.Value && w.IsActive && !w.MarkedForDeletion)
                    .Select(w => new { w.SocietyDetailsMastId })
                    .FirstOrDefaultAsync(cancellationToken);
                amenitySocietyId = wingInfo?.SocietyDetailsMastId;
            }

            if (!amenitySocietyId.HasValue)
            {
                amenitySocietyId = await _context.SocietyDetailsMast
                    .Where(s => s.PropertyId == propertyId && s.IsActive && !s.MarkedForDeletion)
                    .Select(s => (int?)s.Id)
                    .FirstOrDefaultAsync(cancellationToken);
            }

            if (!amenitySocietyId.HasValue && !string.IsNullOrWhiteSpace(property.PropertyNo))
            {
                var mainPropIds = await _context.PropertyMast
                    .Where(p => p.WardId == property.WardId && p.PropertyNo == property.PropertyNo && p.IsActive && !p.MarkedForDeletion)
                    .Select(p => p.Id)
                    .ToListAsync(cancellationToken);

                if (mainPropIds.Any())
                {
                    amenitySocietyId = await _context.SocietyDetailsMast
                        .Where(s => s.PropertyId.HasValue && mainPropIds.Contains(s.PropertyId.Value) && s.IsActive && !s.MarkedForDeletion)
                        .Select(s => (int?)s.Id)
                        .FirstOrDefaultAsync(cancellationToken);
                }
            }

            return ("S", propertyId, amenitySocietyId, property.WingDetailId, null);
        }

        if (property.CategoryId != ApartmentCategoryId)
        {
            return ("P", propertyId, null, property.WingDetailId, null);
        }

        int? unitSocietyId = null;
        if (property.WingDetailId.HasValue)
        {
            var wingInfo = await _context.Set<WingDetailsMastEntity>()
                .Where(w => w.Id == property.WingDetailId.Value && w.IsActive && !w.MarkedForDeletion)
                .Select(w => new { w.SocietyDetailsMastId })
                .FirstOrDefaultAsync(cancellationToken);
            unitSocietyId = wingInfo?.SocietyDetailsMastId;
        }

        if (!unitSocietyId.HasValue && !string.IsNullOrWhiteSpace(property.PropertyNo))
        {
            var mainPropIds = await _context.PropertyMast
                .Where(p => p.WardId == property.WardId && p.PropertyNo == property.PropertyNo && p.IsActive && !p.MarkedForDeletion)
                .Select(p => p.Id)
                .ToListAsync(cancellationToken);

            if (mainPropIds.Any())
            {
                unitSocietyId = await _context.SocietyDetailsMast
                    .Where(s => s.PropertyId.HasValue && mainPropIds.Contains(s.PropertyId.Value) && s.IsActive && !s.MarkedForDeletion)
                    .Select(s => (int?)s.Id)
                    .FirstOrDefaultAsync(cancellationToken);
            }
        }

        return ("P", propertyId, unitSocietyId, property.WingDetailId, property.Type);
    }

    /// <summary>
    /// Resolves the (EntityType, SocietyDetailId, WingDetailId, PropertyId) a PropertyPhoto row
    /// should carry for a given photo type's scope. Shared by the new-photo and
    /// replace-existing-photo paths so both apply the identical Society/Wing/Property scope save
    /// rules required by CK_PropertyPhoto_EntityScope: Society saves SocietyId only (WingId and
    /// PropertyId null); Wing saves WingId+SocietyId (PropertyId null); Property saves PropertyId
    /// (+WingId/SocietyId when the property belongs to an apartment, or neither when standalone).
    /// </summary>
    private static (string EntityType, int? TargetSocietyDetailId, int? TargetWingDetailId, int? TargetPropertyId) ResolveScopeTargets(
        string? photoScope, int? wingDetailId, int? societyDetailId, int? propertyId)
    {
        string entityType;
        int? targetSocietyDetailId;
        int? targetWingDetailId;
        int? targetPropertyId;

        if (string.Equals(photoScope, "WING", StringComparison.OrdinalIgnoreCase))
        {
            entityType = "W";
            targetWingDetailId = wingDetailId;
            targetSocietyDetailId = societyDetailId;
            targetPropertyId = null;
        }
        else if (string.Equals(photoScope, "SOCIETY", StringComparison.OrdinalIgnoreCase))
        {
            entityType = "S";
            targetSocietyDetailId = societyDetailId;
            targetWingDetailId = null;
            targetPropertyId = null;
        }
        else // PROPERTY scope
        {
            entityType = "P";
            targetWingDetailId = wingDetailId;
            targetSocietyDetailId = societyDetailId;
            targetPropertyId = propertyId;
        }

        return (entityType, targetSocietyDetailId, targetWingDetailId, targetPropertyId);
    }

    /// <summary>
    /// Soft-deletes the <c>PropertyPhoto</c> row referenced by <paramref name="binding"/>
    /// when its associated document is being deleted.
    /// If the photo has already been re-linked to a different (newer) binding — as happens
    /// during a replace-image flow — the photo is NOT deleted because it is still in use
    /// by the replacement document.
    /// </summary>
    public async Task OnBeforeDeleteAsync(
        DocumentBindingEntity binding,
        int deletedBy,
        CancellationToken cancellationToken)
    {
        if (!binding.ReferenceTableId.HasValue || binding.ReferenceTableId.Value <= 0)
            return;

        var photo = await _propertyPhotoService.GetByIdAsync(binding.ReferenceTableId.Value, cancellationToken);
        if (photo == null)
        {
            _logger.LogWarning(
                "PropertyPhotoDocumentBindingHandler.OnBeforeDeleteAsync: PropertyPhotoId={PhotoId} not found (already deleted?). Skipping.",
                binding.ReferenceTableId.Value);
            return;
        }

        // During a replace-image flow the PropertyPhoto row is re-linked to the new
        // DocumentBinding *before* the old document is deleted.  If the photo's current
        // DocumentBindingId no longer matches the binding being deleted, the photo is
        // still actively in use — skip the cascade deletion.
        if (photo.DocumentBindingId.HasValue && photo.DocumentBindingId.Value != binding.Id)
        {
            _logger.LogInformation(
                "PropertyPhotoDocumentBindingHandler.OnBeforeDeleteAsync: PropertyPhotoId={PhotoId} has been re-linked to BindingId={NewBindingId} (deleting old BindingId={OldBindingId}). Skipping photo deletion.",
                binding.ReferenceTableId.Value, photo.DocumentBindingId.Value, binding.Id);
            return;
        }

        _logger.LogDebug(
            "PropertyPhotoDocumentBindingHandler.OnBeforeDeleteAsync: deleting PropertyPhotoId={PhotoId}",
            binding.ReferenceTableId.Value);

        await _propertyPhotoService.DeleteAsync(binding.ReferenceTableId.Value, deletedBy, cancellationToken);
    }
}
