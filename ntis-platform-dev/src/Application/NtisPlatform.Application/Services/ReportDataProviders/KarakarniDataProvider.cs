using System.Diagnostics;
using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.Report;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.DTOs.HtmlReport;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.ReportDataProviders;

public class KarakarniDataProvider : IPagedReportDataProvider, IReportSchemaProvider
{
    public const string MainSection = "main";
    public const string PropertyDetailsSection = "propertyDetails";

    public string ProviderCode => "KarakarniDataProvider";

    private static readonly List<string> ActiveTaxCodes = new()
    {
        "GEN",
        "STATE_EDU",
        "STATE_EMP",
        "TREE",
        "SP_WATER",
        "ROAD",
        "FIRE",
        "LIGHT",
        "WATER_BEN",
        "SEWAGE",
        "SP_EDU"
    };

    private readonly IReportDataRepository<PropertyEntity> _propertyRepository;
    private readonly IReportDataRepository<WardEntity> _wardRepository;
    private readonly IReportDataRepository<SocietyDetailsEntity> _societyRepository;
    private readonly IReportDataRepository<TypeOfUseEntity> _typeOfUseRepository;
    private readonly IReportDataRepository<PropertyDetailsEntity> _propertyDetailsRepository;
    private readonly IReportDataRepository<FloorEntity> _floorRepository;
    private readonly IReportDataRepository<ConstructionTypeEntity> _constructionTypeRepository;
    private readonly IReportDataRepository<TransMastEntity> _transmastRepository;
    private readonly IReportDataRepository<TaxMasterEntity> _taxMastRepository;
    private readonly IReportDataRepository<ULBMasterEntity> _ulbMasterRepository;
    private readonly IReportDataRepository<UserEntity> _userRepository;
    private readonly IReportDataRepository<YearMasterEntity> _yearRepository;
    private readonly IReportDataRepository<PropertyTypeMasterEntity> _propertyTypeRepository;
    private readonly IReportDataRepository<RVCalculationResultsEntity> _rvResultsRepository;
    private readonly IReportDataRepository<WingEntity> _wingRepository;
    private readonly IReportDataRepository<PropertyPhotoEntity> _propertyPhotoRepository;
    private readonly IReportDataRepository<BuildingPlanTypeEntity> _buildingPlanRepository;
    private readonly IReportDataRepository<PropertyMastOldEntity> _propertyMastOldRepository;
    private readonly IReportDataRepository<PropertyMapDetailEntity>? _propertyMapRepository;
    private readonly IReportDataRepository<PropertyAssessmentEntity>? _propertyAssessmentRepository;
    private readonly IReportDataRepository<PropertyCategoryEntity>? _propertyCategoryRepository;
    private readonly IDocumentApplicationService _documentApplicationService;
    private readonly IMemoryCache _cache;
    private readonly IHttpClientFactory? _httpClientFactory;
    private readonly IUlbConfigService _ulbConfigService;
    private readonly ILogger<KarakarniDataProvider> _logger;
    private readonly ICurrentTenantService _currentTenant;
    private int OrganizationId => _currentTenant.TryGetCurrentTenantId() ?? 0;
    private CachedPageSelection? _cachedPageSelection;


    public KarakarniDataProvider(
        IReportDataRepository<PropertyEntity> propertyRepository,
        IReportDataRepository<WardEntity> wardRepository,
        IReportDataRepository<SocietyDetailsEntity> societyRepository,
        IReportDataRepository<TypeOfUseEntity> typeOfUseRepository,
        IReportDataRepository<PropertyDetailsEntity> propertyDetailsRepository,
        IReportDataRepository<FloorEntity> floorRepository,
        IReportDataRepository<ConstructionTypeEntity> constructionTypeRepository,
        IReportDataRepository<TransMastEntity> transmastRepository,
        IReportDataRepository<TaxMasterEntity> taxMastRepository,
        IReportDataRepository<ULBMasterEntity> ulbMasterRepository,
        IReportDataRepository<UserEntity> userRepository,
        IReportDataRepository<YearMasterEntity> yearRepository,
        IReportDataRepository<PropertyTypeMasterEntity> propertyTypeRepository,
        IReportDataRepository<RVCalculationResultsEntity> rvResultsRepository,
        IReportDataRepository<WingEntity> wingRepository,
        IReportDataRepository<PropertyPhotoEntity> propertyPhotoRepository,
        IReportDataRepository<BuildingPlanTypeEntity> buildingPlanRepository,
        IReportDataRepository<PropertyMastOldEntity> propertyMastOldRepository,
        IDocumentApplicationService documentApplicationService,
        IMemoryCache cache,
        ICurrentTenantService currentTenant,
        ILogger<KarakarniDataProvider> logger,
        IUlbConfigService ulbConfigService,
        IReportDataRepository<PropertyAssessmentEntity>? propertyAssessmentRepository = null,
        IHttpClientFactory? httpClientFactory = null,
        IReportDataRepository<PropertyCategoryEntity>? propertyCategoryRepository = null,
        IReportDataRepository<PropertyMapDetailEntity>? propertyMapRepository = null
        )
    {
        _propertyRepository = propertyRepository;
        _wardRepository = wardRepository;
        _societyRepository = societyRepository;
        _typeOfUseRepository = typeOfUseRepository;
        _propertyDetailsRepository = propertyDetailsRepository;
        _floorRepository = floorRepository;
        _constructionTypeRepository = constructionTypeRepository;
        _transmastRepository = transmastRepository;
        _taxMastRepository = taxMastRepository;
        _ulbMasterRepository = ulbMasterRepository;
        _userRepository = userRepository;
        _yearRepository = yearRepository;
        _propertyTypeRepository = propertyTypeRepository;
        _rvResultsRepository = rvResultsRepository;
        _wingRepository = wingRepository;
        _propertyPhotoRepository = propertyPhotoRepository;
        _buildingPlanRepository = buildingPlanRepository;
        _propertyMastOldRepository = propertyMastOldRepository;
        _propertyMapRepository = propertyMapRepository;
        _propertyAssessmentRepository = propertyAssessmentRepository;
        _propertyCategoryRepository = propertyCategoryRepository;
        _documentApplicationService = documentApplicationService;
        _cache = cache;
        _logger = logger;
        _currentTenant = currentTenant;
        _httpClientFactory = httpClientFactory;
        _ulbConfigService = ulbConfigService;
    }

    // Static — never runs a query (avoids any heavy query executing on the authenticate request).
    public IReadOnlyList<ReportSectionDescriptor> GetSections() => new[]
    {
        new ReportSectionDescriptor(MainSection,            true),
        new ReportSectionDescriptor(PropertyDetailsSection, true),
    };

