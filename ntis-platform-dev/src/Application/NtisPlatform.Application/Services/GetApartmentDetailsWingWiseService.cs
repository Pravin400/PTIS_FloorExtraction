using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Property.ApartmentQC;
using NtisPlatform.Application.Helpers;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

/// <summary>
/// Application service for retrieving apartment details filtered wing-wise and property-wise.
/// Uses generic <see cref="IRepository{T, TKey}"/> interfaces for table access (following DataEntryService architecture),
/// comparing New Survey and Old Survey property details via PropertyMapDetail table mapping.
/// </summary>
public class GetApartmentDetailsWingWiseService : IGetApartmentDetailsWingWiseService
{
    private readonly IRepository<PropertyEntity, int> _propertyRepository;
    private readonly IRepository<PropertyCategoryEntity, int> _categoryRepository;
    private readonly IRepository<PropertyTypeMasterEntity, int> _propertyTypeRepository;
    private readonly IRepository<PropertyAssessmentEntity, int> _assessmentRepository;
    private readonly IRepository<SocietyDetailsEntity, int> _societyRepository;
    private readonly IRepository<WingDetailsMastEntity, int> _wingDetailsMastRepository;
    private readonly IRepository<WardEntity, int> _wardRepository;
    private readonly IRepository<ZoneEntity, int> _zoneRepository;
    private readonly IRepository<PropertyDetailsEntity, int> _propertyDetailsRepository;
    private readonly IRepository<FloorEntity, int> _floorRepository;
    private readonly IRepository<ConstructionTypeEntity, int> _constructionTypeRepository;
    private readonly IRepository<TypeOfUseEntity, int> _typeOfUseRepository;
    private readonly IRepository<SubTypeOfUseEntity, int> _subTypeOfUseRepository;
    private readonly IRepository<PropertyMastOldEntity, int> _oldPropertyRepository;
    private readonly IRepository<PropertyMapDetailEntity, int> _propertyMapDetailRepository;
    private readonly IRepository<TransMastEntity, int> _transMastRepository;
    private readonly IRepository<TaxMasterEntity, int> _taxMasterRepository;
    private readonly IRepository<YearMasterEntity, int> _yearMasterRepository;
    private readonly IRepository<PolicyCodeMasterEntity, int> _policyCodeMasterRepository;
    private readonly IRepository<PolicyTaxDetailsEntity, int> _policyTaxDetailsRepository;
    private readonly IRepository<PolicyTaxDetailsCVEntity, int> _policyTaxDetailsCVRepository;
    private readonly IRepository<PolicyConfigurationEntity, int> _policyConfigurationRepository;
    private readonly IRepository<PropertyPhotoEntity, int> _photoRepository;
    private readonly IRepository<PropertyPhotoOldEntity, int> _photoOldRepository;
    private readonly IRepository<PropertyPhotoTypeEntity, int> _photoTypeRepository;
    private readonly IRepository<DocumentBindingEntity, int> _documentBindingRepository;
    private readonly IRepository<DocumentEntity, int> _documentRepository;
    private readonly IRepository<TransMastOldEntity, int>? _transMastOldRepository;
    private readonly IRepository<PropertyDetailsOldEntity, int>? _oldPropertyDetailsRepository;
    private readonly IRepository<RVCalculationResultsEntity, int>? _rvCalculationResultsRepository;
    private readonly IRepository<PropertyCertificateEntity, int>? _certificateRepository;
    private readonly IRepository<PropertyCertificateTypeMasterEntity, int>? _certificateTypeRepository;
    private readonly IRepository<RenterMastEntity, int>? _renterRepository;
    private readonly IApartmentSortOrderCache? _sortOrderCache;
    private readonly IMapper _mapper;

    public GetApartmentDetailsWingWiseService(
        IRepository<PropertyEntity, int> propertyRepository,
        IRepository<PropertyCategoryEntity, int> categoryRepository,
        IRepository<PropertyTypeMasterEntity, int> propertyTypeRepository,
        IRepository<PropertyAssessmentEntity, int> assessmentRepository,
        IRepository<SocietyDetailsEntity, int> societyRepository,
        IRepository<WingDetailsMastEntity, int> wingDetailsMastRepository,
        IRepository<WardEntity, int> wardRepository,
        IRepository<ZoneEntity, int> zoneRepository,
        IRepository<PropertyDetailsEntity, int> propertyDetailsRepository,
        IRepository<FloorEntity, int> floorRepository,
        IRepository<ConstructionTypeEntity, int> constructionTypeRepository,
        IRepository<TypeOfUseEntity, int> typeOfUseRepository,
        IRepository<SubTypeOfUseEntity, int> subTypeOfUseRepository,
        IRepository<PropertyMastOldEntity, int> oldPropertyRepository,
        IRepository<PropertyMapDetailEntity, int> propertyMapDetailRepository,
        IRepository<TransMastEntity, int> transMastRepository,
        IRepository<TaxMasterEntity, int> taxMasterRepository,
        IRepository<YearMasterEntity, int> yearMasterRepository,
        IRepository<PolicyCodeMasterEntity, int> policyCodeMasterRepository,
        IRepository<PolicyTaxDetailsEntity, int> policyTaxDetailsRepository,
        IRepository<PolicyTaxDetailsCVEntity, int> policyTaxDetailsCVRepository,
        IRepository<PolicyConfigurationEntity, int> policyConfigurationRepository,
        IRepository<PropertyPhotoEntity, int> photoRepository,
        IRepository<PropertyPhotoOldEntity, int> photoOldRepository,
        IRepository<PropertyPhotoTypeEntity, int> photoTypeRepository,
        IRepository<DocumentBindingEntity, int> documentBindingRepository,
        IRepository<DocumentEntity, int> documentRepository,
        IMapper mapper,
        IRepository<TransMastOldEntity, int>? transMastOldRepository = null,
        IRepository<PropertyDetailsOldEntity, int>? oldPropertyDetailsRepository = null,
        IRepository<RVCalculationResultsEntity, int>? rvCalculationResultsRepository = null,
        IRepository<PropertyCertificateEntity, int>? certificateRepository = null,
        IRepository<PropertyCertificateTypeMasterEntity, int>? certificateTypeRepository = null,
        IRepository<RenterMastEntity, int>? renterRepository = null,
        IApartmentSortOrderCache? sortOrderCache = null)
    {
        _propertyRepository = propertyRepository;
        _categoryRepository = categoryRepository;
        _propertyTypeRepository = propertyTypeRepository;
        _assessmentRepository = assessmentRepository;
        _societyRepository = societyRepository;
        _wingDetailsMastRepository = wingDetailsMastRepository;
        _wardRepository = wardRepository;
        _zoneRepository = zoneRepository;
        _propertyDetailsRepository = propertyDetailsRepository;
        _floorRepository = floorRepository;
        _constructionTypeRepository = constructionTypeRepository;
        _typeOfUseRepository = typeOfUseRepository;
        _subTypeOfUseRepository = subTypeOfUseRepository;
        _oldPropertyRepository = oldPropertyRepository;
        _propertyMapDetailRepository = propertyMapDetailRepository;
        _transMastRepository = transMastRepository;
        _taxMasterRepository = taxMasterRepository;
        _yearMasterRepository = yearMasterRepository;
        _policyCodeMasterRepository = policyCodeMasterRepository;
        _policyTaxDetailsRepository = policyTaxDetailsRepository;
        _policyTaxDetailsCVRepository = policyTaxDetailsCVRepository;
        _policyConfigurationRepository = policyConfigurationRepository;
        _photoRepository = photoRepository;
        _photoOldRepository = photoOldRepository;
        _photoTypeRepository = photoTypeRepository;
        _documentBindingRepository = documentBindingRepository;
        _documentRepository = documentRepository;
        _transMastOldRepository = transMastOldRepository;
        _oldPropertyDetailsRepository = oldPropertyDetailsRepository;
        _rvCalculationResultsRepository = rvCalculationResultsRepository;
        _certificateRepository = certificateRepository;
        _certificateTypeRepository = certificateTypeRepository;
        _renterRepository = renterRepository;
        _sortOrderCache = sortOrderCache;
        _mapper = mapper;
    }

    // Photo type codes: the screen uses the property photo (front) and the plan; older data used PROPERTY_PHOTO / PLAN_PHOTO.
    private static readonly string[] ImagePhotoTypeCodes = { "PROPERTY_PHOTO", "PROPERTY_FRONT" };
    private static readonly string[] PlanPhotoTypeCodes = { "PLAN_PHOTO", "PROPERTY_PLAN" };

    /// <summary>
    /// The society of each property: the society the property itself is (main row), else the society of its wing.
    /// </summary>
    private async Task<Dictionary<int, int>> ResolveSocietyIdsAsync(
        IReadOnlyList<(int PropertyId, int? WingDetailId)> properties,
        CancellationToken cancellationToken)
    {
        var result = new Dictionary<int, int>();
        if (properties.Count == 0) return result;

        var propertyIds = properties.Select(p => p.PropertyId).Distinct().ToList();
        var wingIds = properties.Where(p => p.WingDetailId.HasValue).Select(p => p.WingDetailId!.Value).Distinct().ToList();

        var societyByMainProperty = await _societyRepository.GetQueryable().AsNoTracking()
            .Where(s => s.PropertyId.HasValue && propertyIds.Contains(s.PropertyId.Value) && s.IsActive && !s.MarkedForDeletion)
            .Select(s => new { PropertyId = s.PropertyId!.Value, SocietyId = s.Id })
            .ToListAsync(cancellationToken);
        var societyByWing = wingIds.Count == 0
            ? new Dictionary<int, int>()
            : await _wingDetailsMastRepository.GetQueryable().AsNoTracking()
                .Where(w => wingIds.Contains(w.Id) && w.IsActive && !w.MarkedForDeletion)
                .Select(w => new { w.Id, w.SocietyDetailsMastId })
                .ToDictionaryAsync(w => w.Id, w => w.SocietyDetailsMastId, cancellationToken);

        var mainSocietyLookup = societyByMainProperty.GroupBy(x => x.PropertyId).ToDictionary(g => g.Key, g => g.First().SocietyId);
        foreach (var (propertyId, wingDetailId) in properties)
        {
            if (mainSocietyLookup.TryGetValue(propertyId, out var mainSociety)) result[propertyId] = mainSociety;
            else if (wingDetailId.HasValue && societyByWing.TryGetValue(wingDetailId.Value, out var wingSociety)) result[propertyId] = wingSociety;
        }

        return result;
    }

