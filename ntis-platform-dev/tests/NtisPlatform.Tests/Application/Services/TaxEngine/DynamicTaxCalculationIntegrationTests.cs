using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable.Moq;
using Moq;
using NtisPlatform.Application.DTOs.Rules.RuleExecution;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Interfaces.Rules;
using NtisPlatform.Application.Interfaces.TaxEngine;
using NtisPlatform.Application.Services.Rules;
using NtisPlatform.Application.Services.TaxEngine;
using NtisPlatform.Application.Services.TaxEngine.DynamicTax;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.Rules;
using NtisPlatform.Core.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.TaxEngine;

/// <summary>
/// Proves Dynamic Tax Register configuration actually reaches persisted output â€” that a
/// CONDITION_BASED / MASTER_BASED / HYBRID configuration row changes
/// <see cref="RVCalculationTaxDetailsEntity.TaxAmount"/>, which nothing verified before this
/// integration existed.
///
/// <para>
/// Modelled on <c>TaxationRateAndPercentageModeWiringTests</c>: drive the real
/// <see cref="RateableValueService"/> with the real calculator and persistence service, and assert on
/// the rows handed to <c>AddRangeAsync</c> rather than on any intermediate return value.
/// </para>
/// </summary>
public class DynamicTaxCalculationIntegrationTests
{
    private const int PropertyId = 500;
    private const int DetailId = 10;
    private const int SecondDetailId = 11;
    private const int YearRangeId = 1;
    private const int TypeOfUseId = 1;
    private const int PropertyTypeId = 7;
    private const int OwnerTypeId = 3;

    /// <summary>An empty condition list â€” the evaluator treats it as an "always matches" catch-all.</summary>
    private const string AlwaysMatches = "[]";

    private readonly Mock<IRepository<PropertyEntity, int>> _propertyRepo = new();
    private readonly Mock<IRepository<PropertyDetailsEntity, int>> _propertyDetailsRepo = new();
    private readonly Mock<IRepository<PropertyAssessmentEntity, int>> _propertyAssessmentRepo = new();
    private readonly Mock<IRepository<RVCalculationResultsEntity, int>> _taxResultsRepo = new();
    private readonly Mock<IRepository<RVCalculationTaxDetailsEntity, int>> _taxDetailsRepo = new();
    private readonly Mock<IRepository<PolicyTaxDetailsEntity, int>> _policyTaxRepo = new();
    private readonly Mock<IRepository<RenterMastEntity, int>> _renterRepo = new();
    private readonly Mock<IRepository<TransMastEntity, int>> _transMastRepo = new();
    private readonly Mock<IRepository<YearMasterEntity, int>> _yearMasterRepo = new();
    private readonly Mock<IRepository<PropertyRuleApplicationLogEntity, int>> _ruleLogRepo = new();
    private readonly Mock<IRepository<RulesFieldEntity, int>> _rulesFieldRepo = new();
    private readonly Mock<ITaxMasterDataService> _masterData = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();
    private readonly Mock<IPolicyConfigurationService> _policyConfig = new();
    private readonly Mock<IFinanceYearProvider> _financeYearProvider = new();
    private readonly Mock<IRVCalculationCleanupService> _cleanup = new();
    private readonly Mock<IDynamicTaxConfigReader> _configReader = new();

    // Every test that reaches CalculateAndSaveAsync's fast-path check needs this, since it's now
    // folded into the cache-invalidation signature alongside the property's own data.
        private readonly Mock<IPropertyFieldFlattenerService> _flattener = new();
    private readonly Mock<IRVCalculationSignatureService> _signatureService = new();

    /// <summary>Tax-detail rows the pipeline persisted, captured from AddRangeAsync.</summary>
    private readonly List<RVCalculationTaxDetailsEntity> _persistedTaxDetails = new();

    private Dictionary<string, object> _fieldValues = new();

