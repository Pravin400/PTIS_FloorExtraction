using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.RateableValue;
using NtisPlatform.Application.DTOs.RetrospectiveTax;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.RetrospectiveTax;
using NtisPlatform.Application.Services.RetrospectiveTax;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.RetrospectiveTax;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.RetrospectiveTax;

public class RetrospectiveTaxCalculationEngineServiceTests
{
    private const int OcEvidenceTypeId = 1;
    private const int CcEvidenceTypeId = 2;
    private const int ElectricityEvidenceTypeId = 3;
    private const int ChangeDetectionEvidenceTypeId = 4;

    private readonly Mock<IRepository<RetrospectiveRuleMasterEntity, int>> _mockRuleRepository = new();
    private readonly Mock<IRepository<RetrospectiveRuleEvidenceConditionEntity, int>> _mockEvidenceConditionRepository = new();
    private readonly Mock<IRepository<RetrospectiveRuleDateConditionEntity, int>> _mockDateConditionRepository = new();
    private readonly Mock<IRepository<RetrospectiveRuleActionEntity, int>> _mockActionRepository = new();
    private readonly Mock<IRepository<RetrospectivePenaltyRuleEntity, int>> _mockPenaltyRepository = new();
    private readonly Mock<IRepository<EvidenceTypeMasterEntity, int>> _mockEvidenceTypeRepository = new();
    private readonly Mock<IRepository<PropertyCertificateEntity, int>> _mockCertificateRepository = new();
    private readonly Mock<IRepository<PropertyCertificateTypeMasterEntity, int>> _mockCertificateTypeRepository = new();
    private readonly Mock<IRepository<PropertyDetailsEntity, int>> _mockPropertyDetailsRepository = new();
    private readonly Mock<IRepository<PropertyEntity, int>> _mockPropertyRepository = new();
    private readonly Mock<IRepository<WingDetailsMastEntity, int>> _mockWingDetailsMastRepository = new();
    private readonly Mock<IRepository<SocietyDetailsEntity, int>> _mockSocietyRepository = new();
    private readonly Mock<IRepository<RetrospectiveTaxCalculationEntity, int>> _mockCalculationRepository = new();
    private readonly Mock<IRepository<RetrospectiveTaxCalculationDetailEntity, int>> _mockCalculationDetailRepository = new();
    private readonly Mock<IRepository<PolicyTaxDetailsEntity, int>> _mockPolicyTaxDetailsRepository = new();
    private readonly Mock<IRepository<TransMastEntity, int>> _mockTransMastRepository = new();
    private readonly Mock<IRepository<YearMasterEntity, int>> _mockYearRepository = new();
    private readonly Mock<IRateableValueService> _mockRateableValueService = new();
    private readonly Mock<IFinanceYearProvider> _mockFinanceYearProvider = new();
    private readonly Mock<IPolicyCodeLookupService> _mockPolicyCodeLookup = new();
    private readonly Mock<ITaxApplicabilityService> _mockTaxApplicabilityService = new();
    private readonly Mock<IUnitOfWork> _mockUnitOfWork = new();
    private readonly RetrospectiveTaxCalculationEngineService _service;