    /// <summary>
    /// The plan of every unit. A unit shows its own plan (a PROPERTY_PLAN saved against the property), otherwise the shared plan
    /// of its society / wing and its apartment Type (PropertyMast.Type): the plan row has no PropertyId, the same Type and is
    /// Plan 1 (DisplayOrder 1) - the same rule the property photo screen uses.
    /// </summary>
    private async Task<Dictionary<int, Guid>> LoadSharedPlanDocumentsAsync(
        IReadOnlyList<(int PropertyId, int? WingDetailId, string? Type)> units,
        IReadOnlyDictionary<int, int> societyByProperty,
        CancellationToken cancellationToken)
    {
        var result = new Dictionary<int, Guid>();
        var typed = units.Where(u => !string.IsNullOrWhiteSpace(u.Type)).ToList();
        if (typed.Count == 0) return result;

        var societyIds = societyByProperty.Values.Distinct().ToList();
        var wingIds = typed.Where(u => u.WingDetailId.HasValue).Select(u => u.WingDetailId!.Value).Distinct().ToList();
        var types = typed.Select(u => u.Type!.Trim()).Distinct().ToList();

        var shared = await (
            from pp in _photoRepository.GetQueryable().AsNoTracking()
            where pp.IsActive && !pp.MarkedForDeletion && pp.IsLatest && !pp.PropertyId.HasValue
                  && pp.Type != null && types.Contains(pp.Type)
                  && (pp.DisplayOrder == null || pp.DisplayOrder <= 1)
                  && ((pp.SocietyDetailId.HasValue && societyIds.Contains(pp.SocietyDetailId.Value))
                      || (pp.WingDetailId.HasValue && wingIds.Contains(pp.WingDetailId.Value)))
            join ppt in _photoTypeRepository.GetQueryable().AsNoTracking() on pp.PhotoTypeId equals ppt.Id
            where ppt.IsActive && PlanPhotoTypeCodes.Contains(ppt.PhotoTypeCode)
            join db in _documentBindingRepository.GetQueryable().AsNoTracking() on pp.DocumentBindingId equals db.Id
            where db.IsActive
            join d in _documentRepository.GetQueryable().AsNoTracking() on db.DocumentId equals d.Id
            where d.IsActive && !d.MarkedForDeletion
            select new { pp.Type, pp.SocietyDetailId, pp.WingDetailId, d.DocumentGuid, CreatedDate = pp.CreatedDate }
        ).ToListAsync(cancellationToken);

        foreach (var (propertyId, wingDetailId, type) in typed)
        {
            var wanted = type!.Trim();
            societyByProperty.TryGetValue(propertyId, out var societyId);
            var match = shared
                .Where(x => string.Equals(x.Type?.Trim(), wanted, StringComparison.OrdinalIgnoreCase)
                            && ((wingDetailId.HasValue && x.WingDetailId == wingDetailId.Value)
                                || (societyId != 0 && x.SocietyDetailId == societyId)))
                .OrderByDescending(x => x.CreatedDate ?? DateTime.MinValue)
                .FirstOrDefault();
            if (match != null) result[propertyId] = match.DocumentGuid;
        }

        return result;
    }

    /// <summary>The first photo whose type code is in <paramref name="codes"/>, in the order of the codes (front photo / plan first).</summary>
    private static Guid? FirstPhotoOfType(IReadOnlyCollection<PropertyPhotoDocumentDto> photos, IEnumerable<string> codes)
        => codes
            .Select(code => photos.FirstOrDefault(x => string.Equals(x.PhotoTypeCode, code, StringComparison.OrdinalIgnoreCase))?.DocumentGuid)
            .FirstOrDefault(guid => guid != null);

    private sealed record RenterInfo(string? Name, string? NameEnglish, decimal? Monthly, decimal? Yearly);

    /// <summary>
    /// The renter and the rent of every property. Per detail row the latest active renter counts (as in the RV calculation:
    /// the yearly rent is FinalYearlyRent, or the monthly rent x 12 when that is not set); a property with several detail rows
    /// adds them up and shows the name of the latest renter.
    /// </summary>
    private async Task<Dictionary<int, RenterInfo>> LoadRentersAsync(
        IReadOnlyList<FetchDetailRowDto> details,
        CancellationToken cancellationToken)
    {
        var result = new Dictionary<int, RenterInfo>();
        if (_renterRepository == null || details.Count == 0) return result;

        var propertyByDetail = details.GroupBy(d => d.Id).ToDictionary(g => g.Key, g => g.First().PropertyId);
        var detailIds = propertyByDetail.Keys.ToList();

        var renters = await _renterRepository.GetQueryable().AsNoTracking()
            .Where(r => detailIds.Contains(r.PropertyDetailsId) && r.IsActive && !r.MarkedForDeletion)
            .Select(r => new { r.PropertyDetailsId, r.RenterName, r.RenterNameEnglish, r.RentMonthly, r.FinalYearlyRent, r.CreatedDate })
            .ToListAsync(cancellationToken);

        var latestPerDetail = renters
            .GroupBy(r => r.PropertyDetailsId)
            .Select(g => g.OrderByDescending(r => r.CreatedDate).First())
            .ToList();

        foreach (var group in latestPerDetail.GroupBy(r => propertyByDetail[r.PropertyDetailsId]))
        {
            var monthly = group.Sum(r => r.RentMonthly ?? 0d);
            var yearly = group.Sum(r => r.FinalYearlyRent > 0 ? r.FinalYearlyRent!.Value : (r.RentMonthly ?? 0d) * 12d);
            var latest = group.OrderByDescending(r => r.CreatedDate).First();

            result[group.Key] = new RenterInfo(
                string.IsNullOrWhiteSpace(latest.RenterName) ? null : latest.RenterName.Trim(),
                string.IsNullOrWhiteSpace(latest.RenterNameEnglish) ? null : latest.RenterNameEnglish.Trim(),
                monthly > 0 ? (decimal?)Math.Round((decimal)monthly, 2) : null,
                yearly > 0 ? (decimal?)Math.Round((decimal)yearly, 2) : null);
        }

        return result;
    }

    private sealed record OccupancyCertificateInfo(string? CertificateNo, DateTime? IssueDate);

    /// <summary>
    /// The OC (Occupancy Certificate) number and issue date for each property: its own certificate (EntityType P, no floor), else the
    /// certificate of its wing (W), else of its society (S). The most specific certificate that carries a number or a date wins;
    /// a certificate without either (saved only as "Issued") shows nothing.
    /// </summary>
    private async Task<Dictionary<int, OccupancyCertificateInfo>> LoadOccupancyCertificatesAsync(
        IReadOnlyList<(int PropertyId, int? WingDetailId)> properties,
        IReadOnlyDictionary<int, int> societyByProperty,
        CancellationToken cancellationToken)
    {
        var result = new Dictionary<int, OccupancyCertificateInfo>();
        if (_certificateRepository == null || _certificateTypeRepository == null || properties.Count == 0)
            return result;

        var ocTypeId = await _certificateTypeRepository.GetQueryable().AsNoTracking()
            .Where(t => t.IsActive && t.CertificateTypeCode == "OC")
            .Select(t => (int?)t.Id)
            .FirstOrDefaultAsync(cancellationToken);
        if (!ocTypeId.HasValue) return result;

        var propertyIds = properties.Select(p => p.PropertyId).Distinct().ToList();
        var wingIds = properties.Where(p => p.WingDetailId.HasValue).Select(p => p.WingDetailId!.Value).Distinct().ToList();

        var societyIds = societyByProperty.Values.Distinct().ToList();

        var certificates = await _certificateRepository.GetQueryable().AsNoTracking()
            .Where(c => c.CertificateTypeId == ocTypeId.Value && !c.MarkedForDeletion
                        && ((c.EntityType == "P" && c.PropertyDetailsId == null && c.PropertyId.HasValue && propertyIds.Contains(c.PropertyId.Value))
                            || (c.EntityType == "W" && c.WingDetailId.HasValue && wingIds.Contains(c.WingDetailId.Value))
                            || (c.EntityType == "S" && c.SocietyDetailId.HasValue && societyIds.Contains(c.SocietyDetailId.Value))))
            .OrderByDescending(c => c.CreatedDate)
            .Select(c => new { c.EntityType, c.PropertyId, c.WingDetailId, c.SocietyDetailId, c.CertificateNo, c.IssueDate })
            .ToListAsync(cancellationToken);

        static bool HasData(string? no, DateTime? date) => !string.IsNullOrWhiteSpace(no) || date.HasValue;
        OccupancyCertificateInfo? Latest(IEnumerable<(string? No, DateTime? Date)> source)
        {
            foreach (var (no, date) in source)
                if (HasData(no, date)) return new OccupancyCertificateInfo(string.IsNullOrWhiteSpace(no) ? null : no.Trim(), date);
            return null;
        }

        foreach (var (propertyId, wingDetailId) in properties)
        {
            var own = Latest(certificates.Where(c => c.EntityType == "P" && c.PropertyId == propertyId).Select(c => (c.CertificateNo, c.IssueDate)));
            var wing = wingDetailId.HasValue
                ? Latest(certificates.Where(c => c.EntityType == "W" && c.WingDetailId == wingDetailId.Value).Select(c => (c.CertificateNo, c.IssueDate)))
                : null;

            int? societyId = societyByProperty.TryGetValue(propertyId, out var resolvedSociety) ? resolvedSociety : null;
            var society = societyId.HasValue
                ? Latest(certificates.Where(c => c.EntityType == "S" && c.SocietyDetailId == societyId.Value).Select(c => (c.CertificateNo, c.IssueDate)))
                : null;

            var chosen = own ?? wing ?? society;
            if (chosen != null) result[propertyId] = chosen;
        }

        return result;
    }