    public IReadOnlyList<HtmlReportDataSourceFieldDto> GetSchemaFields() => new HtmlReportDataSourceFieldDto[]
    {
        new("printDate", "Print Date", "field", "Report"),
        new("ownerNameEnglish", "Owner Name (English)", "field", "Property"),
        new("occupierNameEnglish", "Occupier Name (English)", "field", "Property"),
        new("addressEnglish", "Address (English)", "field", "Property"),
        new("propertyEmailId", "Property Email", "field", "Property"),
        new("landOwnerName", "Land Owner", "field", "Property"),
        new("builderName", "Structure Owner / Builder", "field", "Property"),
        new("propertyDescription", "Property Description", "field", "Property"),
        new("propertyCategory", "Property Category", "field", "Property"),
        new("propertyDetails.roomDimensions", "Room Length x Width (metres)", "field", "Property Details"),
        new("propertyDetails.roomType", "Room Type", "field", "Property Details"),
        new("propertyDetails.floorCode", "Floor Code", "field", "Property Details"),
        // ULB माहिती (Header / Council Information)
        new("ulbCode", "ULB Code", "field", "ULB माहिती"),
        new("ulbName", "ULB Name", "field", "ULB माहिती"),
        new("ulbNameLocal", "ULB Name (Marathi)", "field", "ULB माहिती"),
        new("ulbAddress", "ULB Address", "field", "ULB माहिती"),
        new("ulbLogo", "ULB Logo", "image", "ULB माहिती"),
        new("CouncilLogo", "नगरपरिषद लोगो", "image", "ULB माहिती"),
        new("ulbEmailId", "ULB Email", "field", "ULB माहिती"),
        new("ulbMobileNo", "ULB Mobile No", "field", "ULB माहिती"),
        new("financeYear", "आर्थिक वर्ष (Financial Year)", "field", "ULB माहिती"),

        // मालमत्ता तपशील (Property Details)
        new("propertyId", "Property ID", "field", "मालमत्ता तपशील", "number"),
        new("propertyNo", "मालमत्ता क्र. (Property No)", "field", "मालमत्ता तपशील"),
        new("buildingNo", "इमारत क्र. (Building No)", "field", "मालमत्ता तपशील"),
        new("plotOrCsnNo", "प्लॉट / सिटी सर्वे क्र.", "field", "मालमत्ता तपशील"),
        new("zoneNo", "झोन क्र. (Zone No)", "field", "मालमत्ता तपशील"),
        new("wardNo", "वॉर्ड क्र. (Ward No)", "field", "मालमत्ता तपशील"),
        new("partitionNo", "भाग क्र. (Partition No)", "field", "मालमत्ता तपशील"),
        new("upicId", "UPIC ID", "field", "मालमत्ता तपशील"),
        new("computerNo", "संगणक क्र. (Computer / CSN No)", "field", "मालमत्ता तपशील"),
        new("CSN", "CSN No", "field", "मालमत्ता तपशील"),
        new("subZoneNo", "उप-झोन क्र. (Sub-Zone No)", "field", "मालमत्ता तपशील"),
        new("plotNo", "प्लॉट क्र. (Plot No)", "field", "मालमत्ता तपशील"),
        new("flatOrShopNo", "सदनिका / गाळा क्र. (Flat/Shop No)", "field", "मालमत्ता तपशील"),
        new("flatOrShopName", "गाळा / दुकानाचे नाव (Flat/Shop Name)", "field", "मालमत्ता तपशील"),
        new("societyName", "सोसायटी नाव (Society Name)", "field", "मालमत्ता तपशील"),
        new("societyAddress", "सोसायटी पत्ता (Society Address)", "field", "मालमत्ता तपशील"),
        new("wingNo", "विंग क्र. (Wing No)", "field", "मालमत्ता तपशील"),
        new("wingName", "विंग नाव (Wing Name)", "field", "मालमत्ता तपशील"),
        new("typeOfUseDesc", "वापर प्रकार वर्णन (Type of Use)", "field", "मालमत्ता तपशील"),
        new("Description", "मालमत्ता वर्णन (Description)", "field", "मालमत्ता तपशील"),
        new("newToiletNo", "नवीन संडास संख्या (New Toilet No)", "field", "मालमत्ता तपशील", "number"),
        new("NewToiletNo", "नवीन संडास संख्या (New Toilet No)", "field", "मालमत्ता तपशील", "number"),
        new("new_toilet_no", "नवीन संडास संख्या (New Toilet No)", "field", "मालमत्ता तपशील", "number"),
        new("commToiletNo", "व्यावसायिक संडास संख्या (Comm. Toilet No)", "field", "मालमत्ता तपशील", "number"),
        new("CommToiletNo", "व्यावसायिक संडास संख्या (Comm. Toilet No)", "field", "मालमत्ता तपशील", "number"),
        new("commtoiletNo", "व्यावसायिक संडास संख्या (Comm. Toilet No)", "field", "मालमत्ता तपशील", "number"),
        new("commtoilet_no", "व्यावसायिक संडास संख्या (Comm. Toilet No)", "field", "मालमत्ता तपशील", "number"),

        // जुनी मालमत्ता माहिती (Old Property Details)
        new("oldWardNo", "जुना प्रभाग क्र. (Old Ward No)", "field", "जुनी मालमत्ता माहिती"),
        new("oldBuildingNo", "जुना इमारत क्र.", "field", "जुनी मालमत्ता माहिती"),
        new("oldPropertyNo", "जुना मालमत्ता क्र. (Old Property No)", "field", "जुनी मालमत्ता माहिती"),
        new("oldPartitionNo", "जुना भाग क्र. (Old Partition No)", "field", "जुनी मालमत्ता माहिती"),
        new("oldCSN", "जुना CSN क्र. (Old CSN)", "field", "जुनी मालमत्ता माहिती"),
        new("oldEgovNo", "जुना ई-गव्हर्नन्स क्र. (Old Egov No)", "field", "जुनी मालमत्ता माहिती"),
        new("oldRV", "जुने करयोग्य मूल्य (Old RV)", "field", "जुनी मालमत्ता माहिती", "number"),
        new("oldALV", "जुने वार्षिक भाडे मूल्य (Old ALV)", "field", "जुनी मालमत्ता माहिती", "number"),
        new("oldRent", "जुने भाडे (Old Rent)", "field", "जुनी मालमत्ता माहिती", "number"),
        new("oldToiletNo", "जुनी संडास संख्या (Old Toilet No)", "field", "जुनी मालमत्ता माहिती", "number"),
        new("oldGeneralTax", "जुना मालमत्ता कर", "field", "जुनी मालमत्ता माहिती", "number"),
        new("oldTotalTax", "जुना एकूण कर (Old Total Tax)", "field", "जुनी मालमत्ता माहिती", "number"),
        new("oldGeneralTax", "जुना मालमत्ता कर (Old General Tax)", "field", "जुनी मालमत्ता माहिती", "number"),

        // मालक व वापरकर्ता तपशील (Owner & Occupier Details)
        new("ownerTitle", "मालक पदवी (Owner Title)", "field", "मालक व वापरकर्ता"),
        new("ownerName", "मालकाचे नाव (Owner Name)", "field", "मालक व वापरकर्ता"),
        new("ownerFullName", "मालकाचे पूर्ण नाव (Owner Full Name)", "field", "मालक व वापरकर्ता"),
        new("occupierTitle", "भोगवटदार पदवी (Occupier Title)", "field", "मालक व वापरकर्ता"),
        new("occupierName", "भोगवटदाराचे नाव (Occupier Name)", "field", "मालक व वापरकर्ता"),
        new("occupierFullName", "भोगवटदाराचे पूर्ण नाव (Occupier Full Name)", "field", "मालक व वापरकर्ता"),
        new("address", "मालमत्तेचा पत्ता (Address)", "field", "मालक व वापरकर्ता"),
        new("mobileNo", "मोबाईल नं (Mobile No)", "field", "मालक व वापरकर्ता"),

        // क्षेत्रफळ व फोटो (Areas & Photos)
        new("totalAreaSqMtr", "एकूण क्षेत्रफळ चौ.मी. (Total Area SqM)", "field", "क्षेत्रफळ व फोटो", "number"),
        new("openPlotAreaSqFt", "खुला भूखंड क्षेत्रफळ चौ.फूट (Plot Area SqFt)", "field", "क्षेत्रफळ व फोटो", "number"),
        new("totalCarpetAreaSqFeet", "एकूण चटई क्षेत्र चौ.फूट (Total Carpet SqFt)", "field", "क्षेत्रफळ व फोटो", "number"),
        new("totalCarpetAreaSqMeter", "एकूण चटई क्षेत्र चौ.मी. (Total Carpet SqM)", "field", "क्षेत्रफळ व फोटो", "number"),
        new("totalBuiltupAreaSqFeet", "एकूण जोते क्षेत्र चौ.फूट (Total Built-up SqFt)", "field", "क्षेत्रफळ व फोटो", "number"),
        new("totalBuiltupAreaSqMeter", "एकूण जोते क्षेत्र चौ.मी. (Total Built-up SqM)", "field", "क्षेत्रफळ व फोटो", "number"),
        new("propertyPhoto", "मालमत्ता फोटो (Property Photo)", "image", "क्षेत्रफळ व फोटो"),
        new("planPhoto", "प्लॅन फोटो (Plan Photo)", "image", "क्षेत्रफळ व फोटो"),

        // कर व मूल्यांकन सारांश (Taxes & RV Summary)
        new("annualRentalValue", "वार्षिक भाडे मूल्य रु. (Annual Rental Value)", "field", "कर व मूल्यांकन सारांश", "number"),
        new("maintenance", "दुरुस्ती खर्च वजावट रु. (Maintenance)", "field", "कर व मूल्यांकन सारांश", "number"),
        new("rateableValue", "करपात्र मूल्य रु. (Rateable Value)", "field", "कर व मूल्यांकन सारांश", "number"),
        new("totalTax", "एकूण कर रु. (Total Tax)", "field", "कर व मूल्यांकन सारांश", "number"),
        new("ekunKar", "एकूण कर (Ekun Kar)", "field", "कर व मूल्यांकन सारांश", "number"),
        new("newRent", "नवीन भाडे / वार्षिक भाडे मूल्य (New Rent)", "field", "कर व मूल्यांकन सारांश", "number"),
        new("NewRent", "नवीन भाडे / वार्षिक भाडे मूल्य (New Rent)", "field", "कर व मूल्यांकन सारांश", "number"),
        new("new_rent", "नवीन भाडे / वार्षिक भाडे मूल्य (New Rent)", "field", "कर व मूल्यांकन सारांश", "number"),
        new("propertyTax", "मालमत्ता कर रु. (Property Tax)", "field", "कर व मूल्यांकन सारांश", "number"),
        new("PropertyTax", "मालमत्ता कर रु. (Property Tax)", "field", "कर व मूल्यांकन सारांश", "number"),

        // कर तपशील (Component Taxes)
        new("Transmast_GEN", "सामान्य कर रु. (General Tax)", "field", "कर तपशील", "number"),
        new("Transmast_STATE_EDU", "महाराष्ट्र शिक्षण कर रु. (State Edu Tax)", "field", "कर तपशील", "number"),
        new("Transmast_STATE_EMP", "रोजगार हमी कर रु. (Employment Tax)", "field", "कर तपशील", "number"),
        new("Transmast_TREE", "वृक्ष कर रु. (Tree Tax)", "field", "कर तपशील", "number"),
        new("Transmast_SP_WATER", "विशेष पाणी कर रु. (Special Water Tax)", "field", "कर तपशील", "number"),
        new("Transmast_ROAD", "रस्ता कर रु. (Road Tax)", "field", "कर तपशील", "number"),
        new("Transmast_FIRE", "अग्निशमन कर रु. (Fire Tax)", "field", "कर तपशील", "number"),
        new("Transmast_LIGHT", "दिवाबत्ती कर रु. (Light Tax)", "field", "कर तपशील", "number"),
        new("Transmast_WATER_BEN", "पाणी लाभ कर रु. (Water Benefit Tax)", "field", "कर तपशील", "number"),
        new("Transmast_SEWAGE", "मलनिःसारण कर रु. (Sewage Tax)", "field", "कर तपशील", "number"),
        new("Transmast_SP_EDU", "विशेष शिक्षण कर रु. (Special Edu Tax)", "field", "कर तपशील", "number"),

        // मजला तपशील उप-अहवाल (Property Details Subreport)
        new("propertyDetails", "मजला तपशील यादी (Floor Details Rows)", "table", "मजला तपशील (Subreport)", "collection"),
        new("propertyDetails.floorId", "मजला आयडी (Floor ID)", "field", "मजला तपशील (Subreport)", "number"),
        new("propertyDetails.floorDescription", "मजला वर्णन (Floor Description)", "field", "मजला तपशील (Subreport)"),
        new("propertyDetails.constructionYear", "बांधकाम वर्ष (Construction Year)", "field", "मजला तपशील (Subreport)"),
        new("propertyDetails.constructionDescription", "बांधकाम प्रकार (Construction Type)", "field", "मजला तपशील (Subreport)"),
        new("propertyDetails.typeOfUseDescription", "वापर प्रकार (Type of Use)", "field", "मजला तपशील (Subreport)"),
        new("propertyDetails.assessmentYear", "आकारणी वर्ष (Assessment Year)", "field", "मजला तपशील (Subreport)"),
        new("propertyDetails.noOfRooms", "खोल्यांची संख्या (No. of Rooms)", "field", "मजला तपशील (Subreport)", "number"),
        new("propertyDetails.carpetAreaSqFeet", "चटई क्षेत्र चौ.फूट (Carpet Area SqFt)", "field", "मजला तपशील (Subreport)", "number"),
        new("propertyDetails.carpetAreaSqMeter", "चटई क्षेत्र चौ.मी. (Carpet Area SqM)", "field", "मजला तपशील (Subreport)", "number"),
        new("propertyDetails.builtupAreaSqFeet", "जोते क्षेत्र चौ.फूट (Built-up Area SqFt)", "field", "मजला तपशील (Subreport)", "number"),
        new("propertyDetails.builtupAreaSqMeter", "जोते क्षेत्र चौ.मी. (Built-up Area SqM)", "field", "मजला तपशील (Subreport)", "number"),
        new("propertyDetails.monthlyRate", "मासिक दर (Monthly Rate)", "field", "मजला तपशील (Subreport)", "number"),
        new("propertyDetails.yearlyRate", "वार्षिक दर (Yearly Rate)", "field", "मजला तपशील (Subreport)", "number"),
        new("propertyDetails.yearlyRent", "वार्षिक भाडे (Yearly Rent)", "field", "मजला तपशील (Subreport)", "number"),
        new("propertyDetails.depreciation", "घसारा रु. (Depreciation)", "field", "मजला तपशील (Subreport)", "number"),
        new("propertyDetails.depreciationPer", "घसारा टक्केवारी (Depreciation %)", "field", "मजला तपशील (Subreport)", "number"),
        new("propertyDetails.annualRentalValue", "वार्षिक भाडे मूल्य (Annual Rental Value)", "field", "मजला तपशील (Subreport)", "number"),
        new("propertyDetails.maintenance", "दुरुस्ती खर्च वजावट (Maintenance)", "field", "मजला तपशील (Subreport)", "number"),
        new("propertyDetails.rateableValue", "करपात्र मूल्य (Rateable Value)", "field", "मजला तपशील (Subreport)", "number"),
        new("propertyDetails.totalCarpetAreaSqFeet", "एकूण चटई क्षेत्र चौ.फूट (Total Carpet SqFt)", "field", "मजला तपशील (Subreport)", "number"),
        new("propertyDetails.totalBuiltupAreaSqFeet", "एकूण जोते क्षेत्र चौ.फूट (Total Builtup SqFt)", "field", "मजला तपशील (Subreport)", "number"),
        new("propertyDetails.totalRateableValue", "एकूण करपात्र मूल्य (Total Rateable Value)", "field", "मजला तपशील (Subreport)", "number"),
    };

    public async Task<object> GetDataAsync(
        Dictionary<string, string> parameters, CancellationToken ct = default)
    {
        var financeYear = ParseFinanceYear(parameters);
        var (rows, _, _) = await BuildPageAsync(Guid.Empty, parameters, MainSection, skip: 0, take: int.MaxValue, ct);
        return rows;
    }

    public async Task<ReportDataPage> GetDataPageAsync(
        Guid reportRequestId,
        Dictionary<string, string> parameters, string section, int page, int pageSize, CancellationToken ct = default)
    {
        var financeYear = ParseFinanceYear(parameters);
        if (page < 1) page = 1;
        if (pageSize <= 0) pageSize = 100;

        var (rows, hasMore, totalCount) = await BuildPageAsync(
            reportRequestId, parameters, section, (page - 1) * pageSize, pageSize, ct);
        return new ReportDataPage
        {
            Section = section,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            HasMore = hasMore,
            Rows = rows,
        };
    }

