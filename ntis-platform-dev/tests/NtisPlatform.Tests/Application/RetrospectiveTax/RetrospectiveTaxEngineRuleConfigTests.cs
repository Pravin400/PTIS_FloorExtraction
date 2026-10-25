using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.RateableValue;
using NtisPlatform.Application.DTOs.RetrospectiveTax;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services.RetrospectiveTax;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.RetrospectiveTax;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.RetrospectiveTax;

/// <summary>
/// Runs the real Retrospective engine against a rule library kept in this file, for the certificate
/// combinations users actually apply (EvidenceTypeMaster 1=OC 2=CC 3=ELECTRICITY 4=CHANGE_DETECTION
/// 5=CONSTRUCTION_YEAR, real certificate types). Two libraries are used, and they are different on purpose:
/// <list type="bullet">
///   <item><see cref="SeededLibrary"/> -- the 12 Active rules exactly as ntis-database-manager seeds them
///   (PR #143, <c>03_seed_data.sql</c>). That is the library a freshly created database has and the one
///   <c>Retrospective_Tax_Fix_All.sql</c> brings an existing database to, so the main tests run on it.</item>
///   <item><see cref="LibraryBeforeCorrection"/> -- the 11 Active rules as they were in the live database
///   BEFORE that correction (evidence-type ids pointing at the wrong evidence, no THA-10). Only the
///   "before the correction" tests use it, to show what the live database does until it is corrected.</item>
/// </list>
/// The values are copied from a database built from the seed; this file does not read the seed, so it has to
/// be updated by hand when the seeded rules change.
/// </summary>
public class RetrospectiveTaxEngineRuleConfigTests
{
    private const int OcEv = 1, CcEv = 2, ElecEv = 3, ChangeEv = 4, ConstructionEv = 5;
    private const int CcCertType = 1, OcCertType = 2, ElecCertType = 3;
    private const int NetTaxId = 1, OcId = 6, PartialOcId = 5, CcId = 8, PartialCcId = 7;

    private sealed record RuleCfg(
        int RuleId, string Code, int Priority, int LegalCapYears,
        (int Type, string State)[] Evidence,
        RetrospectiveRuleActionEntity Action,
        RetrospectiveRuleDateConditionEntity? Date);

    private static RetrospectiveRuleActionEntity Act(
        int id, int ruleId, string startMode, int? start, string limit, int? maxYears, DateTime? cutoff,
        string calcMode = "SINGLE", decimal mult = 1.00m, int? splitEnd = null, decimal? splitMult = null, decimal? afterSplit = null,
        string rateMode = "YEAR_WISE") => new()
    {
        Id = id, RuleId = ruleId, TaxStartMode = startMode, StartEvidenceTypeId = start,
        RetrospectiveLimitType = limit, MaximumYears = maxYears, CutoffDate = cutoff,
        TaxCalculationMode = calcMode, TaxMultiplier = mult, SplitEndEvidenceTypeId = splitEnd,
        SplitMultiplier = splitMult, AfterSplitMultiplier = afterSplit, RateMode = rateMode, IsActive = true
    };

    private static RetrospectiveRuleDateConditionEntity Dt(
        int ruleId, string comparator, int? left = null, int? right = null, int? years = null,
        string? compareOperator = null, string? gapUnit = null) => new()
    {
        RuleId = ruleId, ComparatorCode = comparator, LeftEvidenceTypeId = left, RightEvidenceTypeId = right, CompareYears = years,
        CompareOperator = compareOperator, CompareGapUnit = gapUnit, IsActive = true
    };

    private static readonly DateTime Cutoff2016 = new(2016, 4, 1);