    public async Task<PagedResult<ApartmentQCComparisonDto>> GetApartmentDetailsWingWiseAsync(
        GetApartmentDetailsWingWiseQueryParameters query,
        CancellationToken cancellationToken = default)
    {
        // ── 1. Category Query (Upfront ID resolution to eliminate correlated subquery) ──────
        var apartmentCategoryIds = await _categoryRepository.GetQueryable().AsNoTracking()
            .Where(pcm => PropertyCategoryConstants.ApartmentCategoryNames.Contains(pcm.PropertyCategoryName) && pcm.IsActive)
            .Select(pcm => pcm.Id)
            .ToListAsync(cancellationToken);

        if (apartmentCategoryIds.Count == 0)
        {
            return new PagedResult<ApartmentQCComparisonDto>(
                Array.Empty<ApartmentQCComparisonDto>(), 0, query.PageNumber, query.PageSize);
        }

        var baseQuery = _propertyRepository.GetQueryable()
            .AsNoTracking()
            .Where(pm => pm.IsActive && !pm.MarkedForDeletion && pm.CategoryId.HasValue && apartmentCategoryIds.Contains(pm.CategoryId.Value));

        var searchedProperty = query.PropertyId.HasValue ? await _propertyRepository.GetByIdAsync(query.PropertyId.Value, cancellationToken) : null;

        if (query.WingDetailId.HasValue)
        {
            baseQuery = baseQuery.Where(pm => pm.WingDetailId == query.WingDetailId.Value);
        }
        else if (query.PropertyId.HasValue && searchedProperty != null)
        {
            var targetPropertyNo = searchedProperty.PropertyNo;
            var targetWardId = searchedProperty.WardId;
            var societyQuery = _societyRepository.GetQueryable().AsNoTracking();
            var wingDetailsMastQuery = _wingDetailsMastRepository.GetQueryable().AsNoTracking();
            var propertyQuery = _propertyRepository.GetQueryable().AsNoTracking();

            baseQuery = baseQuery.Where(pm =>
                pm.Id == query.PropertyId.Value
                || (pm.WingDetailId.HasValue && wingDetailsMastQuery.Any(wdm =>
                    wdm.Id == pm.WingDetailId.Value && wdm.IsActive && !wdm.MarkedForDeletion &&
                    societyQuery.Any(s => s.Id == wdm.SocietyDetailsMastId && s.IsActive && !s.MarkedForDeletion &&
                        propertyQuery.Any(sp => sp.Id == s.PropertyId && sp.PropertyNo == targetPropertyNo && sp.WardId == targetWardId && sp.IsActive && !sp.MarkedForDeletion))))
            );
        }

        if (query.WingId.HasValue)
        {
            var societyQuery = _societyRepository.GetQueryable().AsNoTracking();
            var wingDetailsMastQuery = _wingDetailsMastRepository.GetQueryable().AsNoTracking();

            baseQuery = baseQuery.Where(pm =>
                (pm.WingDetailId.HasValue && wingDetailsMastQuery.Any(wdm => wdm.Id == pm.WingDetailId.Value && wdm.IsActive && !wdm.MarkedForDeletion && wdm.WingMasterId == query.WingId.Value))
                ||
                societyQuery.Any(s => s.PropertyId == pm.Id && s.IsActive && !s.MarkedForDeletion &&
                    wingDetailsMastQuery.Any(wdm => wdm.SocietyDetailsMastId == s.Id && wdm.IsActive && !wdm.MarkedForDeletion && wdm.WingMasterId == query.WingId.Value))
            );
        }

        if (!string.IsNullOrWhiteSpace(query.SearchTerm))
        {
            var search = query.SearchTerm.Trim();
            baseQuery = baseQuery.Where(pm =>
                (pm.PropertyNo != null && pm.PropertyNo.Contains(search)) ||
                (pm.OwnerName != null && pm.OwnerName.Contains(search)) ||
                (pm.OwnerNameEnglish != null && pm.OwnerNameEnglish.Contains(search)) ||
                (pm.FlatOrShopNo != null && pm.FlatOrShopNo.Contains(search)) ||
                (pm.FlatOrShopNoEnglish != null && pm.FlatOrShopNoEnglish.Contains(search)));
        }

        // ── 2. Projection Join (Left join to prevent row dropping when PropertyTypeId is null) ──
        var ptmQuery = _propertyTypeRepository.GetQueryable().AsNoTracking();

        var joined =
            from pm in baseQuery
            join ptm in ptmQuery on pm.PropertyTypeId equals ptm.Id into ptmJ
            from ptm in ptmJ.DefaultIfEmpty()
            select new JoinedPropertyRowDto
            {
                Id = pm.Id,
                TaxZoneId = pm.TaxZoneId,
                WardId = pm.WardId,
                PropertyNo = pm.PropertyNo ?? string.Empty,
                PartitionNo = pm.PartitionNo,
                MobileNo = pm.MobileNo,
                EmailId = pm.EmailId,
                FlatOrShopNo = pm.FlatOrShopNo,
                FlatOrShopName = pm.FlatOrShopName,
                FlatOrShopNoEnglish = pm.FlatOrShopNoEnglish,
                FlatOrShopNameEnglish = pm.FlatOrShopNameEnglish,
                OwnerName = pm.OwnerName,
                OwnerNameEnglish = pm.OwnerNameEnglish,
                OccupierName = pm.OccupierName,
                OccupierNameEnglish = pm.OccupierNameEnglish,
                PartType = ptm != null ? ptm.PartType : null,
                PropertyType = ptm != null ? ptm.Id : 0,
                PropertyTypeName = ptm != null ? ptm.PropertyDescription : null,
                WingDetailId = pm.WingDetailId,
                ApartmentType = pm.Type
            };

        // ── 3. Pagination (Fast Base Query Count) ───────────────────────────
        var totalCount = await baseQuery.CountAsync(cancellationToken);
        if (totalCount == 0)
        {
            return new PagedResult<ApartmentQCComparisonDto>(
                Array.Empty<ApartmentQCComparisonDto>(), 0, query.PageNumber, query.PageSize);
        }

        var sort = ApartmentSortSpec.TryParse(query.SortBy, query.SortOrder);
        if (sort != null)
        {
            return await GetSortedPageAsync(query, sort, joined, cancellationToken);
        }

        var (pageNumber, pageSize, skip) =
            PagingGuard.Normalize(query.PageNumber, query.PageSize, totalCount);

        var rawRows = await joined
            .OrderBy(x => x.Id)
            .Skip(skip)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var built = await BuildComparisonsAsync(rawRows, cancellationToken);
        var finalComparisons = AggregateByOldProperty(built).Select(g => g.Row).ToList();

        return new PagedResult<ApartmentQCComparisonDto>(finalComparisons, totalCount, pageNumber, pageSize);
    }

    /// <summary>How many properties are enriched (one set of queries) at a time while the whole list is built for a sort.</summary>
    private const int SortBuildChunkSize = 300;

    /// <summary>
    /// A page of the list in the order of a column. The order has to be that of ALL the units (the columns are computed values:
    /// tax, RV, the old assessment ...), so the units are enriched in chunks, grouped like the unsorted list, ordered, and the page is cut from that.
    /// The order is kept for a short time (property ids only) so the next pages of the same sort do not rebuild every unit; page 1 always recomputes.
    /// </summary>
    private async Task<PagedResult<ApartmentQCComparisonDto>> GetSortedPageAsync(
        GetApartmentDetailsWingWiseQueryParameters query,
        ApartmentSortSpec sort,
        IQueryable<JoinedPropertyRowDto> joined,
        CancellationToken cancellationToken)
    {
        var cacheKey = $"{query.PropertyId}|{query.WingId}|{query.WingDetailId}|{query.SearchTerm?.Trim()}|{sort.CacheKey}";

        if (query.PageNumber > 1 && _sortOrderCache != null && _sortOrderCache.TryGet(cacheKey, out var cachedGroups) && cachedGroups.Count > 0)
        {
            var (cachedPage, cachedSize, cachedSkip) = PagingGuard.Normalize(query.PageNumber, query.PageSize, cachedGroups.Count);
            var pageGroups = cachedGroups.Skip(cachedSkip).Take(cachedSize).ToList();
            var pageIds = pageGroups.SelectMany(g => g).ToList();
            var position = pageIds.Select((id, index) => (id, index)).ToDictionary(x => x.id, x => x.index);

            var pageRows = (await joined.Where(x => pageIds.Contains(x.Id)).ToListAsync(cancellationToken))
                .OrderBy(x => position[x.Id])
                .ToList();
            var pageBuilt = await BuildComparisonsAsync(pageRows, cancellationToken);
            var pageResult = AggregateByOldProperty(pageBuilt).Select(g => g.Row).ToList();
            return new PagedResult<ApartmentQCComparisonDto>(pageResult, cachedGroups.Count, cachedPage, cachedSize);
        }

        var allRows = await joined.OrderBy(x => x.Id).ToListAsync(cancellationToken);
        var built = new List<(int PropertyId, ApartmentQCComparisonDto Row)>(allRows.Count);
        for (var offset = 0; offset < allRows.Count; offset += SortBuildChunkSize)
        {
            built.AddRange(await BuildComparisonsAsync(allRows.Skip(offset).Take(SortBuildChunkSize).ToList(), cancellationToken));
        }

        var groups = AggregateByOldProperty(built);
        var order = ApartmentComparisonSorter.OrderOf(groups.Select(g => g.Row).ToList(), sort);
        var sorted = order.Select(i => groups[i]).ToList();

        _sortOrderCache?.Set(cacheKey, sorted.Select(g => g.MemberIds.ToArray()).ToList());

        var (pageNumber, pageSize, skip) = PagingGuard.Normalize(query.PageNumber, query.PageSize, sorted.Count);
        var rows = sorted.Skip(skip).Take(pageSize).Select(g => g.Row).ToList();
        return new PagedResult<ApartmentQCComparisonDto>(rows, sorted.Count, pageNumber, pageSize);
    }

