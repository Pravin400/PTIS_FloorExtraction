using System.Globalization;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.HtmlReport;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.ReportDataProviders;

public class SignpageThaneDataProvider : IReportDataProvider, IReportSchemaProvider
{
    private readonly IReportDataRepository<PropertyEntity> _propertyRepository;
    private readonly IReportDataRepository<WardEntity> _wardRepository;
    private readonly IReportDataRepository<PropertyMapDetailEntity> _propertyMapRepository;
    private readonly IReportDataRepository<PropertyMastOldEntity> _oldPropertyRepository;
    private readonly IReportDataRepository<PropertyDetailsEntity> _propertyDetailsRepository;
    private readonly IReportDataRepository<RVCalculationResultsEntity> _rvResultsRepository;
    private readonly IUlbConfigService _ulbConfigService;
    private readonly IDocumentApplicationService _documentService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IReportDataRepository<OldWardWiseRateEntity>? _oldWardWiseRateRepository;
    private readonly IReportDataRepository<OldWardMasterEntity>? _oldWardMasterRepository;
    private readonly IReportDataRepository<OldZoneMasterEntity>? _oldZoneMasterRepository;

    public SignpageThaneDataProvider(
        IReportDataRepository<PropertyEntity> propertyRepository,
        IReportDataRepository<WardEntity> wardRepository,
        IReportDataRepository<PropertyMapDetailEntity> propertyMapRepository,
        IReportDataRepository<PropertyMastOldEntity> oldPropertyRepository,
        IReportDataRepository<PropertyDetailsEntity> propertyDetailsRepository,
        IReportDataRepository<RVCalculationResultsEntity> rvResultsRepository,
        IUlbConfigService ulbConfigService,
        IDocumentApplicationService documentService,
        IHttpClientFactory httpClientFactory,
        IReportDataRepository<OldWardWiseRateEntity>? oldWardWiseRateRepository = null,
        IReportDataRepository<OldWardMasterEntity>? oldWardMasterRepository = null,
        IReportDataRepository<OldZoneMasterEntity>? oldZoneMasterRepository = null)
    {
        _propertyRepository = propertyRepository;
        _wardRepository = wardRepository;
        _propertyMapRepository = propertyMapRepository;
        _oldPropertyRepository = oldPropertyRepository;
        _propertyDetailsRepository = propertyDetailsRepository;
        _rvResultsRepository = rvResultsRepository;
        _ulbConfigService = ulbConfigService;
        _documentService = documentService;
        _httpClientFactory = httpClientFactory;
        _oldWardWiseRateRepository = oldWardWiseRateRepository;
        _oldWardMasterRepository = oldWardMasterRepository;
        _oldZoneMasterRepository = oldZoneMasterRepository;
    }

    public string ProviderCode => "SignpageThaneDataProvider";

