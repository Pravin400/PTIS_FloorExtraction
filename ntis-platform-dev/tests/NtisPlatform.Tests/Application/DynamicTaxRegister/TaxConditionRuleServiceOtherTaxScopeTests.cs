using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.Master;
using NtisPlatform.Application.DTOs.Rules.RuleExecution;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Interfaces.Rules;
using NtisPlatform.Application.Interfaces.TaxEngine;
using NtisPlatform.Application.Services.Rules;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.Rules;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Services;
using Xunit;

namespace NtisPlatform.Tests.Application.DynamicTaxRegister;

/// <summary>
/// Pins the preview endpoint's OTHER_TAX lookup scope to match live billing
/// (<c>DynamicTaxAmountResolver.PercentAmount</c> via <c>RateableValueService</c>'s
/// <c>ReferenceTaxAmountLookup</c>): resolve against THIS detail's own already-computed amount for
/// the referenced tax first, only summing across every detail when this detail has none. Before this
/// fix, <c>EvaluateAsync</c> always summed across every detail, so on a multi-detail property preview
/// and billing could report different OTHER_TAX amounts for the same tax/detail/property.
/// </summary>
public class TaxConditionRuleServiceOtherTaxScopeTests
{
    private const int TaxId = 10;
    private const int OtherTaxId = 11;
    private const int PropertyId = 1;
    private const int DetailId1 = 100;
    private const int DetailId2 = 101;
    private const int TypeOfUseId = 5;
    private const int FloorId = 1;

    private sealed class Harness : IDisposable
    {
        public ApplicationDbContext Context { get; }
        public TaxConditionRuleService Service { get; }
        public Mock<IPropertyContextLoaderService> ContextLoader { get; } = new();
        public Mock<ITaxMasterDataService> MasterData { get; } = new();
        public Mock<IFinanceYearProvider> FinanceYearProvider { get; } = new();

        public int CurrentYear { get; } = DateTime.Today.Month >= 4 ? DateTime.Today.Year : DateTime.Today.Year - 1;

        public Harness()
        {
            Context = DynamicTaxTestContext.Create();
            Context.TaxMaster.Add(DynamicTaxTestContext.Tax(TaxId, "COND", calculationModeId: 2));
            Context.TaxMaster.Add(DynamicTaxTestContext.Tax(OtherTaxId, "OTHER", calculationModeId: 1));
            Context.SaveChanges();

            FinanceYearProvider.Setup(f => f.GetCurrentFinanceYear()).Returns(CurrentYear);

            MasterData.Setup(m => m.GetActiveTypeOfUsesAsync()).ReturnsAsync(new List<TypeOfUseEntity>
            {
                new() { Id = TypeOfUseId, Type = "R", TypeOfUseGroupId = 1, IsActive = true }
            });

            var property = new PropertyEntity { Id = PropertyId, IsActive = true, MarkedForDeletion = false };
            var details = new List<PropertyDetailsEntity>
            {
                new() { Id = DetailId1, PropertyId = PropertyId, TypeOfUseId = TypeOfUseId, FloorId = FloorId, IsActive = true },
                new() { Id = DetailId2, PropertyId = PropertyId, TypeOfUseId = TypeOfUseId, FloorId = FloorId, IsActive = true },
            };

            ContextLoader
                .Setup(c => c.LoadPropertyContextAsync(PropertyId, It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new PropertyCalculationContext
                {
                    Property = property,
                    Details = details,
                    Parameters = new PropertyCalculationParameters { FinanceYear = CurrentYear }
                });

            var flattener = new Mock<IPropertyFieldFlattenerService>();
            flattener
                .Setup(f => f.Flatten(It.IsAny<PropertyCalculationContext>(), It.IsAny<List<RulesFieldEntity>>()))
                .Returns(new Dictionary<string, object>());

            var rulesFieldRepo = new Mock<IRepository<RulesFieldEntity, int>>();
            rulesFieldRepo.Setup(r => r.GetQueryable()).Returns(new List<RulesFieldEntity>().BuildMock());

            Service = new TaxConditionRuleService(
                Context,
                rulesFieldRepo.Object,
                ContextLoader.Object,
                flattener.Object,
                new ConditionRuleEvaluator(),
                MasterData.Object,
                FinanceYearProvider.Object);
        }

        /// <summary>Seeds a persisted OTHER_TAX amount for one detail (mirrors what
        /// RateableValueService/RVPersistenceService would have written for that detail).</summary>
        public void SeedReferencedTaxAmount(int detailId, decimal amount)
        {
            var result = new RVCalculationResultsEntity
            {
                Id = detailId, PropertyId = PropertyId, PropertyDetailsId = detailId,
                IsActive = true, MarkedForDeletion = false,
            };
            Context.RVCalculationResults.Add(result);
            Context.RVCalculationTaxDetails.Add(new RVCalculationTaxDetailsEntity
            {
                Id = detailId, RVCalculationResultsId = result.Id, TaxId = OtherTaxId,
                TaxAmount = amount, IsActive = true, MarkedForDeletion = false,
            });
            Context.SaveChanges();
        }

        public void SeedConditionRow(decimal percent) =>
            Context.TaxConditionRules.Add(DynamicTaxTestContext.ConditionRule(
                id: 1, taxId: TaxId, resultMode: "PERCENT", resultBase: "OTHER_TAX",
                resultValue: percent, referenceTaxId: OtherTaxId));

        public void Dispose() => Context.Dispose();
    }

