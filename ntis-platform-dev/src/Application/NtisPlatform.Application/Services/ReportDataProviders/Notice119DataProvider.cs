using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Report;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.DTOs.HtmlReport;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.ReportDataProviders;

/// <summary>
/// Data source for the property re-assessment notice issued under section 119.
/// One row contains the shared data for both the receipt and the main notice.
/// </summary>
public sealed class Notice119DataProvider : IPagedReportDataProvider, IReportSchemaProvider
{
    public const string MainSection = "main";

    private static readonly Dictionary<string, string> TaxCodeToFieldName = new(StringComparer.OrdinalIgnoreCase)
    {
        ["GEN"] = "GEN_TAX",
        ["GENERAL"] = "GEN_TAX",
        ["PROPERTYTAX"] = "GEN_TAX",
        ["TREE"] = "TREE_TAX",
        ["TREECESS"] = "TREE_TAX",
        ["FIRE"] = "FIRE_TAX",
        ["FIRECESS"] = "FIRE_TAX",
        ["ROAD"] = "ROAD_TAX",
        ["ROADCESS"] = "ROAD_TAX",
        ["WATERBEN"] = "WATER_BEN_TAX",
        ["WATERBENEFIT"] = "WATER_BEN_TAX",
        ["WATER_BEN"] = "WATER_BEN_TAX",
        ["SPWATER"] = "SP_WATER_TAX",
        ["SPWATERCESS"] = "SP_WATER_TAX",
        ["SPECIALWATER"] = "SP_WATER_TAX",
        ["SPECIALWATERCESS"] = "SP_WATER_TAX",
        ["SP_WATER"] = "SP_WATER_TAX",
        ["SEWAGE"] = "SEWAGE_TAX",
        ["SWACCHATA"] = "SEWAGE_TAX",
        ["DRAINAGE"] = "SEWAGE_TAX",
        ["CLEANING"] = "SEWAGE_TAX",
        ["SANITATION"] = "SEWAGE_TAX",
        ["LIGHT"] = "LIGHT_TAX",
        ["LIGHTCESS"] = "LIGHT_TAX",
        ["STATEEDU"] = "STATE_EDU_TAX",
        ["STATE_EDU"] = "STATE_EDU_TAX",
        ["MAHAEDU"] = "STATE_EDU_TAX",
        ["MAHARASHTRAEDU"] = "STATE_EDU_TAX",
        ["STATEEMP"] = "STATE_EMP_TAX",
        ["STATE_EMP"] = "STATE_EMP_TAX",
        ["EMPLOYMENTTAX"] = "STATE_EMP_TAX",
        ["SPEDU"] = "SP_EDU_TAX",
        ["SP_EDU"] = "SP_EDU_TAX",
        ["SP_E DU"] = "SP_EDU_TAX",
        ["SPECIALEDU"] = "SP_EDU_TAX",
        ["SPECIALEDUCATION"] = "SP_EDU_TAX",
        ["SPECIALEDUCATIONTAX"] = "SP_EDU_TAX",
        ["BIGBUILDING"] = "BIG_BUILDING_TAX",
        ["BIG_BUILDING"] = "BIG_BUILDING_TAX",
        ["LARGEBUILDING"] = "BIG_BUILDING_TAX",
        ["OPENPLOT"] = "OPEN_PLOT_TAX",
        ["OPEN_PLOT"] = "OPEN_PLOT_TAX",
        ["VACANTLAND"] = "OPEN_PLOT_TAX",
        ["PENALTY"] = "PENALTY_TAX",
        ["SHASTI"] = "PENALTY_TAX",
        ["TAXTOTAL"] = "TaxTotal",
        ["TOTALTAX"] = "TaxTotal"
    };

    private readonly IReportDataRepository<PropertyEntity> _propertyRepository;
    private readonly IReportDataRepository<WardEntity> _wardRepository;
    private readonly IReportDataRepository<ZoneEntity> _zoneRepository;
    private readonly IReportDataRepository<PropertyMastOldEntity> _oldPropertyRepository;
    private readonly IReportDataRepository<PropertyMapDetailEntity> _propertyMapRepository;
    private readonly IReportDataRepository<PropertyTypeMasterEntity> _propertyTypeRepository;
    private readonly IReportDataRepository<ULBMasterEntity> _ulbRepository;
    private readonly IReportDataRepository<YearMasterEntity> _yearRepository;
    private readonly IReportDataRepository<TransMastEntity> _transactionRepository;
    private readonly IReportDataRepository<TaxMasterEntity> _taxRepository;
    private readonly IReportDataRepository<RVCalculationResultsEntity> _rvRepository;
    private readonly IReportDataRepository<PropertyPhotoEntity> _photoRepository;
    private readonly IDocumentApplicationService _documentService;
    private readonly IUlbConfigService _ulbConfigService;
    private readonly IHttpClientFactory? _httpClientFactory;

    public Notice119DataProvider(
        IReportDataRepository<PropertyEntity> propertyRepository,
        IReportDataRepository<WardEntity> wardRepository,
        IReportDataRepository<ZoneEntity> zoneRepository,
        IReportDataRepository<PropertyMastOldEntity> oldPropertyRepository,
        IReportDataRepository<PropertyMapDetailEntity> propertyMapRepository,
        IReportDataRepository<PropertyTypeMasterEntity> propertyTypeRepository,
        IReportDataRepository<ULBMasterEntity> ulbRepository,
        IReportDataRepository<YearMasterEntity> yearRepository,
        IReportDataRepository<TransMastEntity> transactionRepository,
        IReportDataRepository<TaxMasterEntity> taxRepository,
        IReportDataRepository<RVCalculationResultsEntity> rvRepository,
        IReportDataRepository<PropertyPhotoEntity> photoRepository,
        IDocumentApplicationService documentService,
        IUlbConfigService ulbConfigService,
        IHttpClientFactory? httpClientFactory = null)
    {
        _propertyRepository = propertyRepository;
        _wardRepository = wardRepository;
        _zoneRepository = zoneRepository;
        _oldPropertyRepository = oldPropertyRepository;
        _propertyMapRepository = propertyMapRepository;
        _propertyTypeRepository = propertyTypeRepository;
        _ulbRepository = ulbRepository;
        _yearRepository = yearRepository;
        _transactionRepository = transactionRepository;
        _taxRepository = taxRepository;
        _rvRepository = rvRepository;
        _photoRepository = photoRepository;
        _documentService = documentService;
        _ulbConfigService = ulbConfigService;
        _httpClientFactory = httpClientFactory;
    }

    public string ProviderCode => "Notice119DataProvider";

    public IReadOnlyList<ReportSectionDescriptor> GetSections() =>
    [
        new(MainSection, true)
    ];

