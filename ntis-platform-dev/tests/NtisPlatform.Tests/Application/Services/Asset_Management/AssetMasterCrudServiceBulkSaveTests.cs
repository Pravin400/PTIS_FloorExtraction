using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.Bulk;
using NtisPlatform.Application.DTOs.Master;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.Asset_Management;

/// <summary>
/// How AssetMasterCrudService's bulk create/update handle a failed per-item save, through GSTService. Each item is
/// saved before the next is validated; when the database rejects an item as a duplicate (another request saved the
/// same unique value after the item's check), only that item fails and the batch goes on. Any other database error
/// rolls the whole batch back. The SQL Server versions of these cases are in AmsMasterSqlServerTests.
/// </summary>
public class AssetMasterCrudServiceBulkSaveTests
{
    private readonly Mock<IRepository<GSTMasterEntity, int>> _repository = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();
    private readonly Mock<IReferenceValidationService> _referenceValidator = new();
    private readonly GSTService _service;

    public AssetMasterCrudServiceBulkSaveTests()
    {
        _repository.Setup(r => r.GetQueryable()).Returns(new List<GSTMasterEntity>().BuildMock());
        _repository.Setup(r => r.AddAsync(It.IsAny<GSTMasterEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((GSTMasterEntity e, CancellationToken _) => e);
        _referenceValidator
            .Setup(v => v.ValidateReferencesAsync<GSTMasterEntity>(It.IsAny<int>(), It.IsAny<ReferenceValidationOperation>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        var mapper = new MapperConfiguration(
            cfg => cfg.AddMaps(typeof(NtisPlatform.Application.Mappings.AssetTypeMappingProfile).Assembly),
            Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance).CreateMapper();

        _service = new GSTService(_repository.Object, _unitOfWork.Object, mapper, _referenceValidator.Object);
    }

    /// <summary>Stands in for SqlException: the service reads the provider's error number by name.</summary>
    private sealed class FakeSqlException(int number) : Exception($"SQL error {number}")
    {
        public int Number { get; } = number;
    }

    private static DbUpdateException SaveFailure(int sqlErrorNumber)
        => new("An error occurred while saving the entity changes.", new FakeSqlException(sqlErrorNumber));

    /// <summary>The item saves succeed except the one at <paramref name="failingSave"/> (1-based), which throws.</summary>
    private void SetupSaves(int failingSave, Exception error)
    {
        var call = 0;
        _unitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Returns(() => ++call == failingSave ? Task.FromException<int>(error) : Task.FromResult(1));
    }

    private static CreateGSTDto Rate(string code, string name)
        => new() { TaxCode = code, TaxName = name, TaxPercentage = 18, EffectiveFromDate = new DateTime(2024, 4, 1), IsActive = true };

    [Theory]
    [InlineData(2627)] // unique / primary key constraint
    [InlineData(2601)] // unique index
    public async Task BulkCreate_DuplicateKeyOnOneItemsSave_ReportsThatItemAndSavesTheOthers(int sqlErrorNumber)
    {
        SetupSaves(failingSave: 2, SaveFailure(sqlErrorNumber));

        var result = await _service.BulkCreateAsync(new[] { Rate("GST5", "GST 5%"), Rate("GST12", "GST 12%"), Rate("GST18", "GST 18%") });

        Assert.Equal(2, result.SuccessCount);
        Assert.Equal(1, result.FailedCount);
        Assert.Equal(new[] { "GST5", "GST18" }, result.Results.Select(r => r.TaxCode));
        Assert.Equal("Item 1: A record with the same details already exists.", Assert.Single(result.Errors!));
        _unitOfWork.Verify(u => u.DiscardChanges(), Times.Once);
        _unitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWork.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData(547)]  // foreign key / check constraint
    [InlineData(2628)] // value too long
    public async Task BulkCreate_OtherDatabaseErrorOnAnItemsSave_RollsBackTheBatch(int sqlErrorNumber)
    {
        SetupSaves(failingSave: 2, SaveFailure(sqlErrorNumber));

        await Assert.ThrowsAsync<DbUpdateException>(() =>
            _service.BulkCreateAsync(new[] { Rate("GST5", "GST 5%"), Rate("GST12", "GST 12%") }));

        _unitOfWork.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
        _unitOfWork.Verify(u => u.DiscardChanges(), Times.Never);
    }

    [Fact]
    public async Task BulkUpdate_DuplicateKeyOnOneItemsSave_ReportsThatRecordAndSavesTheOthers()
    {
        var first = new GSTMasterEntity { Id = 1, TaxCode = "GST5", TaxName = "GST 5%", TaxPercentage = 5, EffectiveFromDate = new DateTime(2024, 4, 1), IsActive = true };
        var second = new GSTMasterEntity { Id = 2, TaxCode = "GST12", TaxName = "GST 12%", TaxPercentage = 12, EffectiveFromDate = new DateTime(2024, 4, 1), IsActive = true };
        _repository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(first);
        _repository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(second);
        SetupSaves(failingSave: 2, SaveFailure(2627));

        var result = await _service.BulkUpdateAsync(new[]
        {
            new BulkUpdateItem<int, UpdateGSTDto>(1, new UpdateGSTDto { TaxCode = "GST5", TaxName = "GST 5% (revised)", TaxPercentage = 5, EffectiveFromDate = new DateTime(2024, 4, 1), IsActive = true }),
            new BulkUpdateItem<int, UpdateGSTDto>(2, new UpdateGSTDto { TaxCode = "GST28", TaxName = "GST 28%", TaxPercentage = 28, EffectiveFromDate = new DateTime(2024, 4, 1), IsActive = true })
        });

        Assert.Equal(1, result.SuccessCount);
        Assert.Equal("GST 5% (revised)", Assert.Single(result.Results).TaxName);
        Assert.Equal("Record with Id '2': A record with the same details already exists.", Assert.Single(result.Errors!));
        _unitOfWork.Verify(u => u.DiscardChanges(), Times.Once);
        _unitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
