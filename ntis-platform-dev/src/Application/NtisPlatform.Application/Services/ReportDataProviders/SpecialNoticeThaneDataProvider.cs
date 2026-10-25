using NtisPlatform.Application.DTOs.Document;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Services.TaxEngine;
using NtisPlatform.Core.Entities.RetrospectiveTax;
using System.Globalization;
namespace NtisPlatform.Application.Services.ReportDataProviders;

using NtisPlatform.Application.DTOs.HtmlReport;

public partial class SpecialNoticeThaneDataProvider : IReportDataProvider, IReportSchemaProvider
{
    private readonly IReportDataRepository<PropertyEntity> _propertyRepository;
    private readonly IReportDataRepository<WardEntity> _wardRepository;
    private readonly IReportDataRepository<SocietyDetailsEntity> _societyRepository;
    private readonly IReportDataRepository<PropertyDetailsEntity> _propertyDetailsRepository;
    private readonly IReportDataRepository<PropertyCertificateEntity> _certificateRepository;
    private readonly IReportDataRepository<PropertyCertificateTypeMasterEntity> _certificateTypeRepository;
    private readonly IReportDataRepository<TypeOfUseEntity> _typeOfUseRepository;
    private readonly IReportDataRepository<PropertyMapDetailEntity> _propertyMapRepository;
    private readonly IReportDataRepository<PropertyMastOldEntity> _oldPropertyRepository;
    private readonly IReportDataRepository<RateEntity> _rateRepository;
    private readonly IReportDataRepository<RateSectionDetailsEntity> _rateSectionRepository;
    private readonly IReportDataRepository<AssessmentYearRangeEntity> _yearRangeRepository;
    private readonly IPolicyConfigurationService _policyConfigurationService;
    private readonly IReportDataRepository<RVCalculationResultsEntity> _rvResultsRepository;
    private readonly IReportDataRepository<RetrospectiveTaxCalculationEntity> _assessmentRepository;
    private readonly IReportDataRepository<RetrospectiveTaxCalculationDetailEntity> _assessmentDetailRepository;
    private readonly IReportDataRepository<TransMastEntity> _taxDemandRepository;
    private readonly IReportDataRepository<PolicyTaxDetailsEntity> _policyTaxDetailsRepository;
    private readonly IReportDataRepository<TaxMasterEntity> _taxHeadRepository;
    private readonly IReportDataRepository<YearMasterEntity> _financeYearRepository;
    private readonly IReportDataRepository<TaxPercentageMasterRVEntity> _taxPercentageRepository;
    private readonly IReportDataRepository<RVCalculationTaxDetailsEntity> _rvTaxDetailsRepository;
    private readonly IReportDataRepository<PropertyPhotoEntity> _photoRepository;
    private readonly IReportDataRepository<BuildingPlanTypeEntity> _planRepository;
    private readonly IDocumentApplicationService _documentService;
    private readonly IUlbConfigService _ulbConfigService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IReportDataRepository<OldWardMasterEntity>? _oldWardMasterRepository;
    private readonly IReportDataRepository<OldZoneMasterEntity>? _oldZoneMasterRepository;
  