    public IReadOnlyList<HtmlReportDataSourceFieldDto> GetSchemaFields() =>
    [
        new("CouncilName", "नगरपरिषद नाव", "field", "नोटीस हेडर"),
        new("CouncilAddress", "नगरपरिषद पत्ता", "field", "नोटीस हेडर"),
        new("CouncilLogo", "नगरपरिषद लोगो", "image", "नोटीस हेडर"),
        new("CouncilDistrict", "जिल्हा", "field", "नोटीस हेडर"),
        new("ActTitle", "अधिनियम व कलम", "field", "नोटीस हेडर"),
        new("NoticePeriod", "कर पुनर्मूल्यांकन कालावधी", "field", "नोटीस हेडर"),
        new("NoticeTitle", "मुख्य नोटीस शीर्षक", "field", "नोटीस हेडर"),
        new("ReceiptTitle", "पोचपावती शीर्षक", "field", "नोटीस हेडर"),
        new("NoticeDate", "नोटीस दिनांक", "field", "नोटीस हेडर"),
        new("NoticeDateLocal", "नोटीस दिनांक (मराठी अंक)", "field", "नोटीस हेडर"),
        new("ObjectionLastDate", "हरकतीची अंतिम तारीख", "field", "नोटीस हेडर"),
        new("ObjectionLastDateLocal", "हरकतीची अंतिम तारीख (मराठी अंक)", "field", "नोटीस हेडर"),
        new("financeYear", "आर्थिक वर्ष", "field", "नोटीस हेडर"),
        new("financeYearLocal", "आर्थिक वर्ष (मराठी अंक)", "field", "नोटीस हेडर"),

        new("propertyId", "Property ID", "field", "मालमत्ता तपशील", "number"),
        new("propertyNo", "नवीन मालमत्ता क्र.", "field", "मालमत्ता तपशील"),
        new("propertyNoLocal", "नवीन मालमत्ता क्र. (मराठी अंक)", "field", "मालमत्ता तपशील"),
        new("partitionNo", "भाग क्र.", "field", "मालमत्ता तपशील"),
        new("partitionNoLocal", "भाग क्र. (मराठी अंक)", "field", "मालमत्ता तपशील"),
        new("wardNo", "वॉर्ड क्र.", "field", "मालमत्ता तपशील"),
        new("wardNoLocal", "वॉर्ड क्र. (मराठी अंक)", "field", "मालमत्ता तपशील"),
        new("zoneNo", "झोन क्र.", "field", "मालमत्ता तपशील"),
        new("zoneNoLocal", "झोन क्र. (मराठी अंक)", "field", "मालमत्ता तपशील"),
        new("oldWardNo", "जुना वॉर्ड क्र.", "field", "मालमत्ता तपशील"),
        new("oldWardNoLocal", "जुना वॉर्ड क्र. (मराठी अंक)", "field", "मालमत्ता तपशील"),
        new("oldPropertyNo", "जुना मालमत्ता क्र.", "field", "मालमत्ता तपशील"),
        new("oldPropertyNoLocal", "जुना मालमत्ता क्र. (मराठी अंक)", "field", "मालमत्ता तपशील"),
        new("oldPartitionNo", "जुना भाग क्र.", "field", "मालमत्ता तपशील"),
        new("computerNo", "संगणक / CSN क्र.", "field", "मालमत्ता तपशील"),
        new("computerNoLocal", "संगणक / CSN क्र. (मराठी अंक)", "field", "मालमत्ता तपशील"),

        new("ownerTitle", "मालक पदवी", "field", "मालक व भोगवटादार"),
        new("ownerName", "मालकाचे नाव", "field", "मालक व भोगवटादार"),
        new("ownerFullName", "प्राथमिक करधारकाचे पूर्ण नाव", "field", "मालक व भोगवटादार"),
        new("occupierTitle", "भोगवटादार पदवी", "field", "मालक व भोगवटादार"),
        new("occupierName", "भोगवटादाराचे नाव", "field", "मालक व भोगवटादार"),
        new("occupierFullName", "भोगवटादाराचे पूर्ण नाव", "field", "मालक व भोगवटादार"),
        new("flatOrShopNo", "सदनिका / दुकान क्र.", "field", "मालक व भोगवटादार"),
        new("flatOrShopName", "दुकान / घराचे नाव", "field", "मालक व भोगवटादार"),
        new("address", "मालमत्तेचा पत्ता", "field", "मालक व भोगवटादार"),
        new("mobileNo", "मोबाईल नं.", "field", "मालक व भोगवटादार"),
        new("mobileNoLocal", "मोबाईल नं. (मराठी अंक)", "field", "मालक व भोगवटादार"),
        new("propertyDescription", "मालमत्तेचे वर्गीकरण", "field", "मालक व भोगवटादार"),
        new("propertyPhoto", "मालमत्ता फोटो", "image", "मालक व भोगवटादार"),

        new("OldRV", "जुने करयोग्य मूल्य रु.", "field", "करमूल्यांकन तुलना", "number"),
        new("OldRVLocal", "जुने करयोग्य मूल्य (मराठी अंक)", "field", "करमूल्यांकन तुलना"),
        new("OldTotalTax", "जुना एकूण कर रु.", "field", "करमूल्यांकन तुलना", "number"),
        new("OldTotalTaxLocal", "जुना एकूण कर (मराठी अंक)", "field", "करमूल्यांकन तुलना"),
        new("RateableValue", "नवीन करयोग्य मूल्य रु.", "field", "करमूल्यांकन तुलना", "number"),
        new("RateableValueLocal", "नवीन करयोग्य मूल्य (मराठी अंक)", "field", "करमूल्यांकन तुलना"),
        new("TotalTax", "नवीन एकूण कर रु.", "field", "करमूल्यांकन तुलना", "number"),
        new("TotalTaxLocal", "नवीन एकूण कर (मराठी अंक)", "field", "करमूल्यांकन तुलना"),
        new("TaxTotal", "एकूण कर रु.", "field", "करमूल्यांकन तुलना", "number"),
        new("TaxTotalLocal", "एकूण कर (मराठी अंक)", "field", "करमूल्यांकन तुलना"),

        new("GEN_TAX", "संकलित कर रु.", "field", "प्रस्तावित कर विवरण", "number"),
        new("GEN_TAX_Local", "संकलित कर (मराठी अंक)", "field", "प्रस्तावित कर विवरण"),
        new("TREE_TAX", "वृक्ष कर रु.", "field", "प्रस्तावित कर विवरण", "number"),
        new("TREE_TAX_Local", "वृक्ष कर (मराठी अंक)", "field", "प्रस्तावित कर विवरण"),
        new("SP_EDU_TAX", "विशेष शिक्षण कर रु.", "field", "प्रस्तावित कर विवरण", "number"),
        new("SP_EDU_TAX_Local", "विशेष शिक्षण कर (मराठी अंक)", "field", "प्रस्तावित कर विवरण"),
        new("FIRE_TAX", "अग्निशमन कर रु.", "field", "प्रस्तावित कर विवरण", "number"),
        new("FIRE_TAX_Local", "अग्निशमन कर (मराठी अंक)", "field", "प्रस्तावित कर विवरण"),
        new("SEWAGE_TAX", "विशेष स्वच्छता कर रु.", "field", "प्रस्तावित कर विवरण", "number"),
        new("SEWAGE_TAX_Local", "विशेष स्वच्छता कर (मराठी अंक)", "field", "प्रस्तावित कर विवरण"),
        new("LIGHT_TAX", "दिवाबत्ती कर रु.", "field", "प्रस्तावित कर विवरण", "number"),
        new("LIGHT_TAX_Local", "दिवाबत्ती कर (मराठी अंक)", "field", "प्रस्तावित कर विवरण"),
        new("STATE_EDU_TAX", "महाराष्ट्र शिक्षण कर रु.", "field", "प्रस्तावित कर विवरण", "number"),
        new("STATE_EDU_TAX_Local", "महाराष्ट्र शिक्षण कर (मराठी अंक)", "field", "प्रस्तावित कर विवरण"),
        new("STATE_EMP_TAX", "रोजगार हमी उपकर रु.", "field", "प्रस्तावित कर विवरण", "number"),
        new("STATE_EMP_TAX_Local", "रोजगार हमी उपकर (मराठी अंक)", "field", "प्रस्तावित कर विवरण"),
        new("ROAD_TAX", "रस्ता कर रु.", "field", "प्रस्तावित कर विवरण", "number"),
        new("ROAD_TAX_Local", "रस्ता कर (मराठी अंक)", "field", "प्रस्तावित कर विवरण"),
        new("WATER_BEN_TAX", "पाणी लाभ कर रु.", "field", "प्रस्तावित कर विवरण", "number"),
        new("WATER_BEN_TAX_Local", "पाणी लाभ कर (मराठी अंक)", "field", "प्रस्तावित कर विवरण"),
        new("SP_WATER_TAX", "विशेष पाणी कर रु.", "field", "प्रस्तावित कर विवरण", "number"),
        new("SP_WATER_TAX_Local", "विशेष पाणी कर (मराठी अंक)", "field", "प्रस्तावित कर विवरण"),
        new("BIG_BUILDING_TAX", "मोठ्या इमारतींवरील कर रु.", "field", "प्रस्तावित कर विवरण", "number"),
        new("BIG_BUILDING_TAX_Local", "मोठ्या इमारतींवरील कर (मराठी अंक)", "field", "प्रस्तावित कर विवरण"),
        new("OPEN_PLOT_TAX", "खुली जागा कर रु.", "field", "प्रस्तावित कर विवरण", "number"),
        new("OPEN_PLOT_TAX_Local", "खुली जागा कर (मराठी अंक)", "field", "प्रस्तावित कर विवरण"),
        new("PENALTY_TAX", "शास्ती / दंड रु.", "field", "प्रस्तावित कर विवरण", "number"),
        new("PENALTY_TAX_Local", "शास्ती / दंड (मराठी अंक)", "field", "प्रस्तावित कर विवरण"),

        new("NewWardNo", "नवीन वॉर्ड क्र.", "field", "Notice 119 legacy bindings"),
        new("NewPropertyNo", "नवीन मालमत्ता क्र.", "field", "Notice 119 legacy bindings"),
        new("NewPartitionNo", "नवीन भाग क्र.", "field", "Notice 119 legacy bindings"),
        new("OldNo", "जुनी मालमत्ता क्र.", "field", "Notice 119 legacy bindings"),
        new("OldCityServeyNo", "जुना सिटी सर्वे / संगणक क्र.", "field", "Notice 119 legacy bindings"),
        new("MarathiOwnerName", "मालकाचे नाव (मराठी)", "field", "Notice 119 legacy bindings"),
        new("OccupierNameMarathi", "भोगवटादाराचे नाव (मराठी)", "field", "Notice 119 legacy bindings"),
        new("MarathiOwnerAddress", "मालमत्तेचा पत्ता (मराठी)", "field", "Notice 119 legacy bindings"),
        new("RV", "नवीन करयोग्य मूल्य रु.", "field", "Notice 119 legacy bindings", "number"),
        new("PropertyTax", "संकलित कर रु.", "field", "Notice 119 legacy bindings", "number"),
        new("TreeCess", "वृक्ष कर रु.", "field", "Notice 119 legacy bindings", "number"),
        new("SpEducationTax", "विशेष शिक्षण कर रु.", "field", "Notice 119 legacy bindings", "number"),
        new("FireCess", "अग्निशमन कर रु.", "field", "Notice 119 legacy bindings", "number"),
        new("Sanitation", "विशेष स्वच्छता कर रु.", "field", "Notice 119 legacy bindings", "number"),
        new("LightCess", "दिवाबत्ती कर रु.", "field", "Notice 119 legacy bindings", "number"),
        new("EducationTax", "महाराष्ट्र शिक्षण कर रु.", "field", "Notice 119 legacy bindings", "number"),
        new("EmploymentTax", "रोजगार हमी उपकर रु.", "field", "Notice 119 legacy bindings", "number"),
        new("RoadCess", "रस्ता कर रु.", "field", "Notice 119 legacy bindings", "number"),
        new("WaterBenefit", "पाणी लाभ कर रु.", "field", "Notice 119 legacy bindings", "number"),
        new("SpWaterCess", "विशेष पाणी कर रु.", "field", "Notice 119 legacy bindings", "number"),
        new("BigBuildingTax", "मोठ्या इमारतींवरील कर रु.", "field", "Notice 119 legacy bindings", "number"),
        new("OpenPlotTax", "खुली जागा कर रु.", "field", "Notice 119 legacy bindings", "number"),
        new("PenaltyTax", "शास्ती / दंड रु.", "field", "Notice 119 legacy bindings", "number"),

        new("WardInspectorTitle", "वॉर्ड निरीक्षक पद", "field", "स्वाक्षरी"),
        new("TaxDepartmentHeadTitle", "कर विभाग प्रमुख पद", "field", "स्वाक्षरी"),
        new("ChiefOfficerTitle", "मुख्याधिकारी पद", "field", "स्वाक्षरी"),
        new("AuthorityCouncil", "स्वाक्षरीखालील नगरपरिषद नाव", "field", "स्वाक्षरी")
    ];