    /// <summary>
    /// The 11 Active rules as they were in the live database BEFORE the correction (a snapshot, not what a freshly
    /// created or corrected database has): THA-02 / THA-03 / THA-04 / PCM-xx point their start evidence at the
    /// wrong evidence type, THA-09 also demands that change detection and construction year are unavailable,
    /// there is no THA-10, and the priorities differ from the seed.
    /// </summary>
    private static List<RuleCfg> LibraryBeforeCorrection() => new()
    {
        new(1, "THA-09", 1, 6,
            new[] { (OcEv, "AVAILABLE"), (CcEv, "AVAILABLE"), (ElecEv, "UNAVAILABLE"), (ChangeEv, "UNAVAILABLE"), (ConstructionEv, "UNAVAILABLE") },
            Act(19, 1, "EVIDENCE_DATE", CcEv, "FIXED_CUTOFF_DATE", 6, Cutoff2016, "CC_THEN_OC_MERGE", 1.00m, splitEnd: OcEv, splitMult: 1.50m, afterSplit: 1.00m),
            Dt(1, "NONE", 1, 3, 6)),
        new(2, "THA-01", 10, 6,
            new[] { (OcEv, "AVAILABLE"), (CcEv, "UNAVAILABLE"), (ElecEv, "UNAVAILABLE") },
            Act(1, 2, "EVIDENCE_DATE", OcEv, "FIXED_CUTOFF_DATE", null, Cutoff2016),
            Dt(2, "NONE")),
        new(3, "THA-02", 20, 6,
            new[] { (OcEv, "UNAVAILABLE"), (CcEv, "AVAILABLE"), (ElecEv, "UNAVAILABLE") },
            Act(2, 3, "EVIDENCE_DATE", OcEv /* live value: 1 */, "FIXED_CUTOFF_DATE", null, Cutoff2016),
            Dt(3, "NONE")),
        new(4, "THA-03", 1, 7,
            new[] { (OcEv, "UNAVAILABLE"), (CcEv, "AVAILABLE"), (ElecEv, "AVAILABLE") },
            Act(3, 4, "EVIDENCE_DATE", 1 /* live */, "FIXED_CUTOFF_DATE", null, Cutoff2016, mult: 1.50m),
            Dt(4, "ELECTRICITY_BEFORE_CC", 2 /* live */, 1 /* live */)),
        new(5, "THA-04", 40, 6,
            new[] { (OcEv, "UNAVAILABLE"), (CcEv, "AVAILABLE"), (ElecEv, "AVAILABLE") },
            Act(4, 5, "EVIDENCE_DATE", 2 /* live */, "FIXED_CUTOFF_DATE", null, Cutoff2016, mult: 1.50m),
            Dt(5, "ELECTRICITY_AFTER_CC", 2 /* live */, 1 /* live */)),
        new(10, "PCM-01", 1, 10,
            new[] { (OcEv, "AVAILABLE"), (CcEv, "UNAVAILABLE"), (ElecEv, "UNAVAILABLE") },
            Act(9, 10, "MAX_LOOK_BACK_DATE", null, "MAXIMUM_YEARS", 6, null),
            Dt(10, "OC_OLDER_THAN_ALLOWED_PERIOD", years: 6)),
        new(11, "PCM-02", 120, 6,
            new[] { (OcEv, "AVAILABLE"), (CcEv, "UNAVAILABLE"), (ElecEv, "UNAVAILABLE") },
            Act(10, 11, "EVIDENCE_DATE", null, "MAXIMUM_YEARS", 6, null),
            Dt(11, "OC_WITHIN_ALLOWED_PERIOD", years: 6)),
        new(12, "PCM-05", 125, 6,
            new[] { (OcEv, "UNAVAILABLE"), (CcEv, "AVAILABLE"), (ElecEv, "AVAILABLE") },
            Act(13, 12, "EVIDENCE_DATE", 2 /* live */, "MAXIMUM_YEARS", 6, null),
            Dt(12, "NONE")),
        new(13, "PCM-03", 130, 6,
            new[] { (OcEv, "UNAVAILABLE"), (CcEv, "AVAILABLE"), (ElecEv, "UNAVAILABLE") },
            Act(11, 13, "NEXT_FINANCIAL_YEAR", 1 /* live */, "MAXIMUM_YEARS", 6, null),
            Dt(13, "NONE")),
        new(16, "FUR-01", 210, 6,
            new[] { (OcEv, "AVAILABLE"), (CcEv, "UNAVAILABLE"), (ElecEv, "UNAVAILABLE") },
            Act(15, 16, "MAX_LOOK_BACK_DATE", null, "MAXIMUM_YEARS", 6, null),
            Dt(16, "OC_OLDER_THAN_ALLOWED_PERIOD", years: 6)),
        new(17, "FUR-02", 220, 6,
            new[] { (OcEv, "AVAILABLE"), (CcEv, "UNAVAILABLE"), (ElecEv, "UNAVAILABLE") },
            Act(16, 17, "EVIDENCE_DATE", null, "MAXIMUM_YEARS", 6, null),
            Dt(17, "OC_WITHIN_ALLOWED_PERIOD", years: 6)),
    };