    public IReadOnlyList<HtmlReportDataSourceFieldDto> GetSchemaFields()
        => new HtmlReportDataSourceFieldDto[]
        {
            new("ulbName", "ULB Name", "field", "ULB"),
            new("ulbLogo", "ULB Logo", "image", "ULB"),
            new("printDate", "Print Date", "field", "Report"),
            new("upicId", "UPIC ID", "field", "Property"),
            new("propertyDescription", "Property Description", "field", "Property"),
            new("oldWardNo", "Old Ward No.", "field", "Old Property"),
            new("newWardNo", "New Ward No.", "field", "Property"),
            new("oldPropertyNo", "Old Property No.", "field", "Old Property"),
            new("newPropertyNo", "New Property No.", "field", "Property"),
            new("wingNo", "Wing No.", "field", "Property"),
            new("propertyAddress", "Property Address", "field", "Property"),
            new("builderName", "Structure Owner / Builder", "field", "Society"),
            new("structureOwnerName", "Structure Owner", "field", "Property"),
            new("wardOffice", "Ward Office", "field", "Location"),
            new("collectionOffice", "Collection Office", "field", "Location"),

            new("cTotalProperty", "Non-Residential No. of Properties", "field", "Property Summary", "number"),
            new("cTotalCarpetArea", "Non-Residential Carpet Area", "field", "Property Summary", "number"),
            new("cTotalRateableValue", "Non-Residential Rateable Value", "field", "Property Summary", "number"),

            new("aminityTotalProperty", "Amenity No. of Properties", "field", "Property Summary", "number"),
            new("aminityTotalCarpetArea", "Amenity Carpet Area", "field", "Property Summary", "number"),
            new("aminityTotalRateableValue", "Amenity Rateable Value", "field", "Property Summary", "number"),

            new("rTotalProperty", "Residential Property Count", "field", "Property Summary", "number"),
            new("rTotalCarpetArea", "Residential Taxable Carpet Area", "field", "Property Summary", "number"),
            new("rTotalRateableValue", "Residential Rateable Value", "field", "Property Summary", "number"),

            new("rcTotalProperty", "Residential Non-Residential Property Count", "field", "Property Summary", "number"),
            new("rcTotalCarpetArea", "Residential Non-Residential Taxable Carpet Area", "field", "Property Summary", "number"),
            new("rcTotalRateableValue", "Residential Non-Residential Rateable Value", "field", "Property Summary", "number"),

            new("totalProperty", "Total Property Count", "field", "Property Summary", "number"),
            new("totalCarpetArea", "Total Taxable Carpet Area", "field", "Property Summary", "number"),
            new("totalRateableValue", "Total Rateable Value", "field", "Property Summary", "number"),
            new("RATotalRatableValue", "निवासी करयोग्य मूल्य", "field", "Valuation Statement", "number"),
            new("CATotalRatableValue", "बिगरनिवासी करयोग्य मूल्य", "field", "Valuation Statement", "number"),
            new("TotalRatableValue", "एकूण करयोग्य मूल्य", "field", "Valuation Statement", "number"),
            new("MarathiTotalRatebleValue", "एकूण करयोग्य मूल्य अक्षरी (मराठी)", "field", "Valuation Statement")
        };

