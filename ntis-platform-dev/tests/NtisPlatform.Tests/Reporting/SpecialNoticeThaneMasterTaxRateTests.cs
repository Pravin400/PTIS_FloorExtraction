using System.Reflection;
using System.Text.Json;
using MockQueryable;
using Moq;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Services.ReportDataProviders;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.RetrospectiveTax;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Tests.Reporting;

public class SpecialNoticeThaneMasterTaxRateTests
{
    [Theory]
    [InlineData(235.29, 282)]
    [InlineData(21.25, 26)]
    [InlineData(0d, 0)]
    [InlineData(null, 0)]
    public async Task CommercialAndTotalCarpetAreaUseTwentyPercentIncreaseRoundedToWholeNumber(double? carpetArea, int expected)
    {
        var data = new Dictionary<Type, object[]>
        {
            [typeof(PropertyEntity)] = [new PropertyEntity { Id = 1, IsActive = true, Type = "C" }],
            [typeof(PropertyDetailsEntity)] = [
                new PropertyDetailsEntity { Id = 1, PropertyId = 1, IsActive = true, IsTaxable = true,
                    CarpetAreaSqMeter = carpetArea },
                new PropertyDetailsEntity { Id = 2, PropertyId = 1, IsActive = true, IsTaxable = false,
                    CarpetAreaSqMeter = 999 }],
            [typeof(RVCalculationResultsEntity)] = [new RVCalculationResultsEntity
                { Id = 1, PropertyId = 1, PropertyDetailsId = 1, IsActive = true, RateableValue = 500m }]
        };
        var result = JsonSerializer.SerializeToElement(await Provider(data).GetDataAsync(new() { ["propertyId"] = "1" }));
        var record = result[0];
        Assert.Equal(expected, record.GetProperty("cTotalCarpetArea").GetDecimal());
        Assert.Equal(expected, record.GetProperty("totalCarpetArea").GetDecimal());
        var original = record.GetProperty("summaryRows")[1].GetProperty("nonResidential");
        if (carpetArea.HasValue) Assert.Equal(Convert.ToDecimal(carpetArea.Value), original.GetDecimal());
        else Assert.Equal(JsonValueKind.Null, original.ValueKind);
        Assert.Equal(0m, record.GetProperty("rTotalCarpetArea").GetDecimal());
        Assert.Equal(0m, record.GetProperty("rcTotalCarpetArea").GetDecimal());
        Assert.Equal(0m, record.GetProperty("aminityTotalCarpetArea").GetDecimal());
        Assert.Equal(1, record.GetProperty("cTotalProperty").GetInt32());
        Assert.Equal(500m, record.GetProperty("cTotalRateableValue").GetDecimal());
        Assert.Equal(original.GetRawText(), record.GetProperty("summaryRows")[1].GetProperty("total").GetRawText());
    }

    [Fact]
    public async Task ResidentialCarpetAreaAndTotalKeepTheirOriginalPrecision()
    {
        var data = new Dictionary<Type, object[]>
        {
            [typeof(PropertyEntity)] = [new PropertyEntity { Id = 1, IsActive = true, Type = "R" }],
            [typeof(PropertyDetailsEntity)] = [new PropertyDetailsEntity
            {
                Id = 1, PropertyId = 1, IsActive = true, IsTaxable = true, CarpetAreaSqMeter = 235.29,
                TypeOfUse = new TypeOfUseEntity { Type = "R" }
            }]
        };
        var result = JsonSerializer.SerializeToElement(await Provider(data).GetDataAsync(new() { ["propertyId"] = "1" }));
        Assert.Equal(0m, result[0].GetProperty("cTotalCarpetArea").GetDecimal());
        Assert.Equal(235.29m, result[0].GetProperty("rTotalCarpetArea").GetDecimal());
        Assert.Equal(235.29m, result[0].GetProperty("totalCarpetArea").GetDecimal());
    }

    [Fact]
    public async Task NoSavedTaxShowsAnEmptyBreakup()
    {
        // A demand without a matching financial year is not a current-year charge.
        var data = Data();
        data[typeof(TransMastEntity)] = [new TransMastEntity
        {
            PropertyId = 1, TaxId = 1, TaxAmount = 999m, IsActive = true
        }];
        var method = typeof(SpecialNoticeThaneDataProvider).GetMethod("BuildTaxTableAsync", BindingFlags.NonPublic | BindingFlags.Instance)!;
        var table = await (Task<SpecialNoticeThaneTaxTable?>)method.Invoke(Provider(data),
            [1, new Dictionary<string, string>(), CancellationToken.None])!;
        Assert.NotNull(table);
        var rows = JsonSerializer.SerializeToElement(table.Rows).EnumerateArray().ToArray();
        Assert.Equal(15, rows.Length);
        Assert.Equal(12, rows.Count(r => r.GetProperty("rowType").GetString() == "tax"));
        Assert.Equal("General Tax", rows[0].GetProperty("taxName").GetString());
        Assert.Equal("Fire Tax", rows[11].GetProperty("taxName").GetString());
        Assert.Equal("MMC Sec 267 (A) Penalty", rows[13].GetProperty("taxName").GetString());
        foreach (var row in rows)
        {
            Assert.Equal(0m, row.GetProperty("previousTax").GetDecimal());
            Assert.Equal(0m, row.GetProperty("currentTax").GetDecimal());
            Assert.Equal(0m, row.GetProperty("totalTax").GetDecimal());
        }
        Assert.Equal(0m, table.PreviousTotal);
        Assert.Equal(0m, table.CurrentTotal);
    }

