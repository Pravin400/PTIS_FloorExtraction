using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.PropertyNumberDetails;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

public class PropertyNumberDetailsService : IPropertyNumberDetailsService
{
    private readonly ILogger<PropertyNumberDetailsService> _logger;
    private readonly IRepository<PropertyEntity, int> _propertyRepository;
    private readonly IRepository<PropertyCategoryEntity, int> _propertyCategoryRepository;
    private readonly IRepository<WardEntity, int> _wardRepository;
    private readonly IRepository<WingDetailsMastEntity, int> _wingDetailsRepository;
    private readonly IRepository<WingEntity, int> _wingMasterRepository;
   
    public PropertyNumberDetailsService(
        ILogger<PropertyNumberDetailsService> logger,
        IRepository<PropertyEntity, int> propertyRepository,
        IRepository<PropertyCategoryEntity, int> propertyCategoryRepository,
        IRepository<WardEntity, int> wardRepository,
        IRepository<WingDetailsMastEntity, int> wingDetailsRepository,
        IRepository<WingEntity, int> wingMasterRepository)
    {
        _logger = logger;
        _propertyRepository = propertyRepository;
        _propertyCategoryRepository = propertyCategoryRepository;
        _wardRepository = wardRepository;
        _wingDetailsRepository = wingDetailsRepository;
        _wingMasterRepository = wingMasterRepository;
    }

