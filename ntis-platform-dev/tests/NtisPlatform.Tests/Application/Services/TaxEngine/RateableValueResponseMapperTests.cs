using System;
using System.Collections.Generic;
using NtisPlatform.Application.Services.TaxEngine;
using NtisPlatform.Application.Services.TaxEngine.DynamicTax;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.TaxEngine
{
    public class RateableValueResponseMapperTests
    {
        [Fact]
        public void Map_ExcludesTaxesWithAllFloorsAggregatedInConditionsJson_FromDetailsTaxes()
        {
            // Arrange
            int propertyId = 100;
            int financeYear = 2026;

            var details = new List<PropertyDetailsEntity>
            {
                new() { Id = 1, CarpetAreaSqFeet = 500, CarpetAreaSqMeter = 46.45, TypeOfUseId = 1 }
            };

            var resultRows = new List<RVCalculationResultsEntity>
            {
                new() { Id = 10, PropertyDetailsId = 1, RateableValue = 1000m, IsActive = true }
            };

            // Tax 1: Floor-wise tax ("General Tax")
            // Tax 2: Property-level tax configured with ALL_FLOORS_AGGREGATED in ConditionsJson (Arbitrary name, not hardcoded!)
            // Tax 3: EDU tax (Category EDU)
            var taxDetailRows = new List<RVCalculationTaxDetailsEntity>
            {
                new() { Id = 101, RVCalculationResultsId = 10, TaxId = 1, TaxAmount = 200m, IsActive = true },
                new() { Id = 102, RVCalculationResultsId = 10, TaxId = 2, TaxAmount = 500m, IsActive = true },
                new() { Id = 103, RVCalculationResultsId = 10, TaxId = 3, TaxAmount = 50m, IsActive = true }
            };

            var policyRows = new List<PolicyTaxDetailsEntity>
            {
                new() { PropertyId = propertyId, TaxId = 1, TaxAmount = 200m },
                new() { PropertyId = propertyId, TaxId = 2, TaxAmount = 500m },
                new() { PropertyId = propertyId, TaxId = 3, TaxAmount = 50m }
            };

            var activeTaxes = new List<TaxMasterEntity>
            {
                new() { Id = 1, TaxName = "General Tax" },
                new() { Id = 2, TaxName = "ArbitraryCustomTaxGivenBySenior" },
                new() { Id = 3, TaxName = "State Education Tax", TaxCategoryMaster = new() { CategoryCode = "EDU" } }
            };

            var taxMasterCache = new TaxGetterCache<TaxMasterEntity>(
                activeTaxes,
                x => x.Id,
                x => x.TaxName,
                x => x.TaxCategoryMaster?.CategoryCode ?? string.Empty);

            var dynamicTaxConfig = new DynamicTaxConfigSnapshot
            {
                ConditionRulesByTax = new Dictionary<int, List<TaxConditionRuleEntity>>
                {
                    [2] = new()
                    {
                        new TaxConditionRuleEntity
                        {
                            Id = 201,
                            TaxId = 2,
                            ConditionsJson = "{\"conditions\":[],\"conditionEvaluationScope\":\"ALL_FLOORS_AGGREGATED\"}",
                            ResultMode = "FIXED",
                            ResultValue = 500m,
                            IsActive = true
                        }
                    }
                }
            };

            // Act
            var response = RateableValueResponseMapper.Map(
                propertyId, financeYear, details, resultRows, taxDetailRows, policyRows,
                new List<FloorEntity>(), new List<ConstructionTypeEntity>(), new List<TypeOfUseEntity>(),
                new List<SubTypeOfUseEntity>(), new List<SubFloorEntity>(), new List<RenterMastEntity>(),
                new List<PropertyCertificateEntity>(), taxMasterCache, dynamicTaxConfig);

            // Assert
            Assert.NotNull(response);
            Assert.Single(response.Details);
            var detail = response.Details[0];

            // In details[0].taxes:
            // - General Tax (Tax 1) MUST be included
            // - ArbitraryCustomTaxGivenBySenior (Tax 2, ALL_FLOORS_AGGREGATED) MUST be excluded
            // - State Education Tax (Tax 3, EDU) MUST be excluded
            Assert.True(detail.Taxes.ContainsKey("General Tax"));
            Assert.Equal(200m, detail.Taxes["General Tax"]);

            Assert.False(detail.Taxes.ContainsKey("ArbitraryCustomTaxGivenBySenior"));
            Assert.False(detail.Taxes.ContainsKey("State Education Tax"));
            Assert.Equal(200m, detail.TaxTotal);

            // In policy.taxes:
            // ALL taxes MUST be present
            Assert.NotNull(response.Policy);
            Assert.True(response.Policy.Taxes.ContainsKey("General Tax"));
            Assert.True(response.Policy.Taxes.ContainsKey("ArbitraryCustomTaxGivenBySenior"));
            Assert.True(response.Policy.Taxes.ContainsKey("State Education Tax"));
            Assert.Equal(500m, response.Policy.Taxes["ArbitraryCustomTaxGivenBySenior"]);
        }
    }
}