    public SpecialNoticeThaneDataProvider(
    IReportDataRepository<PropertyEntity> propertyRepository,
    IReportDataRepository<WardEntity> wardRepository,
    IReportDataRepository<SocietyDetailsEntity> societyRepository,
    IReportDataRepository<PropertyDetailsEntity> propertyDetailsRepository,
    IReportDataRepository<PropertyCertificateEntity> certificateRepository,
    IReportDataRepository<PropertyCertificateTypeMasterEntity> certificateTypeRepository,
    IReportDataRepository<TypeOfUseEntity> typeOfUseRepository,
    IReportDataRepository<PropertyMapDetailEntity> propertyMapRepository,
    IReportDataRepository<PropertyMastOldEntity> oldPropertyRepository,
    IReportDataRepository<RateEntity> rateRepository,
    IReportDataRepository<RateSectionDetailsEntity> rateSectionRepository,
    IReportDataRepository<AssessmentYearRangeEntity> yearRangeRepository,
    IPolicyConfigurationService policyConfigurationService,
    IReportDataRepository<RVCalculationResultsEntity> rvResultsRepository,
    IReportDataRepository<RetrospectiveTaxCalculationEntity> assessmentRepository,
    IReportDataRepository<RetrospectiveTaxCalculationDetailEntity> assessmentDetailRepository,
    IReportDataRepository<TransMastEntity> taxDemandRepository,
    IReportDataRepository<TaxMasterEntity> taxHeadRepository,
    IReportDataRepository<YearMasterEntity> financeYearRepository,
    IReportDataRepository<TaxPercentageMasterRVEntity> taxPercentageRepository,
    IReportDataRepository<RVCalculationTaxDetailsEntity> rvTaxDetailsRepository,
    IReportDataRepository<PropertyPhotoEntity> photoRepository,
    IReportDataRepository<BuildingPlanTypeEntity> planRepository,
    IDocumentApplicationService documentService,
    IUlbConfigService ulbConfigService,
    IHttpClientFactory httpClientFactory,
    IReportDataRepository<PolicyTaxDetailsEntity> policyTaxDetailsRepository,
    IReportDataRepository<OldWardWiseRateEntity>? oldWardWiseRateRepository = null,
    IReportDataRepository<OldWardMasterEntity>? oldWardMasterRepository = null,
    IReportDataRepository<OldZoneMasterEntity>? oldZoneMasterRepository = null,
    IReportDataRepository<TaxMasterMappingEntity>? taxMasterMappingRepository = null,
    IReportDataRepository<PropertyTypeMasterEntity>? propertyTypeMasterRepository = null,
    IReportDataRepository<EducationTaxMasterEntity>? educationTaxMasterRepository = null,
    IReportDataRepository<EmploymentTaxMasterEntity>? employmentTaxMasterRepository = null)
    {
        _propertyRepository = propertyRepository;
        _wardRepository = wardRepository;
        _societyRepository = societyRepository;
        _certificateRepository = certificateRepository;
        _certificateTypeRepository = certificateTypeRepository;
        _typeOfUseRepository = typeOfUseRepository;
        _propertyDetailsRepository = propertyDetailsRepository;
        _propertyMapRepository = propertyMapRepository;
        _oldPropertyRepository = oldPropertyRepository;
        _rateRepository = rateRepository;
        _rateSectionRepository = rateSectionRepository;
        _yearRangeRepository = yearRangeRepository;
        _policyConfigurationService = policyConfigurationService;
        _rvResultsRepository = rvResultsRepository;
        _assessmentRepository = assessmentRepository;
        _assessmentDetailRepository = assessmentDetailRepository;
        _taxDemandRepository = taxDemandRepository;
        _policyTaxDetailsRepository = policyTaxDetailsRepository;
        _taxHeadRepository = taxHeadRepository;
        _financeYearRepository = financeYearRepository;
        _taxPercentageRepository = taxPercentageRepository;
        _rvTaxDetailsRepository = rvTaxDetailsRepository;
        _photoRepository = photoRepository;
        _planRepository = planRepository;
        _documentService = documentService;
        _ulbConfigService = ulbConfigService;
        _httpClientFactory = httpClientFactory;
        _oldWardWiseRateRepository = oldWardWiseRateRepository;
        _oldWardMasterRepository = oldWardMasterRepository;
        _oldZoneMasterRepository = oldZoneMasterRepository;
        _taxMasterMappingRepository = taxMasterMappingRepository;
        _propertyTypeMasterRepository = propertyTypeMasterRepository;
        _educationTaxMasterRepository = educationTaxMasterRepository;
        _employmentTaxMasterRepository = employmentTaxMasterRepository;
    }



