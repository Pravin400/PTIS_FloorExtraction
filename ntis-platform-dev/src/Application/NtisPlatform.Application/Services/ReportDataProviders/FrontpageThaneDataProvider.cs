using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.HtmlReport;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Services.TaxEngine;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.RetrospectiveTax;
using NtisPlatform.Core.Interfaces;
using System.Globalization;

namespace NtisPlatform.Application.Services.ReportDataProviders;

public class FrontpageThaneDataProvider : IReportDataProvider, IReportSchemaProvider
{
    private readonly IReportDataRepository<PropertyEntity> _propertyRepository;
    private readonly IReportDataRepository<WardEntity> _wardRepository;
    private readonly IReportDataRepository<PropertyMapDetailEntity> _propertyMapRepository;
    private readonly IReportDataRepository<PropertyMastOldEntity> _oldPropertyRepository;
    private readonly IReportDataRepository<SocietyDetailsEntity> _societyRepository;
    private readonly IReportDataRepository<PropertyDetailsEntity> _propertyDetailsRepository;
    private readonly IReportDataRepository<PropertyCertificateEntity> _certificateRepository;
    private readonly IReportDataRepository<PropertyCertificateTypeMasterEntity> _certificateTypeRepository;
    private readonly IReportDataRepository<RVCalculationResultsEntity> _rvResultsRepository;
    private readonly IReportDataRepository<PropertyPhotoEntity> _photoRepository;
    private readonly IReportDataRepository<BuildingPlanTypeEntity> _planRepository;
    private readonly IUlbConfigService _ulbConfigService;
    private readonly IDocumentApplicationService _documentService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IPolicyConfigurationService _policyConfigurationService;
    private readonly IReportDataRepository<RetrospectiveTaxCalculationEntity> _assessmentRepository;
    private readonly IReportDataRepository<OldWardWiseRateEntity>? _oldWardWiseRateRepository;
    private readonly IReportDataRepository<OldWardMasterEntity>? _oldWardMasterRepository;
    private readonly IReportDataRepository<OldZoneMasterEntity>? _oldZoneMasterRepository;

    public FrontpageThaneDataProvider(
        IReportDataRepository<PropertyEntity> propertyRepository,
        IReportDataRepository<WardEntity> wardRepository,
        IReportDataRepository<PropertyMapDetailEntity> propertyMapRepository,
        IReportDataRepository<PropertyMastOldEntity> oldPropertyRepository,
        IReportDataRepository<SocietyDetailsEntity> societyRepository,
        IReportDataRepository<PropertyDetailsEntity> propertyDetailsRepository,
        IReportDataRepository<PropertyCertificateEntity> certificateRepository,
        IReportDataRepository<PropertyCertificateTypeMasterEntity> certificateTypeRepository,
        IReportDataRepository<RVCalculationResultsEntity> rvResultsRepository,
        IReportDataRepository<PropertyPhotoEntity> photoRepository,
        IReportDataRepository<BuildingPlanTypeEntity> planRepository,
        IUlbConfigService ulbConfigService,
        IDocumentApplicationService documentService,
        IHttpClientFactory httpClientFactory,
        // Keep legacy rate/zone parameters compatible with existing callers.
        IReportDataRepository<RateEntity> rateRepository,
        IReportDataRepository<RateSectionDetailsEntity> rateSectionRepository,
        IReportDataRepository<AssessmentYearRangeEntity> yearRangeRepository,
        IPolicyConfigurationService policyConfigurationService,
        IReportDataRepository<RetrospectiveTaxCalculationEntity> assessmentRepository,
        IReportDataRepository<ZoneEntity>? zoneRepository = null,
        IReportDataRepository<OldWardWiseRateEntity>? oldWardWiseRateRepository = null,
        IReportDataRepository<OldWardMasterEntity>? oldWardMasterRepository = null,
        IReportDataRepository<OldZoneMasterEntity>? oldZoneMasterRepository = null)
    {
        _propertyRepository = propertyRepository;
        _wardRepository = wardRepository;
        _propertyMapRepository = propertyMapRepository;
        _oldPropertyRepository = oldPropertyRepository;
        _societyRepository = societyRepository;
        _propertyDetailsRepository = propertyDetailsRepository;
        _certificateRepository = certificateRepository;
        _certificateTypeRepository = certificateTypeRepository;
        _rvResultsRepository = rvResultsRepository;
        _photoRepository = photoRepository;
        _planRepository = planRepository;
        _ulbConfigService = ulbConfigService;
        _documentService = documentService;
        _httpClientFactory = httpClientFactory;
        _policyConfigurationService = policyConfigurationService;
        _assessmentRepository = assessmentRepository;
        _oldWardWiseRateRepository = oldWardWiseRateRepository;
        _oldWardMasterRepository = oldWardMasterRepository;
        _oldZoneMasterRepository = oldZoneMasterRepository;
    }

