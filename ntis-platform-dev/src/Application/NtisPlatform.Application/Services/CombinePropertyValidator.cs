using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Constants;

namespace NtisPlatform.Application.Services;

/// <summary>
/// Validates property combination operations
/// </summary>
public class CombinePropertyValidator : ICombinePropertyValidator
{
    private const string InactiveOrLockedErrorMessage = "Property cannot be combined because it is inactive or locked.";

    private readonly IRepository<PropertyEntity, int> _propertyRepository;
    private readonly IRepository<PropertyCategoryEntity, int> _categoryRepository;
    private readonly IRepository<PropertyTypeMasterEntity, int> _propertyTypeMasterRepository;
    private readonly IRepository<SocietyDetailsEntity, int>? _societyRepository;
    private readonly IRepository<WingDetailsMastEntity, int>? _wingDetailsMastRepository;
    private readonly ILogger<CombinePropertyValidator> _logger;

    public CombinePropertyValidator(
        IRepository<PropertyEntity, int> propertyRepository,
        IRepository<PropertyCategoryEntity, int> categoryRepository,
        IRepository<PropertyTypeMasterEntity, int> propertyTypeMasterRepository,
        ILogger<CombinePropertyValidator> logger,
        IRepository<SocietyDetailsEntity, int>? societyRepository = null,
        IRepository<WingDetailsMastEntity, int>? wingDetailsMastRepository = null)
    {
        _propertyRepository = propertyRepository;
        _categoryRepository = categoryRepository;
        _propertyTypeMasterRepository = propertyTypeMasterRepository;
        _logger = logger;
        _societyRepository = societyRepository;
        _wingDetailsMastRepository = wingDetailsMastRepository;
    }

    public async Task<(bool IsValid, string? ErrorMessage, List<PropertyEntity> ValidProperties)> ValidatePropertiesForCombinationAsync(
        int mainPropertyId,
        List<int> combinePropertyIds,
        bool overrideOwnerNameMismatch = false,
        CancellationToken cancellationToken = default)
    {
        // Validate SourcePropertyId exists
        var mainProperty = await _propertyRepository.GetByIdAsync(mainPropertyId, cancellationToken);
        if (mainProperty == null)
        {
            return (false, "SourcePropertyId not found.", []);
        }

        // Validate source property active/locked status
        if (!mainProperty.IsActive || mainProperty.MarkedForDeletion)
        {
            _logger.LogWarning("Source property {MainPropertyId} is inactive or locked", mainPropertyId);
            return (false, InactiveOrLockedErrorMessage, []);
        }

        // Validate all CombinedPropertyIds exist
        var existingCombineProperties = await _propertyRepository.GetQueryable()
            .Where(p => combinePropertyIds.Contains(p.Id) && p.IsActive)
            .ToListAsync(cancellationToken);

        if (existingCombineProperties.Count != combinePropertyIds.Count)
        {
            return (false, "One or more CombinedPropertyIds not found.", []);
        }

        // Validate combined properties locked status (MarkedForDeletion)
        // Note: IsActive check is unnecessary here since the query already filters by IsActive
        if (existingCombineProperties.Any(p => p.MarkedForDeletion))
        {
            _logger.LogWarning("One or more combined properties are marked for deletion");
            return (false, InactiveOrLockedErrorMessage, []);
        }

        // Validate OwnerName is same for main property and all combined properties
        // Skip this validation if overrideOwnerNameMismatch is true (user confirmed to proceed)
        if (!overrideOwnerNameMismatch)
        {
            var ownerValidationResult = ValidateOwnerNames(mainProperty, existingCombineProperties);
            if (!ownerValidationResult.IsValid)
            {
                return (false, "Owner name must match for all properties.", []);
            }
        }
        // Get main property category
        var mainCategory = mainProperty.CategoryId.HasValue
            ? await _categoryRepository.GetByIdAsync(mainProperty.CategoryId.Value, cancellationToken)
            : null;
        bool isApartment = mainCategory != null &&
            mainCategory.PropertyCategoryName != null &&
            mainCategory.PropertyCategoryName.IndexOf(CapitalValueConstants.PropertyCategory.ApartmentKeyword, System.StringComparison.OrdinalIgnoreCase) >= 0;

        if (isApartment)
        {
            var apartmentCategoryValidation = await ValidateApartmentCategoryAsync(mainProperty, mainCategory!, existingCombineProperties, cancellationToken);
            if (!apartmentCategoryValidation.IsValid)
            {
                return (false, apartmentCategoryValidation.ErrorMessage, []);
            }
        }
        else
        {
            var nonApartmentCategoryValidation = await ValidateNonApartmentCategoryAsync(mainProperty, existingCombineProperties, cancellationToken);
            if (!nonApartmentCategoryValidation.IsValid)
            {
                return (false, nonApartmentCategoryValidation.ErrorMessage, []);
            }
        }
        // Validate that properties are not occupier-only (must have owner name)
        var occupierOnlyValidation = ValidateNotOccupierOnly(mainProperty, existingCombineProperties);
        if (!occupierOnlyValidation.IsValid)
        {
            return (false, occupierOnlyValidation.ErrorMessage, []);
        }

        // Validate that no properties have restricted owner names (e.g., "Holder", "धारक")
        var restrictedOwnerValidation = ValidateNoRestrictedOwnerNames(mainProperty, existingCombineProperties);
        if (!restrictedOwnerValidation.IsValid)
        {
            return (false, restrictedOwnerValidation.ErrorMessage, []);
        }

        return (true, null, existingCombineProperties);
    }