    [Fact]
    public async Task DirectReportReadsCurrentYearNetTaxAndKeepsAssessmentDatesEmpty()
    {
        var data = Data();
        data[typeof(PropertyEntity)] = [new PropertyEntity { Id = 1, IsActive = true }];
        data[typeof(YearMasterEntity)] = [
            new YearMasterEntity { Id = 10, Year = 2026, IsActive = true },
            new YearMasterEntity { Id = 9, Year = 2025, IsActive = false }];
        var codes = new[] { "GEN", "STATE_EDU", "STATE_EMP", "TREE", "SP_WATER", "ROAD", "FIRE",
            "LIGHT", "WATER_BEN", "SEWAGE", "SP_E DU", "SANITATION", "BIG_BUILD", "ILLEGAL", "TaxTotal" };
        var amounts = new decimal[] { 11505, 3174, 793, 264, 2645, 2380, 264, 3438, 5819, 4628, 1058, 264, 0, 6612, 42844 };
        data[typeof(TaxMasterEntity)] = codes.Select((code, index) => (object)new TaxMasterEntity
        {
            Id = index + 1, TaxCode = code, TaxName = code, IsActive = true, DisplayOrder = index,
            CalculationModeMaster = new TaxCalculationModeMasterEntity { ModeCode = "VALUE_BASED" }
        }).ToArray();
        var savedRows = amounts.Select((amount, index) => (object)new TransMastEntity
        {
            Id = index + 1, PropertyId = 1, FinanceYearId = 10, TaxId = index + 1,
            CalculationType = "RV", TaxAmount = amount, IsActive = true,
            PolicyCodeMaster = new PolicyCodeMasterEntity { PolicyCode = "NETTAX" }
        }).ToList();
        savedRows.AddRange(new object[]
        {
            Demand(100, "RV", "NETTAX", year: 9),
            Demand(101, "CV", "NETTAX"),
            Demand(102, "RV", "OLD_ARREARS", year: 8),
            Demand(103, "RV", "OC", year: 8),
            Demand(104, "RV", "NETTAX", active: false),
            Demand(105, "RV", "NETTAX", deleted: true),
            Demand(106, "RV", "NETTAX", property: 2)
        });
        data[typeof(TransMastEntity)] = savedRows.ToArray();

        var output = JsonSerializer.SerializeToElement(await Provider(data).GetDataAsync(new() { ["propertyId"] = "1" }));

        var record = output[0];
        Assert.Equal(42844m, record.GetProperty("grandTaxTotal").GetDecimal());
        Assert.Equal(36232m, record.GetProperty("currentTaxSubtotal").GetDecimal());
        Assert.Equal(6612m, record.GetProperty("currentPenalty").GetDecimal());
        Assert.Equal(0m, record.GetProperty("previousTaxTotal").GetDecimal());
        Assert.Equal("FY 2026-27 Tax", record.GetProperty("currentTaxHeading").GetString());
        Assert.Equal(JsonValueKind.Null, record.GetProperty("FromDate").ValueKind);
        Assert.Equal(JsonValueKind.Null, record.GetProperty("ToDate").ValueKind);
        var rows = record.GetProperty("taxRows").EnumerateArray().ToArray();
        Assert.Equal(11505m, Assert.Single(rows, row => row.GetProperty("taxCode").GetString() == "GEN")
            .GetProperty("currentTax").GetDecimal());
        Assert.Equal(264m, Assert.Single(rows, row => row.GetProperty("taxCode").GetString() == "SANITATION")
            .GetProperty("currentTax").GetDecimal());
        Assert.Equal(36232m, rows.Where(row => row.GetProperty("rowType").GetString() == "tax")
            .Sum(row => row.GetProperty("currentTax").GetDecimal()));
        Assert.Equal(41m, rows[0].GetProperty("residentialRate").GetDecimal());
        Assert.DoesNotContain(rows, row => row.GetProperty("taxCode").GetString() == "TAXTOTAL");

        static TransMastEntity Demand(int id, string type, string policy, int year = 10,
            bool active = true, bool deleted = false, int property = 1) => new()
        {
            Id = id, PropertyId = property, FinanceYearId = year, TaxId = 1, CalculationType = type,
            TaxAmount = 999999m, IsActive = active, MarkedForDeletion = deleted,
            PolicyCodeMaster = new PolicyCodeMasterEntity { PolicyCode = policy, IsRetroDemand = policy == "OC" }
        };
    }

    [Fact]
    public async Task DirectReportRejectsAnUnrelatedRequestedFinancialYear()
    {
        var data = Data();
        data[typeof(YearMasterEntity)] = [new YearMasterEntity { Id = 10, Year = 2026, IsActive = true }];
        var method = typeof(SpecialNoticeThaneDataProvider).GetMethod("BuildTaxTableAsync", BindingFlags.NonPublic | BindingFlags.Instance)!;

        var exception = await Assert.ThrowsAsync<ArgumentException>(async () =>
            await (Task<SpecialNoticeThaneTaxTable?>)method.Invoke(Provider(data),
                [1, new Dictionary<string, string> { ["financeYear"] = "2025" }, CancellationToken.None])!);
        Assert.Contains("current financial year", exception.Message);
    }

    [Fact]
    public async Task SavedTaxesAreAvailableWithoutAnAssessmentPeriod()
    {
        var method = typeof(SpecialNoticeThaneDataProvider).GetMethod("BuildTaxTableAsync", BindingFlags.NonPublic | BindingFlags.Instance)!;
        var table = await (Task<SpecialNoticeThaneTaxTable?>)method.Invoke(Provider(Data()),
            [1, new Dictionary<string, string>(), CancellationToken.None])!;
        Assert.NotNull(table);
    }