    private static short ParseFinanceYear(Dictionary<string, string> parameters)
    {
        parameters.TryGetValue("financeYear", out var financeYearStr);
        short.TryParse(financeYearStr, out var financeYear);
        return financeYear;
    }

    private IQueryable<YearMasterEntity> BaseQuery(short financeYear) => _yearRepository.GetQueryable()
        .Where(b => financeYear == 0 ? b.IsActive : b.Year == financeYear);

    private async Task<ActiveYearSnapshot?> GetActiveYearAsync(short financeYear, CancellationToken ct)
    {
        var cacheKey = $"karakarni:tenant:{OrganizationId}:active-year:{financeYear}";
        if (_cache.TryGetValue(cacheKey, out ActiveYearSnapshot? cached))
            return cached;

        var value = await BaseQuery(financeYear)
            .Select(year => new ActiveYearSnapshot(year.Id, year.YearCode))
            .FirstOrDefaultAsync(ct);

        if (value is not null)
        {
            _cache.Set(cacheKey, value, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5),
                Size = 1
            });
        }

        return value;
    }

    private async Task<UlbSnapshot?> GetUlbAsync(CancellationToken ct)
    {
        // Read the same effective configuration as the application header, for each report.
        // ULBMaster.UlbLogo alone can still reference an older upload.
        var config = await _ulbConfigService.GetUlbConfigAsync(ct);
        if (config is null) return null;

        var raw = await _ulbMasterRepository.GetQueryable()
            .Where(u => u.Id == config.UlbId && u.IsActive)
            .Select(u => new
            {
                u.UlbCode,
                u.UlbName,
                u.UlbNameLocal,
                u.EmailId,
                u.MobileNo,
                u.AlternateMobileNo,
                u.WebsiteUrl,
                u.UlbAddress,
                u.State,
                u.District,
                u.PinCode
            })
            .FirstOrDefaultAsync(ct);

        if (raw is null)
            return null;

        var resolvedLogo = await ResolveLogoDataUrlAsync(config.UlbLogo, ct);

        var value = new UlbSnapshot(
            raw.UlbCode,
            raw.UlbName,
            raw.UlbNameLocal,
            resolvedLogo,
            raw.EmailId,
            raw.MobileNo,
            raw.AlternateMobileNo,
            raw.WebsiteUrl,
            raw.UlbAddress,
            raw.State,
            raw.District,
            raw.PinCode);

        return value;
    }

    private async Task<string?> ResolveLogoDataUrlAsync(string? ulbLogo, CancellationToken ct)
    {
        var image = await EmbeddedReportImage.LoadLogoAsync(
            ulbLogo, _documentApplicationService, _httpClientFactory, ct);
        if (!string.IsNullOrWhiteSpace(ulbLogo) && image.DataUrl is null)
            _logger.LogWarning("Configured ULB logo could not be embedded: {Status}", image.Status);
        return image.DataUrl;
    }

    private async Task<(List<object> Rows, bool HasMore, int TotalCount)> BuildPageAsync(
        Guid reportRequestId,
        Dictionary<string, string> parameters,
        string section,
        int skip,
        int take,
        CancellationToken ct)
    {
        var providerTimer = Stopwatch.StartNew();
        parameters.TryGetValue("ownerId", out var ownerIdText);

        var ownerIds = string.IsNullOrWhiteSpace(ownerIdText) ? new List<int>() : ownerIdText
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(x => int.TryParse(x.Trim(), out var id) ? id : 0)
                .Where(id => id > 0)
                .Distinct()
                .ToList();

        // --- Parse parameters ---
        parameters.TryGetValue("zoneId", out var zoneIdText);
        int.TryParse(zoneIdText, out var zoneId);

        parameters.TryGetValue("wardId", out var wardIdText);
        var wardIds = ParseIdList(wardIdText);

        parameters.TryGetValue("propertyNo", out var propertyNoText);
        propertyNoText = string.IsNullOrWhiteSpace(propertyNoText) ? null : propertyNoText.Trim();

        parameters.TryGetValue("partitionNo", out var partitionNoText);
        partitionNoText = string.IsNullOrWhiteSpace(partitionNoText) ? null : partitionNoText.Trim();

        parameters.TryGetValue("assessmentStatus", out var assessmentStatusText);
        int.TryParse(assessmentStatusText, out var assessmentStatus);

        // ------ FROM Property - TO Property Number Range Filter Parameters ------
        parameters.TryGetValue("fromPropertyNo", out var fromPropertyNoText);
        fromPropertyNoText = string.IsNullOrWhiteSpace(fromPropertyNoText)
            ? null
            : fromPropertyNoText.Trim();

        parameters.TryGetValue("toPropertyNo", out var toPropertyNoText);
        toPropertyNoText = string.IsNullOrWhiteSpace(toPropertyNoText)
            ? null
            : toPropertyNoText.Trim();

        // PropertyNo is stored as text, so a plain string comparison makes a range such as
        // 15..21 also include values such as 2, 1500 and 1999. For numeric range inputs compare
        // normalized digit strings by length first, then lexically within the same length. This
        // remains server-side/translatable and avoids converting dirty alphanumeric data in SQL.
        var hasNumericFromPropertyNo = long.TryParse(fromPropertyNoText, out var numericFromPropertyNo);
        var hasNumericToPropertyNo = long.TryParse(toPropertyNoText, out var numericToPropertyNo);
        var normalizedFromPropertyNo = hasNumericFromPropertyNo ? numericFromPropertyNo.ToString() : fromPropertyNoText;
        var normalizedToPropertyNo = hasNumericToPropertyNo ? numericToPropertyNo.ToString() : toPropertyNoText;

        // propertyId accepts a single value OR comma-separated list: "101,202,303" propertyid means owenerid
        parameters.TryGetValue("propertyId", out var propertyIdStr);
        parameters.TryGetValue("userId", out var userIdStr);

        parameters.TryGetValue("Type", out var type);
        type = string.IsNullOrWhiteSpace(type)
            ? null
            : type.Trim().ToUpper();

        parameters.TryGetValue("propertyTypeId", out var propertyTypeIdText);
        int.TryParse(propertyTypeIdText, out var propertyTypeId);

        parameters.TryGetValue("PropertyDescription", out var propertyDescription);
        propertyDescription = string.IsNullOrWhiteSpace(propertyDescription) ? null : propertyDescription.Trim();

        var financeYear = ParseFinanceYear(parameters);

        // Split on commas, parse each token, deduplicate, drop invalid entries.
        var propertyIds = (propertyIdStr ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(s => int.TryParse(s, out var id) ? id : 0)
            .Where(id => id > 0)
            .Distinct()
            .ToList();

        if (ownerIds.Count > 0)
        {
            propertyIds.AddRange(ownerIds);
            propertyIds = propertyIds.Distinct().ToList();
        }

        ActiveYearSnapshot? activeYear;
        int activeYearId;
        List<int> pagedPropertyIds;
        bool hasMore;
        int totalCount;
        // ExecutePageAsync asks this scoped provider for main and propertyDetails in sequence.
        // Reuse the exact page selection for the second section instead of repeating the active
        // year lookup and the filtered PropertyMast paging query.
        if (_cachedPageSelection is not null
            && ReferenceEquals(_cachedPageSelection.Parameters, parameters)
            && _cachedPageSelection.ReportRequestId == reportRequestId
            && _cachedPageSelection.Skip == skip
            && _cachedPageSelection.Take == take)
        {
            activeYear = _cachedPageSelection.ActiveYear;
            activeYearId = activeYear?.Id ?? 0;
            pagedPropertyIds = _cachedPageSelection.PropertyIds;
            hasMore = _cachedPageSelection.HasMore;
            totalCount = _cachedPageSelection.TotalCount;
        }
        else
        {
            activeYear = await GetActiveYearAsync(financeYear, ct);
            activeYearId = activeYear?.Id ?? 0;
            totalCount = -1;

            // If no explicit propertyIds are provided, resolve and page them on SQL Server. This is
            // the ward-wise bulk path; keeping the paging server-side prevents loading an entire ward
            // into memory once for every section/page requested by the HTML report worker.
            if (propertyIds.Count == 0)
            {
                var query =
                    from p in _propertyRepository.GetQueryable()
                    join w in _wardRepository.GetQueryable() on p.WardId equals w.Id into wj
                    from w in wj.DefaultIfEmpty()

                        // ---------------- JOIN PropertyTypeMaster ----------------
                    join pt in _propertyTypeRepository.GetQueryable()
                        on p.PropertyTypeId equals pt.Id into ptj
                    from pt in ptj.DefaultIfEmpty()

                    where p.IsActive && !p.MarkedForDeletion
                          && (zoneId == 0 || w.ZoneId == zoneId)
                          && (wardIds.Count == 0 || wardIds.Contains(p.WardId))
                          && (propertyNoText == null || p.PropertyNo == propertyNoText)
                          && (partitionNoText == null || p.PartitionNo == partitionNoText)
                          && (assessmentStatus == 0 || p.PropertyAssessmentStatusId == assessmentStatus)
                          && (string.IsNullOrEmpty(type) || p.Type == type)
                          && (propertyTypeId == 0 || p.PropertyTypeId == propertyTypeId)
                          && (string.IsNullOrEmpty(propertyDescription) || pt.PropertyDescription == propertyDescription)
                          && (fromPropertyNoText == null ||
                              (hasNumericFromPropertyNo
                                  ? p.PropertyNo != null
                                    && !EF.Functions.Like(p.PropertyNo, "%[^0-9]%")
                                    && (p.PropertyNo!.Length > normalizedFromPropertyNo!.Length
                                        || (p.PropertyNo!.Length == normalizedFromPropertyNo.Length
                                            && string.Compare(p.PropertyNo, normalizedFromPropertyNo) >= 0))
                                  : string.Compare(p.PropertyNo, fromPropertyNoText) >= 0))
                          && (toPropertyNoText == null ||
                              (hasNumericToPropertyNo
                                  ? p.PropertyNo != null
                                    && !EF.Functions.Like(p.PropertyNo, "%[^0-9]%")
                                    && (p.PropertyNo!.Length < normalizedToPropertyNo!.Length
                                        || (p.PropertyNo!.Length == normalizedToPropertyNo.Length
                                            && string.Compare(p.PropertyNo, normalizedToPropertyNo) <= 0))
                                  : string.Compare(p.PropertyNo, toPropertyNoText) <= 0))

                    select p;

                // APPLY TransMast constraint SERVER-SIDE only when caller requested financeYear
                if (financeYear != 0 && activeYearId > 0)
                {
                    var transQ = _transmastRepository.GetQueryable()
                        .Where(t => t.FinanceYearId == activeYearId)
                        .Select(t => t.PropertyId);

                    query = query.Where(p => transQ.Contains(p.Id));
                }

                // The worker needs the exact first-page count to schedule bounded chunks in
                // parallel. Other pages avoid repeating this count query.
                if (take != int.MaxValue
                    && skip == 0
                    && section.Equals(MainSection, StringComparison.OrdinalIgnoreCase))
                    totalCount = await query.CountAsync(ct);

                var takePlusOne = take == int.MaxValue ? int.MaxValue : take + 1;
                pagedPropertyIds = await query
                    .OrderBy(p => p.WardId)
                    .ThenBy(p => p.PropertyNo)
                    .ThenBy(p => p.PartitionNo)
                    .ThenBy(p => p.Id)
                    .Select(p => p.Id)
                    .Skip(skip)
                    .Take(takePlusOne)
                    .ToListAsync(ct);

                hasMore = take != int.MaxValue && pagedPropertyIds.Count > take;
                if (hasMore) pagedPropertyIds = pagedPropertyIds.Take(take).ToList();
            }
            else
            {
                // Explicit property IDs preserve the order supplied by the caller.
                if (skip == 0 && section.Equals(MainSection, StringComparison.OrdinalIgnoreCase))
                    totalCount = propertyIds.Count;
                var takePlusOne = take == int.MaxValue ? int.MaxValue : take + 1;
                pagedPropertyIds = propertyIds.Skip(skip).Take(takePlusOne).ToList();
                hasMore = take != int.MaxValue && pagedPropertyIds.Count > take;
                if (hasMore) pagedPropertyIds = pagedPropertyIds.Take(take).ToList();
            }

            _cachedPageSelection = new CachedPageSelection(
                parameters, reportRequestId, skip, take, activeYear, pagedPropertyIds, hasMore, totalCount);
        }

        int.TryParse(userIdStr, out var userId);

        List<object> pagedRows;

        switch (section)
        {
            case PropertyDetailsSection:
                pagedRows = await BuildPropertyDetailsRowsAsync(pagedPropertyIds, ct);
                break;

            default: // MainSection
                pagedRows = await BuildMainRowsAsync(pagedPropertyIds, userId, activeYearId, activeYear?.YearCode ?? "", ct);
                break;
        }

        _logger.LogInformation(
            "Karakarni provider section {Section} loaded {PropertyCount} properties in {ElapsedMs:F1} ms (tenant {OrganizationId})",
            section,
            pagedPropertyIds.Count,
            providerTimer.Elapsed.TotalMilliseconds,
            OrganizationId);

        return (pagedRows, hasMore, totalCount);
    }

    internal sealed record OldPropertyIdentity(string OldWardNo, string OldPropertyNo, string OldPartitionNo);

    private static string ResolveBuilderName(string? english, string? regional)
    {
        if (!string.IsNullOrWhiteSpace(english) && english.Trim() != "-") return english.Trim();
        if (!string.IsNullOrWhiteSpace(regional) && regional.Trim() != "-") return regional.Trim();
        return "-";
    }

    internal async Task<Dictionary<int, OldPropertyIdentity>> LoadOldPropertyIdentitiesAsync(
        IReadOnlyDictionary<int, int?> directOldIds, CancellationToken ct)
    {
        var propertyIds = directOldIds.Keys.ToArray();
        var oldProperties = _propertyMastOldRepository.GetQueryable().AsNoTracking()
            .Where(o => o.IsActive && !o.MarkedForDeletion);
        var mapped = _propertyMapRepository is null
            ? []
            : await (
                from mapping in _propertyMapRepository.GetQueryable().AsNoTracking()
                join oldProperty in oldProperties on mapping.PropertyIdOld equals (int?)oldProperty.Id
                where mapping.PropertyIdNew.HasValue && propertyIds.Contains(mapping.PropertyIdNew.Value)
                    && mapping.IsActive && mapping.IsCurrent && mapping.Status == "ACTIVE"
                select new
                {
                    PropertyId = mapping.PropertyIdNew.Value,
                    oldProperty.OldWardNo, oldProperty.OldPropertyNo, oldProperty.OldPartitionNo
                }
            ).ToListAsync(ct);
        var mappedByProperty = mapped.ToLookup(p => p.PropertyId);
        var fallbackIds = directOldIds.Where(p => !mappedByProperty.Contains(p.Key) && p.Value is > 0)
            .Select(p => p.Value!.Value).Distinct().ToArray();
        var fallback = await oldProperties.Where(o => fallbackIds.Contains(o.Id))
            .Select(o => new { o.Id, o.OldWardNo, o.OldPropertyNo, o.OldPartitionNo })
            .ToDictionaryAsync(o => o.Id, ct);

        static string JoinValues(IEnumerable<string?> values) => string.Join(", ", values
            .Select(v => v?.Trim()).Where(v => !string.IsNullOrWhiteSpace(v)).Distinct().OrderBy(v => v));

        return directOldIds.ToDictionary(p => p.Key, p =>
        {
            var rows = mappedByProperty[p.Key].ToList();
            if (rows.Count > 0)
                return new OldPropertyIdentity(JoinValues(rows.Select(r => r.OldWardNo)),
                    JoinValues(rows.Select(r => r.OldPropertyNo)), JoinValues(rows.Select(r => r.OldPartitionNo)));
            if (p.Value.HasValue && fallback.TryGetValue(p.Value.Value, out var old))
                return new OldPropertyIdentity(JoinValues([old.OldWardNo]),
                    JoinValues([old.OldPropertyNo]), JoinValues([old.OldPartitionNo]));
            return new OldPropertyIdentity("", "", "");
        });
    }

    private async Task<List<object>> BuildMainRowsAsync(List<int> propertyIds, int userId, int activeYearId, string yearCode, CancellationToken ct)
    {
        if (propertyIds == null || propertyIds.Count == 0)
            return new List<object>();

        // Property identity, ward, society, wing and type-of-use in one SQL round-trip.
        var propertyRows = await (
            from pm in _propertyRepository.GetQueryable()
                                           .Where(p => propertyIds.Contains(p.Id) && p.IsActive && !p.MarkedForDeletion)
            join wm in _wardRepository.GetQueryable() on pm.WardId equals wm.Id into wj
            from wm in wj.DefaultIfEmpty()
            join pt in _propertyTypeRepository.GetQueryable() on pm.PropertyTypeId equals pt.Id into ptj
            from pt in ptj.DefaultIfEmpty()
            join sd in _societyRepository.GetQueryable() on (int?)pm.Id equals sd.PropertyId into sdj
            from sd in sdj.DefaultIfEmpty()
            join wing in _wingRepository.GetQueryable() on pm.WingDetailId equals (int?)wing.Id into wingj
            from wing in wingj.DefaultIfEmpty()
            join tou in _typeOfUseRepository.GetQueryable() on pm.PropertyTypeId equals (int?)tou.Id into touj
            from tou in touj.DefaultIfEmpty()
            select new
            {
                pm.Id,
                pm.PropertyNo,
                pm.WardId,
                pm.PartitionNo,
                pm.UPICId,
                pm.CSN,
                pm.PropertyMastOldId,
                pm.SubZoneNo,
                pm.MobileNo,
                pm.OwnerTitle,
                pm.OccupierTitle,
                pm.OwnerName,
                pm.OwnerNameEnglish,
                pm.OccupierName,
                pm.OccupierNameEnglish,
                pm.Address,
                pm.AddressEnglish,
                pm.EmailId,
                pm.PlotNo,
                pm.FlatOrShopNo,
                pm.FlatOrShopName,
                pm.PropertyTypeId,
                pm.CategoryId,
                pm.Type,
                pm.WingDetailId,
                WingSocietyId = pm.WingDetailsMast != null && pm.WingDetailsMast!.IsActive
                    && !pm.WingDetailsMast!.MarkedForDeletion
                    ? (int?)pm.WingDetailsMast!.SocietyDetailsMastId : null,
                SocietyId = sd != null && sd.IsActive && !sd.MarkedForDeletion ? (int?)sd.Id : null,
                PartType = pt != null ? pt.PartType : null,
                PropertyDescription = pt != null ? pt.PropertyDescription : null,
                WardNo = wm != null ? wm.WardNo : null,
                ZoneNo = wm != null && wm.Zone != null ? wm.Zone!.ZoneNo : null,
                WingNo = wing != null ? wing.WingNo : null,
                WingName = wing != null ? wing.WingNo : null,
                SocietyName = sd != null ? sd.SocietyName : null,
                SocietyAddress = sd != null ? sd.SocietyAddress : null,
                LandOwnerName = sd != null ? (sd.LandOwnerNameEnglish ?? sd.LandOwnerName) : null,
                TypeOfUseDescription = tou != null ? tou.Description : null,
                TypeOfUseCode = tou != null ? tou.TypeOfUseCode : null,
            }
        ).ToListAsync(ct);

        var properties = propertyRows
            .GroupBy(property => property.Id)
            .Select(group => group.First())
            .ToList();

        if (!properties.Any())
            return new List<object>();

        var categoryIds = properties.Where(p => p.CategoryId.HasValue)
            .Select(p => p.CategoryId!.Value).Distinct().ToList();
        var categories = _propertyCategoryRepository is null
            ? new Dictionary<int, string>()
            : await _propertyCategoryRepository.GetQueryable().Where(c => categoryIds.Contains(c.Id))
                .ToDictionaryAsync(c => c.Id, c => c.PropertyCategoryName, ct);

        // 1b. Society details (batch load for all property IDs)
        // Society, wing and type-of-use are included in propertyRows above.

        // ULB branding uses the same active configuration as the application header.
        var ulb = await GetUlbAsync(ct);

        // 1e. User: select from [CORE].[UserMaster] where Id = @userId
        var user = userId <= 0
            ? null
            : await _userRepository.GetQueryable()
                .Where(u => u.Id == userId)
                .Select(u => new
                {
                    u.Id,
                    u.UserName,
                    u.UserCode,
                    u.Email,
                    u.MobileNo,
                })
                .FirstOrDefaultAsync(ct);

        // 1f. TransMast pivot — fetch all tax lines for all properties, then group by PropertyId
        // Reference: Notice119DataProvider & PrarupYadiDataProvider fallback to non-zero tax if active is 0
        var taxRowsRaw = await (
            from tm in _transmastRepository.GetQueryable()
                .Where(t => propertyIds.Contains(t.PropertyId) && (activeYearId == 0 || t.FinanceYearId == activeYearId))
            join tam in _taxMastRepository.GetQueryable() on tm.TaxId equals tam.Id
            where tam.IsActive
            orderby tam.DisplayOrder
            select new KarakarniTaxRow(
                tm.PropertyId,
                tm.Id,
                tam.TaxCode,
                tam.TaxName,
                tm.CalculationType,
                tm.CalculationValue,
                tm.CalculationAnnualValue,
                tm.TaxAmount,
                tm.IsActive,
                tm.MarkedForDeletion
            )
        ).ToListAsync(ct);

        var taxRowsByProperty = taxRowsRaw
            .GroupBy(t => t.PropertyId)
            .ToDictionary(
                g => g.Key,
                g =>
                {
                    var propertyRows = g.ToList();
                    var activeNonZero = propertyRows
                        .Where(r => r.IsActive && !r.MarkedForDeletion && r.TaxAmount > 0)
                        .ToList();

                    if (activeNonZero.Count > 0)
                    {
                        return propertyRows.Where(r => r.IsActive && !r.MarkedForDeletion).ToList();
                    }

                    return propertyRows;
                });

        // No custom allSafeTaxCodes lookup list needed, as we strictly output only the 11 active tax codes.

        // RV Calculation results for aggregates (varshik bhade mulya & durusti)
        // Reference: Notice119DataProvider fallback to non-zero RV if active is 0
        var rvResultsRaw = await _rvResultsRepository.GetQueryable()
            .Where(r => propertyIds.Contains(r.PropertyId))
            .Select(r => new
            {
                r.PropertyId,
                r.AnnualRentalValue,
                r.Maintenance,
                r.RateableValue,
                r.IsActive,
                r.MarkedForDeletion,
                r.Id
            })
            .ToListAsync(ct);

        var rvResultsMap = rvResultsRaw
            .GroupBy(r => r.PropertyId)
            .ToDictionary(
                g => g.Key,
                g =>
                {
                    var activeNonZero = g.Where(r => r.IsActive && !r.MarkedForDeletion && (r.RateableValue ?? 0m) > 0).ToList();
                    if (activeNonZero.Count > 0)
                    {
                        return activeNonZero.Select(r => new
                        {
                            r.PropertyId,
                            r.AnnualRentalValue,
                            r.Maintenance,
                            r.RateableValue
                        }).ToList();
                    }

                    var allNonZero = g.Where(r => (r.RateableValue ?? 0m) > 0).ToList();
                    if (allNonZero.Count > 0)
                    {
                        var maxId = allNonZero.Max(r => r.Id);
                        return allNonZero.Where(r => r.Id == maxId).Select(r => new
                        {
                            r.PropertyId,
                            r.AnnualRentalValue,
                            r.Maintenance,
                            r.RateableValue
                        }).ToList();
                    }

                    return g.Where(r => r.IsActive && !r.MarkedForDeletion).Select(r => new
                    {
                        r.PropertyId,
                        r.AnnualRentalValue,
                        r.Maintenance,
                        r.RateableValue
                    }).ToList();
                });

        // Fetch total built-up area in Sq. Mtr. for each property
        var floorAreaAggregates = await _propertyDetailsRepository.GetQueryable()
            .Where(pd => propertyIds.Contains(pd.PropertyId) && pd.IsActive && !pd.MarkedForDeletion)
            .GroupBy(pd => pd.PropertyId)
            .Select(g => new
            {
                PropertyId = g.Key,
                TotalAreaSqMtr = g.Sum(x => x.BuiltupAreaSqMeter ?? 0),
                TotalCarpetAreaSqFeet = (decimal)g.Sum(x => x.CarpetAreaSqFeet ?? 0),
                TotalCarpetAreaSqMeter = (decimal)g.Sum(x => x.CarpetAreaSqMeter ?? 0),
                TotalBuiltupAreaSqFeet = (decimal)g.Sum(x => x.BuiltupAreaSqFeet ?? 0),
                TotalBuiltupAreaSqMeter = (decimal)g.Sum(x => x.BuiltupAreaSqMeter ?? 0)
            })
            .ToDictionaryAsync(x => x.PropertyId, ct);

        // Fetch old property details from PropertyMastOld for linked properties
        var neededOldIds = properties
            .Where(p => p.PropertyMastOldId.HasValue && p.PropertyMastOldId.Value > 0)
            .Select(p => p.PropertyMastOldId!.Value)
            .Distinct()
            .ToList();

        var oldProps = neededOldIds.Count > 0
            ? await _propertyMastOldRepository.GetQueryable()
                .Where(o => neededOldIds.Contains(o.Id))
                .Select(o => new
                {
                    o.Id,
                    o.OldWardNo,
                    o.OldPropertyNo,
                    o.OldPartitionNo,
                    o.OldCSN,
                    o.OldEgovNo,
                    o.OldRV,
                    o.OldTotalTax,
                    o.OldGeneralTax,
                    o.OldALV,
                    o.NoOfOldToilets
                })
                .ToListAsync(ct)
            : null;
        var oldPropsMap = oldProps != null ? oldProps.ToDictionary(o => o.Id) : null;

        var oldIdentities = await LoadOldPropertyIdentitiesAsync(
            properties.ToDictionary(p => p.Id, p => p.PropertyMastOldId), ct);

        // Fetch assessment details (residential and commercial toilets) for each property
        var assessments = _propertyAssessmentRepository != null
            ? await _propertyAssessmentRepository.GetQueryable()
                .Where(pa => propertyIds.Contains(pa.PropertyId) && !pa.MarkedForDeletion)
                .Select(pa => new
                {
                    pa.PropertyId,
                    pa.NoOfResidentialToilets,
                    pa.NoOfCommercialToilets
                })
                .ToListAsync(ct)
            : [];
        var assessmentMap = assessments
            .GroupBy(pa => pa.PropertyId)
            .ToDictionary(g => g.Key, g => g.First());

        // PTIS.PlotDetails table removed from codebase in PR #966
        var plotAreas = new Dictionary<int, decimal>();

        var wardIdsForPage = properties.Select(p => p.WardId).Distinct().ToList();
        var propertyNumbersForPage = properties.Where(p => p.PropertyNo != null)
            .Select(p => p.PropertyNo!).Distinct().ToList();
        // Apartment base plans belong to the society + unit type, with PropertyId null.
        // Resolve society through the wing or another partition of the same property,
        // as the individual property's media screen does, in one query per page.
        var relatedSocieties = await (
            from society in _societyRepository.GetQueryable().Where(s => s.IsActive && !s.MarkedForDeletion)
            join owner in _propertyRepository.GetQueryable().Where(p => p.IsActive && !p.MarkedForDeletion)
                on society.PropertyId equals (int?)owner.Id
            where wardIdsForPage.Contains(owner.WardId) && owner.PropertyNo != null
                && propertyNumbersForPage.Contains(owner.PropertyNo!)
            orderby society.Id
            select new { owner.WardId, owner.PropertyNo, SocietyId = society.Id }
        ).ToListAsync(ct);
        var societyByPropertyNumber = relatedSocieties
            .GroupBy(s => (s.WardId, s.PropertyNo))
            .ToDictionary(g => g.Key, g => g.First().SocietyId);
        var mediaScopes = properties.Select(p => new KarakarniMediaScope(
            p.Id,
            p.WingSocietyId ?? p.SocietyId ??
                (societyByPropertyNumber.TryGetValue((p.WardId, p.PropertyNo), out var societyId) ? societyId : null),
            p.WingDetailId,
            p.Type,
            p.CategoryId == 1 && !string.Equals(p.PartType, "Amenity", StringComparison.OrdinalIgnoreCase)
                && !(p.PropertyDescription?.Contains("Amenity", StringComparison.OrdinalIgnoreCase) ?? false)
                && !(p.PropertyDescription?.Contains("अॅमिनीटी", StringComparison.Ordinal) ?? false)
                && !(p.PropertyDescription?.Contains("अ‍ॅमिनीटी", StringComparison.Ordinal) ?? false)
        )).ToList();
        var societyIdsForPage = mediaScopes.Where(s => s.AllowSharedPlan && s.SocietyId.HasValue)
            .Select(s => s.SocietyId!.Value).Distinct().ToList();
        var wingIdsForPage = mediaScopes.Where(s => s.AllowSharedPlan && s.WingId.HasValue)
            .Select(s => s.WingId!.Value).Distinct().ToList();
        var propertyMediaBindings = await _propertyPhotoRepository.GetQueryable()
            .Where(pp => pp.IsLatest
                && pp.IsActive
                && !pp.MarkedForDeletion
                && pp.DocumentBindingId.HasValue
                && ((pp.PropertyId.HasValue && propertyIds.Contains(pp.PropertyId.Value))
                    || (!pp.PropertyId.HasValue && pp.PhotoType != null
                        && pp.PhotoType.PhotoTypeCode.Contains("PLAN")
                        && (pp.DisplayOrder == null || pp.DisplayOrder <= 1)
                        && ((pp.SocietyDetailId.HasValue && societyIdsForPage.Contains(pp.SocietyDetailId.Value))
                            || (pp.WingDetailId.HasValue && wingIdsForPage.Contains(pp.WingDetailId.Value))))))
            .Select(pp => new KarakarniMediaBinding(
                pp.Id, pp.PropertyId, pp.SocietyDetailId, pp.WingDetailId, pp.Type,
                pp.PhotoType != null ? pp.PhotoType.PhotoTypeCode : null,
                pp.DisplayOrder, pp.DocumentBindingId!.Value))
            .ToListAsync(ct);

        var propertyPhotoBindingMap = mediaScopes.ToDictionary(s => s.PropertyId,
            s => KarakarniReportMedia.SelectPropertyPhoto(s, propertyMediaBindings));
        var uploadedPlanBindingMap = mediaScopes.ToDictionary(s => s.PropertyId,
            s => KarakarniReportMedia.SelectPlan(s, propertyMediaBindings));
        var planBindings = await _buildingPlanRepository.GetQueryable()
            .Where(bp => bp.IsActive
                && !bp.MarkedForDeletion
                && bp.DocumentBindingId.HasValue
                && wardIdsForPage.Contains(bp.WardId)
                && propertyNumbersForPage.Contains(bp.PropertyNo))
            .OrderByDescending(bp => bp.Id)
            .Select(bp => new { bp.WardId, bp.PropertyNo, BindingId = bp.DocumentBindingId!.Value })
            .ToListAsync(ct);

        var planBindingMap = planBindings
            .GroupBy(x => (x.WardId, x.PropertyNo))
            .ToDictionary(g => g.Key, g => g.First().BindingId);

        var imageBindingIds = propertyPhotoBindingMap.Values
            .Concat(uploadedPlanBindingMap.Values)
            .Concat(properties.Where(p => uploadedPlanBindingMap.GetValueOrDefault(p.Id) <= 0)
                .Select(p => planBindingMap.GetValueOrDefault((p.WardId, p.PropertyNo))))
            .Where(bindingId => bindingId > 0)
            .Distinct()
            .ToList();
        var embeddedImages = await EmbeddedReportImage.LoadBindingsAsync(imageBindingIds, _documentApplicationService, ct);

        // Stable sort properties to match original propertyIds order
        var propertyMap = properties.ToDictionary(p => p.Id);
        var orderedProperties = propertyIds
            .Where(id => propertyMap.ContainsKey(id))
            .Select(id => propertyMap[id])
            .ToList();

        // Build one row per property
        var allRows = new List<object>();

        foreach (var property in orderedProperties)
        {
            var taxRows = taxRowsByProperty.TryGetValue(property.Id, out var propTaxes)
                ? propTaxes
                : new List<KarakarniTaxRow>();

            rvResultsMap.TryGetValue(property.Id, out var propRvResults);

            // Determine active calculation type (RV or CV)
            var hasRv = taxRows.Any(t => string.Equals(t.RVorCV, "RV", StringComparison.OrdinalIgnoreCase));
            var hasCv = taxRows.Any(t => string.Equals(t.RVorCV, "CV", StringComparison.OrdinalIgnoreCase));

            string activeCalcType = "RV";
            if (hasRv && hasCv)
            {
                activeCalcType = "RCV";
            }
            else if (hasRv)
            {
                taxRows = taxRows.Where(t => string.Equals(t.RVorCV, "RV", StringComparison.OrdinalIgnoreCase)).ToList();
                activeCalcType = "RV";
            }
            else if (hasCv)
            {
                taxRows = taxRows.Where(t => string.Equals(t.RVorCV, "CV", StringComparison.OrdinalIgnoreCase)).ToList();
                activeCalcType = "CV";
            }

            double totalAnnualRentalValue = 0;
            decimal totalMaintenance = 0;
            decimal totalRateableValue = 0;

            if ((string.Equals(activeCalcType, "RV", StringComparison.OrdinalIgnoreCase) || string.Equals(activeCalcType, "RCV", StringComparison.OrdinalIgnoreCase)) && propRvResults != null && propRvResults.Any())
            {
                totalAnnualRentalValue = propRvResults.Sum(r => (double)(r.AnnualRentalValue ?? 0d));
                totalMaintenance = propRvResults.Sum(r => (decimal)(r.Maintenance ?? 0m));
                totalRateableValue = propRvResults.Sum(r => (decimal)(r.RateableValue ?? 0m));
            }

            var taxTotalRows = taxRows.Where(t => t.TaxCode == "TaxTotal").ToList();
            decimal totalTax = 0;
            if (string.Equals(activeCalcType, "RCV", StringComparison.OrdinalIgnoreCase))
            {
                if (taxTotalRows.Any())
                {
                    totalTax = taxTotalRows.Sum(t => t.TaxAmount);
                }
                else
                {
                    totalTax = taxRows.Where(t => t.TaxCode != "TaxTotal").Sum(t => t.TaxAmount);
                }
            }
            else
            {
                var taxTotalRow = taxTotalRows.FirstOrDefault(t => string.Equals(t.RVorCV, activeCalcType, StringComparison.OrdinalIgnoreCase));
                totalTax = taxTotalRow != null
                    ? taxTotalRow.TaxAmount
                    : taxRows.Where(t => t.TaxCode != "TaxTotal" && string.Equals(t.RVorCV, activeCalcType, StringComparison.OrdinalIgnoreCase)).Sum(t => t.TaxAmount);
            }

            // Fallback to transaction values if RV results are missing or zero
            if ((string.Equals(activeCalcType, "RV", StringComparison.OrdinalIgnoreCase) || string.Equals(activeCalcType, "RCV", StringComparison.OrdinalIgnoreCase)) && totalAnnualRentalValue == 0)
            {
                var firstTaxTotal = taxTotalRows.FirstOrDefault(t => string.Equals(t.RVorCV, "RV", StringComparison.OrdinalIgnoreCase));
                if (firstTaxTotal?.CalculationAnnualValue is decimal firstArv && firstArv > 0)
                {
                    totalAnnualRentalValue = (double)firstArv;
                }
                else
                {
                    var nonZeroArv = taxRows.FirstOrDefault(t => (t.CalculationAnnualValue ?? 0m) > 0);
                    if (nonZeroArv?.CalculationAnnualValue is decimal nzArv && nzArv > 0)
                    {
                        totalAnnualRentalValue = (double)nzArv;
                    }
                }
            }
            if ((string.Equals(activeCalcType, "RV", StringComparison.OrdinalIgnoreCase) || string.Equals(activeCalcType, "RCV", StringComparison.OrdinalIgnoreCase)) && totalRateableValue == 0)
            {
                var firstTaxTotal = taxTotalRows.FirstOrDefault(t => string.Equals(t.RVorCV, "RV", StringComparison.OrdinalIgnoreCase));
                if (firstTaxTotal != null && firstTaxTotal.RVorCVValue > 0)
                {
                    totalRateableValue = firstTaxTotal.RVorCVValue;
                }
                else
                {
                    var nonZeroRv = taxRows.FirstOrDefault(t => t.RVorCVValue > 0);
                    if (nonZeroRv != null)
                    {
                        totalRateableValue = nonZeroRv.RVorCVValue;
                    }
                }
            }
            if (string.Equals(activeCalcType, "CV", StringComparison.OrdinalIgnoreCase) && totalRateableValue == 0)
            {
                var firstTaxTotal = taxTotalRows.FirstOrDefault(t => string.Equals(t.RVorCV, "CV", StringComparison.OrdinalIgnoreCase));
                if (firstTaxTotal != null && firstTaxTotal.RVorCVValue > 0)
                {
                    totalRateableValue = firstTaxTotal.RVorCVValue;
                }
                else
                {
                    var nonZeroRv = taxRows.FirstOrDefault(t => t.RVorCVValue > 0);
                    if (nonZeroRv != null)
                    {
                        totalRateableValue = nonZeroRv.RVorCVValue;
                    }
                }
            }

            floorAreaAggregates.TryGetValue(property.Id, out var floorAgg);
            var totalCarpetAreaSqFeet = floorAgg?.TotalCarpetAreaSqFeet ?? 0m;
            var totalCarpetAreaSqMeter = floorAgg?.TotalCarpetAreaSqMeter ?? 0m;
            var totalBuiltupAreaSqFeet = floorAgg?.TotalBuiltupAreaSqFeet ?? 0m;
            var totalBuiltupAreaSqMeter = floorAgg?.TotalBuiltupAreaSqMeter ?? 0m;
            var totalAreaSqMtr = totalBuiltupAreaSqMeter > 0m ? totalBuiltupAreaSqMeter : (floorAgg != null ? (decimal)floorAgg.TotalAreaSqMtr : 0m);

            dynamic? oldProp = null;
            if (property.PropertyMastOldId.HasValue && oldPropsMap != null)
            {
                oldPropsMap.TryGetValue(property.PropertyMastOldId.Value, out var foundOld);
                oldProp = foundOld;
            }

            var oldIdentity = oldIdentities[property.Id];
            var buildingNo = !string.IsNullOrWhiteSpace(property.PartitionNo)
                ? property.PartitionNo
                : property.PropertyNo;

            var ownerFullName = $"{property.OwnerTitle} {property.OwnerName}".Trim();
            var occupierFullName = $"{property.OccupierTitle} {property.OccupierName}".Trim();
            plotAreas.TryGetValue(property.Id, out var openPlotAreaSqFt);
            propertyPhotoBindingMap.TryGetValue(property.Id, out var propertyPhotoBindingId);
            uploadedPlanBindingMap.TryGetValue(property.Id, out var uploadedPlanBindingId);
            planBindingMap.TryGetValue((property.WardId, property.PropertyNo), out var legacyPlanBindingId);
            var planBindingId = uploadedPlanBindingId > 0 ? uploadedPlanBindingId : legacyPlanBindingId;
            var propertyPhoto = propertyPhotoBindingId > 0 && embeddedImages.TryGetValue(propertyPhotoBindingId, out var photo)
                ? photo
                : EmbeddedReportImage.NotUploaded;
            var planPhoto = planBindingId > 0 && embeddedImages.TryGetValue(planBindingId, out var plan)
                ? plan
                : EmbeddedReportImage.NotUploaded;

            assessmentMap.TryGetValue(property.Id, out var assessment);
            var residentialToilets = assessment?.NoOfResidentialToilets ?? 0;
            var commercialToilets = assessment?.NoOfCommercialToilets ?? 0;

            var row = new Dictionary<string, object?>
            {
                ["printDate"] = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromMinutes(330))
                    .ToString("dd-MM-yyyy", CultureInfo.InvariantCulture),
                ["propertyId"] = property.Id,
                ["PropertyId"] = property.Id,
                ["totalAreaSqMtr"] = totalAreaSqMtr,
                ["totalCarpetAreaSqFeet"] = totalCarpetAreaSqFeet,
                ["TotalCarpetAreaSqFeet"] = totalCarpetAreaSqFeet,
                ["totalCarpetAreaSqMeter"] = totalCarpetAreaSqMeter,
                ["TotalCarpetAreaSqMeter"] = totalCarpetAreaSqMeter,
                ["totalBuiltupAreaSqFeet"] = totalBuiltupAreaSqFeet,
                ["TotalBuiltupAreaSqFeet"] = totalBuiltupAreaSqFeet,
                ["totalBuiltupAreaSqMeter"] = totalBuiltupAreaSqMeter,
                ["TotalBuiltupAreaSqMeter"] = totalBuiltupAreaSqMeter,
                ["openPlotAreaSqFt"] = openPlotAreaSqFt,
                ["propertyNo"] = property.PropertyNo,
                ["buildingNo"] = string.IsNullOrWhiteSpace(property.WardNo)
                    ? property.PropertyNo
                    : string.IsNullOrWhiteSpace(property.PartitionNo)
                        ? $"{property.WardNo}-{property.PropertyNo}"
                        : $"{property.WardNo}-{property.PropertyNo}-{property.PartitionNo}",
                ["plotOrCsnNo"] = !string.IsNullOrWhiteSpace(property.PlotNo) ? property.PlotNo : (property.CSN ?? ""),
                ["zoneNo"] = property.ZoneNo,
                ["wardId"] = property.WardId,
                ["wardNo"] = property.WardNo,
                ["partitionNo"] = property.PartitionNo,
                ["upicId"] = property.UPICId,
                ["computerNo"] = !string.IsNullOrWhiteSpace(property.CSN) ? property.CSN : (!string.IsNullOrWhiteSpace(property.UPICId) ? property.UPICId : ""),
                ["CSN"] = property.CSN ?? "",
                ["oldWardNo"] = oldIdentity.OldWardNo,
                ["oldBuildingNo"] = oldProp is null
                    ? ""
                    : string.Join("-", new[] { (string?)oldProp.OldWardNo, (string?)oldProp.OldPropertyNo, (string?)oldProp.OldPartitionNo }
                        .Where(value => !string.IsNullOrWhiteSpace(value))),
                ["oldPropertyNo"] = oldIdentity.OldPropertyNo,
                ["oldPartitionNo"] = oldIdentity.OldPartitionNo,
                ["oldCSN"] = (string?)(oldProp?.OldCSN) ?? "",
                ["oldEgovNo"] = (string?)(oldProp?.OldEgovNo) ?? "",
                ["oldRV"] = oldProp?.OldRV != null ? (decimal)oldProp.OldRV : 0m,
                ["oldGeneralTax"] = oldProp?.OldGeneralTax != null ? (decimal)oldProp.OldGeneralTax : 0m,
                ["oldTotalTax"] = oldProp?.OldTotalTax != null ? (decimal)oldProp.OldTotalTax : 0m,
                ["oldALV"] = oldProp?.OldALV != null ? (decimal)oldProp.OldALV : 0m,
                ["oldRent"] = oldProp?.OldALV != null ? (decimal)oldProp.OldALV : 0m,
                ["oldToiletNo"] = oldProp?.NoOfOldToilets ?? 0,
                ["newRent"] = totalAnnualRentalValue,
                ["NewRent"] = totalAnnualRentalValue,
                ["new_rent"] = totalAnnualRentalValue,
                ["newToiletNo"] = residentialToilets,
                ["NewToiletNo"] = residentialToilets,
                ["new_toilet_no"] = residentialToilets,
                ["noOfResidentialToilets"] = residentialToilets,
                ["NoOfResidentialToilets"] = residentialToilets,
                ["toiletNo"] = residentialToilets,
                ["ToiletNo"] = residentialToilets,
                ["commToiletNo"] = commercialToilets,
                ["CommToiletNo"] = commercialToilets,
                ["commtoiletNo"] = commercialToilets,
                ["commtoilet_no"] = commercialToilets,
                ["noOfCommercialToilets"] = commercialToilets,
                ["NoOfCommercialToilets"] = commercialToilets,
                ["subZoneNo"] = property.SubZoneNo,
                ["mobileNo"] = property.MobileNo,
                ["ownerTitle"] = property.OwnerTitle,
                ["occupierTitle"] = property.OccupierTitle,
                ["ownerName"] = property.OwnerName,
                ["ownerNameEnglish"] = property.OwnerNameEnglish ?? property.OwnerName,
                ["occupierNameEnglish"] = property.OccupierNameEnglish ?? property.OccupierName,
                ["addressEnglish"] = property.AddressEnglish ?? property.Address,
                ["propertyEmailId"] = property.EmailId,
                ["landOwnerName"] = property.LandOwnerName,
                ["builderName"] = ResolveBuilderName(
                    property.OwnerNameEnglish, property.OwnerName),
                ["propertyDescription"] = property.PropertyDescription,
                ["propertyCategory"] = property.CategoryId.HasValue
                    && categories.TryGetValue(property.CategoryId.Value, out var categoryName) ? categoryName : null,
                ["ownerFullName"] = !string.IsNullOrWhiteSpace(ownerFullName) ? ownerFullName : (property.OwnerName ?? ""),
                ["occupierName"] = property.OccupierName,
                ["occupierFullName"] = !string.IsNullOrWhiteSpace(occupierFullName) ? occupierFullName : (property.OccupierName ?? ""),
                ["address"] = property.Address,
                ["plotNo"] = property.PlotNo,
                ["flatOrShopNo"] = property.FlatOrShopNo,
                ["flatOrShopName"] = property.FlatOrShopName,
                // Society details
                ["wingNo"] = property.WingNo,
                ["wingName"] = property.WingName,
                ["societyName"] = property.SocietyName,
                ["societyAddress"] = property.SocietyAddress,
                // Type-of-use
                ["typeOfUseDesc"] = property.TypeOfUseDescription,
                ["Description"] = property.PropertyDescription,
                ["typeOfUseCode"] = property.TypeOfUseCode,

                // User Master fields (CORE.UserMaster)
                ["userId"] = user?.Id,
                ["userName"] = user?.UserName,
                ["userCode"] = user?.UserCode,
                ["userEmail"] = user?.Email,
                ["userMobileNo"] = user?.MobileNo,
                // ULB Master fields (CORE.UlbMaster)
                ["ulbCode"] = ulb?.UlbCode,
                ["ulbName"] = ulb?.UlbName,
                ["ulbNameLocal"] = !string.IsNullOrWhiteSpace(ulb?.UlbNameLocal) ? ulb.UlbNameLocal : (!string.IsNullOrWhiteSpace(ulb?.UlbName) ? ulb.UlbName : "महानगरपालिका / नगरपरिषद"),
                ["ulbLogo"] = ulb?.UlbLogo ?? string.Empty,
                ["CouncilLogo"] = ulb?.UlbLogo ?? string.Empty,
                ["councilLogo"] = ulb?.UlbLogo ?? string.Empty,
                ["logo"] = ulb?.UlbLogo ?? string.Empty,
                ["CouncilName"] = !string.IsNullOrWhiteSpace(ulb?.UlbNameLocal) ? ulb.UlbNameLocal : (ulb?.UlbName ?? string.Empty),
                ["CouncilAddress"] = !string.IsNullOrWhiteSpace(ulb?.UlbAddress) ? ulb.UlbAddress : string.Empty,
                ["ulbEmailId"] = ulb?.EmailId,
                ["emailId"] = ulb?.EmailId,
                ["ulbMobileNo"] = ulb?.MobileNo,
                ["ulbAlternateMobileNo"] = ulb?.AlternateMobileNo,
                ["alternateMobileNo"] = ulb?.AlternateMobileNo,
                ["ulbWebsiteUrl"] = ulb?.WebsiteUrl,
                ["websiteUrl"] = ulb?.WebsiteUrl,
                ["ulbAddress"] = !string.IsNullOrWhiteSpace(ulb?.UlbAddress) ? ulb.UlbAddress : "",
                ["ulbState"] = ulb?.State,
                ["state"] = ulb?.State,
                ["ulbDistrict"] = ulb?.District,
                ["district"] = ulb?.District,
                ["ulbPinCode"] = ulb?.PinCode,
                ["pinCode"] = ulb?.PinCode,
                ["financeYear"] = yearCode,
                ["propertyPhoto"] = propertyPhoto.DataUrl,
                ["propertyPhotoDocumentGuid"] = propertyPhoto.DocumentGuid,
                ["propertyPhotoStatus"] = propertyPhoto.Status,
                ["planPhoto"] = planPhoto.DataUrl,
                ["buildingPlanPhoto"] = planPhoto.DataUrl,
                ["planPhotoDocumentGuid"] = planPhoto.DocumentGuid,
                ["buildingPlanPhotoDocumentGuid"] = planPhoto.DocumentGuid,
                ["planPhotoStatus"] = planPhoto.Status,

                // RV Calculation properties (ADDED)
                ["calculationAnnualValue"] = totalAnnualRentalValue,
                ["CalculationAnnualValue"] = totalAnnualRentalValue,
                ["annualRentalValue"] = totalAnnualRentalValue,
                ["AnnualRentalValue"] = totalAnnualRentalValue,
                ["maintenance"] = totalMaintenance,
                ["Maintenance"] = totalMaintenance,
                ["rateableValue"] = totalRateableValue,
                ["RateableValue"] = totalRateableValue,
                ["totalTax"] = totalTax,
                ["TotalTax"] = totalTax,
                ["ekunKar"] = totalTax,
                ["propertyTotals"] = new Dictionary<string, object?>
                {
                    ["totalCarpetAreaSqFeet"] = totalCarpetAreaSqFeet,
                    ["TotalCarpetAreaSqFeet"] = totalCarpetAreaSqFeet,
                    ["totalCarpetAreaSqMeter"] = totalCarpetAreaSqMeter,
                    ["TotalCarpetAreaSqMeter"] = totalCarpetAreaSqMeter,
                    ["totalBuiltupAreaSqFeet"] = totalBuiltupAreaSqFeet,
                    ["TotalBuiltupAreaSqFeet"] = totalBuiltupAreaSqFeet,
                    ["totalBuiltupAreaSqMeter"] = totalBuiltupAreaSqMeter,
                    ["TotalBuiltupAreaSqMeter"] = totalBuiltupAreaSqMeter,
                    ["totalAnnualRentalValue"] = totalAnnualRentalValue,
                    ["TotalAnnualRentalValue"] = totalAnnualRentalValue,
                    ["totalMaintenance"] = totalMaintenance,
                    ["TotalMaintenance"] = totalMaintenance,
                    ["totalRateableValue"] = totalRateableValue,
                    ["TotalRateableValue"] = totalRateableValue,
                    ["totalTax"] = totalTax,
                    ["TotalTax"] = totalTax,
                },
            };

            // Pre-populate only the 11 active tax codes with default 0/activeCalcType value
            foreach (var code in ActiveTaxCodes)
            {
                row[$"Transmast_{code}"] = 0m;
                row[$"RVorCV_{code}"] = activeCalcType;
                row[$"RVorCVValue_{code}"] = 0m;
            }

            // Pivot TransMast rows into dynamic columns on the same main row.
            var componentTaxes = taxRows
                .Where(t => t.TaxCode != "TaxTotal")
                .ToList();
            foreach (var tax in componentTaxes)
            {
                var safeCode = GetSafeTaxCode((string?)tax.TaxCode, (string?)tax.TaxName);
                if (ActiveTaxCodes.Contains(safeCode))
                {
                    row[$"Transmast_{safeCode}"] = (row.TryGetValue($"Transmast_{safeCode}", out var prevVal) && prevVal is decimal prevDec ? prevDec : 0m) + (decimal)tax.TaxAmount;
                    row[$"RVorCV_{safeCode}"] = tax.RVorCV;
                    row[$"RVorCVValue_{safeCode}"] = tax.RVorCVValue;
                }
            }

            var compTaxSum = componentTaxes.Sum(t => (decimal)t.TaxAmount);
            if (compTaxSum > 0 && (totalTax == 0 || compTaxSum > totalTax))
            {
                totalTax = compTaxSum;
                row["totalTax"] = totalTax;
                row["TotalTax"] = totalTax;
                row["ekunKar"] = totalTax;
            }

            var propTax = row.TryGetValue("Transmast_GEN", out var genTaxVal) && genTaxVal is decimal genDec ? genDec : 0m;
            row["propertyTax"] = propTax;
            row["PropertyTax"] = propTax;
            if (row["propertyTotals"] is Dictionary<string, object?> totalsDict)
            {
                totalsDict["totalTax"] = totalTax;
                totalsDict["TotalTax"] = totalTax;
                totalsDict["propertyTax"] = propTax;
                totalsDict["PropertyTax"] = propTax;
                totalsDict["newRent"] = totalAnnualRentalValue;
                totalsDict["NewRent"] = totalAnnualRentalValue;
                totalsDict["newToiletNo"] = residentialToilets;
                totalsDict["NewToiletNo"] = residentialToilets;
                totalsDict["commToiletNo"] = commercialToilets;
                totalsDict["CommToiletNo"] = commercialToilets;
            }

            allRows.Add(row);
        }

        return allRows;
    }

    private async Task<List<object>> BuildPropertyDetailsRowsAsync(List<int> propertyIds, CancellationToken ct)
    {
        if (propertyIds == null || propertyIds.Count == 0)
            return new List<object>();

        var details = await (
            from pd in _propertyDetailsRepository.GetQueryable()
                     .Where(p => propertyIds.Contains(p.PropertyId) && p.IsActive && !p.MarkedForDeletion)
            join fm in _floorRepository.GetQueryable()
                     on pd.FloorId equals fm.Id into fmj
            from fm in fmj.DefaultIfEmpty()
            join ctm in _constructionTypeRepository.GetQueryable()
                     on pd.ConstructionTypeId equals ctm.Id into ctmj
            from ctm in ctmj.DefaultIfEmpty()
            join tum in _typeOfUseRepository.GetQueryable()
                     on pd.TypeOfUseId equals tum.Id into tumj
            from tum in tumj.DefaultIfEmpty()
            join rv in _rvResultsRepository.GetQueryable().Where(r => r.IsActive && !r.MarkedForDeletion)
                     on pd.Id equals rv.PropertyDetailsId into rvj
            from rv in rvj.DefaultIfEmpty()
            select new
            {
                pd.PropertyId,
                pd.FloorId,
                pd.SubFloorId,
                FloorDescription = fm != null ? fm.Description : null,
                FloorCode = fm != null ? fm.FloorCode : null,
                pd.ConstructionYear,
                ConstructionCode = ctm != null ? ctm.ConstructionCode : null,
                ConstructionDescription = ctm != null ? ctm.Description : null,
                TypeOfUseCode = tum != null ? tum.TypeOfUseCode : null,
                TypeOfUseDescription = tum != null ? tum.Description : null,
                TypeOfUseType = tum != null ? tum.Type : null,
                pd.AssessmentYear,
                pd.CarpetAreaSqFeet,
                pd.CarpetAreaSqMeter,
                pd.BuiltupAreaSqFeet,
                pd.BuiltupAreaSqMeter,
                pd.NoOfRooms,
                Rooms = pd.RoomWiseSubmissionDetails.Where(r => r.IsActive && !r.MarkedForDeletion)
                    .Select(r => new { r.Id, r.RoomNo, r.LengthMtr, r.WidthMtr,
                        r.AreaSqMtr, r.TotalAreaSqMtr, r.NoOfRooms,
                        RoomType = r.RoomTypeMaster != null ? r.RoomTypeMaster.RoomTypeName : null }).ToList(),
                MonthlyRate = rv != null ? (decimal?)Convert.ToDecimal(rv.MonthlyRate) : 0m,
                YearlyRate = rv != null ? (decimal?)Convert.ToDecimal(rv.YearlyRate) : 0m,
                YearlyRent = rv != null ? (decimal?)Convert.ToDecimal(rv.YearlyRent) : 0m,
                Depreciation = rv != null ? rv.Depreciation : 0m,
                DepreciationPer = rv != null ? rv.DepreciationPer : 0m,
                AnnualRentalValue = rv != null ? (decimal?)Convert.ToDecimal(rv.AnnualRentalValue) : 0m,
                Maintenance = rv != null ? rv.Maintenance : 0m,
                RateableValue = rv != null ? rv.RateableValue : 0m,
            }
        ).ToListAsync(ct);

        // Group by PropertyId and calculate sum of AnnualRentalValue, Maintenance, and RateableValue
        var propertyTotals = details.GroupBy(d => d.PropertyId)
            .ToDictionary(g => g.Key, g => new
            {
                TotalAnnualRentalValue = g.Sum(x => x.AnnualRentalValue ?? 0m),
                TotalMaintenance = g.Sum(x => x.Maintenance ?? 0m),
                TotalRateableValue = g.Sum(x => x.RateableValue ?? 0m),
                TotalCarpetAreaSqFeet = g.Sum(x => (decimal)(x.CarpetAreaSqFeet ?? 0)),
                TotalCarpetAreaSqMeter = g.Sum(x => (decimal)(x.CarpetAreaSqMeter ?? 0)),
                TotalBuiltupAreaSqFeet = g.Sum(x => (decimal)(x.BuiltupAreaSqFeet ?? 0)),
                TotalBuiltupAreaSqMeter = g.Sum(x => (decimal)(x.BuiltupAreaSqMeter ?? 0))
            });

        // Sort details by the requested propertyIds order, then by floor/subfloor
        var propertyOrderMap = propertyIds.Select((id, index) => new { id, index }).ToDictionary(x => x.id, x => x.index);
        var orderedDetails = details
            .OrderBy(d => propertyOrderMap.ContainsKey(d.PropertyId) ? propertyOrderMap[d.PropertyId] : int.MaxValue)
            .ThenBy(d => d.FloorId)
            .ThenBy(d => d.SubFloorId)
            .ToList();

        return orderedDetails.Select(pd =>
        {
            propertyTotals.TryGetValue(pd.PropertyId, out var totals);
            return (object)new Dictionary<string, object?>
            {
                ["propertyId"] = pd.PropertyId,
                ["PropertyId"] = pd.PropertyId,
                ["floorId"] = pd.FloorId,
                ["subFloorId"] = pd.SubFloorId,
                ["floorDescription"] = pd.FloorDescription,
                ["floorCode"] = pd.FloorCode,
                ["constructionYear"] = pd.ConstructionYear,
                ["constructionCode"] = pd.ConstructionCode,
                ["constructionDescription"] = pd.ConstructionDescription,
                ["typeOfUseCode"] = pd.TypeOfUseCode,
                ["typeOfUseDescription"] = pd.TypeOfUseDescription,
                ["typeOfUseType"] = pd.TypeOfUseType,
                ["assessmentYear"] = pd.AssessmentYear,
                ["carpetAreaSqFeet"] = pd.CarpetAreaSqFeet,
                ["carpetAreaSqMeter"] = pd.CarpetAreaSqMeter,
                ["builtupAreaSqFeet"] = pd.BuiltupAreaSqFeet,
                ["builtupAreaSqMeter"] = pd.BuiltupAreaSqMeter,
                ["noOfRooms"] = pd.NoOfRooms,
                ["roomDimensions"] = string.Join(" / ", pd.Rooms
                    .Where(r => r.LengthMtr.HasValue && r.WidthMtr.HasValue)
                    .Select(r => $"{r.LengthMtr!.Value.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture)} x {r.WidthMtr!.Value.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture)}")),
                ["roomType"] = string.Join(" / ", pd.Rooms.Select(r => r.RoomType)
                    .Where(name => !string.IsNullOrWhiteSpace(name)).Distinct()),
                ["rooms"] = pd.Rooms.OrderBy(r => r.Id).Select(r => new
                {
                    roomId = r.Id, roomNo = r.RoomNo, lengthMtr = r.LengthMtr, widthMtr = r.WidthMtr,
                    areaSqMtr = r.AreaSqMtr, totalAreaSqMtr = r.TotalAreaSqMtr,
                    noOfRooms = r.NoOfRooms, roomType = r.RoomType
                }).ToList(),
                ["monthlyRate"] = pd.MonthlyRate,
                ["yearlyRate"] = pd.YearlyRate,
                ["yearlyRent"] = pd.YearlyRent,
                ["depreciation"] = pd.Depreciation,
                ["depreciationPer"] = pd.DepreciationPer,
                ["annualRentalValue"] = pd.AnnualRentalValue,
                ["AnnualRentalValue"] = pd.AnnualRentalValue,
                ["maintenance"] = pd.Maintenance,
                ["Maintenance"] = pd.Maintenance,
                ["rateableValue"] = pd.RateableValue,
                ["RateableValue"] = pd.RateableValue,
                ["totalAnnualRentalValue"] = totals?.TotalAnnualRentalValue ?? 0m,
                ["TotalAnnualRentalValue"] = totals?.TotalAnnualRentalValue ?? 0m,
                ["totalMaintenance"] = totals?.TotalMaintenance ?? 0m,
                ["TotalMaintenance"] = totals?.TotalMaintenance ?? 0m,
                ["totalRateableValue"] = totals?.TotalRateableValue ?? 0m,
                ["TotalRateableValue"] = totals?.TotalRateableValue ?? 0m,
                ["totalCarpetAreaSqFeet"] = totals?.TotalCarpetAreaSqFeet ?? 0m,
                ["TotalCarpetAreaSqFeet"] = totals?.TotalCarpetAreaSqFeet ?? 0m,
                ["totalCarpetAreaSqMeter"] = totals?.TotalCarpetAreaSqMeter ?? 0m,
                ["TotalCarpetAreaSqMeter"] = totals?.TotalCarpetAreaSqMeter ?? 0m,
                ["totalBuiltupAreaSqFeet"] = totals?.TotalBuiltupAreaSqFeet ?? 0m,
                ["TotalBuiltupAreaSqFeet"] = totals?.TotalBuiltupAreaSqFeet ?? 0m,
                ["totalBuiltupAreaSqMeter"] = totals?.TotalBuiltupAreaSqMeter ?? 0m,
                ["TotalBuiltupAreaSqMeter"] = totals?.TotalBuiltupAreaSqMeter ?? 0m,
            };
        }).ToList();
    }

    private async Task<List<object>> BuildTaxDetailsRowsAsync(List<int> propertyIds, int activeYearId, CancellationToken ct)
    {
        if (propertyIds == null || propertyIds.Count == 0)
            return new List<object>();

        var taxRowsRaw = await (
            from tm in _transmastRepository.GetQueryable()
                .Where(t => propertyIds.Contains(t.PropertyId) && (activeYearId == 0 || t.FinanceYearId == activeYearId))
            join tam in _taxMastRepository.GetQueryable() on tm.TaxId equals tam.Id
            where tam.IsActive
            select new KarakarniTaxRow(
                tm.PropertyId,
                tm.Id,
                tam.TaxCode,
                tam.TaxName,
                tm.CalculationType,
                tm.CalculationValue,
                tm.CalculationAnnualValue,
                tm.TaxAmount,
                tm.IsActive,
                tm.MarkedForDeletion
            )
        ).ToListAsync(ct);

        if (!taxRowsRaw.Any())
            return new List<object>();

        // Group by PropertyId and pivot each property's tax lines into a separate row
        var result = new List<object>();
        var taxRowsByProperty = taxRowsRaw.GroupBy(t => t.PropertyId);

        foreach (var propertyTaxGroup in taxRowsByProperty)
        {
            var propertyRows = propertyTaxGroup.ToList();
            var activeNonZero = propertyRows
                .Where(r => r.IsActive && !r.MarkedForDeletion && r.TaxAmount > 0)
                .ToList();

            var selectedRows = activeNonZero.Count > 0
                ? propertyRows.Where(r => r.IsActive && !r.MarkedForDeletion).ToList()
                : propertyRows;

            // Pivot all tax lines into a single row with dynamic column names.
            var row = new Dictionary<string, object?>
            {
                ["propertyId"] = propertyTaxGroup.Key
            };

            // Pre-populate all active taxes with default 0m/RV values
            foreach (var code in ActiveTaxCodes)
            {
                row[$"Transmast_{code}"] = 0m;
                row[$"RVorCV_{code}"] = "RV";
                row[$"RVorCVValue_{code}"] = 0m;
            }

            var componentTaxes = selectedRows.Where(t => t.TaxCode != "TaxTotal");
            foreach (var tax in componentTaxes)
            {
                var safeCode = GetSafeTaxCode((string?)tax.TaxCode, (string?)tax.TaxName);
                if (ActiveTaxCodes.Contains(safeCode))
                {
                    row[$"Transmast_{safeCode}"] = (row.TryGetValue($"Transmast_{safeCode}", out var prev) && prev is decimal p ? p : 0m) + (decimal)tax.TaxAmount;
                    row[$"RVorCV_{safeCode}"] = tax.RVorCV;
                    row[$"RVorCVValue_{safeCode}"] = tax.RVorCVValue;
                }
            }

            var propTax = row.TryGetValue("Transmast_GEN", out var genTaxVal) && genTaxVal is decimal genDec ? genDec : 0m;
            row["propertyTax"] = propTax;
            row["PropertyTax"] = propTax;

            result.Add(row);
        }

        return result;
    }

    private async Task<List<object>> BuildFloorDetailsRowsAsync(List<int> propertyIds, CancellationToken ct)
    {
        if (propertyIds == null || propertyIds.Count == 0)
            return new List<object>();

        var rows = await (
            from pd in _propertyDetailsRepository.GetQueryable()
                                                  .Where(p => propertyIds.Contains(p.PropertyId) && p.IsActive && !p.MarkedForDeletion)
            join fm in _floorRepository.GetQueryable()
                     on pd.FloorId equals fm.Id into fmj
            from fm in fmj.DefaultIfEmpty()
            join ctm in _constructionTypeRepository.GetQueryable()
                     on pd.ConstructionTypeId equals ctm.Id into ctmj
            from ctm in ctmj.DefaultIfEmpty()
            join tum in _typeOfUseRepository.GetQueryable()
                     on pd.TypeOfUseId equals tum.Id into tumj
            from tum in tumj.DefaultIfEmpty()
            select new
            {
                pd.PropertyId,
                FloorDescription = fm != null ? fm.Description : null,
                pd.ConstructionYear,
                ConstructionCode = ctm != null ? ctm.ConstructionCode : null,
                ConstructionDescription = ctm != null ? ctm.Description : null,
                TypeOfUseCode = tum != null ? tum.TypeOfUseCode : null,
                TypeOfUseDescription = tum != null ? tum.Description : null,
                TypeOfUseType = tum != null ? tum.Type : null,
                pd.CarpetAreaSqMeter,
                pd.CarpetAreaSqFeet,
                pd.BuiltupAreaSqMeter,
                pd.BuiltupAreaSqFeet,
                pd.NoOfRooms,
            }
        ).ToListAsync(ct);

        return rows.Select(r => (object)new Dictionary<string, object?>
        {
            ["propertyId"] = r.PropertyId,
            ["floorDescription"] = r.FloorDescription,
            ["constructionYear"] = r.ConstructionYear,
            ["constructionCode"] = r.ConstructionCode,
            ["constructionDescription"] = r.ConstructionDescription,
            ["typeOfUseCode"] = r.TypeOfUseCode,
            ["typeOfUseDescription"] = r.TypeOfUseDescription,
            ["typeOfUseType"] = r.TypeOfUseType,
            ["carpetAreaSqMeter"] = r.CarpetAreaSqMeter,
            ["carpetAreaSqFeet"] = r.CarpetAreaSqFeet,
            ["builtupAreaSqMeter"] = r.BuiltupAreaSqMeter,
            ["builtupAreaSqFeet"] = r.BuiltupAreaSqFeet,
            ["noOfRooms"] = r.NoOfRooms,
        }).ToList();
    }

    private static string GetSafeTaxCode(string? taxCode, string? taxName)
    {
        var rawCode = !string.IsNullOrWhiteSpace(taxCode) ? taxCode : taxName ?? "UNKNOWN";
        return rawCode.Replace("SP_E DU", "SP_EDU").Replace(' ', '_');
    }

    private static List<int> ParseIdList(string? value) => (value ?? string.Empty)
        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .Select(token => int.TryParse(token, out var id) ? id : 0)
        .Where(id => id > 0)
        .Distinct()
        .ToList();


    private sealed record KarakarniTaxRow(
        int PropertyId,
        int Id,
        string? TaxCode,
        string? TaxName,
        string? RVorCV,
        decimal RVorCVValue,
        decimal? CalculationAnnualValue,
        decimal TaxAmount,
        bool IsActive,
        bool MarkedForDeletion);

    private sealed record ActiveYearSnapshot(int Id, string? YearCode);

    private sealed record UlbSnapshot(
        string UlbCode,
        string UlbName,
        string? UlbNameLocal,
        string? UlbLogo,
        string? EmailId,
        string? MobileNo,
        string? AlternateMobileNo,
        string? WebsiteUrl,
        string? UlbAddress,
        string? State,
        string? District,
        string? PinCode);

    private sealed record CachedPageSelection(
        Dictionary<string, string> Parameters,
        Guid ReportRequestId,
        int Skip,
        int Take,
        ActiveYearSnapshot? ActiveYear,
        List<int> PropertyIds,
        bool HasMore,
        int TotalCount);
}
