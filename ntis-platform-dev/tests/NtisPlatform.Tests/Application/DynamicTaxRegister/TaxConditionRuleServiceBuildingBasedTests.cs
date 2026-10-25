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
/// Reproduces the real Fire Cess scenario reported against <c>TaxConditionRuleService.EvaluateAsync</c>:
/// a condition row with <c>IsBuildingBased=true</c> checking the standard "Rateable Value" field must
/// match against the whole BUILDING's aggregate RV (<c>PropertyCalculationParameters.BuildingTotalRateableValue</c>),
/// not this one detail's own RV — while the matched row's amount (an OTHER_TAX percentage here) must
/// still be computed off THIS detail's own already-computed reference-tax amount, never the building's.
/// </summary>
public class TaxConditionRuleServiceBuildingBasedTests
{
    private const int TaxId = 7; // Fire Cess, matching the reported TaxId
    private const int OtherTaxId = 21; // Tax Total, matching the reported ReferenceTaxId
    private const int PropertyId = 579099;
    private const int DetailId = 206106;
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

        public Harness(decimal buildingTotalRateableValue, List<PropertyDetailsEntity>? customDetails = null)
        {
            Context = DynamicTaxTestContext.Create();
            Context.TaxMaster.Add(DynamicTaxTestContext.Tax(TaxId, "FIRECESS", calculationModeId: 2));
            Context.TaxMaster.Add(DynamicTaxTestContext.Tax(OtherTaxId, "TAXTOTAL", calculationModeId: 1));
            Context.SaveChanges();

            FinanceYearProvider.Setup(f => f.GetCurrentFinanceYear()).Returns(CurrentYear);

            MasterData.Setup(m => m.GetActiveTypeOfUsesAsync()).ReturnsAsync(new List<TypeOfUseEntity>
            {
                new() { Id = TypeOfUseId, Type = "R", TypeOfUseGroupId = 1, IsActive = true }
            });

            var property = new PropertyEntity { Id = PropertyId, IsActive = true, MarkedForDeletion = false };
            var details = customDetails ?? new List<PropertyDetailsEntity>
            {
                new() { Id = DetailId, PropertyId = PropertyId, TypeOfUseId = TypeOfUseId, FloorId = FloorId, IsActive = true },
            };

            ContextLoader
                .Setup(c => c.LoadPropertyContextAsync(PropertyId, It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new PropertyCalculationContext
                {
                    Property = property,
                    Details = details,
                    Parameters = new PropertyCalculationParameters
                    {
                        FinanceYear = CurrentYear,
                        BuildingTotalRateableValue = buildingTotalRateableValue,
                    }
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

        /// <summary>This detail's own already-computed RV, and the referenced tax's (Tax Total's)
        /// already-computed amount for this detail — mirrors what RateableValueService/
        /// RVPersistenceService would have persisted for it.</summary>
        public void SeedDetailRvAndReferenceAmount(decimal rateableValue, decimal referenceTaxAmount)
        {
            var result = new RVCalculationResultsEntity
            {
                Id = DetailId, PropertyId = PropertyId, PropertyDetailsId = DetailId,
                RateableValue = rateableValue,
                IsActive = true, MarkedForDeletion = false,
            };
            Context.RVCalculationResults.Add(result);
            Context.RVCalculationTaxDetails.Add(new RVCalculationTaxDetailsEntity
            {
                Id = DetailId, RVCalculationResultsId = result.Id, TaxId = OtherTaxId,
                TaxAmount = referenceTaxAmount, IsActive = true, MarkedForDeletion = false,
            });
            Context.SaveChanges();
        }

        public void SeedConditionRow(bool isBuildingBased, decimal percent) =>
            Context.TaxConditionRules.Add(DynamicTaxTestContext.ConditionRule(
                id: 1, taxId: TaxId, resultMode: "PERCENT", resultBase: "OTHER_TAX",
                resultValue: percent, referenceTaxId: OtherTaxId, isBuildingBased: isBuildingBased,
                conditionsJson: """[{"FieldId":"Rateable Value","Operator":">=","Value":"4000","LogicalOperator":"AND"}]"""));

        public void Dispose() => Context.Dispose();
    }

    [Fact]
    public async Task IsBuildingBased_MatchesAgainstBuildingTotalRateableValue_ButPricesOffThisDetailsReferenceAmount()
    {
        // This detail's own RV (3240.58) is below the 4000 threshold — the reported real-world case —
        // but the building's total RV (10000+) clears it.
        using var h = new Harness(buildingTotalRateableValue: 10500m);
        h.SeedDetailRvAndReferenceAmount(rateableValue: 3240.58m, referenceTaxAmount: 1069m);
        h.SeedConditionRow(isBuildingBased: true, percent: 20m);
        h.Context.SaveChanges();

        var result = await h.Service.EvaluateAsync(new EvaluateTaxConditionRuleRequest
        {
            TaxId = TaxId, PropertyId = PropertyId, PropertyDetailsId = DetailId
        });

        Assert.True(result.Matched);
        // 20% of THIS detail's own Tax Total (1069), never the building's aggregate.
        Assert.Equal(1069m, result.MatchedResults.Single().ReferenceTaxAmountUsed);
        Assert.Equal(214m, result.ComputedAmount); // round(1069 * 20 / 100)
    }

    [Fact]
    public async Task IsBuildingBased_False_DoesNotMatchAgainstBuildingTotalRateableValue()
    {
        // Same per-detail RV/building total as above, but PROPERTY_BASED (IsBuildingBased=false) must
        // keep matching against the property-wide total (this property has only one detail, so its
        // property-wide total equals its own RV, 3240.58) — never the building's aggregate.
        using var h = new Harness(buildingTotalRateableValue: 10500m);
        h.SeedDetailRvAndReferenceAmount(rateableValue: 3240.58m, referenceTaxAmount: 1069m);
        h.SeedConditionRow(isBuildingBased: false, percent: 20m);
        h.Context.SaveChanges();

        var result = await h.Service.EvaluateAsync(new EvaluateTaxConditionRuleRequest
        {
            TaxId = TaxId, PropertyId = PropertyId, PropertyDetailsId = DetailId
        });

        Assert.False(result.Matched);
        Assert.Equal(0m, result.ComputedAmount);
    }

    [Fact]
    public async Task PropertyBased_CarpetArea_EvaluatesAgainstSumOfActiveDetails()
    {
        // Property 556014 scenario:
        // Detail 1: CarpetAreaSqMeter = 36.56 sq. m
        // Detail 2: CarpetAreaSqMeter = 36.60 sq. m
        // Total across property = 73.16 sq. m.
        // Condition: CarpetAreaSqMeter > 150.
        // Since property-wide total (73.16) <= 150, rule must NOT match either record.
        var detail1 = new PropertyDetailsEntity { Id = 206124, PropertyId = PropertyId, TypeOfUseId = TypeOfUseId, FloorId = FloorId, CarpetAreaSqMeter = 36.56, IsActive = true };
        var detail2 = new PropertyDetailsEntity { Id = 206125, PropertyId = PropertyId, TypeOfUseId = TypeOfUseId, FloorId = FloorId, CarpetAreaSqMeter = 36.60, IsActive = true };
        var details = new List<PropertyDetailsEntity> { detail1, detail2 };

        using var h = new Harness(buildingTotalRateableValue: 5000m, customDetails: details);
        h.Context.TaxConditionRules.Add(DynamicTaxTestContext.ConditionRule(
            id: 2, taxId: TaxId, resultMode: "PERCENT", resultBase: "RV",
            resultValue: 10m, isBuildingBased: false,
            conditionsJson: """[{"FieldId":"CarpetAreaSqMeter","Operator":">","Value":"150","LogicalOperator":"AND"}]"""));
        h.Context.SaveChanges();

        // Evaluate detail 1
        var result1 = await h.Service.EvaluateAsync(new EvaluateTaxConditionRuleRequest
        {
            TaxId = TaxId, PropertyId = PropertyId, PropertyDetailsId = 206124
        });
        Assert.False(result1.Matched);

        // Evaluate detail 2
        var result2 = await h.Service.EvaluateAsync(new EvaluateTaxConditionRuleRequest
        {
            TaxId = TaxId, PropertyId = PropertyId, PropertyDetailsId = 206125
        });
        Assert.False(result2.Matched);
    }

   
    [Fact]
    public async Task BuildingBased_BuiltupArea_MatchesBothDetailsWhenPropertySumSatisfiesRange()
    {
        // Detail 1: 727.21 sq. ft (living room)
        // Detail 2: 72.59 sq. ft (balcony)
        // Property sum = 799.80 sq. ft (within 601 - 1000 range).
        // Since property sum is 799.80, both details must match the 601-1000 condition even when IsBuildingBased is true!
        var detail1 = new PropertyDetailsEntity { Id = 2500177, PropertyId = PropertyId, TypeOfUseId = TypeOfUseId, FloorId = FloorId, BuiltupAreaSqFeet = 727.21, IsActive = true };
        var detail2 = new PropertyDetailsEntity { Id = 2501195, PropertyId = PropertyId, TypeOfUseId = TypeOfUseId, FloorId = FloorId, BuiltupAreaSqFeet = 72.59, IsActive = true };
        var details = new List<PropertyDetailsEntity> { detail1, detail2 };

        using var h = new Harness(buildingTotalRateableValue: 5000m, customDetails: details);
        h.Context.TaxConditionRules.Add(DynamicTaxTestContext.ConditionRule(
            id: 4, taxId: TaxId, resultMode: "PERCENT", resultBase: "RV",
            resultValue: 100m, isBuildingBased: true,
            conditionsJson: """[{"FieldId":"BuiltupAreaSqFeet","Operator":"BETWEEN","Value":["601","1000"],"LogicalOperator":"AND"}]"""));
        h.Context.SaveChanges();

        var result1 = await h.Service.EvaluateAsync(new EvaluateTaxConditionRuleRequest
        {
            TaxId = TaxId, PropertyId = PropertyId, PropertyDetailsId = 2500177
        });
        Assert.True(result1.Matched);

        var result2 = await h.Service.EvaluateAsync(new EvaluateTaxConditionRuleRequest
        {
            TaxId = TaxId, PropertyId = PropertyId, PropertyDetailsId = 2501195
        });
        Assert.True(result2.Matched);
    }
}