    public async Task<object> GetDataAsync(
        Dictionary<string, string> parameters,
        CancellationToken ct = default)
    {
        if (!parameters.TryGetValue("propertyId", out var value)
            || !int.TryParse(value, out var propertyId)
            || propertyId <= 0)
        {
            throw new ArgumentException("Valid propertyId is required.");
        }

        var property = await _propertyRepository.GetQueryable()
            .AsNoTracking()
            .Where(p => p.Id == propertyId && p.IsActive && !p.MarkedForDeletion)
            .Select(p => new
            {
                p.Id,
                upicId = p.UPICId,
                propertyDescription = p.PropertyTypeMaster != null
                    ? (p.PropertyTypeMaster.PropertyDescription ?? p.PropertyTypeMaster.PropertyDescriptionEnglish) : null,
                propertyOwnerEnglish = p.OwnerNameEnglish,
                propertyOwnerRegional = p.OwnerName,
                addressEnglish = p.AddressEnglish ?? p.Address,
                p.WardId,
                p.PropertyNo,
                p.PropertyMastOldId,
                partType = p.PropertyTypeMaster != null ? p.PropertyTypeMaster.PartType : null,
                masterType = p.PropertyTypeMaster != null ? p.PropertyTypeMaster.Type : null,
                propertyType = p.Type,
                wingNo = p.WingDetailsMast != null
                    && p.WingDetailsMast.IsActive
                    && !p.WingDetailsMast.MarkedForDeletion
                    && p.WingDetailsMast.WingMaster != null
                    && p.WingDetailsMast.WingMaster.IsActive
                    ? p.WingDetailsMast.WingMaster.WingNo : null
            })
            .SingleOrDefaultAsync(ct);

        if (property is null)
        {
            throw new KeyNotFoundException("Property was not found.");
        }

        var ward = await _wardRepository.GetQueryable()
            .AsNoTracking()
            .Where(w => w.Id == property.WardId && w.IsActive)
            .Select(w => new { w.WardNo })
            .SingleOrDefaultAsync(ct);

        var oldProperties = await (
            from mapping in _propertyMapRepository.GetQueryable().AsNoTracking()
            join oldProperty in _oldPropertyRepository.GetQueryable().AsNoTracking()
                on mapping.PropertyIdOld equals (int?)oldProperty.Id
            where mapping.PropertyIdNew == propertyId
                && mapping.IsActive && mapping.IsCurrent && mapping.Status == "ACTIVE"
                && oldProperty.IsActive && !oldProperty.MarkedForDeletion
            select new { oldProperty.OldWardNo, oldProperty.OldPropertyNo }
        ).ToListAsync(ct);

        if (oldProperties.Count == 0 && property.PropertyMastOldId is > 0)
        {
            oldProperties = await _oldPropertyRepository.GetQueryable().AsNoTracking()
                .Where(p => p.Id == property.PropertyMastOldId.Value
                    && p.IsActive && !p.MarkedForDeletion)
                .Select(p => new { p.OldWardNo, p.OldPropertyNo }).ToListAsync(ct);
        }

        var oldWardNo = string.Join(", ", oldProperties
            .Select(p => p.OldWardNo?.Trim())
            .Where(v => !string.IsNullOrWhiteSpace(v)).Distinct().OrderBy(v => v));
        var oldPropertyNo = string.Join(", ", oldProperties
            .Select(p => p.OldPropertyNo?.Trim())
            .Where(v => !string.IsNullOrWhiteSpace(v)).Distinct().OrderBy(v => v));

        var (collectionOffice, wardOffice) = await ResolveOldWardOfficesAsync(
            oldProperties.Select(p => p.OldWardNo), ct);
        var structureOwnerName = FrontpageThaneDataProvider.ResolveStructureOwnerName(
            property.propertyOwnerEnglish, property.propertyOwnerRegional);

        var summaryDetails = await _propertyDetailsRepository.GetQueryable()
            .AsNoTracking()
            .Where(pd => pd.PropertyId == propertyId && pd.IsActive && !pd.MarkedForDeletion)
            .Select(pd => new
            {
                pd.Id,
                pd.IsTaxable,
                pd.CarpetAreaSqMeter,
                usageType = pd.TypeOfUse != null ? pd.TypeOfUse.Type : null
            })
            .ToListAsync(ct);

        var savedRv = await _rvResultsRepository.GetQueryable().AsNoTracking()
            .Where(rv => rv.PropertyId == propertyId && rv.IsActive && !rv.MarkedForDeletion)
            .Select(rv => new { rv.Id, rv.PropertyDetailsId, rv.UpdatedDate, rv.CreatedDate, rv.RateableValue })
            .ToListAsync(ct);

        var rvByDetail = savedRv.GroupBy(rv => rv.PropertyDetailsId).ToDictionary(
            group => group.Key,
            group => group.OrderByDescending(rv => rv.UpdatedDate ?? rv.CreatedDate)
                .ThenByDescending(rv => rv.Id).First().RateableValue);

        var summary = new SpecialNoticeThaneSummary(summaryDetails.Select(detail =>
            new SpecialNoticeSummaryDetail(propertyId, detail.Id,
                SpecialNoticeThaneSummary.Classify(property.partType,
                    string.IsNullOrWhiteSpace(property.masterType) ? property.propertyType : property.masterType,
                    detail.usageType),
                detail.IsTaxable != false && !string.Equals(detail.usageType, "N", StringComparison.OrdinalIgnoreCase),
                detail.CarpetAreaSqMeter.HasValue ? Convert.ToDecimal(detail.CarpetAreaSqMeter.Value) : null,
                rvByDetail.GetValueOrDefault(detail.Id))));

        var nonResidential = summary.Columns[SpecialNoticeSummaryColumn.NonResidential];
        var amenity = summary.Columns[SpecialNoticeSummaryColumn.Amenity];
        var residential = summary.Columns[SpecialNoticeSummaryColumn.Residential];
        var residentialNonResidential = summary.Columns[SpecialNoticeSummaryColumn.ResidentialNonResidential];
        // The two-column statement groups every non-residential summary bucket together.
        var nonResidentialStatementRv = nonResidential.RateableValue
            + residentialNonResidential.RateableValue + amenity.RateableValue;

        var ulb = await _ulbConfigService.GetUlbConfigAsync(ct);
        var logo = await EmbeddedReportImage.LoadLogoAsync(
            ulb?.UlbLogo, _documentService, _httpClientFactory, ct);

        var record = new Dictionary<string, object?>
        {
            ["ulbName"] = ulb?.UlbName,
            ["ulbLogo"] = logo.DataUrl,
            ["printDate"] = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromMinutes(330))
                .ToString("dd-MM-yyyy", CultureInfo.InvariantCulture),
            ["upicId"] = property.upicId,
            ["propertyDescription"] = property.propertyDescription,
            ["RATotalRatableValue"] = residential.RateableValue,
            ["CATotalRatableValue"] = nonResidentialStatementRv,
            ["TotalRatableValue"] = summary.Total.RateableValue,
            ["MarathiTotalRatebleValue"] = MarathiAmountWords.Convert(summary.Total.RateableValue),
            ["oldWardNo"] = oldWardNo,
            ["newWardNo"] = ward?.WardNo,
            ["oldPropertyNo"] = oldPropertyNo,
            ["newPropertyNo"] = property.PropertyNo,
            ["wingNo"] = property.wingNo,
            ["propertyAddress"] = property.addressEnglish,
            ["builderName"] = structureOwnerName,
            ["structureOwnerName"] = structureOwnerName,
            ["wardOffice"] = wardOffice,
            ["collectionOffice"] = collectionOffice,

            // Non-Residential (C)
            ["cTotalProperty"] = nonResidential.PropertyCount,
            ["cTotalCarpetArea"] = nonResidential.CarpetArea,
            ["cTotalRateableValue"] = nonResidential.RateableValue,

            // Amenity
            ["aminityTotalProperty"] = amenity.PropertyCount,
            ["aminityTotalCarpetArea"] = amenity.CarpetArea,
            ["aminityTotalRateableValue"] = amenity.RateableValue,

            // Residential (R)
            ["rTotalProperty"] = residential.PropertyCount,
            ["rTotalCarpetArea"] = residential.CarpetArea,
            ["rTotalRateableValue"] = residential.RateableValue,

            // Residential Non-Residential (RC)
            ["rcTotalProperty"] = residentialNonResidential.PropertyCount,
            ["rcTotalCarpetArea"] = residentialNonResidential.CarpetArea,
            ["rcTotalRateableValue"] = residentialNonResidential.RateableValue,

            // Total
            ["totalProperty"] = summary.Total.PropertyCount,
            ["totalCarpetArea"] = summary.Total.CarpetArea,
            ["totalRateableValue"] = summary.Total.RateableValue
        };