    [Theory]
    [InlineData("ManualReview")]
    [InlineData("Calculated")]
    public async Task SavedScreenTaxesIncludeCurrentPoliciesAndPendingYearsRegardlessOfAssessment(string status)
    {
        var data = Data();
        data[typeof(PropertyEntity)] = [new PropertyEntity { Id = 1, IsActive = true }];
        data[typeof(YearMasterEntity)] = [
            new YearMasterEntity { Id = 10, Year = 2026, IsActive = true },
            new YearMasterEntity { Id = 9, Year = 2023, IsActive = false }];
        data[typeof(RetrospectiveTaxCalculationEntity)] = [new RetrospectiveTaxCalculationEntity
        {
            Id = 7, PropertyId = 1, CalculationMode = "PROPERTY", CalculationStatus = status, IsActive = true,
            ChargeableStartDate = new DateTime(2023, 4, 1), ChargeableEndDate = new DateTime(2024, 3, 31)
        }];
        data[typeof(TaxMasterEntity)] = [
            new TaxMasterEntity { Id = 1, TaxCode = "GEN", TaxName = "General Tax", IsActive = true },
            new TaxMasterEntity { Id = 2, TaxCode = "TREE", TaxName = "Tree Cess", IsActive = true },
            new TaxMasterEntity { Id = 3, TaxCode = "INACTIVE", TaxName = "Inactive", IsActive = false },
            new TaxMasterEntity { Id = 5, TaxCode = "ILLEGAL", TaxName = "Penalty", IsActive = true },
            new TaxMasterEntity { Id = 6, TaxCode = "TaxTotal", TaxName = "TaxTotal", IsActive = true }];
        data[typeof(PolicyTaxDetailsEntity)] = [Annual(1, 1, 100m), Annual(2, 2, 5m), Annual(3, 5, 3m),
            Annual(4, 6, 108m), Annual(5, 1, 20m, "OC"), Annual(6, 3, 999m)];
        data[typeof(TransMastEntity)] = [
            Ledger(1, 10, 1, 10m, "PARTIAL_OC"), Ledger(2, 10, 1, 20m, "OC"),
            Ledger(3, 10, 5, 3m, "OC"), Ledger(4, 10, 6, 33m, "OC"),
            Ledger(5, 9, 1, 7m, "OC"), Ledger(6, 9, 1, 4m, "OLD_ARREARS"),
            Ledger(7, 9, 5, 2m, "OC"), Ledger(8, 9, 1, 999m, "NETTAX"),
            Ledger(9, 10, 3, 999m, "OC"), Ledger(10, 10, 1, 999m, "OC", active: false),
            Ledger(11, 10, 1, 999m, "OC", deleted: true), Ledger(12, 10, 1, 999m, "OC", type: "CV")];

        var record = JsonSerializer.SerializeToElement(await Provider(data).GetDataAsync(new() { ["propertyId"] = "1" }))[0];
        Assert.Equal("Ready", record.GetProperty("taxTableStatus").GetString());
        Assert.Equal(38m, record.GetProperty("currentTaxTotal").GetDecimal());
        Assert.Equal(13m, record.GetProperty("previousTaxTotal").GetDecimal());
        Assert.Equal(51m, record.GetProperty("grandTaxTotal").GetDecimal());
        var rows = record.GetProperty("taxRows").EnumerateArray().ToArray();
        var gen = Assert.Single(rows, row => row.GetProperty("taxCode").GetString() == "GEN");
        Assert.Equal(30m, gen.GetProperty("currentTax").GetDecimal());
        Assert.Equal(11m, gen.GetProperty("previousTax").GetDecimal());
        Assert.Equal(5m, Assert.Single(rows, row => row.GetProperty("taxCode").GetString() == "TREE")
            .GetProperty("currentTax").GetDecimal());
        Assert.Equal("FY 2026-27 Tax", record.GetProperty("currentTaxHeading").GetString());
        if (status == "ManualReview") Assert.Equal(JsonValueKind.Null, record.GetProperty("FromDate").ValueKind);
        else Assert.Contains("2023", record.GetProperty("FromDate").ToString());
    }

    [Fact]
    public async Task AnnualTaxShownOnIndividualScreenIsAvailableBeforeLedgerOrAssessmentExists()
    {
        var data = Data();
        data[typeof(PropertyEntity)] = [new PropertyEntity { Id = 1, IsActive = true }];
        data[typeof(YearMasterEntity)] = [new YearMasterEntity { Id = 10, Year = 2026, IsActive = true }];
        var deleted = Annual(4, 1, 999m);
        deleted.MarkedForDeletion = true;
        var inactive = Annual(5, 1, 999m);
        inactive.IsActive = false;
        data[typeof(PolicyTaxDetailsEntity)] = [Annual(1, 1, 100m), Annual(2, 2, 5m),
            Annual(3, 1, 100m, "OC"), deleted, inactive];
        var record = JsonSerializer.SerializeToElement(await Provider(data).GetDataAsync(new() { ["propertyId"] = "1" }))[0];
        Assert.Equal(105m, record.GetProperty("currentTaxTotal").GetDecimal());
        Assert.Equal(105m, record.GetProperty("grandTaxTotal").GetDecimal());
    }

    [Theory]
    [InlineData(false, false)]
    [InlineData(false, true)]
    [InlineData(true, false)]
    [InlineData(true, true)]
    public async Task SanitationTaxFollowsEachPropertySavedData(bool useLedger, bool hasSanitation)
    {
        var data = Data();
        data[typeof(YearMasterEntity)] = [new YearMasterEntity { Id = 10, Year = 2026, IsActive = true }];
        data[typeof(TaxMasterEntity)] = data[typeof(TaxMasterEntity)].Append(new TaxMasterEntity
        {
            Id = 77, TaxCode = "SANITATION", TaxName = "Sanitation Tax from DB", IsActive = true, DisplayOrder = 12
        }).ToArray();
        var properties = new[] { (Id: 101, Amount: 0m), (Id: 202, Amount: 91m), (Id: 303, Amount: 264m) };
        var saved = properties.SelectMany(property =>
            new[] { (TaxId: 1, Amount: 100m) }
                .Concat(hasSanitation ? [(TaxId: 77, Amount: property.Amount)] : [])
                .Select(tax => (PropertyId: property.Id, tax.TaxId, tax.Amount))).ToArray();
        if (useLedger)
            data[typeof(TransMastEntity)] = saved.Select((row, index) => (object)new TransMastEntity
            {
                Id = index + 1, PropertyId = row.PropertyId, TaxId = row.TaxId, TaxAmount = row.Amount,
                FinanceYearId = 10, CalculationType = "RV", IsActive = true
            }).ToArray();
        else
            data[typeof(PolicyTaxDetailsEntity)] = saved.Select((row, index) => (object)new PolicyTaxDetailsEntity
            {
                Id = index + 1, PropertyId = row.PropertyId, TaxId = row.TaxId, TaxAmount = row.Amount,
                IsActive = true, PolicyCodeMaster = new PolicyCodeMasterEntity { PolicyCode = "NETTAX", IsActive = true }
            }).ToArray();

        var provider = Provider(data);
        var method = typeof(SpecialNoticeThaneDataProvider).GetMethod("BuildTaxTableAsync", BindingFlags.NonPublic | BindingFlags.Instance)!;
        foreach (var property in properties)
        {
            var table = await (Task<SpecialNoticeThaneTaxTable>)method.Invoke(provider,
                [property.Id, new Dictionary<string, string>(), CancellationToken.None])!;
            var rows = JsonSerializer.SerializeToElement(table.Rows).EnumerateArray().ToArray();
            var sanitation = rows.Where(row => row.GetProperty("taxCode").GetString() == "SANITATION").ToArray();
            var row = Assert.Single(sanitation);
            Assert.Equal("Sanitation Tax from DB", row.GetProperty("taxName").GetString());
            Assert.Equal(hasSanitation ? property.Amount : 0m, row.GetProperty("currentTax").GetDecimal());
            Assert.Equal(100m + (hasSanitation ? property.Amount : 0m), table.CurrentTotal);
        }
    }