    private static (bool IsValid, string? MismatchedOwnerName) ValidateOwnerNames(
        PropertyEntity mainProperty,
        List<PropertyEntity> combineProperties)
    {
        var mainOwnerName = (mainProperty.OwnerName ?? string.Empty).Trim();

        foreach (var property in combineProperties)
        {
            var combineOwnerName = (property.OwnerName ?? string.Empty).Trim();

            if (!string.Equals(mainOwnerName, combineOwnerName, StringComparison.OrdinalIgnoreCase))
            {
                return (false, combineOwnerName);
            }
        }

        return (true, null);
    }

    /// <summary>
    /// Validates that no properties have restricted owner names (e.g., "Holder", "The Holder", "धारक").
    /// Properties with restricted owner names cannot be combined.
    /// </summary>
    private static (bool IsValid, string? ErrorMessage) ValidateNoRestrictedOwnerNames(
        PropertyEntity mainProperty,
        List<PropertyEntity> combineProperties)
    {
        var mainOwnerName = (mainProperty.OwnerName ?? string.Empty).Trim();

        // Check if main property has restricted owner name
        if (IsRestrictedOwnerName(mainOwnerName))
        {
            return (false, $"Main property has restricted owner name '{mainOwnerName}' and cannot be combined.");
        }

        // Check all combined properties for restricted owner names
        foreach (var property in combineProperties)
        {
            var combineOwnerName = (property.OwnerName ?? string.Empty).Trim();

            if (IsRestrictedOwnerName(combineOwnerName))
            {
                return (false, $"Property (ID: {property.Id}) has restricted owner name '{combineOwnerName}' and cannot be combined.");
            }
        }

        return (true, null);
    }