    public string ProviderCode => "FrontpageThaneDataProvider";

    public IReadOnlyList<HtmlReportDataSourceFieldDto> GetSchemaFields()
        => new HtmlReportDataSourceFieldDto[]
        {
            new("upicId", "UPIC ID", "field", "Property"),
            new("oldWardNo", "Old Ward No.", "field", "Old Property"),
            new("newWardNo", "New Ward No.", "field", "Property"),
            new("collectionOffice", "Collection Office", "field", "Location"),
            new("wardOffice", "Ward Office", "field", "Location"),
            new("oldPropertyNo", "Old Property No.", "field", "Old Property"),
            new("newPropertyNo", "New Property No.", "field", "Property"),
            new("wingNo", "Wing No.", "field", "Property"),
            new("propertyDescription", "Property Description", "field", "Property"),
            new("descriptionEnglish", "Description English", "field", "Property"),
            new("Description English", "Description English", "field", "Property"),
            new("builderName", "Structure Owner / Builder", "field", "Society"),
            new("structureOwnerName", "Structure Owner", "field", "Property"),
            new("propertyEmailId", "Email", "field", "Property"),
            new("addressEnglish", "Property Address", "field", "Property"),
            new("propertyAddress", "Property Address", "field", "Property"),
            new("MarathiOwnerPatta", "Property Address (Patta)", "field", "Property"),
            new("mobileNo", "Mobile No.", "field", "Property"),
            new("constructionType", "Construction Type", "field", "Property"),
            new("RRate", "Residential Standard Rent Rate", "field", "Assessment", "string"),
            new("CRate", "Commercial Standard Rent Rate", "field", "Assessment", "string"),
            new("standardRentAreaUnit", "Standard Rent Area Unit", "field", "Assessment"),
            new("billType", "Bill Type", "field", "Assessment"),
            new("assessmentType", "Assessment Type", "field", "Assessment"),
            new("assessmentDate", "Date Of Assessment", "field", "Assessment"),
            new("commencementCertificateNo", "Commencement Certificate No", "field", "Assessment"),
            new("occupancyCertificateNo", "Occupancy Certificate No", "field", "Assessment"),
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
            new("ulbLogo", "ULB Logo", "image", "ULB"),
            new("propertyPhoto", "Property Photo", "image", "Photos"),
            new("photoPlan", "Photo Plan", "image", "Photos"),
            new("propertyPhotoStatus", "Property Photo Status", "field", "Photos"),
            new("planPhotoStatus", "Plan Photo Status", "field", "Photos"),
            new("ulbName", "ULB Name", "field", "ULB"),
            new("ulbAddress", "ULB Address", "field", "ULB"),
            new("printDate", "Print Date", "field", "Report")
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
                upicId = p.UPICId,
                propertyOwnerEnglish = p.OwnerNameEnglish,
                propertyOwnerRegional = p.OwnerName,
                propertyEmailId = p.EmailId,
                addressEnglish = p.AddressEnglish ?? p.Address,
                mobileNo = p.MobileNo,
                p.WardId,
                p.TaxZoneId,
                p.PropertyNo,
                p.PropertyMastOldId,
                certificateWingId = p.WingDetailsMast != null
                    && p.WingDetailsMast.IsActive && !p.WingDetailsMast.MarkedForDeletion
                    ? (int?)p.WingDetailsMast.Id : null,
                certificateSocietyId = p.WingDetailsMast != null
                    && p.WingDetailsMast.IsActive && !p.WingDetailsMast.MarkedForDeletion
                    && p.WingDetailsMast.SocietyDetailsMast != null
                    && p.WingDetailsMast.SocietyDetailsMast.IsActive
                    && !p.WingDetailsMast.SocietyDetailsMast.MarkedForDeletion
                    ? (int?)p.WingDetailsMast.SocietyDetailsMastId : null,
                partType = p.PropertyTypeMaster != null ? p.PropertyTypeMaster.PartType : null,
                masterType = p.PropertyTypeMaster != null ? p.PropertyTypeMaster.Type : null,
                propertyType = p.Type,
                // WingDetailId references WingDetailsMast, which links to WingMaster.
                wingNo = p.WingDetailsMast != null
                    && p.WingDetailsMast.IsActive
                    && !p.WingDetailsMast.MarkedForDeletion
                    && p.WingDetailsMast.WingMaster != null
                    && p.WingDetailsMast.WingMaster.IsActive
                    ? p.WingDetailsMast.WingMaster.WingNo : null,
                propertyDescription = p.PropertyTypeMaster != null
                    ? (p.PropertyTypeMaster.PropertyDescription ?? p.PropertyTypeMaster.PropertyDescriptionEnglish) : null
            })
            .SingleOrDefaultAsync(ct);

        if (property is null)
        {
            throw new KeyNotFoundException("Property was not found.");
        }

        var ward = await _wardRepository.GetQueryable()
            .AsNoTracking()
            .Where(w => w.Id == property.WardId && w.IsActive)
            .Select(w => new { w.WardNo, w.ZoneId })
            .SingleOrDefaultAsync(ct);

        // Use current active old-to-new mappings, as in SpecialNoticeThane.
        var oldProperties = await (
            from mapping in _propertyMapRepository.GetQueryable().AsNoTracking()
            join oldProperty in _oldPropertyRepository.GetQueryable().AsNoTracking()
                on mapping.PropertyIdOld equals (int?)oldProperty.Id
            where mapping.PropertyIdNew == propertyId
                && mapping.IsActive && mapping.IsCurrent && mapping.Status == "ACTIVE"
                && oldProperty.IsActive && !oldProperty.MarkedForDeletion
            select new { oldProperty.OldWardNo, oldProperty.OldPropertyNo }
        ).ToListAsync(ct);

        // Migrated properties may have a direct old-property link instead.
        if (oldProperties.Count == 0 && property.PropertyMastOldId is > 0)
        {
            oldProperties = await _oldPropertyRepository.GetQueryable().AsNoTracking()
                .Where(p => p.Id == property.PropertyMastOldId.Value
                    && p.IsActive && !p.MarkedForDeletion)
                .Select(p => new { p.OldWardNo, p.OldPropertyNo }).ToListAsync(ct);
        }

        var oldWardNo = string.Join(", ", oldProperties
            .Select(p => p.OldWardNo?.Trim())
            .Where(value => !string.IsNullOrWhiteSpace(value)).Distinct().OrderBy(value => value));
        var oldPropertyNo = string.Join(", ", oldProperties
            .Select(p => p.OldPropertyNo?.Trim())
            .Where(value => !string.IsNullOrWhiteSpace(value)).Distinct().OrderBy(value => value));

        var societies = await _societyRepository.GetQueryable()
            .AsNoTracking()
            .Where(s => s.PropertyId == propertyId && s.IsActive && !s.MarkedForDeletion)
            .Select(s => new { s.Id })
            .Take(2)
            .ToListAsync(ct);

        if (societies.Count > 1)
        {
            throw new InvalidOperationException(
                $"Multiple active society records found for property {propertyId}.");
        }

        var society = societies.SingleOrDefault();

        var policyValues = await _policyConfigurationService.GetPolicyValuesAsync(
            new Dictionary<string, string>
            {
                [RateableValuePolicyConstants.RateMasterAreaUnit] = RateableValuePolicyConstants.DefaultAreaUnit
            }, ct);
        var rateOptions = RateableValuePolicyOptions.FromPolicies(policyValues);
        var oldWardNumbers = oldProperties.Select(p => p.OldWardNo).ToArray();
        var (collectionOffice, wardOffice) = await ResolveOldWardOfficesAsync(oldWardNumbers, ct);
        var (residentialRate, commercialRate) = await LoadOldWardStandardRentAsync(oldWardNumbers, propertyId, ct);
        var structureOwnerName = ResolveStructureOwnerName(
            property.propertyOwnerEnglish, property.propertyOwnerRegional);

        var summaryDetails = await _propertyDetailsRepository.GetQueryable()
            .AsNoTracking()
            .Where(pd => pd.PropertyId == propertyId && pd.IsActive && !pd.MarkedForDeletion)
            .Select(pd => new
            {
                pd.Id, pd.IsTaxable, pd.CarpetAreaSqMeter,
                constructionCode = pd.ConstructionType != null ? pd.ConstructionType.ConstructionCode : null,
                constructionDescription = pd.ConstructionType != null ? pd.ConstructionType.Description : null,
                usageType = pd.TypeOfUse != null ? pd.TypeOfUse.Type : null
            })
            .ToListAsync(ct);

        var constructionType = string.Join(", ", summaryDetails
            .Select(d => string.IsNullOrWhiteSpace(d.constructionCode)
                ? d.constructionDescription?.Trim() : d.constructionCode.Trim())
            .Where(value => !string.IsNullOrWhiteSpace(value)).Distinct().OrderBy(value => value));

        var savedRv = await _rvResultsRepository.GetQueryable().AsNoTracking()
            .Where(rv => rv.PropertyId == propertyId && rv.IsActive && !rv.MarkedForDeletion)
            .Select(rv => new { rv.Id, rv.PropertyDetailsId, rv.UpdatedDate, rv.CreatedDate, rv.RateableValue })
            .ToListAsync(ct);
        // Use the latest active saved result per detail, as in SpecialNoticeThane.
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

        // Match SpecialNoticeThane: property certificates only, first matching OC/CC.
        var certificates = await (
            from cert in _certificateRepository.GetQueryable().AsNoTracking()
            join type in _certificateTypeRepository.GetQueryable().AsNoTracking()
                on cert.CertificateTypeId equals type.Id
            where cert.PropertyId == propertyId
                && cert.IsActive && !cert.MarkedForDeletion && type.IsActive
            select new { type.CertificateTypeCode, cert.CertificateNo }
        ).ToListAsync(ct);

        var ocNo = certificates
            .Where(c => c.CertificateTypeCode == "OC")
            .Select(c => c.CertificateNo)
            .FirstOrDefault();
        var commencementNo = certificates
            .Where(c => c.CertificateTypeCode == "CC")
            .Select(c => c.CertificateNo)
            .FirstOrDefault();
        var billType = DetermineBillType(ocNo, commencementNo);

        // Certificate number fields retain their property/wing/society fallback.
        var directSocietyId = (int?)society?.Id;
        var displayCertificates = await (
            from cert in _certificateRepository.GetQueryable().AsNoTracking()
            join type in _certificateTypeRepository.GetQueryable().AsNoTracking()
                on cert.CertificateTypeId equals type.Id
            where cert.IsActive && !cert.MarkedForDeletion && type.IsActive
                && (cert.PropertyId == propertyId
                    || (cert.EntityType == "W" && property.certificateWingId.HasValue
                        && cert.WingDetailId == property.certificateWingId)
                    || (cert.EntityType == "S"
                        && ((property.certificateSocietyId.HasValue && cert.SocietyDetailId == property.certificateSocietyId)
                            || (directSocietyId.HasValue && cert.SocietyDetailId == directSocietyId))))
            select new
            {
                type.CertificateTypeCode, cert.CertificateNo, cert.Id,
                ChangedDate = cert.UpdatedDate ?? cert.CreatedDate,
                ScopePriority = cert.PropertyId == propertyId ? 0 : cert.EntityType == "W" ? 1 : 2
            }
        ).ToListAsync(ct);
        var validDisplayCertificates = displayCertificates.Where(c => IsValidCertNo(c.CertificateNo))
            .OrderBy(c => c.ScopePriority).ThenByDescending(c => c.ChangedDate).ThenByDescending(c => c.Id);
        var displayOcNo = validDisplayCertificates
            .Where(c => string.Equals(c.CertificateTypeCode?.Trim(), "OC", StringComparison.OrdinalIgnoreCase))
            .Select(c => c.CertificateNo).FirstOrDefault();
        var displayCommencementNo = validDisplayCertificates
            .Where(c => string.Equals(c.CertificateTypeCode?.Trim(), "CC", StringComparison.OrdinalIgnoreCase))
            .Select(c => c.CertificateNo).FirstOrDefault();

        var images = await LoadFrontpageImagesAsync(propertyId, ct);
        var ulb = await _ulbConfigService.GetUlbConfigAsync(ct);
        var logo = await EmbeddedReportImage.LoadLogoAsync(
            ulb?.UlbLogo, _documentService, _httpClientFactory, ct);

        // Select the latest assessment before checking status; do not fall back to an older calculated record.
        var assessment = await _assessmentRepository.GetQueryable().AsNoTracking()
            .Where(a => a.PropertyId == propertyId && a.IsActive && !a.MarkedForDeletion
                && a.CalculationMode == "PROPERTY")
            .OrderByDescending(a => a.AssessmentDate).ThenByDescending(a => a.Id)
            .Select(a => new { a.AssessmentDate, a.CalculationStatus })
            .FirstOrDefaultAsync(ct);
        var assessmentDate = assessment is not null
            && string.Equals(assessment.CalculationStatus, "Calculated", StringComparison.OrdinalIgnoreCase)
                ? assessment.AssessmentDate.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture)
                : "-";

        var record = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
        {
            ["upicId"] = property.upicId,
            ["oldWardNo"] = oldWardNo,
            ["newWardNo"] = ward?.WardNo,
            ["collectionOffice"] = collectionOffice,
            ["wardOffice"] = wardOffice,
            ["oldPropertyNo"] = oldPropertyNo,
            ["newPropertyNo"] = property.PropertyNo,
            ["wingNo"] = property.wingNo,
            ["propertyDescription"] = property.propertyDescription,
            ["PropertyDescription"] = property.propertyDescription,
            ["Description English"] = property.propertyDescription,
            ["DescriptionEnglish"] = property.propertyDescription,
            ["descriptionEnglish"] = property.propertyDescription,
            ["builderName"] = structureOwnerName,
            ["structureOwnerName"] = structureOwnerName,
            ["propertyEmailId"] = property.propertyEmailId,
            ["addressEnglish"] = property.addressEnglish,
            ["propertyAddress"] = property.addressEnglish,
            ["address"] = property.addressEnglish,
            ["Address"] = property.addressEnglish,
            ["MarathiOwnerPatta"] = property.addressEnglish,
            ["marathiOwnerPatta"] = property.addressEnglish,
            ["MarathiOwnerAddress"] = property.addressEnglish,
            ["mobileNo"] = property.mobileNo,
            ["constructionType"] = constructionType,
            ["RRate"] = residentialRate,
            ["CRate"] = commercialRate,
            ["standardRentAreaUnit"] = rateOptions.AreaUnit,
            ["billType"] = billType,
            ["assessmentType"] = "Standard Rent",
            ["assessmentDate"] = assessmentDate,
            ["commencementCertificateNo"] = IsValidCertNo(displayCommencementNo) ? displayCommencementNo : "-",
            ["occupancyCertificateNo"] = IsValidCertNo(displayOcNo) ? displayOcNo : "-",
            ["cTotalProperty"] = nonResidential.PropertyCount,
            ["cTotalCarpetArea"] = nonResidential.CarpetArea,
            ["cTotalRateableValue"] = nonResidential.RateableValue,
            ["aminityTotalProperty"] = amenity.PropertyCount,
            ["aminityTotalCarpetArea"] = amenity.CarpetArea,
            ["aminityTotalRateableValue"] = amenity.RateableValue,
            ["rTotalProperty"] = residential.PropertyCount,
            ["rTotalCarpetArea"] = residential.CarpetArea,
            ["rTotalRateableValue"] = residential.RateableValue,
            ["rcTotalProperty"] = residentialNonResidential.PropertyCount,
            ["rcTotalCarpetArea"] = residentialNonResidential.CarpetArea,
            ["rcTotalRateableValue"] = residentialNonResidential.RateableValue,
            ["totalProperty"] = summary.Total.PropertyCount,
            ["totalCarpetArea"] = summary.Total.CarpetArea,
            ["totalRateableValue"] = summary.Total.RateableValue,
            ["ulbLogo"] = logo.DataUrl,
            ["propertyPhoto"] = images.Photo.DataUrl,
            ["photoPlan"] = images.Plan.DataUrl,
            ["propertyPhotoStatus"] = images.Photo.Status,
            ["planPhotoStatus"] = images.Plan.Status,
            ["ulbName"] = ulb?.UlbName,
            ["ulbAddress"] = ulb?.UlbAddress,
            ["printDate"] = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromMinutes(330))
                .ToString("dd-MM-yyyy", CultureInfo.InvariantCulture)
        };

        return new List<object> { record };
    }

    internal async Task<(string? CollectionOffice, string? WardOffice)> ResolveOldWardOfficesAsync(
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

    private async Task<(string? Residential, string? Commercial)> LoadOldWardStandardRentAsync(
        IEnumerable<string?> oldWardNumbers, int propertyId, CancellationToken ct)
    {
        var wards = oldWardNumbers.Where(w => !string.IsNullOrWhiteSpace(w))
            .Select(w => w!.Trim()).Distinct().ToArray();
        if (wards.Length == 0 || _oldWardWiseRateRepository is null) return (null, null);
        var codes = await _propertyDetailsRepository.GetQueryable().AsNoTracking()
            .Where(d => d.PropertyId == propertyId && d.IsActive && !d.MarkedForDeletion)
            .Select(d => d.ConstructionType != null && d.ConstructionType.IsActive
                ? d.ConstructionType.ConstructionCode : null).Distinct().ToListAsync(ct);
        if (codes.Count == 0 || codes.Any(string.IsNullOrWhiteSpace)) return (null, null);
        var rows = await _oldWardWiseRateRepository.GetQueryable().AsNoTracking()
            .Where(r => r.OldWard != null && r.OldWard.IsActive && wards.Contains(r.OldWard.OldWardNo))
            .Select(r => new OldWardRentRow(
                r.OldWard!.OldWardNo, r.ConstructionType != null ? r.ConstructionType.ConstructionCode : null,
                r.Residential, r.NonResidential)).ToListAsync(ct);
        return (ResolveOldWardRentDisplay(wards, codes.Select(c => c!), rows, false),
            ResolveOldWardRentDisplay(wards, codes.Select(c => c!), rows, true));
    }

    internal async Task<(EmbeddedReportImage Photo, EmbeddedReportImage Plan)> LoadFrontpageImagesAsync(int propertyId, CancellationToken ct)
    {
        var property = await _propertyRepository.GetQueryable().AsNoTracking()
            .Where(p => p.Id == propertyId && p.IsActive && !p.MarkedForDeletion)
            .Select(p => new
            {
                p.WardId, p.PropertyNo, p.WingDetailId, p.Type, p.CategoryId,
                PartType = p.PropertyTypeMaster != null ? p.PropertyTypeMaster.PartType : null,
                Description = p.PropertyTypeMaster != null ? p.PropertyTypeMaster.PropertyDescription : null,
                WingSocietyId = p.WingDetailsMast != null && p.WingDetailsMast.IsActive
                    && !p.WingDetailsMast.MarkedForDeletion ? (int?)p.WingDetailsMast.SocietyDetailsMastId : null
            }).SingleAsync(ct);
        var societyId = property.WingSocietyId ?? await _societyRepository.GetQueryable().AsNoTracking()
            .Where(s => s.IsActive && !s.MarkedForDeletion && s.PropertyMast != null
                && s.PropertyMast.IsActive && !s.PropertyMast.MarkedForDeletion
                && s.PropertyMast.WardId == property.WardId && s.PropertyMast.PropertyNo == property.PropertyNo)
            .OrderByDescending(s => s.PropertyId == propertyId).ThenByDescending(s => s.Id)
            .Select(s => (int?)s.Id).FirstOrDefaultAsync(ct);
        var allowSharedPlan = property.CategoryId == 1
            && !string.Equals(property.PartType, "Amenity", StringComparison.OrdinalIgnoreCase)
            && !(property.Description?.Contains("Amenity", StringComparison.OrdinalIgnoreCase) ?? false)
            && !(property.Description?.Contains("अॅमिनीटी", StringComparison.Ordinal) ?? false)
            && !(property.Description?.Contains("अ‍ॅमिनीटी", StringComparison.Ordinal) ?? false);
        var scope = new KarakarniMediaScope(propertyId, societyId, property.WingDetailId, property.Type, allowSharedPlan);
        var bindings = await _photoRepository.GetQueryable().AsNoTracking()
            .Where(p => p.IsLatest && p.IsActive && !p.MarkedForDeletion && p.DocumentBindingId.HasValue
                && (p.PropertyId == propertyId || (allowSharedPlan && p.PropertyId == null
                    && p.PhotoType != null && p.PhotoType.PhotoTypeCode.Contains("PLAN")
                    && (p.DisplayOrder == null || p.DisplayOrder <= 1)
                    && ((societyId.HasValue && p.SocietyDetailId == societyId)
                        || (property.WingDetailId.HasValue && p.WingDetailId == property.WingDetailId)))))
            .Select(p => new KarakarniMediaBinding(p.Id, p.PropertyId, p.SocietyDetailId, p.WingDetailId,
                p.Type, p.PhotoType != null ? p.PhotoType.PhotoTypeCode : null,
                p.DisplayOrder, p.DocumentBindingId!.Value)).ToListAsync(ct);
        var photoId = KarakarniReportMedia.SelectPropertyPhoto(scope, bindings);
        var planId = KarakarniReportMedia.SelectPlan(scope, bindings);
        if (planId <= 0)
            planId = await _planRepository.GetQueryable().AsNoTracking()
                .Where(p => p.IsActive && !p.MarkedForDeletion && p.DocumentBindingId.HasValue
                    && p.WardId == property.WardId && p.PropertyNo == property.PropertyNo)
                .OrderByDescending(p => p.Id).Select(p => p.DocumentBindingId!.Value).FirstOrDefaultAsync(ct);
        var ids = new[] { photoId, planId }.Where(id => id > 0).Distinct().ToArray();
        if (ids.Length == 0) return (EmbeddedReportImage.NotUploaded, EmbeddedReportImage.NotUploaded);
        var loaded = await EmbeddedReportImage.LoadBindingsAsync(ids, _documentService, ct);
        EmbeddedReportImage Resolve(int id) => id <= 0 ? EmbeddedReportImage.NotUploaded : loaded[id];
        return (Resolve(photoId), Resolve(planId));
    }

    private static bool IsValidCertNo(string? certNo)
    {
        if (string.IsNullOrWhiteSpace(certNo)) return false;
        var trimmed = certNo.Trim();
        return trimmed != "0" && trimmed != "-";
    }

    private static string DetermineBillType(string? ocNo, string? commencementNo)
    {
        if (IsValidCertNo(ocNo)) return "Authorized";
        if (IsValidCertNo(commencementNo)) return "Property Without OC";
        return "Unauthorized";
    }
    internal sealed record OldWardRentRow(string WardNo, string? ConstructionType, string? Residential, string? NonResidential);

    internal static string ResolveStructureOwnerName(string? english, string? regional)
    {
        if (!string.IsNullOrWhiteSpace(english) && english.Trim() != "-") return english.Trim();
        if (!string.IsNullOrWhiteSpace(regional) && regional.Trim() != "-") return regional.Trim();
        return "-";
    }

    internal static decimal? ResolveStandardRentRate(IEnumerable<decimal?> candidates, string usageType)
    {
        var values = candidates.ToList();
        if (values.Count == 0 || values.Any(value => !value.HasValue)) return null;
        var distinct = values.Select(value => value!.Value).Distinct().ToList();
        if (distinct.Count > 1)
            throw new InvalidOperationException($"Multiple {usageType} standard rent rates cannot be displayed in one notice field.");
        return distinct[0];
    }

    internal static string? ResolveOldWardRentDisplay(IEnumerable<string> wards, IEnumerable<string> constructionCodes,
        IEnumerable<OldWardRentRow> source, bool commercial)
    {
        var rows = source.ToList();
        var values = new List<(string Ward, string Construction, decimal Rate)>();
        foreach (var ward in wards.Select(w => w.Trim()).Distinct().OrderBy(w => w))
        foreach (var code in constructionCodes.Select(c => c.Trim().ToUpperInvariant()).Distinct().OrderBy(c => c))
        {
            var matching = rows.Where(r => r.WardNo.Trim() == ward
                && string.Equals(r.ConstructionType?.Trim(), code, StringComparison.OrdinalIgnoreCase)).ToList();
            if (matching.Count == 0) return null;
            var rates = new List<decimal?>();
            foreach (var row in matching)
            {
                var text = commercial ? row.NonResidential : row.Residential;
                if (string.IsNullOrWhiteSpace(text)) { rates.Add(null); continue; }
                if (!decimal.TryParse(text.Trim(), NumberStyles.Number, CultureInfo.InvariantCulture, out var rate))
                    throw new InvalidOperationException($"Invalid {(commercial ? "NonResidential" : "Residential")} rate for old ward {ward}, construction {code}.");
                rates.Add(rate);
            }
            var resolved = ResolveStandardRentRate(rates, commercial ? "C" : "R");
            if (!resolved.HasValue) return null;
            values.Add((ward, code, resolved.Value));
        }
        if (values.Count == 0) return null;
        if (values.Select(v => v.Rate).Distinct().Count() == 1)
            return values[0].Rate.ToString("0.00", CultureInfo.InvariantCulture);
        return string.Join("; ", values.Select(v => $"{v.Ward}/{v.Construction}: {v.Rate.ToString("0.00", CultureInfo.InvariantCulture)}"));
    }
}