    private static PolicyTaxDetailsEntity Annual(int id, int taxId, decimal amount, string policy = "NETTAX") => new()
    {
        Id = id, PropertyId = 1, TaxId = taxId, TaxAmount = amount, IsActive = true,
        PolicyCodeMaster = new PolicyCodeMasterEntity { PolicyCode = policy, IsActive = true }
    };

    private static TransMastEntity Ledger(int id, int year, int taxId, decimal amount, string policy,
        bool active = true, bool deleted = false, string type = "RV") => new()
    {
        Id = id, PropertyId = 1, FinanceYearId = year, TaxId = taxId, TaxAmount = amount,
        IsActive = active, MarkedForDeletion = deleted, CalculationType = type,
        PolicyCodeMaster = new PolicyCodeMasterEntity { PolicyCode = policy, IsRetroDemand = policy is "OC" or "PARTIAL_OC" }
    };

    private static readonly SpecialNoticeTaxHead[] Heads =
    [
        new(1, "GEN", "General Tax", 1, true, true, "TAX"),
        new(2, "TREE", "Tree Cess", 2, true, true, "TAX"),
        new(3, "INACTIVE", "Inactive Tax", 3, false, true, "TAX"),
        new(4, "STATE_EDU", "Education", 4, true, false, "EDU")
    ];

