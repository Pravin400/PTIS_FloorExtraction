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

public class TaxConditionRuleServiceFloorBasedTests
{
    private const int TaxId = 7;
    private const int PropertyId = 556014;
    private const int Detail1Id = 206124;
    private const int Detail2Id = 206125;
    private const int FloorId = 17;

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
            Context.TaxMaster.Add(DynamicTaxTestContext.Tax(TaxId, "FIRECESS", calculationModeId: 2));
            Context.SaveChanges();

            FinanceYearProvider.Setup(f => f.GetCurrentFinanceYear()).Returns(CurrentYear);

            MasterData.Setup(m => m.GetActiveTypeOfUsesAsync()).ReturnsAsync(new List<TypeOfUseEntity>
            {
                new() { Id = 1, TypeOfUseGroupId = 1, Description = "Residential" },
                new() { Id = 91, TypeOfUseGroupId = 1, Description = "Commercial" },
            });

            var property = new PropertyEntity { Id = PropertyId, WardId = 1, PropertyNo = "100", IsActive = true };

            var detail1 = new PropertyDetailsEntity
            {
                Id = Detail1Id,
                PropertyId = PropertyId,
                FloorId = FloorId,
                TypeOfUseId = 1,
                BuiltupAreaSqFeet = 472.24,
                BuiltupAreaSqMeter = 43.87,
                CarpetAreaSqFeet = 393.53,
                CarpetAreaSqMeter = 36.56,
                IsActive = true,
                MarkedForDeletion = false,
                Floor = new FloorEntity { Id = FloorId, FloorCode = "5", SequenceNo = 5 }
            };

            var detail2 = new PropertyDetailsEntity
            {
                Id = Detail2Id,
                PropertyId = PropertyId,
                FloorId = FloorId,
                TypeOfUseId = 91,
                BuiltupAreaSqFeet = 43.92,
                BuiltupAreaSqMeter = 4.08,
                CarpetAreaSqFeet = 36.60,
                CarpetAreaSqMeter = 152.0,
                IsActive = true,
                MarkedForDeletion = false,
                Floor = new FloorEntity { Id = FloorId, FloorCode = "5", SequenceNo = 5 }
            };

            var details = new List<PropertyDetailsEntity> { detail1, detail2 };
            var propertyContext = new PropertyCalculationContext
            {
                Property = property,
                Details = details,
                Parameters = new PropertyCalculationParameters { FinanceYear = CurrentYear }
            };

            ContextLoader.Setup(l => l.LoadPropertyContextAsync(PropertyId, CurrentYear, It.IsAny<CancellationToken>()))
                .ReturnsAsync(propertyContext);

            var fieldFlattener = new PropertyFieldFlattenerService();
            var evaluator = new ConditionRuleEvaluator();

            var fields = new List<RulesFieldEntity>
            {
                new() { Id = 1, FieldName = "BuiltupAreaSqFeet", DatabaseColumnName = "BuiltupAreaSqFeet", IsActive = true },
                new() { Id = 2, FieldName = "BuiltupAreaSqMeter", DatabaseColumnName = "BuiltupAreaSqMeter", IsActive = true },
                new() { Id = 3, FieldName = "CarpetAreaSqFeet", DatabaseColumnName = "CarpetAreaSqFeet", IsActive = true },
                new() { Id = 4, FieldName = "CarpetAreaSqMeter", DatabaseColumnName = "CarpetAreaSqMeter", IsActive = true },
                new() { Id = 5, FieldName = "Rateable Value", DatabaseColumnName = "RateableValue", IsActive = true },
            };

            var rulesFieldRepo = new Mock<IRepository<RulesFieldEntity, int>>();
            rulesFieldRepo.Setup(r => r.GetQueryable()).Returns(fields.BuildMock());