        return new List<object> { record };
    }

    private async Task<(string? CollectionOffice, string? WardOffice)> ResolveOldWardOfficesAsync(
        IEnumerable<string?> oldWardNumbers, CancellationToken ct)
    {
        var wards = oldWardNumbers.Where(w => !string.IsNullOrWhiteSpace(w))
            .Select(w => w!.Trim()).Distinct().ToArray();
        if (wards.Length == 0 || _oldWardWiseRateRepository is null
            || _oldWardMasterRepository is null || _oldZoneMasterRepository is null) return (null, null);
        var offices = await (
            from ward in _oldWardMasterRepository.GetQueryable().AsNoTracking()
            join rate in _oldWardWiseRateRepository.GetQueryable().AsNoTracking() on ward.Id equals rate.OldWardId
            join zone in _oldZoneMasterRepository.GetQueryable().AsNoTracking()
                on (ward.OldZoneId > 0 ? ward.OldZoneId : (rate.OldZoneId ?? 0)) equals zone.Id
            where wards.Contains(ward.OldWardNo)
            select new { rate.CollectionWard, zone.Description, zone.OldZoneNo }
        ).ToListAsync(ct);
        return (string.Join(", ", offices.Select(o => o.CollectionWard?.Trim())
                .Where(v => !string.IsNullOrWhiteSpace(v)).Distinct().OrderBy(v => v)),
            string.Join(", ", offices.Select(o => (!string.IsNullOrWhiteSpace(o.Description) ? o.Description : o.OldZoneNo)?.Trim())
                .Where(v => !string.IsNullOrWhiteSpace(v)).Distinct().OrderBy(v => v)));
    }
}