    [Fact]
    public async Task ValueBasedRatesUseUsageCodeAndSumAllRowsIncludingDuplicates()
    {
        var data = Data();
        var provider = Provider(data);
        var rates = await provider.LoadMasterTaxRatesAsync(Heads, default);
        Assert.Equal(41m, rates[1].Residential);
        Assert.Equal(57m, rates[1].Commercial);
        Assert.Equal("41", rates[1].ResidentialText);
        Assert.Equal("57", rates[1].CommercialText);
        Assert.False(rates.ContainsKey(3));
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task MissingOrInactiveYearRangesReturnZeroRates(bool hasInactiveRange)
    {
        var data = Data();
        data[typeof(AssessmentYearRangeEntity)] = hasInactiveRange
            ? [new AssessmentYearRangeEntity { Id = 10021, IsActive = false }] : [];
        var rates = await Provider(data).LoadMasterTaxRatesAsync(Heads, default);
        Assert.Equal(0m, rates[1].Residential);
        Assert.Equal(0m, rates[1].Commercial);
    }

    [Fact]
    public async Task NewestActiveRangeOverridesOlderRatesAndIgnoresNewerInactiveRange()
    {
        var data = Data();
        data[typeof(AssessmentYearRangeEntity)] = [
            new AssessmentYearRangeEntity { Id = 10021, IsActive = true },
            new AssessmentYearRangeEntity { Id = 10022, IsActive = true },
            new AssessmentYearRangeEntity { Id = 10023, IsActive = false }];
        var rates = await Provider(data).LoadMasterTaxRatesAsync(Heads, default);
        Assert.Equal(0m, rates[1].Residential);
        Assert.Equal(800m, rates[1].Commercial);
    }

    [Fact]
    public async Task LeftJoinedMissingRatesAreZeroAndEducationDoesNotUseTheOldFallbackRules()
    {
        var provider = Provider(Data());
        var rates = await provider.LoadMasterTaxRatesAsync(Heads, default);
        Assert.Equal(0m, rates[2].Residential);
        Assert.Equal(0m, rates[2].Commercial);
        Assert.Equal("0", rates[2].ResidentialText);
        Assert.Equal("0", rates[2].CommercialText);
        Assert.Equal(0m, rates[4].Residential);
        Assert.Equal(0m, rates[4].Commercial);
    }

    [Fact]
    public async Task MasterBasedRatesFollowActiveRuleReferencePercentRvAndSelectedRange()
    {
        var data = Data();
        var taxes = data[typeof(TaxMasterEntity)].Cast<TaxMasterEntity>().ToArray();
        foreach (var tax in taxes.Where(t => t.Id is 2 or 4))
        {
            tax.CalculationModeMaster = new TaxCalculationModeMasterEntity { ModeCode = "MASTER_BASED" };
            tax.RuleDefinition = new DynamicTaxRuleEntity
            {
                IsActive = true, AttachedReference = tax.Id == 2 ? "TypeOfUse" : "PropertyType"
            };
        }
        data[typeof(PropertyTypeMasterEntity)] = [
            new PropertyTypeMasterEntity { Id = 10, Type = "R", IsActive = false },
            new PropertyTypeMasterEntity { Id = 11, Type = "C" },
            new PropertyTypeMasterEntity { Id = 12, Type = "I" }];
        data[typeof(TaxMasterMappingEntity)] = [
            Mapping(2, "1", 4), Mapping(2, "01", 3), Mapping(2, "2", 8),
            Mapping(4, "10", 21), Mapping(4, "11", 31.5m), Mapping(4, "12", 999),
            Mapping(1, "1", 999), // VALUE_BASED ignores master mappings.
            Mapping(3, "1", 999), // Inactive tax.
            Mapping(2, "999", 999),
            new TaxMasterMappingEntity { TaxId = 2, MasterKey = "1", ResultValue = 999,
                AssessmentYearRangeId = 10020, ResultMode = "PERCENT", ResultBase = "RV" },
            new TaxMasterMappingEntity { TaxId = 2, MasterKey = "1", ResultValue = 999,
                AssessmentYearRangeId = 10021, ResultMode = "FIXED", ResultBase = "RV" },
            new TaxMasterMappingEntity { TaxId = 2, MasterKey = "1", ResultValue = 999,
                AssessmentYearRangeId = 10021, ResultMode = "PERCENT", ResultBase = "ALV" }];
        var rateHeads = Heads.Select(h => h.Id == 4 ? h with { Code = "SERVICE", Name = "Service Tax" } : h).ToArray();
        var rates = await Provider(data).LoadMasterTaxRatesAsync(rateHeads, default);
        Assert.Equal(41m, rates[1].Residential);
        Assert.Equal(57m, rates[1].Commercial);
        Assert.Equal(7m, rates[2].Residential);
        Assert.Equal(8m, rates[2].Commercial);
        Assert.Equal(21m, rates[4].Residential);
        Assert.Equal(31.5m, rates[4].Commercial);
        Assert.False(rates.ContainsKey(3));

        taxes.Single(t => t.Id == 2).RuleDefinition!.IsActive = false;
        taxes.Single(t => t.Id == 4).RuleDefinition!.AttachedReference = "OwnerType";
        rates = await Provider(data).LoadMasterTaxRatesAsync(rateHeads, default);
        Assert.Equal(0m, rates[2].Residential);
        Assert.Equal(0m, rates[2].Commercial);
        Assert.Equal(0m, rates[4].Residential);
        Assert.Equal(0m, rates[4].Commercial);
    }

    private static TaxMasterMappingEntity Mapping(int taxId, string key, decimal value) => new()
    {
        TaxId = taxId, MasterKey = key, ResultValue = value, AssessmentYearRangeId = 10021,
        ResultMode = "PERCENT", ResultBase = "RV", IsActive = false
    };

    [Fact]
    public async Task TaxTableUsesMasterSumsWhileDemandPenaltyAndGrandTotalStayUnchanged()
    {
        var data = Data();
        data[typeof(TaxMasterEntity)] = [
            new TaxMasterEntity { Id = 1, TaxCode = "GEN", TaxName = "General Tax", IsActive = true,
                CalculationModeMaster = new TaxCalculationModeMasterEntity { ModeCode = "VALUE_BASED" } },
            new TaxMasterEntity { Id = 2, TaxCode = "ILLEGAL", TaxName = "Assessment Penalty", IsActive = true }];
        data[typeof(RetrospectiveTaxCalculationDetailEntity)] = [new RetrospectiveTaxCalculationDetailEntity
        {
            Id = 1, PropertyId = 1, CalculationId = 7, IsActive = true,
            FromDate = new DateTime(2026, 4, 1), ToDate = new DateTime(2027, 3, 31),
            RetrospectiveTaxAmount = 30m, PenaltyAmount = 3m
        }];
        data[typeof(YearMasterEntity)] = [new YearMasterEntity { Id = 1, Year = 2026, IsActive = true }];
        data[typeof(TransMastEntity)] = [new TransMastEntity
        {
            Id = 1, PropertyId = 1, FinanceYearId = 1, TaxId = 1, TaxAmount = 30m, IsActive = true, CalculationType = "RV",
            PolicyCodeMaster = new PolicyCodeMasterEntity { IsRetroDemand = true }
        }, new TransMastEntity { Id = 2, PropertyId = 1, FinanceYearId = 1, TaxId = 2,
            TaxAmount = 3m, IsActive = true, CalculationType = "RV" }];
        var provider = Provider(data);
        var method = typeof(SpecialNoticeThaneDataProvider).GetMethod("BuildTaxTableAsync", BindingFlags.NonPublic | BindingFlags.Instance)!;
        var table = await (Task<SpecialNoticeThaneTaxTable?>)method.Invoke(provider,
            [1, new Dictionary<string, string>(), CancellationToken.None])!;
        Assert.NotNull(table);
        var rows = JsonSerializer.SerializeToElement(table.Rows);
        var tax = Assert.Single(rows.EnumerateArray(), r => r.GetProperty("taxCode").GetString() == "GEN");
        Assert.Equal(41m, tax.GetProperty("residentialRate").GetDecimal());
        Assert.Equal(57m, tax.GetProperty("nonResidentialRate").GetDecimal());
        Assert.Equal(30m, tax.GetProperty("currentTax").GetDecimal());
        var penalty = Assert.Single(rows.EnumerateArray(), r => r.GetProperty("rowType").GetString() == "penalty");
        Assert.Equal(0m, penalty.GetProperty("residentialRate").GetDecimal());
        Assert.Equal(0m, penalty.GetProperty("nonResidentialRate").GetDecimal());
        Assert.Equal(3m, penalty.GetProperty("currentTax").GetDecimal());
        Assert.Equal(0m, table.PreviousTotal);
        Assert.Equal(33m, table.CurrentTotal);
    }

    [Fact]
    public async Task EducationAndEmploymentTaxRatesUseAlvFromTransMastAndSlabsFromMasters()
    {
        var data = Data();
        data[typeof(TransMastEntity)] = [
            new TransMastEntity { PropertyId = 1, CalculationAnnualValue = 45000m, IsActive = true }
        ];
        data[typeof(EducationTaxMasterEntity)] = [
            new EducationTaxMasterEntity { Type = "R", MinAmount = 0m, MaxAmount = 30000m, Rate = 2m, IsActive = true },
            new EducationTaxMasterEntity { Type = "R", MinAmount = 30001m, MaxAmount = 100000m, Rate = 3m, IsActive = true },
            new EducationTaxMasterEntity { Type = "C", MinAmount = 0m, MaxAmount = 100000m, Rate = 5m, IsActive = true }
        ];
        data[typeof(EmploymentTaxMasterEntity)] = [
            new EmploymentTaxMasterEntity { Type = "R", MinAmount = 0m, MaxAmount = 30000m, Rate = 1m, IsActive = true },
            new EmploymentTaxMasterEntity { Type = "R", MinAmount = 30001m, MaxAmount = 100000m, Rate = 1.5m, IsActive = true },
            new EmploymentTaxMasterEntity { Type = "C", MinAmount = 0m, MaxAmount = 100000m, Rate = 2.5m, IsActive = true }
        ];
        var heads = new SpecialNoticeTaxHead[]
        {
            new(1, "GEN", "General Tax", 1, true, true, "TAX"),
            new(4, "STATE_EDU", "Education Cess (GOM)", 4, true, false, "EDU"),
            new(5, "STATE_EMP", "Employment Guarantee Cess (GOM)", 5, true, false, "EMP")
        };

        var provider = Provider(data);
        var rates = await provider.LoadMasterTaxRatesAsync(heads, default, propertyId: 1);

        // For ALV = 45000:
        // Education Tax: R slab 30001-100000 -> 3%, C slab 0-100000 -> 5%
        Assert.Equal(3m, rates[4].Residential);
        Assert.Equal(5m, rates[4].Commercial);
        Assert.Equal("3", rates[4].ResidentialText);
        Assert.Equal("5", rates[4].CommercialText);

        // Employment Tax: R slab 30001-100000 -> 1.5%, C slab 0-100000 -> 2.5%
        Assert.Equal(1.5m, rates[5].Residential);
        Assert.Equal(2.5m, rates[5].Commercial);
        Assert.Equal("1.5", rates[5].ResidentialText);
        Assert.Equal("2.5", rates[5].CommercialText);
    }

    [Theory]
    [InlineData("R", 4, 5, 10, 0, 2.5)]
    [InlineData("R", 5, 5, 10, 0, 2.5)]
    [InlineData("C", 8, 5, 10, 0, 2.5)]
    [InlineData("I", 8, 5, 10, 0, 2.5)]
    public async Task AlvMasterSlabsDetermineSpecialRatesRegardlessOfSavedPercentagesOrUsage(
        string usage, decimal savedEducation, decimal expectedR, decimal expectedC,
        decimal expectedEmpR, decimal expectedEmpC)
    {
        var data = SpecialTaxRateData(usage);
        data[typeof(RVCalculationTaxDetailsEntity)] = [
            new RVCalculationTaxDetailsEntity { RVCalculationResultsId = 201, TaxId = 4, TaxPercentage = savedEducation },
            new RVCalculationTaxDetailsEntity { RVCalculationResultsId = 201, TaxId = 5, TaxPercentage = usage == "R" ? 0m : 2m },
            new RVCalculationTaxDetailsEntity { RVCalculationResultsId = 200, TaxId = 4, TaxPercentage = 99m },
            new RVCalculationTaxDetailsEntity { RVCalculationResultsId = 202, TaxId = 4, TaxPercentage = 98m },
            new RVCalculationTaxDetailsEntity { RVCalculationResultsId = 203, TaxId = 4, TaxPercentage = 97m },
            new RVCalculationTaxDetailsEntity { RVCalculationResultsId = 201, TaxId = 4, TaxPercentage = 96m, IsActive = false },
            new RVCalculationTaxDetailsEntity { RVCalculationResultsId = 201, TaxId = 4, TaxPercentage = 95m, MarkedForDeletion = true },
            new RVCalculationTaxDetailsEntity { RVCalculationResultsId = 201, TaxId = 1, TaxPercentage = 94m }
        ];
        var rates = await Provider(data).LoadMasterTaxRatesAsync(SpecialTaxHeads, default, 1);
        Assert.Equal(expectedR, rates[4].Residential);
        Assert.Equal(expectedC, rates[4].Commercial);
        Assert.Equal(expectedEmpR, rates[5].Residential);
        Assert.Equal(expectedEmpC, rates[5].Commercial);
        Assert.Equal(41m, rates[1].Residential); // Other tax heads still use their masters.
    }

    [Fact]
    public async Task FirstActiveLedgerAlvIsUsedWithoutPreferringPositiveOrUndeletedRows()
    {
        var data = SpecialTaxRateData("R");
        data[typeof(TransMastEntity)] = [
            new TransMastEntity { PropertyId = 2, CalculationAnnualValue = 3226.33m },
            new TransMastEntity { PropertyId = 1, CalculationAnnualValue = 3226.33m, IsActive = false },
            new TransMastEntity { PropertyId = 1, CalculationAnnualValue = 0m, MarkedForDeletion = true },
            new TransMastEntity { PropertyId = 1, CalculationAnnualValue = 3226.33m }
        ];
        var rates = await Provider(data).LoadMasterTaxRatesAsync(SpecialTaxHeads, default, 1);
        Assert.Equal(0m, rates[4].Residential);
        Assert.Equal(0m, rates[4].Commercial);
        Assert.Equal(0m, rates[5].Commercial);
    }

    [Theory]
    [InlineData(3001, 5, 10)]
    [InlineData(6000.9999, 5, 10)]
    [InlineData(3000.9999, 0, 0)]
    public async Task SpecialSlabsMatchInclusiveBetweenWithoutActiveOrYearFilters(decimal alv, decimal r, decimal c)
    {
        var data = SpecialTaxRateData("R");
        data[typeof(TransMastEntity)] = [new TransMastEntity { PropertyId = 1, CalculationAnnualValue = alv }];
        foreach (var slab in data[typeof(EducationTaxMasterEntity)].Cast<EducationTaxMasterEntity>())
        {
            slab.IsActive = false;
            slab.Year = 2015;
        }
        data[typeof(EducationTaxMasterEntity)] = data[typeof(EducationTaxMasterEntity)].Append(
            new EducationTaxMasterEntity { Type = "R", MinAmount = null, MaxAmount = null, Rate = 99m }).ToArray();
        var rates = await Provider(data).LoadMasterTaxRatesAsync(SpecialTaxHeads, default, 1);
        Assert.Equal(r, rates[4].Residential);
        Assert.Equal(c, rates[4].Commercial);
    }

    [Fact]
    public async Task AlvSlabChangesDisplayedRateWithoutRecalculatingSavedCharges()
    {
        var data = SpecialTaxRateData("R");
        data[typeof(YearMasterEntity)] = [new YearMasterEntity { Id = 10, Year = 2026, IsActive = true }];
        data[typeof(TransMastEntity)] = [Ledger(1, 10, 1, 900m, "OC"), Ledger(2, 10, 4, 116m, "OC")];
        foreach (var ledger in data[typeof(TransMastEntity)].Cast<TransMastEntity>())
            ledger.CalculationAnnualValue = 3226.33m;
        data[typeof(RVCalculationTaxDetailsEntity)] = [
            new RVCalculationTaxDetailsEntity { RVCalculationResultsId = 201, TaxId = 4,
                TaxPercentage = 4m, TaxAmount = 116m }
        ];
        var method = typeof(SpecialNoticeThaneDataProvider).GetMethod("BuildTaxTableAsync", BindingFlags.NonPublic | BindingFlags.Instance)!;
        var table = await (Task<SpecialNoticeThaneTaxTable>)method.Invoke(Provider(data),
            [1, new Dictionary<string, string>(), CancellationToken.None])!;
        var rows = JsonSerializer.SerializeToElement(table.Rows).EnumerateArray().ToArray();
        var education = Assert.Single(rows, r => r.GetProperty("taxCode").GetString() == "STATE_EDU");
        Assert.Equal(5m, education.GetProperty("residentialRate").GetDecimal());
        Assert.Equal(116m, education.GetProperty("currentTax").GetDecimal());
        Assert.Equal(1016m, table.CurrentTotal);
    }

    [Fact]
    public async Task MissingActiveLedgerAndMissingSlabsProduceZeroSpecialRates()
    {
        var data = SpecialTaxRateData("R");
        data[typeof(TransMastEntity)] = [];
        data[typeof(EducationTaxMasterEntity)] = [];
        var rates = await Provider(data).LoadMasterTaxRatesAsync(SpecialTaxHeads, default, 1);
        Assert.Equal(0m, rates[4].Residential);
        Assert.Equal(0m, rates[4].Commercial);
        Assert.Equal(0m, rates[5].Residential);
        Assert.Equal(0m, rates[5].Commercial);
    }

    [Fact]
    public async Task OverlappingSpecialSlabsAreRejectedLikeSqlScalarSubqueries()
    {
        var data = SpecialTaxRateData("R");
        data[typeof(EducationTaxMasterEntity)] = data[typeof(EducationTaxMasterEntity)].Append(
            new EducationTaxMasterEntity { Type = "R", MinAmount = 3001m, MaxAmount = 6000.9999m, Rate = 6m }).ToArray();
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            Provider(data).LoadMasterTaxRatesAsync(SpecialTaxHeads, default, 1));
    }