            Service = new TaxConditionRuleService(
                Context,
                rulesFieldRepo.Object,
                ContextLoader.Object,
                fieldFlattener,
                evaluator,
                MasterData.Object,
                FinanceYearProvider.Object);
        }

        public void SeedDetailRv(int detailId, decimal rateableValue, double annualRentalValue = 0)
        {
            Context.RVCalculationResults.Add(new RVCalculationResultsEntity
            {
                Id = detailId,
                PropertyId = PropertyId,
                PropertyDetailsId = detailId,
                RateableValue = rateableValue,
                AnnualRentalValue = annualRentalValue,
                IsActive = true,
                MarkedForDeletion = false,
            });
            Context.SaveChanges();
        }

        public void SeedConditionRow(
            string conditionsJson,
            string assessmentBasis = "FLOOR_BASED",
            string resultMode = "PERCENT",
            string resultBase = "RV",
            decimal resultValue = 10m,
            string? unitFieldId = null)
        {
            Context.TaxConditionRules.Add(DynamicTaxTestContext.ConditionRule(
                id: 1,
                taxId: TaxId,
                sortOrder: 1,
                resultMode: resultMode,
                resultBase: resultBase,
                resultValue: resultValue,
                conditionsJson: conditionsJson,
                unitFieldId: unitFieldId,
                assessmentBasis: assessmentBasis));
            Context.SaveChanges();
        }

        public void Dispose() => Context.Dispose();
    }

    [Fact]
    public async Task FloorBased_CombinesBuiltUpAreaAcrossDetailsOnSameFloor()
    {
        // Detail 1 is 472.24 sq ft, Detail 2 is 43.92 sq ft. Neither is > 500 sq ft on its own.
        // Combined on Floor 17 = 516.16 sq ft, which clears the > 500 sq ft condition.
        using var h = new Harness();
        h.SeedDetailRv(Detail1Id, rateableValue: 1000m);
        h.SeedDetailRv(Detail2Id, rateableValue: 200m);
        h.SeedConditionRow(
            conditionsJson: """[{"FieldId":"BuiltupAreaSqFeet","Operator":">","Value":"500","LogicalOperator":"AND"}]""",
            assessmentBasis: "FLOOR_BASED",
            resultMode: "PERCENT",
            resultBase: "RV",
            resultValue: 10m);

        // Evaluate Detail 1
        var result1 = await h.Service.EvaluateAsync(new EvaluateTaxConditionRuleRequest
        {
            TaxId = TaxId,
            PropertyId = PropertyId,
            PropertyDetailsId = Detail1Id
        });

        Assert.True(result1.Matched);
        Assert.Equal(100m, result1.ComputedAmount); // 10% of Detail 1's RV (1000)

        // Evaluate Detail 2
        var result2 = await h.Service.EvaluateAsync(new EvaluateTaxConditionRuleRequest
        {
            TaxId = TaxId,
            PropertyId = PropertyId,
            PropertyDetailsId = Detail2Id
        });

        Assert.True(result2.Matched);
        Assert.Equal(20m, result2.ComputedAmount); // 10% of Detail 2's RV (200)
    }

    [Fact]
    public async Task FloorBased_FixedAmount_ApportionedByAreaToAvoidDoubleCounting()
    {
        // 100 Rs fixed tax for the floor.
        // Detail 1: 472.24 / 516.16 = 91.49% -> 91 Rs
        // Detail 2: 43.92 / 516.16 = 8.51% -> 9 Rs
        // Total = 100 Rs (no double counting).
        using var h = new Harness();
        h.SeedConditionRow(
            conditionsJson: "[]",
            assessmentBasis: "FLOOR_BASED",
            resultMode: "FIXED",
            resultBase: "NONE",
            resultValue: 100m);

        var result1 = await h.Service.EvaluateAsync(new EvaluateTaxConditionRuleRequest
        {
            TaxId = TaxId,
            PropertyId = PropertyId,
            PropertyDetailsId = Detail1Id
        });

        Assert.True(result1.Matched);
        Assert.Equal(91m, result1.ComputedAmount);

        var result2 = await h.Service.EvaluateAsync(new EvaluateTaxConditionRuleRequest
        {
            TaxId = TaxId,
            PropertyId = PropertyId,
            PropertyDetailsId = Detail2Id
        });

        Assert.True(result2.Matched);
        Assert.Equal(9m, result2.ComputedAmount);
    }

    [Fact]
    public async Task FloorBased_PerUnitArea_PricesOffDetailAreaToAvoidDoubleCounting()
    {
        // 2 Rs per sq ft of built-up area.
        // Detail 1 (472.24 sq ft): 2 * 472.24 = 944.48 -> 944 Rs
        // Detail 2 (43.92 sq ft): 2 * 43.92 = 87.84 -> 88 Rs
        // Total = 944 + 88 = 1032 Rs (which is round(2 * 516.16)).
        using var h = new Harness();
        h.SeedConditionRow(
            conditionsJson: """[{"FieldId":"BuiltupAreaSqFeet","Operator":">","Value":"500","LogicalOperator":"AND"}]""",
            assessmentBasis: "FLOOR_BASED",
            resultMode: "PER_UNIT",
            unitFieldId: "BuiltupAreaSqFeet",
            resultValue: 2m);

        var result1 = await h.Service.EvaluateAsync(new EvaluateTaxConditionRuleRequest
        {
            TaxId = TaxId,
            PropertyId = PropertyId,
            PropertyDetailsId = Detail1Id
        });

        Assert.True(result1.Matched);
        Assert.Equal(944m, result1.ComputedAmount);

        var result2 = await h.Service.EvaluateAsync(new EvaluateTaxConditionRuleRequest
        {
            TaxId = TaxId,
            PropertyId = PropertyId,
            PropertyDetailsId = Detail2Id
        });

        Assert.True(result2.Matched);
        Assert.Equal(88m, result2.ComputedAmount);
    }
}