    /// <summary>One comparison (new survey, old survey, difference) for each of the given new properties, in their order.</summary>
    private async Task<List<(int PropertyId, ApartmentQCComparisonDto Row)>> BuildComparisonsAsync(
        List<JoinedPropertyRowDto> rawRows,
        CancellationToken cancellationToken)
    {
        var propertyIds = rawRows.Select(r => r.Id).ToList();
        var wardIds = rawRows.Select(r => r.WardId).Distinct().ToList();

        // ── 4. Post-Pagination BHK and Wing Resolution ─────────────────────
        var bhkLookup = await _assessmentRepository.GetQueryable().AsNoTracking()
            .Where(d => propertyIds.Contains(d.PropertyId) && d.IsActive && !d.MarkedForDeletion)
            .GroupBy(d => d.PropertyId)
            .Select(g => new { PropertyId = g.Key, BHK = g.OrderByDescending(d => d.CreatedDate).Select(d => d.BHKMaster != null ? d.BHKMaster.BHKName : null).FirstOrDefault() })
            .ToDictionaryAsync(x => x.PropertyId, x => x.BHK, cancellationToken);

        var wingDetailIds = rawRows.Where(r => r.WingDetailId.HasValue).Select(r => r.WingDetailId!.Value).Distinct().ToList();
        var directWingNames = wingDetailIds.Count > 0
            ? await _wingDetailsMastRepository.GetQueryable().AsNoTracking()
                .Where(wdm => wingDetailIds.Contains(wdm.Id) && wdm.IsActive && !wdm.MarkedForDeletion)
                .Select(wdm => new { wdm.Id, wdm.WingName })
                .ToDictionaryAsync(wdm => wdm.Id, wdm => wdm.WingName, cancellationToken)
            : new Dictionary<int, string?>();

        var societyWingNames = await (
            from s in _societyRepository.GetQueryable().AsNoTracking()
            where s.PropertyId.HasValue && propertyIds.Contains(s.PropertyId.Value) && s.IsActive && !s.MarkedForDeletion
            join wdm in _wingDetailsMastRepository.GetQueryable().AsNoTracking() on s.Id equals wdm.SocietyDetailsMastId
            where wdm.IsActive && !wdm.MarkedForDeletion
            select new { PropertyId = s.PropertyId!.Value, wdm.WingName, CreatedDate = wdm.CreatedDate }
        ).ToListAsync(cancellationToken);

        var societyWingLookup = societyWingNames
            .GroupBy(x => x.PropertyId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.CreatedDate).Select(x => x.WingName).FirstOrDefault());

        foreach (var p in rawRows)
        {
            bhkLookup.TryGetValue(p.Id, out var bhk);
            p.BHK = bhk;

            string? wingName = null;
            if (p.WingDetailId.HasValue)
            {
                directWingNames.TryGetValue(p.WingDetailId.Value, out wingName);
            }
            if (string.IsNullOrEmpty(wingName))
            {
                societyWingLookup.TryGetValue(p.Id, out wingName);
            }
            p.Wing = wingName;
        }

        // OC No / OC Date of every row come from PTIS.PropertyCertificates (type OC), resolved by scope like the Building Permission tab:
        // the unit's own certificate, else its wing's, else its society's.
        var societyByProperty = await ResolveSocietyIdsAsync(
            rawRows.Select(r => (r.Id, r.WingDetailId)).ToList(), cancellationToken);
        var ocLookup = await LoadOccupancyCertificatesAsync(
            rawRows.Select(r => (r.Id, r.WingDetailId)).ToList(), societyByProperty, cancellationToken);

        var mappingList = await _propertyMapDetailRepository.GetQueryable().AsNoTracking()
            .Where(pmd => pmd.PropertyIdNew.HasValue && propertyIds.Contains(pmd.PropertyIdNew.Value) && pmd.IsActive)
            .Select(pmd => new
            {
                pmd.Id,
                pmd.PropertyIdNew,
                pmd.PropertyIdOld,
                pmd.PropertyNoOld,
                pmd.IsCurrent
            })
            .ToListAsync(cancellationToken);