    /// <summary>
    /// The 12 Active rules exactly as ntis-database-manager seeds them (PR #143, 03_seed_data.sql): every row of
    /// RetrospectiveRuleMaster / EvidenceCondition / DateCondition / Action with RuleStatus 'Active', copied from a
    /// database built from that seed. Rules that are only 'Review' / 'NeedsClarification' in the seed never match
    /// (the engine takes 'Active' ones) and are not listed.
    /// </summary>
    private static List<RuleCfg> SeededLibrary() => new()
    {
        // CC and OC no more than 6 months apart: tax once, from the OC date.
        new(1, "THA-10", 4, 6,
            new[] { (OcEv, "AVAILABLE"), (CcEv, "AVAILABLE") },
            Act(1, 1, "EVIDENCE_DATE", OcEv, "FIXED_CUTOFF_DATE", null, Cutoff2016),
            Dt(1, "EVIDENCE_GAP_WITHIN_PERIOD", CcEv, OcEv, 6, "WITHIN_YEARS", "MONTHS")),
        // CC and OC more than 6 months apart: CC (x1.5) until the OC date, OC (x1) after it.
        new(2, "THA-09", 5, 6,
            new[] { (OcEv, "AVAILABLE"), (CcEv, "AVAILABLE") },
            Act(2, 2, "EVIDENCE_DATE", CcEv, "FIXED_CUTOFF_DATE", null, Cutoff2016, "CC_THEN_OC_MERGE", 1.00m, splitEnd: OcEv, splitMult: 1.50m, afterSplit: 1.00m),
            Dt(2, "EVIDENCE_GAP_WITHIN_PERIOD", CcEv, OcEv, 6, "OLDER_THAN_YEARS", "MONTHS")),
        new(3, "THA-01", 10, 6,
            new[] { (OcEv, "AVAILABLE"), (CcEv, "UNAVAILABLE"), (ElecEv, "UNAVAILABLE"), (ChangeEv, "UNAVAILABLE") },
            Act(3, 3, "EVIDENCE_DATE", OcEv, "FIXED_CUTOFF_DATE", null, Cutoff2016),
            Dt(3, "NONE")),
        new(4, "THA-02", 20, 6,
            new[] { (OcEv, "UNAVAILABLE"), (CcEv, "AVAILABLE"), (ElecEv, "UNAVAILABLE"), (ChangeEv, "UNAVAILABLE") },
            Act(4, 4, "EVIDENCE_DATE", CcEv, "FIXED_CUTOFF_DATE", null, Cutoff2016),
            Dt(4, "NONE")),
        new(5, "THA-03", 30, 6,
            new[] { (OcEv, "UNAVAILABLE"), (CcEv, "AVAILABLE"), (ElecEv, "AVAILABLE"), (ChangeEv, "UNAVAILABLE") },
            Act(5, 5, "EVIDENCE_DATE", CcEv, "FIXED_CUTOFF_DATE", null, Cutoff2016, mult: 1.50m),
            Dt(5, "ELECTRICITY_BEFORE_CC", ElecEv, CcEv, compareOperator: "BEFORE")),
        new(6, "THA-04", 40, 6,
            new[] { (OcEv, "UNAVAILABLE"), (CcEv, "AVAILABLE"), (ElecEv, "AVAILABLE"), (ChangeEv, "UNAVAILABLE") },
            Act(6, 6, "EVIDENCE_DATE", ElecEv, "FIXED_CUTOFF_DATE", null, Cutoff2016, mult: 1.50m),
            Dt(6, "ELECTRICITY_AFTER_CC", ElecEv, CcEv, compareOperator: "AFTER")),
        new(11, "PCM-01", 110, 6,
            new[] { (OcEv, "AVAILABLE"), (CcEv, "UNAVAILABLE"), (ElecEv, "UNAVAILABLE"), (ChangeEv, "UNAVAILABLE") },
            Act(11, 11, "MAX_LOOK_BACK_DATE", OcEv, "MAXIMUM_YEARS", 6, null, rateMode: "CURRENT_YEAR"),
            Dt(11, "OC_OLDER_THAN_ALLOWED_PERIOD", OcEv, years: 6, compareOperator: "OLDER_THAN_YEARS")),
        new(12, "PCM-02", 120, 6,
            new[] { (OcEv, "AVAILABLE"), (CcEv, "UNAVAILABLE"), (ElecEv, "UNAVAILABLE"), (ChangeEv, "UNAVAILABLE") },
            Act(12, 12, "EVIDENCE_DATE", OcEv, "MAXIMUM_YEARS", 6, null, rateMode: "CURRENT_YEAR"),
            Dt(12, "OC_WITHIN_ALLOWED_PERIOD", OcEv, years: 6, compareOperator: "WITHIN_YEARS")),
        new(13, "PCM-05", 125, 6,
            new[] { (OcEv, "UNAVAILABLE"), (CcEv, "AVAILABLE"), (ElecEv, "AVAILABLE"), (ChangeEv, "UNAVAILABLE") },
            Act(13, 13, "EVIDENCE_DATE", ElecEv, "MAXIMUM_YEARS", 6, null, rateMode: "CURRENT_YEAR"),
            Dt(13, "NONE")),
        new(14, "PCM-03", 130, 6,
            new[] { (OcEv, "UNAVAILABLE"), (CcEv, "AVAILABLE"), (ElecEv, "UNAVAILABLE"), (ChangeEv, "UNAVAILABLE") },
            Act(14, 14, "NEXT_FINANCIAL_YEAR", CcEv, "MAXIMUM_YEARS", 6, null, rateMode: "CURRENT_YEAR"),
            Dt(14, "NONE")),
        new(17, "FUR-01", 210, 6,
            new[] { (OcEv, "AVAILABLE"), (CcEv, "UNAVAILABLE"), (ElecEv, "UNAVAILABLE"), (ChangeEv, "UNAVAILABLE") },
            Act(17, 17, "MAX_LOOK_BACK_DATE", OcEv, "MAXIMUM_YEARS", 6, null, rateMode: "CURRENT_YEAR"),
            Dt(17, "OC_OLDER_THAN_ALLOWED_PERIOD", OcEv, years: 6, compareOperator: "OLDER_THAN_YEARS")),
        new(18, "FUR-02", 220, 6,
            new[] { (OcEv, "AVAILABLE"), (CcEv, "UNAVAILABLE"), (ElecEv, "UNAVAILABLE"), (ChangeEv, "UNAVAILABLE") },
            Act(18, 18, "EVIDENCE_DATE", OcEv, "MAXIMUM_YEARS", 6, null, rateMode: "CURRENT_YEAR"),
            Dt(18, "OC_WITHIN_ALLOWED_PERIOD", OcEv, years: 6, compareOperator: "WITHIN_YEARS")),
    };