    [Fact]
    public async Task OtherTaxLookup_UsesThisDetailsOwnAmount_NotThePropertyWideSum()
    {
        using var h = new Harness();
        // Detail 1's referenced tax computed to 100, detail 2's to 400 — a property-wide sum (500)
        // would misprice either detail if the lookup didn't scope to it.
        h.SeedReferencedTaxAmount(DetailId1, 100m);
        h.SeedReferencedTaxAmount(DetailId2, 400m);
        h.SeedConditionRow(percent: 10m);
        h.Context.SaveChanges();

        var result1 = await h.Service.EvaluateAsync(new EvaluateTaxConditionRuleRequest
        {
            TaxId = TaxId, PropertyId = PropertyId, PropertyDetailsId = DetailId1
        });
        var result2 = await h.Service.EvaluateAsync(new EvaluateTaxConditionRuleRequest
        {
            TaxId = TaxId, PropertyId = PropertyId, PropertyDetailsId = DetailId2
        });

        Assert.Equal(100m, result1.MatchedResults.Single().ReferenceTaxAmountUsed);
        Assert.Equal(10m, result1.ComputedAmount); // 10% of 100

        Assert.Equal(400m, result2.MatchedResults.Single().ReferenceTaxAmountUsed);
        Assert.Equal(40m, result2.ComputedAmount); // 10% of 400
    }

    [Fact]
    public async Task OtherTaxLookup_FallsBackToPropertyWideSum_WhenThisDetailHasNoAmountYet()
    {
        using var h = new Harness();
        // Only detail 2 has a computed amount for the referenced tax (e.g. an ordering gap or a
        // PER_UNIT charge only ever posted once, on a different detail) — detail 1 must still see it
        // rather than reporting an unresolved/zero reference.
        h.SeedReferencedTaxAmount(DetailId2, 250m);
        h.SeedConditionRow(percent: 20m);
        h.Context.SaveChanges();

        var result1 = await h.Service.EvaluateAsync(new EvaluateTaxConditionRuleRequest
        {
            TaxId = TaxId, PropertyId = PropertyId, PropertyDetailsId = DetailId1
        });

        Assert.Equal(250m, result1.MatchedResults.Single().ReferenceTaxAmountUsed);
        Assert.Equal(50m, result1.ComputedAmount); // 20% of 250
    }

    [Fact]
    public async Task TaxTotalLookup_ExcludesAllSurchargeTaxesReferencingTaxTotal_NotJustCurrentRequestTax()
    {
        using var h = new Harness();
        const int taxTotalId = 99;
        const int surchargeTaxAId = 20;
        const int surchargeTaxBId = 21;
        const int regularTaxId = 30;

        h.Context.TaxMaster.Add(DynamicTaxTestContext.Tax(taxTotalId, "TaxTotal", calculationModeId: 1));
        h.Context.TaxMaster.Add(DynamicTaxTestContext.Tax(surchargeTaxAId, "SURCHARGE_A", calculationModeId: 2));
        h.Context.TaxMaster.Add(DynamicTaxTestContext.Tax(surchargeTaxBId, "SURCHARGE_B", calculationModeId: 2));
        h.Context.TaxMaster.Add(DynamicTaxTestContext.Tax(regularTaxId, "REGULAR", calculationModeId: 1));

        // Surcharge A and Surcharge B both reference TaxTotal
        h.Context.TaxConditionRules.Add(DynamicTaxTestContext.ConditionRule(
            id: 10, taxId: surchargeTaxAId, resultMode: "PERCENT", resultBase: "OTHER_TAX",
            resultValue: 10m, referenceTaxId: taxTotalId));
        h.Context.TaxConditionRules.Add(DynamicTaxTestContext.ConditionRule(
            id: 11, taxId: surchargeTaxBId, resultMode: "PERCENT", resultBase: "OTHER_TAX",
            resultValue: 5m, referenceTaxId: taxTotalId));

        h.Context.SaveChanges();

        // Seed persisted tax details for DetailId1:
        // Regular Tax = 1000
        // Previously persisted Surcharge B = 50
        var result = new RVCalculationResultsEntity
        {
            Id = DetailId1, PropertyId = PropertyId, PropertyDetailsId = DetailId1,
            IsActive = true, MarkedForDeletion = false,
        };
        h.Context.RVCalculationResults.Add(result);
        h.Context.RVCalculationTaxDetails.Add(new RVCalculationTaxDetailsEntity
        {
            Id = 201, RVCalculationResultsId = result.Id, TaxId = regularTaxId, TaxAmount = 1000m, IsActive = true, MarkedForDeletion = false
        });
        h.Context.RVCalculationTaxDetails.Add(new RVCalculationTaxDetailsEntity
        {
            Id = 202, RVCalculationResultsId = result.Id, TaxId = surchargeTaxBId, TaxAmount = 50m, IsActive = true, MarkedForDeletion = false
        });
        h.Context.SaveChanges();

        // Evaluate Surcharge A preview
        var evalResult = await h.Service.EvaluateAsync(new EvaluateTaxConditionRuleRequest
        {
            TaxId = surchargeTaxAId, PropertyId = PropertyId, PropertyDetailsId = DetailId1
        });

        // Assert: ReferenceTaxAmountUsed for TaxTotal must be 1000 (regular tax only), excluding Surcharge B (50)
        Assert.Equal(1000m, evalResult.MatchedResults.Single().ReferenceTaxAmountUsed);
        Assert.Equal(100m, evalResult.ComputedAmount); // 10% of 1000
    }

