using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.Constants;
using NtisPlatform.Application.DTOs.PropertyMedia;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Interfaces.PropertyMedia;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Enums;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.PropertyMedia;

/// <inheritdoc cref="IPropertyMediaDashboardService"/>
public class PropertyMediaDashboardService : IPropertyMediaDashboardService
{

    private readonly IRepository<PropertyEntity, int> _propertyRepository;
    private readonly IRepository<PropertyPhotoEntity, int> _propertyPhotoRepository;
    private readonly IRepository<PropertyPhotoTypeEntity, int> _propertyPhotoTypeRepository;
    private readonly IRepository<WardEntity, int> _wardRepository;
    private readonly IRepository<PropertyTypeMasterEntity, int> _propertyTypeRepository;
    private readonly IRepository<ZoneEntity, int> _zoneRepository;
    private readonly IRepository<PropertyMediaJobEntity, int> _mediaJobRepository;
    private readonly IRepository<PropertyWorkflowDetailsEntity, int> _workflowDetailsRepository;
    private readonly IRepository<UserEntity, int> _userRepository;
    private readonly IPropertyMediaDownloadService _downloadService;
    private readonly IRepository<PropertySocialDetailsEntity, int>? _propertySocialDetailsRepository;
    private readonly IRepository<SocialAttributeEntity, int>? _socialAttributeRepository;
    private readonly IRepository<WaterConnectionMasterEntity, int>? _waterConnectionRepository;

    public PropertyMediaDashboardService(
        IRepository<PropertyEntity, int> propertyRepository,
        IRepository<PropertyPhotoEntity, int> propertyPhotoRepository,
        IRepository<PropertyPhotoTypeEntity, int> propertyPhotoTypeRepository,
        IRepository<WardEntity, int> wardRepository,
        IRepository<PropertyTypeMasterEntity, int> propertyTypeRepository,
        IRepository<ZoneEntity, int> zoneRepository,
        IRepository<PropertyMediaJobEntity, int> mediaJobRepository,
        IRepository<PropertyWorkflowDetailsEntity, int> workflowDetailsRepository,
        IRepository<UserEntity, int> userRepository,
        IPropertyMediaDownloadService downloadService,
        IRepository<PropertySocialDetailsEntity, int>? propertySocialDetailsRepository = null,
        IRepository<SocialAttributeEntity, int>? socialAttributeRepository = null,
        IRepository<WaterConnectionMasterEntity, int>? waterConnectionRepository = null)
    {
        _propertyRepository = propertyRepository;
        _propertyPhotoRepository = propertyPhotoRepository;
        _propertyPhotoTypeRepository = propertyPhotoTypeRepository;
        _wardRepository = wardRepository;
        _propertyTypeRepository = propertyTypeRepository;
        _zoneRepository = zoneRepository;
        _mediaJobRepository = mediaJobRepository;
        _workflowDetailsRepository = workflowDetailsRepository;
        _userRepository = userRepository;
        _downloadService = downloadService;
        _propertySocialDetailsRepository = propertySocialDetailsRepository;
        _socialAttributeRepository = socialAttributeRepository;
        _waterConnectionRepository = waterConnectionRepository;
    }

    public async Task<PropertyMediaDashboardStatsDto> GetDashboardStatsAsync(CancellationToken cancellationToken = default)
    {
        var totalProperties = await GetPropertyCountBreakdownAsync(
            _propertyRepository.GetQueryable().AsNoTracking().Where(p => p.IsActive && !p.MarkedForDeletion),
            cancellationToken);

        var buildingPlanTypeIds = await GetPlanPhotoTypeIdsAsync(cancellationToken);
        var buildingPhotoTypeIds = (await GetPhotoTypeIdsByScopeAsync(PropertyMediaConstants.ScopeProperty, cancellationToken))
            .Except(buildingPlanTypeIds)
            .ToList();
        var buildingPhotoAvailable = await GetPhotoAvailabilityAsync(buildingPhotoTypeIds, cancellationToken);
        var buildingPlanAvailable = await GetPhotoAvailabilityAsync(buildingPlanTypeIds, cancellationToken);

        var buildingPhotoMissing = new GapCountDto
        {
            Applicable = totalProperties.Total,
            Available = buildingPhotoAvailable.Total,
            Missing = totalProperties.Total - buildingPhotoAvailable.Total
        };

        var buildingPlanMissing = new GapCountDto
        {
            Applicable = totalProperties.Total,
            Available = buildingPlanAvailable.Total,
            Missing = totalProperties.Total - buildingPlanAvailable.Total
        };

        return new PropertyMediaDashboardStatsDto
        {
            TotalProperties = totalProperties,
            BuildingPhotoAvailable = buildingPhotoAvailable,
            BuildingPlanAvailable = buildingPlanAvailable,
            BuildingPhotoMissing = buildingPhotoMissing,
            BuildingPlanMissing = buildingPlanMissing
        };
    }

    private static async Task<PropertyCountBreakdownDto> GetPropertyCountBreakdownAsync(
       IQueryable<PropertyEntity> properties,
       CancellationToken cancellationToken)
    {
        var total = await properties.CountAsync(cancellationToken);
        var structures = await properties.CountAsync(p => string.IsNullOrWhiteSpace(p.PartitionNo) 
            || p.PartitionNo == PropertyMediaConstants.PartitionDash 
            || p.PartitionNo == PropertyMediaConstants.PartitionZero, cancellationToken);
        var units = await properties.CountAsync(p => !string.IsNullOrWhiteSpace(p.PartitionNo) 
            && p.PartitionNo != PropertyMediaConstants.PartitionDash 
            && p.PartitionNo != PropertyMediaConstants.PartitionZero, cancellationToken);

        return new PropertyCountBreakdownDto
        {
            Total = total,
            Structures = structures,
            Units = units
        };
    }