    private sealed record Scenario(
        string Name, int PropertyId, int? WingId, int? SocietyId, string? ConstructionYear,
        List<PropertyCertificateEntity> Certificates);

    private static PropertyCertificateEntity Own(int pid, int type, DateTime d) =>
        PropertyCertificateEntity.Create(pid, type, "X", d);
    private static PropertyCertificateEntity WingCert(int wing, int society, int type, DateTime d) =>
        PropertyCertificateEntity.Create(null, type, "X", d, entityType: "W", societyDetailId: society, wingDetailId: wing);
    private static PropertyCertificateEntity SocietyCert(int society, int type, DateTime d) =>
        PropertyCertificateEntity.Create(null, type, "X", d, entityType: "S", societyDetailId: society);

    private static IEnumerable<Scenario> Scenarios()
    {
        yield return new("CC only (wing-level cert, unit has construction year)", 1486620, 1530426, 1509001, "2025",
            new() { WingCert(1530426, 1509001, CcCertType, new DateTime(2024, 4, 13)) });
        yield return new("CC direct + OC from society (like 2079090)", 2079090, 1530994, 1507857, "2025",
            new() { Own(2079090, CcCertType, new DateTime(2019, 4, 7)), SocietyCert(1507857, OcCertType, new DateTime(2023, 4, 1)) });
        yield return new("CC + OC both direct", 100, null, null, "2025",
            new() { Own(100, CcCertType, new DateTime(2019, 4, 7)), Own(100, OcCertType, new DateTime(2023, 4, 1)) });
        yield return new("CC + OC, OC dated inside the current FY (like 2078970)", 2078970, 1530992, 1507857, "1990",
            new() { Own(2078970, CcCertType, new DateTime(2022, 4, 2)), Own(2078970, OcCertType, new DateTime(2026, 9, 3)) });
        yield return new("CC + OC both inside the current FY (like 1488616)", 1488616, null, null, "2026",
            new() { Own(1488616, CcCertType, new DateTime(2026, 4, 25)), Own(1488616, OcCertType, new DateTime(2026, 6, 26)) });
        yield return new("OC only, recent (within 6y)", 101, null, null, "2025",
            new() { Own(101, OcCertType, new DateTime(2024, 4, 1)) });
        yield return new("CC + electricity later than CC", 102, null, null, "2025",
            new() { Own(102, CcCertType, new DateTime(2020, 4, 1)), Own(102, ElecCertType, new DateTime(2022, 6, 1)) });
        yield return new("CC + electricity earlier than CC", 103, null, null, "2025",
            new() { Own(103, CcCertType, new DateTime(2022, 4, 1)), Own(103, ElecCertType, new DateTime(2020, 6, 1)) });
    }