    public string ProviderCode => "SpecialNoticeThaneDataProvider";
    public IReadOnlyList<HtmlReportDataSourceFieldDto> GetSchemaFields()
    => new HtmlReportDataSourceFieldDto[]
    {
        new("propertyId", "Property ID", "field", "Property", "number"),
        new("upicId", "UPIC ID", "field", "Property"),
        new("constructionType", "Construction Type", "field", "Property"),
        new("constructionTypeDescription", "Construction Type Description", "field", "Property"),
        new("ulbLogo", "ULB Logo", "image", "ULB"),
        new("ulbLogoStatus", "ULB Logo Status", "field", "ULB"),
        new("ulbName", "ULB Name", "field", "ULB"),
        new("ulbNameLocal", "ULB Local Name", "field", "ULB"),
        new("ulbAddress", "ULB Address", "field", "ULB"),
        new("printDate", "Print Date", "field", "Report"),
        new("propertyPhoto", "Property Photo", "image", "Photos"),
        new("photoPlan", "Photo Plan", "image", "Photos"),
        new("planPhoto", "Plan Photo", "image", "Photos"),
        new("buildingPlanPhoto", "Building Plan Photo", "image", "Photos"),
        new("propertyPhotoStatus", "Property Photo Status", "field", "Photos"),
        new("planPhotoStatus", "Plan Photo Status", "field", "Photos"),
        new("propertyNo", "Property No.", "field", "Property"),
        new("partitionNo", "Partition No.", "field", "Property"),
        new("wardNo", "Ward No.", "field", "Property"),
        new("oldWardNo", "Old Ward No.", "field", "Old Property"),
        new("collectionOffice", "Collection Office", "field", "Location"),
        new("wardOffice", "Ward Office", "field", "Location"),
        new("newWardNo", "New Ward No.", "field", "Property"),
        new("oldPropertyNo", "Old Property No.", "field", "Old Property"),
        new("newPropertyNo", "New Property No.", "field", "Property"),
        new("newPartitionNo", "New Partition No.", "field", "Property"),
        new("propertyDescription", "Property Description", "field", "Property"),
        new("RRate", "Residential Standard Rent Rate", "field", "Assessment", "string"),
        new("CRate", "Commercial Standard Rent Rate", "field", "Assessment", "string"),
        new("standardRentAreaUnit", "Standard Rent Area Unit", "field", "Assessment"),
        new("FromDate", "Assessment From Date", "field", "Assessment"),
        new("ToDate", "Assessment To Date", "field", "Assessment"),
        new("TotalAssessmentDays", "Total Assessment Days", "field", "Assessment", "number"),
        new("ownerNameEnglish", "Owner Name", "field", "Property"),
        new("addressEnglish", "Property Address", "field", "Property"),
        new("mobileNo", "Mobile No.", "field", "Property"),
        new("propertyEmailId", "Email", "field", "Property"),
        new("societyName", "Society Name", "field", "Society"),
        new("landOwnerName", "Land Owner", "field", "Society"),
        new("builderName", "Structure Owner / Builder", "field", "Society"),
        new("billType", "Bill Type", "field", "Assessment"),
        new("occupancyCertificateNo", "Occupancy Certificate No", "field", "Assessment"),
        new("cTotalProperty", "Non-Residential No. of Properties", "field", "Property Summary", "number"),
        new("cTotalCarpetArea", "Non-Residential Carpet Area", "field", "Property Summary", "number"),
        new("aminityTotalProperty", "Amenity No. of Properties", "field", "Property Summary", "number"),
        new("aminityTotalCarpetArea", "Amenity Carpet Area", "field", "Property Summary", "number"),
        new("rTotalProperty", "Residential Property Count", "field", "Property Summary", "number"),
        new("rcTotalProperty", "Residential Non-Residential Property Count", "field", "Property Summary", "number"),
        new("rTotalCarpetArea", "Residential Taxable Carpet Area", "field", "Property Summary", "number"),
        new("rcTotalCarpetArea", "Residential Non-Residential Taxable Carpet Area", "field", "Property Summary", "number"),
        new("cTotalRateableValue", "Non-Residential Rateable Value", "field", "Property Summary", "number"),
        new("aminityTotalRateableValue", "Amenity Rateable Value", "field", "Property Summary", "number"),
        new("rTotalRateableValue", "Residential Rateable Value", "field", "Property Summary", "number"),
        new("rcTotalRateableValue", "Residential Non-Residential Rateable Value", "field", "Property Summary", "number"),
        new("totalProperty", "Total Property Count", "field", "Property Summary", "number"),
        new("totalCarpetArea", "Total Taxable Carpet Area", "field", "Property Summary", "number"),
        new("totalRateableValue", "Total Rateable Value", "field", "Property Summary", "number"),
        new("summaryRows.description", "Summary Description", "field", "Summary Rows"),
        new("summaryRows.nonResidential", "Non-Residential", "field", "Summary Rows", "number"),
        new("summaryRows.amenity", "Amenity", "field", "Summary Rows", "number"),
        new("summaryRows.residential", "Residential", "field", "Summary Rows", "number"),
        new("summaryRows.residentialNonResidential", "Residential Non-Residential", "field", "Summary Rows", "number"),
        new("summaryRows.total", "Summary Total", "field", "Summary Rows", "number"),
        new("previousTaxHeading", "Previous Tax Heading", "field", "Tax Table"),
        new("currentTaxHeading", "Current Financial Year Tax Heading", "field", "Tax Table"),
        new("taxTableStatus", "Tax Table Status", "field", "Tax Table"),
        new("previousTaxSubtotal", "Previous Tax Subtotal", "field", "Tax Table", "number"),
        new("currentTaxSubtotal", "Current Tax Subtotal", "field", "Tax Table", "number"),
        new("previousPenalty", "Previous Period Penalty", "field", "Tax Table", "number"),
        new("currentPenalty", "Current Period Penalty", "field", "Tax Table", "number"),
        new("previousTaxTotal", "Previous Tax Including Penalty", "field", "Tax Table", "number"),
        new("currentTaxTotal", "Current Tax Including Penalty", "field", "Tax Table", "number"),
        new("grandTaxTotal", "Grand Tax Total", "field", "Tax Table", "number"),
        new("taxRows.rowType", "Tax Row Type", "field", "Tax Rows"),
        new("taxRows.serialNo", "Serial No.", "field", "Tax Rows", "number"),
        new("taxRows.taxCode", "Tax Code", "field", "Tax Rows"),
        new("taxRows.taxName", "Property Tax Head", "field", "Tax Rows"),
        new("taxRows.residentialRate", "Residential Rate (%)", "field", "Tax Rows", "number"),
        new("taxRows.nonResidentialRate", "Non-Residential Rate (%)", "field", "Tax Rows", "number"),
        new("taxRows.residentialRateText", "Residential Rate Display", "field", "Tax Rows"),
        new("taxRows.nonResidentialRateText", "Non-Residential Rate Display", "field", "Tax Rows"),
        new("taxRows.previousTax", "Previous Period Tax", "field", "Tax Rows", "number"),
        new("taxRows.currentTax", "Current Financial Year Tax", "field", "Tax Rows", "number"),
        new("taxRows.totalTax", "Total Tax", "field", "Tax Rows", "number")



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
        //this is for property details
        var property = await _propertyRepository.GetQueryable()
            .AsNoTracking()
            .Where(p => p.Id == propertyId
                && p.IsActive
                && !p.MarkedForDeletion)
            .Select(p => new
            {
                propertyId = p.Id,
                upicId = p.UPICId,
                p.PropertyMastOldId,
                wardId = p.WardId,
                taxZoneId = p.TaxZoneId,
                propertyNo = p.PropertyNo,
                partitionNo = p.PartitionNo,
                propertyDescription = p.PropertyTypeMaster != null
                    ? p.PropertyTypeMaster.PropertyDescription : null,
                partType = p.PropertyTypeMaster != null ? p.PropertyTypeMaster.PartType : null,
                masterType = p.PropertyTypeMaster != null ? p.PropertyTypeMaster.Type : null,
                propertyType = p.Type,
                ownerNameEnglish = p.OwnerNameEnglish ?? p.OwnerName,
                propertyOwnerEnglish = p.OwnerNameEnglish,
                propertyOwnerRegional = p.OwnerName,
                addressEnglish = p.AddressEnglish ?? p.Address,
                mobileNo = p.MobileNo,
                propertyEmailId = p.EmailId
                
            })
            .SingleOrDefaultAsync(ct);

        if (property is null)
        {
            throw new KeyNotFoundException("Property was not found.");
        }
        //this is for ward  details
        var ward = await _wardRepository.GetQueryable()
    .AsNoTracking()
    .Where(w => w.Id == property.wardId
        && w.IsActive
      )
    .Select(w => new
    {
        wardNo = w.WardNo,
        w.ZoneId
    })
    .SingleOrDefaultAsync(ct);
        //this is for society details

        var societies = await _societyRepository.GetQueryable()
    .AsNoTracking()
    .Where(s => s.PropertyId == property.propertyId
        && s.IsActive
        && !s.MarkedForDeletion)
    .Select(s => new
    {
        societyName = s.SocietyNameEnglish ?? s.SocietyName,
        landOwnerName = s.LandOwnerNameEnglish ?? s.LandOwnerName,
        builderName = s.BuilderNameEnglish ?? s.BuilderName
    })
    .Take(2)
    .ToListAsync(ct);

        if (societies.Count > 1)
        {
            throw new InvalidOperationException(
                $"Multiple active society records found for property {property.propertyId}.");
        }

        var society = societies.SingleOrDefault();
        var images = await LoadNoticeImagesAsync(property.propertyId, ct);
        var ulb = await _ulbConfigService.GetUlbConfigAsync(ct);
        var ulbLogo = await ResolveNoticeLogoAsync(ulb?.UlbLogo, ct);

        var policyValues = await _policyConfigurationService.GetPolicyValuesAsync(
            new Dictionary<string, string>
            {
                [RateableValuePolicyConstants.RateMasterAreaUnit] = RateableValuePolicyConstants.DefaultAreaUnit
            }, ct);
        var rateOptions = RateableValuePolicyOptions.FromPolicies(policyValues);
        // Current old-to-new mappings are the source of historical property identity.
        var oldProperties = await (
            from mapping in _propertyMapRepository.GetQueryable().AsNoTracking()
            join oldProperty in _oldPropertyRepository.GetQueryable().AsNoTracking()
                on mapping.PropertyIdOld equals (int?)oldProperty.Id
            where mapping.PropertyIdNew == property.propertyId
                && mapping.IsActive && mapping.IsCurrent && mapping.Status == "ACTIVE"
                && oldProperty.IsActive && !oldProperty.MarkedForDeletion
            select new { oldProperty.OldWardNo, oldProperty.OldPropertyNo }
        ).ToListAsync(ct);

        // Older migrated properties may use the direct link instead of a map
        // detail. Karakarni uses this same PropertyMastOldId relationship.
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
        var (collectionOffice, wardOffice) = await ResolveOldWardOfficesAsync(
            oldProperties.Select(p => p.OldWardNo), ct);





        var (residentialRate, commercialRate) = await LoadOldWardStandardRentAsync(
            oldProperties.Select(p => p.OldWardNo), property.propertyId, ct);

        var certificates = await (
            from cert in _certificateRepository.GetQueryable()
            join type in _certificateTypeRepository.GetQueryable() on cert.CertificateTypeId equals type.Id
            where cert.PropertyId == property.propertyId
               && cert.IsActive
               && !cert.MarkedForDeletion
               && type.IsActive
              
            select new
            {
                type.CertificateTypeCode,
                cert.CertificateNo
            }
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


        
        var summaryDetails = await _propertyDetailsRepository.GetQueryable().AsNoTracking()
            .Where(pd => pd.PropertyId == property.propertyId && pd.IsActive && !pd.MarkedForDeletion)
            .Select(pd => new
            {
                pd.Id, pd.IsTaxable, pd.CarpetAreaSqMeter,
                constructionCode = pd.ConstructionType != null ? pd.ConstructionType.ConstructionCode : null,
                constructionDescription = pd.ConstructionType != null ? pd.ConstructionType.Description : null,
                usageType = pd.TypeOfUse != null ? pd.TypeOfUse.Type : null
            }).ToListAsync(ct);
        var constructionType = string.Join(", ", summaryDetails
            .Select(d => string.IsNullOrWhiteSpace(d.constructionCode)
                ? d.constructionDescription?.Trim() : d.constructionCode.Trim())
            .Where(value => !string.IsNullOrWhiteSpace(value)).Distinct().OrderBy(value => value));
        var constructionTypeDescription = string.Join(", ", summaryDetails
            .Select(d => d.constructionDescription?.Trim())
            .Where(value => !string.IsNullOrWhiteSpace(value)).Distinct().OrderBy(value => value));
        var savedRv = await _rvResultsRepository.GetQueryable().AsNoTracking()
            .Where(rv => rv.PropertyId == property.propertyId && rv.IsActive && !rv.MarkedForDeletion)
            .Select(rv => new { rv.Id, rv.PropertyDetailsId, rv.UpdatedDate, rv.CreatedDate, rv.RateableValue })
            .ToListAsync(ct);
        // Use the latest active saved result per detail, never sum historical calculations.
        var rvByDetail = savedRv.GroupBy(rv => rv.PropertyDetailsId).ToDictionary(
            group => group.Key,
            group => group.OrderByDescending(rv => rv.UpdatedDate ?? rv.CreatedDate)
                .ThenByDescending(rv => rv.Id).First().RateableValue);
        var summary = new SpecialNoticeThaneSummary(summaryDetails.Select(detail =>
            new SpecialNoticeSummaryDetail(property.propertyId, detail.Id,
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

        // Latest active property-level assessment only; pending/review records do not
        // fall back to an older successful assessment with a stale chargeable period.
        var assessment = await _assessmentRepository.GetQueryable().AsNoTracking()
            .Where(a => a.PropertyId == property.propertyId && a.IsActive && !a.MarkedForDeletion
                && a.CalculationMode == "PROPERTY")
            .OrderByDescending(a => a.AssessmentDate).ThenByDescending(a => a.Id)
            .Select(a => new { a.Id, a.CalculationStatus, a.ChargeableStartDate, a.ChargeableEndDate })
            .FirstOrDefaultAsync(ct);
        var assessmentDetails = new List<SpecialNoticePeriodDetail>();
        if (assessment is not null
            && string.Equals(assessment.CalculationStatus, "Calculated", StringComparison.OrdinalIgnoreCase)
            && (!assessment.ChargeableStartDate.HasValue || !assessment.ChargeableEndDate.HasValue))
        {
            assessmentDetails = await _assessmentDetailRepository.GetQueryable().AsNoTracking()
                .Where(d => d.CalculationId == assessment.Id && d.PropertyId == property.propertyId
                    && d.IsActive && !d.MarkedForDeletion)
                .Select(d => new SpecialNoticePeriodDetail(d.FromDate, d.ToDate)).ToListAsync(ct);
        }
        var assessmentPeriod = SpecialNoticeThaneAssessmentPeriod.Resolve(
            assessment?.CalculationStatus, assessment?.ChargeableStartDate,
            assessment?.ChargeableEndDate, assessmentDetails);
        var taxTable = await BuildTaxTableAsync(property.propertyId, parameters, ct);
        var structureOwnerName = ResolveStructureOwnerName(property.propertyOwnerEnglish, property.propertyOwnerRegional);
        var cTotalCarpetArea = Math.Round((nonResidential.CarpetArea ?? 0m) * 1.20m, 0, MidpointRounding.AwayFromZero);
        return new List<object>
{
    new
    {
        property.propertyId,
        property.upicId,
        constructionType,
        constructionTypeDescription,
        property.propertyNo,
        property.partitionNo,
        property.ownerNameEnglish,
        property.addressEnglish,
        property.mobileNo,
        property.propertyEmailId,
        wardNo = ward?.wardNo,
        collectionOffice,
        wardOffice,
        oldWardNo,
        newWardNo = ward?.wardNo,
        oldPropertyNo,
        newPropertyNo = property.propertyNo,
        newPartitionNo = property.partitionNo,
        property.propertyDescription,
        RRate = residentialRate,
        CRate = commercialRate,
        standardRentAreaUnit = rateOptions.AreaUnit,
        FromDate = assessmentPeriod?.FromDate.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture),
        ToDate = assessmentPeriod?.ToDate.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture),
        TotalAssessmentDays = assessmentPeriod?.TotalDays,
        societyName = society?.societyName,
        landOwnerName = society?.landOwnerName,
        // Retain the existing template binding while using the Individual page's property owner.
        builderName = structureOwnerName,
        structureOwnerName,
        billType = billType,
        occupancyCertificateNo = IsValidCertNo(ocNo) ? ocNo : "-",
        cTotalProperty = nonResidential.PropertyCount,
        cTotalCarpetArea,
        aminityTotalProperty = amenity.PropertyCount,
        aminityTotalCarpetArea = amenity.CarpetArea,
        rTotalProperty = residential.PropertyCount,
        rcTotalProperty = residentialNonResidential.PropertyCount,
        rTotalCarpetArea = residential.CarpetArea,
        rcTotalCarpetArea = residentialNonResidential.CarpetArea,
        cTotalRateableValue = nonResidential.RateableValue,
        aminityTotalRateableValue = amenity.RateableValue,
        rTotalRateableValue = residential.RateableValue,
        rcTotalRateableValue = residentialNonResidential.RateableValue,
        totalProperty = summary.Total.PropertyCount,
        totalCarpetArea = cTotalCarpetArea + amenity.CarpetArea + residential.CarpetArea + residentialNonResidential.CarpetArea,
        totalRateableValue = summary.Total.RateableValue,
        summaryRows = summary.Rows,
        propertyPhoto = images.Photo.DataUrl,
        ulbLogo = ulbLogo.DataUrl,
        ulbLogoStatus = ulbLogo.Status,
        ulbName = ulb?.UlbName,
        ulbNameLocal = ulb?.UlbNameLocal,
        ulbAddress = ulb?.UlbAddress,
        printDate = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromMinutes(330))
            .ToString("dd-MM-yyyy", CultureInfo.InvariantCulture),
        propertyPhotoDocumentGuid = images.Photo.DocumentGuid,
        propertyPhotoStatus = images.Photo.Status,
        photoPlan = images.Plan.DataUrl,
        planPhoto = images.Plan.DataUrl,
        buildingPlanPhoto = images.Plan.DataUrl,
        planPhotoDocumentGuid = images.Plan.DocumentGuid,
        buildingPlanPhotoDocumentGuid = images.Plan.DocumentGuid,
        planPhotoStatus = images.Plan.Status,
        taxRows = taxTable?.Rows ?? Array.Empty<object>(),
        taxTableStatus = taxTable is null ? "Unavailable" : "Ready",
        previousTaxHeading = taxTable?.PreviousHeading,
        currentTaxHeading = taxTable?.CurrentHeading,
        previousTaxSubtotal = taxTable?.PreviousSubtotal,
        currentTaxSubtotal = taxTable?.CurrentSubtotal,
        previousPenalty = taxTable?.PreviousPenalty,
        currentPenalty = taxTable?.CurrentPenalty,
        previousTaxTotal = taxTable?.PreviousTotal,
        currentTaxTotal = taxTable?.CurrentTotal,
        grandTaxTotal = taxTable is null ? (decimal?)null : taxTable.PreviousTotal + taxTable.CurrentTotal

    }
};
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

    internal static string ResolveStructureOwnerName(string? english, string? regional)
    {
        if (!string.IsNullOrWhiteSpace(english) && english.Trim() != "-") return english.Trim();
        if (!string.IsNullOrWhiteSpace(regional) && regional.Trim() != "-") return regional.Trim();
        return "-";
    }

    internal static object? ResolveStandardRentDisplay(
        IEnumerable<(int Year, int ConstructionTypeId, decimal? Rate)> contexts, string usageType)
    {
        var values = contexts.GroupBy(c => (c.Year, c.ConstructionTypeId))
            .Select(group => (group.Key.Year, group.Key.ConstructionTypeId,
                Rate: ResolveStandardRentRate(group.Select(c => c.Rate), usageType)))
            .OrderBy(c => c.Year).ThenBy(c => c.ConstructionTypeId).ToList();
        if (values.Count == 0 || values.Any(c => !c.Rate.HasValue)) return null;
        if (values.Select(c => c.Rate).Distinct().Count() == 1)
            return ResolveStandardRentRate(values.Select(c => c.Rate), usageType);

        return string.Join("; ", values.Select(c =>
        {
            var label = c.Year.ToString(CultureInfo.InvariantCulture);
            if (values.Count(other => other.Year == c.Year) > 1)
                label += $" (construction {c.ConstructionTypeId.ToString(CultureInfo.InvariantCulture)})";
            return $"{label}: {c.Rate!.Value.ToString("0.00", CultureInfo.InvariantCulture)}";
        }));
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

    private static bool IsValidCertNo(string? certNo)
    {
        if (string.IsNullOrWhiteSpace(certNo)) return false;
        var trimmed = certNo.Trim();
        return trimmed != "0" && trimmed != "-";
    }

    private static string DetermineBillType(string? ocNo, string? commencementNo)
    {

        if (IsValidCertNo(ocNo))
        {
            return "Authorized";
        }


        if (IsValidCertNo(commencementNo))
        {
            return "Property Without OC";
        }


        return "Unauthorized";
    }


    internal const long MaxNoticeImageBytes = EmbeddedReportImage.MaxBytes;

    internal async Task<(NoticeImage Photo, NoticeImage Plan)> LoadNoticeImagesAsync(int propertyId, CancellationToken ct)
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
        if (ids.Length == 0) return (NoticeImage.NotUploaded, NoticeImage.NotUploaded);
        var loaded = await EmbeddedReportImage.LoadBindingsAsync(ids, _documentService, ct);
        var images = loaded.ToDictionary(pair => pair.Key,
            pair => new NoticeImage(pair.Value.DataUrl, pair.Value.DocumentGuid, pair.Value.Status));
        NoticeImage Resolve(int id) => id <= 0 ? NoticeImage.NotUploaded : images[id];
        return (Resolve(photoId), Resolve(planId));
    }

    internal sealed record NoticeImage(string? DataUrl, string? DocumentGuid, string Status)
    {
        public static NoticeImage NotUploaded { get; } = new(null, null, "Not uploaded");

        public static NoticeImage From(BoundDocumentContentDto document)
        {
            var image = EmbeddedReportImage.From(document);
            return new(image.DataUrl, image.DocumentGuid, image.Status);
        }
    }

    internal async Task<NoticeImage> LoadNoticeLogoAsync(CancellationToken ct)
    {
        var config = await _ulbConfigService.GetUlbConfigAsync(ct);
        return await ResolveNoticeLogoAsync(config?.UlbLogo, ct);
    }

    private async Task<NoticeImage> ResolveNoticeLogoAsync(string? configuredLogo, CancellationToken ct)
    {
        var image = await EmbeddedReportImage.LoadLogoAsync(configuredLogo, _documentService, _httpClientFactory, ct);
        return new(image.DataUrl, image.DocumentGuid, image.Status);
    }
}