        var mappingsByNewProperty = mappingList
            .GroupBy(m => m.PropertyIdNew!.Value)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(m => m.IsCurrent).ThenByDescending(m => m.Id).ToList());

        // ── 5. Fetch supporting details using IRepository GetQueryable ─────
        var wardZones = await (
            from w in _wardRepository.GetQueryable().AsNoTracking()
            where wardIds.Contains(w.Id)
            join z in _zoneRepository.GetQueryable().AsNoTracking() on w.ZoneId equals z.Id into zJ
            from z in zJ.DefaultIfEmpty()
            select new { w.Id, w.WardNo, ZoneNo = z != null ? z.ZoneNo : null }
        ).ToDictionaryAsync(x => x.Id, x => new { x.WardNo, x.ZoneNo }, cancellationToken);

        var detailsList = await (
            from pd in _propertyDetailsRepository.GetQueryable().AsNoTracking()
            where propertyIds.Contains(pd.PropertyId)
               && pd.IsActive && !pd.MarkedForDeletion
            join fl in _floorRepository.GetQueryable().AsNoTracking() on pd.FloorId equals fl.Id into flJ
            from fl in flJ.DefaultIfEmpty()
            join sfl in _floorRepository.GetQueryable().AsNoTracking() on pd.SubFloorId equals sfl.Id into sflJ
            from sfl in sflJ.DefaultIfEmpty()
            join ct in _constructionTypeRepository.GetQueryable().AsNoTracking() on pd.ConstructionTypeId equals ct.Id into ctJ
            from ct in ctJ.DefaultIfEmpty()
            join tou in _typeOfUseRepository.GetQueryable().AsNoTracking() on pd.TypeOfUseId equals tou.Id into touJ
            from tou in touJ.DefaultIfEmpty()
            join stou in _subTypeOfUseRepository.GetQueryable().AsNoTracking() on pd.SubTypeOfUseId equals stou.Id into stouJ
            from stou in stouJ.DefaultIfEmpty()
            select new FetchDetailRowDto
            {
                Id = pd.Id,
                PropertyId = pd.PropertyId,
                NoOfRooms = pd.NoOfRooms,
                CarpetAreaSqMeter = pd.CarpetAreaSqMeter,
                CarpetAreaSqFeet = pd.CarpetAreaSqFeet,
                BuiltupAreaSqMeter = pd.BuiltupAreaSqMeter,
                BuiltupAreaSqFeet = pd.BuiltupAreaSqFeet,
                Floor = fl != null ? fl.Description : null,
                FloorCode = fl != null ? fl.FloorCode : null,
                SubFloor = sfl != null ? sfl.Description : null,
                ConstructionType = ct != null ? ct.Description : null,
                ConstructionCode = ct != null ? ct.ConstructionCode : null,
                TypeOfUse = tou != null ? tou.Description : null,
                TypeOfUseCode = tou != null ? tou.TypeOfUseCode : null,
                Type = tou != null ? tou.Type : null,
                SubTypeOfUse = stou != null ? stou.Description : null,
                ConstructionYear = pd.ConstructionYear,
                AssessmentYear = pd.AssessmentYear
            }).ToListAsync(cancellationToken);

        // Renter and rent of every row come from PTIS.RenterMast (the renter of each detail row, as the RV calculation reads them).
        var renterLookup = await LoadRentersAsync(detailsList, cancellationToken);

        var detailsLookup = detailsList
            .GroupBy(d => d.PropertyId)
            .ToDictionary(g => g.Key, g =>
            {
                var latest = g.OrderByDescending(d => d.Id).First();
                return new FetchDetailRowDto
                {
                    Id = latest.Id,
                    PropertyId = latest.PropertyId,
                    NoOfRooms = g.Any(d => d.NoOfRooms.HasValue) ? g.Sum(d => d.NoOfRooms ?? 0) : null,
                    CarpetAreaSqMeter = g.Any(d => d.CarpetAreaSqMeter.HasValue) ? g.Sum(d => d.CarpetAreaSqMeter ?? 0) : null,
                    CarpetAreaSqFeet = g.Any(d => d.CarpetAreaSqFeet.HasValue) ? g.Sum(d => d.CarpetAreaSqFeet ?? 0) : null,
                    BuiltupAreaSqMeter = g.Any(d => d.BuiltupAreaSqMeter.HasValue) ? g.Sum(d => d.BuiltupAreaSqMeter ?? 0) : null,
                    BuiltupAreaSqFeet = g.Any(d => d.BuiltupAreaSqFeet.HasValue) ? g.Sum(d => d.BuiltupAreaSqFeet ?? 0) : null,
                    Floor = latest.Floor,
                    FloorCode = latest.FloorCode,
                    SubFloor = latest.SubFloor,
                    ConstructionType = latest.ConstructionType,
                    ConstructionCode = latest.ConstructionCode,
                    TypeOfUse = latest.TypeOfUse,
                    TypeOfUseCode = latest.TypeOfUseCode,
                    Type = latest.Type,
                    SubTypeOfUse = latest.SubTypeOfUse,
                    ConstructionYear = latest.ConstructionYear,
                    AssessmentYear = latest.AssessmentYear
                };
            });

        // Fetch Old Property Data using direct Index Seeks (avoiding OR across Id / OldPropertyNo)
        var oldPropertyIdsFromMap = mappingList
            .Where(m => m.PropertyIdOld.HasValue)
            .Select(m => m.PropertyIdOld!.Value)
            .Distinct()
            .ToList();

        var mappedOldNos = mappingList.Select(m => m.PropertyNoOld).Where(n => !string.IsNullOrEmpty(n)).Distinct().ToList();
        var propertyNos = rawRows.Select(r => r.PropertyNo).Where(n => !string.IsNullOrEmpty(n)).ToList();
        var allOldNos = mappedOldNos.Union(propertyNos).Distinct().ToList();

        var oldPropertiesById = oldPropertyIdsFromMap.Count > 0
            ? await _oldPropertyRepository.GetQueryable().AsNoTracking()
                .Where(o => oldPropertyIdsFromMap.Contains(o.Id) && o.IsActive && !o.MarkedForDeletion)
                .ToListAsync(cancellationToken)
            : new List<PropertyMastOldEntity>();

        var foundOldNos = oldPropertiesById
            .Where(o => !string.IsNullOrEmpty(o.OldPropertyNo))
            .Select(o => o.OldPropertyNo!)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var remainingOldNos = allOldNos.Where(n => !foundOldNos.Contains(n)).ToList();
        var oldPropertiesByNo = remainingOldNos.Count > 0
            ? await _oldPropertyRepository.GetQueryable().AsNoTracking()
                .Where(o => remainingOldNos.Contains(o.OldPropertyNo!) && o.IsActive && !o.MarkedForDeletion)
                .ToListAsync(cancellationToken)
            : new List<PropertyMastOldEntity>();

        var oldPropertyEntities = oldPropertiesById.Concat(oldPropertiesByNo).ToList();

        var oldDataById = oldPropertyEntities.ToDictionary(o => o.Id);
        var oldDataByNo = oldPropertyEntities
            .Where(o => !string.IsNullOrEmpty(o.OldPropertyNo))
            .GroupBy(o => o.OldPropertyNo!)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(o => o.CreatedDate).First());

        var oldPropertyIds = oldPropertyEntities.Select(o => o.Id).Distinct().ToList();
        var oldDetailsLookup = new Dictionary<int, (decimal? CarpetASqMtr, decimal? CarpetASqFt, decimal? BuiltupASqMtr, decimal? BuiltupASqFt)>();

        if (_oldPropertyDetailsRepository != null && oldPropertyIds.Count > 0)
        {
            var oldDetailsList = await _oldPropertyDetailsRepository.GetQueryable().AsNoTracking()
                .Where(d => oldPropertyIds.Contains(d.PropertyMastOldId) && d.IsActive && !d.MarkedForDeletion)
                .ToListAsync(cancellationToken);

            oldDetailsLookup = oldDetailsList
                .GroupBy(d => d.PropertyMastOldId)
                .ToDictionary(g => g.Key, g => (
                    CarpetASqMtr: g.Any(d => d.OldCarpetAreaSqMeter.HasValue) ? (decimal?)Math.Round(g.Sum(d => (decimal)(d.OldCarpetAreaSqMeter ?? 0)), 2) : null,
                    CarpetASqFt: g.Any(d => d.OldCarpetAreaSqFeet.HasValue) ? (decimal?)Math.Round(g.Sum(d => (decimal)(d.OldCarpetAreaSqFeet ?? 0)), 2) : null,
                    BuiltupASqMtr: g.Any(d => d.OldBuiltupAreaSqMeter.HasValue) ? (decimal?)Math.Round(g.Sum(d => (decimal)(d.OldBuiltupAreaSqMeter ?? 0)), 2) : null,
                    BuiltupASqFt: g.Any(d => d.OldBuiltupAreaSqFeet.HasValue) ? (decimal?)Math.Round(g.Sum(d => (decimal)(d.OldBuiltupAreaSqFeet ?? 0)), 2) : null
                ));
        }

        // Check TaxCalculationMethod from PolicyConfiguration (select PolicyValue from PTIS.PolicyConfiguration where PolicyCode='TaxCalculationMethod')
        var taxCalculationMethod = await _policyConfigurationRepository.GetQueryable().AsNoTracking()
            .Where(p => p.PolicyCode == "TaxCalculationMethod" && p.IsActive)
            .Select(p => p.PolicyValue)
            .FirstOrDefaultAsync(cancellationToken);

        var isRvOnly = string.Equals(taxCalculationMethod?.Trim(), "RV", StringComparison.OrdinalIgnoreCase);
        var retroCalculationType = isRvOnly ? "RV" : "CV";

        // Fetch Retro Demand (TaxAmount where TaxCode='TAXTOTAL') per PropertyId from TransMast joining TaxMaster and PolicyCodeMaster
        var retroTaxLookup = await (
            from tm in _transMastRepository.GetQueryable().AsNoTracking()
            join tx in _taxMasterRepository.GetQueryable().AsNoTracking() on tm.TaxId equals tx.Id
            join pcm in _policyCodeMasterRepository.GetQueryable().AsNoTracking() on tm.PolicyCodeId equals pcm.Id
            where propertyIds.Contains(tm.PropertyId)
               && tx.TaxCode == "TAXTOTAL" && tx.IsActive
               && pcm.IsRetroDemand && pcm.IsActive
               && tm.IsActive && !tm.MarkedForDeletion
               && tm.CalculationType == retroCalculationType
            group tm by tm.PropertyId into g
            select new
            {
                PropertyId = g.Key,
                TotalRetroTax = g.Sum(x => (decimal?)x.TaxAmount) ?? 0m
            }
        ).ToDictionaryAsync(x => x.PropertyId, x => x.TotalRetroTax, cancellationToken);

        // Fetch RV details (CalculationValue / Rateable Value) from PolicyTaxDetails where IsCurrent is true
        var rvTaxLookup = new Dictionary<int, decimal?>();
        var rvTaxRows = await _policyTaxDetailsRepository.GetQueryable().AsNoTracking()
            .Where(x => propertyIds.Contains(x.PropertyId) && x.IsCurrent && x.IsActive && !x.MarkedForDeletion)
            .Select(x => new { x.PropertyId, RateableValue = x.CalculationValue })
            .ToListAsync(cancellationToken);

        foreach (var r in rvTaxRows)
        {
            rvTaxLookup.TryAdd(r.PropertyId, r.RateableValue);
        }

        // Fetch RVCalculationResults (AnnualRentalValue) where active
        var rvCalcLookup = new Dictionary<int, decimal?>();
        if (_rvCalculationResultsRepository != null && propertyIds.Count > 0)
        {
            var rvCalcList = await _rvCalculationResultsRepository.GetQueryable().AsNoTracking()
                .Where(x => propertyIds.Contains(x.PropertyId) && x.IsActive && !x.MarkedForDeletion)
                .ToListAsync(cancellationToken);

            rvCalcLookup = rvCalcList
                .GroupBy(x => x.PropertyId)
                .ToDictionary(
                    g => g.Key,
                    g => g.Any(x => x.AnnualRentalValue.HasValue)
                        ? (decimal?)Math.Round(g.Sum(x => (decimal)(x.AnnualRentalValue ?? 0)), 2)
                        : null
                );
        }

        // If TaxCalculationMethod is 'RV', CV is not checked; otherwise CV details (CalculationValue / Capital Value) are retrieved where IsCurrent is true
        var cvTaxLookup = new Dictionary<int, decimal?>();
        if (!isRvOnly)
        {
            var cvTaxRows = await _policyTaxDetailsCVRepository.GetQueryable().AsNoTracking()
                .Where(x => propertyIds.Contains(x.PropertyId) && x.IsCurrent && x.IsActive && !x.MarkedForDeletion)
                .Select(x => new { x.PropertyId, CapitalValue = x.CalculationValue })
                .ToListAsync(cancellationToken);

            foreach (var r in cvTaxRows)
            {
                cvTaxLookup.TryAdd(r.PropertyId, r.CapitalValue);
            }
        }

        // Fetch Current Demand from PolicyTaxDetails (for RV) or PolicyTaxDetailsCV (for CV) where IsCurrent = 1, IsActive = 1, TaxCode = 'TAXTOTAL'
        // Uses single-row selection with policy precedence (certificate/occupation policies over NETTAX, non-retro) to avoid double-counting.
        var currentDemandLookup = new Dictionary<int, decimal>();
        if (isRvOnly)
        {
            var rvDemandList = await (
                from ptd in _policyTaxDetailsRepository.GetQueryable().AsNoTracking()
                join tx in _taxMasterRepository.GetQueryable().AsNoTracking() on ptd.TaxId equals tx.Id
                join pcm in _policyCodeMasterRepository.GetQueryable().AsNoTracking() on ptd.PolicyCodeId equals pcm.Id
                where propertyIds.Contains(ptd.PropertyId)
                   && (tx.TaxCode == "TAXTOTAL" || tx.TaxCode == "TaxTotal") && tx.IsActive
                   && ptd.IsCurrent && ptd.IsActive && !ptd.MarkedForDeletion
                   && !pcm.IsRetroDemand && pcm.IsActive
                select new
                {
                    ptd.PropertyId,
                    ptd.TaxAmount,
                    pcm.PolicyCode,
                    pcm.DisplayOrder,
                    ptd.Id
                }
            ).ToListAsync(cancellationToken);

            var rvDemandByProperty = rvDemandList
                .GroupBy(x => x.PropertyId)
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderByDescending(x => x.PolicyCode != PolicyCodes.NetTax)
                          .ThenByDescending(x => x.DisplayOrder)
                          .ThenByDescending(x => x.Id)
                          .Select(x => x.TaxAmount ?? 0m)
                          .FirstOrDefault()
                );

            foreach (var kvp in rvDemandByProperty)
            {
                currentDemandLookup[kvp.Key] = kvp.Value;
            }
        }
        else
        {
            var cvDemandList = await (
                from ptd in _policyTaxDetailsCVRepository.GetQueryable().AsNoTracking()
                join tx in _taxMasterRepository.GetQueryable().AsNoTracking() on ptd.TaxId equals tx.Id
                join pcm in _policyCodeMasterRepository.GetQueryable().AsNoTracking() on ptd.PolicyCodeId equals pcm.Id
                where propertyIds.Contains(ptd.PropertyId)
                   && (tx.TaxCode == "TAXTOTAL" || tx.TaxCode == "TaxTotal") && tx.IsActive
                   && ptd.IsCurrent && ptd.IsActive && !ptd.MarkedForDeletion
                   && !pcm.IsRetroDemand && pcm.IsActive
                select new
                {
                    ptd.PropertyId,
                    ptd.TaxAmount,
                    pcm.PolicyCode,
                    pcm.DisplayOrder,
                    ptd.Id
                }
            ).ToListAsync(cancellationToken);

            var cvDemandByProperty = cvDemandList
                .GroupBy(x => x.PropertyId)
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderByDescending(x => x.PolicyCode != PolicyCodes.NetTax)
                          .ThenByDescending(x => x.DisplayOrder)
                          .ThenByDescending(x => x.Id)
                          .Select(x => x.TaxAmount ?? 0m)
                          .FirstOrDefault()
                );

            foreach (var kvp in cvDemandByProperty)
            {
                currentDemandLookup[kvp.Key] = kvp.Value;
            }

            var missingPropIds = propertyIds.Where(id => !currentDemandLookup.ContainsKey(id)).ToList();
            if (missingPropIds.Count > 0)
            {
                var fallbackDemandList = await (
                    from ptd in _policyTaxDetailsRepository.GetQueryable().AsNoTracking()
                    join tx in _taxMasterRepository.GetQueryable().AsNoTracking() on ptd.TaxId equals tx.Id
                    join pcm in _policyCodeMasterRepository.GetQueryable().AsNoTracking() on ptd.PolicyCodeId equals pcm.Id
                    where missingPropIds.Contains(ptd.PropertyId)
                       && (tx.TaxCode == "TAXTOTAL" || tx.TaxCode == "TaxTotal") && tx.IsActive
                       && ptd.IsCurrent && ptd.IsActive && !ptd.MarkedForDeletion
                       && !pcm.IsRetroDemand && pcm.IsActive
                    select new
                    {
                        ptd.PropertyId,
                        ptd.TaxAmount,
                        pcm.PolicyCode,
                        pcm.DisplayOrder,
                        ptd.Id
                    }
                ).ToListAsync(cancellationToken);

                var fallbackByProperty = fallbackDemandList
                    .GroupBy(x => x.PropertyId)
                    .ToDictionary(
                        g => g.Key,
                        g => g.OrderByDescending(x => x.PolicyCode != PolicyCodes.NetTax)
                              .ThenByDescending(x => x.DisplayOrder)
                              .ThenByDescending(x => x.Id)
                              .Select(x => x.TaxAmount ?? 0m)
                              .FirstOrDefault()
                    );

                foreach (var kvp in fallbackByProperty)
                {
                    currentDemandLookup.TryAdd(kvp.Key, kvp.Value);
                }
            }
        }

        // Fetch Photo Documents (DocumentGuid & PhotoTypeCode for PLAN_PHOTO and PROPERTY_PHOTO)
        var photoDocs = await (
            from pp in _photoRepository.GetQueryable().AsNoTracking()
            where pp.PropertyId.HasValue && propertyIds.Contains(pp.PropertyId.Value) && pp.IsActive && !pp.MarkedForDeletion
            join ppt in _photoTypeRepository.GetQueryable().AsNoTracking() on pp.PhotoTypeId equals ppt.Id
            where ppt.IsActive && (ImagePhotoTypeCodes.Contains(ppt.PhotoTypeCode) || PlanPhotoTypeCodes.Contains(ppt.PhotoTypeCode))
            join db in _documentBindingRepository.GetQueryable().AsNoTracking() on pp.DocumentBindingId equals db.Id
            where db.IsActive
            join d in _documentRepository.GetQueryable().AsNoTracking() on db.DocumentId equals d.Id
            where d.IsActive && !d.MarkedForDeletion
            select new
            {
                pp.PropertyId,
                d.DocumentGuid,
                ppt.PhotoTypeCode,
                CreatedDate = pp.CreatedDate
            }
        ).ToListAsync(cancellationToken);

        var photoLookup = photoDocs
            .GroupBy(x => x.PropertyId)
            .ToDictionary(
                g => g.Key,
                g => g.GroupBy(x => x.PhotoTypeCode, StringComparer.OrdinalIgnoreCase)
                      .Select(group => group.OrderByDescending(x => x.CreatedDate ?? DateTime.MinValue).First())
                      .Select(x => new PropertyPhotoDocumentDto
                      {
                          DocumentGuid = x.DocumentGuid,
                          PhotoTypeCode = x.PhotoTypeCode
                      }).ToList()
            );

        var sharedPlanLookup = await LoadSharedPlanDocumentsAsync(
            rawRows.Select(r => (r.Id, r.WingDetailId, r.ApartmentType)).ToList(), societyByProperty, cancellationToken);

        // Fetch Old Photo Documents (DocumentGuid & PhotoTypeCode from PropertyPhotoOld)
        var oldPhotoDocs = oldPropertyIds.Count > 0
            ? await (
                from pp in _photoOldRepository.GetQueryable().AsNoTracking()
                where oldPropertyIds.Contains(pp.PropertyMastOldId) && pp.IsActive && !pp.MarkedForDeletion
                join ppt in _photoTypeRepository.GetQueryable().AsNoTracking() on pp.PhotoTypeId equals ppt.Id
                where ppt.IsActive && (ImagePhotoTypeCodes.Contains(ppt.PhotoTypeCode) || PlanPhotoTypeCodes.Contains(ppt.PhotoTypeCode))
                join db in _documentBindingRepository.GetQueryable().AsNoTracking() on pp.DocumentBindingId equals db.Id
                where db.IsActive
                join d in _documentRepository.GetQueryable().AsNoTracking() on db.DocumentId equals d.Id
                where d.IsActive && !d.MarkedForDeletion
                select new
                {
                    pp.PropertyMastOldId,
                    d.DocumentGuid,
                    ppt.PhotoTypeCode,
                    CreatedDate = pp.CreatedDate
                }
            ).ToListAsync(cancellationToken)
            : new();

        var oldPhotoLookup = oldPhotoDocs
            .GroupBy(x => x.PropertyMastOldId)
            .ToDictionary(
                g => g.Key,
                g => g.GroupBy(x => x.PhotoTypeCode, StringComparer.OrdinalIgnoreCase)
                      .Select(group => group.OrderByDescending(x => x.CreatedDate ?? DateTime.MinValue).First())
                      .Select(x => new PropertyPhotoDocumentDto
                      {
                          DocumentGuid = x.DocumentGuid,
                          PhotoTypeCode = x.PhotoTypeCode
                      }).ToList()
            );

        // Fetch Old Tax Details (TransMastOld rows) for old properties
        var oldTaxLookup = new Dictionary<int, List<OldTaxDetailDto>>();
        if (_transMastOldRepository != null && oldPropertyIds.Count > 0)
        {
            var tmoRows = await (
                from tmo in _transMastOldRepository.GetQueryable().AsNoTracking()
                where oldPropertyIds.Contains(tmo.PropertyMastOldId) && tmo.IsActive && !tmo.MarkedForDeletion
                join tx in _taxMasterRepository.GetQueryable().AsNoTracking() on tmo.TaxId equals tx.Id into txJ
                from tx in txJ.DefaultIfEmpty()
                select new OldTaxDetailDto
                {
                    Id = tmo.Id,
                    PropertyMastOldId = tmo.PropertyMastOldId,
                    FinanceYearId = tmo.FinanceYearId,
                    CalculationType = tmo.CalculationType,
                    CalculationValue = tmo.CalculationValue,
                    CalculationAnnualValue = tmo.CalculationAnnualValue,
                    TaxId = tmo.TaxId,
                    TaxName = tx != null ? (tx.TaxNameAlias ?? tx.TaxName) : null,
                    TaxAmount = tmo.TaxAmount
                }
            ).ToListAsync(cancellationToken);

            oldTaxLookup = tmoRows
                .GroupBy(x => x.PropertyMastOldId)
                .ToDictionary(g => g.Key, g => g.ToList());
        }

        // ── 6. Build Comparison DTOs (NewSurvey, OldSurvey, Difference) ─────
        var comparisons = new List<(int PropertyId, ApartmentQCComparisonDto Row)>(rawRows.Count);

        foreach (var p in rawRows)
        {
            wardZones.TryGetValue(p.WardId, out var wz);

            // Find all mapped old properties for this new property
            List<PropertyMastOldEntity> mappedOldEntities = new();
            if (mappingsByNewProperty.TryGetValue(p.Id, out var linkedMapList) && linkedMapList.Count > 0)
            {
                foreach (var m in linkedMapList)
                {
                    if (m.PropertyIdOld.HasValue && oldDataById.TryGetValue(m.PropertyIdOld.Value, out var oEnt))
                    {
                        if (!mappedOldEntities.Any(x => x.Id == oEnt.Id))
                            mappedOldEntities.Add(oEnt);
                    }
                    else if (!string.IsNullOrEmpty(m.PropertyNoOld) && oldDataByNo.TryGetValue(m.PropertyNoOld, out var oEntByNo))
                    {
                        if (!mappedOldEntities.Any(x => x.Id == oEntByNo.Id))
                            mappedOldEntities.Add(oEntByNo);
                    }
                }
            }

            if (mappedOldEntities.Count == 0 && !string.IsNullOrEmpty(p.PropertyNo) && oldDataByNo.TryGetValue(p.PropertyNo, out var fallbackOld))
            {
                mappedOldEntities.Add(fallbackOld);
            }

            PropertyMastOldEntity? primaryOld = mappedOldEntities.FirstOrDefault();

            retroTaxLookup.TryGetValue(p.Id, out var newRetroTax);
            currentDemandLookup.TryGetValue(p.Id, out var currentDemand);
            rvTaxLookup.TryGetValue(p.Id, out var rateableValue);
            cvTaxLookup.TryGetValue(p.Id, out var capitalValue);
            if (isRvOnly) capitalValue = null;
            photoLookup.TryGetValue(p.Id, out var propertyPhotos);
            detailsLookup.TryGetValue(p.Id, out var primaryDetail);

            var calculationValue = isRvOnly ? rateableValue : (capitalValue ?? rateableValue);
            var totalTaxRV = rateableValue ?? 0m;
            var totalTaxCV = capitalValue ?? 0m;
            var newTaxTotal = currentDemand > 0 ? currentDemand : (calculationValue ?? 0m);

            OldSurveyPropertyDto oldSurvey;
            if (mappedOldEntities.Count == 1)
            {
                var old = mappedOldEntities[0];
                oldSurvey = _mapper.Map<OldSurveyPropertyDto>(old);

                if (oldDetailsLookup.TryGetValue(old.Id, out var oldDetails))
                {
                    if (oldDetails.CarpetASqMtr.HasValue) oldSurvey.CarpetASqMtr = oldDetails.CarpetASqMtr;
                    if (oldDetails.CarpetASqFt.HasValue) oldSurvey.CarpetASqFt = oldDetails.CarpetASqFt;
                    if (oldDetails.BuiltupASqMtr.HasValue) oldSurvey.BuiltupASqMtr = oldDetails.BuiltupASqMtr;
                    if (oldDetails.BuiltupASqFt.HasValue)
                    {
                        oldSurvey.BuiltupASqFt = oldDetails.BuiltupASqFt;
                    }
                }

                if (oldPhotoLookup.TryGetValue(old.Id, out var oldPhotos) && oldPhotos != null && oldPhotos.Count > 0)
                {
                    oldSurvey.Photos = oldPhotos;
                    oldSurvey.PropertyPhotoDocumentGuid = FirstPhotoOfType(oldPhotos, ImagePhotoTypeCodes);
                    oldSurvey.PlanPhotoDocumentGuid = FirstPhotoOfType(oldPhotos, PlanPhotoTypeCodes);
                }

                if (oldTaxLookup.TryGetValue(old.Id, out var oTaxes) && oTaxes != null)
                {
                    oldSurvey.OldTaxDetails = oTaxes;
                }
            }
            else if (mappedOldEntities.Count > 1)
            {
                // MERGE (1 New -> Many Old): Aggregate all mapped old properties
                var firstOld = mappedOldEntities.First();
                oldSurvey = _mapper.Map<OldSurveyPropertyDto>(firstOld);
                oldSurvey.OldPropertyNo = string.Join(", ", mappedOldEntities.Select(o => o.OldPropertyNo).Where(s => !string.IsNullOrEmpty(s)).Distinct());
                oldSurvey.OldPartitionNo = string.Join(", ", mappedOldEntities.Select(o => o.OldPartitionNo).Where(s => !string.IsNullOrEmpty(s)).Distinct());
                oldSurvey.PropertyNo = oldSurvey.OldPropertyNo;

                decimal totalRV = 0m;
                decimal totalTax = 0m;
                decimal totalConstArea = 0m;
                decimal totalALV = 0m;
                bool hasAnyALV = false;
                decimal? totalCarpetSqMtr = null;
                decimal? totalCarpetSqFt = null;
                decimal? totalBuiltupSqMtr = null;
                decimal? totalBuiltupSqFt = null;

                foreach (var old in mappedOldEntities)
                {
                    totalRV += (decimal)(old.OldRV ?? 0);
                    totalTax += (decimal)(old.OldTotalTax ?? 0);
                    totalConstArea += (decimal)(old.OldConstructionArea ?? 0);
                    if (old.OldALV.HasValue)
                    {
                        totalALV += (decimal)old.OldALV.Value;
                        hasAnyALV = true;
                    }

                    if (oldDetailsLookup.TryGetValue(old.Id, out var oDet))
                    {
                        if (oDet.CarpetASqMtr.HasValue) totalCarpetSqMtr = (totalCarpetSqMtr ?? 0m) + oDet.CarpetASqMtr.Value;
                        if (oDet.CarpetASqFt.HasValue) totalCarpetSqFt = (totalCarpetSqFt ?? 0m) + oDet.CarpetASqFt.Value;
                        if (oDet.BuiltupASqMtr.HasValue) totalBuiltupSqMtr = (totalBuiltupSqMtr ?? 0m) + oDet.BuiltupASqMtr.Value;
                        if (oDet.BuiltupASqFt.HasValue) totalBuiltupSqFt = (totalBuiltupSqFt ?? 0m) + oDet.BuiltupASqFt.Value;
                    }
                }

                oldSurvey.RateableValue = Math.Round(totalRV, 2);
                oldSurvey.AnnualRentalValue = hasAnyALV ? (decimal?)Math.Round(totalALV, 2) : null;
                oldSurvey.ALV = oldSurvey.AnnualRentalValue;
                oldSurvey.TotalTax = Math.Round(totalTax, 2);
                oldSurvey.ConstructionArea = Math.Round(totalConstArea, 2);
                oldSurvey.CarpetASqMtr = totalCarpetSqMtr.HasValue ? Math.Round(totalCarpetSqMtr.Value, 2) : null;
                oldSurvey.CarpetASqFt = totalCarpetSqFt.HasValue ? Math.Round(totalCarpetSqFt.Value, 2) : null;
                oldSurvey.BuiltupASqMtr = totalBuiltupSqMtr.HasValue ? Math.Round(totalBuiltupSqMtr.Value, 2) : null;
                oldSurvey.BuiltupASqFt = totalBuiltupSqFt.HasValue ? Math.Round(totalBuiltupSqFt.Value, 2) : null;

                var mergedPhotos = new List<PropertyPhotoDocumentDto>();
                var mergedOldTaxes = new List<OldTaxDetailDto>();
                foreach (var old in mappedOldEntities)
                {
                    if (oldPhotoLookup.TryGetValue(old.Id, out var oPhotos) && oPhotos != null)
                    {
                        mergedPhotos.AddRange(oPhotos);
                    }
                    if (oldTaxLookup.TryGetValue(old.Id, out var oTaxes) && oTaxes != null)
                    {
                        mergedOldTaxes.AddRange(oTaxes);
                    }
                }
                if (mergedPhotos.Count > 0)
                {
                    oldSurvey.Photos = mergedPhotos;
                    oldSurvey.PropertyPhotoDocumentGuid = FirstPhotoOfType(mergedPhotos, ImagePhotoTypeCodes);
                    oldSurvey.PlanPhotoDocumentGuid = FirstPhotoOfType(mergedPhotos, PlanPhotoTypeCodes);
                }
                oldSurvey.OldTaxDetails = mergedOldTaxes;
            }
            else
            {
                oldSurvey = new OldSurveyPropertyDto();
            }

            // PropertyMastOld.OldWing is usually blank: show the wing of the mapped new property instead.
            if (oldSurvey.Id > 0 && string.IsNullOrWhiteSpace(oldSurvey.Wing))
            {
                oldSurvey.Wing = p.Wing;
            }

            rvCalcLookup.TryGetValue(p.Id, out var annualRentalValue);

            var newSurveyInput = new NewSurveyMappingInput(
                p,
                wz?.ZoneNo,
                wz?.WardNo,
                primaryDetail,
                primaryOld,
                newRetroTax,
                rateableValue,
                capitalValue,
                calculationValue,
                annualRentalValue,
                newTaxTotal,
                totalTaxRV,
                totalTaxCV,
                currentDemand > 0 ? currentDemand : null,
                propertyPhotos);
            var newSurvey = _mapper.Map<NewSurveyPropertyDto>(newSurveyInput);
            if (renterLookup.TryGetValue(p.Id, out var renter))
            {
                newSurvey.RenterName = renter.Name;
                newSurvey.RenterNameEnglish = renter.NameEnglish;
                newSurvey.RentMonthly = renter.Monthly;
                newSurvey.RentYearly = renter.Yearly;
            }
            if (ocLookup.TryGetValue(p.Id, out var ocCertificate))
            {
                newSurvey.OCNo = ocCertificate.CertificateNo;
                newSurvey.OCDate = ocCertificate.IssueDate;
            }

            if (propertyPhotos != null && propertyPhotos.Count > 0)
            {
                newSurvey.Photos = propertyPhotos;
                newSurvey.PropertyPhotoDocumentGuid = ImagePhotoTypeCodes
                    .Select(code => propertyPhotos.FirstOrDefault(x => string.Equals(x.PhotoTypeCode, code, StringComparison.OrdinalIgnoreCase))?.DocumentGuid)
                    .FirstOrDefault(guid => guid != null);
                newSurvey.PlanPhotoDocumentGuid = PlanPhotoTypeCodes
                    .Select(code => propertyPhotos.FirstOrDefault(x => string.Equals(x.PhotoTypeCode, code, StringComparison.OrdinalIgnoreCase))?.DocumentGuid)
                    .FirstOrDefault(guid => guid != null);
            }
            if (newSurvey.PlanPhotoDocumentGuid == null && sharedPlanLookup.TryGetValue(p.Id, out var sharedPlanGuid))
            {
                newSurvey.PlanPhotoDocumentGuid = sharedPlanGuid;
            }

            var difference = _mapper.Map<ApartmentQCPropertyDifferenceDto>((newSurvey, oldSurvey));

            comparisons.Add((p.Id, new ApartmentQCComparisonDto
            {
                NewSurvey = newSurvey,
                OldSurvey = oldSurvey,
                Difference = difference
            }));
        }

        await OldSurveyCodeResolver.ApplyAsync(
            comparisons.Select(c => c.Row.OldSurvey),
            _oldPropertyDetailsRepository,
            _floorRepository,
            _constructionTypeRepository,
            _typeOfUseRepository,
            cancellationToken,
            _subTypeOfUseRepository,
            _propertyTypeRepository);

        return comparisons;
    }

    /// <summary>
    /// Several new properties mapped to the same old property become one row (their values added up); every other property is a row of its own.
    /// The property ids of each row come with it.
    /// </summary>
    private List<(List<int> MemberIds, ApartmentQCComparisonDto Row)> AggregateByOldProperty(
        List<(int PropertyId, ApartmentQCComparisonDto Row)> comparisons)
    {
        // ── 7. Group & Aggregate Multiple New Properties Mapped to Same Old Property ──
        var finalComparisons = new List<(List<int> MemberIds, ApartmentQCComparisonDto Row)>();
        var groupedByOld = comparisons
            .GroupBy(c => c.Row.OldSurvey?.Id > 0 ? (long?)c.Row.OldSurvey.Id : null)
            .ToList();

        foreach (var group in groupedByOld)
        {
            if (group.Key == null || group.Count() == 1)
            {
                finalComparisons.AddRange(group.Select(c => (new List<int> { c.PropertyId }, c.Row)));
            }
            else
            {
                // Many New -> 1 Old: Aggregate all new properties into one main row with aggregated calculation data
                var items = group.Select(c => c.Row).ToList();
                var memberIds = group.Select(c => c.PropertyId).ToList();
                var first = items[0];

                var aggNewSurvey = new NewSurveyPropertyDto
                {
                    Id = first.NewSurvey.Id,
                    PDNId = first.NewSurvey.PDNId,
                    TaxZoneId = first.NewSurvey.TaxZoneId,
                    ZoneNo = first.NewSurvey.ZoneNo,
                    PropertyNo = first.NewSurvey.PropertyNo,
                    WardId = first.NewSurvey.WardId,
                    WardNo = first.NewSurvey.WardNo,
                    MobileNo = first.NewSurvey.MobileNo,
                    EmailId = first.NewSurvey.EmailId,
                    OCNo = first.NewSurvey.OCNo,
                    OCDate = first.NewSurvey.OCDate,
                    FlatOrShopNo = null,
                    FlatOrShopName = null,
                    FlatOrShopNoEnglish = null,
                    FlatOrShopNameEnglish = null,
                    OwnerName = first.NewSurvey.OwnerName,
                    OwnerNameEnglish = first.NewSurvey.OwnerNameEnglish,
                    OccupierName = first.NewSurvey.OccupierName,
                    OccupierNameEnglish = first.NewSurvey.OccupierNameEnglish,
                    PropertyType = first.NewSurvey.PropertyType,
                    PropertyTypeName = first.NewSurvey.PropertyTypeName,
                    RentYearly = first.NewSurvey.RentYearly,
                    RentMonthly = first.NewSurvey.RentMonthly,
                    RenterName = first.NewSurvey.RenterName,
                    RenterNameEnglish = first.NewSurvey.RenterNameEnglish,
                    TypeOfUse = first.NewSurvey.TypeOfUse,
                    TypeOfUseCode = first.NewSurvey.TypeOfUseCode,
                    Type = first.NewSurvey.Type,
                    SubTypeOfUse = first.NewSurvey.SubTypeOfUse,
                    ApartmentType = first.NewSurvey.ApartmentType,
                    PartType = first.NewSurvey.PartType,
                    Wing = first.NewSurvey.Wing,
                    WingDetailId = first.NewSurvey.WingDetailId,
                    Floor = first.NewSurvey.Floor,
                    FloorCode = first.NewSurvey.FloorCode,
                    SubFloor = first.NewSurvey.SubFloor,
                    ConstructionType = first.NewSurvey.ConstructionType,
                    ConstructionCode = first.NewSurvey.ConstructionCode,
                    ConstructionYear = first.NewSurvey.ConstructionYear,
                    AssessmentYear = first.NewSurvey.AssessmentYear,
                    BHK = first.NewSurvey.BHK,
                    Photos = items.SelectMany(x => x.NewSurvey.Photos).GroupBy(x => x.DocumentGuid).Select(g => g.First()).ToList(),
                    PropertyPhotoDocumentGuid = first.NewSurvey.PropertyPhotoDocumentGuid,
                    PlanPhotoDocumentGuid = first.NewSurvey.PlanPhotoDocumentGuid,

                    // Sum of calculation values:
                    NoOfRooms = items.Any(x => x.NewSurvey.NoOfRooms.HasValue) ? items.Sum(x => x.NewSurvey.NoOfRooms ?? 0) : null,
                    CarpetASqFt = items.Any(x => x.NewSurvey.CarpetASqFt.HasValue) ? Math.Round(items.Sum(x => x.NewSurvey.CarpetASqFt ?? 0m), 2) : null,
                    CarpetASqMtr = items.Any(x => x.NewSurvey.CarpetASqMtr.HasValue) ? Math.Round(items.Sum(x => x.NewSurvey.CarpetASqMtr ?? 0m), 2) : null,
                    BuiltupASqFt = items.Any(x => x.NewSurvey.BuiltupASqFt.HasValue) ? Math.Round(items.Sum(x => x.NewSurvey.BuiltupASqFt ?? 0m), 2) : null,
                    BuiltupASqMtr = items.Any(x => x.NewSurvey.BuiltupASqMtr.HasValue) ? Math.Round(items.Sum(x => x.NewSurvey.BuiltupASqMtr ?? 0m), 2) : null,
                    RateableValue = items.Any(x => x.NewSurvey.RateableValue.HasValue) ? Math.Round(items.Sum(x => x.NewSurvey.RateableValue ?? 0m), 2) : null,
                    AnnualRentalValue = items.Any(x => x.NewSurvey.AnnualRentalValue.HasValue) ? Math.Round(items.Sum(x => x.NewSurvey.AnnualRentalValue ?? 0m), 2) : null,
                    ALV = items.Any(x => x.NewSurvey.ALV.HasValue) ? Math.Round(items.Sum(x => x.NewSurvey.ALV ?? 0m), 2) : null,
                    CapitalValue = items.Any(x => x.NewSurvey.CapitalValue.HasValue) ? Math.Round(items.Sum(x => x.NewSurvey.CapitalValue ?? 0m), 2) : null,
                    CalculationValue = items.Any(x => x.NewSurvey.CalculationValue.HasValue) ? Math.Round(items.Sum(x => x.NewSurvey.CalculationValue ?? 0m), 2) : null,
                    NewTaxTotalRV = Math.Round(items.Sum(x => x.NewSurvey.NewTaxTotalRV), 2),
                    NewTaxTotalCV = Math.Round(items.Sum(x => x.NewSurvey.NewTaxTotalCV), 2),
                    NewTaxTotal = Math.Round(items.Sum(x => x.NewSurvey.NewTaxTotal), 2),
                    CurrentDemand = items.Any(x => x.NewSurvey.CurrentDemand.HasValue) ? Math.Round(items.Sum(x => x.NewSurvey.CurrentDemand ?? 0m), 2) : null,
                    RetroTaxTotal = items.Any(x => x.NewSurvey.RetroTaxTotal.HasValue) ? Math.Round(items.Sum(x => x.NewSurvey.RetroTaxTotal ?? 0m), 2) : null
                };

                var oldSurvey = first.OldSurvey;
                var difference = _mapper.Map<ApartmentQCPropertyDifferenceDto>((aggNewSurvey, oldSurvey));

                finalComparisons.Add((memberIds, new ApartmentQCComparisonDto
                {
                    NewSurvey = aggNewSurvey,
                    OldSurvey = oldSurvey,
                    Difference = difference
                }));
            }
        }

        return finalComparisons;
    }
}