    public async Task<PropertyNumberDetailsDto?> GetAsync(int propertyId, string filter, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Get Property Number Details. PropertyId: {PropertyId}, Filter: {Filter}", propertyId, filter);

        filter = filter?.Trim() ?? string.Empty;
        var isCurrentFilter = filter.Equals(PropertyNavigationConstants.Current, StringComparison.OrdinalIgnoreCase);
        var isNextFilter = filter.Equals(PropertyNavigationConstants.Next, StringComparison.OrdinalIgnoreCase);
        var isPreviousFilter = filter.Equals(PropertyNavigationConstants.Previous, StringComparison.OrdinalIgnoreCase);

        // GET CURRENT PROPERTY
        var current = await (
            from p in _propertyRepository.GetQueryable().AsNoTracking()
            join w in _wardRepository.GetQueryable().AsNoTracking()
                on p.WardId equals w.Id
            join c in _propertyCategoryRepository.GetQueryable().AsNoTracking()
                on p.CategoryId equals c.Id

            // LEFT JOIN WingDetailsMast
            join wdmTemp in _wingDetailsRepository.GetQueryable().AsNoTracking().Where(x => x.IsActive && x.MarkedForDeletion != true)
                on p.WingDetailId equals wdmTemp.Id into wdmGroup
            from wdm in wdmGroup.DefaultIfEmpty()

                // LEFT JOIN WingMaster
            join wmTemp in _wingMasterRepository.GetQueryable().AsNoTracking().Where(x => x.IsActive)
                on wdm.WingMasterId equals wmTemp.Id into wmGroup
            from wm in wmGroup.DefaultIfEmpty()

            where p.Id == propertyId
                  && p.IsActive
                  && p.MarkedForDeletion != true
                  && w.IsActive
                  && c.IsActive

            select new
            {
                p.Id,
                p.WardId,
                w.WardNo,
                p.PropertyNo,
                p.PartitionNo,
                p.FlatOrShopNo,
                p.WingDetailId,
                wm.WingNo,
                Category = c.PropertyCategoryName
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (current == null)
            return null;

        // CURRENT
        if (isCurrentFilter)
        {
            return new PropertyNumberDetailsDto
            {
                WardId = current.WardId,
                WardNo = current.WardNo ?? string.Empty,
                PropertyNo = current.PropertyNo ?? string.Empty,
                PartitionNo = current.PartitionNo ?? string.Empty,
                Category = current.Category ?? string.Empty,
                FlatOrShopNo = current.FlatOrShopNo ?? string.Empty,
                WingDetailId = current.WingDetailId,
                WingNo = current.WingNo ?? string.Empty,
                PropertyType = PropertyNavigationConstants.Current
            };
        }

        if (!isNextFilter && !isPreviousFilter)
            return null;

        var currentPropertyNo = current.PropertyNo?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(currentPropertyNo))
            return null;

        //var isApartment = current.Category is "Apartment" or "Multi Commercial Apartment";
        var isApartment = PropertyCategoryConstants.ApartmentCategoryNames.Any(x => string.Equals(x, current.Category, StringComparison.OrdinalIgnoreCase));

        // CACHE MAIN PROPERTY LIST This is loaded only when we actually need to move from one PropertyNo to another PropertyNo.
        List<PropertyNumberDetailsDto>? mainPropertiesCache = null;

        async Task<List<PropertyNumberDetailsDto>> GetMainPropertiesAsync()
        {
            if (mainPropertiesCache != null)
                return mainPropertiesCache;

            mainPropertiesCache = await (
                from p in _propertyRepository.GetQueryable().AsNoTracking()
                join w in _wardRepository.GetQueryable().AsNoTracking()
                    on p.WardId equals w.Id
                join c in _propertyCategoryRepository.GetQueryable().AsNoTracking()
                    on p.CategoryId equals c.Id
                where p.WardId == current.WardId
                      && p.IsActive
                      && p.MarkedForDeletion != true
                      && w.IsActive
                      && c.IsActive
                      // Main property only
                      && (p.PartitionNo == null ||
                          p.PartitionNo == "")
                      && p.PropertyNo != null
                      && p.PropertyNo != ""

                select new PropertyNumberDetailsDto
                {
                    WardId = p.WardId,
                    WardNo = w.WardNo ?? string.Empty,
                    PropertyNo = p.PropertyNo ?? string.Empty,
                    PartitionNo = p.PartitionNo ?? string.Empty,
                    Category = c.PropertyCategoryName ?? string.Empty,
                    FlatOrShopNo = p.FlatOrShopNo ?? string.Empty,
                    WingDetailId = p.WingDetailId
                })
                .ToListAsync(cancellationToken);

            return mainPropertiesCache;
        }

        // NATURAL PROPERTY NUMBER PARSER 47   => Number = 47, Suffix = "" 47A,  => Number = 47, Suffix = "A",  47B  => Number = 47, Suffix = "B"
        static (int Number, string Suffix) ParsePropertyNumber(string propertyNo)
        {
            propertyNo = propertyNo.Trim();
            var numericLength = 0;

            while (numericLength < propertyNo.Length && char.IsDigit(propertyNo[numericLength]))
            {
                numericLength++;
            }

            var numericPart = numericLength > 0 ? propertyNo[..numericLength] : string.Empty;
            var suffix = numericLength < propertyNo.Length ? propertyNo[numericLength..].Trim() : string.Empty;
            var number = int.TryParse(numericPart, out var parsedNumber) ? parsedNumber : int.MaxValue;
            return (number, suffix);
        }

        // GET NEXT / PREVIOUS MAIN PROPERTY
        async Task<PropertyNumberDetailsDto?> GetAdjacentMainPropertyAsync(bool getNext)
        {
            var mainProperties = await GetMainPropertiesAsync();
            if (mainProperties.Count == 0)
                return null;

            var orderedProperties = mainProperties
                .Select(x =>
                {
                    var rawPropertyNo = x.PropertyNo.Trim();
                    var parsed = ParsePropertyNumber(rawPropertyNo);
                    return new
                    {
                        Property = x,
                        Number = parsed.Number,
                        Suffix = parsed.Suffix,
                        RawPropertyNo = rawPropertyNo
                    };
                })
                .OrderBy(x => x.Number)
                .ThenBy(x => string.IsNullOrEmpty(x.Suffix) ? 0 : 1)
                .ThenBy(x => x.Suffix, StringComparer.OrdinalIgnoreCase)
                .ToList();

            var currentIndex = orderedProperties.FindIndex(x =>
                string.Equals(x.RawPropertyNo, currentPropertyNo, StringComparison.OrdinalIgnoreCase));

            if (currentIndex < 0)
                return null;

            // NEXT MAIN PROPERTY
            if (getNext)
            {
                var nextIndex = currentIndex + 1;
                if (nextIndex >= orderedProperties.Count)
                    return null;

                var next = orderedProperties[nextIndex].Property;
                next.PropertyType = PropertyNavigationConstants.Next;
                return next;
            }

            // PREVIOUS MAIN PROPERTY
            var previousIndex = currentIndex - 1;
            if (previousIndex < 0)
                return null;

            var previous = orderedProperties[previousIndex].Property;
            previous.PropertyType = PropertyNavigationConstants.Previous;
            return previous;
        }

        // APARTMENT
        if (isApartment)
        {
            var apartmentFlats = await (
                   from p in _propertyRepository.GetQueryable().AsNoTracking()
                   join w in _wardRepository.GetQueryable().AsNoTracking()
                       on p.WardId equals w.Id
                   join c in _propertyCategoryRepository.GetQueryable().AsNoTracking()
                       on p.CategoryId equals c.Id
                   // LEFT JOIN WingDetailsMast
                   join wdmTemp in _wingDetailsRepository.GetQueryable().AsNoTracking().Where(x => x.IsActive && x.MarkedForDeletion != true)
                       on p.WingDetailId equals wdmTemp.Id into wdmGroup
                   from wdm in wdmGroup.DefaultIfEmpty()
                       // LEFT JOIN WingMaster
                   join wmTemp in _wingMasterRepository.GetQueryable().AsNoTracking().Where(x => x.IsActive)
                       on wdm.WingMasterId equals wmTemp.Id into wmGroup
                   from wm in wmGroup.DefaultIfEmpty()

                   where p.WardId == current.WardId
                         && p.PropertyNo == current.PropertyNo
                         && p.IsActive
                         && p.MarkedForDeletion != true
                         && w.IsActive
                         && c.IsActive
                         && p.FlatOrShopNo != null
                         && p.FlatOrShopNo != ""

                   select new
                   {
                       PropertyId = p.Id,
                       Dto = new PropertyNumberDetailsDto
                       {
                           WardId = p.WardId,
                           WardNo = w.WardNo ?? string.Empty,
                           PropertyNo = p.PropertyNo ?? string.Empty,
                           PartitionNo = p.PartitionNo ?? string.Empty,
                           Category = c.PropertyCategoryName ?? string.Empty,
                           FlatOrShopNo = p.FlatOrShopNo ?? string.Empty,
                           WingDetailId = p.WingDetailId,
                           WingNo = wm != null ? wm.WingNo ?? string.Empty : string.Empty
                       },
                       WingNo = wm != null ? wm.WingNo ?? string.Empty : string.Empty
                   })
                   .ToListAsync(cancellationToken);

            // ORDER:
            var orderedApartmentFlats = apartmentFlats
                .OrderBy(x => string.IsNullOrWhiteSpace(x.WingNo) ? 1 : 0)
                .ThenBy(x => x.WingNo, StringComparer.OrdinalIgnoreCase)
                .ThenBy(x => GetNumericFlatOrShopNo(x.Dto.FlatOrShopNo))
                .ThenBy(x => x.Dto.FlatOrShopNo, StringComparer.OrdinalIgnoreCase)
                .ThenBy(x => x.Dto.PartitionNo, StringComparer.OrdinalIgnoreCase)
                .ToList();


            // CURRENT IS MAIN APARTMENT PROPERTY
            if (string.IsNullOrWhiteSpace(current.FlatOrShopNo))
            {
                // PREVIOUS FROM MAIN PROPERTY
                if (isPreviousFilter)
                {
                    return await GetAdjacentMainPropertyAsync(getNext: false);
                }
                // NEXT FROM MAIN PROPERTY Go to first flat of first Wing (A)
                if (isNextFilter)
                {
                    var firstFlat = orderedApartmentFlats.FirstOrDefault();
                    if (firstFlat != null)
                    {
                        firstFlat.Dto.PropertyType = PropertyNavigationConstants.Next;
                        return firstFlat.Dto;
                    }
                    // No flats exist in any wing
                    return await GetAdjacentMainPropertyAsync(getNext: true);
                }
                return null;
            }

            // CURRENT IS APARTMENT FLAT Find exact current property in ordered A -> B -> C list
            var currentIndex = orderedApartmentFlats.FindIndex(x => x.PropertyId == current.Id);

            if (currentIndex < 0)
                return null;

            // NEXT
            if (isNextFilter)
            {
                var nextIndex = currentIndex + 1;
                // Next flat exists either: same wing OR next wing
                if (nextIndex < orderedApartmentFlats.Count)
                {
                    var nextFlat = orderedApartmentFlats[nextIndex].Dto;
                    nextFlat.PropertyType = PropertyNavigationConstants.Next;
                    return nextFlat;
                }

                // Last flat of last wing reached. Move to next PropertyNo.
                return await GetAdjacentMainPropertyAsync(getNext: true);
            }

            // PREVIOUS
            if (isPreviousFilter)
            {
                var previousIndex = currentIndex - 1;
                // Previous flat exists either: same wing OR previous wing
                if (previousIndex >= 0)
                {
                    var previousFlat = orderedApartmentFlats[previousIndex].Dto;
                    previousFlat.PropertyType = PropertyNavigationConstants.Previous;
                    return previousFlat;
                }

                // We are on first flat of first wing. Return main apartment property.
                return new PropertyNumberDetailsDto
                {
                    WardId = current.WardId,
                    WardNo = current.WardNo ?? string.Empty,
                    PropertyNo = current.PropertyNo ?? string.Empty,
                    PartitionNo = string.Empty,
                    Category = current.Category ?? string.Empty,
                    FlatOrShopNo = string.Empty,
                    WingDetailId = current.WingDetailId,
                    WingNo = current.WingNo ?? string.Empty,
                    PropertyType = PropertyNavigationConstants.Previous
                };
            }
            return null;
        }

        // NORMAL / INDIVIDUAL
        if (isNextFilter)
        {
            return await GetAdjacentMainPropertyAsync(getNext: true);
        }
        if (isPreviousFilter)
        {
            return await GetAdjacentMainPropertyAsync(getNext: false);
        }
        return null;
    }

    static int GetNumericFlatOrShopNo(string? flatOrShopNo)
    {
        if (string.IsNullOrWhiteSpace(flatOrShopNo))
            return int.MaxValue;

        var digits = new string(flatOrShopNo.Where(char.IsDigit).ToArray());
        return int.TryParse(digits, out var number) ? number : int.MaxValue;
    }
}
