using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces.Property;
using NtisPlatform.Infrastructure.Data;

namespace NtisPlatform.Infrastructure.Repositories.Property;

/// <summary>Data-access implementation for the Property "Social Info" tab (queries only).</summary>
public class PropertySocialDetailsRepository : IPropertySocialDetailsRepository
{
    private readonly ApplicationDbContext _context;
    private readonly Microsoft.Extensions.Logging.ILogger<PropertySocialDetailsRepository>? _logger;

    public PropertySocialDetailsRepository(
        ApplicationDbContext context,
        Microsoft.Extensions.Logging.ILogger<PropertySocialDetailsRepository>? logger = null)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<SocialAttributeEntity>> GetActiveSocialAttributesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Set<SocialAttributeEntity>()
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.DisplayOrder ?? int.MaxValue)
            .ThenBy(x => x.SocialAttributeCode)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<PropertySocialDetailsEntity>> GetSocialDetailsByPropertyAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        var baseQuery = from psd in _context.Set<PropertySocialDetailsEntity>().AsNoTracking()
                        where psd.PropertyId == propertyId
                            && psd.IsActive
                            && !psd.MarkedForDeletion
                        join sa in _context.Set<SocialAttributeEntity>().AsNoTracking()
                            .Where(a => a.IsActive)
                            on psd.SocialAttributeId equals sa.Id into saJoin
                        from sa in saJoin.DefaultIfEmpty()
                        join db in _context.Set<DocumentBindingEntity>().AsNoTracking()
                            .Where(b => b.IsActive && !b.MarkedForDeletion)
                            on psd.DocumentBindingId equals db.Id into dbJoin
                        from db in dbJoin.DefaultIfEmpty()
                        join doc in _context.Set<DocumentEntity>().AsNoTracking()
                            .Where(d => d.IsActive && !d.MarkedForDeletion)
                            on db.DocumentId equals doc.Id into docJoin
                        from doc in docJoin.DefaultIfEmpty()
                        select new
                        {
                            Entity = psd,
                            SocialAttribute = sa,
                            DocumentBinding = db,
                            Document = doc
                        };

        var rows = await baseQuery.ToListAsync(cancellationToken);

        return rows.Select(r =>
        {
            var entity = r.Entity;
            entity.SocialAttribute = r.SocialAttribute;
            if (r.DocumentBinding != null && r.Document != null)
            {
                r.DocumentBinding.Document = r.Document;
                entity.DocumentBinding = r.DocumentBinding;
            }
            else
            {
                entity.DocumentBinding = null;
            }
            return entity;
        }).ToList();
    }

    public async Task<List<PropertySocialDetailsEntity>> GetActiveSocialDetailsWithAttributeByPropertyAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        return await GetSocialDetailsByPropertyAsync(propertyId, cancellationToken);
    }

    public async Task<List<PropertySocialDetailsEntity>> GetSocialDetailsByFiltersAsync(
        int? socialAttributeId,
        int? societyDetailId,
        int? wingDetailId,
        int? propertyId = null,
        CancellationToken cancellationToken = default)
    {
        var baseQuery = from psd in _context.Set<PropertySocialDetailsEntity>().AsNoTracking()
                        where psd.IsActive
                            && !psd.MarkedForDeletion
                            && psd.SocialAttribute != null
                            && psd.SocialAttribute.IsActive
                        join db in _context.Set<DocumentBindingEntity>().AsNoTracking()
                            .Where(b => b.IsActive && !b.MarkedForDeletion)
                            on psd.DocumentBindingId equals db.Id into dbJoin
                        from db in dbJoin.DefaultIfEmpty()
                        join doc in _context.Set<DocumentEntity>().AsNoTracking()
                            .Where(d => d.IsActive && !d.MarkedForDeletion)
                            on db.DocumentId equals doc.Id into docJoin
                        from doc in docJoin.DefaultIfEmpty()
                        select new
                        {
                            Entity = psd,
                            SocialAttribute = psd.SocialAttribute,
                            DocumentBinding = db,
                            Document = doc
                        };

        var query = baseQuery;

        if (socialAttributeId.HasValue && socialAttributeId.Value > 0)
        {
            query = query.Where(x => x.Entity.SocialAttributeId == socialAttributeId.Value);
        }

        if (propertyId.HasValue && propertyId.Value > 0)
        {
            query = query.Where(x => x.Entity.PropertyId == propertyId.Value);

            if (wingDetailId.HasValue && wingDetailId.Value > 0)
            {
                query = query.Where(x => x.Entity.WingDetailId == null || x.Entity.WingDetailId == 0 || x.Entity.WingDetailId == wingDetailId.Value);
            }

            if (societyDetailId.HasValue && societyDetailId.Value > 0)
            {
                query = query.Where(x => x.Entity.SocietyDetailId == null || x.Entity.SocietyDetailId == 0 || x.Entity.SocietyDetailId == societyDetailId.Value);
            }
        }
        else if (wingDetailId.HasValue && wingDetailId.Value > 0)
        {
            int reqWingId = wingDetailId.Value;

            // If societyDetailId was not provided, attempt to resolve it from the wing's master record
            int? resolvedSocId = societyDetailId.HasValue && societyDetailId.Value > 0
                ? societyDetailId.Value
                : await _context.Set<WingDetailsMastEntity>()
                    .AsNoTracking()
                    .Where(w => w.Id == reqWingId && w.IsActive && !w.MarkedForDeletion)
                    .Select(w => (int?)w.SocietyDetailsMastId)
                    .FirstOrDefaultAsync(cancellationToken);

            int? societyPropertyId = null;
            if (resolvedSocId.HasValue && resolvedSocId.Value > 0)
            {
                societyPropertyId = await _context.Set<SocietyDetailsEntity>()
                    .AsNoTracking()
                    .Where(s => s.Id == resolvedSocId.Value && s.IsActive && !s.MarkedForDeletion)
                    .Select(s => s.PropertyId)
                    .FirstOrDefaultAsync(cancellationToken);
            }

            bool hasSocProp = societyPropertyId.HasValue && societyPropertyId.Value > 0;
            int socPropId = hasSocProp ? societyPropertyId!.Value : 0;
            int socId = resolvedSocId ?? 0;

            var filteredQuery = query;
            var wingQuery = filteredQuery.Where(x =>
                x.Entity.WingDetailId == reqWingId
                && (!societyDetailId.HasValue || societyDetailId.Value <= 0
                    || x.Entity.SocietyDetailId == null
                    || x.Entity.SocietyDetailId == 0
                    || x.Entity.SocietyDetailId == societyDetailId.Value));

            query = wingQuery;

            if (!await wingQuery.AnyAsync(cancellationToken) && socId > 0)
            {
                query = filteredQuery.Where(x =>
                    (x.Entity.SocietyDetailId == socId || (hasSocProp && x.Entity.PropertyId == socPropId))
                    && (x.Entity.WingDetailId == null || x.Entity.WingDetailId == 0)
                    && (x.Entity.PropertyId == null || x.Entity.PropertyId == 0 || (hasSocProp && x.Entity.PropertyId == socPropId))
                    && (x.Entity.EntityType == "S" || string.IsNullOrEmpty(x.Entity.EntityType) || (x.Entity.EntityType != "P" && x.Entity.EntityType != "W")));
            }
        }
        else if (societyDetailId.HasValue && societyDetailId.Value > 0)
        {
            // Resolve society's associated PropertyId if SocietyDetailsMast exists
            int? societyPropertyId = await _context.Set<SocietyDetailsEntity>()
                .AsNoTracking()
                .Where(s => s.Id == societyDetailId.Value && s.IsActive && !s.MarkedForDeletion)
                .Select(s => s.PropertyId)
                .FirstOrDefaultAsync(cancellationToken);

            bool hasSocProp = societyPropertyId.HasValue && societyPropertyId.Value > 0;
            int socPropId = hasSocProp ? societyPropertyId!.Value : 0;
            int reqSocId = societyDetailId.Value;

            // Society level: matches either direct SocietyDetailId or the society's master PropertyId,
            // with no Wing assigned (WingDetailId is null or 0), treating both NULL and 0 as unassigned.
            query = query.Where(x =>
                (x.Entity.SocietyDetailId == reqSocId || (hasSocProp && x.Entity.PropertyId == socPropId))
                && (x.Entity.WingDetailId == null || x.Entity.WingDetailId == 0)
                && (x.Entity.EntityType == "S" || string.IsNullOrEmpty(x.Entity.EntityType) || (x.Entity.EntityType != "P" && x.Entity.EntityType != "W")));
        }

        var selectedRows = await query
            .OrderBy(x => x.Entity.Id)
            .ToListAsync(cancellationToken);

        return selectedRows.Select(row =>
        {
            var entity = row.Entity;
            entity.SocialAttribute = row.SocialAttribute;
            if (row.DocumentBinding != null)
            {
                row.DocumentBinding.Document = row.Document;
                entity.DocumentBinding = row.DocumentBinding;
            }
            return entity;
        }).ToList();
    }

    public async Task<(
        SocietyDetailsEntity? Society,
        PropertyEntity? SocietyProperty,
        List<WingDetailsMastEntity> Wings,
        List<PropertyEntity> Units,
        List<PropertySocialDetailsEntity> SocialDetails,
        List<SocialAttributeEntity> MasterAttributes
    )> GetDiscountAndSocialHierarchyDataAsync(
        int societyDetailId,
        int? propertyId = null,
        CancellationToken cancellationToken = default)
    {
        if (propertyId.HasValue && propertyId.Value <= 0)
        {
            throw new NtisPlatform.Application.Exceptions.PropertyValidationException(
                "propertyId must be greater than zero when provided.");
        }

        // 1. Load active, non-deleted society entity
        var society = await _context.Set<SocietyDetailsEntity>()
            .AsNoTracking()
            .Include(s => s.PropertyMast)
            .FirstOrDefaultAsync(s => s.Id == societyDetailId && s.IsActive && !s.MarkedForDeletion, cancellationToken);

        if (society == null)
        {
            return (null, null, new List<WingDetailsMastEntity>(), new List<PropertyEntity>(), new List<PropertySocialDetailsEntity>(), await GetActiveSocialAttributesAsync(cancellationToken));
        }

        PropertyEntity? societyProperty = society.PropertyMast;
        if (societyProperty != null && (!societyProperty.IsActive || societyProperty.MarkedForDeletion))
        {
            societyProperty = null;
        }
        if (societyProperty == null && society.PropertyId != null && society.PropertyId.Value > 0)
        {
            societyProperty = await _context.Set<PropertyEntity>()
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == society.PropertyId.Value && p.IsActive && !p.MarkedForDeletion, cancellationToken);
        }

        // 2. Load all active wings for this society
        var wings = await _context.Set<WingDetailsMastEntity>()
            .AsNoTracking()
            .Where(w => w.SocietyDetailsMastId == societyDetailId && w.IsActive && !w.MarkedForDeletion)
            .OrderBy(w => w.WingName)
            .ToListAsync(cancellationToken);

        var wingIds = wings.Select(w => w.Id).ToList();

        // 3. Load all child units belonging strictly to these wings (explicitly excluding the society's main property)
        var units = wingIds.Count > 0
            ? await _context.Set<PropertyEntity>()
                .AsNoTracking()
                .Where(p => p.IsActive && !p.MarkedForDeletion
                    && p.WingDetailId != null
                    && wingIds.Contains(p.WingDetailId.Value)
                    && (society.PropertyId == null || p.Id != society.PropertyId.Value))
                .OrderBy(p => p.PartitionNo)
                .ToListAsync(cancellationToken)
            : new List<PropertyEntity>();

        // 4. Validate that if a propertyId was passed, it belongs to the society hierarchy
        if (propertyId.HasValue && propertyId.Value > 0)
        {
            var isPropertyInHierarchy = units.Any(u => u.Id == propertyId.Value) ||
                                       (society.PropertyId.HasValue && society.PropertyId.Value == propertyId.Value);

            if (!isPropertyInHierarchy)
            {
                throw new NtisPlatform.Application.Exceptions.PropertyValidationException(
                    $"Property with ID {propertyId.Value} does not belong to Society with ID {societyDetailId}.");
            }
        }

        var childUnitPropertyIds = units.Select(p => p.Id).ToHashSet();
        int? socPropId = society.PropertyId;

        // 5. Load all applied PropertySocialDetails records for this society, wings, and units with active document joins
        var baseQuery = from psd in _context.Set<PropertySocialDetailsEntity>().AsNoTracking()
                        where psd.IsActive
                            && !psd.MarkedForDeletion
                            && psd.SocialAttribute != null
                            && psd.SocialAttribute.IsActive
                        join db in _context.Set<DocumentBindingEntity>().AsNoTracking()
                            .Where(b => b.IsActive && !b.MarkedForDeletion)
                            on psd.DocumentBindingId equals db.Id into dbJoin
                        from db in dbJoin.DefaultIfEmpty()
                        join doc in _context.Set<DocumentEntity>().AsNoTracking()
                            .Where(d => d.IsActive && !d.MarkedForDeletion)
                            on db.DocumentId equals doc.Id into docJoin
                        from doc in docJoin.DefaultIfEmpty()
                        select new
                        {
                            Entity = psd,
                            SocialAttribute = psd.SocialAttribute,
                            DocumentBinding = db,
                            Document = doc
                        };

        // Mutually exclusive hierarchy predicates:
        // Apartment: references society or main society property; no wing; no child property.
        // Wing: references one of the society's wings; no child property; SocietyDetailId is null, 0, or matches societyDetailId.
        // Unit: references one of the society's child properties; WingDetailId is null, 0, or in wingIds; SocietyDetailId is null, 0, or matches.
        var filteredQuery = baseQuery.Where(x =>
            // Apartment level
            (((x.Entity.SocietyDetailId != null && x.Entity.SocietyDetailId == societyDetailId) || (socPropId != null && x.Entity.PropertyId != null && x.Entity.PropertyId == socPropId.Value))
             && (x.Entity.WingDetailId == null || x.Entity.WingDetailId == 0)
             && (x.Entity.PropertyId == null || x.Entity.PropertyId == 0 || (socPropId != null && x.Entity.PropertyId == socPropId.Value))
             && (x.Entity.SocietyDetailId == null || x.Entity.SocietyDetailId == 0 || x.Entity.SocietyDetailId == societyDetailId))
            ||
            // Wing level
            (x.Entity.WingDetailId != null && wingIds.Contains(x.Entity.WingDetailId.Value)
             && (x.Entity.PropertyId == null || x.Entity.PropertyId == 0)
             && (x.Entity.SocietyDetailId == null || x.Entity.SocietyDetailId == 0 || x.Entity.SocietyDetailId == societyDetailId))
            ||
            // Unit level
            (x.Entity.PropertyId != null && childUnitPropertyIds.Contains(x.Entity.PropertyId.Value)
             && (x.Entity.WingDetailId == null || x.Entity.WingDetailId == 0 || wingIds.Contains(x.Entity.WingDetailId.Value))
             && (x.Entity.SocietyDetailId == null || x.Entity.SocietyDetailId == 0 || x.Entity.SocietyDetailId == societyDetailId))
        );

        var rawRows = await filteredQuery
            .OrderBy(x => x.Entity.Id)
            .ToListAsync(cancellationToken);

        var unitMap = units.ToDictionary(u => u.Id, u => u);
        var wingIdSet = wingIds.ToHashSet();

        var socialDetails = new List<PropertySocialDetailsEntity>();
        foreach (var r in rawRows)
        {
            var entity = r.Entity;
            entity.SocialAttribute = r.SocialAttribute;
            if (r.DocumentBinding != null && r.Document != null)
            {
                r.DocumentBinding.Document = r.Document;
                entity.DocumentBinding = r.DocumentBinding;
            }
            else
            {
                entity.DocumentBinding = null;
            }

            // Reject/skip and log inconsistent rows:
            if (entity.PropertyId.HasValue && entity.PropertyId.Value > 0 && entity.PropertyId.Value != socPropId)
            {
                if (!unitMap.TryGetValue(entity.PropertyId.Value, out var unit))
                {
                    _logger?.LogWarning("Skipping inconsistent row Id {Id}: PropertyId {PropertyId} does not exist in society {SocietyId} child units.",
                        entity.Id, entity.PropertyId.Value, societyDetailId);
                    continue;
                }

                if (entity.WingDetailId.HasValue && entity.WingDetailId.Value > 0 && unit.WingDetailId.HasValue && unit.WingDetailId.Value != entity.WingDetailId.Value)
                {
                    _logger?.LogWarning("Skipping inconsistent row Id {Id}: Row WingDetailId {RowWingId} does not match Unit's WingDetailId {UnitWingId}.",
                        entity.Id, entity.WingDetailId.Value, unit.WingDetailId.Value);
                    continue;
                }
            }
            else if (entity.WingDetailId.HasValue && entity.WingDetailId.Value > 0 && !wingIdSet.Contains(entity.WingDetailId.Value))
            {
                _logger?.LogWarning("Skipping inconsistent row Id {Id}: WingDetailId {WingId} does not belong to society {SocietyId}.",
                    entity.Id, entity.WingDetailId.Value, societyDetailId);
                continue;
            }

            socialDetails.Add(entity);
        }

        // 6. Load master attributes
        var masterAttributes = await GetActiveSocialAttributesAsync(cancellationToken);

        return (society, societyProperty, wings, units, socialDetails, masterAttributes);
    }

    public async Task<(
        PropertyEntity? Property,
        WingDetailsMastEntity? Wing,
        List<PropertySocialDetailsEntity> SocialDetails,
        List<SocialAttributeEntity> MasterAttributes
    )> GetIndividualPropertyDiscountAndSocialDataAsync(
        int propertyId,
        CancellationToken cancellationToken = default)
    {
        // 1. Load active, non-deleted property
        var property = await _context.Set<PropertyEntity>()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == propertyId && p.IsActive && !p.MarkedForDeletion, cancellationToken);

        if (property == null)
        {
            return (null, null, new List<PropertySocialDetailsEntity>(), await GetActiveSocialAttributesAsync(cancellationToken));
        }

        // Validate that this property is NOT the main property of an Apartment/Society
        var isSocietyMainProperty = await _context.Set<SocietyDetailsEntity>()
            .AsNoTracking()
            .AnyAsync(s => s.PropertyId == propertyId && s.IsActive && !s.MarkedForDeletion, cancellationToken);

        if (isSocietyMainProperty)
        {
            throw new NtisPlatform.Application.Exceptions.PropertyValidationException(
                $"Property with ID {propertyId} is an Apartment/Society main property. Use the Apartment/Society Discount and Social grid endpoint.");
        }

        // 2. Load active, non-deleted wing if attached
        WingDetailsMastEntity? wing = null;
        if (property.WingDetailId != null && property.WingDetailId.Value > 0)
        {
            wing = await _context.Set<WingDetailsMastEntity>()
                .AsNoTracking()
                .FirstOrDefaultAsync(w => w.Id == property.WingDetailId.Value && w.IsActive && !w.MarkedForDeletion, cancellationToken);
        }

        // 3. Load applied PropertySocialDetails for this property with active document joins
        var baseQuery = from psd in _context.Set<PropertySocialDetailsEntity>().AsNoTracking()
                        where psd.PropertyId == propertyId
                            && psd.IsActive
                            && !psd.MarkedForDeletion
                            && psd.SocialAttribute != null
                            && psd.SocialAttribute.IsActive
                        join db in _context.Set<DocumentBindingEntity>().AsNoTracking()
                            .Where(b => b.IsActive && !b.MarkedForDeletion)
                            on psd.DocumentBindingId equals db.Id into dbJoin
                        from db in dbJoin.DefaultIfEmpty()
                        join doc in _context.Set<DocumentEntity>().AsNoTracking()
                            .Where(d => d.IsActive && !d.MarkedForDeletion)
                            on db.DocumentId equals doc.Id into docJoin
                        from doc in docJoin.DefaultIfEmpty()
                        select new
                        {
                            Entity = psd,
                            SocialAttribute = psd.SocialAttribute,
                            DocumentBinding = db,
                            Document = doc
                        };

        var rawRows = await baseQuery
            .OrderBy(x => x.Entity.Id)
            .ToListAsync(cancellationToken);

        var socialDetails = rawRows.Select(r =>
        {
            var entity = r.Entity;
            entity.SocialAttribute = r.SocialAttribute;
            if (r.DocumentBinding != null && r.Document != null)
            {
                r.DocumentBinding.Document = r.Document;
                entity.DocumentBinding = r.DocumentBinding;
            }
            else
            {
                entity.DocumentBinding = null;
            }
            return entity;
        }).ToList();

        // 4. Load master attributes
        var masterAttributes = await GetActiveSocialAttributesAsync(cancellationToken);

        return (property, wing, socialDetails, masterAttributes);
    }
}