    private static SpecialNoticeTaxHead[] SpecialTaxHeads => [
        Heads[0], Heads[3], new(5, "STATE_EMP", "Employment Tax", 5, true, false, "EMP") ];

    private static Dictionary<Type, object[]> SpecialTaxRateData(string usage)
    {
        var data = Data();
        data[typeof(TransMastEntity)] = [new TransMastEntity { PropertyId = 1, CalculationAnnualValue = 3226.33m }];
        data[typeof(TypeOfUseEntity)] = data[typeof(TypeOfUseEntity)].Append(
            new TypeOfUseEntity { Id = 80, TypeOfUseCode = "DETAIL_USAGE", Type = usage }).ToArray();
        data[typeof(PropertyDetailsEntity)] = [
            new PropertyDetailsEntity { Id = 10, PropertyId = 1, TypeOfUseId = 80, IsTaxable = true },
            new PropertyDetailsEntity { Id = 11, PropertyId = 2, TypeOfUseId = 80, IsTaxable = true }
        ];
        data[typeof(RVCalculationResultsEntity)] = [
            new RVCalculationResultsEntity { Id = 200, PropertyId = 1, PropertyDetailsId = 10, CreatedDate = new DateTime(2026, 1, 1) },
            new RVCalculationResultsEntity { Id = 201, PropertyId = 1, PropertyDetailsId = 10, UpdatedDate = new DateTime(2026, 2, 1), RateableValue = 2903.70m },
            new RVCalculationResultsEntity { Id = 202, PropertyId = 2, PropertyDetailsId = 11 },
            new RVCalculationResultsEntity { Id = 203, PropertyId = 1, PropertyDetailsId = 10, IsActive = false }
        ];
        data[typeof(EducationTaxMasterEntity)] = [
            new EducationTaxMasterEntity { Type = "R", MinAmount = 3001m, MaxAmount = 6000.9999m, Rate = 5m },
            new EducationTaxMasterEntity { Type = "C", MinAmount = 3001m, MaxAmount = 6000.9999m, Rate = 10m }
        ];
        data[typeof(EmploymentTaxMasterEntity)] = [
            new EmploymentTaxMasterEntity { Type = "C", MinAmount = 3001m, MaxAmount = 6000.9999m, Rate = 2.5m }
        ];
        return data;
    }