    [Fact]
    public async Task TaxTotalLookup_DoesNotExcludeTax_WhenTaxTotalRuleBelongsToDifferentAssessmentYearRange()
    {
        using var h = new Harness();
        const int taxTotalId = 99;
        const int surchargeTaxAId = 20;
        const int taxWithHistoricalTotalRuleId = 25;
        const int regularTaxId = 30;
        const int differentYearRangeId = 999;

        h.Context.TaxMaster.Add(DynamicTaxTestContext.Tax(taxTotalId, "TaxTotal", calculationModeId: 1));
        h.Context.TaxMaster.Add(DynamicTaxTestContext.Tax(surchargeTaxAId, "SURCHARGE_A", calculationModeId: 2));
        h.Context.TaxMaster.Add(DynamicTaxTestContext.Tax(taxWithHistoricalTotalRuleId, "HISTORICAL_TAX", calculationModeId: 2));
        h.Context.TaxMaster.Add(DynamicTaxTestContext.Tax(regularTaxId, "REGULAR", calculationModeId: 1));

        // Surcharge A references TaxTotal for all year ranges (null AssessmentYearRangeId)
        h.Context.TaxConditionRules.Add(DynamicTaxTestContext.ConditionRule(
            id: 10, taxId: surchargeTaxAId, resultMode: "PERCENT", resultBase: "OTHER_TAX",
            resultValue: 10m, referenceTaxId: taxTotalId, assessmentYearRangeId: null));

        // HISTORICAL_TAX has a TaxTotal-referencing rule, BUT ONLY for a different assessment year range (999)
        h.Context.TaxConditionRules.Add(DynamicTaxTestContext.ConditionRule(
            id: 11, taxId: taxWithHistoricalTotalRuleId, resultMode: "PERCENT", resultBase: "OTHER_TAX",
            resultValue: 5m, referenceTaxId: taxTotalId, assessmentYearRangeId: differentYearRangeId));

        h.Context.SaveChanges();

        // Seed persisted tax details for DetailId1:
        // Regular Tax = 1000
        // HISTORICAL_TAX = 200 (should NOT be excluded because its TaxTotal rule is for year range 999, not current)
        var result = new RVCalculationResultsEntity
        {
            Id = DetailId1, PropertyId = PropertyId, PropertyDetailsId = DetailId1,
            IsActive = true, MarkedForDeletion = false,
        };
        h.Context.RVCalculationResults.Add(result);
        h.Context.RVCalculationTaxDetails.Add(new RVCalculationTaxDetailsEntity
        {
            Id = 201, RVCalculationResultsId = result.Id, TaxId = regularTaxId, TaxAmount = 1000m, IsActive = true, MarkedForDeletion = false
        });
        h.Context.RVCalculationTaxDetails.Add(new RVCalculationTaxDetailsEntity
        {
            Id = 202, RVCalculationResultsId = result.Id, TaxId = taxWithHistoricalTotalRuleId, TaxAmount = 200m, IsActive = true, MarkedForDeletion = false
        });
        h.Context.SaveChanges();

        // Evaluate Surcharge A preview for current year
        var evalResult = await h.Service.EvaluateAsync(new EvaluateTaxConditionRuleRequest
        {
            TaxId = surchargeTaxAId, PropertyId = PropertyId, PropertyDetailsId = DetailId1
        });

        // Assert: TaxTotal base includes HISTORICAL_TAX (1000 + 200 = 1200) because its TaxTotal rule is inapplicable
        Assert.Equal(1200m, evalResult.MatchedResults.Single().ReferenceTaxAmountUsed);
        Assert.Equal(120m, evalResult.ComputedAmount); // 10% of 1200
    }
}