    /// <summary>
    /// Active PropertyPhotoType ids whose PhotoScope matches (e.g. "PROPERTY") - resolved from
    /// PTIS.PropertyPhotoType at call time rather than hardcoded, so this works against whichever
    /// database's actual photo-type catalogue is configured, not just one fixed reference dataset.
    /// </summary>
    private async Task<List<int>> GetPhotoTypeIdsByScopeAsync(string scope, CancellationToken cancellationToken)
    {
        return await _propertyPhotoTypeRepository.GetQueryable()
            .AsNoTracking()
            .Where(pt => pt.IsActive && pt.PhotoScope == scope)
            .Select(pt => pt.Id)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Active PropertyPhotoType ids that represent a "plan" (PhotoTypeCode or PhotoTypeName
    /// contains "PLAN"), resolved dynamically since not every deployment's photo-type catalogue
    /// has a dedicated plan type - returns an empty list rather than a hardcoded, possibly
    /// nonexistent, id in that case.
    /// </summary>
    private async Task<List<int>> GetPlanPhotoTypeIdsAsync(CancellationToken cancellationToken)
    {
        return await _propertyPhotoTypeRepository.GetQueryable()
            .AsNoTracking()
            .Where(pt => pt.IsActive
                && (pt.PhotoTypeCode.ToUpper().Contains("PLAN") || pt.PhotoTypeName.ToUpper().Contains("PLAN")))
            .Select(pt => pt.Id)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Total: COUNT(pp.PropertyId) from PTIS.PropertyPhoto pp WHERE pp.PhotoTypeId IN
    /// (<paramref name="photoTypeIds"/>) AND pp.IsActive = 1 AND pp.MarkedForDeletion = 0 -
    /// a row-level count of matching PropertyPhoto records (NOT de-duplicated by PropertyId;
    /// a property with more than one qualifying photo is counted once per photo row).
    /// Structures/Units: the same matching PropertyPhoto rows INNER JOINed to PTIS.PropertyMast
    /// on PropertyId = Id, filtered by PropertyMast.IsActive = 1 AND MarkedForDeletion = 0, then
    /// counted by PropertyNo/PartitionNo not-null-not-whitespace - i.e. the same row basis as
    /// Total, not a distinct-property basis. Returns all zeros if <paramref name="photoTypeIds"/>
    /// is empty (e.g. no "plan" type exists in this deployment's photo-type catalogue).
    /// </summary>
    private async Task<PropertyCountBreakdownDto> GetPhotoAvailabilityAsync(IReadOnlyCollection<int> photoTypeIds, CancellationToken cancellationToken)
    {
        if (photoTypeIds.Count == 0)
            return new PropertyCountBreakdownDto();

        var propertyIdsWithPhoto = _propertyPhotoRepository.GetQueryable()
            .AsNoTracking()
            .Where(p => p.IsActive && !p.MarkedForDeletion && p.PropertyId.HasValue && photoTypeIds.Contains(p.PhotoTypeId))
            .Select(p => p.PropertyId!.Value)
            .Distinct();

        var propertiesWithPhoto = _propertyRepository.GetQueryable()
            .AsNoTracking()
            .Where(p => p.IsActive && !p.MarkedForDeletion && propertyIdsWithPhoto.Contains(p.Id));

        return await GetPropertyCountBreakdownAsync(propertiesWithPhoto, cancellationToken);
    }

    /// <summary>
    /// One row per active <c>PropertyPhotoType</c>. Applicable = total active, non-deleted
    /// properties. Available = distinct active, non-deleted properties that have at least one
    /// active, non-deleted PropertyPhoto row of that PhotoType. Missing = Applicable - Available.
    /// CoveragePercentage = Available / Applicable * 100 (0 when Applicable is 0), rounded to 1 dp.
    /// Category is Plan/Document/Photo (see the derivation below - matches the Category -> Subtype
    /// dropdown in GetPropertySubTypesAsync). <paramref name="queryParameters"/>.Category is an
    /// optional exact-match filter on that computed category (e.g. wired to the Gap Analysis stat
    /// tiles); its single free-text SearchTerm separately matches either the Category label or the
    /// PhotoTypeName. Both filters apply together (AND) when both are supplied.
    /// </summary>
    public async Task<List<PropertyMediaCoverageRowDto>> GetDetailedCoverageAsync(
        PropertyMediaCoverageQueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var activeProperties = _propertyRepository.GetQueryable()
            .AsNoTracking()
            .Where(p => p.IsActive && !p.MarkedForDeletion);

        var totalActiveCount = await activeProperties.CountAsync(cancellationToken);
        var wingPropertiesCount = await activeProperties
            .CountAsync(p => p.WingDetailId.HasValue, cancellationToken);
        var societyPropertiesCount = await activeProperties
            .CountAsync(p => p.CategoryId == PropertyMediaConstants.SocietyCategoryId
                && (p.PartitionNo == null 
                    || p.PartitionNo == PropertyMediaConstants.PartitionEmpty 
                    || p.PartitionNo == PropertyMediaConstants.PartitionZero 
                    || p.PartitionNo == PropertyMediaConstants.PartitionDash), cancellationToken);
        var amenityTypeIds = await _propertyTypeRepository.GetQueryable().AsNoTracking()
            .Where(pt => pt.PartType == PropertyMediaConstants.AmenityPartType 
                || pt.PropertyDescription.Contains(PropertyMediaConstants.AmenityPartType) 
                || pt.PropertyDescription.Contains(PropertyMediaConstants.AmenityMarathi) 
                || pt.PropertyDescription.Contains(PropertyMediaConstants.AmenityMarathiAlternate))
            .Select(pt => pt.Id)
            .ToListAsync(cancellationToken);
        var amenityTypeIdSet = new HashSet<int>(amenityTypeIds);

        var amenityPropertiesCount = await (
            from p in activeProperties
            join pt in _propertyTypeRepository.GetQueryable().AsNoTracking() on p.PropertyTypeId equals pt.Id
            where pt.PartType == PropertyMediaConstants.AmenityPartType 
                || pt.PropertyDescription.Contains(PropertyMediaConstants.AmenityPartType) 
                || pt.PropertyDescription.Contains(PropertyMediaConstants.AmenityMarathi) 
                || pt.PropertyDescription.Contains(PropertyMediaConstants.AmenityMarathiAlternate)
            select p.Id
        ).Distinct().CountAsync(cancellationToken);

        var socialCountsByType = new Dictionary<int, int>();
        var socialCountsByCode = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        if (_propertySocialDetailsRepository != null && _socialAttributeRepository != null)
        {
            var distinctPropsByPhotoType = await (
                from psd in _propertySocialDetailsRepository.GetQueryable().AsNoTracking()
                where psd.IsActive && !psd.MarkedForDeletion && psd.BitValue == true && psd.PropertyId.HasValue
                join p in activeProperties on psd.PropertyId!.Value equals p.Id
                join sa in _socialAttributeRepository.GetQueryable().AsNoTracking() on psd.SocialAttributeId equals sa.Id
                where sa.IsActive && sa.PhotoTypeId != null
                select new { PhotoTypeId = sa.PhotoTypeId!.Value, PropertyId = psd.PropertyId!.Value }
            )
            .Distinct()
            .GroupBy(x => x.PhotoTypeId)
            .Select(g => new { PhotoTypeId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

            foreach (var item in distinctPropsByPhotoType)
            {
                socialCountsByType[item.PhotoTypeId] = item.Count;
            }

            var distinctPropsByCode = await (
                from psd in _propertySocialDetailsRepository.GetQueryable().AsNoTracking()
                where psd.IsActive && !psd.MarkedForDeletion && psd.BitValue == true && psd.PropertyId.HasValue
                join p in activeProperties on psd.PropertyId!.Value equals p.Id
                join sa in _socialAttributeRepository.GetQueryable().AsNoTracking() on psd.SocialAttributeId equals sa.Id
                where sa.IsActive && sa.SocialAttributeCode != null && sa.SocialAttributeCode != ""
                select new { sa.SocialAttributeCode, PropertyId = psd.PropertyId!.Value }
            )
            .Distinct()
            .GroupBy(x => x.SocialAttributeCode)
            .Select(g => new { Code = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

            foreach (var item in distinctPropsByCode)
            {
                socialCountsByCode[item.Code] = item.Count;
            }
        }

        var waterConnectionsCount = 0;
        if (_waterConnectionRepository != null)
        {
            waterConnectionsCount = await _waterConnectionRepository.GetQueryable().AsNoTracking()
                .Where(w => w.IsActive)
                .Join(activeProperties, w => w.PropertyId, p => p.Id, (w, _) => w.PropertyId)
                .Distinct()
                .CountAsync(cancellationToken);
        }

        var activePhotosWithProps = await (
            from photo in _propertyPhotoRepository.GetQueryable().AsNoTracking()
            where photo.IsActive && !photo.MarkedForDeletion && photo.PropertyId.HasValue
            join p in activeProperties on photo.PropertyId!.Value equals p.Id
            select new
            {
                photo.PhotoTypeId,
                PropertyId = p.Id,
                p.WingDetailId,
                p.CategoryId,
                p.PartitionNo,
                p.PropertyTypeId
            }
        ).Distinct().ToListAsync(cancellationToken);

        var activePhotoItems = activePhotosWithProps.Select(x => new PropertyPhotoCoverageItem
        {
            PhotoTypeId = x.PhotoTypeId,
            PropertyId = x.PropertyId,
            WingDetailId = x.WingDetailId,
            CategoryId = x.CategoryId,
            PartitionNo = x.PartitionNo,
            PropertyTypeId = x.PropertyTypeId
        }).ToList();

        var photoPropIds = activePhotoItems.Select(p => p.PropertyId).Distinct().ToList();

        var eligibleSocialPhotoProps = new HashSet<(int PhotoTypeId, int PropertyId)>();
        var eligibleSocialCodeProps = new HashSet<(string Code, int PropertyId)>();

        if (_propertySocialDetailsRepository != null && _socialAttributeRepository != null && photoPropIds.Count > 0)
        {
            var socialPhotoRows = await (
                from psd in _propertySocialDetailsRepository.GetQueryable().AsNoTracking()
                where psd.IsActive && !psd.MarkedForDeletion && psd.BitValue == true && psd.PropertyId.HasValue
                where photoPropIds.Contains(psd.PropertyId!.Value)
                join sa in _socialAttributeRepository.GetQueryable().AsNoTracking() on psd.SocialAttributeId equals sa.Id
                where sa.IsActive
                select new { sa.PhotoTypeId, sa.SocialAttributeCode, PropertyId = psd.PropertyId!.Value }
            ).Distinct().ToListAsync(cancellationToken);

            foreach (var r in socialPhotoRows)
            {
                if (r.PhotoTypeId.HasValue)
                {
                    eligibleSocialPhotoProps.Add((r.PhotoTypeId.Value, r.PropertyId));
                }
                if (!string.IsNullOrEmpty(r.SocialAttributeCode))
                {
                    eligibleSocialCodeProps.Add((r.SocialAttributeCode.ToUpperInvariant(), r.PropertyId));
                }
            }
        }

        var waterPropertyIds = new HashSet<int>();
        if (_waterConnectionRepository != null && photoPropIds.Count > 0)
        {
            var matched = await _waterConnectionRepository.GetQueryable().AsNoTracking()
                .Where(w => w.IsActive && photoPropIds.Contains(w.PropertyId))
                .Select(w => w.PropertyId)
                .Distinct()
                .ToListAsync(cancellationToken);

            waterPropertyIds = new HashSet<int>(matched);
        }

        var photoTypes = await _propertyPhotoTypeRepository.GetQueryable()
            .AsNoTracking()
            .Where(pt => pt.IsActive)
            .OrderBy(pt => pt.DisplayOrder)
            .ThenBy(pt => pt.Id)
            .Select(pt => new { pt.Id, pt.PhotoTypeCode, pt.PhotoTypeName, pt.PhotoScope })
            .ToListAsync(cancellationToken);

        // Single free-text search box - matched in-memory below against the computed Category
        // label and PhotoTypeName (Category isn't a real column, so it can't go through
        // [Filterable]/[Searchable]/FilterExpressionBuilder).
        var searchTerm = string.IsNullOrWhiteSpace(queryParameters.SearchTerm) ? null : queryParameters.SearchTerm.Trim();

        var rows = new List<PropertyMediaCoverageRowDto>(photoTypes.Count);
        foreach (var pt in photoTypes)
        {
            // Category has no direct PropertyPhotoType column - derived the same way as the
            // Category -> Subtype dropdown (GetPropertySubTypesAsync in
            // PropertyMediaUploadService): Plan -> PhotoTypeCode contains "PLAN" (e.g.
            // PROPERTY_PLAN) - PhotoScope alone can't make this split since PROPERTY_PLAN shares
            // the "PROPERTY" scope with the other Property photo types. Document ->
            // PhotoScope == "DOCUMENT" (none exist yet). Everything else (Property, Society,
            // Wing, Amenity today) -> Photo.
            var categoryEnum = pt.PhotoTypeCode.ToUpper().Contains("PLAN")
                ? PropertyMediaCategory.Plan
                : pt.PhotoScope == "DOCUMENT"
                    ? PropertyMediaCategory.Document
                    : PropertyMediaCategory.Photo;

            // Exact-match Category filter (e.g. a Gap Analysis stat tile click passing
            // Category=Photo/Plan) - applied before, and independently of, the free-text search
            // below so the two combine with AND.
            if (queryParameters.Category.HasValue && queryParameters.Category.Value != categoryEnum)
            {
                continue;
            }

            var category = categoryEnum.ToString();

            if (searchTerm != null
                && category.IndexOf(searchTerm, StringComparison.OrdinalIgnoreCase) < 0
                && pt.PhotoTypeName.IndexOf(searchTerm, StringComparison.OrdinalIgnoreCase) < 0)
            {
                continue;
            }

            var applicable = ResolveApplicableCount(
                pt.Id,
                pt.PhotoTypeCode,
                pt.PhotoScope,
                pt.PhotoTypeName,
                totalActiveCount,
                wingPropertiesCount,
                societyPropertiesCount,
                amenityPropertiesCount,
                socialCountsByType,
                socialCountsByCode,
                waterConnectionsCount);

            var available = ResolveAvailableCount(
                pt.Id,
                pt.PhotoTypeCode,
                pt.PhotoScope,
                pt.PhotoTypeName,
                activePhotoItems,
                socialCountsByType,
                socialCountsByCode,
                eligibleSocialPhotoProps,
                eligibleSocialCodeProps,
                waterPropertyIds,
                amenityTypeIdSet);
            var missing = Math.Max(0, applicable - available);
            var coverage = applicable == 0
                ? 0m
                : Math.Min(100m, Math.Round((decimal)available * 100 / applicable, 2));
            var coverageDisplay = coverage.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture) + "%";

            rows.Add(new PropertyMediaCoverageRowDto
            {
                Category = category,
                PhotoTypeId = pt.Id,
                PhotoTypeCode = pt.PhotoTypeCode,
                PhotoTypeName = pt.PhotoTypeName,
                Requirement = PropertyMediaConstants.MandatoryPhotoTypeNames.Contains(pt.PhotoTypeName) ? "Mandatory" : "Conditional",
                Applicable = applicable,
                Available = available,
                Missing = missing,
                CoveragePercentage = coverageDisplay
            });
        }

        return rows;
    }

    /// <summary>
    /// Missing-properties drill-down: active, non-deleted properties that have NO active,
    /// non-deleted PropertyPhoto row of <paramref name="photoTypeId"/> - or, when
    /// <paramref name="photoTypeId"/> is omitted, of ANY active PropertyPhotoType (one row per
    /// missing (property, photo type) combination). Paged. Optional exact-match filters:
    /// ZoneId/WardId/PropertyTypeId/WorkflowStageId (WorkflowStageId matches the property's
    /// CURRENT PropertyWorkflowDetails row, i.e. CurrentStatus = 1). Plus an optional free-text
    /// SearchTerm matching PropertyNo, OwnerName, ZoneNo, WardNo or PropertyType. All combine
    /// with AND.
    /// </summary>
    public async Task<PropertyMediaGapListDto> GetMissingPropertiesByPhotoTypeAsync(
        int? photoTypeId,
        PropertyMediaGapQueryParameters queryParameters,
        CancellationToken cancellationToken = default)
    {
        var page = queryParameters.PageNumber;
        // BaseQueryParameters.PageSize's setter already clamps everything to [10, 100] except for
        // the -1 "unlimited" sentinel (used by ExportMissingPropertiesToExcelAsync to fetch every
        // matching row) - no further clamping needed here, just handle -1 specially below.
        var pageSize = queryParameters.PageSize;

        var activePhotoTypesQuery = _propertyPhotoTypeRepository.GetQueryable()
            .AsNoTracking()
            .Where(pt => pt.IsActive);

        var activeProperties = _propertyRepository.GetQueryable()
            .AsNoTracking()
            .Where(p => p.IsActive && !p.MarkedForDeletion);

        string photoTypeNameHeader;
        if (photoTypeId.HasValue)
        {
            var photoType = await activePhotoTypesQuery
                .Where(pt => pt.Id == photoTypeId.Value)
                .Select(pt => new { pt.Id, pt.PhotoTypeName, pt.PhotoScope, pt.PhotoTypeCode })
                .FirstOrDefaultAsync(cancellationToken);

            if (photoType is null)
            {
                return new PropertyMediaGapListDto
                {
                    PhotoTypeId = photoTypeId.Value,
                    PhotoTypeName = string.Empty,
                    GapRecords = 0,
                    Items = new List<PropertyMediaGapRowDto>()
                };
            }

            activePhotoTypesQuery = activePhotoTypesQuery.Where(pt => pt.Id == photoTypeId.Value);
            photoTypeNameHeader = photoType.PhotoTypeName;

            if (string.Equals(photoType.PhotoScope, PropertyMediaConstants.ScopeWing, StringComparison.OrdinalIgnoreCase))
            {
                activeProperties = activeProperties.Where(p => p.WingDetailId.HasValue);
            }
            else if (string.Equals(photoType.PhotoScope, PropertyMediaConstants.ScopeSociety, StringComparison.OrdinalIgnoreCase))
            {
                activeProperties = activeProperties.Where(p => p.CategoryId == PropertyMediaConstants.SocietyCategoryId 
                    && (p.PartitionNo == null 
                        || p.PartitionNo == PropertyMediaConstants.PartitionEmpty 
                        || p.PartitionNo == PropertyMediaConstants.PartitionZero 
                        || p.PartitionNo == PropertyMediaConstants.PartitionDash));
            }
            else if (string.Equals(photoType.PhotoScope, PropertyMediaConstants.ScopeAmenity, StringComparison.OrdinalIgnoreCase))
            {
                var amenityTypeIds = _propertyTypeRepository.GetQueryable().AsNoTracking()
                    .Where(pt => pt.PartType == PropertyMediaConstants.AmenityPartType 
                        || pt.PropertyDescription.Contains(PropertyMediaConstants.AmenityPartType) 
                        || pt.PropertyDescription.Contains(PropertyMediaConstants.AmenityMarathi) 
                        || pt.PropertyDescription.Contains(PropertyMediaConstants.AmenityMarathiAlternate))
                    .Select(pt => pt.Id);

                activeProperties = activeProperties.Where(p => p.PropertyTypeId.HasValue && amenityTypeIds.Contains(p.PropertyTypeId.Value));
            }
            else if (IsWaterRelatedPhotoType(photoType.PhotoTypeCode))
            {
                if (_waterConnectionRepository != null)
                {
                    var waterPropertyIds = _waterConnectionRepository.GetQueryable().AsNoTracking()
                        .Where(w => w.IsActive)
                        .Select(w => w.PropertyId);

                    activeProperties = activeProperties.Where(p => waterPropertyIds.Contains(p.Id));
                }
                else
                {
                    activeProperties = activeProperties.Where(p => false);
                }
            }
            else if (_propertySocialDetailsRepository != null && _socialAttributeRepository != null)
            {
                var socialAttrIds = await _socialAttributeRepository.GetQueryable().AsNoTracking()
                    .Where(sa => sa.IsActive && (sa.PhotoTypeId == photoTypeId.Value
                        || (photoType.PhotoTypeCode == "STP" && sa.SocialAttributeCode == "HAS_STP")
                        || (photoType.PhotoTypeCode == "ECS" && sa.SocialAttributeCode == "HAS_EV_CHARGING")
                        || (photoType.PhotoTypeCode == "LFT" && sa.SocialAttributeCode == "HAS_LIFT")
                        || (photoType.PhotoTypeCode == "SWC" && sa.SocialAttributeCode == "HAS_GARBAGE_DISPOSAL")))
                    .Select(sa => sa.Id)
                    .ToListAsync(cancellationToken);

                if (socialAttrIds.Any())
                {
                    var qualifyingPropertyIds = _propertySocialDetailsRepository.GetQueryable().AsNoTracking()
                        .Where(psd => psd.IsActive && !psd.MarkedForDeletion && psd.BitValue == true && psd.PropertyId.HasValue && socialAttrIds.Contains(psd.SocialAttributeId))
                        .Select(psd => psd.PropertyId!.Value);

                    activeProperties = activeProperties.Where(p => qualifyingPropertyIds.Contains(p.Id));
                }
                else if (!string.Equals(photoType.PhotoScope, PropertyMediaConstants.ScopeProperty, StringComparison.OrdinalIgnoreCase) && !PropertyMediaConstants.MandatoryPhotoTypeNames.Contains(photoType.PhotoTypeName))
                {
                    activeProperties = activeProperties.Where(p => false);
                }
            }
            else if (!string.Equals(photoType.PhotoScope, PropertyMediaConstants.ScopeProperty, StringComparison.OrdinalIgnoreCase) && !PropertyMediaConstants.MandatoryPhotoTypeNames.Contains(photoType.PhotoTypeName))
            {
                activeProperties = activeProperties.Where(p => false);
            }
        }
        else
        {
            photoTypeNameHeader = "All";
        }

        var activePhotos = _propertyPhotoRepository.GetQueryable()
            .AsNoTracking()
            .Where(ph => ph.IsActive && !ph.MarkedForDeletion);

        // Free-text search box matches PropertyNo (including composite Ward-Property-Partition combinations)
        // and OwnerName (both OwnerName and OwnerNameEnglish columns) only. Dropdowns handle Ward, Zone,
        // PropertyType, and WorkflowStage filters separately.
        var term = string.IsNullOrWhiteSpace(queryParameters.SearchTerm) ? null : queryParameters.SearchTerm.Trim().ToLower();
        var termParts = term?.Split('-', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        var part0 = termParts is { Length: >= 2 } ? termParts[0] : null;
        var part1 = termParts is { Length: >= 2 } ? termParts[1] : null;
        var part2 = termParts is { Length: >= 3 } ? termParts[2] : null;
        var hasThreeParts = termParts is { Length: >= 3 };
        var hasTwoParts = termParts is { Length: 2 };

        // Apply exact-match filters directly on properties
        if (queryParameters.WardId.HasValue)
        {
            activeProperties = activeProperties.Where(p => p.WardId == queryParameters.WardId.Value);
        }

        if (queryParameters.PropertyTypeId.HasValue)
        {
            activeProperties = activeProperties.Where(p => p.PropertyTypeId == queryParameters.PropertyTypeId.Value);
        }

        if (queryParameters.ZoneId.HasValue)
        {
            var wardIdsInZone = _wardRepository.GetQueryable()
                .AsNoTracking()
                .Where(w => w.ZoneId == queryParameters.ZoneId.Value)
                .Select(w => w.Id);

            activeProperties = activeProperties.Where(p => wardIdsInZone.Contains(p.WardId));
        }

        if (queryParameters.WorkflowStageId.HasValue)
        {
            var stagePropertyIds = _workflowDetailsRepository.GetQueryable()
                .AsNoTracking()
                .Where(w => w.CurrentStatus == true && w.WorkflowStageId == queryParameters.WorkflowStageId.Value)
                .Select(w => w.PropertyId);

            activeProperties = activeProperties.Where(p => stagePropertyIds.Contains(p.Id));
        }

        var allAmenityTypeIds = _propertyTypeRepository.GetQueryable().AsNoTracking()
            .Where(pt => pt.PartType == PropertyMediaConstants.AmenityPartType 
                || pt.PropertyDescription.Contains(PropertyMediaConstants.AmenityPartType) 
                || pt.PropertyDescription.Contains(PropertyMediaConstants.AmenityMarathi) 
                || pt.PropertyDescription.Contains(PropertyMediaConstants.AmenityMarathiAlternate))
            .Select(pt => pt.Id);

        var allWaterPropertyIds = _waterConnectionRepository != null
            ? _waterConnectionRepository.GetQueryable().AsNoTracking().Where(w => w.IsActive).Select(w => w.PropertyId)
            : Enumerable.Empty<int>().AsQueryable();

        var waterCodes = PropertyMediaConstants.WaterRelatedPhotoTypeCodeArray;

        var socialPhotoPropIds = _propertySocialDetailsRepository != null && _socialAttributeRepository != null
            ? (from psd in _propertySocialDetailsRepository.GetQueryable().AsNoTracking()
               where psd.IsActive && !psd.MarkedForDeletion && psd.BitValue == true && psd.PropertyId.HasValue
               join sa in _socialAttributeRepository.GetQueryable().AsNoTracking() on psd.SocialAttributeId equals sa.Id
               where sa.IsActive
               select new { sa.PhotoTypeId, sa.SocialAttributeCode, PropertyId = psd.PropertyId!.Value })
            : null;

        if (pageSize == -1)
        {
            // For full export (pageSize == -1), execute the full query with joins directly
            var exportQuery =
                from p in activeProperties
                from pt in activePhotoTypesQuery
                where !activePhotos.Any(ph => ph.PropertyId == p.Id && ph.PhotoTypeId == pt.Id)
                    && (photoTypeId.HasValue
                        || pt.PhotoScope == PropertyMediaConstants.ScopeProperty
                        || PropertyMediaConstants.MandatoryPhotoTypeNames.Contains(pt.PhotoTypeName)
                        || (pt.PhotoScope == PropertyMediaConstants.ScopeWing && p.WingDetailId.HasValue)
                        || (pt.PhotoScope == PropertyMediaConstants.ScopeSociety 
                            && p.CategoryId == PropertyMediaConstants.SocietyCategoryId 
                            && (p.PartitionNo == null 
                                || p.PartitionNo == PropertyMediaConstants.PartitionEmpty 
                                || p.PartitionNo == PropertyMediaConstants.PartitionZero 
                                || p.PartitionNo == PropertyMediaConstants.PartitionDash))
                        || (pt.PhotoScope == PropertyMediaConstants.ScopeAmenity && p.PropertyTypeId.HasValue && allAmenityTypeIds.Contains(p.PropertyTypeId.Value))
                        || (waterCodes.Contains(pt.PhotoTypeCode) && allWaterPropertyIds.Contains(p.Id))
                        || (socialPhotoPropIds != null && socialPhotoPropIds.Any(sp => sp.PropertyId == p.Id && (sp.PhotoTypeId == pt.Id
                            || (pt.PhotoTypeCode == PropertyMediaConstants.PhotoTypeCodeStp && sp.SocialAttributeCode == PropertyMediaConstants.SocialCodeStp)
                            || (pt.PhotoTypeCode == PropertyMediaConstants.PhotoTypeCodeEcs && sp.SocialAttributeCode == PropertyMediaConstants.SocialCodeEcs)
                            || (pt.PhotoTypeCode == PropertyMediaConstants.PhotoTypeCodeLft && sp.SocialAttributeCode == PropertyMediaConstants.SocialCodeLft)
                            || (pt.PhotoTypeCode == PropertyMediaConstants.PhotoTypeCodeSwc && sp.SocialAttributeCode == PropertyMediaConstants.SocialCodeSwc)))))
                join w in _wardRepository.GetQueryable().AsNoTracking() on p.WardId equals w.Id into wj
                from w in wj.DefaultIfEmpty()
                join z in _zoneRepository.GetQueryable().AsNoTracking() on w.ZoneId equals z.Id into zj
                from z in zj.DefaultIfEmpty()
                join ptype in _propertyTypeRepository.GetQueryable().AsNoTracking() on p.PropertyTypeId equals ptype.Id into ptj
                from ptype in ptj.DefaultIfEmpty()
                join wd in _workflowDetailsRepository.GetQueryable().AsNoTracking().Where(w => w.CurrentStatus == true)
                    on p.Id equals wd.PropertyId into wdj
                from wd in wdj.OrderByDescending(w => w.Id).Take(1).DefaultIfEmpty()
                where term == null
                    || (p.PropertyNo != null && p.PropertyNo!.Contains(term!))
                    || (p.PartitionNo != null && p.PartitionNo!.Contains(term!))
                    || (hasThreeParts
                        && w != null && w.WardNo != null && w.WardNo!.Contains(part0!)
                        && p.PropertyNo != null && p.PropertyNo!.Contains(part1!)
                        && p.PartitionNo != null && p.PartitionNo!.Contains(part2!))
                    || (hasTwoParts
                        && ((w != null && w.WardNo != null && w.WardNo!.Contains(part0!)
                             && p.PropertyNo != null && p.PropertyNo!.Contains(part1!))
                         || (p.PropertyNo != null && p.PropertyNo!.Contains(part0!)
                             && p.PartitionNo != null && p.PartitionNo!.Contains(part1!))))
                    || (p.OwnerName != null && p.OwnerName!.Contains(term!))
                orderby p.PropertyNo, pt.DisplayOrder
                select new PropertyMediaGapRowDto
                {
                    PropertyId = p.Id,
                    PropertyNo = (w != null && !string.IsNullOrEmpty(w.WardNo) ? w.WardNo + "-" : "")
                        + (p.PropertyNo ?? "")
                        + (!string.IsNullOrEmpty(p.PartitionNo) && p.PartitionNo != "-" ? "-" + p.PartitionNo : ""),
                    ZoneNo = z != null ? z.ZoneNo : null,
                    WardNo = w != null ? w.WardNo : null,
                    OwnerName = p.OwnerName,
                    PropertyType = ptype != null ? ptype.PropertyDescription : null,
                    StageName = wd != null && wd.WorkflowStage != null ? wd.WorkflowStage.StageName : null,
                    MissingType = pt.PhotoTypeName,
                    UpdatedDate = p.UpdatedDate.HasValue ? p.UpdatedDate.Value.ToString("dd-MM-yyyy") : "Never"
                };

            var exportItems = await exportQuery.ToListAsync(cancellationToken);
            return new PropertyMediaGapListDto
            {
                PhotoTypeId = photoTypeId ?? 0,
                PhotoTypeName = photoTypeNameHeader,
                GapRecords = exportItems.Count,
                Items = exportItems
            };
        }

        if (photoTypeId.HasValue)
        {
            var targetPhotoTypeId = photoTypeId.Value;
            var propertyIdsWithPhoto = _propertyPhotoRepository.GetQueryable()
                .AsNoTracking()
                .Where(ph => ph.IsActive && !ph.MarkedForDeletion && ph.PropertyId.HasValue && ph.PhotoTypeId == targetPhotoTypeId)
                .Select(ph => ph.PropertyId!.Value);

            activeProperties = activeProperties.Where(p => !propertyIdsWithPhoto.Contains(p.Id));

            IQueryable<PropertyEntity> filteredProperties = activeProperties;

            if (term != null)
            {
                filteredProperties =
                    from p in filteredProperties
                    join w in _wardRepository.GetQueryable().AsNoTracking() on p.WardId equals w.Id into wj
                    from w in wj.DefaultIfEmpty()
                    where (p.PropertyNo != null && p.PropertyNo.Contains(term))
                        || (p.PartitionNo != null && p.PartitionNo.Contains(term))
                        || (hasThreeParts
                            && w != null && w.WardNo != null && w.WardNo.Contains(part0!)
                            && p.PropertyNo != null && p.PropertyNo.Contains(part1!)
                            && p.PartitionNo != null && p.PartitionNo.Contains(part2!))
                        || (hasTwoParts
                            && ((w != null && w.WardNo != null && w.WardNo.Contains(part0!)
                                 && p.PropertyNo != null && p.PropertyNo.Contains(part1!))
                             || (p.PropertyNo != null && p.PropertyNo.Contains(part0!)
                                 && p.PartitionNo != null && p.PartitionNo.Contains(part1!))))
                        || (p.OwnerName != null && p.OwnerName.Contains(term))
                    select p;
            }

            var gapRecords = await filteredProperties.CountAsync(cancellationToken);

            var pagedPropertyIds = await filteredProperties
                .OrderBy(p => p.PropertyNo)
                .ThenBy(p => p.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => p.Id)
                .ToListAsync(cancellationToken);

            if (pagedPropertyIds.Count == 0)
            {
                return new PropertyMediaGapListDto
                {
                    PhotoTypeId = targetPhotoTypeId,
                    PhotoTypeName = photoTypeNameHeader,
                    GapRecords = gapRecords,
                    Items = new List<PropertyMediaGapRowDto>()
                };
            }

            var detailsQuery =
                from p in _propertyRepository.GetQueryable().AsNoTracking().Where(p => pagedPropertyIds.Contains(p.Id))
                join w in _wardRepository.GetQueryable().AsNoTracking() on p.WardId equals w.Id into wj
                from w in wj.DefaultIfEmpty()
                join z in _zoneRepository.GetQueryable().AsNoTracking() on w.ZoneId equals z.Id into zj
                from z in zj.DefaultIfEmpty()
                join ptype in _propertyTypeRepository.GetQueryable().AsNoTracking() on p.PropertyTypeId equals ptype.Id into ptj
                from ptype in ptj.DefaultIfEmpty()
                join wd in _workflowDetailsRepository.GetQueryable().AsNoTracking().Where(w => w.CurrentStatus == true)
                    on p.Id equals wd.PropertyId into wdj
                from wd in wdj.OrderByDescending(w => w.Id).Take(1).DefaultIfEmpty()
                select new
                {
                    p,
                    w,
                    z,
                    ptype,
                    StageName = wd != null && wd.WorkflowStage != null ? wd.WorkflowStage.StageName : null
                };

            var details = await detailsQuery.ToListAsync(cancellationToken);
            var detailsMap = details.ToDictionary(d => d.p.Id);

            var items = new List<PropertyMediaGapRowDto>();
            foreach (var propId in pagedPropertyIds)
            {
                if (detailsMap.TryGetValue(propId, out var x))
                {
                    items.Add(new PropertyMediaGapRowDto
                    {
                        PropertyId = x.p.Id,
                        PropertyNo = (x.w != null && !string.IsNullOrEmpty(x.w.WardNo) ? x.w.WardNo + "-" : "")
                            + (x.p.PropertyNo ?? "")
                            + (!string.IsNullOrEmpty(x.p.PartitionNo) && x.p.PartitionNo != "-" ? "-" + x.p.PartitionNo : ""),
                        ZoneNo = x.z?.ZoneNo,
                        WardNo = x.w?.WardNo,
                        OwnerName = x.p.OwnerName,
                        PropertyType = x.ptype?.PropertyDescription,
                        StageName = x.StageName,
                        MissingType = photoTypeNameHeader,
                        UpdatedDate = x.p.UpdatedDate.HasValue ? x.p.UpdatedDate.Value.ToString("dd-MM-yyyy") : "Never"
                    });
                }
            }

            return new PropertyMediaGapListDto
            {
                PhotoTypeId = targetPhotoTypeId,
                PhotoTypeName = photoTypeNameHeader,
                GapRecords = gapRecords,
                Items = items
            };
        }

        // Fallback for "All" photo types (pageSize != -1)
        var baseFilteredQuery =
            from p in activeProperties
            from pt in activePhotoTypesQuery
            where !activePhotos.Any(ph => ph.PropertyId == p.Id && ph.PhotoTypeId == pt.Id)
                && (photoTypeId.HasValue
                    || pt.PhotoScope == PropertyMediaConstants.ScopeProperty
                    || PropertyMediaConstants.MandatoryPhotoTypeNames.Contains(pt.PhotoTypeName)
                    || (pt.PhotoScope == PropertyMediaConstants.ScopeWing && p.WingDetailId.HasValue)
                    || (pt.PhotoScope == PropertyMediaConstants.ScopeSociety 
                        && p.CategoryId == PropertyMediaConstants.SocietyCategoryId 
                        && (p.PartitionNo == null 
                            || p.PartitionNo == PropertyMediaConstants.PartitionEmpty 
                            || p.PartitionNo == PropertyMediaConstants.PartitionZero 
                            || p.PartitionNo == PropertyMediaConstants.PartitionDash))
                    || (pt.PhotoScope == PropertyMediaConstants.ScopeAmenity && p.PropertyTypeId.HasValue && allAmenityTypeIds.Contains(p.PropertyTypeId.Value))
                    || (waterCodes.Contains(pt.PhotoTypeCode) && allWaterPropertyIds.Contains(p.Id))
                    || (socialPhotoPropIds != null && socialPhotoPropIds.Any(sp => sp.PropertyId == p.Id && (sp.PhotoTypeId == pt.Id
                        || (pt.PhotoTypeCode == PropertyMediaConstants.PhotoTypeCodeStp && sp.SocialAttributeCode == PropertyMediaConstants.SocialCodeStp)
                        || (pt.PhotoTypeCode == PropertyMediaConstants.PhotoTypeCodeEcs && sp.SocialAttributeCode == PropertyMediaConstants.SocialCodeEcs)
                        || (pt.PhotoTypeCode == PropertyMediaConstants.PhotoTypeCodeLft && sp.SocialAttributeCode == PropertyMediaConstants.SocialCodeLft)
                        || (pt.PhotoTypeCode == PropertyMediaConstants.PhotoTypeCodeSwc && sp.SocialAttributeCode == PropertyMediaConstants.SocialCodeSwc)))))
            join w in _wardRepository.GetQueryable().AsNoTracking() on p.WardId equals w.Id into wj
            from w in wj.DefaultIfEmpty()
            where term == null
                || (p.PropertyNo != null && p.PropertyNo!.Contains(term!))
                || (p.PartitionNo != null && p.PartitionNo!.Contains(term!))
                || (hasThreeParts
                    && w != null && w.WardNo != null && w.WardNo!.Contains(part0!)
                    && p.PropertyNo != null && p.PropertyNo!.Contains(part1!)
                    && p.PartitionNo != null && p.PartitionNo!.Contains(part2!))
                || (hasTwoParts
                    && ((w != null && w.WardNo != null && w.WardNo!.Contains(part0!)
                         && p.PropertyNo != null && p.PropertyNo!.Contains(part1!))
                     || (p.PropertyNo != null && p.PropertyNo!.Contains(part0!)
                         && p.PartitionNo != null && p.PartitionNo!.Contains(part1!))))
                || (p.OwnerName != null && p.OwnerName!.Contains(term!))
            select new { p.Id, PropertyNo = p.PropertyNo, pt.DisplayOrder, PhotoTypeId = pt.Id, pt.PhotoTypeName };

        var gapRecordsAll = await baseFilteredQuery.CountAsync(cancellationToken);

        var pagedKeys = await baseFilteredQuery
            .OrderBy(x => x.PropertyNo)
            .ThenBy(x => x.DisplayOrder)
            .ThenBy(x => x.Id)
            .ThenBy(x => x.PhotoTypeId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new { x.Id, x.PhotoTypeId, x.PhotoTypeName })
            .ToListAsync(cancellationToken);

        if (pagedKeys.Count == 0)
        {
            return new PropertyMediaGapListDto
            {
                PhotoTypeId = photoTypeId ?? 0,
                PhotoTypeName = photoTypeNameHeader,
                GapRecords = gapRecordsAll,
                Items = new List<PropertyMediaGapRowDto>()
            };
        }

        var pagedPropertyIdsAll = pagedKeys.Select(k => k.Id).Distinct().ToList();

        var detailsQueryAll =
            from p in _propertyRepository.GetQueryable().AsNoTracking().Where(p => pagedPropertyIdsAll.Contains(p.Id))
            join w in _wardRepository.GetQueryable().AsNoTracking() on p.WardId equals w.Id into wj
            from w in wj.DefaultIfEmpty()
            join z in _zoneRepository.GetQueryable().AsNoTracking() on w.ZoneId equals z.Id into zj
            from z in zj.DefaultIfEmpty()
            join ptype in _propertyTypeRepository.GetQueryable().AsNoTracking() on p.PropertyTypeId equals ptype.Id into ptj
            from ptype in ptj.DefaultIfEmpty()
            join wd in _workflowDetailsRepository.GetQueryable().AsNoTracking().Where(w => w.CurrentStatus == true)
                on p.Id equals wd.PropertyId into wdj
            from wd in wdj.OrderByDescending(w => w.Id).Take(1).DefaultIfEmpty()
            select new
            {
                p,
                w,
                z,
                ptype,
                StageName = wd != null && wd.WorkflowStage != null ? wd.WorkflowStage.StageName : null
            };

        var detailsAll = await detailsQueryAll.ToListAsync(cancellationToken);
        var detailsMapAll = detailsAll.ToDictionary(d => d.p.Id);

        var itemsAll = pagedKeys
            .Where(k => detailsMapAll.ContainsKey(k.Id))
            .Select(k =>
            {
                var x = detailsMapAll[k.Id];
                return new PropertyMediaGapRowDto
                {
                    PropertyId = x.p.Id,
                    PropertyNo = (x.w != null && !string.IsNullOrEmpty(x.w.WardNo) ? x.w.WardNo + "-" : "")
                        + (x.p.PropertyNo ?? "")
                        + (!string.IsNullOrEmpty(x.p.PartitionNo) && x.p.PartitionNo != "-" ? "-" + x.p.PartitionNo : ""),
                    ZoneNo = x.z?.ZoneNo,
                    WardNo = x.w?.WardNo,
                    OwnerName = x.p.OwnerName,
                    PropertyType = x.ptype?.PropertyDescription,
                    StageName = x.StageName,
                    MissingType = k.PhotoTypeName,
                    UpdatedDate = x.p.UpdatedDate.HasValue ? x.p.UpdatedDate.Value.ToString("dd-MM-yyyy") : "Never"
                };
            })
            .ToList();

        return new PropertyMediaGapListDto
        {
            PhotoTypeId = photoTypeId ?? 0,
            PhotoTypeName = photoTypeNameHeader,
            GapRecords = gapRecordsAll,
            Items = itemsAll
        };
    }

    public async Task<(List<PropertyMediaJobSummaryDto> Items, int TotalCount)> GetMediaJobsAsync(
        PropertyMediaJobQueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var query = BuildMediaJobsBaseQuery(queryParameters);

        var totalCount = await query.CountAsync(cancellationToken);

        var rawItems = queryParameters.PageSize == -1
            ? await query.ToListAsync(cancellationToken)
            : await query
                .Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize)
                .Take(queryParameters.PageSize)
                .ToListAsync(cancellationToken);

        var items = rawItems.Select(r => new PropertyMediaJobSummaryDto
        {
            DateTime = r.CreatedDateRaw.ToString("dd-MM-yyyy HH:mm"),
            User = r.StartedByUserName,
            Action = MapOperationDisplayName(r.Operation),
            Category = r.PhotoTypeName,
            Result = r.MatchedCount
        }).ToList();

        return (items, totalCount);
    }

    /// <summary>Maps internal Operation enum name to user-friendly display name.</summary>
    private static string MapOperationDisplayName(string operation) => operation switch
    {
        nameof(PropertyMediaJobOperation.BulkImportLocalFolder) => "Bulk Upload From Server",
        nameof(PropertyMediaJobOperation.BulkImportBrowsedFiles) => "Bulk Upload From Local",
        _ => operation
    };

    /// <summary>Intermediate projection for the media jobs query (dates stay as DateTime for EF translation).</summary>
    private sealed class MediaJobRawRow
    {
        public DateTime CreatedDateRaw { get; set; }
        public string StartedByUserName { get; set; } = string.Empty;
        public string Operation { get; set; } = string.Empty;
        public string PhotoTypeName { get; set; } = string.Empty;
        public int MatchedCount { get; set; }
    }

    /// <summary>Builds the base query for media jobs list (shared by paged list and exports).</summary>
    private IQueryable<MediaJobRawRow> BuildMediaJobsBaseQuery(PropertyMediaJobQueryParameters queryParameters)
    {
        var jobsQuery = _mediaJobRepository.GetQueryable()
            .AsNoTracking()
            .Where(j => !j.MarkedForDeletion && j.IsActive && j.MatchedCount > 0);

        var term = string.IsNullOrWhiteSpace(queryParameters.SearchTerm) ? null : queryParameters.SearchTerm.Trim().ToLower();

        var query = from j in jobsQuery
                    join pt in _propertyPhotoTypeRepository.GetQueryable().AsNoTracking()
                        on j.PhotoTypeId equals pt.Id into ptj
                    from pt in ptj.DefaultIfEmpty()
                    join u in _userRepository.GetQueryable().AsNoTracking()
                        on j.CreatedBy equals u.Id into uj
                    from u in uj.DefaultIfEmpty()
                    where term == null
                        || (j.Operation != null && j.Operation.ToLower().Contains(term))
                        || (u != null && u.UserName != null && u.UserName.ToLower().Contains(term))
                        || (pt != null && pt.PhotoTypeName != null && pt.PhotoTypeName.ToLower().Contains(term))
                    orderby j.CreatedDate descending
                    select new MediaJobRawRow
                    {
                        CreatedDateRaw = j.CreatedDate.GetValueOrDefault(),
                        StartedByUserName = u != null ? u.UserName : (j.CreatedBy.HasValue ? j.CreatedBy.Value.ToString() : string.Empty),
                        Operation = j.Operation,
                        PhotoTypeName = pt != null ? pt.PhotoTypeName : string.Empty,
                        MatchedCount = j.MatchedCount
                    };

        return query;
    }

    private static int ResolveApplicableCount(
        int photoTypeId,
        string photoTypeCode,
        string? photoScope,
        string photoTypeName,
        int totalActiveCount,
        int wingPropertiesCount,
        int societyPropertiesCount,
        int amenityPropertiesCount,
        Dictionary<int, int> socialCountsByType,
        Dictionary<string, int> socialCountsByCode,
        int waterConnectionsCount)
    {
        // 1. Direct SocialAttributeMaster -> PhotoTypeId mapping
        if (socialCountsByType.TryGetValue(photoTypeId, out var sCount))
        {
            return sCount;
        }

        // 2. Code-level SocialAttribute fallbacks (where PhotoTypeId was not explicitly populated in DB)
        if (photoTypeCode.Equals(PropertyMediaConstants.PhotoTypeCodeStp, StringComparison.OrdinalIgnoreCase) && socialCountsByCode.TryGetValue(PropertyMediaConstants.SocialCodeStp, out var stpCount))
            return stpCount;
        if (photoTypeCode.Equals(PropertyMediaConstants.PhotoTypeCodeEcs, StringComparison.OrdinalIgnoreCase) && socialCountsByCode.TryGetValue(PropertyMediaConstants.SocialCodeEcs, out var ecsCount))
            return ecsCount;
        if (photoTypeCode.Equals(PropertyMediaConstants.PhotoTypeCodeLft, StringComparison.OrdinalIgnoreCase) && socialCountsByCode.TryGetValue(PropertyMediaConstants.SocialCodeLft, out var lftCount))
            return lftCount;
        if (photoTypeCode.Equals(PropertyMediaConstants.PhotoTypeCodeSwc, StringComparison.OrdinalIgnoreCase) && socialCountsByCode.TryGetValue(PropertyMediaConstants.SocialCodeSwc, out var swcCount))
            return swcCount;

        // 3. Water connection related document/photo types
        if (IsWaterRelatedPhotoType(photoTypeCode))
        {
            return waterConnectionsCount;
        }

        // 4. PhotoScope based resolution
        if (string.Equals(photoScope, PropertyMediaConstants.ScopeWing, StringComparison.OrdinalIgnoreCase))
            return wingPropertiesCount;

        if (string.Equals(photoScope, PropertyMediaConstants.ScopeSociety, StringComparison.OrdinalIgnoreCase))
            return societyPropertiesCount;

        if (string.Equals(photoScope, PropertyMediaConstants.ScopeAmenity, StringComparison.OrdinalIgnoreCase))
            return amenityPropertiesCount;

        if (string.Equals(photoScope, PropertyMediaConstants.ScopeProperty, StringComparison.OrdinalIgnoreCase))
        {
            return totalActiveCount;
        }

        // 5. Default: mandatory core types apply to all, conditional facility types without record apply to 0
        return PropertyMediaConstants.MandatoryPhotoTypeNames.Contains(photoTypeName) ? totalActiveCount : 0;
    }

    private static bool IsWaterRelatedPhotoType(string? photoTypeCode) =>
        photoTypeCode != null && PropertyMediaConstants.WaterRelatedPhotoTypeCodes.Contains(photoTypeCode);

    private static int ResolveAvailableCount(
        int photoTypeId,
        string photoTypeCode,
        string? photoScope,
        string photoTypeName,
        List<PropertyPhotoCoverageItem> activePhotosWithProps,
        Dictionary<int, int> socialCountsByType,
        Dictionary<string, int> socialCountsByCode,
        HashSet<(int PhotoTypeId, int PropertyId)> eligibleSocialPhotoProps,
        HashSet<(string Code, int PropertyId)> eligibleSocialCodeProps,
        HashSet<int> waterPropertyIds,
        HashSet<int> amenityTypeIds)
    {
        // 1. Direct SocialAttributeMaster -> PhotoTypeId mapping
        if (socialCountsByType.ContainsKey(photoTypeId))
        {
            return activePhotosWithProps
                .Count(p => p.PhotoTypeId == photoTypeId && eligibleSocialPhotoProps.Contains((photoTypeId, p.PropertyId)));
        }

        // 2. Code-level SocialAttribute fallbacks (where PhotoTypeId was not explicitly populated in DB)
        if (photoTypeCode.Equals(PropertyMediaConstants.PhotoTypeCodeStp, StringComparison.OrdinalIgnoreCase) && socialCountsByCode.ContainsKey(PropertyMediaConstants.SocialCodeStp))
            return activePhotosWithProps.Count(p => p.PhotoTypeId == photoTypeId && eligibleSocialCodeProps.Contains((PropertyMediaConstants.SocialCodeStp, p.PropertyId)));
        if (photoTypeCode.Equals(PropertyMediaConstants.PhotoTypeCodeEcs, StringComparison.OrdinalIgnoreCase) && socialCountsByCode.ContainsKey(PropertyMediaConstants.SocialCodeEcs))
            return activePhotosWithProps.Count(p => p.PhotoTypeId == photoTypeId && eligibleSocialCodeProps.Contains((PropertyMediaConstants.SocialCodeEcs, p.PropertyId)));
        if (photoTypeCode.Equals(PropertyMediaConstants.PhotoTypeCodeLft, StringComparison.OrdinalIgnoreCase) && socialCountsByCode.ContainsKey(PropertyMediaConstants.SocialCodeLft))
            return activePhotosWithProps.Count(p => p.PhotoTypeId == photoTypeId && eligibleSocialCodeProps.Contains((PropertyMediaConstants.SocialCodeLft, p.PropertyId)));
        if (photoTypeCode.Equals(PropertyMediaConstants.PhotoTypeCodeSwc, StringComparison.OrdinalIgnoreCase) && socialCountsByCode.ContainsKey(PropertyMediaConstants.SocialCodeSwc))
            return activePhotosWithProps.Count(p => p.PhotoTypeId == photoTypeId && eligibleSocialCodeProps.Contains((PropertyMediaConstants.SocialCodeSwc, p.PropertyId)));

        // 3. Water connection related document/photo types
        if (IsWaterRelatedPhotoType(photoTypeCode))
        {
            return activePhotosWithProps.Count(p => p.PhotoTypeId == photoTypeId && waterPropertyIds.Contains(p.PropertyId));
        }

        // 4. PhotoScope based resolution
        if (string.Equals(photoScope, PropertyMediaConstants.ScopeWing, StringComparison.OrdinalIgnoreCase))
            return activePhotosWithProps.Count(p => p.PhotoTypeId == photoTypeId && p.WingDetailId.HasValue);

        if (string.Equals(photoScope, PropertyMediaConstants.ScopeSociety, StringComparison.OrdinalIgnoreCase))
            return activePhotosWithProps.Count(p => p.PhotoTypeId == photoTypeId 
                && p.CategoryId == PropertyMediaConstants.SocietyCategoryId 
                && (p.PartitionNo == null 
                    || p.PartitionNo == PropertyMediaConstants.PartitionEmpty 
                    || p.PartitionNo == PropertyMediaConstants.PartitionZero 
                    || p.PartitionNo == PropertyMediaConstants.PartitionDash));

        if (string.Equals(photoScope, PropertyMediaConstants.ScopeAmenity, StringComparison.OrdinalIgnoreCase))
            return activePhotosWithProps.Count(p => p.PhotoTypeId == photoTypeId && p.PropertyTypeId.HasValue && amenityTypeIds.Contains(p.PropertyTypeId.Value));

        if (string.Equals(photoScope, PropertyMediaConstants.ScopeProperty, StringComparison.OrdinalIgnoreCase))
        {
            return activePhotosWithProps.Count(p => p.PhotoTypeId == photoTypeId);
        }

        // 5. Default: mandatory core types apply to all, conditional facility types without record apply to 0
        return PropertyMediaConstants.MandatoryPhotoTypeNames.Contains(photoTypeName)
            ? activePhotosWithProps.Count(p => p.PhotoTypeId == photoTypeId)
            : 0;
    }

    private sealed class PropertyPhotoCoverageItem
    {
        public int PhotoTypeId { get; set; }
        public int PropertyId { get; set; }
        public long? WingDetailId { get; set; }
        public int? CategoryId { get; set; }
        public string? PartitionNo { get; set; }
        public int? PropertyTypeId { get; set; }
    }
}