    public RetrospectiveTaxCalculationEngineServiceTests()
    {
        _mockEvidenceTypeRepository.Setup(r => r.GetQueryable()).Returns(new List<EvidenceTypeMasterEntity>
        {
            new() { Id = OcEvidenceTypeId, EvidenceCode = "OC", IsActive = true },
            new() { Id = CcEvidenceTypeId, EvidenceCode = "CC", IsActive = true },
            new() { Id = ElectricityEvidenceTypeId, EvidenceCode = "ELECTRICITY", IsActive = true },
            new() { Id = ChangeDetectionEvidenceTypeId, EvidenceCode = "CHANGE_DETECTION", IsActive = true },
        }.BuildMock());

        _mockPropertyDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyDetailsEntity>().BuildMock());
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity>().BuildMock());
        _mockWingDetailsMastRepository.Setup(r => r.GetQueryable()).Returns(new List<WingDetailsMastEntity>().BuildMock());
        _mockSocietyRepository.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity>().BuildMock());

        _mockCertificateTypeRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateTypeMasterEntity>
        {
            new() { Id = 10, CertificateTypeCode = "OC" },
            new() { Id = 11, CertificateTypeCode = "CC" },
            new() { Id = 12, CertificateTypeCode = "ELECTRIC_BILL" },
            new() { Id = 13, CertificateTypeCode = "CHANGE_DETECTION" },
        }.BuildMock());

        _mockCalculationRepository
            .Setup(r => r.AddAsync(It.IsAny<RetrospectiveTaxCalculationEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RetrospectiveTaxCalculationEntity e, CancellationToken _) => { e.Id = 501; return e; });
        _mockCalculationDetailRepository
            .Setup(r => r.AddAsync(It.IsAny<RetrospectiveTaxCalculationDetailEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RetrospectiveTaxCalculationDetailEntity e, CancellationToken _) => e);
        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _mockFinanceYearProvider.Setup(p => p.GetCurrentFinanceYear()).Returns(2025);

        // No existing NETTAX rows by default means SyncPolicyTaxAndTransMastAsync's write branch never fires, so most
        // tests (which only assert on RetrospectiveTaxCalculation/Detail, not PolicyTaxDetails/TransMast) are
        // unaffected. Tests that DO exercise persistence override these individually.
        _mockPolicyTaxDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PolicyTaxDetailsEntity>().BuildMock());
        _mockTransMastRepository.Setup(r => r.GetQueryable()).Returns(new List<TransMastEntity>().BuildMock());
        // The year master is complete by default (every finance year from 2000 to 2035, Id = Year): the engine refuses a
        // calculation that has a year without a row, so a test that is not about the year master must not hit that.
        _mockYearRepository.Setup(r => r.GetQueryable()).Returns(CompleteYearMasters().BuildMock());
        _mockPolicyCodeLookup.Setup(s => s.GetIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(99);
        _mockPolicyCodeLookup.Setup(s => s.GetIdsAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, int>
            {
                ["OC"] = 101, ["PARTIAL_OC"] = 102, ["CC"] = 103, ["PARTIAL_CC"] = 104,
                ["ELECTRIC_BILL"] = 105, ["PARTIAL_ELECTRIC_BILL"] = 106
            });
        // Default family codes and NETTAX seeded; OLD_ARREARS empty by default (optional).
        _mockPolicyCodeLookup.Setup(s => s.GetExistingIdsAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
            {
                ["OC"] = 101, ["PARTIAL_OC"] = 102, ["CC"] = 103, ["PARTIAL_CC"] = 104,
                ["ELECTRIC_BILL"] = 105, ["PARTIAL_ELECTRIC_BILL"] = 106,
                [PolicyCodes.NetTax] = 99
            });
        _mockTaxApplicabilityService.Setup(s => s.GetExemptedTaxIdsAsync(It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync(new HashSet<int>());

        _service = CreateService();
    }

    /// <summary>A year master row for every finance year from 2000 to 2035, with Id = Year (<paramref name="withoutYears"/> left out).</summary>
    private static List<YearMasterEntity> CompleteYearMasters(params int[] withoutYears) =>
        Enumerable.Range(2000, 36)
            .Where(year => !withoutYears.Contains(year))
            .Select(year => new YearMasterEntity { Id = year, Year = year })
            .ToList();

    /// <summary>The engine on the shared mocks. It requires a database lock; the tests that are not about the lock get one that is always granted.</summary>
    private RetrospectiveTaxCalculationEngineService CreateService(IRetrospectiveCalculationLock? calculationLock = null) =>
        CreateServiceWith(calculationLock ?? new AlwaysGrantedCalculationLock());

    private RetrospectiveTaxCalculationEngineService CreateServiceWith(IRetrospectiveCalculationLock calculationLock) =>
        new(
            _mockRuleRepository.Object,
            _mockEvidenceConditionRepository.Object,
            _mockDateConditionRepository.Object,
            _mockActionRepository.Object,
            _mockPenaltyRepository.Object,
            _mockEvidenceTypeRepository.Object,
            _mockCertificateRepository.Object,
            _mockCertificateTypeRepository.Object,
            _mockPropertyDetailsRepository.Object,
            _mockPropertyRepository.Object,
            _mockWingDetailsMastRepository.Object,
            _mockSocietyRepository.Object,
            _mockCalculationRepository.Object,
            _mockCalculationDetailRepository.Object,
            _mockPolicyTaxDetailsRepository.Object,
            _mockTransMastRepository.Object,
            _mockYearRepository.Object,
            _mockRateableValueService.Object,
            _mockFinanceYearProvider.Object,
            _mockPolicyCodeLookup.Object,
            _mockTaxApplicabilityService.Object,
            _mockUnitOfWork.Object,
            calculationLock,
            logger: null);

    private static readonly Dictionary<string, int> CertificateTypeIdByCode = new(StringComparer.OrdinalIgnoreCase)
    {
        ["OC"] = 10,
        ["CC"] = 11,
        ["ELECTRIC_BILL"] = 12,
        ["CHANGE_DETECTION"] = 13,
    };

    private static PropertyCertificateEntity Certificate(int propertyId, string typeCode, DateTime issueDate) =>
        PropertyCertificateEntity.Create(propertyId, certificateTypeId: CertificateTypeIdByCode[typeCode], certificateNo: "X", issueDate: issueDate);

    private void SetupRule(
        RetrospectiveRuleMasterEntity rule,
        List<RetrospectiveRuleEvidenceConditionEntity> evidenceConditions,
        RetrospectiveRuleActionEntity action,
        RetrospectiveRuleDateConditionEntity? dateCondition = null,
        RetrospectivePenaltyRuleEntity? penalty = null)
    {
        _mockRuleRepository.Setup(r => r.GetQueryable()).Returns(new List<RetrospectiveRuleMasterEntity> { rule }.BuildMock());
        _mockEvidenceConditionRepository.Setup(r => r.GetQueryable()).Returns(evidenceConditions.BuildMock());
        _mockActionRepository.Setup(r => r.GetQueryable()).Returns(new List<RetrospectiveRuleActionEntity> { action }.BuildMock());
        _mockDateConditionRepository.Setup(r => r.GetQueryable()).Returns(
            (dateCondition is null ? new List<RetrospectiveRuleDateConditionEntity>() : new List<RetrospectiveRuleDateConditionEntity> { dateCondition }).BuildMock());
        _mockPenaltyRepository.Setup(r => r.GetQueryable()).Returns(
            (penalty is null ? new List<RetrospectivePenaltyRuleEntity>() : new List<RetrospectivePenaltyRuleEntity> { penalty }).BuildMock());
    }

    /// <summary>
    /// Registers TWO competing rules at once (SetupRule only supports one), for tests proving the
    /// EVIDENCE_GAP_WITHIN_PERIOD comparator picks between them by the CC/OC gap.
    /// </summary>
    private void SetupRules(
        List<(RetrospectiveRuleMasterEntity Rule, List<RetrospectiveRuleEvidenceConditionEntity> EvidenceConditions, RetrospectiveRuleActionEntity Action, RetrospectiveRuleDateConditionEntity DateCondition)> rules)
    {
        _mockRuleRepository.Setup(r => r.GetQueryable()).Returns(rules.Select(r => r.Rule).ToList().BuildMock());
        _mockEvidenceConditionRepository.Setup(r => r.GetQueryable()).Returns(rules.SelectMany(r => r.EvidenceConditions).ToList().BuildMock());
        _mockActionRepository.Setup(r => r.GetQueryable()).Returns(rules.Select(r => r.Action).ToList().BuildMock());
        _mockDateConditionRepository.Setup(r => r.GetQueryable()).Returns(rules.Select(r => r.DateCondition).ToList().BuildMock());
        _mockPenaltyRepository.Setup(r => r.GetQueryable()).Returns(new List<RetrospectivePenaltyRuleEntity>().BuildMock());
    }

    [Theory]
    [InlineData("2023-01-01", "2023-05-01", "GAP-WITHIN")] // ~4 month gap -> within 6 months -> OC alone
    [InlineData("2020-05-01", "2023-06-01", "GAP-EXCEEDS")] // multi-year gap -> exceeds 6 months -> CC-then-OC merge
    public async Task CalculateAndSaveAsync_EvidenceGapWithinPeriod_SelectsRuleByCcToOcGap(string ccDate, string ocDate, string expectedRuleCode)
    {
        const int propertyId = 400;
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 20, EvidenceTypeId = CcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true },
            new() { RuleId = 20, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true },
            new() { RuleId = 21, EvidenceTypeId = CcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true },
            new() { RuleId = 21, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true },
        };

        var withinRule = new RetrospectiveRuleMasterEntity { Id = 20, RuleCode = "GAP-WITHIN", RuleName = "Gap within 6 months", PriorityNo = 1, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var withinAction = new RetrospectiveRuleActionEntity
        {
            Id = 20, RuleId = 20, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = OcEvidenceTypeId,
            RetrospectiveLimitType = "NONE", TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
        };
        var withinDateCondition = new RetrospectiveRuleDateConditionEntity
        {
            RuleId = 20, ComparatorCode = "EVIDENCE_GAP_WITHIN_PERIOD", LeftEvidenceTypeId = CcEvidenceTypeId, RightEvidenceTypeId = OcEvidenceTypeId,
            CompareOperator = "WITHIN_YEARS", CompareYears = 6, CompareGapUnit = "MONTHS", IsActive = true
        };

        var exceedsRule = new RetrospectiveRuleMasterEntity { Id = 21, RuleCode = "GAP-EXCEEDS", RuleName = "Gap exceeds 6 months", PriorityNo = 2, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var exceedsAction = new RetrospectiveRuleActionEntity
        {
            Id = 21, RuleId = 21, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = CcEvidenceTypeId,
            RetrospectiveLimitType = "NONE", TaxCalculationMode = "CC_THEN_OC_MERGE", TaxMultiplier = 1.00m,
            SplitEndEvidenceTypeId = OcEvidenceTypeId, SplitMultiplier = 1.50m, AfterSplitMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
        };
        var exceedsDateCondition = new RetrospectiveRuleDateConditionEntity
        {
            RuleId = 21, ComparatorCode = "EVIDENCE_GAP_WITHIN_PERIOD", LeftEvidenceTypeId = CcEvidenceTypeId, RightEvidenceTypeId = OcEvidenceTypeId,
            CompareOperator = "OLDER_THAN_YEARS", CompareYears = 6, CompareGapUnit = "MONTHS", IsActive = true
        };

        SetupRules(new()
        {
            (withinRule, evidenceConditions.Where(c => c.RuleId == 20).ToList(), withinAction, withinDateCondition),
            (exceedsRule, evidenceConditions.Where(c => c.RuleId == 21).ToList(), exceedsAction, exceedsDateCondition),
        });

        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>
        {
            Certificate(propertyId, "CC", DateTime.Parse(ccDate)),
            Certificate(propertyId, "OC", DateTime.Parse(ocDate))
        }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, It.IsAny<int>()))
            .ReturnsAsync((int _, int year) => new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = year, TotalTaxAmount = 1000m });

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(expectedRuleCode, result!.AppliedRuleCode);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_OcOnlyRule_MatchesAndComputesYearWiseRetroTax()
    {
        const int propertyId = 100;
        var rule = new RetrospectiveRuleMasterEntity { Id = 1, RuleCode = "THA-01", RuleName = "OC only", PriorityNo = 1, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 1, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 1, RuleId = 1, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = OcEvidenceTypeId,
            RetrospectiveLimitType = "FIXED_CUTOFF_DATE", CutoffDate = new DateTime(2016, 4, 1),
            TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
        };
        SetupRule(rule, evidenceConditions, action);

        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>
        {
            Certificate(propertyId, "OC", new DateTime(2019, 6, 15))
        }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, It.IsAny<int>()))
            .ReturnsAsync((int _, int year) => new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = year, TotalTaxAmount = 1000m + year });

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("THA-01", result!.AppliedRuleCode);
        Assert.Equal(new DateTime(2019, 6, 15), result.ChargeableStartDate);
        Assert.Equal(7, result.RetroYearCount); // FY2019 .. FY2025 inclusive
        Assert.Equal(7, result.YearWiseBreakdown.Count);
        Assert.All(result.YearWiseBreakdown, y => Assert.Equal("YEAR_WISE", y.RateMode));
        // YEAR_WISE must price each year with that year's own rate, not the current year's.
        _mockRateableValueService.Verify(s => s.PreviewTotalTaxAsync(propertyId, 2019), Times.Once);
        _mockRateableValueService.Verify(s => s.PreviewTotalTaxAsync(propertyId, 2025), Times.Once);
        _mockCalculationDetailRepository.Verify(
            r => r.AddAsync(It.IsAny<RetrospectiveTaxCalculationDetailEntity>(), It.IsAny<CancellationToken>()), Times.Exactly(7));
    }

    [Fact]
    public async Task CalculateAndSaveAsync_NoDirectCertificate_FallsBackToWingScopedCertificate()
    {
        // A unit with no Property-level OC certificate of its own is still covered by a
        // Wing-scoped OC certificate (created via the "Add Certificate Record" Wing-level flow --
        // EntityType 'W', PropertyId null) applying to its whole wing.
        const int propertyId = 100;
        const int wingDetailId = 20;

        var rule = new RetrospectiveRuleMasterEntity { Id = 1, RuleCode = "THA-01", RuleName = "OC only", PriorityNo = 1, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 1, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 1, RuleId = 1, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = OcEvidenceTypeId,
            RetrospectiveLimitType = "FIXED_CUTOFF_DATE", CutoffDate = new DateTime(2016, 4, 1),
            TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
        };
        SetupRule(rule, evidenceConditions, action);

        // No certificate carries this unit's own PropertyId -- only a Wing-scoped row for its wing.
        var wingCert = PropertyCertificateEntity.Create(
            propertyId: null, certificateTypeId: CertificateTypeIdByCode["OC"], certificateNo: "WING-OC",
            issueDate: new DateTime(2019, 6, 15), entityType: "W", societyDetailId: 5, wingDetailId: wingDetailId);
        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity> { wingCert }.BuildMock());

        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity>
        {
            new() { Id = propertyId, WingDetailId = wingDetailId, IsActive = true }
        }.BuildMock());
        _mockWingDetailsMastRepository.Setup(r => r.GetQueryable()).Returns(new List<WingDetailsMastEntity>
        {
            new() { Id = wingDetailId, SocietyDetailsMastId = 5, IsActive = true }
        }.BuildMock());
        _mockSocietyRepository.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity> { new() { Id = 5, IsActive = true } }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, It.IsAny<int>()))
            .ReturnsAsync((int _, int year) => new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = year, TotalTaxAmount = 1000m + year });

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("THA-01", result!.AppliedRuleCode);
        Assert.Equal(new DateTime(2019, 6, 15), result.ChargeableStartDate);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_NoDirectOrWingCertificate_FallsBackToSocietyScopedCertificate()
    {
        // A unit with neither a Property-level nor a Wing-level OC certificate is still covered by
        // a Society-scoped OC certificate (EntityType 'S', PropertyId null) applying to every unit
        // in the society, resolved via the unit's wing -> society chain.
        const int propertyId = 100;
        const int wingDetailId = 20;
        const int societyDetailId = 5;

        var rule = new RetrospectiveRuleMasterEntity { Id = 1, RuleCode = "THA-01", RuleName = "OC only", PriorityNo = 1, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 1, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 1, RuleId = 1, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = OcEvidenceTypeId,
            RetrospectiveLimitType = "FIXED_CUTOFF_DATE", CutoffDate = new DateTime(2016, 4, 1),
            TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
        };
        SetupRule(rule, evidenceConditions, action);

        var societyCert = PropertyCertificateEntity.Create(
            propertyId: null, certificateTypeId: CertificateTypeIdByCode["OC"], certificateNo: "SOCIETY-OC",
            issueDate: new DateTime(2019, 6, 15), entityType: "S", societyDetailId: societyDetailId);
        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity> { societyCert }.BuildMock());

        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity>
        {
            new() { Id = propertyId, WingDetailId = wingDetailId, IsActive = true }
        }.BuildMock());
        _mockWingDetailsMastRepository.Setup(r => r.GetQueryable()).Returns(new List<WingDetailsMastEntity>
        {
            new() { Id = wingDetailId, SocietyDetailsMastId = societyDetailId, IsActive = true }
        }.BuildMock());
        _mockSocietyRepository.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity> { new() { Id = societyDetailId, IsActive = true } }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, It.IsAny<int>()))
            .ReturnsAsync((int _, int year) => new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = year, TotalTaxAmount = 1000m + year });

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("THA-01", result!.AppliedRuleCode);
        Assert.Equal(new DateTime(2019, 6, 15), result.ChargeableStartDate);
    }

    // The wing / society fallback only counts rows that are still live. A soft-deleted wing or society (IsActive = 0 or
    // MarkedForDeletion = 1) must not keep lending its certificates to the units that used to belong to it.
    private void ArrangeOcOnlyRuleAndAScopedCertificate(int propertyId, string entityType, int societyDetailId, int? wingDetailId)
    {
        var rule = new RetrospectiveRuleMasterEntity { Id = 1, RuleCode = "THA-01", RuleName = "OC only", PriorityNo = 1, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 1, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 1, RuleId = 1, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = OcEvidenceTypeId,
            RetrospectiveLimitType = "FIXED_CUTOFF_DATE", CutoffDate = new DateTime(2016, 4, 1),
            TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
        };
        SetupRule(rule, evidenceConditions, action);

        // no certificate carries the unit's own PropertyId: only one issued to a wing or to a society
        var certificate = PropertyCertificateEntity.Create(
            propertyId: null, certificateTypeId: CertificateTypeIdByCode["OC"], certificateNo: "SCOPED-OC",
            issueDate: new DateTime(2019, 6, 15), entityType: entityType,
            societyDetailId: societyDetailId, wingDetailId: entityType == "W" ? wingDetailId : null);
        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity> { certificate }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, It.IsAny<int>()))
            .ReturnsAsync((int _, int year) => new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = year, TotalTaxAmount = 1000m + year });
    }

    private void ArrangeUnitCoveredOnlyByAWingOrSocietyCertificate(
        int propertyId, string entityType, bool wingIsLive, bool societyIsLive, bool wingIsMarkedForDeletion = false, bool societyIsMarkedForDeletion = false)
    {
        const int wingDetailId = 20;
        const int societyDetailId = 5;
        ArrangeOcOnlyRuleAndAScopedCertificate(propertyId, entityType, societyDetailId, wingDetailId);

        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity>
        {
            new() { Id = propertyId, WingDetailId = wingDetailId, IsActive = true }
        }.BuildMock());
        _mockWingDetailsMastRepository.Setup(r => r.GetQueryable()).Returns(new List<WingDetailsMastEntity>
        {
            new() { Id = wingDetailId, SocietyDetailsMastId = societyDetailId, IsActive = wingIsLive, MarkedForDeletion = wingIsMarkedForDeletion }
        }.BuildMock());
        _mockSocietyRepository.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity>
        {
            new() { Id = societyDetailId, IsActive = societyIsLive, MarkedForDeletion = societyIsMarkedForDeletion }
        }.BuildMock());
    }

    [Theory]
    [InlineData("W")]
    [InlineData("S")]
    public async Task CalculateAndSaveAsync_AWingAndSocietyThatAreBothLive_LendTheirCertificates(string entityType)
    {
        const int propertyId = 101;
        ArrangeUnitCoveredOnlyByAWingOrSocietyCertificate(propertyId, entityType, wingIsLive: true, societyIsLive: true);

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(new DateTime(2019, 6, 15), result!.ChargeableStartDate);
    }

    [Theory]
    [InlineData("W", false)] // wing deactivated
    [InlineData("W", true)]  // wing marked for deletion
    [InlineData("S", false)] // wing deactivated: the society is not reached through it
    [InlineData("S", true)]  // wing marked for deletion
    public async Task CalculateAndSaveAsync_ASoftDeletedWing_LendsNoCertificate(string entityType, bool markedForDeletion)
    {
        const int propertyId = 102;
        ArrangeUnitCoveredOnlyByAWingOrSocietyCertificate(
            propertyId, entityType, wingIsLive: markedForDeletion, societyIsLive: true, wingIsMarkedForDeletion: markedForDeletion);

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        // the OC is not available, so the "OC available" rule does not match
        Assert.Null(result);
    }

    [Theory]
    [InlineData(false)] // society deactivated
    [InlineData(true)]  // society marked for deletion
    public async Task CalculateAndSaveAsync_ASoftDeletedSocietyBehindALiveWing_LendsNoCertificate(bool markedForDeletion)
    {
        const int propertyId = 103;
        ArrangeUnitCoveredOnlyByAWingOrSocietyCertificate(
            propertyId, "S", wingIsLive: true, societyIsLive: markedForDeletion, societyIsMarkedForDeletion: markedForDeletion);

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.Null(result);
    }

    [Theory]
    [InlineData(true, false, true)]   // live society: its certificate counts
    [InlineData(false, false, false)] // society deactivated
    [InlineData(true, true, false)]   // society marked for deletion
    public async Task CalculateAndSaveAsync_ASocietysOwnProperty_UsesTheSocietyCertificateOnlyWhileTheSocietyIsLive(
        bool isActive, bool markedForDeletion, bool expectsCertificate)
    {
        // no wing: the unit is the society's own representative property
        const int propertyId = 105;
        const int societyDetailId = 5;
        ArrangeOcOnlyRuleAndAScopedCertificate(propertyId, "S", societyDetailId, wingDetailId: null);
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity>
        {
            new() { Id = propertyId, IsActive = true }
        }.BuildMock());
        _mockSocietyRepository.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity>
        {
            new() { Id = societyDetailId, PropertyId = propertyId, IsActive = isActive, MarkedForDeletion = markedForDeletion }
        }.BuildMock());

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.Equal(expectsCertificate, result is not null);
    }

    [Theory]
    [InlineData(true, false, true)]
    [InlineData(false, false, false)]
    [InlineData(true, true, false)]
    public async Task CalculateAndSaveAsync_ASiblingPropertysSociety_IsUsedOnlyWhileTheSocietyIsLive(
        bool isActive, bool markedForDeletion, bool expectsCertificate)
    {
        // "12/3" and "12" of the same ward are the same building: the society is registered on the sibling property
        const int propertyId = 106;
        const int siblingPropertyId = 206;
        const int societyDetailId = 5;
        ArrangeOcOnlyRuleAndAScopedCertificate(propertyId, "S", societyDetailId, wingDetailId: null);
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity>
        {
            new() { Id = propertyId, WardId = 7, PropertyNo = "12/3", IsActive = true },
            new() { Id = siblingPropertyId, WardId = 7, PropertyNo = "12", IsActive = true }
        }.BuildMock());
        _mockSocietyRepository.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity>
        {
            new() { Id = societyDetailId, PropertyId = siblingPropertyId, IsActive = isActive, MarkedForDeletion = markedForDeletion }
        }.BuildMock());

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.Equal(expectsCertificate, result is not null);
    }

    [Theory]
    [InlineData(true, false, true)]
    [InlineData(false, false, false)]
    [InlineData(true, true, false)]
    public async Task CalculateAndSaveAsync_ASiblingPropertysWing_IsUsedOnlyWhileTheWingIsLive(
        bool isActive, bool markedForDeletion, bool expectsCertificate)
    {
        // the society is only known through the wing of a sibling property
        const int propertyId = 107;
        const int siblingPropertyId = 207;
        const int wingDetailId = 20;
        const int societyDetailId = 5;
        ArrangeOcOnlyRuleAndAScopedCertificate(propertyId, "S", societyDetailId, wingDetailId: null);
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity>
        {
            new() { Id = propertyId, WardId = 7, PropertyNo = "12/3", IsActive = true },
            new() { Id = siblingPropertyId, WardId = 7, PropertyNo = "12", WingDetailId = wingDetailId, IsActive = true }
        }.BuildMock());
        _mockWingDetailsMastRepository.Setup(r => r.GetQueryable()).Returns(new List<WingDetailsMastEntity>
        {
            new() { Id = wingDetailId, SocietyDetailsMastId = societyDetailId, IsActive = isActive, MarkedForDeletion = markedForDeletion }
        }.BuildMock());
        _mockSocietyRepository.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity>
        {
            new() { Id = societyDetailId, IsActive = true }
        }.BuildMock());

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.Equal(expectsCertificate, result is not null);
    }
    [Fact]
    public async Task CalculateAndSaveAsync_ASocietyThatIsGone_DoesNotHideTheLiveOneOnTheSameProperty()
    {
        // two society rows on one property, the deleted one first: the live one is the society of the unit
        const int propertyId = 108;
        ArrangeOcOnlyRuleAndAScopedCertificate(propertyId, "S", societyDetailId: 5, wingDetailId: null);
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity>
        {
            new() { Id = propertyId, IsActive = true }
        }.BuildMock());
        _mockSocietyRepository.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity>
        {
            new() { Id = 4, PropertyId = propertyId, IsActive = false, MarkedForDeletion = true },
            new() { Id = 5, PropertyId = propertyId, IsActive = true }
        }.BuildMock());

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_ASiblingSocietyThatIsGone_DoesNotHideTheLiveOne()
    {
        const int propertyId = 109;
        const int siblingPropertyId = 209;
        ArrangeOcOnlyRuleAndAScopedCertificate(propertyId, "S", societyDetailId: 5, wingDetailId: null);
        _mockPropertyRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity>
        {
            new() { Id = propertyId, WardId = 7, PropertyNo = "12/3", IsActive = true },
            new() { Id = siblingPropertyId, WardId = 7, PropertyNo = "12", IsActive = true }
        }.BuildMock());
        _mockSocietyRepository.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity>
        {
            new() { Id = 4, PropertyId = siblingPropertyId, IsActive = true, MarkedForDeletion = true },
            new() { Id = 5, PropertyId = siblingPropertyId, IsActive = true }
        }.BuildMock());

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);
    }
    [Fact]
    public async Task CalculateAndSaveAsync_ASoftDeletedSociety_DoesNotTakeAwayTheCertificateOfTheLiveWing()
    {
        // the wing's own certificate stands on its own: only the society's are withheld
        const int propertyId = 104;
        ArrangeUnitCoveredOnlyByAWingOrSocietyCertificate(propertyId, "W", wingIsLive: true, societyIsLive: false);

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(new DateTime(2019, 6, 15), result!.ChargeableStartDate);
    }
    [Fact]
    public async Task CalculateAndSaveAsync_MultiYearRetro_PersistsTransMastForEveryHistoricalYear()
    {
        // TransMast is the single source of tax demand across every year (PropertyId +
        // FinanceYearId + CalculationType + TaxId), not just the current one -- a 3-year retro
        // span (OC dated exactly at FY start, so no proration) must write one TransMast row per
        // year, not just for the current finance year.
        const int propertyId = 600;
        var rule = new RetrospectiveRuleMasterEntity { Id = 40, RuleCode = "THA-40", RuleName = "OC only, multi-year", PriorityNo = 1, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 40, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 40, RuleId = 40, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = OcEvidenceTypeId,
            RetrospectiveLimitType = "NONE", TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
        };
        SetupRule(rule, evidenceConditions, action);

        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>
        {
            Certificate(propertyId, "OC", new DateTime(2023, 4, 1)) // exact FY2023-24 start -- no proration
        }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, It.IsAny<int>()))
            .ReturnsAsync((int _, int year) => new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = year, TotalTaxAmount = 1000m });

        var netTaxRow = new PolicyTaxDetailsEntity { PropertyId = propertyId, PolicyCodeId = 99, TaxId = 1, TaxAmount = 1000m, IsActive = true };
        _mockPolicyTaxDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PolicyTaxDetailsEntity> { netTaxRow }.BuildMock());

        _mockYearRepository.Setup(r => r.GetQueryable()).Returns(new List<YearMasterEntity>
        {
            new() { Id = 2023, Year = 2023 },
            new() { Id = 2024, Year = 2024 },
            new() { Id = 2025, Year = 2025 },
        }.BuildMock());

        var addedTransMasts = new List<TransMastEntity>();
        _mockTransMastRepository
            .Setup(r => r.AddAsync(It.IsAny<TransMastEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TransMastEntity e, CancellationToken _) => { addedTransMasts.Add(e); return e; });

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(3, result!.YearWiseBreakdown.Count); // FY2023-24, 2024-25, 2025-26(current)

        Assert.Equal(3, addedTransMasts.Count);
        Assert.Equal(new[] { 2023, 2024, 2025 }, addedTransMasts.Select(tm => tm.FinanceYearId).OrderBy(id => id).ToArray());
        Assert.All(addedTransMasts, tm => Assert.Equal(1000m, tm.TaxAmount));
        Assert.All(addedTransMasts, tm => Assert.Equal(101, tm.PolicyCodeId)); // OC full code, not silently defaulted to NETTAX (1)
    }

    [Fact]
    public async Task CalculateAndSaveAsync_ActiveOldArrearsForRecalculatedYear_IsDeactivatedNotDeleted()
    {
        // Spec: "If an old year already has an active OLD_ARREARS demand and the same year is
        // recalculated through OC/CC..., the old arrears row must not remain as a second active
        // demand." Only IsActive flips to false -- MarkedForDeletion stays false, so the row
        // remains available through audit/history.
        const int propertyId = 601;
        const int oldArrearsPolicyCodeId = 999;

        var arrearsRule = new RetrospectiveRuleMasterEntity { Id = 41, RuleCode = "THA-41", RuleName = "OC only, arrears replaced", PriorityNo = 1, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var arrearsEvidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 41, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var arrearsAction = new RetrospectiveRuleActionEntity
        {
            Id = 41, RuleId = 41, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = OcEvidenceTypeId,
            RetrospectiveLimitType = "NONE", TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
        };
        SetupRule(arrearsRule, arrearsEvidenceConditions, arrearsAction);

        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>
        {
            Certificate(propertyId, "OC", new DateTime(2023, 4, 1))
        }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, It.IsAny<int>()))
            .ReturnsAsync((int _, int year) => new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = year, TotalTaxAmount = 1000m });

        var arrearsNetTaxRow = new PolicyTaxDetailsEntity { PropertyId = propertyId, PolicyCodeId = 99, TaxId = 1, TaxAmount = 1000m, IsActive = true };
        _mockPolicyTaxDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PolicyTaxDetailsEntity> { arrearsNetTaxRow }.BuildMock());

        _mockYearRepository.Setup(r => r.GetQueryable()).Returns(new List<YearMasterEntity>
        {
            new() { Id = 2023, Year = 2023 },
            new() { Id = 2024, Year = 2024 },
            new() { Id = 2025, Year = 2025 },
        }.BuildMock());

        // An existing active OLD_ARREARS row for FY2023-24, TaxId 1 -- the exact key this run
        // recalculates via OC.
        var oldArrearsRow = new TransMastEntity
        {
            PropertyId = propertyId, FinanceYearId = 2023, CalculationType = "RV", TaxId = 1,
            PolicyCodeId = oldArrearsPolicyCodeId, TaxAmount = 20000m, IsActive = true
        };
        _mockTransMastRepository.Setup(r => r.GetQueryable()).Returns(new List<TransMastEntity> { oldArrearsRow }.BuildMock());

        _mockPolicyCodeLookup.Setup(s => s.GetExistingIdsAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
            {
                ["OC"] = 101, ["PARTIAL_OC"] = 102, ["CC"] = 103, ["PARTIAL_CC"] = 104,
                ["ELECTRIC_BILL"] = 105, ["PARTIAL_ELECTRIC_BILL"] = 106,
                [PolicyCodes.NetTax] = 99,
                [PolicyCodes.OldArrears] = oldArrearsPolicyCodeId
            });

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);
        Assert.False(oldArrearsRow.IsActive);
        Assert.False(oldArrearsRow.MarkedForDeletion);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_EarliestYearStartsMidYear_ProratesOnlyThatYearByDayCount()
    {
        // FY2019-20 (01-Apr-2019..31-Mar-2020) is the earliest chargeable year but the certificate
        // is dated 15-Jun-2019, so only that one year should be billed for the 291 days from
        // 15-Jun-2019 to 31-Mar-2020 inclusive; FY2020-21 onward must be billed in full.
        const int propertyId = 101;
        var rule = new RetrospectiveRuleMasterEntity { Id = 3, RuleCode = "THA-03", RuleName = "OC only, mid-year", PriorityNo = 1, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 3, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 3, RuleId = 3, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = OcEvidenceTypeId,
            RetrospectiveLimitType = "NONE",
            TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = "CURRENT_YEAR", IsActive = true
        };
        SetupRule(rule, evidenceConditions, action);

        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>
        {
            Certificate(propertyId, "OC", new DateTime(2019, 6, 15))
        }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, 2025))
            .ReturnsAsync(new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = 2025, TotalTaxAmount = 3650m });

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);
        var earliestYear = result!.YearWiseBreakdown.Single(y => y.FinancialYear == "2019-20");
        Assert.Equal(new DateTime(2019, 6, 15), earliestYear.FromDate);
        Assert.Equal(new DateTime(2020, 3, 31), earliestYear.ToDate);
        // 291 days (15-Jun-2019..31-Mar-2020 inclusive) / 365 * 3650 = 2910.00
        Assert.Equal(2910.00m, earliestYear.BaseTaxAmount);

        var laterYear = result.YearWiseBreakdown.Single(y => y.FinancialYear == "2020-21");
        Assert.Equal(new DateTime(2020, 4, 1), laterYear.FromDate);
        Assert.Equal(3650m, laterYear.BaseTaxAmount);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_FullLeapFinanceYearThatIsNotTheEarliestYear_IsNotProrated()
    {
        // Regression guard: FY2023-24 (01-Apr-2023..31-Mar-2024) actually spans 366 days because it
        // contains 29-Feb-2024, but when it is NOT the earliest chargeable year it must still be
        // billed at the full, unprorated rate -- proration only ever applies to the single earliest
        // (genuinely partial) chargeable year, never to a later year just because that year happens
        // to contain a leap day.
        const int propertyId = 102;
        var rule = new RetrospectiveRuleMasterEntity { Id = 4, RuleCode = "THA-04", RuleName = "OC only, spans a leap FY", PriorityNo = 1, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 4, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 4, RuleId = 4, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = OcEvidenceTypeId,
            RetrospectiveLimitType = "NONE",
            TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = "CURRENT_YEAR", IsActive = true
        };
        SetupRule(rule, evidenceConditions, action);

        // Onset is exactly 01-Apr-2023 (the FY's own start), so FY2023-24 is a FULL year -- it just
        // happens to be a leap finance year, not a partial one.
        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>
        {
            Certificate(propertyId, "OC", new DateTime(2023, 4, 1))
        }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, 2025))
            .ReturnsAsync(new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = 2025, TotalTaxAmount = 1000m });

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);
        var leapYear = result!.YearWiseBreakdown.Single(y => y.FinancialYear == "2023-24");
        Assert.Equal(new DateTime(2023, 4, 1), leapYear.FromDate);
        Assert.Equal(1000m, leapYear.BaseTaxAmount);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_CurrentYearRateMode_PricesEveryYearWithCurrentYearRateOnly()
    {
        const int propertyId = 200;
        var rule = new RetrospectiveRuleMasterEntity { Id = 2, RuleCode = "PCM-02", RuleName = "OC within 6y", PriorityNo = 1, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 2, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 2, RuleId = 2, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = OcEvidenceTypeId,
            RetrospectiveLimitType = "MAXIMUM_YEARS", MaximumYears = 6,
            TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = "CURRENT_YEAR", IsActive = true
        };
        SetupRule(rule, evidenceConditions, action);

        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>
        {
            Certificate(propertyId, "OC", new DateTime(2023, 5, 1))
        }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, 2025))
            .ReturnsAsync(new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = 2025, TotalTaxAmount = 5000m });

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);
        // The earliest chargeable year (2023-24) starts mid-year (01-May, not 01-Apr) and is
        // day-prorated: 336 of 365 days × 5000 = 4602.74. Every later year runs in full.
        var earliestYear = result!.YearWiseBreakdown.Single(y => y.FinancialYear == "2023-24");
        Assert.Equal(4602.74m, earliestYear.BaseTaxAmount);
        Assert.Equal(new DateTime(2023, 5, 1), earliestYear.FromDate);
        Assert.All(result.YearWiseBreakdown.Where(y => y.FinancialYear != "2023-24"), y => Assert.Equal(5000m, y.BaseTaxAmount));
        // Only the current finance year is ever priced — never a historical one.
        _mockRateableValueService.Verify(s => s.PreviewTotalTaxAsync(propertyId, 2025), Times.Once);
        _mockRateableValueService.Verify(s => s.PreviewTotalTaxAsync(propertyId, It.Is<int>(y => y != 2025)), Times.Never);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_SplitMultiplier_UsesSplitBeforeOcAndAfterSplitFromOc()
    {
        const int propertyId = 300;
        var rule = new RetrospectiveRuleMasterEntity { Id = 9, RuleCode = "THA-09", RuleName = "CC then OC split", PriorityNo = 1, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 9, EvidenceTypeId = CcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 9, RuleId = 9, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = CcEvidenceTypeId,
            RetrospectiveLimitType = "FIXED_CUTOFF_DATE", CutoffDate = new DateTime(2016, 4, 1),
            TaxCalculationMode = "SPLIT", TaxMultiplier = 1.00m,
            SplitStartEvidenceTypeId = CcEvidenceTypeId, SplitEndEvidenceTypeId = OcEvidenceTypeId,
            SplitMultiplier = 1.50m, AfterSplitMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
        };
        SetupRule(rule, evidenceConditions, action);

        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>
        {
            Certificate(propertyId, "CC", new DateTime(2020, 5, 1)),
            Certificate(propertyId, "OC", new DateTime(2023, 6, 1))
        }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, It.IsAny<int>()))
            .ReturnsAsync((int _, int year) => new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = year, TotalTaxAmount = 1000m });

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);
        var fy2020 = result!.YearWiseBreakdown.Single(y => y.FinancialYear == "2020-21");
        // FY2023-24 (From=2023-04-01) starts before the 2023-06-01 OC date -> whole year still split-priced.
        var fy2023 = result.YearWiseBreakdown.Single(y => y.FinancialYear == "2023-24");
        // FY2024-25 (From=2024-04-01) starts after the OC date -> after-split multiplier applies.
        var fy2024 = result.YearWiseBreakdown.Single(y => y.FinancialYear == "2024-25");
        Assert.Equal(1.50m, fy2020.TaxMultiplier);
        Assert.Equal(1.50m, fy2023.TaxMultiplier);
        Assert.Equal(1.00m, fy2024.TaxMultiplier);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_CcThenOcMerge_SplitsBoundaryYearByDayAndAppliesCcBeforeOcAfter()
    {
        // Same dates as the SPLIT-mode test above (CC 01-May-2020, OC 01-Jun-2023), but under
        // CC_THEN_OC_MERGE: unlike SPLIT (which bills FY2023-24 in full at the pre-OC multiplier),
        // the merge splits that one boundary year by day between CC's and OC's portions.
        const int propertyId = 301;
        var rule = new RetrospectiveRuleMasterEntity { Id = 10, RuleCode = "THA-10", RuleName = "CC then OC merge", PriorityNo = 1, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 10, EvidenceTypeId = CcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 10, RuleId = 10, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = CcEvidenceTypeId,
            RetrospectiveLimitType = "FIXED_CUTOFF_DATE", CutoffDate = new DateTime(2016, 4, 1),
            TaxCalculationMode = "CC_THEN_OC_MERGE", TaxMultiplier = 1.00m,
            SplitEndEvidenceTypeId = OcEvidenceTypeId,
            SplitMultiplier = 1.50m, AfterSplitMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
        };
        SetupRule(rule, evidenceConditions, action);

        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>
        {
            Certificate(propertyId, "CC", new DateTime(2020, 5, 1)),
            Certificate(propertyId, "OC", new DateTime(2023, 6, 1))
        }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, It.IsAny<int>()))
            .ReturnsAsync((int _, int year) => new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = year, TotalTaxAmount = 1000m });

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);

        // Earliest chargeable year: partial from CC's own date (335 of 365 days), fully at 1.5x.
        var fy2020 = result!.YearWiseBreakdown.Single(y => y.FinancialYear == "2020-21");
        Assert.Equal(new DateTime(2020, 5, 1), fy2020.FromDate);
        Assert.Equal(1.50m, fy2020.TaxMultiplier);
        Assert.Equal(917.81m, fy2020.BaseTaxAmount);

        // A full year strictly before OC's onset year -- billed in full at 1.5x.
        var fy2022 = result.YearWiseBreakdown.Single(y => y.FinancialYear == "2022-23");
        Assert.Equal(1.50m, fy2022.TaxMultiplier);
        Assert.Equal(1000m, fy2022.BaseTaxAmount);

        // The OC-onset year (2023-24) must split into exactly two rows: CC's portion (01-Apr..31-May)
        // at 1.5x, OC's portion (01-Jun..31-Mar) at 1.0x.
        var fy2023Rows = result.YearWiseBreakdown.Where(y => y.FinancialYear == "2023-24").OrderBy(y => y.FromDate).ToList();
        Assert.Equal(2, fy2023Rows.Count);
        Assert.Equal(new DateTime(2023, 4, 1), fy2023Rows[0].FromDate);
        Assert.Equal(new DateTime(2023, 5, 31), fy2023Rows[0].ToDate);
        Assert.Equal(1.50m, fy2023Rows[0].TaxMultiplier);
        Assert.Equal(167.12m, fy2023Rows[0].BaseTaxAmount);
        Assert.Equal(new DateTime(2023, 6, 1), fy2023Rows[1].FromDate);
        Assert.Equal(new DateTime(2024, 3, 31), fy2023Rows[1].ToDate);
        Assert.Equal(1.00m, fy2023Rows[1].TaxMultiplier);
        Assert.Equal(835.62m, fy2023Rows[1].BaseTaxAmount);

        // A full year strictly after OC's onset year -- billed in full at 1.0x.
        var fy2024 = result.YearWiseBreakdown.Single(y => y.FinancialYear == "2024-25");
        Assert.Equal(1.00m, fy2024.TaxMultiplier);
        Assert.Equal(1000m, fy2024.BaseTaxAmount);

        // RetroYearCount counts distinct financial years (6: 2020-21..2025-26), not raw rows (7).
        Assert.Equal(6, result.RetroYearCount);
        Assert.Equal(7, result.YearWiseBreakdown.Count);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_CcThenOcMerge_SameFinanceYear_SplitsFromCcsOwnDateNotFyStart()
    {
        // CC and OC both land in the SAME finance year (2023-24), and it is also the earliest
        // chargeable year -- the CC portion must start from CC's own date (01-May), not that
        // year's 01-Apr FY-start, since nothing was chargeable before CC's own evidence date.
        const int propertyId = 302;
        var rule = new RetrospectiveRuleMasterEntity { Id = 11, RuleCode = "THA-11", RuleName = "CC then OC merge, same FY", PriorityNo = 1, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 11, EvidenceTypeId = CcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 11, RuleId = 11, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = CcEvidenceTypeId,
            RetrospectiveLimitType = "FIXED_CUTOFF_DATE", CutoffDate = new DateTime(2016, 4, 1),
            TaxCalculationMode = "CC_THEN_OC_MERGE", TaxMultiplier = 1.00m,
            SplitEndEvidenceTypeId = OcEvidenceTypeId,
            SplitMultiplier = 1.50m, AfterSplitMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
        };
        SetupRule(rule, evidenceConditions, action);

        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>
        {
            Certificate(propertyId, "CC", new DateTime(2023, 5, 1)),
            Certificate(propertyId, "OC", new DateTime(2023, 11, 1))
        }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, It.IsAny<int>()))
            .ReturnsAsync((int _, int year) => new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = year, TotalTaxAmount = 1000m });

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);
        var fy2023Rows = result!.YearWiseBreakdown.Where(y => y.FinancialYear == "2023-24").OrderBy(y => y.FromDate).ToList();
        Assert.Equal(2, fy2023Rows.Count);
        Assert.Equal(new DateTime(2023, 5, 1), fy2023Rows[0].FromDate);
        Assert.Equal(new DateTime(2023, 10, 31), fy2023Rows[0].ToDate);
        Assert.Equal(1.50m, fy2023Rows[0].TaxMultiplier);
        Assert.Equal(504.11m, fy2023Rows[0].BaseTaxAmount);
        Assert.Equal(new DateTime(2023, 11, 1), fy2023Rows[1].FromDate);
        Assert.Equal(new DateTime(2024, 3, 31), fy2023Rows[1].ToDate);
        Assert.Equal(1.00m, fy2023Rows[1].TaxMultiplier);
        Assert.Equal(416.44m, fy2023Rows[1].BaseTaxAmount);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_NoEvidenceAndNoFallbackRule_ReturnsNull()
    {
        const int propertyId = 400;
        _mockRuleRepository.Setup(r => r.GetQueryable()).Returns(new List<RetrospectiveRuleMasterEntity>().BuildMock());
        _mockEvidenceConditionRepository.Setup(r => r.GetQueryable()).Returns(new List<RetrospectiveRuleEvidenceConditionEntity>().BuildMock());
        _mockActionRepository.Setup(r => r.GetQueryable()).Returns(new List<RetrospectiveRuleActionEntity>().BuildMock());
        _mockDateConditionRepository.Setup(r => r.GetQueryable()).Returns(new List<RetrospectiveRuleDateConditionEntity>().BuildMock());
        _mockPenaltyRepository.Setup(r => r.GetQueryable()).Returns(new List<RetrospectivePenaltyRuleEntity>().BuildMock());
        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>().BuildMock());

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.Null(result);
        _mockCalculationRepository.Verify(r => r.AddAsync(It.IsAny<RetrospectiveTaxCalculationEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_NoEvidence_FallsBackToFallbackRule()
    {
        const int propertyId = 500;
        var fallbackRule = new RetrospectiveRuleMasterEntity { Id = 8, RuleCode = "THA-08", RuleName = "No evidence at all", PriorityNo = 99, IsFallbackRule = true, RuleStatus = "Active", IsActive = true };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 8, RuleId = 8, TaxStartMode = "CONSTRUCTION_YEAR",
            RetrospectiveLimitType = "NONE", TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
        };
        SetupRule(fallbackRule, new List<RetrospectiveRuleEvidenceConditionEntity>(), action);

        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>().BuildMock());
        _mockPropertyDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyDetailsEntity>
        {
            new() { PropertyId = propertyId, ConstructionYear = "2018", MarkedForDeletion = false }
        }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, It.IsAny<int>()))
            .ReturnsAsync((int _, int year) => new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = year, TotalTaxAmount = 100m });

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("THA-08", result!.AppliedRuleCode);
        Assert.Equal(new DateTime(2018, 4, 1), result.ChargeableStartDate);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_RuleRequiresConstructionYearAvailable_MatchesWhenConstructionYearIsSet()
    {
        // Regression test: evidence conditions requiring "Construction year AVAILABLE" (THA-08,
        // PCM-06, FUR-03's fallback rules) must actually be able to match — CONSTRUCTION_YEAR has
        // no certificate of its own, so it must be resolved from PropertyDetails.ConstructionYear.
        const int propertyId = 700;
        var rule = new RetrospectiveRuleMasterEntity { Id = 8, RuleCode = "THA-08", RuleName = "Construction year fallback", PriorityNo = 80, IsFallbackRule = true, RuleStatus = "Active", IsActive = true };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 8, EvidenceTypeId = 5, EvidenceState = "AVAILABLE", IsActive = true }, // CONSTRUCTION_YEAR
            new() { RuleId = 8, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "UNAVAILABLE", IsActive = true },
            new() { RuleId = 8, EvidenceTypeId = CcEvidenceTypeId, EvidenceState = "UNAVAILABLE", IsActive = true },
            new() { RuleId = 8, EvidenceTypeId = ElectricityEvidenceTypeId, EvidenceState = "UNAVAILABLE", IsActive = true },
            new() { RuleId = 8, EvidenceTypeId = ChangeDetectionEvidenceTypeId, EvidenceState = "UNAVAILABLE", IsActive = true },
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 8, RuleId = 8, TaxStartMode = "CONSTRUCTION_YEAR",
            RetrospectiveLimitType = "FIXED_CUTOFF_DATE", CutoffDate = new DateTime(2016, 4, 1),
            TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
        };
        _mockEvidenceTypeRepository.Setup(r => r.GetQueryable()).Returns(new List<EvidenceTypeMasterEntity>
        {
            new() { Id = OcEvidenceTypeId, EvidenceCode = "OC", IsActive = true },
            new() { Id = CcEvidenceTypeId, EvidenceCode = "CC", IsActive = true },
            new() { Id = ElectricityEvidenceTypeId, EvidenceCode = "ELECTRICITY", IsActive = true },
            new() { Id = ChangeDetectionEvidenceTypeId, EvidenceCode = "CHANGE_DETECTION", IsActive = true },
            new() { Id = 5, EvidenceCode = "CONSTRUCTION_YEAR", IsActive = true },
        }.BuildMock());
        SetupRule(rule, evidenceConditions, action);

        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>().BuildMock());
        _mockPropertyDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyDetailsEntity>
        {
            new() { PropertyId = propertyId, ConstructionYear = "2015", MarkedForDeletion = false }
        }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, It.IsAny<int>()))
            .ReturnsAsync((int _, int year) => new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = year, TotalTaxAmount = 100m });

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("THA-08", result!.AppliedRuleCode);
        // Construction year 2015 -> FY_start(2015) = 2015-04-01, floored at cutoff 2016-04-01 -> MAX wins.
        Assert.Equal(new DateTime(2016, 4, 1), result.ChargeableStartDate);
    }

    /// <summary>The no-certificate rule (OC, CC and electricity all unavailable, MAX_LOOK_BACK_DATE, no start evidence), run for property 710; returns the TransMast rows it wrote.</summary>
    private async Task<List<TransMastEntity>> RunNoCertificateRuleAsync(bool directRetroCodesSeeded, Func<int, decimal>? taxForYear = null)
    {
        const int propertyId = 710;
        var rule = new RetrospectiveRuleMasterEntity { Id = 21, RuleCode = "THA-11", RuleName = "No certificate", PriorityNo = 90, IsFallbackRule = true, RuleStatus = "Active", IsActive = true };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 21, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "UNAVAILABLE", IsActive = true },
            new() { RuleId = 21, EvidenceTypeId = CcEvidenceTypeId, EvidenceState = "UNAVAILABLE", IsActive = true },
            new() { RuleId = 21, EvidenceTypeId = ElectricityEvidenceTypeId, EvidenceState = "UNAVAILABLE", IsActive = true },
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 21, RuleId = 21, TaxStartMode = "MAX_LOOK_BACK_DATE", StartEvidenceTypeId = null,
            RetrospectiveLimitType = "MAXIMUM_YEARS", MaximumYears = 6,
            TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
        };
        SetupRule(rule, evidenceConditions, action);
        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>().BuildMock());
        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, It.IsAny<int>()))
            .ReturnsAsync((int _, int year) => new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = year, TotalTaxAmount = taxForYear?.Invoke(year) ?? 100m });
        _mockPolicyTaxDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PolicyTaxDetailsEntity>
        {
            new() { PropertyId = propertyId, PolicyCodeId = 99, TaxId = 1, TaxAmount = 100m, IsActive = true },
        }.BuildMock());

        var codes = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
        {
            ["OC"] = 101, ["PARTIAL_OC"] = 102, ["CC"] = 103, ["PARTIAL_CC"] = 104,
            ["ELECTRIC_BILL"] = 105, ["PARTIAL_ELECTRIC_BILL"] = 106, [PolicyCodes.NetTax] = 99
        };
        if (directRetroCodesSeeded)
        {
            codes[PolicyCodes.DirectRetro] = 107;
            codes[PolicyCodes.DirectRetroPartial] = 108;
        }

        _mockPolicyCodeLookup.Setup(s => s.GetExistingIdsAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>())).ReturnsAsync(codes);

        var added = new List<TransMastEntity>();
        _mockTransMastRepository
            .Setup(r => r.AddAsync(It.IsAny<TransMastEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TransMastEntity e, CancellationToken _) => { added.Add(e); return e; });

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("THA-11", result!.AppliedRuleCode);
        Assert.Equal(PolicyCodes.DirectRetro, result.YearWiseBreakdown.Select(y => y.PolicyFamily).Distinct().Single());
        return added;
    }

    [Fact]
    public async Task CalculateAndSaveAsync_RuleWithNoStartCertificate_IsBookedUnderDirectRetro_NotUnderElectricBill()
    {
        var rows = await RunNoCertificateRuleAsync(directRetroCodesSeeded: true);

        Assert.NotEmpty(rows);
        // 2019..2025 at 6 years back from FY2025: every year starts at 01-Apr, so the full DIRECT_RETRO code, never an electricity-bill code
        Assert.All(rows, tm => Assert.Equal(107, tm.PolicyCodeId));
        Assert.DoesNotContain(rows, tm => tm.PolicyCodeId is 105 or 106);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_RuleWithNoStartCertificate_StillWritesDemandWhereTheDirectRetroCodesAreNotSeededYet()
    {
        var rows = await RunNoCertificateRuleAsync(directRetroCodesSeeded: false);

        // an existing database without the two new PolicyCodeMaster rows keeps the previous behaviour instead of writing no demand
        Assert.NotEmpty(rows);
        Assert.All(rows, tm => Assert.Equal(105, tm.PolicyCodeId));
    }

    [Fact]
    public async Task CalculateAndSaveAsync_EveryYearHasNothingToBill_WritesNoZeroRows_AndLeavesTheNetTaxRowAlone()
    {
        var rows = await RunNoCertificateRuleAsync(directRetroCodesSeeded: true, taxForYear: _ => 0m);

        // the floors cannot be priced: no row of zero tax heads for any year, and no retro row replaces NETTAX
        Assert.Empty(rows);
        _mockTransMastRepository.Verify(r => r.AddAsync(It.IsAny<TransMastEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockPolicyTaxDetailsRepository.Verify(r => r.AddAsync(It.IsAny<PolicyTaxDetailsEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockTransMastRepository.Verify(r => r.UpdateAsync(It.IsAny<TransMastEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_AYearWithNothingToBill_IsSkipped_WhileTheOtherYearsAreWritten()
    {
        // current FY is 2025; 2022 prices at 0, every other year at 100
        var rows = await RunNoCertificateRuleAsync(directRetroCodesSeeded: true, taxForYear: year => year == 2022 ? 0m : 100m);

        Assert.NotEmpty(rows);
        Assert.DoesNotContain(rows, tm => tm.FinanceYearId == 2022); // the fixture's year master has Id = Year
        Assert.Contains(rows, tm => tm.FinanceYearId == 2021);
        Assert.Contains(rows, tm => tm.FinanceYearId == 2023);
        Assert.All(rows, tm => Assert.True(tm.TaxAmount > 0m));
    }
    [Fact]
    public async Task CalculateAndSaveAsync_DateValidationPenalty_AppliesPercentWhenConditionMet()
    {
        const int propertyId = 600;
        var rule = new RetrospectiveRuleMasterEntity { Id = 4, RuleCode = "PCM-04", RuleName = "Electricity only", PriorityNo = 1, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 4, EvidenceTypeId = ElectricityEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 4, RuleId = 4, TaxStartMode = "FY_START", StartEvidenceTypeId = ElectricityEvidenceTypeId,
            RetrospectiveLimitType = "MAXIMUM_YEARS", MaximumYears = 6,
            TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = "CURRENT_YEAR", IsActive = true
        };
        var penalty = new RetrospectivePenaltyRuleEntity
        {
            Id = 4, RuleId = 4, IsPenaltyApplicable = true, PenaltyMode = "DATE_VALIDATION",
            PenaltyPercent = 10m, PenaltyDateSourceType = "EVIDENCE_DATE", PenaltyDateEvidenceTypeId = ElectricityEvidenceTypeId,
            PenaltyDateCondition = "AFTER", CompareDate = new DateTime(2023, 3, 3), IsActive = true
        };
        SetupRule(rule, evidenceConditions, action, penalty: penalty);

        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>
        {
            Certificate(propertyId, "ELECTRIC_BILL", new DateTime(2024, 1, 1))
        }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, 2025))
            .ReturnsAsync(new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = 2025, TotalTaxAmount = 1000m });

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);
        Assert.False(result!.RequiresManualReview);
        Assert.All(result.YearWiseBreakdown, y =>
        {
            Assert.Equal(10m, y.PenaltyPercent);
            Assert.Equal(100m, y.PenaltyAmount); // 10% of 1000
        });
    }

    [Fact]
    public async Task CalculateAndSaveAsync_OcRuleForCurrentYear_PersistsPolicyTaxDetailsAndTransMastSplitAcrossNettaxTaxIds()
    {
        const int propertyId = 500;
        var rule = new RetrospectiveRuleMasterEntity { Id = 30, RuleCode = "THA-30", RuleName = "OC only, current year", PriorityNo = 1, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 30, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 30, RuleId = 30, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = OcEvidenceTypeId,
            RetrospectiveLimitType = "NONE", TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
        };
        SetupRule(rule, evidenceConditions, action);

        // OC dated exactly at this finance year's start -- a full, unprorated current year.
        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>
        {
            Certificate(propertyId, "OC", new DateTime(2025, 4, 1))
        }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, 2025))
            .ReturnsAsync(new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = 2025, TotalTaxAmount = 1000m });

        // Property's existing NETTAX rows -- 75%/25% weight split across two TaxIds.
        _mockPolicyTaxDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PolicyTaxDetailsEntity>
        {
            new() { PropertyId = propertyId, PolicyCodeId = 99, TaxId = 1, TaxAmount = 750m, IsActive = true },
            new() { PropertyId = propertyId, PolicyCodeId = 99, TaxId = 2, TaxAmount = 250m, IsActive = true },
        }.BuildMock());

        var yearMaster = new YearMasterEntity { Id = 777, Year = 2025 };
        _mockYearRepository.Setup(r => r.GetQueryable()).Returns(new List<YearMasterEntity> { yearMaster }.BuildMock());

        var addedPolicyTaxDetails = new List<PolicyTaxDetailsEntity>();
        _mockPolicyTaxDetailsRepository
            .Setup(r => r.AddAsync(It.IsAny<PolicyTaxDetailsEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyTaxDetailsEntity e, CancellationToken _) => { addedPolicyTaxDetails.Add(e); return e; });
        var addedTransMasts = new List<TransMastEntity>();
        _mockTransMastRepository
            .Setup(r => r.AddAsync(It.IsAny<TransMastEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TransMastEntity e, CancellationToken _) => { addedTransMasts.Add(e); return e; });

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);

        Assert.Equal(2, addedPolicyTaxDetails.Count);
        var pt1 = addedPolicyTaxDetails.Single(p => p.TaxId == 1);
        var pt2 = addedPolicyTaxDetails.Single(p => p.TaxId == 2);
        Assert.Equal(101, pt1.PolicyCodeId); // "OC" full code (not partial -- OC dated exactly at FY start)
        Assert.Equal(101, pt2.PolicyCodeId);
        Assert.Equal(750m, pt1.TaxAmount); // 1000 total * 75% weight
        Assert.Equal(250m, pt2.TaxAmount); // 1000 total * 25% weight

        Assert.Equal(2, addedTransMasts.Count);
        Assert.All(addedTransMasts, tm =>
        {
            Assert.Equal(777, tm.FinanceYearId);
            Assert.Equal("RV", tm.CalculationType);
        });
        Assert.Equal(750m, addedTransMasts.Single(tm => tm.TaxId == 1).TaxAmount);
        Assert.Equal(250m, addedTransMasts.Single(tm => tm.TaxId == 2).TaxAmount);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_OcRuleForCurrentYear_DeactivatesNetTaxTransMastRowAtSameKey()
    {
        const int propertyId = 501;
        var rule = new RetrospectiveRuleMasterEntity { Id = 31, RuleCode = "THA-31", RuleName = "OC only, current year", PriorityNo = 1, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 31, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 31, RuleId = 31, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = OcEvidenceTypeId,
            RetrospectiveLimitType = "NONE", TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
        };
        SetupRule(rule, evidenceConditions, action);

        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>
        {
            Certificate(propertyId, "OC", new DateTime(2025, 4, 1))
        }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, 2025))
            .ReturnsAsync(new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = 2025, TotalTaxAmount = 1000m });

        _mockPolicyTaxDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PolicyTaxDetailsEntity>
        {
            new() { PropertyId = propertyId, PolicyCodeId = 99, TaxId = 1, TaxAmount = 1000m, IsActive = true },
        }.BuildMock());

        var yearMaster = new YearMasterEntity { Id = 778, Year = 2025 };
        _mockYearRepository.Setup(r => r.GetQueryable()).Returns(new List<YearMasterEntity> { yearMaster }.BuildMock());

        // An existing, currently-active NETTAX TransMast row at the exact (FinanceYearId, TaxId)
        // key the certificate's OC row is about to occupy -- TransMast is the single-demand ledger,
        // so this must be removed (IsActive=false, MarkedForDeletion=true), not left active
        // alongside the new OC row.
        var existingNetTaxTransMast = new TransMastEntity
        {
            PropertyId = propertyId, FinanceYearId = 778, TaxId = 1, PolicyCodeId = 99,
            CalculationType = "RV", TaxAmount = 1000m, IsActive = true, MarkedForDeletion = false
        };
        _mockTransMastRepository.Setup(r => r.GetQueryable()).Returns(new List<TransMastEntity> { existingNetTaxTransMast }.BuildMock());
        _mockTransMastRepository
            .Setup(r => r.AddAsync(It.IsAny<TransMastEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TransMastEntity e, CancellationToken _) => e);

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);
        Assert.False(existingNetTaxTransMast.IsActive);
        Assert.True(existingNetTaxTransMast.MarkedForDeletion);
        Assert.NotNull(existingNetTaxTransMast.MarkedForDeletionDate);
        _mockTransMastRepository.Verify(r => r.UpdateAsync(existingNetTaxTransMast, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_NoExistingNetTax_CalculatesRvFirstThenWritesCertificateDemand()
    {
        const int propertyId = 502;
        var rule = new RetrospectiveRuleMasterEntity { Id = 32, RuleCode = "THA-32", RuleName = "OC only, current year", PriorityNo = 1, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 32, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 32, RuleId = 32, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = OcEvidenceTypeId,
            RetrospectiveLimitType = "NONE", TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
        };
        SetupRule(rule, evidenceConditions, action);

        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>
        {
            Certificate(propertyId, "OC", new DateTime(2025, 4, 1))
        }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, 2025))
            .ReturnsAsync(new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = 2025, TotalTaxAmount = 1000m });

        // NETTAX rows only appear once CalculateAndSaveAsync has "run" -- simulates a property whose
        // Rateable Value was never calculated before its certificate was applied.
        var netTaxRows = new List<PolicyTaxDetailsEntity>();
        _mockPolicyTaxDetailsRepository.Setup(r => r.GetQueryable()).Returns(() => netTaxRows.BuildMock());
        _mockRateableValueService
            .Setup(s => s.CalculateAndSaveAsync(propertyId, true))
            .ReturnsAsync(new RateableValueResponseDto { PropertyId = propertyId })
            .Callback(() => netTaxRows.Add(new PolicyTaxDetailsEntity { PropertyId = propertyId, PolicyCodeId = 99, TaxId = 1, TaxAmount = 1000m, IsActive = true }));

        var yearMaster = new YearMasterEntity { Id = 779, Year = 2025 };
        _mockYearRepository.Setup(r => r.GetQueryable()).Returns(new List<YearMasterEntity> { yearMaster }.BuildMock());

        var addedPolicyTaxDetails = new List<PolicyTaxDetailsEntity>();
        _mockPolicyTaxDetailsRepository
            .Setup(r => r.AddAsync(It.IsAny<PolicyTaxDetailsEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyTaxDetailsEntity e, CancellationToken _) => { addedPolicyTaxDetails.Add(e); return e; });
        _mockTransMastRepository
            .Setup(r => r.AddAsync(It.IsAny<TransMastEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TransMastEntity e, CancellationToken _) => e);

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);
        _mockRateableValueService.Verify(s => s.CalculateAndSaveAsync(propertyId, true), Times.Once);
        Assert.Single(addedPolicyTaxDetails);
        Assert.Equal(101, addedPolicyTaxDetails[0].PolicyCodeId);
        Assert.Equal(1000m, addedPolicyTaxDetails[0].TaxAmount);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_NoRuleMatches_DeactivatesStalePolicyTaxDetailsAndTransMast()
    {
        const int propertyId = 501;
        // No rules registered at all -- FindMatchingRuleAsync returns null.
        _mockRuleRepository.Setup(r => r.GetQueryable()).Returns(new List<RetrospectiveRuleMasterEntity>().BuildMock());
        _mockEvidenceConditionRepository.Setup(r => r.GetQueryable()).Returns(new List<RetrospectiveRuleEvidenceConditionEntity>().BuildMock());
        _mockActionRepository.Setup(r => r.GetQueryable()).Returns(new List<RetrospectiveRuleActionEntity>().BuildMock());
        _mockDateConditionRepository.Setup(r => r.GetQueryable()).Returns(new List<RetrospectiveRuleDateConditionEntity>().BuildMock());
        _mockPenaltyRepository.Setup(r => r.GetQueryable()).Returns(new List<RetrospectivePenaltyRuleEntity>().BuildMock());
        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>().BuildMock());

        // A stale row left over from a prior successful run under the OC-family policy code.
        var staleRow = new PolicyTaxDetailsEntity { PropertyId = propertyId, PolicyCodeId = 101, TaxId = 1, TaxAmount = 500m, IsActive = true };
        _mockPolicyTaxDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PolicyTaxDetailsEntity> { staleRow }.BuildMock());
        var staleTransMast = new TransMastEntity { PropertyId = propertyId, FinanceYearId = 777, CalculationType = "RV", TaxId = 1, PolicyCodeId = 101, TaxAmount = 500m, IsActive = true };
        _mockTransMastRepository.Setup(r => r.GetQueryable()).Returns(new List<TransMastEntity> { staleTransMast }.BuildMock());
        _mockYearRepository.Setup(r => r.GetQueryable()).Returns(new List<YearMasterEntity> { new() { Id = 777, Year = 2025 } }.BuildMock());

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.Null(result);
        Assert.False(staleRow.IsActive);
        Assert.True(staleRow.MarkedForDeletion);
        Assert.False(staleTransMast.IsActive);
        Assert.True(staleTransMast.MarkedForDeletion);
    }

    // ---- one run per property at a time ----------------------------------------------------------------------

    /// <summary>An OC-only rule and an OC certificate for each given property, priced at 1,000 a year.</summary>
    private void SetupOcOnlyRuleFor(params int[] propertyIds)
    {
        var rule = new RetrospectiveRuleMasterEntity { Id = 61, RuleCode = "THA-61", RuleName = "OC only, per-property gate", PriorityNo = 1, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 61, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 61, RuleId = 61, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = OcEvidenceTypeId,
            RetrospectiveLimitType = "NONE", TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
        };
        SetupRule(rule, evidenceConditions, action);

        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(
            propertyIds.Select(id => Certificate(id, "OC", new DateTime(2025, 4, 1))).ToList().BuildMock());
        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync((int propertyId, int year) => new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = year, TotalTaxAmount = 1000m });
    }

    /// <summary>
    /// Counts the runs that have started (every run begins by reading the evidence types) and parks the FIRST run
    /// inside its first SaveChanges until <c>releaseFirstRun</c> is called.
    /// </summary>
    private (Func<int> RunsStarted, Task FirstRunInside, Action ReleaseFirstRun) HoldFirstRunInsideItsFirstSave()
    {
        var started = 0;
        var saves = 0;
        var inside = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var release = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);

        var evidenceTypes = new List<EvidenceTypeMasterEntity>
        {
            new() { Id = OcEvidenceTypeId, EvidenceCode = "OC", IsActive = true },
            new() { Id = CcEvidenceTypeId, EvidenceCode = "CC", IsActive = true },
            new() { Id = ElectricityEvidenceTypeId, EvidenceCode = "ELECTRICITY", IsActive = true },
            new() { Id = ChangeDetectionEvidenceTypeId, EvidenceCode = "CHANGE_DETECTION", IsActive = true },
        };
        _mockEvidenceTypeRepository.Setup(r => r.GetQueryable()).Returns(() =>
        {
            Interlocked.Increment(ref started);
            return evidenceTypes.BuildMock();
        });
        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(async () =>
        {
            if (Interlocked.Increment(ref saves) == 1)
            {
                inside.SetResult();
                await release.Task;
            }

            return 1;
        });

        return (() => Volatile.Read(ref started), inside.Task, () => release.SetResult());
    }

    /// <summary>
    /// A database lock that writes what happens to a shared event log and can be held back, standing in for another
    /// process that is calculating the same property.
    /// </summary>
    private sealed class RecordingCalculationLock : IRetrospectiveCalculationLock
    {
        private readonly List<string> _events;

        public RecordingCalculationLock(List<string> events) => _events = events;

        /// <summary>When set, the lock is not granted until this completes.</summary>
        public TaskCompletionSource<bool>? HeldElsewhere { get; init; }

        public async Task<IAsyncDisposable> AcquireAsync(int propertyId, CancellationToken cancellationToken = default)
        {
            Record($"lock requested for {propertyId}");
            if (HeldElsewhere is not null)
            {
                await HeldElsewhere.Task;
            }

            Record($"lock granted for {propertyId}");
            return new Releaser(this);
        }

        private void Record(string text)
        {
            lock (_events)
            {
                _events.Add(text);
            }
        }

        private sealed class Releaser : IAsyncDisposable
        {
            private readonly RecordingCalculationLock _owner;

            public Releaser(RecordingCalculationLock owner) => _owner = owner;

            public ValueTask DisposeAsync()
            {
                _owner.Record("lock released");
                return ValueTask.CompletedTask;
            }
        }
    }

    /// <summary>Makes the evidence-type read (the first thing a run reads) show up in the event log as "read".</summary>
    private void LogReadsInto(List<string> events)
    {
        var evidenceTypes = new List<EvidenceTypeMasterEntity>
        {
            new() { Id = OcEvidenceTypeId, EvidenceCode = "OC", IsActive = true },
            new() { Id = CcEvidenceTypeId, EvidenceCode = "CC", IsActive = true },
            new() { Id = ElectricityEvidenceTypeId, EvidenceCode = "ELECTRICITY", IsActive = true },
            new() { Id = ChangeDetectionEvidenceTypeId, EvidenceCode = "CHANGE_DETECTION", IsActive = true },
        };
        _mockEvidenceTypeRepository.Setup(r => r.GetQueryable()).Returns(() =>
        {
            lock (events)
            {
                events.Add("read");
            }

            return evidenceTypes.BuildMock();
        });
    }

    [Fact]
    public void Constructor_WithoutADatabaseLock_Throws_TheEngineNeverRunsWithoutIt()
    {
        // The database lock is what keeps two hosts from calculating one property at once. An engine that could be built
        // without it would silently run with the in-process gate alone, which only excludes runs of the same process.
        var failure = Assert.Throws<ArgumentNullException>(() => CreateServiceWith(null!));

        Assert.Equal("calculationLock", failure.ParamName);
    }
    [Fact]
    public async Task CalculateAndSaveAsync_TakesTheDatabaseLockBeforeReadingAnythingAndReleasesItAfterTheRun()
    {
        // The in-process gate only serialises one process; the database lock is what keeps two API instances (or any
        // other host) from calculating the same property at once. It has to be held before the property's rows are
        // read and until the last write is saved.
        const int propertyId = 804;
        SetupOcOnlyRuleFor(propertyId);
        var events = new List<string>();
        LogReadsInto(events);
        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(() =>
        {
            lock (events)
            {
                events.Add("saved");
            }

            return 1;
        });
        var service = CreateService(new RecordingCalculationLock(events));

        var result = await service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal($"lock requested for {propertyId}", events[0]);
        Assert.Equal($"lock granted for {propertyId}", events[1]);
        Assert.Equal("read", events[2]);                       // the first read comes after the lock was granted
        Assert.Equal("lock released", events[^1]);             // and the lock goes only after everything was saved
        Assert.Equal(1, events.Count(e => e == "lock released"));
        Assert.Contains("saved", events);
        Assert.True(events.LastIndexOf("saved") < events.Count - 1);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_ReleasesTheDatabaseLockWhenTheRunFails()
    {
        const int propertyId = 805;
        SetupOcOnlyRuleFor(propertyId);
        var events = new List<string>();
        _mockRuleRepository.Setup(r => r.GetQueryable()).Throws(new InvalidOperationException("rule library unavailable"));
        var service = CreateService(new RecordingCalculationLock(events));

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None));

        Assert.Equal($"lock granted for {propertyId}", events[1]);
        Assert.Equal("lock released", events[^1]);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_WaitsWhileAnotherProcessHoldsTheDatabaseLock()
    {
        const int propertyId = 806;
        SetupOcOnlyRuleFor(propertyId);
        var events = new List<string>();
        LogReadsInto(events);
        var heldElsewhere = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        var service = CreateService(new RecordingCalculationLock(events) { HeldElsewhere = heldElsewhere });

        var run = service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);
        await Task.Delay(300);

        Assert.False(run.IsCompleted);
        Assert.DoesNotContain("read", events);                 // nothing is read while the lock is not granted

        heldElsewhere.SetResult(true);
        var result = await run.WaitAsync(TimeSpan.FromSeconds(10));

        Assert.NotNull(result);
        Assert.Contains("read", events);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_WithTheLockAlreadyHeld_DoesNotTakeItAgain_AndLeavesItToItsOwner()
    {
        // IRetrospectiveTaxRefresher holds the property's lock around the RV recalculation AND the engine run and hands
        // it to the engine. The lock is not re-entrant: an engine that took the in-process gate again would wait for
        // itself forever.
        const int propertyId = 807;
        SetupOcOnlyRuleFor(propertyId);
        var events = new List<string>();
        LogReadsInto(events);
        var service = CreateService(new RecordingCalculationLock(events));
        await using var held = await PropertyCalculationLock.AcquireAsync(propertyId, new AlwaysGrantedCalculationLock(), CancellationToken.None);

        var result = await service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, held, CancellationToken.None)
            .WaitAsync(TimeSpan.FromSeconds(10));

        Assert.NotNull(result);
        Assert.Contains("read", events);
        Assert.DoesNotContain(events, e => e.StartsWith("lock requested")); // not the database lock either
        Assert.True(held.IsHeld);                                           // the owner releases it, not the engine
        Assert.True(PerPropertyGate.IsTracked(propertyId));
    }

    [Fact]
    public async Task CalculateAndSaveAsync_WithTheLockAlreadyHeld_ReleasesNothingWhenTheRunFails()
    {
        const int propertyId = 808;
        SetupOcOnlyRuleFor(propertyId);
        _mockRuleRepository.Setup(r => r.GetQueryable()).Throws(new InvalidOperationException("rule library unavailable"));
        await using var held = await PropertyCalculationLock.AcquireAsync(propertyId, new AlwaysGrantedCalculationLock(), CancellationToken.None);

        // (a run that took the lock again would wait for itself: fail instead of hanging)
        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, held, CancellationToken.None)
            .WaitAsync(TimeSpan.FromSeconds(10)));

        Assert.True(held.IsHeld);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_WithTheLockOfAnotherProperty_Throws()
    {
        const int propertyId = 809;
        await using var heldForAnotherProperty = await PropertyCalculationLock.AcquireAsync(propertyId + 1, new AlwaysGrantedCalculationLock(), CancellationToken.None);

        var failure = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, heldForAnotherProperty, CancellationToken.None));

        Assert.Contains((propertyId + 1).ToString(), failure.Message);
        Assert.Contains(propertyId.ToString(), failure.Message);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_WithAReleasedLock_Throws()
    {
        // a lock that has been released protects nothing: running on it would be running unprotected
        const int propertyId = 810;
        var released = await PropertyCalculationLock.AcquireAsync(propertyId, new AlwaysGrantedCalculationLock(), CancellationToken.None);
        await released.DisposeAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, released, CancellationToken.None));
    }

    [Fact]
    public async Task CalculateAndSaveAsync_WithoutALockObject_Throws()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(
            () => _service.CalculateAndSaveAsync(811, calculatedBy: 9, (IRetrospectivePropertyLock)null!, CancellationToken.None));
    }
    [Fact]
    public async Task CalculateAndSaveAsync_TwoRunsForTheSameProperty_RunOneAfterTheOther()
    {
        // Two overlapping runs for one property each read their own snapshot of its TransMast rows and each
        // deactivates only what ITS snapshot shows, so a CC row written by one and an OC row written by the other
        // could both stay active (double demand). The second run has to start from what the first one saved.
        const int propertyId = 801;
        SetupOcOnlyRuleFor(propertyId);
        var (runsStarted, firstRunInside, releaseFirstRun) = HoldFirstRunInsideItsFirstSave();

        var first = _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);
        await firstRunInside.WaitAsync(TimeSpan.FromSeconds(10));

        var second = _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);
        await Task.Delay(300);

        Assert.Equal(1, runsStarted());      // the second run has not read anything yet
        Assert.False(second.IsCompleted);

        releaseFirstRun();
        await Task.WhenAll(first, second).WaitAsync(TimeSpan.FromSeconds(10));
        Assert.Equal(2, runsStarted());
    }

    [Fact]
    public async Task CalculateAndSaveAsync_RunsForDifferentProperties_DoNotWaitForEachOther()
    {
        const int busyProperty = 802;
        const int otherProperty = busyProperty + 256; // a lock keyed by a hash of the id could map these two together
        SetupOcOnlyRuleFor(busyProperty, otherProperty);
        var (_, firstRunInside, releaseFirstRun) = HoldFirstRunInsideItsFirstSave();

        var first = _service.CalculateAndSaveAsync(busyProperty, calculatedBy: 9, CancellationToken.None);
        await firstRunInside.WaitAsync(TimeSpan.FromSeconds(10));

        var other = _service.CalculateAndSaveAsync(otherProperty, calculatedBy: 9, CancellationToken.None);
        var finishedWhileTheFirstRunIsHeld = await Task.WhenAny(other, Task.Delay(TimeSpan.FromSeconds(5))) == other;

        Assert.True(finishedWhileTheFirstRunIsHeld, $"a run for property {otherProperty} must not wait for the run that holds property {busyProperty}");

        releaseFirstRun();
        await first.WaitAsync(TimeSpan.FromSeconds(10));
    }

    [Fact]
    public async Task CalculateAndSaveAsync_FamilySwitchesFromCcToOc_DeactivatesStaleCcRowInsteadOfLeavingBothActive()
    {
        // Regression guard for a real production bug in the retired engine: PolicyTaxDetails'
        // unique index is on (PropertyId, PolicyCodeId, TaxId), not (PropertyId, TaxId) -- so a
        // property whose governing family changed (e.g. CC certificate replaced by OC) could end up
        // with TWO active rows for the same TaxId under two different PolicyCodeIds if the old
        // family's row was never explicitly deactivated. This run's OC rule must both write the new
        // OC row AND deactivate the stale CC row for the same TaxId.
        const int propertyId = 502;
        var rule = new RetrospectiveRuleMasterEntity { Id = 31, RuleCode = "THA-31", RuleName = "OC only, family switch", PriorityNo = 1, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 31, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 31, RuleId = 31, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = OcEvidenceTypeId,
            RetrospectiveLimitType = "NONE", TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
        };
        SetupRule(rule, evidenceConditions, action);

        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>
        {
            Certificate(propertyId, "OC", new DateTime(2025, 4, 1))
        }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, 2025))
            .ReturnsAsync(new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = 2025, TotalTaxAmount = 1000m });

        // NETTAX row this run needs to split across.
        var nettaxRow = new PolicyTaxDetailsEntity { PropertyId = propertyId, PolicyCodeId = 99, TaxId = 1, TaxAmount = 1000m, IsActive = true };
        // Stale row left over from a PRIOR run under the CC family (PolicyCodeId 103), same TaxId.
        var staleCcRow = new PolicyTaxDetailsEntity { PropertyId = propertyId, PolicyCodeId = 103, TaxId = 1, TaxAmount = 1000m, IsActive = true };
        _mockPolicyTaxDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PolicyTaxDetailsEntity> { nettaxRow, staleCcRow }.BuildMock());
        _mockYearRepository.Setup(r => r.GetQueryable()).Returns(new List<YearMasterEntity> { new() { Id = 777, Year = 2025 } }.BuildMock());

        var addedPolicyTaxDetails = new List<PolicyTaxDetailsEntity>();
        _mockPolicyTaxDetailsRepository
            .Setup(r => r.AddAsync(It.IsAny<PolicyTaxDetailsEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyTaxDetailsEntity e, CancellationToken _) => { addedPolicyTaxDetails.Add(e); return e; });

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);

        // New OC row was added for TaxId 1.
        var newOcRow = Assert.Single(addedPolicyTaxDetails);
        Assert.Equal(101, newOcRow.PolicyCodeId); // OC full code
        Assert.Equal(1, newOcRow.TaxId);
        Assert.Equal(1000m, newOcRow.TaxAmount);

        // The stale CC row for the SAME TaxId is deactivated, not left active alongside the new one.
        Assert.False(staleCcRow.IsActive);
        Assert.True(staleCcRow.MarkedForDeletion);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_SameFamilyRerun_KeepsTheExistingTransMastRowActiveAndUpdatesIt()
    {
        // Guard against over-deactivation: re-running with the SAME family at the same year and tax must
        // reuse the existing TransMast row (updated amount, still active), not retire it or add a second one.
        const int propertyId = 504;
        var rule = new RetrospectiveRuleMasterEntity { Id = 34, RuleCode = "THA-34", RuleName = "OC only, TransMast re-run", PriorityNo = 1, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 34, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 34, RuleId = 34, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = OcEvidenceTypeId,
            RetrospectiveLimitType = "NONE", TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
        };
        SetupRule(rule, evidenceConditions, action);

        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>
        {
            Certificate(propertyId, "OC", new DateTime(2025, 4, 1))
        }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, 2025))
            .ReturnsAsync(new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = 2025, TotalTaxAmount = 1000m });

        _mockPolicyTaxDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PolicyTaxDetailsEntity>
        {
            new() { PropertyId = propertyId, PolicyCodeId = 99, TaxId = 1, TaxAmount = 1000m, IsActive = true },
        }.BuildMock());

        const int yearMasterId = 781;
        _mockYearRepository.Setup(r => r.GetQueryable()).Returns(new List<YearMasterEntity> { new() { Id = yearMasterId, Year = 2025 } }.BuildMock());

        var existingOcTransMast = new TransMastEntity
        {
            PropertyId = propertyId, FinanceYearId = yearMasterId, TaxId = 1, PolicyCodeId = 101,
            CalculationType = "RV", TaxAmount = 400m, IsActive = true, MarkedForDeletion = false
        };
        _mockTransMastRepository.Setup(r => r.GetQueryable()).Returns(new List<TransMastEntity> { existingOcTransMast }.BuildMock());
        var addedTransMasts = new List<TransMastEntity>();
        _mockTransMastRepository
            .Setup(r => r.AddAsync(It.IsAny<TransMastEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TransMastEntity e, CancellationToken _) => { addedTransMasts.Add(e); return e; });

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Empty(addedTransMasts);
        Assert.True(existingOcTransMast.IsActive);
        Assert.False(existingOcTransMast.MarkedForDeletion);
        Assert.Equal(1000m, existingOcTransMast.TaxAmount);
    }

    [Theory]
    [InlineData(103, "2025-04-01", 101)] // stale CC (full year)    -> OC (full year)
    [InlineData(104, "2025-07-27", 102)] // stale PARTIAL_CC        -> PARTIAL_OC (OC dated inside the year)
    public async Task CalculateAndSaveAsync_FamilySwitchesFromCcToOc_DeactivatesTheStaleCcTransMastRowAtTheSameYearAndTax(
        int staleCcPolicyCodeId, string ocDate, int expectedOcPolicyCodeId)
    {
        // Regression guard: a unit gets its CC certificate first (CC rows) and the OC certificate later
        // (OC rows) for the SAME finance year and tax. The CC row used to stay active next to the new OC
        // row because the clean-up only compared (FinanceYearId, TaxId), so TransMast counted the retro
        // demand twice. PolicyTaxDetails was already handled; this is the TransMast side.
        const int propertyId = 503;
        var rule = new RetrospectiveRuleMasterEntity { Id = 33, RuleCode = "THA-33", RuleName = "OC only, TransMast family switch", PriorityNo = 1, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 33, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 33, RuleId = 33, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = OcEvidenceTypeId,
            RetrospectiveLimitType = "NONE", TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
        };
        SetupRule(rule, evidenceConditions, action);

        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>
        {
            Certificate(propertyId, "OC", DateTime.ParseExact(ocDate, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture))
        }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, 2025))
            .ReturnsAsync(new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = 2025, TotalTaxAmount = 1000m });

        _mockPolicyTaxDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PolicyTaxDetailsEntity>
        {
            new() { PropertyId = propertyId, PolicyCodeId = 99, TaxId = 1, TaxAmount = 1000m, IsActive = true },
        }.BuildMock());

        const int yearMasterId = 780;
        _mockYearRepository.Setup(r => r.GetQueryable()).Returns(new List<YearMasterEntity> { new() { Id = yearMasterId, Year = 2025 } }.BuildMock());

        // Left over from an earlier run under the CC family: same property, finance year and tax.
        var staleCcTransMast = new TransMastEntity
        {
            PropertyId = propertyId, FinanceYearId = yearMasterId, TaxId = 1, PolicyCodeId = staleCcPolicyCodeId,
            CalculationType = "RV", TaxAmount = 1000m, IsActive = true, MarkedForDeletion = false
        };
        _mockTransMastRepository.Setup(r => r.GetQueryable()).Returns(new List<TransMastEntity> { staleCcTransMast }.BuildMock());
        var addedTransMasts = new List<TransMastEntity>();
        _mockTransMastRepository
            .Setup(r => r.AddAsync(It.IsAny<TransMastEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TransMastEntity e, CancellationToken _) => { addedTransMasts.Add(e); return e; });

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);
        var newOcTransMast = Assert.Single(addedTransMasts);
        Assert.Equal(expectedOcPolicyCodeId, newOcTransMast.PolicyCodeId);
        Assert.Equal(yearMasterId, newOcTransMast.FinanceYearId);

        // The CC row at the same year and tax must not stay active next to the new OC row.
        Assert.False(staleCcTransMast.IsActive);
        Assert.True(staleCcTransMast.MarkedForDeletion);
        Assert.NotNull(staleCcTransMast.MarkedForDeletionDate);
        _mockTransMastRepository.Verify(r => r.UpdateAsync(staleCcTransMast, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_NetTaxOldArrearsAndStaleFamilyRowsAtOneKey_LeaveExactlyOneLiveDemandForThatYearAndTax()
    {
        // The TransMast unique index includes PolicyCodeId, so the database itself lets a NETTAX row, an
        // OLD_ARREARS row, a stale CC row and the new OC row at one (property, year, tax) all be live at the
        // same time. Readers sum every live row, so the engine has to leave exactly one: the new OC row.
        const int propertyId = 505;
        const int oldArrearsPolicyCodeId = 999;
        var rule = new RetrospectiveRuleMasterEntity { Id = 35, RuleCode = "THA-35", RuleName = "OC only, one live demand", PriorityNo = 1, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 35, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 35, RuleId = 35, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = OcEvidenceTypeId,
            RetrospectiveLimitType = "NONE", TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
        };
        SetupRule(rule, evidenceConditions, action);

        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>
        {
            Certificate(propertyId, "OC", new DateTime(2025, 4, 1))
        }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, 2025))
            .ReturnsAsync(new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = 2025, TotalTaxAmount = 1000m });

        _mockPolicyTaxDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PolicyTaxDetailsEntity>
        {
            new() { PropertyId = propertyId, PolicyCodeId = 99, TaxId = 1, TaxAmount = 1000m, IsActive = true },
        }.BuildMock());

        const int yearMasterId = 782;
        _mockYearRepository.Setup(r => r.GetQueryable()).Returns(new List<YearMasterEntity> { new() { Id = yearMasterId, Year = 2025 } }.BuildMock());

        _mockPolicyCodeLookup.Setup(s => s.GetExistingIdsAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
            {
                ["OC"] = 101, ["PARTIAL_OC"] = 102, ["CC"] = 103, ["PARTIAL_CC"] = 104,
                ["ELECTRIC_BILL"] = 105, ["PARTIAL_ELECTRIC_BILL"] = 106,
                [PolicyCodes.NetTax] = 99,
                [PolicyCodes.OldArrears] = oldArrearsPolicyCodeId
            });

        // Three live rows at the same property / year / tax, each under a different policy code.
        var existingLedger = new List<TransMastEntity>
        {
            new() { PropertyId = propertyId, FinanceYearId = yearMasterId, TaxId = 1, PolicyCodeId = 99, CalculationType = "RV", TaxAmount = 1000m, IsActive = true, MarkedForDeletion = false },
            new() { PropertyId = propertyId, FinanceYearId = yearMasterId, TaxId = 1, PolicyCodeId = oldArrearsPolicyCodeId, CalculationType = "RV", TaxAmount = 20000m, IsActive = true, MarkedForDeletion = false },
            new() { PropertyId = propertyId, FinanceYearId = yearMasterId, TaxId = 1, PolicyCodeId = 103, CalculationType = "RV", TaxAmount = 1000m, IsActive = true, MarkedForDeletion = false },
        };
        _mockTransMastRepository.Setup(r => r.GetQueryable()).Returns(existingLedger.BuildMock());
        var addedTransMasts = new List<TransMastEntity>();
        _mockTransMastRepository
            .Setup(r => r.AddAsync(It.IsAny<TransMastEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TransMastEntity e, CancellationToken _) => { addedTransMasts.Add(e); return e; });

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);
        var liveDemand = existingLedger.Concat(addedTransMasts).Where(tm => tm.IsActive && !tm.MarkedForDeletion).ToList();
        var onlyLiveRow = Assert.Single(liveDemand);
        Assert.Equal(101, onlyLiveRow.PolicyCodeId); // the new OC row
        Assert.Equal(yearMasterId, onlyLiveRow.FinanceYearId);
        Assert.Equal(1, onlyLiveRow.TaxId);
    }

    [Theory]
    [InlineData(false)] // no head is exempt
    [InlineData(true)]  // the education head (TaxId 2) is exempt for the property
    public async Task CalculateAndSaveAsync_NetTaxHasATaxTotalRow_SplitsTheYearAcrossTheHeadsAndWritesTaxTotalAsTheirSum(bool educationExempt)
    {
        // NETTAX holds the tax heads AND a TAXTOTAL row (the head amounts added up). TAXTOTAL must not be one of
        // the weighted rows: it used to take half of the year's total and leave the heads the other half, so
        // the readers that sum the TAXTOTAL rows as the retro demand showed half of the real amount.
        //
        // The year's total comes from the rate preview, which has already charged an exempt tax as zero: with the
        // education head (300 of 1,000) exempt the preview total is 1,400, not 2,000. The persisted NETTAX heads
        // are deliberately still the old, positive ones (the exemption was added after the last RV run), so the
        // exempt head must take no part in the split, and the written TAXTOTAL must equal the preview total.
        const int propertyId = 506;
        var previewTotal = educationExempt ? 1400m : 2000m;
        var rule = new RetrospectiveRuleMasterEntity { Id = 36, RuleCode = "THA-36", RuleName = "OC only, TAXTOTAL row", PriorityNo = 1, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 36, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 36, RuleId = 36, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = OcEvidenceTypeId,
            RetrospectiveLimitType = "NONE", TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
        };
        SetupRule(rule, evidenceConditions, action);

        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>
        {
            Certificate(propertyId, "OC", new DateTime(2025, 4, 1))
        }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, 2025))
            .ReturnsAsync(new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = 2025, TotalTaxAmount = previewTotal });

        // Heads 600 / 300 / 100 (weights 60% / 30% / 10%) and the TAXTOTAL row, which is their sum.
        _mockPolicyTaxDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PolicyTaxDetailsEntity>
        {
            new() { PropertyId = propertyId, PolicyCodeId = 99, TaxId = 1, TaxAmount = 600m, IsActive = true, TaxMaster = new TaxMasterEntity { TaxCode = "GEN" } },
            new() { PropertyId = propertyId, PolicyCodeId = 99, TaxId = 2, TaxAmount = 300m, IsActive = true, TaxMaster = new TaxMasterEntity { TaxCode = "STATE_EDU" } },
            new() { PropertyId = propertyId, PolicyCodeId = 99, TaxId = 3, TaxAmount = 100m, IsActive = true, TaxMaster = new TaxMasterEntity { TaxCode = "TREE" } },
            new() { PropertyId = propertyId, PolicyCodeId = 99, TaxId = 4, TaxAmount = 1000m, IsActive = true, TaxMaster = new TaxMasterEntity { TaxCode = "TAXTOTAL" } },
        }.BuildMock());

        if (educationExempt)
        {
            _mockTaxApplicabilityService
                .Setup(s => s.GetExemptedTaxIdsAsync(propertyId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new HashSet<int> { 2 });
        }

        const int yearMasterId = 783;
        _mockYearRepository.Setup(r => r.GetQueryable()).Returns(new List<YearMasterEntity> { new() { Id = yearMasterId, Year = 2025 } }.BuildMock());

        var addedPolicyTaxDetails = new List<PolicyTaxDetailsEntity>();
        _mockPolicyTaxDetailsRepository
            .Setup(r => r.AddAsync(It.IsAny<PolicyTaxDetailsEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyTaxDetailsEntity e, CancellationToken _) => { addedPolicyTaxDetails.Add(e); return e; });
        var addedTransMasts = new List<TransMastEntity>();
        _mockTransMastRepository
            .Setup(r => r.AddAsync(It.IsAny<TransMastEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TransMastEntity e, CancellationToken _) => { addedTransMasts.Add(e); return e; });

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);

        // Exempt: the whole 1,400 goes to the two charged heads in their 600 : 100 ratio (the exempt head keeps a 0 row);
        // either way TAXTOTAL is the preview's year total.
        var expectedByTaxId = educationExempt
            ? new Dictionary<int, decimal> { [1] = 1200m, [2] = 0m, [3] = 200m, [4] = 1400m }   // TAXTOTAL = 1200 + 0 + 200 = the preview total
            : new Dictionary<int, decimal> { [1] = 1200m, [2] = 600m, [3] = 200m, [4] = 2000m }; // TAXTOTAL = the year's total

        Assert.Equal(4, addedPolicyTaxDetails.Count);
        Assert.Equal(4, addedTransMasts.Count);
        foreach (var (taxId, amount) in expectedByTaxId)
        {
            Assert.Equal(amount, addedPolicyTaxDetails.Single(p => p.TaxId == taxId).TaxAmount);
            Assert.Equal(amount, addedTransMasts.Single(tm => tm.TaxId == taxId).TaxAmount);
        }

        // TAXTOTAL is exactly the sum of the heads, and the sum of the heads is the year's demand from the preview:
        // an exemption must not take anything off it a second time.
        Assert.Equal(addedTransMasts.Where(tm => tm.TaxId != 4).Sum(tm => tm.TaxAmount), addedTransMasts.Single(tm => tm.TaxId == 4).TaxAmount);
        Assert.Equal(previewTotal, addedTransMasts.Single(tm => tm.TaxId == 4).TaxAmount);
    }

    [Theory]
    [InlineData(22018.28, 24464.76, 22018.28, 24464.76)] // the preview carries the year's RV and ALV
    [InlineData(0, 0, 0, 0)]                              // a year priced at a genuinely zero RV keeps zero -- not the current NETTAX RV (7777)
    public async Task CalculateAndSaveAsync_RetroRows_CarryTheRateableValueAndAnnualRentalValueAndNotTheTaxAmount(
        double previewRv, double previewAlv, double expectedRv, double expectedAlv)
    {
        // The readers of TransMast / PolicyTaxDetails take the property's RV and ALV from CalculationValue /
        // CalculationAnnualValue of the live row (property comparison cards, search, QC screens, the rule
        // context's building totals). The retro rows used to store the TAX AMOUNT in CalculationValue and
        // nothing in CalculationAnnualValue, so once a retro row replaced the NETTAX row the RV card showed a
        // tax amount and the ALV card 0.
        const int propertyId = 507;
        var rule = new RetrospectiveRuleMasterEntity { Id = 37, RuleCode = "THA-37", RuleName = "OC only, RV and ALV on the rows", PriorityNo = 1, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 37, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 37, RuleId = 37, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = OcEvidenceTypeId,
            RetrospectiveLimitType = "NONE", TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
        };
        SetupRule(rule, evidenceConditions, action);

        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>
        {
            Certificate(propertyId, "OC", new DateTime(2025, 4, 1))
        }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, 2025))
            .ReturnsAsync(new RetrospectiveRatePreviewDto
            {
                PropertyId = propertyId, FinanceYear = 2025, TotalTaxAmount = 1000m,
                TotalRateableValue = (decimal)previewRv, TotalAnnualRentalValue = (decimal)previewAlv
            });

        // NETTAX rows carry the property's CURRENT RV in CalculationValue (7777). The retro rows carry the RV the year
        // was priced on, so when the preview says 0 they must say 0, not 7777.
        _mockPolicyTaxDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PolicyTaxDetailsEntity>
        {
            new() { PropertyId = propertyId, PolicyCodeId = 99, TaxId = 1, TaxAmount = 750m, CalculationValue = 7777m, IsActive = true },
            new() { PropertyId = propertyId, PolicyCodeId = 99, TaxId = 2, TaxAmount = 250m, CalculationValue = 7777m, IsActive = true },
        }.BuildMock());

        const int yearMasterId = 784;
        _mockYearRepository.Setup(r => r.GetQueryable()).Returns(new List<YearMasterEntity> { new() { Id = yearMasterId, Year = 2025 } }.BuildMock());

        // A row written by an earlier run with the old behaviour (tax amount as the value, no ALV): it must be corrected.
        var existingOcRow = new TransMastEntity
        {
            PropertyId = propertyId, FinanceYearId = yearMasterId, TaxId = 1, PolicyCodeId = 101,
            CalculationType = "RV", CalculationValue = 400m, CalculationAnnualValue = null, TaxAmount = 400m, IsActive = true, MarkedForDeletion = false
        };
        _mockTransMastRepository.Setup(r => r.GetQueryable()).Returns(new List<TransMastEntity> { existingOcRow }.BuildMock());

        var addedPolicyTaxDetails = new List<PolicyTaxDetailsEntity>();
        _mockPolicyTaxDetailsRepository
            .Setup(r => r.AddAsync(It.IsAny<PolicyTaxDetailsEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyTaxDetailsEntity e, CancellationToken _) => { addedPolicyTaxDetails.Add(e); return e; });
        var addedTransMasts = new List<TransMastEntity>();
        _mockTransMastRepository
            .Setup(r => r.AddAsync(It.IsAny<TransMastEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TransMastEntity e, CancellationToken _) => { addedTransMasts.Add(e); return e; });

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 9, CancellationToken.None);

        Assert.NotNull(result);

        // Inserted rows: tax amounts split 75 / 25, RV and ALV on every row.
        var newTaxId2 = Assert.Single(addedTransMasts);
        Assert.Equal(2, newTaxId2.TaxId);
        Assert.Equal(250m, newTaxId2.TaxAmount);
        Assert.Equal((decimal)expectedRv, newTaxId2.CalculationValue);
        Assert.Equal((decimal)expectedAlv, newTaxId2.CalculationAnnualValue);

        // Updated row: amount 750, and the wrong value from the earlier run replaced by the RV / ALV.
        Assert.Equal(750m, existingOcRow.TaxAmount);
        Assert.Equal((decimal)expectedRv, existingOcRow.CalculationValue);
        Assert.Equal((decimal)expectedAlv, existingOcRow.CalculationAnnualValue);

        Assert.Equal(2, addedPolicyTaxDetails.Count);
        Assert.Equal(750m, addedPolicyTaxDetails.Single(p => p.TaxId == 1).TaxAmount);
        Assert.Equal(250m, addedPolicyTaxDetails.Single(p => p.TaxId == 2).TaxAmount);
        Assert.All(addedPolicyTaxDetails, p => Assert.Equal((decimal)expectedRv, p.CalculationValue));
    }

    [Fact]
    public async Task CalculateAndSaveAsync_MaximumYears_WithoutConfiguration_ThrowsInvalidOperationException()
    {
        const int propertyId = 701;
        var rule = new RetrospectiveRuleMasterEntity
        {
            Id = 41,
            RuleCode = "THA-41",
            RuleName = "Unconfigured Max Years Rule",
            PriorityNo = 1,
            IsFallbackRule = false,
            RuleStatus = "Active",
            IsActive = true,
            LegalCapEnabled = false,
            LegalCapYears = 0
        };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 41, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 41,
            RuleId = 41,
            TaxStartMode = "EVIDENCE_DATE",
            StartEvidenceTypeId = OcEvidenceTypeId,
            RetrospectiveLimitType = "MAXIMUM_YEARS",
            MaximumYears = null, // Misconfigured!
            TaxCalculationMode = "SINGLE",
            TaxMultiplier = 1.00m,
            RateMode = "YEAR_WISE",
            IsActive = true
        };
        SetupRule(rule, evidenceConditions, action);

        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>
        {
            Certificate(propertyId, "OC", new DateTime(2020, 1, 1))
        }.BuildMock());

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.CalculateAndSaveAsync(propertyId, calculatedBy: 1, CancellationToken.None));

        Assert.Contains("MAXIMUM_YEARS", ex.Message);
        Assert.Contains("neither MaximumYears nor a valid LegalCapYears is configured", ex.Message);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_MissingNetTaxPolicyCode_ThrowsInvalidOperationException()
    {
        const int propertyId = 702;
        var rule = new RetrospectiveRuleMasterEntity
        {
            Id = 42,
            RuleCode = "THA-42",
            RuleName = "NetTax Missing Rule",
            PriorityNo = 1,
            IsFallbackRule = false,
            RuleStatus = "Active",
            IsActive = true
        };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = 42, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = 42,
            RuleId = 42,
            TaxStartMode = "EVIDENCE_DATE",
            StartEvidenceTypeId = OcEvidenceTypeId,
            RetrospectiveLimitType = "NONE",
            TaxCalculationMode = "SINGLE",
            TaxMultiplier = 1.00m,
            RateMode = "YEAR_WISE",
            IsActive = true
        };
        SetupRule(rule, evidenceConditions, action);

        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>
        {
            Certificate(propertyId, "OC", new DateTime(2025, 4, 1))
        }.BuildMock());

        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, 2025))
            .ReturnsAsync(new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = 2025, TotalTaxAmount = 500m });

        _mockPolicyCodeLookup
            .Setup(s => s.GetIdAsync(PolicyCodes.NetTax, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("No active PTIS.PolicyCodeMaster row found for policy code 'NETTAX'."));

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.CalculateAndSaveAsync(propertyId, calculatedBy: 1, CancellationToken.None));

        Assert.Contains("NETTAX", ex.Message);
    }

    /// <summary>An OC-only rule starting at the OC date, so the years charged are the OC year up to the current finance year (2025).</summary>
    private void ArrangeOcOnlyRuleWithNetTax(int propertyId, int ruleId, DateTime ocDate)
    {
        var rule = new RetrospectiveRuleMasterEntity { Id = ruleId, RuleCode = $"THA-{ruleId}", RuleName = "OC only", PriorityNo = 1, IsFallbackRule = false, RuleStatus = "Active", IsActive = true };
        var evidenceConditions = new List<RetrospectiveRuleEvidenceConditionEntity>
        {
            new() { RuleId = ruleId, EvidenceTypeId = OcEvidenceTypeId, EvidenceState = "AVAILABLE", IsActive = true }
        };
        var action = new RetrospectiveRuleActionEntity
        {
            Id = ruleId, RuleId = ruleId, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = OcEvidenceTypeId,
            RetrospectiveLimitType = "NONE", TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
        };
        SetupRule(rule, evidenceConditions, action);

        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>
        {
            Certificate(propertyId, "OC", ocDate)
        }.BuildMock());
        _mockRateableValueService
            .Setup(s => s.PreviewTotalTaxAsync(propertyId, It.IsAny<int>()))
            .ReturnsAsync((int _, int year) => new RetrospectiveRatePreviewDto { PropertyId = propertyId, FinanceYear = year, TotalTaxAmount = 500m });
        var nettaxRow = new PolicyTaxDetailsEntity { PropertyId = propertyId, PolicyCodeId = 99, TaxId = 1, TaxAmount = 500m, IsActive = true };
        _mockPolicyTaxDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PolicyTaxDetailsEntity> { nettaxRow }.BuildMock());
    }

    [Fact]
    public async Task CalculateAndSaveAsync_MissingCurrentYearMaster_ThrowsAndWritesNothing()
    {
        const int propertyId = 703;
        ArrangeOcOnlyRuleWithNetTax(propertyId, ruleId: 43, ocDate: new DateTime(2025, 4, 1));
        // the year master has every year but the current finance year (2025)
        _mockYearRepository.Setup(r => r.GetQueryable()).Returns(CompleteYearMasters(withoutYears: 2025).BuildMock());

        var ex = await Assert.ThrowsAsync<RetrospectiveYearMasterMissingException>(() =>
            _service.CalculateAndSaveAsync(propertyId, calculatedBy: 1, CancellationToken.None));

        Assert.Equal(new[] { 2025 }, ex.FinanceYears);
        Assert.Contains("year master", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("2025", ex.Message);
        _mockCalculationRepository.Verify(r => r.AddAsync(It.IsAny<RetrospectiveTaxCalculationEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockTransMastRepository.Verify(r => r.AddAsync(It.IsAny<TransMastEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_AMiddleYearWithoutYearMaster_IsNotSkipped_TheCalculationIsRefusedAndNothingIsWritten()
    {
        // OC dated 1-Apr-2023: FY2023-24, 2024-25 and 2025-26 (current) are charged. 2024 has no year master row. The ledger
        // used to be written for 2023 and 2025 and the 2024 demand silently dropped.
        const int propertyId = 704;
        ArrangeOcOnlyRuleWithNetTax(propertyId, ruleId: 44, ocDate: new DateTime(2023, 4, 1));
        _mockYearRepository.Setup(r => r.GetQueryable()).Returns(CompleteYearMasters(withoutYears: 2024).BuildMock());
        var addedTransMasts = new List<TransMastEntity>();
        _mockTransMastRepository
            .Setup(r => r.AddAsync(It.IsAny<TransMastEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TransMastEntity e, CancellationToken _) => { addedTransMasts.Add(e); return e; });

        var ex = await Assert.ThrowsAsync<RetrospectiveYearMasterMissingException>(() =>
            _service.CalculateAndSaveAsync(propertyId, calculatedBy: 1, CancellationToken.None));

        Assert.Equal(propertyId, ex.PropertyId);
        Assert.Equal(new[] { 2024 }, ex.FinanceYears);
        Assert.Empty(addedTransMasts);                 // no partial ledger: not even the years that do have a master
        _mockCalculationRepository.Verify(r => r.AddAsync(It.IsAny<RetrospectiveTaxCalculationEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never); // nothing saved at all
    }

    [Fact]
    public async Task CalculateAndSaveAsync_SeveralYearsWithoutYearMaster_AreAllNamedInOneMessage()
    {
        const int propertyId = 705;
        ArrangeOcOnlyRuleWithNetTax(propertyId, ruleId: 45, ocDate: new DateTime(2022, 4, 1));
        _mockYearRepository.Setup(r => r.GetQueryable()).Returns(CompleteYearMasters(withoutYears: new[] { 2023, 2022 }).BuildMock());

        var ex = await Assert.ThrowsAsync<RetrospectiveYearMasterMissingException>(() =>
            _service.CalculateAndSaveAsync(propertyId, calculatedBy: 1, CancellationToken.None));

        Assert.Equal(new[] { 2022, 2023 }, ex.FinanceYears); // ascending, whatever the order of the master
        Assert.Contains("2022, 2023", ex.Message);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_TwoFinanceYearsOnOneYearMasterRow_AreRefused_NotWrittenOverEachOther()
    {
        // A row whose Year is the year a finance year ENDS in (2025) but whose StartDate says it starts in 2024 answers to
        // both FY2024-25 (by its start date) and FY2025-26 (by its Year). The ledger is keyed by (property, year row, tax,
        // policy), so the second year would overwrite the first one's demand and the property would be billed a year short.
        const int propertyId = 709;
        ArrangeOcOnlyRuleWithNetTax(propertyId, ruleId: 48, ocDate: new DateTime(2023, 4, 1));
        var master = CompleteYearMasters(withoutYears: new[] { 2024, 2025 });
        master.Add(new YearMasterEntity { Id = 77, Year = 2025, StartDate = new DateTime(2024, 4, 1) });
        _mockYearRepository.Setup(r => r.GetQueryable()).Returns(master.BuildMock());
        var addedTransMasts = new List<TransMastEntity>();
        _mockTransMastRepository
            .Setup(r => r.AddAsync(It.IsAny<TransMastEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TransMastEntity e, CancellationToken _) => { addedTransMasts.Add(e); return e; });

        var ex = await Assert.ThrowsAsync<RetrospectiveYearMasterMissingException>(() =>
            _service.CalculateAndSaveAsync(propertyId, calculatedBy: 1, CancellationToken.None));

        Assert.Equal(new[] { 2024, 2025 }, ex.FinanceYears);
        Assert.Empty(addedTransMasts);
    }
    [Fact]
    public async Task CalculateAndSaveAsync_WhenEveryCalculatedYearHasAYearMaster_WritesEveryYearOfTheLedger()
    {
        // the counterpart: with a complete master nothing is refused and every charged year reaches the ledger
        const int propertyId = 706;
        ArrangeOcOnlyRuleWithNetTax(propertyId, ruleId: 46, ocDate: new DateTime(2023, 4, 1));
        var addedTransMasts = new List<TransMastEntity>();
        _mockTransMastRepository
            .Setup(r => r.AddAsync(It.IsAny<TransMastEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TransMastEntity e, CancellationToken _) => { addedTransMasts.Add(e); return e; });

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 1, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(new[] { 2023, 2024, 2025 }, addedTransMasts.Select(tm => tm.FinanceYearId).OrderBy(id => id).ToArray());
    }

    [Fact]
    public async Task CalculateAndSaveAsync_WithoutAnyRuleMatch_NeedsNoYearMasterAtAll()
    {
        // no rule matched: nothing is calculated, so there is no year to look up; the clean-up of old rows still runs
        const int propertyId = 707;
        _mockRuleRepository.Setup(r => r.GetQueryable()).Returns(new List<RetrospectiveRuleMasterEntity>().BuildMock());
        _mockEvidenceConditionRepository.Setup(r => r.GetQueryable()).Returns(new List<RetrospectiveRuleEvidenceConditionEntity>().BuildMock());
        _mockActionRepository.Setup(r => r.GetQueryable()).Returns(new List<RetrospectiveRuleActionEntity>().BuildMock());
        _mockDateConditionRepository.Setup(r => r.GetQueryable()).Returns(new List<RetrospectiveRuleDateConditionEntity>().BuildMock());
        _mockPenaltyRepository.Setup(r => r.GetQueryable()).Returns(new List<RetrospectivePenaltyRuleEntity>().BuildMock());
        _mockCertificateRepository.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>().BuildMock());
        _mockYearRepository.Setup(r => r.GetQueryable()).Returns(new List<YearMasterEntity>().BuildMock());

        var result = await _service.CalculateAndSaveAsync(propertyId, calculatedBy: 1, CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_ARuleWithAnUnknownTaxCalculationMode_IsRefused_NotBilledAsSomethingElse()
    {
        const int propertyId = 708;
        ArrangeOcOnlyRuleWithNetTax(propertyId, ruleId: 47, ocDate: new DateTime(2025, 4, 1));
        _mockActionRepository.Setup(r => r.GetQueryable()).Returns(new List<RetrospectiveRuleActionEntity>
        {
            new()
            {
                Id = 47, RuleId = 47, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = OcEvidenceTypeId,
                RetrospectiveLimitType = "NONE", TaxCalculationMode = "CC_THEN_OC_MERG" /* typo */, TaxMultiplier = 1.00m, RateMode = "YEAR_WISE", IsActive = true
            }
        }.BuildMock());

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.CalculateAndSaveAsync(propertyId, calculatedBy: 1, CancellationToken.None));

        Assert.Contains("CC_THEN_OC_MERG", ex.Message);
        _mockCalculationRepository.Verify(r => r.AddAsync(It.IsAny<RetrospectiveTaxCalculationEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData("")]
    [InlineData("YEARWISE")]
    [InlineData("current_year")]
    public async Task CalculateAndSaveAsync_ARuleWithAnUnknownRateMode_IsRefused_NotQuietlyBilledYearWise(string rateMode)
    {
        const int propertyId = 709;
        ArrangeOcOnlyRuleWithNetTax(propertyId, ruleId: 48, ocDate: new DateTime(2025, 4, 1));
        _mockActionRepository.Setup(r => r.GetQueryable()).Returns(new List<RetrospectiveRuleActionEntity>
        {
            new()
            {
                Id = 48, RuleId = 48, TaxStartMode = "EVIDENCE_DATE", StartEvidenceTypeId = OcEvidenceTypeId,
                RetrospectiveLimitType = "NONE", TaxCalculationMode = "SINGLE", TaxMultiplier = 1.00m, RateMode = rateMode, IsActive = true
            }
        }.BuildMock());

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.CalculateAndSaveAsync(propertyId, calculatedBy: 1, CancellationToken.None));

        Assert.Contains("RateMode", ex.Message);
        _mockCalculationRepository.Verify(r => r.AddAsync(It.IsAny<RetrospectiveTaxCalculationEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CalculateAndSaveAsync_AYearWrittenThatWasNeverPriced_FailsInsteadOfWritingAZeroRateableValue()
    {
        // The invariant behind ValuesFor: every year the ledger gets a row for was priced, so the row carries that year's
        // RV and ALV. A bug that broke it must not turn into rows with RV 0 (a genuinely zero RV is a priced year and stays valid).
        const int propertyId = 710;
        var sync = typeof(RetrospectiveTaxCalculationEngineService).GetMethod(
            "SyncPolicyTaxAndTransMastAsync", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)!;
        _mockPolicyCodeLookup.Setup(s => s.GetExistingIdsAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase) { ["OC"] = 101, ["PARTIAL_OC"] = 102, [PolicyCodes.NetTax] = 99 });
        _mockPolicyTaxDetailsRepository.Setup(r => r.GetQueryable()).Returns(new List<PolicyTaxDetailsEntity>
        {
            new() { PropertyId = propertyId, PolicyCodeId = 99, TaxId = 1, TaxAmount = 500m, IsActive = true }
        }.BuildMock());
        var yearRows = new List<RetrospectiveTaxEngineYearDto>
        {
            new() { FinancialYear = "2025-26", FromDate = new DateTime(2025, 4, 1), ToDate = new DateTime(2026, 3, 31), RetrospectiveTaxAmount = 500m, PolicyFamily = "OC" }
        };
        var neverPriced = new Dictionary<int, (decimal RateableValue, decimal AnnualRentalValue)>();   // no entry for 2025
        var yearMasters = new Dictionary<int, YearMasterEntity> { [2025] = new() { Id = 2025, Year = 2025 } };

        var task = (Task)sync.Invoke(_service, new object[] { propertyId, 2025, yearRows, neverPriced, yearMasters, 1, CancellationToken.None })!;

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => task);
        Assert.Contains("never priced", ex.Message);
    }
}