    private sealed record Outcome(string? RuleCode, string? Error, List<PolicyTaxDetailsEntity> PolicyRows, List<TransMastEntity> TransRows);

    private static async Task<Outcome> RunAsync(List<RuleCfg> cfg, Scenario s)
    {
        var rules = new List<RetrospectiveRuleMasterEntity>();
        var evidence = new List<RetrospectiveRuleEvidenceConditionEntity>();
        var dates = new List<RetrospectiveRuleDateConditionEntity>();
        var actions = new List<RetrospectiveRuleActionEntity>();
        foreach (var r in cfg)
        {
            rules.Add(new RetrospectiveRuleMasterEntity { Id = r.RuleId, RuleCode = r.Code, RuleName = r.Code, PriorityNo = r.Priority, IsFallbackRule = false, RuleStatus = "Active", IsActive = true, LegalCapEnabled = true, LegalCapYears = r.LegalCapYears });
            evidence.AddRange(r.Evidence.Select(e => new RetrospectiveRuleEvidenceConditionEntity { RuleId = r.RuleId, EvidenceTypeId = e.Type, EvidenceState = e.State, IsActive = true }));
            if (r.Date != null) dates.Add(r.Date);
            actions.Add(r.Action);
        }

        var ruleRepo = new Mock<IRepository<RetrospectiveRuleMasterEntity, int>>();
        ruleRepo.Setup(x => x.GetQueryable()).Returns(rules.BuildMock());
        var evRepo = new Mock<IRepository<RetrospectiveRuleEvidenceConditionEntity, int>>();
        evRepo.Setup(x => x.GetQueryable()).Returns(evidence.BuildMock());
        var dtRepo = new Mock<IRepository<RetrospectiveRuleDateConditionEntity, int>>();
        dtRepo.Setup(x => x.GetQueryable()).Returns(dates.BuildMock());
        var acRepo = new Mock<IRepository<RetrospectiveRuleActionEntity, int>>();
        acRepo.Setup(x => x.GetQueryable()).Returns(actions.BuildMock());
        var penRepo = new Mock<IRepository<RetrospectivePenaltyRuleEntity, int>>();
        penRepo.Setup(x => x.GetQueryable()).Returns(new List<RetrospectivePenaltyRuleEntity>().BuildMock());

        var evTypeRepo = new Mock<IRepository<EvidenceTypeMasterEntity, int>>();
        evTypeRepo.Setup(x => x.GetQueryable()).Returns(new List<EvidenceTypeMasterEntity>
        {
            new() { Id = OcEv, EvidenceCode = "OC", IsActive = true },
            new() { Id = CcEv, EvidenceCode = "CC", IsActive = true },
            new() { Id = ElecEv, EvidenceCode = "ELECTRICITY", IsActive = true },
            new() { Id = ChangeEv, EvidenceCode = "CHANGE_DETECTION", IsActive = true },
            new() { Id = ConstructionEv, EvidenceCode = "CONSTRUCTION_YEAR", IsActive = true },
        }.BuildMock());

        var certRepo = new Mock<IRepository<PropertyCertificateEntity, int>>();
        certRepo.Setup(x => x.GetQueryable()).Returns(s.Certificates.BuildMock());
        var certTypeRepo = new Mock<IRepository<PropertyCertificateTypeMasterEntity, int>>();
        certTypeRepo.Setup(x => x.GetQueryable()).Returns(new List<PropertyCertificateTypeMasterEntity>
        {
            new() { Id = 1, CertificateTypeCode = "CC", CertificateTypeName = "Completion Certificate" },
            new() { Id = 2, CertificateTypeCode = "OC", CertificateTypeName = "Occupancy Certificate" },
            new() { Id = 3, CertificateTypeCode = "EleBillDt", CertificateTypeName = "Electric Bill Date" },
            new() { Id = 4, CertificateTypeCode = "POSSESSION_CERTIFICATE", CertificateTypeName = "Possession Certificate" },
        }.BuildMock());

        var detailsRepo = new Mock<IRepository<PropertyDetailsEntity, int>>();
        detailsRepo.Setup(x => x.GetQueryable()).Returns(new List<PropertyDetailsEntity>
        {
            new() { Id = 1, PropertyId = s.PropertyId, ConstructionYear = s.ConstructionYear, IsActive = true, MarkedForDeletion = false }
        }.BuildMock());
        var propRepo = new Mock<IRepository<PropertyEntity, int>>();
        propRepo.Setup(x => x.GetQueryable()).Returns(new List<PropertyEntity> { new() { Id = s.PropertyId, WingDetailId = s.WingId, IsActive = true } }.BuildMock());
        var wingRepo = new Mock<IRepository<WingDetailsMastEntity, int>>();
        wingRepo.Setup(x => x.GetQueryable()).Returns(
            (s.WingId.HasValue ? new List<WingDetailsMastEntity> { new() { Id = s.WingId.Value, SocietyDetailsMastId = s.SocietyId ?? 0, IsActive = true } } : new List<WingDetailsMastEntity>()).BuildMock());
        var socRepo = new Mock<IRepository<SocietyDetailsEntity, int>>();
        // the society a certificate is issued to is a live row (a society that is gone lends no certificates)
        socRepo.Setup(x => x.GetQueryable()).Returns(
            (s.SocietyId.HasValue ? new List<SocietyDetailsEntity> { new() { Id = s.SocietyId.Value, IsActive = true } } : new List<SocietyDetailsEntity>()).BuildMock());

        var calcRepo = new Mock<IRepository<RetrospectiveTaxCalculationEntity, int>>();
        calcRepo.Setup(x => x.AddAsync(It.IsAny<RetrospectiveTaxCalculationEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RetrospectiveTaxCalculationEntity e, CancellationToken _) => { e.Id = 501; return e; });
        var calcDetailRepo = new Mock<IRepository<RetrospectiveTaxCalculationDetailEntity, int>>();
        calcDetailRepo.Setup(x => x.AddAsync(It.IsAny<RetrospectiveTaxCalculationDetailEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RetrospectiveTaxCalculationDetailEntity e, CancellationToken _) => e);

        var policyRows = new List<PolicyTaxDetailsEntity>();
        var ptRepo = new Mock<IRepository<PolicyTaxDetailsEntity, int>>();
        var existingNet = new List<PolicyTaxDetailsEntity>
        {
            new() { PropertyId = s.PropertyId, PolicyCodeId = NetTaxId, TaxId = 1, TaxAmount = 750m, IsActive = true },
            new() { PropertyId = s.PropertyId, PolicyCodeId = NetTaxId, TaxId = 2, TaxAmount = 250m, IsActive = true },
        };
        ptRepo.Setup(x => x.GetQueryable()).Returns(existingNet.BuildMock());
        ptRepo.Setup(x => x.AddAsync(It.IsAny<PolicyTaxDetailsEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyTaxDetailsEntity e, CancellationToken _) => { policyRows.Add(e); return e; });
        var transRows = new List<TransMastEntity>();
        var tmRepo = new Mock<IRepository<TransMastEntity, int>>();
        tmRepo.Setup(x => x.GetQueryable()).Returns(new List<TransMastEntity>().BuildMock());
        tmRepo.Setup(x => x.AddAsync(It.IsAny<TransMastEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TransMastEntity e, CancellationToken _) => { transRows.Add(e); return e; });

        var yearRepo = new Mock<IRepository<YearMasterEntity, int>>();
        yearRepo.Setup(x => x.GetQueryable()).Returns(Enumerable.Range(2016, 12)
            .Select(y => new YearMasterEntity { Id = y, Year = y }).ToList().BuildMock());

        var rv = new Mock<IRateableValueService>();
        rv.Setup(x => x.PreviewTotalTaxAsync(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync((int pid, int year) => new RetrospectiveRatePreviewDto { PropertyId = pid, FinanceYear = year, TotalTaxAmount = 1000m });

        var fy = new Mock<IFinanceYearProvider>();
        fy.Setup(x => x.GetCurrentFinanceYear()).Returns(2026);

        var lookup = new Mock<IPolicyCodeLookupService>();
        lookup.Setup(x => x.GetIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(NetTaxId);
        lookup.Setup(x => x.GetExistingIdsAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
            {
                ["PARTIAL_OC"] = PartialOcId, ["OC"] = OcId, ["PARTIAL_CC"] = PartialCcId, ["CC"] = CcId,
                ["PARTIAL_ELECTRIC_BILL"] = 9, ["ELECTRIC_BILL"] = 10, [PolicyCodes.NetTax] = NetTaxId
            });
        var tax = new Mock<ITaxApplicabilityService>();
        tax.Setup(x => x.GetExemptedTaxIdsAsync(It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync(new HashSet<int>());
        var uow = new Mock<IUnitOfWork>();
        uow.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var service = new RetrospectiveTaxCalculationEngineService(
            ruleRepo.Object, evRepo.Object, dtRepo.Object, acRepo.Object, penRepo.Object, evTypeRepo.Object,
            certRepo.Object, certTypeRepo.Object, detailsRepo.Object, propRepo.Object, wingRepo.Object, socRepo.Object,
            calcRepo.Object, calcDetailRepo.Object, ptRepo.Object, tmRepo.Object, yearRepo.Object,
            rv.Object, fy.Object, lookup.Object, tax.Object, uow.Object, new AlwaysGrantedCalculationLock());

        try
        {
            var result = await service.CalculateAndSaveAsync(s.PropertyId, 9, CancellationToken.None);
            return new Outcome(result?.AppliedRuleCode, null, policyRows, transRows);
        }
        catch (Exception ex)
        {
            return new Outcome(null, $"{ex.GetType().Name}: {ex.Message}", policyRows, transRows);
        }
    }

    private static Scenario ScenarioNamed(string scenarioNamePrefix) =>
        Scenarios().Single(s => s.Name.StartsWith(scenarioNamePrefix, StringComparison.Ordinal));

    /// <summary>Runs a scenario against the seeded library, i.e. what a freshly created or corrected database has.</summary>
    private static async Task<Outcome> RunSeededAsync(string scenarioNamePrefix)
    {
        var outcome = await RunAsync(SeededLibrary(), ScenarioNamed(scenarioNamePrefix));
        Assert.Null(outcome.Error);
        return outcome;
    }

    private static int[] PolicyCodes_(Outcome o) => o.PolicyRows.Select(p => p.PolicyCodeId).Distinct().OrderBy(x => x).ToArray();

    /// <summary>The distinct finance years the run wrote TransMast rows for.</summary>
    private static int[] Years_(Outcome o) => o.TransRows.Select(t => t.FinanceYearId).Distinct().OrderBy(y => y).ToArray();

    [Fact]
    public async Task CcOnly_FromWingCertificate_WritesCcFamilyPolicyCodes()
    {
        var o = await RunSeededAsync("CC only");

        Assert.Equal("THA-02", o.RuleCode);
        Assert.Equal(new[] { CcId }, PolicyCodes_(o));
        // CC dated 13-Apr-2024: FY2024 (prorated), FY2025 and the current FY2026 -- nothing before, nothing missing.
        Assert.Equal(new[] { 2024, 2025, 2026 }, Years_(o));
        Assert.Contains(o.TransRows, t => t.FinanceYearId == 2024 && t.PolicyCodeId == PartialCcId); // CC dated mid-FY2024
        Assert.All(o.TransRows.Where(t => t.FinanceYearId >= 2025), t => Assert.Equal(CcId, t.PolicyCodeId));
    }

    [Theory]
    [InlineData("CC direct + OC from society")]
    [InlineData("CC + OC both direct")]
    public async Task CcAndOc_WriteCcThenOcPolicyCodes(string scenario)
    {
        var o = await RunSeededAsync(scenario);

        Assert.Equal("THA-09", o.RuleCode);
        Assert.Equal(new[] { OcId }, PolicyCodes_(o)); // PolicyTaxDetails is current-year only: OC governs FY2026
        // CC dated 07-Apr-2019 up to the current FY2026: every year has a row (the checks below would pass vacuously otherwise).
        Assert.Equal(new[] { 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026 }, Years_(o));
        Assert.Contains(o.TransRows, t => t.FinanceYearId == 2019 && t.PolicyCodeId == PartialCcId);
        Assert.All(o.TransRows.Where(t => t.FinanceYearId is >= 2020 and <= 2022), t => Assert.Equal(CcId, t.PolicyCodeId));
        Assert.All(o.TransRows.Where(t => t.FinanceYearId >= 2023), t => Assert.Equal(OcId, t.PolicyCodeId));
    }

    [Fact]
    public async Task CcAndOc_OcDatedInsideCurrentFinanceYear_SplitsThatYearBetweenCcAndOc()
    {
        var o = await RunSeededAsync("CC + OC, OC dated inside the current FY");

        Assert.Equal("THA-09", o.RuleCode);
        Assert.Equal(new[] { OcId }, PolicyCodes_(o)); // current-year row is tagged with the last (OC) segment's family
        // CC dated 02-Apr-2022 up to the current FY2026: every year has a row (the checks below would pass vacuously otherwise).
        Assert.Equal(new[] { 2022, 2023, 2024, 2025, 2026 }, Years_(o));
        Assert.Contains(o.TransRows, t => t.FinanceYearId == 2022 && t.PolicyCodeId == PartialCcId); // CC starts 02-Apr-2022
        Assert.All(o.TransRows.Where(t => t.FinanceYearId is >= 2023 and <= 2025), t => Assert.Equal(CcId, t.PolicyCodeId));
        Assert.Contains(o.TransRows, t => t.FinanceYearId == 2026 && t.PolicyCodeId == OcId);
    }

    [Fact]
    public async Task CcAndOc_BothInsideCurrentFinanceYear_WritesPartialOcPolicyCode()
    {
        var o = await RunSeededAsync("CC + OC both inside the current FY");

        // CC 25-Apr-2026 and OC 26-Jun-2026 are 2 months apart, i.e. within the 6 months THA-10 allows: tax once, from the OC date.
        Assert.Equal("THA-10", o.RuleCode);
        // Starting mid-year (26-Jun), the year's row is the prorated (PARTIAL) OC family -- and it is the only year.
        Assert.Equal(new[] { PartialOcId }, PolicyCodes_(o));
        Assert.Equal(new[] { 2026 }, Years_(o));
        Assert.NotEmpty(o.TransRows);
        Assert.All(o.TransRows, t => Assert.Equal(PartialOcId, t.PolicyCodeId));
    }

    [Fact]
    public async Task OcOnly_WritesOcPolicyCode()
    {
        var o = await RunSeededAsync("OC only");

        Assert.Equal("THA-01", o.RuleCode);
        Assert.Equal(new[] { OcId }, PolicyCodes_(o));
        Assert.Equal(new[] { 2024, 2025, 2026 }, Years_(o)); // OC dated 01-Apr-2024 (a whole year) up to the current FY2026
    }

    [Fact]
    public async Task CcAndElectricity_ElectricityEarlierThanCc_StartsFromCc()
    {
        var o = await RunSeededAsync("CC + electricity earlier");

        Assert.Equal("THA-03", o.RuleCode);
        Assert.Equal(new[] { CcId }, PolicyCodes_(o));
        Assert.Equal(new[] { 2022, 2023, 2024, 2025, 2026 }, Years_(o)); // from the CC date, 01-Apr-2022
    }

    [Fact]
    public async Task CcAndElectricity_ElectricityLaterThanCc_StartsFromElectricity()
    {
        var o = await RunSeededAsync("CC + electricity later");

        Assert.Equal("THA-04", o.RuleCode);
        Assert.Equal(new[] { 10 }, PolicyCodes_(o)); // ELECTRIC_BILL family
        Assert.Equal(new[] { 2022, 2023, 2024, 2025, 2026 }, Years_(o)); // from the electricity date, 01-Jun-2022
    }

    // ---- the library as it was in the live database BEFORE the correction ---------------------------------------
    // These run the engine on LibraryBeforeCorrection to show what a database that has not been corrected does
    // for the same certificates. They document why the correction (seed in ntis-database-manager #143 /
    // Retrospective_Tax_Fix_All.sql) is needed; they are not a target behaviour.

    [Fact]
    public async Task BeforeCorrection_CcOnly_FailsBecauseTha02StartsFromTheOcDateThatDoesNotExist()
    {
        var o = await RunAsync(LibraryBeforeCorrection(), ScenarioNamed("CC only"));

        Assert.NotNull(o.Error);
        Assert.Contains("THA-02", o.Error);
        Assert.Contains("evidence date could not be resolved", o.Error);
        Assert.Empty(o.TransRows);
    }

    [Theory]
    [InlineData("CC direct + OC from society")]
    [InlineData("CC + OC both direct")]
    [InlineData("CC + OC, OC dated inside the current FY")]
    public async Task BeforeCorrection_CcAndOc_MatchesNoRuleSoNothingIsWritten(string scenario)
    {
        // THA-09 is only valid for properties with no change-detection / construction-year evidence, so a unit
        // that has a construction year matches no rule at all.
        var o = await RunAsync(LibraryBeforeCorrection(), ScenarioNamed(scenario));

        Assert.Null(o.Error);
        Assert.Null(o.RuleCode);
        Assert.Empty(o.TransRows);
    }

    [Fact]
    public async Task BeforeCorrection_CcAndElectricityLaterThanCc_PicksPcm05NotTha04()
    {
        // THA-04's comparator points at the wrong evidence types, so the electricity-after-CC rule never matches
        // and the lower-priority PCM-05 is used instead.
        var o = await RunAsync(LibraryBeforeCorrection(), ScenarioNamed("CC + electricity later"));

        Assert.Null(o.Error);
        Assert.Equal("PCM-05", o.RuleCode);
    }
}