    public DynamicTaxCalculationIntegrationTests()
    {
        var currentYear = DateTime.Today.Month >= 4 ? DateTime.Today.Year : DateTime.Today.Year - 1;
        _financeYearProvider.Setup(p => p.GetCurrentFinanceYear()).Returns(currentYear);

        _configReader
            .Setup(r => r.GetConfigFingerprintAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync("test-fingerprint");

        _policyConfig
            .Setup(p => p.GetPolicyValuesAsync(It.IsAny<Dictionary<string, string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Dictionary<string, string> defaults, CancellationToken _) => defaults);

        _yearMasterRepo.Setup(r => r.GetQueryable()).Returns(
            new List<YearMasterEntity> { new() { Id = 2, Year = currentYear, IsActive = true } }
                .BuildMockDbSet().Object);

        _unitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _transMastRepo.Setup(r => r.GetQueryable()).Returns(new List<TransMastEntity>().BuildMockDbSet().Object);
        _ruleLogRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyRuleApplicationLogEntity>().BuildMockDbSet().Object);
        _taxResultsRepo.Setup(r => r.GetQueryable()).Returns(new List<RVCalculationResultsEntity>().BuildMockDbSet().Object);
        _taxDetailsRepo.Setup(r => r.GetQueryable()).Returns(new List<RVCalculationTaxDetailsEntity>().BuildMockDbSet().Object);
        _policyTaxRepo.Setup(r => r.GetQueryable()).Returns(new List<PolicyTaxDetailsEntity>().BuildMockDbSet().Object);
        _renterRepo.Setup(r => r.GetQueryable()).Returns(new List<RenterMastEntity>().BuildMockDbSet().Object);
        _rulesFieldRepo.Setup(r => r.GetQueryable()).Returns(new List<RulesFieldEntity>().BuildMockDbSet().Object);

        _policyTaxRepo.Setup(r => r.UpdateAsync(It.IsAny<PolicyTaxDetailsEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _taxDetailsRepo
            .Setup(r => r.AddRangeAsync(It.IsAny<IEnumerable<RVCalculationTaxDetailsEntity>>(), It.IsAny<CancellationToken>()))
            .Callback((IEnumerable<RVCalculationTaxDetailsEntity> rows, CancellationToken _) =>
                _persistedTaxDetails.AddRange(rows))
            .Returns(Task.CompletedTask);

        // The flattener is mocked so condition tests control field values directly, without depending
        // on how the real flattener names or derives each key.
        _flattener
            .Setup(f => f.Flatten(It.IsAny<PropertyCalculationContext>(), It.IsAny<List<RulesFieldEntity>>()))
            .Returns(() => _fieldValues);

                _signatureService.Setup(s => s.GetAsync(It.IsAny<int>()))
            .ReturnsAsync((RVCalculationSignatureEntity?)null);
        _signatureService.Setup(s => s.UpsertAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<DateTime>()))
            .Returns(Task.CompletedTask);

        SetupProperty();
        SetupMasterData();
    }

    // â”€â”€ Fixture â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private void SetupProperty(bool twoDetails = false)
    {
        _propertyRepo.Setup(r => r.GetQueryable()).Returns(
            new List<PropertyEntity>
            {
                new() { Id = PropertyId, IsActive = true, MarkedForDeletion = false, TaxZoneId = 1, WardId = 1, PropertyTypeId = PropertyTypeId }
            }.BuildMockDbSet().Object);

        _propertyAssessmentRepo.Setup(r => r.GetQueryable()).Returns(
            new List<PropertyAssessmentEntity>
            {
                new() { Id = 1, PropertyId = PropertyId, OwnerTypeId = OwnerTypeId, IsActive = true }
            }.BuildMockDbSet().Object);

        var details = new List<PropertyDetailsEntity>
        {
            new()
            {
                Id = DetailId, PropertyId = PropertyId, IsActive = true, ConstructionYear = "2010",
                TypeOfUseId = TypeOfUseId, ConstructionTypeId = 1, FloorId = 1, CarpetAreaSqMeter = 1000
            }
        };

        if (twoDetails)
        {
            details.Add(new PropertyDetailsEntity
            {
                Id = SecondDetailId, PropertyId = PropertyId, IsActive = true, ConstructionYear = "2010",
                TypeOfUseId = TypeOfUseId, ConstructionTypeId = 1, FloorId = 2, CarpetAreaSqMeter = 800
            });
        }

        _propertyDetailsRepo.Setup(r => r.GetQueryable()).Returns(details.BuildMockDbSet().Object);
    }

    private void SetupMasterData()
    {
        _masterData.Setup(m => m.GetActiveTypeOfUsesAsync()).ReturnsAsync(new List<TypeOfUseEntity>
        {
            new() { Id = TypeOfUseId, Type = "R", TypeOfUseGroupId = 1, IsActive = true }
        });
        _masterData.Setup(m => m.GetActiveSubTypeOfUsesAsync()).ReturnsAsync(new List<SubTypeOfUseEntity>());
        _masterData.Setup(m => m.GetActivePropertyCategoriesAsync()).ReturnsAsync(new List<PropertyCategoryEntity>());
        _masterData.Setup(m => m.GetActiveFloorsAsync()).ReturnsAsync(new List<FloorEntity>
        {
            new() { Id = 1, FloorCode = "GF", IsActive = true },
            new() { Id = 2, FloorCode = "FF", IsActive = true }
        });
        _masterData.Setup(m => m.GetActiveSubFloorsAsync()).ReturnsAsync(new List<SubFloorEntity>());
        _masterData.Setup(m => m.GetActiveConstructionTypesAsync()).ReturnsAsync(new List<ConstructionTypeEntity>
        {
            new() { Id = 1, ConstructionCode = "RCC", IsActive = true }
        });
        _masterData.Setup(m => m.GetRateSectionIdForWardAsync(It.IsAny<int?>())).ReturnsAsync(1);
        _masterData.Setup(m => m.GetRatesForSectionAsync(It.IsAny<int>())).ReturnsAsync(new List<RateEntity>
        {
            new()
            {
                Id = 1, TaxZoneId = 1, ConstructionTypeId = 1, TypeOfUseGroupId = 1,
                YearRangeRVId = YearRangeId, RateSquareMeter = 1200, IsActive = true
            }
        });
        _masterData.Setup(m => m.GetActiveDepreciationsAsync()).ReturnsAsync(new List<DepreciationMasterEntity>
        {
            new() { Id = 1, ConstructionTypeId = 1, MinYear = 0, MaxYear = 100, Rate = 10m, IsActive = true }
        });
        _masterData.Setup(m => m.GetActiveYearRangesAsync()).ReturnsAsync(new List<AssessmentYearRangeEntity>
        {
            new() { Id = YearRangeId, FromYear = 2000, ToYear = 2030, IsActive = true }
        });
        _masterData.Setup(m => m.GetActiveTaxPercentagesAsync()).ReturnsAsync(new List<TaxPercentageMasterRVEntity>());
        _masterData.Setup(m => m.GetActiveEducationTaxSlabsAsync()).ReturnsAsync(new List<EducationTaxMasterEntity>());
        _masterData.Setup(m => m.GetActiveEmploymentTaxSlabsAsync()).ReturnsAsync(new List<EmploymentTaxMasterEntity>());
    }

    private static TaxCalculationModeMasterEntity Mode(
        string code, bool value = false, bool condition = false, bool master = false, bool hybrid = false) =>
        new()
        {
            Id = code.GetHashCode() & 0x7fffffff,
            ModeCode = code,
            ModeName = code,
            IsActive = true,
            UsesValueConfig = value,
            UsesConditionConfig = condition,
            UsesMasterConfig = master,
            UsesHybridConfig = hybrid
        };

    private static TaxMasterEntity Tax(int id, string code, TaxCalculationModeMasterEntity mode, int? ruleDefinitionId = null) =>
        new()
        {
            Id = id,
            TaxCode = code,
            TaxName = code,
            IsActive = true,
            CalculationModeId = mode.Id,
            CalculationModeMaster = mode,
            RuleDefinitionId = ruleDefinitionId
        };

    private void UseTaxes(params TaxMasterEntity[] taxes) =>
        _masterData.Setup(m => m.GetActiveTaxesAsync()).ReturnsAsync(taxes.ToList());

    private void UseConfig(DynamicTaxConfigSnapshot snapshot) =>
        _configReader
            .Setup(r => r.LoadAsync(It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

    private static DynamicTaxConfigSnapshot Snapshot(
        IEnumerable<TaxConditionRuleEntity>? conditionRows = null,
        IEnumerable<TaxMasterMappingEntity>? mappings = null,
        IEnumerable<TaxHybridConfigEntity>? hybridConfigs = null,
        IEnumerable<DynamicTaxRuleEntity>? rules = null) =>
        new()
        {
            ConditionRulesByTax = (conditionRows ?? [])
                .GroupBy(r => r.TaxId)
                .ToDictionary(g => g.Key, g => g.OrderBy(r => r.SortOrder).ThenBy(r => r.Id).ToList()),
            MasterMappingsByTax = (mappings ?? [])
                .GroupBy(m => m.TaxId)
                .ToDictionary(g => g.Key, g => g.ToList()),
            HybridConfigByTax = (hybridConfigs ?? [])
                .ToDictionary(h => h.TaxId),
            RulesById = (rules ?? []).ToDictionary(r => r.Id)
        };

    private RateableValueService CreateService(decimal buildingTotalRateableValue = 0m)
    {
        var persistence = new RVPersistenceService(
            _taxResultsRepo.Object,
            _taxDetailsRepo.Object,
            _policyTaxRepo.Object,
            PolicyCodeMasterRepo(),
            _transMastRepo.Object,
            _ruleLogRepo.Object,
            TaxMasterRepo(),
            _unitOfWork.Object,
            NullLogger<RVPersistenceService>.Instance,
            TimeProvider.System);

        var contextLoader = new Mock<IPropertyContextLoaderService>();
        contextLoader
            .Setup(c => c.LoadPropertyContextAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .Returns(async (int propId, int finYear, CancellationToken _) =>
            {
                var property = _propertyRepo.Object.GetQueryable().First(x => x.Id == propId);
                var details = _propertyDetailsRepo.Object.GetQueryable().Where(x => x.PropertyId == propId).ToList();
                var assessment = _propertyAssessmentRepo.Object.GetQueryable().FirstOrDefault(x => x.PropertyId == propId);
                var yearRanges = await _masterData.Object.GetActiveYearRangesAsync();

                return new PropertyCalculationContext
                {
                    Property = property,
                    PropertyAssessment = assessment,
                    Details = details,
                    Renters = new List<RenterMastEntity>(),
                    YearRanges = yearRanges,
                    DetailYearRangeRVIdMap = details.ToDictionary(d => d.Id, _ => YearRangeId),
                    Parameters = new PropertyCalculationParameters
                    {
                        FinanceYear = finYear,
                        ConstructionYearValue = 2010,
                        YearRangeRVId = YearRangeId,
                        BuildingTotalRateableValue = buildingTotalRateableValue
                    }
                };
            });

        var ruleApplier = new Mock<IRuleApplierService>();
        ruleApplier
            .Setup(r => r.ApplyRulesAsync(It.IsAny<RuleApplierContext>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RuleApplierContext ctx, int _, CancellationToken __) =>
                new RuleApplicationResult { FinalValue = ctx.InitialValue, AppliedRules = new() });

        return new RateableValueService(
            _masterData.Object,
            _unitOfWork.Object,
            NullLogger<RateableValueService>.Instance,
            _yearMasterRepo.Object,
            _policyConfig.Object,
            new RateableValueCalculatorService(NullLogger<RateableValueCalculatorService>.Instance),
            _financeYearProvider.Object,
            contextLoader.Object,
            ruleApplier.Object,
            persistence,
            TimeProvider.System,
            _cleanup.Object,
                        NtisPlatform.Tests.Helpers.NoOpTaxApplicabilityService.Instance,
            _signatureService.Object,
            _configReader.Object,
            new DynamicTaxAmountResolver(
                new ConditionRuleEvaluator(),
                NullLogger<DynamicTaxAmountResolver>.Instance),
            _flattener.Object,
            _rulesFieldRepo.Object);
    }

    private IRepository<PolicyCodeMasterEntity, int> PolicyCodeMasterRepo()
    {
        var netTax = new PolicyCodeMasterEntity { Id = 1, PolicyCode = "NETTAX", PolicyName = "Net Tax", IsActive = true };
        var repo = new Mock<IRepository<PolicyCodeMasterEntity, int>>();
        repo.Setup(r => r.GetQueryable()).Returns(new List<PolicyCodeMasterEntity> { netTax }.BuildMockDbSet().Object);
        repo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(netTax);
        return repo.Object;
    }

    private IRepository<TaxMasterEntity, int> TaxMasterRepo()
    {
        var repo = new Mock<IRepository<TaxMasterEntity, int>>();
        repo.Setup(r => r.GetQueryable()).Returns(new List<TaxMasterEntity>().BuildMockDbSet().Object);
        return repo.Object;
    }

    private RVCalculationTaxDetailsEntity DetailRowFor(int taxId, int propertyDetailsId = DetailId) =>
        Assert.Single(_persistedTaxDetails.Where(td =>
            td.TaxId == taxId && td.RVCalculationResults?.PropertyDetailsId == propertyDetailsId));

    /// <summary>The rateable value the pipeline computed, so percent expectations need no hand-math.</summary>
    private decimal PersistedRateableValue(int propertyDetailsId = DetailId) =>
        _persistedTaxDetails
            .First(td => td.RVCalculationResults?.PropertyDetailsId == propertyDetailsId)
            .RVCalculationResults!.RateableValue ?? 0m;

    // â”€â”€ CONDITION_BASED â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    [Fact]
    public async Task ConditionBased_Fixed_PersistsConfiguredAmount()
    {
        var mode = Mode("CONDITION_BASED", condition: true);
        UseTaxes(Tax(1, "CB", mode));
        UseConfig(Snapshot(conditionRows: new[]
        {
            new TaxConditionRuleEntity
            {
                Id = 100, TaxId = 1, SortOrder = 1, ConditionsJson = AlwaysMatches,
                ResultMode = "FIXED", ResultBase = "NONE", ResultValue = 500m, IsActive = true
            }
        }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        Assert.Equal(500m, DetailRowFor(1).TaxAmount);
        // FIXED has no percentage â€” a stored 0 would read as "0% was configured".
        Assert.Null(DetailRowFor(1).TaxPercentage);
    }

    [Fact]
    public async Task ConditionBased_PercentOfRateableValue_PersistsPercentAndAmount()
    {
        var mode = Mode("CONDITION_BASED", condition: true);
        UseTaxes(Tax(1, "CB", mode));
        UseConfig(Snapshot(conditionRows: new[]
        {
            new TaxConditionRuleEntity
            {
                Id = 100, TaxId = 1, SortOrder = 1, ConditionsJson = AlwaysMatches,
                ResultMode = "PERCENT", ResultBase = "RV", ResultValue = 12m, IsActive = true
            }
        }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        var rv = PersistedRateableValue();
        Assert.True(rv > 0m, "Fixture should produce a non-zero rateable value.");
        Assert.Equal(Math.Round(rv * 12m / 100m, 0, MidpointRounding.AwayFromZero), DetailRowFor(1).TaxAmount);
        Assert.Equal(12m, DetailRowFor(1).TaxPercentage);
    }

    [Fact]
    public async Task ConditionBased_NoRowMatches_PersistsZeroRowRatherThanOmittingTheTax()
    {
        var mode = Mode("CONDITION_BASED", condition: true);
        UseTaxes(Tax(1, "CB", mode));
        UseConfig(Snapshot(conditionRows: new[]
        {
            new TaxConditionRuleEntity
            {
                Id = 100, TaxId = 1, SortOrder = 1,
                // Floor is absent from the (empty) field values, so this cannot match.
                ConditionsJson = """[{"fieldId":"Floor","operator":"=","value":"99","logicalOperator":"AND"}]""",
                ResultMode = "FIXED", ResultBase = "NONE", ResultValue = 500m, IsActive = true
            }
        }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        Assert.Equal(0m, DetailRowFor(1).TaxAmount);
    }

    [Fact]
    public async Task ConditionBased_NoRowsConfigured_PersistsZeroRow()
    {
        var mode = Mode("CONDITION_BASED", condition: true);
        UseTaxes(Tax(1, "CB", mode));
        UseConfig(Snapshot());

        await CreateService().CalculateAndSaveAsync(PropertyId);

        Assert.Equal(0m, DetailRowFor(1).TaxAmount);
    }

    [Fact]
    public async Task ConditionBased_YearRangeMismatch_SkipsRow()
    {
        var mode = Mode("CONDITION_BASED", condition: true);
        UseTaxes(Tax(1, "CB", mode));
        UseConfig(Snapshot(conditionRows: new[]
        {
            new TaxConditionRuleEntity
            {
                Id = 100, TaxId = 1, SortOrder = 1, ConditionsJson = AlwaysMatches,
                AssessmentYearRangeId = YearRangeId + 99,
                ResultMode = "FIXED", ResultBase = "NONE", ResultValue = 500m, IsActive = true
            }
        }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

Assert.Equal(0m, DetailRowFor(1).TaxAmount);
    }

    [Fact]
    public async Task ConditionBased_EveryMatchingRowIsSummed()
    {
        var mode = Mode("CONDITION_BASED", condition: true);
        UseTaxes(Tax(1, "CB", mode));
        UseConfig(Snapshot(conditionRows: new[]
        {
            new TaxConditionRuleEntity { Id = 100, TaxId = 1, SortOrder = 1, ConditionsJson = AlwaysMatches, ResultMode = "FIXED", ResultValue = 300m, IsActive = true },
            new TaxConditionRuleEntity { Id = 101, TaxId = 1, SortOrder = 2, ConditionsJson = AlwaysMatches, ResultMode = "FIXED", ResultValue = 200m, IsActive = true }
        }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        Assert.Equal(500m, DetailRowFor(1).TaxAmount);
        // Two rows contributed, so no single percentage or source row describes the result.
        Assert.Null(DetailRowFor(1).TaxPercentage);
    }

    [Fact]
    public async Task ConditionBased_StopFurtherProcessing_HaltsAfterMatchingRow()
    {
        var mode = Mode("CONDITION_BASED", condition: true);
        UseTaxes(Tax(1, "CB", mode));
        UseConfig(Snapshot(conditionRows: new[]
        {
            new TaxConditionRuleEntity { Id = 100, TaxId = 1, SortOrder = 1, ConditionsJson = AlwaysMatches, ResultMode = "FIXED", ResultValue = 300m, IsActive = true, StopFurtherProcessing = true },
            new TaxConditionRuleEntity { Id = 101, TaxId = 1, SortOrder = 2, ConditionsJson = AlwaysMatches, ResultMode = "FIXED", ResultValue = 200m, IsActive = true }
        }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        Assert.Equal(300m, DetailRowFor(1).TaxAmount);
    }

    [Fact]
    public async Task ConditionBased_RateableValueCondition_FallbackAppliesWhenFirstRuleFails()
    {
        var mode = Mode("CONDITION_BASED", condition: true);
        UseTaxes(Tax(1, "CB", mode));
        // Rule 1 requiring Rateable Value >= 600 with StopFurtherProcessing = true (exact DB row 42 JSON)
        // Rule 2 with empty condition (always matches) applying 2% on RV (exact DB row 54)
        UseConfig(Snapshot(conditionRows: new[]
        {
            new TaxConditionRuleEntity
            {
                Id = 42, TaxId = 1, SortOrder = 1,
                ConditionsJson = @"[{""FieldId"":""Rateable Value"",""Operator"":""\u003E="",""Value"":""600"",""LogicalOperator"":""AND""}]",
                ResultMode = "PERCENT", ResultBase = "RV", ResultValue = 10m, IsActive = true, StopFurtherProcessing = true
            },
            new TaxConditionRuleEntity
            {
                Id = 54, TaxId = 1, SortOrder = 2,
                ConditionsJson = AlwaysMatches,
                ResultMode = "PERCENT", ResultBase = "RV", ResultValue = 2m, IsActive = true, StopFurtherProcessing = false
            }
        }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        var rv = PersistedRateableValue();
        Assert.True(rv > 0m);

        if (rv < 600m)
        {
            // Rule 1 (>= 600) fails, so StopFurtherProcessing is NOT reached and Rule 2 (2% on RV) applies
            Assert.Equal(Math.Round(rv * 2m / 100m, 0, MidpointRounding.AwayFromZero), DetailRowFor(1).TaxAmount);
            Assert.Equal(2m, DetailRowFor(1).TaxPercentage);
        }
        else
        {
            // Rule 1 (>= 600) matches, so StopFurtherProcessing HALTS evaluation and Rule 1 (10% on RV) applies
            Assert.Equal(Math.Round(rv * 10m / 100m, 0, MidpointRounding.AwayFromZero), DetailRowFor(1).TaxAmount);
            Assert.Equal(10m, DetailRowFor(1).TaxPercentage);
        }
    }

    [Fact]
    public async Task ConditionBased_RateableValueCondition_ExactDbRules_EvaluatesBothBranchesCorrectly()
    {
        var mode = Mode("CONDITION_BASED", condition: true);
        UseTaxes(Tax(28, "TEST123", mode));
        UseConfig(Snapshot(conditionRows: new[]
        {
            new TaxConditionRuleEntity
            {
                Id = 42, TaxId = 28, SortOrder = 1,
                ConditionsJson = @"[{""FieldId"":""Rateable Value"",""Operator"":""\u003E="",""Value"":""600"",""LogicalOperator"":""AND""}]",
                ResultMode = "PERCENT", ResultBase = "RV", ResultValue = 10m, IsActive = true, StopFurtherProcessing = true
            },
            new TaxConditionRuleEntity
            {
                Id = 54, TaxId = 28, SortOrder = 2,
                ConditionsJson = "[]",
                ResultMode = "PERCENT", ResultBase = "RV", ResultValue = 2m, IsActive = true, StopFurtherProcessing = false
            }
        }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        var rv = PersistedRateableValue();
        Assert.True(rv > 0m);

        if (rv >= 600m)
        {
            // 10% on RV when RV >= 600
            Assert.Equal(Math.Round(rv * 10m / 100m, 0, MidpointRounding.AwayFromZero), DetailRowFor(28).TaxAmount);
            Assert.Equal(10m, DetailRowFor(28).TaxPercentage);
        }
        else
        {
            // Fallback 2% on RV when RV < 600
            Assert.Equal(Math.Round(rv * 2m / 100m, 0, MidpointRounding.AwayFromZero), DetailRowFor(28).TaxAmount);
            Assert.Equal(2m, DetailRowFor(28).TaxPercentage);
        }
    }



    [Fact]
    public async Task ConditionBased_PerUnit_MultipliesResolvedFieldCount()
    {
        _fieldValues = new Dictionary<string, object> { ["Toilets"] = 4 };

        var mode = Mode("CONDITION_BASED", condition: true);
        UseTaxes(Tax(1, "CB", mode));
        UseConfig(Snapshot(conditionRows: new[]
        {
            new TaxConditionRuleEntity
            {
                Id = 100, TaxId = 1, SortOrder = 1, ConditionsJson = AlwaysMatches,
                ResultMode = "PER_UNIT", ResultBase = "NONE", ResultValue = 150m,
                UnitFieldId = "Toilets", IsActive = true
            }
        }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        Assert.Equal(600m, DetailRowFor(1).TaxAmount);
    }

    [Fact]
    public async Task ConditionBased_PerUnit_UnresolvedField_PersistsZero()
    {
        _fieldValues = new Dictionary<string, object>();

        var mode = Mode("CONDITION_BASED", condition: true);
        UseTaxes(Tax(1, "CB", mode));
        UseConfig(Snapshot(conditionRows: new[]
        {
            new TaxConditionRuleEntity
            {
                Id = 100, TaxId = 1, SortOrder = 1, ConditionsJson = AlwaysMatches,
                ResultMode = "PER_UNIT", ResultBase = "NONE", ResultValue = 150m,
                UnitFieldId = "Toilets", IsActive = true
            }
        }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        Assert.Equal(0m, DetailRowFor(1).TaxAmount);
    }

    [Fact]
    public async Task ConditionBased_PerUnit_ChargedOncePerProperty_NotPerDetail()
    {
        // The scope caveat on TaxConditionRuleEntity.UnitFieldId: unit counts are recorded per
        // property, so charging them per detail would bill a 2-floor property twice.
        SetupProperty(twoDetails: true);
        _fieldValues = new Dictionary<string, object> { ["Toilets"] = 4 };

        var mode = Mode("CONDITION_BASED", condition: true);
        UseTaxes(Tax(1, "CB", mode));
        UseConfig(Snapshot(conditionRows: new[]
        {
            new TaxConditionRuleEntity
            {
                Id = 100, TaxId = 1, SortOrder = 1, ConditionsJson = AlwaysMatches,
                ResultMode = "PER_UNIT", ResultBase = "NONE", ResultValue = 150m,
                UnitFieldId = "Toilets", IsActive = true
            }
        }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        Assert.Equal(600m, DetailRowFor(1, DetailId).TaxAmount);
        Assert.Equal(0m, DetailRowFor(1, SecondDetailId).TaxAmount);
        Assert.Equal(600m, _persistedTaxDetails.Where(td => td.TaxId == 1).Sum(td => td.TaxAmount ?? 0m));
    }

    [Fact]
    public async Task ConditionBased_PerUnit_DistinctRowsMatchingDifferentDetails_BothContribute()
    {
        // Two SEPARATE PER_UNIT rows for the same tax, each scoped (via its own condition) to a
        // different detail — a floor-1-only rule and a floor-2-only rule. Deduping the "charge once
        // per property" guard by TaxId alone would let the first detail's row through and silently
        // drop the second detail's distinct row forever; deduping by (TaxId, RuleId) must let both
        // land, since they are genuinely different configuration rows, not the same row matching twice.
        SetupProperty(twoDetails: true);

        _flattener
            .Setup(f => f.Flatten(It.IsAny<PropertyCalculationContext>(), It.IsAny<List<RulesFieldEntity>>()))
            .Returns((PropertyCalculationContext ctx, List<RulesFieldEntity> _) =>
                ctx.Parameters.Detail!.Id == DetailId
                    ? new Dictionary<string, object> { ["Floor"] = 1, ["Toilets"] = 2 }
                    : new Dictionary<string, object> { ["Floor"] = 2, ["Toilets"] = 3 });

        var mode = Mode("CONDITION_BASED", condition: true);
        UseTaxes(Tax(1, "CB", mode));
        UseConfig(Snapshot(conditionRows: new[]
        {
            new TaxConditionRuleEntity
            {
                Id = 100, TaxId = 1, SortOrder = 1,
                ConditionsJson = """[{"FieldId":"Floor","Operator":"=","Value":"1","LogicalOperator":"AND"}]""",
                ResultMode = "PER_UNIT", ResultBase = "NONE", ResultValue = 150m, UnitFieldId = "Toilets", IsActive = true
            },
            new TaxConditionRuleEntity
            {
                Id = 200, TaxId = 1, SortOrder = 2,
                ConditionsJson = """[{"FieldId":"Floor","Operator":"=","Value":"2","LogicalOperator":"AND"}]""",
                ResultMode = "PER_UNIT", ResultBase = "NONE", ResultValue = 200m, UnitFieldId = "Toilets", IsActive = true
            }
        }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        // Detail 1: rule 100 matches (150 * 2 = 300). Detail 2: rule 200 matches (200 * 3 = 600).
        Assert.Equal(300m, DetailRowFor(1, DetailId).TaxAmount);
        Assert.Equal(600m, DetailRowFor(1, SecondDetailId).TaxAmount);
        Assert.Equal(900m, _persistedTaxDetails.Where(td => td.TaxId == 1).Sum(td => td.TaxAmount ?? 0m));
    }

    [Fact]
    public async Task ConditionBased_PercentOfOtherTax_ReadsAmountComputedInTheSameRun()
    {
        var valueMode = Mode("VALUE_BASED", value: true);
        var conditionMode = Mode("CONDITION_BASED", condition: true);

        // Tax 2 references tax 1, and is listed FIRST so the test fails unless dependency ordering runs.
        UseTaxes(Tax(2, "CESS", conditionMode), Tax(1, "BASE", conditionMode));

        UseConfig(Snapshot(conditionRows: new[]
        {
            new TaxConditionRuleEntity
            {
                Id = 100, TaxId = 1, SortOrder = 1, ConditionsJson = AlwaysMatches,
                ResultMode = "FIXED", ResultBase = "NONE", ResultValue = 1000m, IsActive = true
            },
            new TaxConditionRuleEntity
            {
                Id = 200, TaxId = 2, SortOrder = 1, ConditionsJson = AlwaysMatches,
                ResultMode = "PERCENT", ResultBase = "OTHER_TAX", ReferenceTaxId = 1,
                ResultValue = 10m, IsActive = true
            }
        }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        Assert.Equal(1000m, DetailRowFor(1).TaxAmount);
        Assert.Equal(100m, DetailRowFor(2).TaxAmount);
        Assert.True(valueMode.UsesValueConfig); // guards against the helper drifting
    }

    [Fact]
    public async Task ConditionBased_OtherTaxReferenceCycle_PersistsZeroWithoutThrowing()
    {
        var mode = Mode("CONDITION_BASED", condition: true);
        UseTaxes(Tax(1, "A", mode), Tax(2, "B", mode));

        UseConfig(Snapshot(conditionRows: new[]
        {
            new TaxConditionRuleEntity
            {
                Id = 100, TaxId = 1, SortOrder = 1, ConditionsJson = AlwaysMatches,
                ResultMode = "PERCENT", ResultBase = "OTHER_TAX", ReferenceTaxId = 2, ResultValue = 10m, IsActive = true
            },
            new TaxConditionRuleEntity
            {
                Id = 200, TaxId = 2, SortOrder = 1, ConditionsJson = AlwaysMatches,
                ResultMode = "PERCENT", ResultBase = "OTHER_TAX", ReferenceTaxId = 1, ResultValue = 10m, IsActive = true
            }
        }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        // The cycle is broken by falling back to TaxMaster order â€” the first tax has nothing to
        // reference yet, so it contributes zero, and the second reads that zero.
        Assert.Equal(0m, DetailRowFor(1).TaxAmount);
        Assert.Equal(0m, DetailRowFor(2).TaxAmount);
    }

    [Theory]
    [InlineData(null)]
    [InlineData(0)]
    [InlineData(-5)]
    public async Task ConditionBased_OtherTaxWithInvalidReferenceTaxId_PersistsZero_RatherThanGuessingTaxId1(int? referenceTaxId)
    {
        // A missing/non-positive ReferenceTaxId is malformed (legacy data or a save-path bug), not a
        // signal to charge a percentage of whatever tax happens to have id 1. Tax 1 below carries a
        // real, non-zero amount so this test fails loudly if the resolver ever falls back to guessing it.
        var mode = Mode("CONDITION_BASED", condition: true);
        UseTaxes(Tax(1, "BASE", mode), Tax(2, "CESS", mode));

        UseConfig(Snapshot(conditionRows: new[]
        {
            new TaxConditionRuleEntity
            {
                Id = 100, TaxId = 1, SortOrder = 1, ConditionsJson = AlwaysMatches,
                ResultMode = "FIXED", ResultBase = "NONE", ResultValue = 1000m, IsActive = true
            },
            new TaxConditionRuleEntity
            {
                Id = 200, TaxId = 2, SortOrder = 1, ConditionsJson = AlwaysMatches,
                ResultMode = "PERCENT", ResultBase = "OTHER_TAX", ReferenceTaxId = referenceTaxId,
                ResultValue = 10m, IsActive = true
            }
        }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        Assert.Equal(1000m, DetailRowFor(1).TaxAmount);
        Assert.Equal(0m, DetailRowFor(2).TaxAmount);
    }

    // â”€â”€ MASTER_BASED â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    [Theory]
    [InlineData("PropertyType", PropertyTypeId)]
    [InlineData("OwnerType", OwnerTypeId)]
    [InlineData("TypeOfUse", TypeOfUseId)]
    public async Task MasterBased_MappingHit_PersistsConfiguredAmount(string masterSource, int expectedKey)
    {
        var mode = Mode("MASTER_BASED", master: true);
        var rule = new DynamicTaxRuleEntity
        {
            Id = 55, DisplayName = $"{masterSource} Rule", RuleType = "MASTER_BASED",
            AttachedReference = masterSource, IsActive = true
        };

        UseTaxes(Tax(1, "MB", mode, ruleDefinitionId: rule.Id));
        UseConfig(Snapshot(
            mappings: new[]
            {
                new TaxMasterMappingEntity
                {
                    Id = 300, TaxId = 1, MasterKey = expectedKey.ToString(),
                    AssessmentYearRangeId = YearRangeId,
                    ResultMode = "FIXED", ResultBase = "NONE", ResultValue = 750m, IsActive = true
                }
            },
            rules: new[] { rule }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        Assert.Equal(750m, DetailRowFor(1).TaxAmount);
    }

    [Fact]
    public async Task MasterBased_PercentMapping_AppliesToRateableValue()
    {
        var mode = Mode("MASTER_BASED", master: true);
        var rule = new DynamicTaxRuleEntity
        {
            Id = 55, DisplayName = "PropertyType Rule", RuleType = "MASTER_BASED",
            AttachedReference = "PropertyType", IsActive = true
        };

        UseTaxes(Tax(1, "MB", mode, ruleDefinitionId: rule.Id));
        UseConfig(Snapshot(
            mappings: new[]
            {
                new TaxMasterMappingEntity
                {
                    Id = 300, TaxId = 1, MasterKey = PropertyTypeId.ToString(),
                    AssessmentYearRangeId = YearRangeId,
                    ResultMode = "PERCENT", ResultBase = "RV", ResultValue = 8m, IsActive = true
                }
            },
            rules: new[] { rule }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        var rv = PersistedRateableValue();
        Assert.Equal(Math.Round(rv * 8m / 100m, 0, MidpointRounding.AwayFromZero), DetailRowFor(1).TaxAmount);
        Assert.Equal(8m, DetailRowFor(1).TaxPercentage);
    }

    [Fact]
    public async Task MasterBased_NoMappingForKeyOrYear_PersistsZeroRow()
    {
        var mode = Mode("MASTER_BASED", master: true);
        var rule = new DynamicTaxRuleEntity
        {
            Id = 55, DisplayName = "PropertyType Rule", RuleType = "MASTER_BASED",
            AttachedReference = "PropertyType", IsActive = true
        };

        UseTaxes(Tax(1, "MB", mode, ruleDefinitionId: rule.Id));
        UseConfig(Snapshot(
            mappings: new[]
            {
                new TaxMasterMappingEntity
                {
                    Id = 300, TaxId = 1, MasterKey = "9999",
                    AssessmentYearRangeId = YearRangeId,
                    ResultMode = "FIXED", ResultValue = 750m, IsActive = true
                }
            },
            rules: new[] { rule }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        Assert.Equal(0m, DetailRowFor(1).TaxAmount);
    }

    [Fact]
    public async Task MasterBased_RuleWithoutAttachedReference_PersistsZeroRow()
    {
        var mode = Mode("MASTER_BASED", master: true);
        var rule = new DynamicTaxRuleEntity
        {
            Id = 55, DisplayName = "Unconfigured", RuleType = "MASTER_BASED",
            AttachedReference = null, IsActive = true
        };

        UseTaxes(Tax(1, "MB", mode, ruleDefinitionId: rule.Id));
        UseConfig(Snapshot(
            mappings: new[]
            {
                new TaxMasterMappingEntity
                {
                    Id = 300, TaxId = 1, MasterKey = PropertyTypeId.ToString(),
                    AssessmentYearRangeId = YearRangeId, ResultMode = "FIXED", ResultValue = 750m, IsActive = true
                }
            },
            rules: new[] { rule }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        Assert.Equal(0m, DetailRowFor(1).TaxAmount);
    }

    // ——— HYBRID ——————————————————————————————————————————————————————————————————————————————————

    [Fact]
    public async Task Hybrid_WithoutHybridConfigRow_PersistsZeroRow_EvenWhenBothHalvesWouldResolve()
    {
        // No TaxHybridConfigEntity row for this tax — there is no evaluation strategy to run, so
        // this must NOT fall back to guessing an order; both a matching condition row and a matching
        // master mapping exist below, but neither should be consulted.
        var mode = Mode("HYBRID", condition: true, master: true, hybrid: true);
        var rule = new DynamicTaxRuleEntity
        {
            Id = 55, DisplayName = "PropertyType Rule", RuleType = "HYBRID",
            AttachedReference = "PropertyType", IsActive = true
        };

        UseTaxes(Tax(1, "HY", mode, ruleDefinitionId: rule.Id));
        UseConfig(Snapshot(
            conditionRows: new[]
            {
                new TaxConditionRuleEntity { Id = 100, TaxId = 1, SortOrder = 1, ConditionsJson = AlwaysMatches, ResultMode = "FIXED", ResultValue = 111m, IsActive = true }
            },
            mappings: new[]
            {
                new TaxMasterMappingEntity { Id = 300, TaxId = 1, MasterKey = PropertyTypeId.ToString(), AssessmentYearRangeId = YearRangeId, ResultMode = "FIXED", ResultValue = 222m, IsActive = true }
            },
            rules: new[] { rule }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        Assert.Equal(0m, DetailRowFor(1).TaxAmount);
    }

    [Fact]
    public async Task Hybrid_MasterThenCondition_PrefersMasterWhenItResolves()
    {
        var mode = Mode("HYBRID", condition: true, master: true, hybrid: true);
        var rule = new DynamicTaxRuleEntity
        {
            Id = 55, DisplayName = "PropertyType Rule", RuleType = "HYBRID",
            AttachedReference = "PropertyType", IsActive = true
        };

        UseTaxes(Tax(1, "HY", mode, ruleDefinitionId: rule.Id));
        UseConfig(Snapshot(
            conditionRows: new[]
            {
                new TaxConditionRuleEntity { Id = 100, TaxId = 1, SortOrder = 1, ConditionsJson = AlwaysMatches, ResultMode = "FIXED", ResultValue = 111m, IsActive = true }
            },
            mappings: new[]
            {
                new TaxMasterMappingEntity { Id = 300, TaxId = 1, MasterKey = PropertyTypeId.ToString(), AssessmentYearRangeId = YearRangeId, ResultMode = "FIXED", ResultValue = 222m, IsActive = true }
            },
            hybridConfigs: new[]
            {
                new TaxHybridConfigEntity { Id = 1, TaxId = 1, EvaluationPriority = "MASTER_THEN_CONDITION", FallbackStrategy = "DEFAULT_ZERO", ResultBase = "NONE", IsActive = true }
            },
            rules: new[] { rule }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        // Master runs first and resolves, so the matching condition row (111) is never consulted.
        Assert.Equal(222m, DetailRowFor(1).TaxAmount);
    }

    [Fact]
    public async Task Hybrid_ResultBase_OverridesTheMasterMappingRowsOwnRvBase()
    {
        // The mapping row itself is configured as PERCENT-of-RV, but the hybrid's own declared basis
        // (what the register shows as e.g. "PropertyType + ALV") is ALV — that must win. If the
        // resolver ignored TaxHybridConfig.ResultBase, this would compute off RV instead and the
        // amounts would diverge from the assertion below.
        var mode = Mode("HYBRID", condition: true, master: true, hybrid: true);
        var rule = new DynamicTaxRuleEntity
        {
            Id = 55, DisplayName = "PropertyType Rule", RuleType = "HYBRID",
            AttachedReference = "PropertyType", IsActive = true
        };

        UseTaxes(Tax(1, "HY", mode, ruleDefinitionId: rule.Id));
        UseConfig(Snapshot(
            mappings: new[]
            {
                new TaxMasterMappingEntity
                {
                    Id = 300, TaxId = 1, MasterKey = PropertyTypeId.ToString(), AssessmentYearRangeId = YearRangeId,
                    ResultMode = "PERCENT", ResultBase = "RV", ResultValue = 10m, IsActive = true
                }
            },
            hybridConfigs: new[]
            {
                new TaxHybridConfigEntity { Id = 1, TaxId = 1, EvaluationPriority = "MASTER_THEN_CONDITION", FallbackStrategy = "DEFAULT_ZERO", ResultBase = "ALV", IsActive = true }
            },
            rules: new[] { rule }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        var resultsRow = _persistedTaxDetails
            .First(td => td.RVCalculationResults?.PropertyDetailsId == DetailId)
            .RVCalculationResults!;
        var rv = resultsRow.RateableValue ?? 0m;
        var alv = Convert.ToDecimal(resultsRow.AnnualRentalValue ?? 0d);
        Assert.NotEqual(rv, alv); // fixture sanity check — otherwise this test can't discriminate

        Assert.Equal(Math.Round(alv * 10m / 100m, 0, MidpointRounding.AwayFromZero), DetailRowFor(1).TaxAmount);
    }

    [Fact]
    public async Task Hybrid_ResultBase_OverridesAWinningConditionRowsOwnRvBase()
    {
        // Same override, but this time the CONDITION side is the one that resolves — proves the
        // override is threaded into ResolveCondition too, not just ResolveMaster.
        var mode = Mode("HYBRID", condition: true, master: true, hybrid: true);
        var rule = new DynamicTaxRuleEntity
        {
            Id = 55, DisplayName = "PropertyType Rule", RuleType = "HYBRID",
            AttachedReference = "PropertyType", IsActive = true
        };

        UseTaxes(Tax(1, "HY", mode, ruleDefinitionId: rule.Id));
        UseConfig(Snapshot(
            conditionRows: new[]
            {
                new TaxConditionRuleEntity
                {
                    Id = 100, TaxId = 1, SortOrder = 1, ConditionsJson = AlwaysMatches,
                    ResultMode = "PERCENT", ResultBase = "RV", ResultValue = 15m, IsActive = true
                }
            },
            hybridConfigs: new[]
            {
                new TaxHybridConfigEntity { Id = 1, TaxId = 1, EvaluationPriority = "CONDITION_THEN_MASTER", FallbackStrategy = "DEFAULT_ZERO", ResultBase = "ALV", IsActive = true }
            },
            rules: new[] { rule }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        var resultsRow = _persistedTaxDetails
            .First(td => td.RVCalculationResults?.PropertyDetailsId == DetailId)
            .RVCalculationResults!;
        var rv = resultsRow.RateableValue ?? 0m;
        var alv = Convert.ToDecimal(resultsRow.AnnualRentalValue ?? 0d);
        Assert.NotEqual(rv, alv);

        Assert.Equal(Math.Round(alv * 15m / 100m, 0, MidpointRounding.AwayFromZero), DetailRowFor(1).TaxAmount);
        Assert.Equal(15m, DetailRowFor(1).TaxPercentage);
    }

    [Fact]
    public async Task Hybrid_ConditionThenMaster_PrefersConditionWhenItResolves()
    {
        var mode = Mode("HYBRID", condition: true, master: true, hybrid: true);
        var rule = new DynamicTaxRuleEntity
        {
            Id = 55, DisplayName = "PropertyType Rule", RuleType = "HYBRID",
            AttachedReference = "PropertyType", IsActive = true
        };

        UseTaxes(Tax(1, "HY", mode, ruleDefinitionId: rule.Id));
        UseConfig(Snapshot(
            conditionRows: new[]
            {
                new TaxConditionRuleEntity { Id = 100, TaxId = 1, SortOrder = 1, ConditionsJson = AlwaysMatches, ResultMode = "FIXED", ResultValue = 111m, IsActive = true }
            },
            mappings: new[]
            {
                new TaxMasterMappingEntity { Id = 300, TaxId = 1, MasterKey = PropertyTypeId.ToString(), AssessmentYearRangeId = YearRangeId, ResultMode = "FIXED", ResultValue = 222m, IsActive = true }
            },
            hybridConfigs: new[]
            {
                new TaxHybridConfigEntity { Id = 1, TaxId = 1, EvaluationPriority = "CONDITION_THEN_MASTER", FallbackStrategy = "DEFAULT_ZERO", ResultBase = "NONE", IsActive = true }
            },
            rules: new[] { rule }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        // Condition runs first and resolves, so the matching master mapping (222) is never consulted.
        Assert.Equal(111m, DetailRowFor(1).TaxAmount);
    }

    [Fact]
    public async Task Hybrid_FallsBackToTheOtherHalfWhenThePreferredOneDoesNotResolve()
    {
        var mode = Mode("HYBRID", condition: true, master: true, hybrid: true);
        var rule = new DynamicTaxRuleEntity
        {
            Id = 55, DisplayName = "PropertyType Rule", RuleType = "HYBRID",
            AttachedReference = "PropertyType", IsActive = true
        };

        UseTaxes(Tax(1, "HY", mode, ruleDefinitionId: rule.Id));
        UseConfig(Snapshot(
            conditionRows: new[]
            {
                new TaxConditionRuleEntity { Id = 100, TaxId = 1, SortOrder = 1, ConditionsJson = AlwaysMatches, ResultMode = "FIXED", ResultValue = 111m, IsActive = true }
            },
            // No mapping for this property's PropertyType, so the master half cannot resolve.
            mappings: new[]
            {
                new TaxMasterMappingEntity { Id = 300, TaxId = 1, MasterKey = "9999", AssessmentYearRangeId = YearRangeId, ResultMode = "FIXED", ResultValue = 222m, IsActive = true }
            },
            hybridConfigs: new[]
            {
                new TaxHybridConfigEntity { Id = 1, TaxId = 1, EvaluationPriority = "MASTER_THEN_CONDITION", FallbackStrategy = "CONDITION_RULE", ResultBase = "NONE", IsActive = true }
            },
            rules: new[] { rule }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        // Master (primary) misses, CONDITION_RULE fallback consults the condition side, which matches.
        Assert.Equal(111m, DetailRowFor(1).TaxAmount);
    }

    [Fact]
    public async Task Hybrid_DefaultZero_DoesNotConsultTheOtherHalf()
    {
        // The distinguishing case for FallbackStrategy: the master half misses and a matching
        // condition row exists, but DEFAULT_ZERO must stop at the priority-first half and charge zero
        // rather than falling through to that 111.
        var mode = Mode("HYBRID", condition: true, master: true, hybrid: true);
        var rule = new DynamicTaxRuleEntity
        {
            Id = 55, DisplayName = "PropertyType Rule", RuleType = "HYBRID",
            AttachedReference = "PropertyType", IsActive = true
        };

        UseTaxes(Tax(1, "HY", mode, ruleDefinitionId: rule.Id));
        UseConfig(Snapshot(
            conditionRows: new[]
            {
                new TaxConditionRuleEntity { Id = 100, TaxId = 1, SortOrder = 1, ConditionsJson = AlwaysMatches, ResultMode = "FIXED", ResultValue = 111m, IsActive = true }
            },
            mappings: new[]
            {
                new TaxMasterMappingEntity { Id = 300, TaxId = 1, MasterKey = "9999", AssessmentYearRangeId = YearRangeId, ResultMode = "FIXED", ResultValue = 222m, IsActive = true }
            },
            hybridConfigs: new[]
            {
                new TaxHybridConfigEntity { Id = 1, TaxId = 1, EvaluationPriority = "MASTER_THEN_CONDITION", FallbackStrategy = "DEFAULT_ZERO", ResultBase = "NONE", IsActive = true }
            },
            rules: new[] { rule }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        Assert.Equal(0m, DetailRowFor(1).TaxAmount);
    }

    [Fact]
    public async Task Hybrid_ConditionThenMaster_WithConditionRuleFallback_FallsThroughToMaster()
    {
        var mode = Mode("HYBRID", condition: true, master: true, hybrid: true);
        var rule = new DynamicTaxRuleEntity
        {
            Id = 55, DisplayName = "PropertyType Rule", RuleType = "HYBRID",
            AttachedReference = "PropertyType", IsActive = true
        };

        UseTaxes(Tax(1, "HY", mode, ruleDefinitionId: rule.Id));
        UseConfig(Snapshot(
            // No condition rows, so the priority-first half misses.
            mappings: new[]
            {
                new TaxMasterMappingEntity { Id = 300, TaxId = 1, MasterKey = PropertyTypeId.ToString(), AssessmentYearRangeId = YearRangeId, ResultMode = "FIXED", ResultValue = 222m, IsActive = true }
            },
            hybridConfigs: new[]
            {
                new TaxHybridConfigEntity { Id = 1, TaxId = 1, EvaluationPriority = "CONDITION_THEN_MASTER", FallbackStrategy = "CONDITION_RULE", ResultBase = "NONE", IsActive = true }
            },
            rules: new[] { rule }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        // Condition (primary) misses — no rows configured — so the fallback falls through to the
        // master mapping, which matches. FallbackStrategy="CONDITION_RULE" is symmetric: it names the
        // other strategy generically, not literally "always the condition side" — see
        // DynamicTaxAmountResolver.ResolveHybrid's doc comment.
        Assert.Equal(222m, DetailRowFor(1).TaxAmount);
    }

    [Fact]
    public async Task Hybrid_NeitherHalfResolves_PersistsZeroRow()
    {
        var mode = Mode("HYBRID", condition: true, master: true, hybrid: true);
        var rule = new DynamicTaxRuleEntity
        {
            Id = 55, DisplayName = "PropertyType Rule", RuleType = "HYBRID",
            AttachedReference = "PropertyType", IsActive = true
        };

        UseTaxes(Tax(1, "HY", mode, ruleDefinitionId: rule.Id));
        UseConfig(Snapshot(
            hybridConfigs: new[]
            {
                new TaxHybridConfigEntity { Id = 1, TaxId = 1, EvaluationPriority = "MASTER_THEN_CONDITION", FallbackStrategy = "DEFAULT_ZERO", ResultBase = "NONE", IsActive = true }
            },
            rules: new[] { rule }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        Assert.Equal(0m, DetailRowFor(1).TaxAmount);
    }

    [Fact]
    public async Task Hybrid_WithoutStrategyRow_PersistsZeroRow()
    {
        var mode = Mode("HYBRID", condition: true, master: true, hybrid: true);
        UseTaxes(Tax(1, "HY", mode));
        UseConfig(Snapshot(conditionRows: new[]
        {
            new TaxConditionRuleEntity { Id = 100, TaxId = 1, SortOrder = 1, ConditionsJson = AlwaysMatches, ResultMode = "FIXED", ResultValue = 111m, IsActive = true }
        }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        Assert.Equal(0m, DetailRowFor(1).TaxAmount);
    }

    // ── Education/Employment gating with dynamic-only regular tax configuration ────────────────────

    [Fact]
    public async Task EducationTax_StillApplies_WhenTheOnlyRegularTaxIsConfiguredDynamically()
    {
        // No TaxPercentageMasterRV rows exist at all (SetupMasterData seeds an empty list) — the
        // TypeOfUse's only "this is taxed" signal is a CONDITION_BASED regular tax with an active
        // condition row. Before the fix, IsTypeOfUseConfiguredForTax only looked at the legacy table,
        // so this detail would be dropped from detailsOfType and Education tax would silently vanish.
        var conditionMode = Mode("CONDITION_BASED", condition: true);
        var regularTax = Tax(1, "CESS", conditionMode);
        var educationTax = new TaxMasterEntity
        {
            Id = 2, TaxCode = "STATE_EDU", TaxName = "Education Tax", IsActive = true, TaxCategoryId = 3,
            TaxCategoryMaster = new TaxCategoryMasterEntity { Id = 3, CategoryCode = "EDU", CategoryName = "State Education Tax" }
        };

        UseTaxes(regularTax, educationTax);
        UseConfig(Snapshot(conditionRows: new[]
        {
            new TaxConditionRuleEntity { Id = 100, TaxId = 1, SortOrder = 1, ConditionsJson = AlwaysMatches, ResultMode = "FIXED", ResultBase = "NONE", ResultValue = 50m, IsActive = true }
        }));

        _masterData.Setup(m => m.GetActiveEducationTaxSlabsAsync()).ReturnsAsync(new List<EducationTaxMasterEntity>
        {
            new() { Id = 1, Type = "R", MinAmount = 0m, MaxAmount = 999_999_999m, Rate = 5m, IsActive = true }
        });

        await CreateService().CalculateAndSaveAsync(PropertyId);

        var educationRow = _persistedTaxDetails.SingleOrDefault(td =>
            td.TaxId == educationTax.Id && td.RVCalculationResults?.PropertyDetailsId == DetailId);
        Assert.NotNull(educationRow);
        Assert.True(educationRow!.TaxAmount > 0m, "Education tax must still be charged for a TypeOfUse taxed only through Dynamic Tax Register configuration.");
    }

    [Fact]
    public async Task EducationTax_StillExcluded_WhenTheRegularTaxHasNoConfigurationAtAllEitherWay()
    {
        // Control case: a CONDITION_BASED regular tax exists but has ZERO condition rows configured
        // (no legacy percentage row either) — this TypeOfUse genuinely isn't taxed by anything, so
        // Education must still be excluded. Proves the fix isn't overly permissive.
        var conditionMode = Mode("CONDITION_BASED", condition: true);
        var regularTax = Tax(1, "CESS", conditionMode);
        var educationTax = new TaxMasterEntity
        {
            Id = 2, TaxCode = "STATE_EDU", TaxName = "Education Tax", IsActive = true, TaxCategoryId = 3,
            TaxCategoryMaster = new TaxCategoryMasterEntity { Id = 3, CategoryCode = "EDU", CategoryName = "State Education Tax" }
        };

        UseTaxes(regularTax, educationTax);
        UseConfig(Snapshot()); // no condition rows for tax 1 at all

        _masterData.Setup(m => m.GetActiveEducationTaxSlabsAsync()).ReturnsAsync(new List<EducationTaxMasterEntity>
        {
            new() { Id = 1, Type = "R", MinAmount = 0m, MaxAmount = 999_999_999m, Rate = 5m, IsActive = true }
        });

        await CreateService().CalculateAndSaveAsync(PropertyId);

        var educationRow = _persistedTaxDetails.SingleOrDefault(td =>
            td.TaxId == educationTax.Id && td.RVCalculationResults?.PropertyDetailsId == DetailId);
        Assert.True(educationRow == null || educationRow.TaxAmount == 0m);
    }

    // ── VALUE_BASED regression ───────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ValueBased_StillPricedFromTaxPercentageMasterRV_IgnoringDynamicConfig()
    {
        var mode = Mode("VALUE_BASED", value: true);
        UseTaxes(Tax(1, "VB", mode));

        _masterData.Setup(m => m.GetActiveTaxPercentagesAsync()).ReturnsAsync(new List<TaxPercentageMasterRVEntity>
        {
            new()
            {
                Id = 1, TaxId = 1, TypeOfUseId = TypeOfUseId, YearRangeRVId = YearRangeId,
                TaxPercentage = 10m, IsActive = true
            }
        });

        // Condition rows exist for this tax but must be ignored â€” the mode declares no condition
        // capability, so the value path owns it.
        UseConfig(Snapshot(conditionRows: new[]
        {
            new TaxConditionRuleEntity { Id = 100, TaxId = 1, SortOrder = 1, ConditionsJson = AlwaysMatches, ResultMode = "FIXED", ResultValue = 9999m, IsActive = true }
        }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        var rv = PersistedRateableValue();
        Assert.Equal(Math.Round(rv * 10m / 100m, 0, MidpointRounding.AwayFromZero), DetailRowFor(1).TaxAmount);
        Assert.Equal(10m, DetailRowFor(1).TaxPercentage);
    }

    // â”€â”€ Multi-detail â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    [Fact]
    public async Task ConditionBased_PercentOfRv_IsComputedPerDetailFromThatDetailsOwnRateableValue()
    {
        SetupProperty(twoDetails: true);

        var mode = Mode("CONDITION_BASED", condition: true);
        UseTaxes(Tax(1, "CB", mode));
        UseConfig(Snapshot(conditionRows: new[]
        {
            new TaxConditionRuleEntity
            {
                Id = 100, TaxId = 1, SortOrder = 1, ConditionsJson = AlwaysMatches,
                ResultMode = "PERCENT", ResultBase = "RV", ResultValue = 10m, IsActive = true
            }
        }));

        await CreateService().CalculateAndSaveAsync(PropertyId);

        var firstRv = PersistedRateableValue(DetailId);
        var secondRv = PersistedRateableValue(SecondDetailId);

        Assert.NotEqual(firstRv, secondRv); // different carpet areas â€” proves per-detail bases
        Assert.Equal(Math.Round(firstRv * 10m / 100m, 0, MidpointRounding.AwayFromZero), DetailRowFor(1, DetailId).TaxAmount);
        Assert.Equal(Math.Round(secondRv * 10m / 100m, 0, MidpointRounding.AwayFromZero), DetailRowFor(1, SecondDetailId).TaxAmount);
    }

    // â”€â”€ Ordering unit tests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    [Fact]
    public void Order_PlacesReferencedTaxBeforeTheTaxThatReferencesIt()
    {
        var mode = Mode("CONDITION_BASED", condition: true);
        var taxes = new List<TaxMasterEntity> { Tax(2, "CESS", mode), Tax(1, "BASE", mode) };

        var config = Snapshot(conditionRows: new[]
        {
            new TaxConditionRuleEntity { Id = 200, TaxId = 2, ConditionsJson = AlwaysMatches, ResultBase = "OTHER_TAX", ReferenceTaxId = 1, IsActive = true }
        });

        var ordered = DynamicTaxOrdering.Order(taxes, config, NullLogger.Instance);

        Assert.Equal(new[] { 1, 2 }, ordered.Select(t => t.Id));
    }

    [Fact]
    public void Order_LeavesInputOrderUntouchedWhenNoTaxReferencesAnother()
    {
        var mode = Mode("CONDITION_BASED", condition: true);
        var taxes = new List<TaxMasterEntity> { Tax(3, "C", mode), Tax(1, "A", mode), Tax(2, "B", mode) };

        var ordered = DynamicTaxOrdering.Order(taxes, Snapshot(), NullLogger.Instance);

        Assert.Equal(new[] { 3, 1, 2 }, ordered.Select(t => t.Id));
    }

    [Fact]
    public void Order_IgnoresReferencesToTaxesOutsideThisRun()
    {
        // An inactive or EDU/EMP tax is not in the run, so a reference to it can never be satisfied
        // and must not be mistaken for a cycle.
        var mode = Mode("CONDITION_BASED", condition: true);
        var taxes = new List<TaxMasterEntity> { Tax(1, "A", mode) };

        var config = Snapshot(conditionRows: new[]
        {
            new TaxConditionRuleEntity { Id = 100, TaxId = 1, ConditionsJson = AlwaysMatches, ResultBase = "OTHER_TAX", ReferenceTaxId = 999, IsActive = true }
        });

        var ordered = DynamicTaxOrdering.Order(taxes, config, NullLogger.Instance);

        Assert.Equal(new[] { 1 }, ordered.Select(t => t.Id));
    }

    [Fact]
    public void Order_DoesNotLoseTaxesWhenReferencesFormACycle()
    {
        var mode = Mode("CONDITION_BASED", condition: true);
        var taxes = new List<TaxMasterEntity> { Tax(1, "A", mode), Tax(2, "B", mode) };

        var config = Snapshot(conditionRows: new[]
        {
            new TaxConditionRuleEntity { Id = 100, TaxId = 1, ConditionsJson = AlwaysMatches, ResultBase = "OTHER_TAX", ReferenceTaxId = 2, IsActive = true },
            new TaxConditionRuleEntity { Id = 200, TaxId = 2, ConditionsJson = AlwaysMatches, ResultBase = "OTHER_TAX", ReferenceTaxId = 1, IsActive = true }
        });

        var ordered = DynamicTaxOrdering.Order(taxes, config, NullLogger.Instance);

        Assert.Equal(new[] { 1, 2 }, ordered.Select(t => t.Id));
    }

    [Fact]
    public void Order_PlacesOnlyTheActualCycleFirst_NotTaxesMerelyDownstreamOfIt()
    {
        // C isn't part of any cycle — it only depends on A — but it's listed FIRST in input order,
        // and A/B form a genuine cycle. Before the fix, "no node ready" appended the WHOLE remaining
        // set (C, A, B) in input order, running C before its own dependency A and resolving it to
        // zero for no reason. Only {A, B} — the real cycle — must be force-placed; C must still land
        // after A once A is placed.
        var mode = Mode("CONDITION_BASED", condition: true);
        var taxes = new List<TaxMasterEntity> { Tax(3, "C", mode), Tax(1, "A", mode), Tax(2, "B", mode) };

        var config = Snapshot(conditionRows: new[]
        {
            new TaxConditionRuleEntity { Id = 100, TaxId = 1, ConditionsJson = AlwaysMatches, ResultBase = "OTHER_TAX", ReferenceTaxId = 2, IsActive = true },
            new TaxConditionRuleEntity { Id = 200, TaxId = 2, ConditionsJson = AlwaysMatches, ResultBase = "OTHER_TAX", ReferenceTaxId = 1, IsActive = true },
            new TaxConditionRuleEntity { Id = 300, TaxId = 3, ConditionsJson = AlwaysMatches, ResultBase = "OTHER_TAX", ReferenceTaxId = 1, IsActive = true }
        });

        var ordered = DynamicTaxOrdering.Order(taxes, config, NullLogger.Instance);
        var indexOf = ordered.Select((t, i) => (t.Id, i)).ToDictionary(x => x.Id, x => x.i);

        Assert.True(indexOf[1] < indexOf[3], "A (referenced by C) must be placed before C.");
        Assert.Equal(new[] { 1, 2, 3 }, ordered.Select(t => t.Id));
    }

    [Fact]
    public void Order_PlacesOnlyTheActualCycleFirst_WhenDownstreamReferencesTheOtherCycleMember()
    {
        // Same shape as above but C references B (the SECOND cycle member) rather than A — pins the
        // exact reported example: input [C, A, B], A<->B, C->B. Since no node is initially ready,
        // remaining also contains C even though it isn't part of the cycle; only {A, B} may be
        // force-placed, and C must still land after B.
        var mode = Mode("CONDITION_BASED", condition: true);
        var taxes = new List<TaxMasterEntity> { Tax(3, "C", mode), Tax(1, "A", mode), Tax(2, "B", mode) };

        var config = Snapshot(conditionRows: new[]
        {
            new TaxConditionRuleEntity { Id = 100, TaxId = 1, ConditionsJson = AlwaysMatches, ResultBase = "OTHER_TAX", ReferenceTaxId = 2, IsActive = true },
            new TaxConditionRuleEntity { Id = 200, TaxId = 2, ConditionsJson = AlwaysMatches, ResultBase = "OTHER_TAX", ReferenceTaxId = 1, IsActive = true },
            new TaxConditionRuleEntity { Id = 300, TaxId = 3, ConditionsJson = AlwaysMatches, ResultBase = "OTHER_TAX", ReferenceTaxId = 2, IsActive = true }
        });

        var ordered = DynamicTaxOrdering.Order(taxes, config, NullLogger.Instance);
        var indexOf = ordered.Select((t, i) => (t.Id, i)).ToDictionary(x => x.Id, x => x.i);

        Assert.True(indexOf[2] < indexOf[3], "B (referenced by C) must be placed before C.");
        Assert.Equal(new[] { 1, 2, 3 }, ordered.Select(t => t.Id));
    }

    [Fact]
    public void Order_ForcePlacesEveryDisjointCycle_WhenSeveralExistAtOnce()
    {
        var mode = Mode("CONDITION_BASED", condition: true);
        var taxes = new List<TaxMasterEntity>
        {
            Tax(1, "A", mode), Tax(2, "B", mode), Tax(3, "C", mode), Tax(4, "D", mode)
        };

        var config = Snapshot(conditionRows: new[]
        {
            new TaxConditionRuleEntity { Id = 100, TaxId = 1, ConditionsJson = AlwaysMatches, ResultBase = "OTHER_TAX", ReferenceTaxId = 2, IsActive = true },
            new TaxConditionRuleEntity { Id = 200, TaxId = 2, ConditionsJson = AlwaysMatches, ResultBase = "OTHER_TAX", ReferenceTaxId = 1, IsActive = true },
            new TaxConditionRuleEntity { Id = 300, TaxId = 3, ConditionsJson = AlwaysMatches, ResultBase = "OTHER_TAX", ReferenceTaxId = 4, IsActive = true },
            new TaxConditionRuleEntity { Id = 400, TaxId = 4, ConditionsJson = AlwaysMatches, ResultBase = "OTHER_TAX", ReferenceTaxId = 3, IsActive = true }
        });

        var ordered = DynamicTaxOrdering.Order(taxes, config, NullLogger.Instance);

        Assert.Equal(4, ordered.Count);
        Assert.Equal(new HashSet<int> { 1, 2, 3, 4 }, ordered.Select(t => t.Id).ToHashSet());
    }
}