    public async Task<object> GetDataAsync(
        Dictionary<string, string> parameters,
        CancellationToken ct = default)
    {
        var (rows, _) = await BuildPageAsync(parameters, 0, int.MaxValue, ct);
        return rows;
    }

    public async Task<ReportDataPage> GetDataPageAsync(
        Guid reportRequestId,
        Dictionary<string, string> parameters,
        string section,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        if (!section.Equals(MainSection, StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException($"Unknown Notice 119 report section '{section}'.", nameof(section));

        page = Math.Max(page, 1);
        pageSize = Math.Max(pageSize, 1);
        var (rows, hasMore) = await BuildPageAsync(parameters, (page - 1) * pageSize, pageSize, ct);
        return new ReportDataPage
        {
            Section = MainSection,
            Page = page,
            PageSize = pageSize,
            TotalCount = -1,
            HasMore = hasMore,
            Rows = rows
        };
    }

    private async Task<(List<object> Rows, bool HasMore)> BuildPageAsync(
        Dictionary<string, string> parameters,
        int skip,
        int take,
        CancellationToken ct)
    {
        var cleanParams = new Dictionary<string, string>(parameters, StringComparer.OrdinalIgnoreCase);
        var zoneId = ParseInt(cleanParams, "zoneId");
        var wardIds = ParseIds(GetParameter(cleanParams, "wardId"));
        var propertyTypeId = ParseInt(cleanParams, "propertyTypeId");
        var assessmentStatus = ParseInt(cleanParams, "assessmentStatus");
        var propertyNo = GetParameter(cleanParams, "propertyNo")?.Trim();
        var partitionNo = GetParameter(cleanParams, "partitionNo")?.Trim();
        var fromPropertyNo = GetParameter(cleanParams, "fromPropertyNo")?.Trim();
        var toPropertyNo = GetParameter(cleanParams, "toPropertyNo")?.Trim();
        var propertyType = GetParameter(cleanParams, "Type")?.Trim();
        var propertyDescription = GetParameter(cleanParams, "PropertyDescription")?.Trim();
        var financeYear = ParseFinanceYear(cleanParams);

        var propertyIds = ParseIds(GetParameter(cleanParams, "propertyId"));
        propertyIds.UnionWith(ParseIds(GetParameter(cleanParams, "ownerId")));

        var activeYear = await _yearRepository.GetQueryable()
            .Where(year => financeYear == 0
                ? year.IsActive
                : (year.Year == financeYear || year.Id == financeYear))
            .OrderByDescending(year => year.IsActive)
            .ThenByDescending(year => year.Year)
            .Select(year => new { year.Id, year.Year, year.YearCode })
            .FirstOrDefaultAsync(ct);

        if (activeYear == null)
        {
            activeYear = await _yearRepository.GetQueryable()
                .OrderByDescending(year => year.IsActive)
                .ThenByDescending(year => year.Year)
                .Select(year => new { year.Id, year.Year, year.YearCode })
                .FirstOrDefaultAsync(ct);
        }

        // Council-specific values intentionally come only from CORE.ULBMaster. In particular,
        // there is no hard-coded Shrirampur name fallback in this provider.
        var ulb = await _ulbRepository.GetQueryable()
            .Where(item => item.IsActive)
            .OrderBy(item => item.Id)
            .Select(item => new
            {
                item.UlbCode,
                item.UlbName,
                item.UlbNameLocal,
                item.UlbLogo,
                item.UlbAddress,
                item.EmailId,
                item.MobileNo,
                item.District,
                item.State,
                item.PinCode
            })
            .FirstOrDefaultAsync(ct);
        var councilName = FirstNonEmpty(ulb?.UlbNameLocal, ulb?.UlbName);
        var councilDistrict = ulb?.District ?? string.Empty;
        var councilLogo = await ResolveCouncilLogoAsync(ct);
        var councilHeader = !string.IsNullOrWhiteSpace(councilDistrict) && !councilName.Contains(councilDistrict, StringComparison.OrdinalIgnoreCase)
            ? (councilDistrict.StartsWith("जि", StringComparison.OrdinalIgnoreCase) ? $"{councilName} {councilDistrict}" : $"{councilName}, जि. {councilDistrict}")
            : councilName;

        var propertyQuery =
            from property in _propertyRepository.GetQueryable()
            join ward in _wardRepository.GetQueryable() on property.WardId equals ward.Id into wardJoin
            from ward in wardJoin.DefaultIfEmpty()
            join zone in _zoneRepository.GetQueryable() on ward.ZoneId equals zone.Id into zoneJoin
            from zone in zoneJoin.DefaultIfEmpty()
            join type in _propertyTypeRepository.GetQueryable()
                on property.PropertyTypeId equals type.Id into typeJoin
            from type in typeJoin.DefaultIfEmpty()
            where property.IsActive
                  && !property.MarkedForDeletion
                  && (propertyIds.Count == 0 || propertyIds.Contains(property.Id))
                  && (zoneId == 0 || (ward != null && ward.ZoneId == zoneId))
                  && (wardIds.Count == 0 || wardIds.Contains(property.WardId))
                  && (propertyNo == null || property.PropertyNo == propertyNo)
                  && (partitionNo == null || property.PartitionNo == partitionNo)
                  && (propertyTypeId == 0 || property.PropertyTypeId == propertyTypeId)
                  && (assessmentStatus == 0 || property.PropertyAssessmentStatusId == assessmentStatus)
                  && (propertyType == null || property.Type == propertyType)
                  && (propertyDescription == null
                      || (type != null && type.PropertyDescription == propertyDescription))
            select new
            {
                property.Id,
                property.PropertyNo,
                property.PartitionNo,
                property.WardId,
                WardNo = ward != null ? ward.WardNo : null,
                ZoneNo = zone != null ? zone.ZoneNo : null,
                property.UPICId,
                property.CSN,
                property.MobileNo,
                property.OwnerTitle,
                property.OwnerName,
                property.OccupierTitle,
                property.OccupierName,
                property.Address,
                property.FlatOrShopNo,
                property.FlatOrShopName,
                PropertyDescription = type != null ? type.PropertyDescription : null,
                property.PropertyMastOldId
            };

        if (financeYear != 0 && activeYear != null && propertyIds.Count == 0 && string.IsNullOrWhiteSpace(propertyNo))
        {
            var assessedPropertyIds = _transactionRepository.GetQueryable()
                .Where(transaction => transaction.FinanceYearId == activeYear.Id)
                .Select(transaction => transaction.PropertyId);
            propertyQuery = propertyQuery.Where(property => assessedPropertyIds.Contains(property.Id));
        }

        var properties = await propertyQuery
            .Distinct()
            .OrderBy(property => property.PropertyNo)
            .ThenBy(property => property.PartitionNo)
            .ToListAsync(ct);
        properties = ApplyPropertyNumberRange(
            properties, fromPropertyNo, toPropertyNo, property => property.PropertyNo);

        var takePlusOne = take == int.MaxValue ? int.MaxValue : take + 1;
        var pageProperties = properties.Skip(skip).Take(takePlusOne).ToList();
        var hasMore = take != int.MaxValue && pageProperties.Count > take;
        if (hasMore) pageProperties = pageProperties.Take(take).ToList();
        if (pageProperties.Count == 0) return ([], false);

        var pagePropertyIds = pageProperties.Select(property => property.Id).ToList();
        var mappings = await _propertyMapRepository.GetQueryable()
            .Where(map => map.PropertyIdNew.HasValue
                          && pagePropertyIds.Contains(map.PropertyIdNew.Value)
                          && map.PropertyIdOld.HasValue
                          && map.IsActive
                          && map.IsCurrent
                          && map.Status != "CANCELLED")
            .OrderByDescending(map => map.Id)
            .Select(map => new { NewId = map.PropertyIdNew!.Value, OldId = map.PropertyIdOld!.Value })
            .ToListAsync(ct);
        var mappedOldIds = mappings
            .GroupBy(map => map.NewId)
            .ToDictionary(group => group.Key, group => group.First().OldId);

        var requiredOldIds = pageProperties
            .Select(property => mappedOldIds.TryGetValue(property.Id, out var oldId)
                ? (int?)oldId
                : property.PropertyMastOldId)
            .Where(id => id.HasValue && id.Value > 0)
            .Select(id => id!.Value)
            .Distinct()
            .ToList();
        var oldProperties = await _oldPropertyRepository.GetQueryable()
            .Where(property => requiredOldIds.Contains(property.Id)
                               && property.IsActive
                               && !property.MarkedForDeletion)
            .Select(property => new
            {
                property.Id,
                property.OldWardNo,
                property.OldPropertyNo,
                property.OldPartitionNo,
                property.OldCSN,
                property.OldRV,
                property.OldTotalTax
            })
            .ToDictionaryAsync(property => property.Id, ct);

        var rvQuery = _rvRepository.GetQueryable()
            .Where(result => pagePropertyIds.Contains(result.PropertyId));

        var rvRaw = await rvQuery
            .Select(r => new { r.PropertyId, RateableValue = r.RateableValue ?? 0m, r.IsActive, r.MarkedForDeletion, r.Id })
            .ToListAsync(ct);

        var rvByProperty = rvRaw
            .GroupBy(r => r.PropertyId)
            .ToDictionary(
                g => g.Key,
                g =>
                {
                    var activeNonZero = g.Where(x => x.IsActive && !x.MarkedForDeletion && x.RateableValue > 0).ToList();
                    if (activeNonZero.Count > 0)
                        return activeNonZero.Sum(x => x.RateableValue);

                    var allNonZero = g.Where(x => x.RateableValue > 0).ToList();
                    if (allNonZero.Count > 0)
                    {
                        var maxId = allNonZero.Max(x => x.Id);
                        return allNonZero.Where(x => x.Id == maxId).Select(x => x.RateableValue).FirstOrDefault();
                    }

                    return 0m;
                });

        // Reference: PrarupYadiDataProvider loads transactions by FinanceYearId and PropertyId
        // without restricting to IsActive/MarkedForDeletion so that assessed taxes are preserved.
        var transQuery = _transactionRepository.GetQueryable()
            .Where(t => pagePropertyIds.Contains(t.PropertyId));

        if (activeYear != null)
        {
            transQuery = transQuery.Where(t => t.FinanceYearId == activeYear.Id);
        }

        var taxData = await (
            from transaction in transQuery
            join tax in _taxRepository.GetQueryable() on transaction.TaxId equals tax.Id
            where tax.IsActive
            select new
            {
                transaction.PropertyId,
                transaction.CalculationType,
                tax.TaxCode,
                tax.TaxName,
                Amount = transaction.TaxAmount,
                transaction.IsActive,
                transaction.MarkedForDeletion
            })
            .ToListAsync(ct);

        var taxesByProperty = taxData
            .GroupBy(row => row.PropertyId)
            .ToDictionary(
                group => group.Key,
                group =>
                {
                    var propertyRows = group.ToList();

                    // If active rows exist and have non-zero tax, use them; otherwise use all rows (Prarup Yadi reference)
                    var activeNonZero = propertyRows
                        .Where(r => r.IsActive && !r.MarkedForDeletion && r.Amount > 0)
                        .ToList();

                    var selected = activeNonZero.Count > 0
                        ? propertyRows.Where(r => r.IsActive && !r.MarkedForDeletion).ToList()
                        : propertyRows;

                    return selected
                        .Select(row => new TaxRow(row.PropertyId, row.CalculationType, row.TaxCode, row.TaxName, row.Amount))
                        .ToList();
                });

        var rawPhotoBindings = await _photoRepository.GetQueryable()
            .Where(photo => photo.PropertyId.HasValue
                            && pagePropertyIds.Contains(photo.PropertyId.Value)
                            && photo.IsActive
                            && !photo.MarkedForDeletion
                            && photo.DocumentBindingId.HasValue)
            .OrderByDescending(photo => photo.IsLatest)
            .ThenBy(photo => photo.DisplayOrder)
            .ThenByDescending(photo => photo.Id)
            .Select(photo => new
            {
                PropertyId = photo.PropertyId!.Value,
                BindingId = photo.DocumentBindingId!.Value,
                PhotoTypeCode = photo.PhotoType != null ? photo.PhotoType.PhotoTypeCode : null
            })
            .ToListAsync(ct);

        var photoBindingByProperty = rawPhotoBindings
            .Where(x => x.PhotoTypeCode == null || !x.PhotoTypeCode.Contains("PLAN", StringComparison.OrdinalIgnoreCase))
            .GroupBy(photo => photo.PropertyId)
            .ToDictionary(group => group.Key, group => group.First().BindingId);
        var bindingIds = photoBindingByProperty.Values.Distinct().ToList();
        var embeddedImages = await EmbeddedReportImage.LoadBindingsAsync(bindingIds, _documentService, ct);

        var today = DateTime.Today;
        var noticeDate = ResolveDate(cleanParams, today, "noticeDate", "NoticeDate");
        var objectionDate = ResolveDate(cleanParams, today.AddDays(30),
            "objectionLastDate", "ObjectionLastDate", "lastDate");
        var year = activeYear?.Year ?? (financeYear > 0 ? financeYear : GetCurrentFinanceYear(today));
        var financeYearText = activeYear?.YearCode ?? FormatFinanceYear(year);
        var noticePeriod = GetParameter(cleanParams, "noticePeriod", "NoticePeriod")
            ?? BuildNoticePeriod(year);

        var rows = new List<object>(pageProperties.Count);
        foreach (var property in pageProperties)
        {
            var oldId = mappedOldIds.TryGetValue(property.Id, out var mappedOldId)
                ? mappedOldId
                : property.PropertyMastOldId;
            var oldProperty = oldId.HasValue && oldProperties.TryGetValue(oldId.Value, out var foundOld)
                ? foundOld
                : null;
            rvByProperty.TryGetValue(property.Id, out var rateableValue);
            taxesByProperty.TryGetValue(property.Id, out var propertyTaxes);
            var taxValues = CalculateTaxValues(propertyTaxes ?? []);

            var oldRateableValue = RoundMoney(oldProperty?.OldRV);
            var oldTotalTax = RoundMoney(oldProperty?.OldTotalTax);
            var newRateableValue = RoundMoney(rateableValue);
            var newTotalTax = RoundMoney(taxValues.Total);
            var ownerFullName = JoinName(property.OwnerTitle, property.OwnerName);
            var occupierFullName = JoinName(property.OccupierTitle, property.OccupierName);
            var computerNo = FirstNonEmpty(property.CSN, property.UPICId, oldProperty?.OldCSN);

            string? propertyPhoto = null;
            string? propertyPhotoDocumentGuid = null;
            var propertyPhotoStatus = "Not uploaded";
            if (photoBindingByProperty.TryGetValue(property.Id, out var bindingId))
            {
                var image = embeddedImages.TryGetValue(bindingId, out var loadedImage)
                    ? loadedImage : new EmbeddedReportImage(null, null, "Document binding is invalid");
                propertyPhoto = image.DataUrl;
                propertyPhotoDocumentGuid = image.DocumentGuid;
                propertyPhotoStatus = image.Status;
            }

            var row = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
            {
                ["CouncilName"] = councilName,
                ["CouncilHeader"] = councilHeader,
                ["CouncilNameWithDistrict"] = councilHeader,
                ["CouncilAddress"] = ulb?.UlbAddress ?? string.Empty,
                ["CouncilLogo"] = councilLogo,
                ["CouncilDistrict"] = councilDistrict,
                ["CouncilState"] = ulb?.State ?? string.Empty,
                ["CouncilPinCode"] = ulb?.PinCode ?? string.Empty,
                ["CouncilEmail"] = ulb?.EmailId ?? string.Empty,
                ["CouncilMobileNo"] = ulb?.MobileNo ?? string.Empty,
                ["ulbCode"] = ulb?.UlbCode ?? string.Empty,
                ["ulbName"] = ulb?.UlbName ?? string.Empty,
                ["ulbNameLocal"] = ulb?.UlbNameLocal ?? string.Empty,
                ["ulbAddress"] = ulb?.UlbAddress ?? string.Empty,
                ["ulbLogo"] = councilLogo,
                ["logo"] = councilLogo,
                ["councilLogo"] = councilLogo,
                ["ActTitle"] = "महाराष्ट्र नगरपरिषद, नगरपंचायती व औद्योगिक नगरी अधिनियम १९६५ चे कलम ११९ (१), १२४ व १२७ (क) अन्वये",
                ["NoticePeriod"] = noticePeriod,
                ["NoticeTitle"] = "नोटीस",
                ["ReceiptTitle"] = "नोटीस (पोचपावती)",
                ["NoticeDate"] = noticeDate,
                ["NoticeDateLocal"] = ToMarathiNumerals(noticeDate),
                ["ObjectionLastDate"] = objectionDate,
                ["ObjectionLastDateLocal"] = ToMarathiNumerals(objectionDate),
                ["financeYear"] = financeYearText,
                ["financeYearLocal"] = ToMarathiNumerals(financeYearText),

                ["propertyId"] = property.Id,
                ["propertyNo"] = property.PropertyNo ?? string.Empty,
                ["propertyNoLocal"] = ToMarathiNumerals(property.PropertyNo),
                ["partitionNo"] = FirstNonEmpty(property.PartitionNo, "-"),
                ["partitionNoLocal"] = ToMarathiNumerals(FirstNonEmpty(property.PartitionNo, "-")),
                ["wardNo"] = property.WardNo ?? string.Empty,
                ["wardNoLocal"] = ToMarathiNumerals(property.WardNo),
                ["zoneNo"] = property.ZoneNo ?? string.Empty,
                ["zoneNoLocal"] = ToMarathiNumerals(property.ZoneNo),
                ["oldWardNo"] = oldProperty?.OldWardNo ?? string.Empty,
                ["oldWardNoLocal"] = ToMarathiNumerals(oldProperty?.OldWardNo),
                ["oldPropertyNo"] = oldProperty?.OldPropertyNo ?? string.Empty,
                ["oldPropertyNoLocal"] = ToMarathiNumerals(oldProperty?.OldPropertyNo),
                ["oldPartitionNo"] = oldProperty?.OldPartitionNo ?? string.Empty,
                ["computerNo"] = computerNo,
                ["computerNoLocal"] = ToMarathiNumerals(computerNo),

                ["ownerTitle"] = property.OwnerTitle ?? string.Empty,
                ["ownerName"] = property.OwnerName ?? string.Empty,
                ["ownerFullName"] = ownerFullName,
                ["occupierTitle"] = property.OccupierTitle ?? string.Empty,
                ["occupierName"] = property.OccupierName ?? string.Empty,
                ["occupierFullName"] = occupierFullName,
                ["flatOrShopNo"] = property.FlatOrShopNo ?? string.Empty,
                ["flatOrShopName"] = property.FlatOrShopName ?? string.Empty,
                ["address"] = property.Address ?? string.Empty,
                ["mobileNo"] = property.MobileNo ?? string.Empty,
                ["mobileNoLocal"] = ToMarathiNumerals(property.MobileNo),
                ["propertyDescription"] = property.PropertyDescription ?? string.Empty,
                ["propertyPhoto"] = propertyPhoto,
                ["PropertyPhotoA11"] = propertyPhoto,
                ["PropertyPhotoA011"] = propertyPhoto,
                ["PropertyPhotoADOUBLE114"] = propertyPhoto,
                ["propertyPhotoDocumentGuid"] = propertyPhotoDocumentGuid,
                ["propertyPhotoStatus"] = propertyPhotoStatus,

                ["OldRV"] = oldRateableValue,
                ["OldRVLocal"] = ToMarathiNumerals(oldRateableValue),
                ["OldTotalTax"] = oldTotalTax,
                ["OldTotalTaxLocal"] = ToMarathiNumerals(oldTotalTax),
                ["RateableValue"] = newRateableValue,
                ["RateableValueLocal"] = ToMarathiNumerals(newRateableValue),
                ["TotalTax"] = newTotalTax,
                ["TotalTaxLocal"] = ToMarathiNumerals(newTotalTax),
                ["TaxTotal"] = newTotalTax,
                ["TaxTotalLocal"] = ToMarathiNumerals(newTotalTax),

                ["GEN_TAX"] = RoundMoney(taxValues.General),
                ["GEN_TAX_Local"] = ToMarathiNumerals(RoundMoney(taxValues.General)),
                ["TREE_TAX"] = RoundMoney(taxValues.Tree),
                ["TREE_TAX_Local"] = ToMarathiNumerals(RoundMoney(taxValues.Tree)),
                ["SP_EDU_TAX"] = RoundMoney(taxValues.SpecialEducation),
                ["SP_EDU_TAX_Local"] = ToMarathiNumerals(RoundMoney(taxValues.SpecialEducation)),
                ["FIRE_TAX"] = RoundMoney(taxValues.Fire),
                ["FIRE_TAX_Local"] = ToMarathiNumerals(RoundMoney(taxValues.Fire)),
                ["SEWAGE_TAX"] = RoundMoney(taxValues.Sewage),
                ["SEWAGE_TAX_Local"] = ToMarathiNumerals(RoundMoney(taxValues.Sewage)),
                ["LIGHT_TAX"] = RoundMoney(taxValues.Light),
                ["LIGHT_TAX_Local"] = ToMarathiNumerals(RoundMoney(taxValues.Light)),
                ["STATE_EDU_TAX"] = RoundMoney(taxValues.StateEducation),
                ["STATE_EDU_TAX_Local"] = ToMarathiNumerals(RoundMoney(taxValues.StateEducation)),
                ["STATE_EMP_TAX"] = RoundMoney(taxValues.StateEmployment),
                ["STATE_EMP_TAX_Local"] = ToMarathiNumerals(RoundMoney(taxValues.StateEmployment)),
                ["ROAD_TAX"] = RoundMoney(taxValues.Road),
                ["ROAD_TAX_Local"] = ToMarathiNumerals(RoundMoney(taxValues.Road)),
                ["WATER_BEN_TAX"] = RoundMoney(taxValues.WaterBenefit),
                ["WATER_BEN_TAX_Local"] = ToMarathiNumerals(RoundMoney(taxValues.WaterBenefit)),
                ["SP_WATER_TAX"] = RoundMoney(taxValues.SpecialWater),
                ["SP_WATER_TAX_Local"] = ToMarathiNumerals(RoundMoney(taxValues.SpecialWater)),
                ["BIG_BUILDING_TAX"] = RoundMoney(taxValues.BigBuilding),
                ["BIG_BUILDING_TAX_Local"] = ToMarathiNumerals(RoundMoney(taxValues.BigBuilding)),
                ["OPEN_PLOT_TAX"] = RoundMoney(taxValues.OpenPlot),
                ["OPEN_PLOT_TAX_Local"] = ToMarathiNumerals(RoundMoney(taxValues.OpenPlot)),
                ["PENALTY_TAX"] = RoundMoney(taxValues.Penalty),
                ["PENALTY_TAX_Local"] = ToMarathiNumerals(RoundMoney(taxValues.Penalty)),

                ["Transmast_GEN"] = RoundMoney(taxValues.General),
                ["Transmast_TREE"] = RoundMoney(taxValues.Tree),
                ["Transmast_SP_EDU"] = RoundMoney(taxValues.SpecialEducation),
                ["Transmast_FIRE"] = RoundMoney(taxValues.Fire),
                ["Transmast_SEWAGE"] = RoundMoney(taxValues.Sewage),
                ["Transmast_LIGHT"] = RoundMoney(taxValues.Light),
                ["Transmast_STATE_EDU"] = RoundMoney(taxValues.StateEducation),
                ["Transmast_STATE_EMP"] = RoundMoney(taxValues.StateEmployment),
                ["Transmast_ROAD"] = RoundMoney(taxValues.Road),
                ["Transmast_WATER_BEN"] = RoundMoney(taxValues.WaterBenefit),
                ["Transmast_WATERBEN"] = RoundMoney(taxValues.WaterBenefit),
                ["Transmast_SP_WATER"] = RoundMoney(taxValues.SpecialWater),
                ["Transmast_SPWATER"] = RoundMoney(taxValues.SpecialWater),
                ["Transmast_BIG_BUILDING"] = RoundMoney(taxValues.BigBuilding),
                ["Transmast_OPEN_PLOT"] = RoundMoney(taxValues.OpenPlot),
                ["Transmast_PENALTY"] = RoundMoney(taxValues.Penalty),

                // Legacy Crystal/imported Notice 119 field names retained by the
                // saved design. These aliases intentionally map to the same live
                // database values as the canonical provider fields above.
                ["NewWardNo"] = property.WardNo ?? string.Empty,
                ["NewPropertyNo"] = property.PropertyNo ?? string.Empty,
                ["NewPartitionNo"] = FirstNonEmpty(property.PartitionNo, "-"),
                ["OldNo"] = oldProperty?.OldPropertyNo ?? string.Empty,
                ["OldCityServeyNo"] = computerNo,
                ["OldCitySurveyNo"] = computerNo,
                ["MarathiOwnerName"] = ownerFullName,
                ["OccupierNameMarathi"] = occupierFullName,
                ["MarathiOwnerAddress"] = property.Address ?? string.Empty,
                ["RV"] = newRateableValue,
                ["PropertyTax"] = RoundMoney(taxValues.General),
                ["TreeCess"] = RoundMoney(taxValues.Tree),
                ["SpEducationTax"] = RoundMoney(taxValues.SpecialEducation),
                ["FireCess"] = RoundMoney(taxValues.Fire),
                ["Sanitation"] = RoundMoney(taxValues.Sewage),
                ["LightCess"] = RoundMoney(taxValues.Light),
                ["EducationTax"] = RoundMoney(taxValues.StateEducation),
                ["EmploymentTax"] = RoundMoney(taxValues.StateEmployment),
                ["RoadCess"] = RoundMoney(taxValues.Road),
                ["WaterBenefit"] = RoundMoney(taxValues.WaterBenefit),
                ["SpWaterCess"] = RoundMoney(taxValues.SpecialWater),
                ["BigBuildingTax"] = RoundMoney(taxValues.BigBuilding),
                ["OpenPlotTax"] = RoundMoney(taxValues.OpenPlot),
                ["PenaltyTax"] = RoundMoney(taxValues.Penalty),

                ["WardInspectorTitle"] = "वॉर्ड निरीक्षक",
                ["TaxDepartmentHeadTitle"] = "कर विभाग प्रमुख",
                ["ChiefOfficerTitle"] = "मुख्याधिकारी",
                ["AuthorityCouncil"] = councilName
            };

            // Dynamic tax fields and by-code values (reference: Prarup Yadi)
            foreach (var kvp in taxValues.ByField)
            {
                if (!row.ContainsKey(kvp.Key))
                {
                    row[kvp.Key] = RoundMoney(kvp.Value);
                    row[$"{kvp.Key}_Local"] = ToMarathiNumerals(RoundMoney(kvp.Value));
                }
            }

            foreach (var kvp in taxValues.ByCode)
            {
                if (!row.ContainsKey(kvp.Key))
                {
                    row[kvp.Key] = RoundMoney(kvp.Value);
                }
                row[$"Transmast_{kvp.Key}"] = RoundMoney(kvp.Value);
            }

            rows.Add(row);
        }

        return (rows, hasMore);
    }

    private async Task<string> ResolveCouncilLogoAsync(CancellationToken ct)
    {
        var config = await _ulbConfigService.GetUlbConfigAsync(ct);
        var image = await EmbeddedReportImage.LoadLogoAsync(config?.UlbLogo, _documentService, _httpClientFactory, ct);
        return image.DataUrl ?? string.Empty;
    }

    private static TaxValues CalculateTaxValues(IReadOnlyList<TaxRow> taxRows)
    {
        // Section 119 is an RV notice. If both bases exist, using only RV prevents the tax
        // rows from being counted twice. A non-RV-only property still gets its available data.
        var rateableValueRows = taxRows
            .Where(row => row.CalculationType != null && row.CalculationType.Trim().Equals("RV", StringComparison.OrdinalIgnoreCase))
            .ToList();
        var effectiveRows = rateableValueRows.Count > 0 ? rateableValueRows : taxRows;

        decimal total = 0;
        var byField = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        var byCode = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);

        // Pre-initialize all known fields to 0
        foreach (var field in TaxCodeToFieldName.Values.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            byField[field] = 0m;
        }

        foreach (var row in effectiveRows)
        {
            // TaxTotal is an aggregate row. Including it with its component rows would double
            // the amount printed in the final column.
            if (IsTotalTax(row.TaxCode, row.TaxName)) continue;

            total += row.Amount;

            var normCode = NormalizeTaxCode(row.TaxCode);
            if (!string.IsNullOrWhiteSpace(normCode))
            {
                byCode[normCode] = byCode.TryGetValue(normCode, out var cVal) ? cVal + row.Amount : row.Amount;
            }

            if (TaxCodeToFieldName.TryGetValue(normCode, out var fieldName) ||
                (!string.IsNullOrWhiteSpace(row.TaxCode) && TaxCodeToFieldName.TryGetValue(row.TaxCode.Trim(), out fieldName)) ||
                (!string.IsNullOrWhiteSpace(row.TaxName) && (TaxCodeToFieldName.TryGetValue(NormalizeTaxCode(row.TaxName), out fieldName) || TaxCodeToFieldName.TryGetValue(row.TaxName.Trim(), out fieldName))))
            {
                byField[fieldName] = byField.TryGetValue(fieldName, out var curVal) ? curVal + row.Amount : row.Amount;
            }
            else if (!string.IsNullOrWhiteSpace(normCode))
            {
                byField[normCode] = byField.TryGetValue(normCode, out var curVal) ? curVal + row.Amount : row.Amount;
            }
        }

        if (total == 0)
        {
            var totalRow = effectiveRows.FirstOrDefault(r => IsTotalTax(r.TaxCode, r.TaxName));
            if (totalRow != null)
            {
                total = totalRow.Amount;
            }
        }

        return new TaxValues(total, byField, byCode);
    }

    private static bool IsTotalTax(string? code, string? name) =>
        NormalizeTaxCode(code) is "TAXTOTAL" or "TOTALTAX"
        || NormalizeTaxCode(name) is "TAXTOTAL" or "TOTALTAX";

    private static string NormalizeTaxCode(string? value) => string.IsNullOrWhiteSpace(value)
        ? string.Empty
        : new string(value.Where(char.IsLetterOrDigit).ToArray()).ToUpperInvariant();

    private static string ResolveDate(
        IReadOnlyDictionary<string, string> parameters,
        DateTime fallback,
        params string[] keys)
    {
        var raw = GetParameter(parameters, keys);
        if (string.IsNullOrWhiteSpace(raw))
            return fallback.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);

        string[] formats = ["dd/MM/yyyy", "d/M/yyyy", "yyyy-MM-dd", "dd-MM-yyyy", "d-M-yyyy"];
        return DateTime.TryParseExact(raw, formats, CultureInfo.InvariantCulture,
            DateTimeStyles.None, out var parsed)
            ? parsed.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture)
            : raw;
    }

    private static string BuildNoticePeriod(int startYear) =>
        $"सन {ToMarathiNumerals(FormatFinanceYear(startYear))} ते "
        + $"{ToMarathiNumerals(FormatFinanceYear(startYear + 3))} करिता प्रस्तावित "
        + "नव्याने वार्षिक कर पुनर्मूल्यांकन सूचना (नोटीस)";

    private static string FormatFinanceYear(int startYear) =>
        $"{startYear}-{(startYear + 1) % 100:00}";

    private static int GetCurrentFinanceYear(DateTime date) =>
        date.Month >= 4 ? date.Year : date.Year - 1;

    private static string JoinName(string? title, string? name) =>
        string.Join(" ", new[] { title, name }.Where(value => !string.IsNullOrWhiteSpace(value)));

    private static string FirstNonEmpty(params string?[] values) =>
        values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value))?.Trim() ?? string.Empty;

    private static string? GetParameter(
        IReadOnlyDictionary<string, string> parameters,
        params string[] keys)
    {
        foreach (var key in keys)
        {
            if (parameters.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value))
                return value;
        }

        return null;
    }

    private static int ParseInt(IReadOnlyDictionary<string, string> parameters, string key) =>
        int.TryParse(GetParameter(parameters, key), out var value) ? value : 0;

    private static short ParseShort(IReadOnlyDictionary<string, string> parameters, string key) =>
        short.TryParse(GetParameter(parameters, key), out var value) ? value : (short)0;

    private static short ParseFinanceYear(IReadOnlyDictionary<string, string> parameters)
    {
        var raw = GetParameter(parameters, "financeYear", "financialYear", "FinancialYear", "FinanceYear");
        if (string.IsNullOrWhiteSpace(raw)) return 0;

        if (short.TryParse(raw, out var year))
            return year;

        var parts = raw.Split('-', '/', ' ');
        if (parts.Length > 0 && short.TryParse(parts[0].Trim(), out var parsedYear))
            return parsedYear;

        return 0;
    }

    private static HashSet<int> ParseIds(string? value) =>
        (value ?? string.Empty)
        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .Select(token => int.TryParse(token, out var id) ? id : 0)
        .Where(id => id > 0)
        .ToHashSet();

    private static List<T> ApplyPropertyNumberRange<T>(
        List<T> values,
        string? fromPropertyNo,
        string? toPropertyNo,
        Func<T, string?> propertyNumber)
    {
        if (!string.IsNullOrWhiteSpace(fromPropertyNo))
        {
            values = int.TryParse(fromPropertyNo, out var fromNumeric)
                ? values.Where(value => int.TryParse(propertyNumber(value), out var number)
                                        && number >= fromNumeric).ToList()
                : values.Where(value => string.Compare(propertyNumber(value), fromPropertyNo,
                    StringComparison.OrdinalIgnoreCase) >= 0).ToList();
        }

        if (!string.IsNullOrWhiteSpace(toPropertyNo))
        {
            values = int.TryParse(toPropertyNo, out var toNumeric)
                ? values.Where(value => int.TryParse(propertyNumber(value), out var number)
                                        && number <= toNumeric).ToList()
                : values.Where(value => string.Compare(propertyNumber(value), toPropertyNo,
                    StringComparison.OrdinalIgnoreCase) <= 0).ToList();
        }

        return values;
    }

    private static decimal RoundMoney(double? value) =>
        Math.Round(Convert.ToDecimal(value ?? 0d), 0, MidpointRounding.AwayFromZero);

    private static decimal RoundMoney(decimal value) =>
        Math.Round(value, 0, MidpointRounding.AwayFromZero);

    private static string ToMarathiNumerals(object? input)
    {
        var value = Convert.ToString(input, CultureInfo.InvariantCulture) ?? string.Empty;
        if (value.Length == 0) return string.Empty;

        const string digits = "०१२३४५६७८९";
        var result = new StringBuilder(value.Length);
        foreach (var character in value)
        {
            result.Append(character is >= '0' and <= '9'
                ? digits[character - '0']
                : character);
        }

        return result.ToString();
    }


    private sealed record TaxRow(
        int PropertyId,
        string CalculationType,
        string TaxCode,
        string TaxName,
        decimal Amount);

    private sealed record TaxValues(
        decimal Total,
        IReadOnlyDictionary<string, decimal> ByField,
        IReadOnlyDictionary<string, decimal> ByCode)
    {
        public decimal GetField(string fieldName) =>
            ByField.TryGetValue(fieldName, out var val) ? val : 0m;

        public decimal General => GetField("GEN_TAX");
        public decimal Tree => GetField("TREE_TAX");
        public decimal SpecialEducation => GetField("SP_EDU_TAX");
        public decimal Fire => GetField("FIRE_TAX");
        public decimal Sewage => GetField("SEWAGE_TAX");
        public decimal Light => GetField("LIGHT_TAX");
        public decimal StateEducation => GetField("STATE_EDU_TAX");
        public decimal StateEmployment => GetField("STATE_EMP_TAX");
        public decimal Road => GetField("ROAD_TAX");
        public decimal WaterBenefit => GetField("WATER_BEN_TAX");
        public decimal SpecialWater => GetField("SP_WATER_TAX");
        public decimal BigBuilding => GetField("BIG_BUILDING_TAX");
        public decimal OpenPlot => GetField("OPEN_PLOT_TAX");
        public decimal Penalty => GetField("PENALTY_TAX");
    }

}
