using Microsoft.Extensions.Logging;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.RateableValue;
using NtisPlatform.Application.DTOs.RetrospectiveTax;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.RetrospectiveTax;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application;

/// <summary>
/// Unit tests for CombinePropertyTaxService
/// Tests tax aggregation and recalculation during property combination
/// </summary>
public class CombinePropertyTaxServiceTests
{
    private const int OldArrearsPolicyCodeId = 21;

    private readonly Mock<IRepository<TransMastEntity>> _mockTransMastRepository;
    private readonly Mock<IRepository<YearMasterEntity, int>> _mockYearMasterRepository;
    private readonly Mock<IPolicyCodeLookupService> _mockPolicyCodeLookup;
    private readonly Mock<IRateableValueService> _mockRateableValueService;
    private readonly Mock<IRetrospectiveTaxRefresher> _mockRetrospectiveTaxRefresher;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<ILogger<CombinePropertyTaxService>> _mockLogger;
    private readonly CombinePropertyTaxService _service;

    public CombinePropertyTaxServiceTests()
    {
        _mockTransMastRepository = new Mock<IRepository<TransMastEntity>>();
        _mockYearMasterRepository = new Mock<IRepository<YearMasterEntity, int>>();
        _mockPolicyCodeLookup = new Mock<IPolicyCodeLookupService>();
        _mockRateableValueService = new Mock<IRateableValueService>();
        _mockRetrospectiveTaxRefresher = new Mock<IRetrospectiveTaxRefresher>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockLogger = new Mock<ILogger<CombinePropertyTaxService>>();

        _mockPolicyCodeLookup.Setup(p => p.GetIdAsync(PolicyCodes.OldArrears, It.IsAny<CancellationToken>()))
            .ReturnsAsync(OldArrearsPolicyCodeId);

        // The refresher recalculates RV and then runs the retrospective engine; in these tests its RV step is the RV mock,
        // so a test can arrange what the recalculation returns or throws, as it did when the service called RV itself.
        _mockRetrospectiveTaxRefresher
            .Setup(r => r.RefreshAsync(It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<RetrospectiveTaxRefreshOptions?>(), It.IsAny<CancellationToken>()))
            .Returns(async (int id, int? _, RetrospectiveTaxRefreshOptions? options, CancellationToken _) =>
                new RetrospectiveTaxRefreshResult(
                    await _mockRateableValueService.Object.CalculateAndSaveAsync(id, options?.ForceRecalculate ?? false), null));

        _mockUnitOfWork.Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _mockUnitOfWork.Setup(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _mockUnitOfWork.Setup(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _service = new CombinePropertyTaxService(
            _mockTransMastRepository.Object,
            _mockYearMasterRepository.Object,
            _mockPolicyCodeLookup.Object,
            _mockRetrospectiveTaxRefresher.Object,
            _mockUnitOfWork.Object,
            _mockLogger.Object);
    }

    private static TransMastEntity OldArrears(int id, int propertyId, int financeYearId, int taxId, decimal taxAmount, bool isActive = true, bool markedForDeletion = false) => new()
    {
        Id = id,
        PropertyId = propertyId,
        FinanceYearId = financeYearId,
        CalculationType = "RV",
        TaxId = taxId,
        PolicyCodeId = OldArrearsPolicyCodeId,
        TaxAmount = taxAmount,
        CalculationValue = taxAmount,
        IsActive = isActive,
        MarkedForDeletion = markedForDeletion
    };

    #region GetCurrentFinanceYear Tests

    [Fact]
    public void GetCurrentFinanceYear_InApril_ReturnsCurrentYear()
    {
        // The method uses DateTime.Today internally, so we test the logic
        // If current month >= 4 (April), return current year
        var result = _service.GetCurrentFinanceYear();

        // Verify it returns a reasonable year (current or previous)
        var today = DateTime.Today;
        var expectedYear = today.Month >= 4 ? today.Year : today.Year - 1;
        Assert.Equal(expectedYear, result);
    }

    #endregion

    #region ProcessCombinePropertyTaxesAsync Tests

    [Fact]
    public async Task ProcessCombinePropertyTaxesAsync_Success_ReturnsTrue()
    {
        // Arrange
        var sourcePropertyId = 1;
        var combinePropertyIds = new List<int> { 2, 3 };
        var createdBy = 100;

        // Setup empty pending taxes
        _mockTransMastRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TransMastEntity>().BuildMock());

        _mockYearMasterRepository.Setup(r => r.GetQueryable())
            .Returns(new List<YearMasterEntity>
            {
                new() { Id = 1, Year = DateTime.Today.Year, IsActive = true }
            }.BuildMock());

        _mockRateableValueService.Setup(r => r.CalculateAndSaveAsync(sourcePropertyId, It.IsAny<bool>()))
            .ReturnsAsync(new RateableValueResponseDto
            {
                TotalRateableValue = 100000
            });

        // Act
        var result = await _service.ProcessCombinePropertyTaxesAsync(
            sourcePropertyId, combinePropertyIds, createdBy, default);

        // Assert
        Assert.True(result);
        _mockRateableValueService.Verify(r => r.CalculateAndSaveAsync(sourcePropertyId, true), Times.Once);
    }

    [Fact]
    public async Task ProcessCombinePropertyTaxesAsync_WithPendingTaxes_AggregatesAndRecalculates()
    {
        // Arrange
        var sourcePropertyId = 1;
        var combinePropertyIds = new List<int> { 2, 3 };
        var createdBy = 100;

        var pendingTaxes = new List<TransMastEntity>
        {
            OldArrears(1, 2, 1, 1, 1000),
            OldArrears(2, 3, 1, 1, 500)
        };

        _mockTransMastRepository.Setup(r => r.GetQueryable())
            .Returns(pendingTaxes.BuildMock());

        _mockTransMastRepository.Setup(r => r.AddRangeAsync(It.IsAny<IEnumerable<TransMastEntity>>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockYearMasterRepository.Setup(r => r.GetQueryable())
            .Returns(new List<YearMasterEntity>
            {
                new() { Id = 1, Year = DateTime.Today.Year, IsActive = true }
            }.BuildMock());

        _mockRateableValueService.Setup(r => r.CalculateAndSaveAsync(sourcePropertyId, It.IsAny<bool>()))
            .ReturnsAsync(new RateableValueResponseDto
            {
                TotalRateableValue = 150000
            });

        // Act
        var result = await _service.ProcessCombinePropertyTaxesAsync(
            sourcePropertyId, combinePropertyIds, createdBy, default);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task ProcessCombinePropertyTaxesAsync_RecalculationFails_ReturnsFalse()
    {
        // Arrange
        var sourcePropertyId = 1;
        var combinePropertyIds = new List<int> { 2 };
        var createdBy = 100;

        _mockTransMastRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TransMastEntity>().BuildMock());

        _mockYearMasterRepository.Setup(r => r.GetQueryable())
            .Returns(new List<YearMasterEntity>().BuildMock());

        // Recalculation returns null (failure)
        _mockRateableValueService.Setup(r => r.CalculateAndSaveAsync(sourcePropertyId, It.IsAny<bool>()))
            .ReturnsAsync((RateableValueResponseDto?)null);

        // Act
        var result = await _service.ProcessCombinePropertyTaxesAsync(
            sourcePropertyId, combinePropertyIds, createdBy, default);

        // Assert - Should return false if recalculation fails
        Assert.False(result);
    }

    [Fact]
    public async Task ProcessCombinePropertyTaxesAsync_ExceptionThrown_Throws()
    {
        // Arrange
        var sourcePropertyId = 1;
        var combinePropertyIds = new List<int> { 2 };
        var createdBy = 100;

        _mockTransMastRepository.Setup(r => r.GetQueryable())
            .Throws(new InvalidOperationException("Database error"));

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.ProcessCombinePropertyTaxesAsync(sourcePropertyId, combinePropertyIds, createdBy, default));
    }

    #endregion

    #region AggregatePendingTaxesAsync Tests

    [Fact]
    public async Task AggregatePendingTaxesAsync_NoPendingTaxes_ReturnsTrue()
    {
        // Arrange
        var sourcePropertyId = 1;
        var combinePropertyIds = new List<int> { 2, 3 };
        var createdBy = 100;

        _mockTransMastRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TransMastEntity>().BuildMock());

        _mockYearMasterRepository.Setup(r => r.GetQueryable())
            .Returns(new List<YearMasterEntity>
            {
                new() { Id = 1, Year = DateTime.Today.Year, IsActive = true }
            }.BuildMock());

        // Act
        var result = await _service.AggregatePendingTaxesAsync(
            sourcePropertyId, combinePropertyIds, createdBy, default);

        // Assert
        Assert.True(result);
        _mockTransMastRepository.Verify(r => r.AddRangeAsync(
            It.IsAny<IEnumerable<TransMastEntity>>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task AggregatePendingTaxesAsync_WithPendingTaxes_AggregatesAmounts()
    {
        // Arrange
        var sourcePropertyId = 1;
        var combinePropertyIds = new List<int> { 2, 3 };
        var createdBy = 100;

        var combinedPendingTaxes = new List<TransMastEntity>
        {
            OldArrears(1, 2, 1, 1, 1000),
            OldArrears(2, 2, 1, 2, 500),
            OldArrears(3, 3, 1, 1, 750),
            OldArrears(4, 3, 1, 2, 250)
        };

        _mockTransMastRepository.Setup(r => r.GetQueryable())
            .Returns(combinedPendingTaxes.BuildMock());

        _mockYearMasterRepository.Setup(r => r.GetQueryable())
            .Returns(new List<YearMasterEntity>
            {
                new() { Id = 1, Year = DateTime.Today.Year, IsActive = true }
            }.BuildMock());

        var addedRecords = new List<TransMastEntity>();
        _mockTransMastRepository.Setup(r => r.AddRangeAsync(It.IsAny<IEnumerable<TransMastEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<TransMastEntity>, CancellationToken>((records, _) => addedRecords.AddRange(records))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.AggregatePendingTaxesAsync(
            sourcePropertyId, combinePropertyIds, createdBy, default);

        // Assert
        Assert.True(result);

        // Verify new records were created for source property
        Assert.Equal(2, addedRecords.Count); // Two unique TaxId combinations

        // Verify aggregated amounts
        var taxId1Record = addedRecords.FirstOrDefault(r => r.TaxId == 1);
        Assert.NotNull(taxId1Record);
        Assert.Equal(1750, taxId1Record.TaxAmount); // 1000 + 750

        var taxId2Record = addedRecords.FirstOrDefault(r => r.TaxId == 2);
        Assert.NotNull(taxId2Record);
        Assert.Equal(750, taxId2Record.TaxAmount); // 500 + 250

        // Verify all new records have correct properties
        Assert.All(addedRecords, r =>
        {
            Assert.Equal(sourcePropertyId, r.PropertyId);
            Assert.Equal(OldArrearsPolicyCodeId, r.PolicyCodeId);
            Assert.Equal("RV", r.CalculationType);
            Assert.True(r.IsActive);
            Assert.False(r.MarkedForDeletion);
            Assert.Equal(createdBy, r.CreatedBy);
        });
    }

    [Fact]
    public async Task AggregatePendingTaxesAsync_WithExistingSourceRecords_UpdatesExisting()
    {
        // Arrange
        var sourcePropertyId = 1;
        var combinePropertyIds = new List<int> { 2 };
        var createdBy = 100;

        // Combined property has pending tax
        var combinedPendingTaxes = new List<TransMastEntity>
        {
            OldArrears(1, 2, 1, 1, 500)
        };

        // Source property already has pending tax for same year/tax
        var sourcePendingTaxes = new List<TransMastEntity>
        {
            OldArrears(10, 1, 1, 1, 1000)
        };

        var allTaxes = combinedPendingTaxes.Concat(sourcePendingTaxes).ToList();

        _mockTransMastRepository.Setup(r => r.GetQueryable())
            .Returns(allTaxes.BuildMock());

        _mockYearMasterRepository.Setup(r => r.GetQueryable())
            .Returns(new List<YearMasterEntity>
            {
                new() { Id = 1, Year = DateTime.Today.Year, IsActive = true }
            }.BuildMock());

        // Act
        var result = await _service.AggregatePendingTaxesAsync(
            sourcePropertyId, combinePropertyIds, createdBy, default);

        // Assert
        Assert.True(result);

        // Verify existing source record was updated (not new record created)
        var sourceRecord = sourcePendingTaxes.First();
        Assert.Equal(1500, sourceRecord.TaxAmount); // 1000 + 500
        Assert.Equal(createdBy, sourceRecord.UpdatedBy);
    }

    [Fact]
    public async Task AggregatePendingTaxesAsync_ZeroesOutCombinedPropertyRecords()
    {
        // Arrange
        var sourcePropertyId = 1;
        var combinePropertyIds = new List<int> { 2 };
        var createdBy = 100;

        var combinedPendingTaxes = new List<TransMastEntity>
        {
            OldArrears(1, 2, 1, 1, 1000)
        };

        _mockTransMastRepository.Setup(r => r.GetQueryable())
            .Returns(combinedPendingTaxes.BuildMock());

        _mockYearMasterRepository.Setup(r => r.GetQueryable())
            .Returns(new List<YearMasterEntity>
            {
                new() { Id = 1, Year = DateTime.Today.Year, IsActive = true }
            }.BuildMock());

        _mockTransMastRepository.Setup(r => r.AddRangeAsync(It.IsAny<IEnumerable<TransMastEntity>>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.AggregatePendingTaxesAsync(
            sourcePropertyId, combinePropertyIds, createdBy, default);

        // Assert
        Assert.True(result);

        // Verify combined property's pending tax was zeroed out
        var combinedRecord = combinedPendingTaxes.First();
        Assert.Equal(0, combinedRecord.TaxAmount);
        Assert.True(combinedRecord.IsActive); // Should remain active
        Assert.Equal(createdBy, combinedRecord.UpdatedBy);
    }

    [Fact]
    public async Task AggregatePendingTaxesAsync_SkipsMarkedForDeletion()
    {
        // Arrange
        var sourcePropertyId = 1;
        var combinePropertyIds = new List<int> { 2 };
        var createdBy = 100;

        var pendingTaxes = new List<TransMastEntity>
        {
            OldArrears(1, 2, 1, 1, 1000, markedForDeletion: true), // Should be skipped
            OldArrears(2, 2, 1, 2, 500)
        };

        _mockTransMastRepository.Setup(r => r.GetQueryable())
            .Returns(pendingTaxes.BuildMock());

        _mockYearMasterRepository.Setup(r => r.GetQueryable())
            .Returns(new List<YearMasterEntity>
            {
                new() { Id = 1, Year = DateTime.Today.Year, IsActive = true }
            }.BuildMock());

        var addedRecords = new List<TransMastEntity>();
        _mockTransMastRepository.Setup(r => r.AddRangeAsync(It.IsAny<IEnumerable<TransMastEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<TransMastEntity>, CancellationToken>((records, _) => addedRecords.AddRange(records))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.AggregatePendingTaxesAsync(
            sourcePropertyId, combinePropertyIds, createdBy, default);

        // Assert
        Assert.True(result);
        Assert.Single(addedRecords); // Only TaxId=2 should be added
        Assert.Equal(2, addedRecords.First().TaxId);
        Assert.Equal(500, addedRecords.First().TaxAmount);
    }

    [Fact]
    public async Task AggregatePendingTaxesAsync_IgnoresOtherPolicyCodedRows()
    {
        // Arrange -- a TransMast row for the combined property under a DIFFERENT policy (e.g. a
        // retro-demand row) must not be swept into the OLD_ARREARS aggregation.
        var sourcePropertyId = 1;
        var combinePropertyIds = new List<int> { 2 };
        var createdBy = 100;

        var rows = new List<TransMastEntity>
        {
            OldArrears(1, 2, 1, 1, 1000),
            new() { Id = 2, PropertyId = 2, FinanceYearId = 1, CalculationType = "RV", TaxId = 2, PolicyCodeId = 999, TaxAmount = 5000, IsActive = true, MarkedForDeletion = false }
        };

        _mockTransMastRepository.Setup(r => r.GetQueryable())
            .Returns(rows.BuildMock());

        _mockYearMasterRepository.Setup(r => r.GetQueryable())
            .Returns(new List<YearMasterEntity>
            {
                new() { Id = 1, Year = DateTime.Today.Year, IsActive = true }
            }.BuildMock());

        var addedRecords = new List<TransMastEntity>();
        _mockTransMastRepository.Setup(r => r.AddRangeAsync(It.IsAny<IEnumerable<TransMastEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<TransMastEntity>, CancellationToken>((records, _) => addedRecords.AddRange(records))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.AggregatePendingTaxesAsync(
            sourcePropertyId, combinePropertyIds, createdBy, default);

        // Assert
        Assert.True(result);
        Assert.Single(addedRecords); // Only the OLD_ARREARS row (TaxId=1) should be aggregated
        Assert.Equal(1, addedRecords.First().TaxId);
        Assert.Equal(1000, addedRecords.First().TaxAmount);
        // The unrelated policy-999 row must be untouched.
        var untouched = rows.Single(r => r.PolicyCodeId == 999);
        Assert.Equal(5000, untouched.TaxAmount);
    }

    [Fact]
    public async Task AggregatePendingTaxesAsync_WithPastFinanceYearOtherPolicyCode_AggregatesPendingTaxes()
    {
        // Arrange
        var sourcePropertyId = 1;
        var combinePropertyIds = new List<int> { 2 };
        var createdBy = 100;

        var pastYearId = 3;
        var currentYearId = 3002;

        var rows = new List<TransMastEntity>
        {
            // Combined property past year tax with PolicyCodeId = 1 (NETTAX)
            new() { Id = 1, PropertyId = 2, FinanceYearId = pastYearId, CalculationType = "RV", TaxId = 21, PolicyCodeId = 1, TaxAmount = 3316, IsActive = false, MarkedForDeletion = false },
            // Combined property current year tax with PolicyCodeId = 1 (should NOT be aggregated as pending tax)
            new() { Id = 2, PropertyId = 2, FinanceYearId = currentYearId, CalculationType = "RV", TaxId = 21, PolicyCodeId = 1, TaxAmount = 3335, IsActive = false, MarkedForDeletion = false },
            // Source property past year tax with PolicyCodeId = 1
            new() { Id = 3, PropertyId = 1, FinanceYearId = pastYearId, CalculationType = "RV", TaxId = 21, PolicyCodeId = 1, TaxAmount = 11709, IsActive = true, MarkedForDeletion = false }
        };

        _mockTransMastRepository.Setup(r => r.GetQueryable())
            .Returns(rows.BuildMock());

        _mockYearMasterRepository.Setup(r => r.GetQueryable())
            .Returns(new List<YearMasterEntity>
            {
                new() { Id = pastYearId, Year = 2023, IsActive = true },
                new() { Id = currentYearId, Year = DateTime.Today.Year, IsActive = true }
            }.BuildMock());

        // Act
        var result = await _service.AggregatePendingTaxesAsync(
            sourcePropertyId, combinePropertyIds, createdBy, default);

        // Assert
        Assert.True(result);

        // Verify source property record was updated with combined amount (11709 + 3316 = 15025)
        var sourceRecord = rows.First(r => r.PropertyId == sourcePropertyId && r.FinanceYearId == pastYearId);
        Assert.Equal(15025, sourceRecord.TaxAmount);

        // Verify combined property's past year record was zeroed out and reactivated
        var combinedPastRecord = rows.First(r => r.PropertyId == 2 && r.FinanceYearId == pastYearId);
        Assert.Equal(0, combinedPastRecord.TaxAmount);
        Assert.True(combinedPastRecord.IsActive);

        // Verify combined property's current year record was NOT modified by pending tax aggregation
        var combinedCurrentRecord = rows.First(r => r.PropertyId == 2 && r.FinanceYearId == currentYearId);
        Assert.Equal(3335, combinedCurrentRecord.TaxAmount);
        Assert.False(combinedCurrentRecord.IsActive);
    }

    [Fact]
    public async Task AggregatePendingTaxesAsync_MultipleYears_AggregatesPerYear()
    {
        // Arrange
        var sourcePropertyId = 1;
        var combinePropertyIds = new List<int> { 2 };
        var createdBy = 100;

        var pendingTaxes = new List<TransMastEntity>
        {
            OldArrears(1, 2, 1, 1, 1000),
            OldArrears(2, 2, 2, 1, 2000)
        };

        _mockTransMastRepository.Setup(r => r.GetQueryable())
            .Returns(pendingTaxes.BuildMock());

        _mockYearMasterRepository.Setup(r => r.GetQueryable())
            .Returns(new List<YearMasterEntity>
            {
                new() { Id = 1, Year = 2024, IsActive = true },
                new() { Id = 2, Year = 2025, IsActive = true }
            }.BuildMock());

        var addedRecords = new List<TransMastEntity>();
        _mockTransMastRepository.Setup(r => r.AddRangeAsync(It.IsAny<IEnumerable<TransMastEntity>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<TransMastEntity>, CancellationToken>((records, _) => addedRecords.AddRange(records))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.AggregatePendingTaxesAsync(
            sourcePropertyId, combinePropertyIds, createdBy, default);

        // Assert
        Assert.True(result);
        Assert.Equal(2, addedRecords.Count); // One record per year

        var year1Record = addedRecords.First(r => r.FinanceYearId == 1);
        Assert.Equal(1000, year1Record.TaxAmount);

        var year2Record = addedRecords.First(r => r.FinanceYearId == 2);
        Assert.Equal(2000, year2Record.TaxAmount);
    }

    [Fact]
    public async Task AggregatePendingTaxesAsync_Exception_Throws()
    {
        // Arrange
        var sourcePropertyId = 1;
        var combinePropertyIds = new List<int> { 2 };
        var createdBy = 100;

        _mockYearMasterRepository.Setup(r => r.GetQueryable())
            .Returns(new List<YearMasterEntity>().BuildMock());

        _mockTransMastRepository.Setup(r => r.GetQueryable())
            .Throws(new InvalidOperationException("Database error"));

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.AggregatePendingTaxesAsync(sourcePropertyId, combinePropertyIds, createdBy, default));
    }

    #endregion

    #region RecalculateCurrentYearTaxAsync Tests

    [Fact]
    public async Task RecalculateCurrentYearTaxAsync_Success_ReturnsTrue()
    {
        // Arrange
        var sourcePropertyId = 1;

        _mockRateableValueService.Setup(r => r.CalculateAndSaveAsync(sourcePropertyId, It.IsAny<bool>()))
            .ReturnsAsync(new RateableValueResponseDto
            {
                TotalRateableValue = 100000
            });

        // Act
        var result = await _service.RecalculateCurrentYearTaxAsync(sourcePropertyId, null, default);

        // Assert
        Assert.True(result);
        _mockRateableValueService.Verify(r => r.CalculateAndSaveAsync(sourcePropertyId, true), Times.Once);
    }

    [Fact]
    public async Task RecalculateCurrentYearTaxAsync_RefreshesTheSourceProperty_AsTheGivenUser()
    {
        // Arrange
        var sourcePropertyId = 1;
        _mockRateableValueService.Setup(r => r.CalculateAndSaveAsync(sourcePropertyId, It.IsAny<bool>()))
            .ReturnsAsync(new RateableValueResponseDto { TotalRateableValue = 100000 });

        // Act
        var result = await _service.RecalculateCurrentYearTaxAsync(sourcePropertyId, 100, default);

        // Assert: the recalculation replaces a certificate's current-year TransMast row with NETTAX, so the refresher
        // (RV, then the engine, under the property's lock) is the only way to recalculate
        Assert.True(result);
        _mockRetrospectiveTaxRefresher.Verify(
            e => e.RefreshAsync(
                sourcePropertyId, 100,
                It.Is<RetrospectiveTaxRefreshOptions?>(o => o != null && o.ForceRecalculate),
                default),
            Times.Once);
    }

    [Fact]
    public async Task RecalculateCurrentYearTaxAsync_WhenTheEngineFails_ReturnsFalse_NotSuccess()
    {
        // Arrange: the recalculation is saved, but the engine that puts the certificate's demand back failed
        var sourcePropertyId = 1;
        _mockRetrospectiveTaxRefresher
            .Setup(e => e.RefreshAsync(sourcePropertyId, 100, It.IsAny<RetrospectiveTaxRefreshOptions?>(), default))
            .ThrowsAsync(new RetrospectiveRefreshFailedException(sourcePropertyId, "ab12cd34", null, new InvalidOperationException("boom")));

        // Act
        var result = await _service.RecalculateCurrentYearTaxAsync(sourcePropertyId, 100, default);

        // Assert: a ledger that is known to need repair is not reported as a recalculation that worked
        Assert.False(result);
    }

    [Fact]
    public async Task ProcessCombinePropertyTaxesAsync_WhenTheEngineFails_ReportsTheFailure()
    {
        // Arrange
        var sourcePropertyId = 1;
        _mockTransMastRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TransMastEntity>().BuildMock());
        _mockRetrospectiveTaxRefresher
            .Setup(e => e.RefreshAsync(sourcePropertyId, 100, It.IsAny<RetrospectiveTaxRefreshOptions?>(), default))
            .ThrowsAsync(new RetrospectiveRefreshFailedException(sourcePropertyId, "ab12cd34", null, new InvalidOperationException("boom")));

        // Act
        var result = await _service.ProcessCombinePropertyTaxesAsync(sourcePropertyId, new List<int> { 2, 3 }, 100, default);

        // Assert: the combine does not report success for a property whose ledger it knows is not right
        Assert.False(result);
    }

    [Fact]
    public async Task RecalculateCurrentYearTaxAsync_WhenTheRefreshFails_ReturnsFalse()
    {
        // Arrange: the RV recalculation failed, or the property's lock was not granted in time
        var sourcePropertyId = 1;
        _mockRateableValueService.Setup(r => r.CalculateAndSaveAsync(sourcePropertyId, It.IsAny<bool>()))
            .ThrowsAsync(new InvalidOperationException("Calculation error"));

        // Act
        var result = await _service.RecalculateCurrentYearTaxAsync(sourcePropertyId, 100, default);

        // Assert: reported as a failed recalculation, the combine goes on (it never threw here)
        Assert.False(result);
    }

    [Fact]
    public async Task ProcessCombinePropertyTaxesAsync_RefreshesTheSourceProperty_AsTheCreator()
    {
        // Arrange
        var sourcePropertyId = 1;

        _mockTransMastRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TransMastEntity>().BuildMock());
        _mockRateableValueService.Setup(r => r.CalculateAndSaveAsync(sourcePropertyId, It.IsAny<bool>()))
            .ReturnsAsync(new RateableValueResponseDto { TotalRateableValue = 100000 });

        // Act
        var result = await _service.ProcessCombinePropertyTaxesAsync(sourcePropertyId, new List<int> { 2, 3 }, 100, default);

        // Assert
        Assert.True(result);
        _mockRetrospectiveTaxRefresher.Verify(
            e => e.RefreshAsync(sourcePropertyId, 100, It.IsAny<RetrospectiveTaxRefreshOptions?>(), default), Times.Once);
    }

    [Fact]
    public async Task RecalculateCurrentYearTaxAsync_NullResult_ReturnsFalse()
    {
        // Arrange
        var sourcePropertyId = 1;

        _mockRateableValueService.Setup(r => r.CalculateAndSaveAsync(sourcePropertyId, It.IsAny<bool>()))
            .ReturnsAsync((RateableValueResponseDto?)null);

        // Act
        var result = await _service.RecalculateCurrentYearTaxAsync(sourcePropertyId, null, default);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task RecalculateCurrentYearTaxAsync_Exception_ReturnsFalse()
    {
        // Arrange
        var sourcePropertyId = 1;

        _mockRateableValueService.Setup(r => r.CalculateAndSaveAsync(sourcePropertyId, It.IsAny<bool>()))
            .ThrowsAsync(new InvalidOperationException("Calculation error"));

        // Act
        var result = await _service.RecalculateCurrentYearTaxAsync(sourcePropertyId, null, default);

        // Assert - Should return false instead of throwing
        Assert.False(result);
    }

    [Fact]
    public async Task RecalculateCurrentYearTaxAsync_WithValidResult_LogsCorrectValues()
    {
        // Arrange
        var sourcePropertyId = 1;
        var expectedResult = new RateableValueResponseDto
        {
            TotalRateableValue = 150000
        };

        _mockRateableValueService.Setup(r => r.CalculateAndSaveAsync(sourcePropertyId, It.IsAny<bool>()))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _service.RecalculateCurrentYearTaxAsync(sourcePropertyId, null, default);

        // Assert
        Assert.True(result);
        _mockRateableValueService.Verify(r => r.CalculateAndSaveAsync(sourcePropertyId, true), Times.Once);
    }

    #endregion

    #region Integration Scenarios

    [Fact]
    public async Task ProcessCombinePropertyTaxesAsync_FullFlow_CompletesSuccessfully()
    {
        // Arrange - Full integration scenario
        var sourcePropertyId = 1;
        var combinePropertyIds = new List<int> { 2, 3, 4 };
        var createdBy = 100;

        // Setup pending taxes from multiple properties
        var pendingTaxes = new List<TransMastEntity>
        {
            // Property 2 - Year 1
            OldArrears(1, 2, 1, 1, 1000),
            OldArrears(2, 2, 1, 2, 500),
            // Property 3 - Year 1
            OldArrears(3, 3, 1, 1, 750),
            OldArrears(4, 3, 1, 2, 250),
            // Property 4 - Year 2
            OldArrears(5, 4, 2, 1, 2000)
        };

        _mockTransMastRepository.Setup(r => r.GetQueryable())
            .Returns(pendingTaxes.BuildMock());

        _mockYearMasterRepository.Setup(r => r.GetQueryable())
            .Returns(new List<YearMasterEntity>
            {
                new() { Id = 1, Year = 2024, IsActive = true },
                new() { Id = 2, Year = 2025, IsActive = true }
            }.BuildMock());

        _mockTransMastRepository.Setup(r => r.AddRangeAsync(It.IsAny<IEnumerable<TransMastEntity>>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockRateableValueService.Setup(r => r.CalculateAndSaveAsync(sourcePropertyId, It.IsAny<bool>()))
            .ReturnsAsync(new RateableValueResponseDto
            {
                TotalRateableValue = 250000
            });

        // Act
        var result = await _service.ProcessCombinePropertyTaxesAsync(
            sourcePropertyId, combinePropertyIds, createdBy, default);

        // Assert
        Assert.True(result);

        // Verify all combined property records were zeroed out
        Assert.All(pendingTaxes, tax =>
        {
            Assert.Equal(0, tax.TaxAmount);
            Assert.True(tax.IsActive);
        });

        // Verify recalculation was called
        _mockRateableValueService.Verify(r => r.CalculateAndSaveAsync(sourcePropertyId, true), Times.Once);
    }

    [Fact]
    public async Task ProcessCombinePropertyTaxesAsync_EmptyPropertyList_HandlesGracefully()
    {
        // Arrange
        var sourcePropertyId = 1;
        var combinePropertyIds = new List<int>(); // Empty list
        var createdBy = 100;

        _mockTransMastRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TransMastEntity>().BuildMock());

        _mockYearMasterRepository.Setup(r => r.GetQueryable())
            .Returns(new List<YearMasterEntity>().BuildMock());

        _mockRateableValueService.Setup(r => r.CalculateAndSaveAsync(sourcePropertyId, It.IsAny<bool>()))
            .ReturnsAsync(new RateableValueResponseDto());

        // Act
        var result = await _service.ProcessCombinePropertyTaxesAsync(
            sourcePropertyId, combinePropertyIds, createdBy, default);

        // Assert
        Assert.True(result);
    }

    #endregion
}
