using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Moq;
using MockQueryable;
using NtisPlatform.Application.Services.TaxEngine.DynamicTax;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.DynamicTaxRegister;

/// <summary>
/// <see cref="DynamicTaxConfigReader.GetConfigFingerprintAsync"/> is computed on every RV
/// calculation, including every fast-path cache hit — it must reflect COUNT + MAX(UpdatedDate)
/// per table using a single aggregate query per table (not a separate COUNT then MAX), which this
/// pins by asserting the values it produces rather than the query shape.
/// </summary>
public class DynamicTaxConfigReaderFingerprintTests
{
    private static (
        DynamicTaxConfigReader Reader,
        Mock<IRepository<TaxConditionRuleEntity, int>> ConditionRepo,
        Mock<IRepository<TaxMasterMappingEntity, int>> MappingRepo,
        Mock<IRepository<TaxHybridConfigEntity, int>> HybridRepo,
        Mock<IRepository<DynamicTaxRuleEntity, int>> RuleRepo,
        Mock<IRepository<TaxMasterEntity, int>> TaxMasterRepo) CreateReader()
    {
        var conditionRepo = new Mock<IRepository<TaxConditionRuleEntity, int>>();
        var mappingRepo = new Mock<IRepository<TaxMasterMappingEntity, int>>();
        var hybridRepo = new Mock<IRepository<TaxHybridConfigEntity, int>>();
        var ruleRepo = new Mock<IRepository<DynamicTaxRuleEntity, int>>();
        var taxMasterRepo = new Mock<IRepository<TaxMasterEntity, int>>();

        conditionRepo.Setup(r => r.GetQueryable()).Returns(new List<TaxConditionRuleEntity>().BuildMock());
        mappingRepo.Setup(r => r.GetQueryable()).Returns(new List<TaxMasterMappingEntity>().BuildMock());
        hybridRepo.Setup(r => r.GetQueryable()).Returns(new List<TaxHybridConfigEntity>().BuildMock());
        ruleRepo.Setup(r => r.GetQueryable()).Returns(new List<DynamicTaxRuleEntity>().BuildMock());
        taxMasterRepo.Setup(r => r.GetQueryable()).Returns(new List<TaxMasterEntity>().BuildMock());

        var reader = new DynamicTaxConfigReader(
            conditionRepo.Object, mappingRepo.Object, hybridRepo.Object, ruleRepo.Object, taxMasterRepo.Object);
        return (reader, conditionRepo, mappingRepo, hybridRepo, ruleRepo, taxMasterRepo);
    }

    [Fact]
    public async Task AllTablesEmpty_ProducesAStableFingerprint()
    {
        var (reader, _, _, _, _, _) = CreateReader();

        var first = await reader.GetConfigFingerprintAsync(CancellationToken.None);
        var second = await reader.GetConfigFingerprintAsync(CancellationToken.None);

        Assert.Equal(first, second);
    }

    [Fact]
    public async Task NewConditionRuleRow_ChangesTheFingerprint()
    {
        var (reader, conditionRepo, _, _, _, _) = CreateReader();
        var before = await reader.GetConfigFingerprintAsync(CancellationToken.None);

        conditionRepo.Setup(r => r.GetQueryable()).Returns(new List<TaxConditionRuleEntity>
        {
            new()
            {
                Id = 1, TaxId = 1, ConditionsJson = "[]", ResultMode = "FIXED", ResultBase = "NONE",
                IsActive = true, CreatedDate = DateTime.UtcNow,
            }
        }.BuildMock());

        var after = await reader.GetConfigFingerprintAsync(CancellationToken.None);

        Assert.NotEqual(before, after);
    }

    [Fact]
    public async Task UpdatingAnExistingRowsTimestamp_ChangesTheFingerprint_WithoutChangingRowCount()
    {
        var (reader, conditionRepo, _, _, _, _) = CreateReader();
        var row = new TaxConditionRuleEntity
        {
            Id = 1, TaxId = 1, ConditionsJson = "[]", ResultMode = "FIXED", ResultBase = "NONE",
            IsActive = true, CreatedDate = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        };
        conditionRepo.Setup(r => r.GetQueryable()).Returns(new List<TaxConditionRuleEntity> { row }.BuildMock());
        var before = await reader.GetConfigFingerprintAsync(CancellationToken.None);

        // Same row, same count — only UpdatedDate moved forward (e.g. an admin edited ResultValue).
        row.UpdatedDate = new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc);
        var after = await reader.GetConfigFingerprintAsync(CancellationToken.None);

        Assert.NotEqual(before, after);
    }

    [Fact]
    public async Task DeactivatingARow_StillChangesTheFingerprint()
    {
        // Fingerprint intentionally covers ALL rows, active or not — a row being deactivated must
        // still invalidate every property's cached RV result, and deactivation moves UpdatedDate.
        var (reader, conditionRepo, _, _, _, _) = CreateReader();
        var row = new TaxConditionRuleEntity
        {
            Id = 1, TaxId = 1, ConditionsJson = "[]", ResultMode = "FIXED", ResultBase = "NONE",
            IsActive = true, CreatedDate = DateTime.UtcNow,
        };
        conditionRepo.Setup(r => r.GetQueryable()).Returns(new List<TaxConditionRuleEntity> { row }.BuildMock());
        var before = await reader.GetConfigFingerprintAsync(CancellationToken.None);

        row.IsActive = false;
        row.UpdatedDate = DateTime.UtcNow.AddMinutes(1);
        var after = await reader.GetConfigFingerprintAsync(CancellationToken.None);

        Assert.NotEqual(before, after);
    }

    [Fact]
    public async Task ChangingATaxMastersCalculationModeOrLinkedRule_ChangesTheFingerprint()
    {
        // DynamicTaxRegisterService.UpdateSettingsAsync writes CalculationModeId, RuleDefinitionId,
        // and IsActive straight onto TaxMaster — none of the other four tables. Switching a tax's
        // mode, or just its linked rule within the same mode, must still invalidate the fast path.
        var (reader, _, _, _, _, taxMasterRepo) = CreateReader();
        var tax = new TaxMasterEntity
        {
            Id = 1, TaxCode = "T1", TaxName = "T1", CalculationModeId = 2, RuleDefinitionId = 10,
            IsActive = true, CreatedDate = DateTime.UtcNow,
        };
        taxMasterRepo.Setup(r => r.GetQueryable()).Returns(new List<TaxMasterEntity> { tax }.BuildMock());
        var before = await reader.GetConfigFingerprintAsync(CancellationToken.None);

        // Same row count, only the linked rule and UpdatedDate changed.
        tax.RuleDefinitionId = 20;
        tax.UpdatedDate = DateTime.UtcNow.AddMinutes(1);
        var after = await reader.GetConfigFingerprintAsync(CancellationToken.None);

        Assert.NotEqual(before, after);
    }
}