    [Theory]
    [InlineData("Calculated", 0, 3, 33, 24)]
    [InlineData("Calculated", 2, 5, 35, 24)]
    [InlineData("ManualReview", 2, 5, 35, 24)]
    [InlineData("Failed", 0, 3, 33, 24)]
    public async Task ReportPreservesLatestSavedAssessmentPenaltiesWithoutChangingLedgerTaxes(
        string status, decimal illegal, decimal expectedPenalty, decimal expectedTotal, decimal expectedPreviousTotal)
    {
        var data = Data();
        data[typeof(YearMasterEntity)] = [new YearMasterEntity { Id = 10, Year = 2026, IsActive = true },
            new YearMasterEntity { Id = 9, Year = 2025 }];
        data[typeof(TaxMasterEntity)] = [
            new TaxMasterEntity { Id = 1, TaxCode = "GEN", TaxName = "General Tax", IsActive = true,
                CalculationModeMaster = new TaxCalculationModeMasterEntity { ModeCode = "VALUE_BASED" } },
            new TaxMasterEntity { Id = 5, TaxCode = "ILLEGAL", TaxName = "Penalty", IsActive = true }];
        data[typeof(TransMastEntity)] = [Ledger(1, 10, 1, 30m, "OC"),
            Ledger(2, 9, 1, 20m, "OC"), Ledger(3, 10, 5, illegal, "OC")];
        var latestDate = new DateTime(2026, 10, 22);
        data[typeof(RetrospectiveTaxCalculationEntity)] = [
            Assessment(7, latestDate.AddDays(-1)), Assessment(8, latestDate, status),
            Assessment(9, latestDate.AddDays(1), mode: "FLOOR"),
            Assessment(10, latestDate.AddDays(1), active: false),
            Assessment(11, latestDate.AddDays(1), deleted: true),
            Assessment(12, latestDate.AddDays(1), property: 2)];
        data[typeof(RetrospectiveTaxCalculationDetailEntity)] = [
            Detail(1, 7, 2026, 999m), Detail(2, 8, 2025, 4m), Detail(3, 8, 2026, 3m),
            Detail(4, 8, 2027, 999m), Detail(5, 8, 2026, 999m, active: false),
            Detail(6, 8, 2026, 999m, deleted: true), Detail(7, 8, 2026, 999m, property: 2),
            Detail(8, 9, 2026, 999m), Detail(9, 10, 2026, 999m), Detail(10, 11, 2026, 999m)];

        var method = typeof(SpecialNoticeThaneDataProvider).GetMethod("BuildTaxTableAsync", BindingFlags.NonPublic | BindingFlags.Instance)!;
        var table = await (Task<SpecialNoticeThaneTaxTable>)method.Invoke(Provider(data),
            [1, new Dictionary<string, string>(), CancellationToken.None])!;

        Assert.Equal(30m, table.CurrentSubtotal);
        Assert.Equal(20m, table.PreviousSubtotal);
        Assert.Equal(expectedPenalty, table.CurrentPenalty);
        Assert.Equal(expectedTotal, table.CurrentTotal);
        Assert.Equal(expectedPreviousTotal, table.PreviousTotal);
        var rows = JsonSerializer.SerializeToElement(table.Rows).EnumerateArray().ToArray();
        var gen = Assert.Single(rows, row => row.GetProperty("taxCode").GetString() == "GEN");
        Assert.Equal(30m, gen.GetProperty("currentTax").GetDecimal());
        Assert.Equal(41m, gen.GetProperty("residentialRate").GetDecimal());
        Assert.Equal(57m, gen.GetProperty("nonResidentialRate").GetDecimal());
        Assert.Equal(expectedTotal + expectedPreviousTotal, rows[^1].GetProperty("totalTax").GetDecimal());

        static RetrospectiveTaxCalculationEntity Assessment(int id, DateTime date, string status = "Calculated",
            string mode = "PROPERTY", bool active = true, bool deleted = false, int property = 1) => new()
        {
            Id = id, PropertyId = property, CalculationMode = mode, CalculationStatus = status,
            AssessmentDate = date, IsActive = active, MarkedForDeletion = deleted
        };

        static RetrospectiveTaxCalculationDetailEntity Detail(int id, int calculation, int year, decimal penalty,
            bool active = true, bool deleted = false, int property = 1) => new()
        {
            Id = id, CalculationId = calculation, PropertyId = property, IsActive = active,
            MarkedForDeletion = deleted, FinancialYear = $"{year}-{(year + 1) % 100:00}",
            FromDate = new DateTime(year + 1, 1, 1), ToDate = new DateTime(year + 1, 3, 31),
            PenaltyAmount = penalty
        };
    }