    /// <summary>
    /// Checks if the owner name is a restricted placeholder name that cannot be combined
    /// </summary>
    private static bool IsRestrictedOwnerName(string ownerName)
    {
        if (string.IsNullOrWhiteSpace(ownerName))
        {
            return false;
        }

        return CapitalValueConstants.RestrictedOwnerNames.All
            .Any(restricted => string.Equals(ownerName, restricted, StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// Validates that properties are not occupier-only (have occupier name but no owner name).
    /// Properties with only occupier name and no owner name cannot be combined.
    /// </summary>
    private static (bool IsValid, string? ErrorMessage) ValidateNotOccupierOnly(
        PropertyEntity mainProperty,
        List<PropertyEntity> combineProperties)
    {
        // Check main property
        if (IsOccupierOnlyProperty(mainProperty))
        {
            return (false, $"Property cannot be combined: Main property (ID: {mainProperty.Id}) has only occupier name but no owner name.");
        }

        // Check all combined properties
        foreach (var property in combineProperties)
        {
            if (IsOccupierOnlyProperty(property))
            {
                return (false, $"Property cannot be combined: Property (ID: {property.Id}) has only occupier name but no owner name.");
            }
        }

        return (true, null);
    }

    /// <summary>
    /// Checks if a property has only occupier name without owner name
    /// </summary>
    private static bool IsOccupierOnlyProperty(PropertyEntity property)
    {
        var ownerName = (property.OwnerName ?? string.Empty).Trim();
        var occupierName = (property.OccupierName ?? string.Empty).Trim();

        // Property is occupier-only if it has occupier name but no owner name
        return string.IsNullOrEmpty(ownerName) && !string.IsNullOrEmpty(occupierName);
    }

    private async Task<(bool IsValid, string? ErrorMessage)> ValidateApartmentCategoryAsync(
        PropertyEntity mainProperty,
        PropertyCategoryEntity mainCategory,
        List<PropertyEntity> combineProperties,
        CancellationToken cancellationToken)
    {
        // mainCategory is already validated as apartment type by the caller
        var combineCategoryIds = combineProperties
            .Where(p => p.CategoryId.HasValue)
            .Select(p => p.CategoryId.Value)
            .Distinct()
            .ToList();
        var combineCategories = await _categoryRepository.GetQueryable()
            .Where(c => combineCategoryIds.Contains(c.Id))
            .ToListAsync(cancellationToken);

        // Validate PartType (Amenity can only be combined with Amenity)
        var propertyTypeIds = new List<int>();
        if (mainProperty.PropertyTypeId.HasValue)
        {
            propertyTypeIds.Add(mainProperty.PropertyTypeId.Value);
        }
        propertyTypeIds.AddRange(combineProperties.Where(p => p.PropertyTypeId.HasValue).Select(p => p.PropertyTypeId!.Value));
        propertyTypeIds = propertyTypeIds.Distinct().ToList();

        var propertyTypes = await _propertyTypeMasterRepository.GetQueryable()
            .Where(pt => propertyTypeIds.Contains(pt.Id) && pt.IsActive)
            .ToListAsync(cancellationToken);

        var amenityTypeIds = propertyTypes
            .Where(pt => string.Equals(pt.PartType, PartTypeConstants.Amenity, StringComparison.OrdinalIgnoreCase))
            .Select(pt => pt.Id)
            .ToHashSet();

        bool isMainPropertyAmenity = mainProperty.PropertyTypeId.HasValue && amenityTypeIds.Contains(mainProperty.PropertyTypeId.Value);

        foreach (var property in combineProperties)
        {
            bool isCombinePropertyAmenity = property.PropertyTypeId.HasValue && amenityTypeIds.Contains(property.PropertyTypeId.Value);
            if (isMainPropertyAmenity && !isCombinePropertyAmenity)
            {
                return (false, "Amenity properties can only be combined with other amenity properties.");
            }
            if (!isMainPropertyAmenity && isCombinePropertyAmenity)
            {
                return (false, "Non-amenity properties cannot be combined with amenity properties.");
            }
        }

        // Determine if this is a TRUE multi-unit apartment (multiple properties with same PropertyNo)
        // A standalone apartment may have a PartitionNo (flat number) but only exists as a single property
        // A multi-unit apartment has multiple properties (wings) with the same PropertyNo
        //
        // More reliable approach: For each distinct (CategoryId, WardId, PropertyNo) across source+combined properties,
        // treat it as multi-unit if there is more than one active row in that group and at least one row has a non-empty PartitionNo
        bool hasPartitions = false;

        // Collect all properties being combined (source + combined)
        var allPropertyIds = new List<int> { mainProperty.Id };
        allPropertyIds.AddRange(combineProperties.Select(p => p.Id));

        // Get distinct property groups (CategoryId, WardId, PropertyNo) from source and combined properties
        var allProperties = new List<PropertyEntity> { mainProperty };
        allProperties.AddRange(combineProperties);

        var propertyGroups = allProperties
            .Where(p => p.CategoryId.HasValue && !string.IsNullOrWhiteSpace(p.PropertyNo))
            .Select(p => new { p.CategoryId, p.WardId, p.PropertyNo })
            .Distinct()
            .ToList();

        // For each group, check if it's a multi-unit apartment
        foreach (var group in propertyGroups)
        {
            // Check if there are multiple active properties in this group with at least one having a partition
            var groupProperties = await _propertyRepository.GetQueryable()
                .Where(x => x.CategoryId == group.CategoryId &&
                            x.WardId == group.WardId &&
                            x.PropertyNo == group.PropertyNo &&
                            x.IsActive == true &&
                            !x.MarkedForDeletion)
                .Select(x => new { x.Id, x.PartitionNo })
                .ToListAsync(cancellationToken);

            // Multi-unit if: more than one property in group AND at least one has a non-empty PartitionNo
            if (groupProperties.Count > 1 && groupProperties.Any(p => !string.IsNullOrWhiteSpace(p.PartitionNo)))
            {
                hasPartitions = true;
                break;
            }
        }

        if (hasPartitions)
        {
            // Multi-unit apartment validation (has wings)
            // Resolve wing and society details for all properties (supporting both direct WingDetailId and PropertyId -> SocietyDetailsMast -> WingDetailsMast)
            var wingResolutions = await ResolveWingDetailsMapAsync(allProperties, cancellationToken);
            var mainWingRes = wingResolutions[mainProperty.Id];

            if (!isMainPropertyAmenity && !mainWingRes.HasWingOrSocietyDetails)
            {
                return (false, "Source property's society details not found.");
            }

            foreach (var property in combineProperties)
            {
                var category = property.CategoryId.HasValue
                    ? combineCategories.FirstOrDefault(c => c.Id == property.CategoryId.Value)
                    : null;
                if (category == null || category.PropertyCategoryName == null ||
                    category.PropertyCategoryName.IndexOf(CapitalValueConstants.PropertyCategory.ApartmentKeyword, System.StringComparison.OrdinalIgnoreCase) < 0)
                {
                    return (false, "All properties must be of Apartment category to combine.");
                }

                // Wing validation: Properties from the same wing (via direct WingDetailId or SocietyDetailsMast -> WingDetailsMast)
                // This is the ONLY requirement for apartment combining - partition format doesn't matter
                var propWingRes = wingResolutions[property.Id];
                if (!isMainPropertyAmenity && !IsSameWing(mainProperty, property, mainWingRes, propWingRes))
                {
                    return (false, "All properties must be from the same Wing.");
                }

                // Zone, Ward, PropertyNo check
                if (property.TaxZoneId != mainProperty.TaxZoneId ||
                    property.WardId != mainProperty.WardId ||
                    property.PropertyNo != mainProperty.PropertyNo)
                {
                    return (false, "All properties must be from the same Zone, Ward, and PropertyNo.");
                }
            }
        }
        else
        {
            // Standalone apartment validation (no wings/partitions)
            // No SocietyDetailId or PropertyNo validation required - only Zone and Ward
            foreach (var property in combineProperties)
            {
                var category = property.CategoryId.HasValue
                    ? combineCategories.FirstOrDefault(c => c.Id == property.CategoryId.Value)
                    : null;
                if (category == null || category.PropertyCategoryName == null ||
                    category.PropertyCategoryName.IndexOf(CapitalValueConstants.PropertyCategory.ApartmentKeyword, System.StringComparison.OrdinalIgnoreCase) < 0)
                {
                    return (false, "All properties must be of Apartment category to combine.");
                }

                // Zone and Ward must match for standalone apartments
                if (property.TaxZoneId != mainProperty.TaxZoneId ||
                    property.WardId != mainProperty.WardId)
                {
                    return (false, "All properties must be from the same Zone and Ward.");
                }
            }
        }

        return (true, null);
    }

    private async Task<(bool IsValid, string? ErrorMessage)> ValidateNonApartmentCategoryAsync(
        PropertyEntity mainProperty,
        List<PropertyEntity> combineProperties,
        CancellationToken cancellationToken)
    {
        // Non-apartment validation: caller already determined this is not an apartment property
        var combineCategoryIds = combineProperties
            .Where(p => p.CategoryId.HasValue)
            .Select(p => p.CategoryId.Value)
            .Distinct()
            .ToList();
        var combineCategories = await _categoryRepository.GetQueryable()
            .Where(c => combineCategoryIds.Contains(c.Id))
            .ToListAsync(cancellationToken);

        // Validate category for all combined properties
        foreach (var property in combineProperties)
        {
            var category = property.CategoryId.HasValue
                ? combineCategories.FirstOrDefault(c => c.Id == property.CategoryId.Value)
                : null;
            if (category == null || (category.PropertyCategoryName != null &&
                category.PropertyCategoryName.IndexOf(CapitalValueConstants.PropertyCategory.ApartmentKeyword, System.StringComparison.OrdinalIgnoreCase) >= 0))
            {
                return (false, "All properties must be of Non-Apartment category to combine.");
            }

            // Zone and Ward must match
            if (property.TaxZoneId != mainProperty.TaxZoneId ||
                property.WardId != mainProperty.WardId)
            {
                return (false, "All properties must be from the same Zone and Ward.");
            }
        }

        return (true, null);
    }

    private sealed class PropertyWingResolution
    {
        public HashSet<int> WingIds { get; } = new();
        public HashSet<int> SocietyIds { get; } = new();
        public HashSet<int> WingMasterIds { get; } = new();
        public HashSet<string> WingNames { get; } = new(StringComparer.OrdinalIgnoreCase);

        public bool HasWingOrSocietyDetails =>
            WingIds.Count > 0 || SocietyIds.Count > 0;
    }

    private async Task<Dictionary<int, PropertyWingResolution>> ResolveWingDetailsMapAsync(
        List<PropertyEntity> properties,
        CancellationToken cancellationToken)
    {
        var map = properties.ToDictionary(p => p.Id, _ => new PropertyWingResolution());

        // 1. Direct WingDetailId on PropertyMast
        var directWingIds = new HashSet<int>();
        foreach (var property in properties)
        {
            if (property.WingDetailId.HasValue)
            {
                map[property.Id].WingIds.Add(property.WingDetailId.Value);
                directWingIds.Add(property.WingDetailId.Value);
            }
        }

        // 2. Fetch societies linked to properties via SocietyDetailsMast.PropertyId (the new logic)
        var propertyIds = properties.Select(p => p.Id).Distinct().ToList();
        List<SocietyDetailsEntity> societiesByProperty = _societyRepository != null
            ? await _societyRepository.GetQueryable().AsNoTracking()
                .Where(s => s.PropertyId.HasValue && propertyIds.Contains(s.PropertyId.Value) && s.IsActive && !s.MarkedForDeletion)
                .ToListAsync(cancellationToken)
            : [];

        foreach (var s in societiesByProperty)
        {
            if (s.PropertyId.HasValue && map.TryGetValue(s.PropertyId.Value, out var resolution))
            {
                resolution.SocietyIds.Add(s.Id);
            }
        }

        // 3. Query WingDetailsMast to resolve:
        //    a) SocietyDetailsMastId & WingMasterId & WingName for direct WingDetailIds
        //    b) Wings belonging to societies found in step 2 (SocietyDetailsMastId == s.Id)
        if (_wingDetailsMastRepository != null)
        {
            var foundSocietyIds = societiesByProperty.Select(s => s.Id).Distinct().ToList();
            var relevantWings = await _wingDetailsMastRepository.GetQueryable().AsNoTracking()
                .Where(w => (directWingIds.Contains(w.Id) || foundSocietyIds.Contains(w.SocietyDetailsMastId)) &&
                            w.IsActive && !w.MarkedForDeletion)
                .ToListAsync(cancellationToken);

            var wingsById = relevantWings.ToDictionary(w => w.Id);
            var wingsBySocietyId = relevantWings
                .GroupBy(w => w.SocietyDetailsMastId)
                .ToDictionary(g => g.Key, g => g.ToList());

            foreach (var property in properties)
            {
                var resolution = map[property.Id];

                // Add wing info from direct WingDetailId
                if (property.WingDetailId.HasValue)
                {
                    if (wingsById.TryGetValue(property.WingDetailId.Value, out var directWing))
                    {
                        resolution.SocietyIds.Add(directWing.SocietyDetailsMastId);
                        resolution.WingMasterIds.Add(directWing.WingMasterId);
                        if (!string.IsNullOrWhiteSpace(directWing.WingName))
                        {
                            resolution.WingNames.Add(directWing.WingName);
                        }
                    }
                }
                else
                {
                    // Add wing info from SocietyDetailsMast when direct WingDetailId is not set
                    // (the new logic: PropertyId -> SocietyDetailsMast -> WingDetailsMast)
                    foreach (var socId in resolution.SocietyIds.ToList())
                    {
                        if (wingsBySocietyId.TryGetValue(socId, out var societyWings))
                        {
                            foreach (var sw in societyWings)
                            {
                                resolution.WingIds.Add(sw.Id);
                                resolution.WingMasterIds.Add(sw.WingMasterId);
                                if (!string.IsNullOrWhiteSpace(sw.WingName))
                                {
                                    resolution.WingNames.Add(sw.WingName);
                                }
                            }
                        }
                    }
                }
            }
        }

        return map;
    }

    private static bool IsSameWing(
        PropertyEntity mainProperty,
        PropertyEntity property,
        PropertyWingResolution mainWingRes,
        PropertyWingResolution propWingRes)
    {
        // Direct match on WingDetailId
        if (mainProperty.WingDetailId.HasValue && property.WingDetailId.HasValue &&
            mainProperty.WingDetailId.Value == property.WingDetailId.Value)
        {
            return true;
        }

        // Direct overlap on resolved WingDetail IDs (WingDetailsMast.Id)
        if (propWingRes.WingIds.Overlaps(mainWingRes.WingIds))
        {
            return true;
        }

        // Both belong to the same society AND have matching WingMasterId
        if (propWingRes.SocietyIds.Overlaps(mainWingRes.SocietyIds) &&
            propWingRes.WingMasterIds.Overlaps(mainWingRes.WingMasterIds))
        {
            return true;
        }

        // Both belong to the same society AND have matching WingName
        if (propWingRes.SocietyIds.Overlaps(mainWingRes.SocietyIds) &&
            propWingRes.WingNames.Overlaps(mainWingRes.WingNames))
        {
            return true;
        }

        return false;
    }
}