    private static Dictionary<Type, object[]> Data()
    {
        var data = new Dictionary<Type, object[]>();
        data[typeof(TaxMasterEntity)] = Heads.Select(h => new TaxMasterEntity
        {
            Id = h.Id, TaxCode = h.Code, TaxName = h.Name, IsActive = h.IsActive,
            CalculationModeMaster = new TaxCalculationModeMasterEntity { ModeCode = "VALUE_BASED" }
        }).Cast<object>().ToArray();
        data[typeof(AssessmentYearRangeEntity)] = [
            new AssessmentYearRangeEntity { Id = 10020, IsActive = true, FromYear = 2026, ToYear = 2030 },
            new AssessmentYearRangeEntity { Id = 10021, IsActive = true, FromYear = 2000, ToYear = 2005 },
            new AssessmentYearRangeEntity { Id = 10022, IsActive = false }];
        // Type differs from TypeOfUseCode; the supplied SQL uses the code and does not filter usage.IsActive.
        data[typeof(TypeOfUseEntity)] = [
            new TypeOfUseEntity { Id = 1, TypeOfUseCode = "R", Type = "C", IsActive = false },
            new TypeOfUseEntity { Id = 2, TypeOfUseCode = "C", Type = "R", IsActive = false },
            new TypeOfUseEntity { Id = 3, TypeOfUseCode = "R", Type = "R", IsActive = true },
            new TypeOfUseEntity { Id = 4, TypeOfUseCode = "I", Type = "R", IsActive = true }];
        data[typeof(TaxPercentageMasterRVEntity)] = [
            Rate(1, 1, 10), Rate(1, 3, 10), Rate(1, 1, 21),
            Rate(1, 2, 30), Rate(1, 2, 13.5m), Rate(1, 2, 13.5m),
            Rate(1, 4, 999), Rate(1, 999, 999), Rate(3, 1, 999),
            Rate(4, 1, 4), Rate(4, 2, 5),
            new TaxPercentageMasterRVEntity { TaxId = 1, TypeOfUseId = 1, YearRangeRVId = 10020, TaxPercentage = 700, IsActive = true },
            new TaxPercentageMasterRVEntity { TaxId = 1, TypeOfUseId = 2, YearRangeRVId = 10022, TaxPercentage = 800, IsActive = true }];
        data[typeof(RVCalculationResultsEntity)] = [new RVCalculationResultsEntity { Id = 100, PropertyId = 1, PropertyDetailsId = 1, IsActive = true }];
        data[typeof(RVCalculationTaxDetailsEntity)] = [new RVCalculationTaxDetailsEntity { RVCalculationResultsId = 100, TaxId = 1, TaxPercentage = 999, IsActive = true }];
        return data;
    }

    private static TaxPercentageMasterRVEntity Rate(int tax, int use, decimal percentage) =>
        new() { TaxId = tax, TypeOfUseId = use, TaxPercentage = percentage, YearRangeRVId = 10021, IsActive = false };

    private static SpecialNoticeThaneDataProvider Provider(Dictionary<Type, object[]> rows)
    {
        var policies = new Mock<IPolicyConfigurationService>();
        policies.Setup(p => p.GetPolicyValuesAsync(It.IsAny<Dictionary<string, string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, string>());
        var constructor = typeof(SpecialNoticeThaneDataProvider).GetConstructors().Single();
        return (SpecialNoticeThaneDataProvider)constructor.Invoke(constructor.GetParameters().Select(p =>
        {
            if (p.ParameterType.IsGenericType && p.ParameterType.GetGenericTypeDefinition() == typeof(IReportDataRepository<>))
            {
                var entity = p.ParameterType.GetGenericArguments()[0];
                return typeof(SpecialNoticeThaneMasterTaxRateTests).GetMethod(nameof(Repository), BindingFlags.NonPublic | BindingFlags.Static)!
                    .MakeGenericMethod(entity).Invoke(null, [rows.GetValueOrDefault(entity) ?? []]);
            }
            if (p.ParameterType == typeof(IPolicyConfigurationService)) return policies.Object;
            if (p.ParameterType == typeof(IUlbConfigService)) return Mock.Of<IUlbConfigService>();
            if (p.ParameterType == typeof(IDocumentApplicationService)) return Mock.Of<IDocumentApplicationService>();
            if (p.ParameterType == typeof(IHttpClientFactory)) return Mock.Of<IHttpClientFactory>();
            return null;
        }).ToArray());
    }

    private static object Repository<T>(object[] rows) where T : class
    {
        var mock = new Mock<IReportDataRepository<T>>();
        mock.Setup(r => r.GetQueryable()).Returns(rows.Cast<T>().ToArray().BuildMock());
        return mock.Object;
    }
}
