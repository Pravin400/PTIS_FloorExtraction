using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.WaterBill.Master;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services.WaterBill.Master;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.WaterBill.Master;

public class BillingFrequencyMasterServiceTests
{
    private readonly Mock<IRepository<BillingFrequencyMasterEntity, int>> _mockRepository;
    private readonly Mock<IRepository<BillingPeriodEntity, int>> _mockBillingPeriodRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IReferenceValidationService> _mockReferenceValidator;
    private readonly IMapper _mapper;
    private readonly BillingFrequencyMasterService _service;

    public BillingFrequencyMasterServiceTests()
    {
        _mockRepository = new Mock<IRepository<BillingFrequencyMasterEntity, int>>();
        _mockBillingPeriodRepository = new Mock<IRepository<BillingPeriodEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockReferenceValidator = new Mock<IReferenceValidationService>();

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.CreateMap<BillingFrequencyMasterEntity, BillingFrequencyMasterDto>();
            cfg.CreateMap<CreateBillingFrequencyMasterDto, BillingFrequencyMasterEntity>();
            cfg.CreateMap<UpdateBillingFrequencyMasterDto, BillingFrequencyMasterEntity>();
        }, NullLoggerFactory.Instance);

        _mapper = mapperConfig.CreateMapper();

        var emptyFreq = new List<BillingFrequencyMasterEntity>().BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(emptyFreq);

        var emptyBp = new List<BillingPeriodEntity>().BuildMock();
        _mockBillingPeriodRepository.Setup(r => r.GetQueryable()).Returns(emptyBp);

        _service = new BillingFrequencyMasterService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mapper,
            _mockReferenceValidator.Object,
            _mockBillingPeriodRepository.Object);
    }

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsDto()
    {
        var entity = new BillingFrequencyMasterEntity
        {
            Id = 1,
            BillingFrequencyCode = "MON",
            BillingFrequency = "Monthly",
            PeriodsPerYear = 12,
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        var result = await _service.GetByIdAsync(1, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("MON", result.BillingFrequencyCode);
        Assert.Equal("Monthly", result.BillingFrequency);
        Assert.Equal(12, result.PeriodsPerYear);
        Assert.True(result.IsActive);
        _mockRepository.Verify(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        _mockRepository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((BillingFrequencyMasterEntity?)null);

        var result = await _service.GetByIdAsync(999, CancellationToken.None);

        Assert.Null(result);
    }

    #endregion

    #region GetAllAsync Tests

    [Fact]
    public async Task GetAllAsync_ReturnsAllEntitiesWithPagination()
    {
        var entities = new List<BillingFrequencyMasterEntity>
        {
            new() { Id = 1, BillingFrequencyCode = "MON", BillingFrequency = "Monthly", PeriodsPerYear = 12, IsActive = true },
            new() { Id = 2, BillingFrequencyCode = "QTR", BillingFrequency = "Quarterly", PeriodsPerYear = 4, IsActive = true },
            new() { Id = 3, BillingFrequencyCode = "HYR", BillingFrequency = "Half Yearly", PeriodsPerYear = 2, IsActive = true },
            new() { Id = 4, BillingFrequencyCode = "YRL", BillingFrequency = "Yearly", PeriodsPerYear = 1, IsActive = true }
        };

        var mockQuery = entities.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery);

        var queryParams = new BillingFrequencyMasterQueryParameters
        {
            PageNumber = 1,
            PageSize = 10
        };

        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(4, result.TotalCount);
        Assert.Equal(4, result.Items.Count());
    }

    [Theory]
    [InlineData("Monthly", 1)]
    [InlineData("QTR", 1)]
    [InlineData("Year", 2)] // Half Yearly & Yearly
    [InlineData("NonExistent", 0)]
    public async Task GetAllAsync_SearchTerm_FiltersCorrectly(string searchTerm, int expectedCount)
    {
        var entities = new List<BillingFrequencyMasterEntity>
        {
            new() { Id = 1, BillingFrequencyCode = "MON", BillingFrequency = "Monthly", PeriodsPerYear = 12 },
            new() { Id = 2, BillingFrequencyCode = "QTR", BillingFrequency = "Quarterly", PeriodsPerYear = 4 },
            new() { Id = 3, BillingFrequencyCode = "HYR", BillingFrequency = "Half Yearly", PeriodsPerYear = 2 },
            new() { Id = 4, BillingFrequencyCode = "YRL", BillingFrequency = "Yearly", PeriodsPerYear = 1 }
        };

        var mockQuery = entities.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery);

        var queryParams = new BillingFrequencyMasterQueryParameters
        {
            SearchTerm = searchTerm,
            PageNumber = 1,
            PageSize = 10
        };

        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(expectedCount, result.TotalCount);
    }

    [Fact]
    public async Task GetAllAsync_SortByPeriodsPerYearDesc_SortsCorrectly()
    {
        var entities = new List<BillingFrequencyMasterEntity>
        {
            new() { Id = 1, BillingFrequencyCode = "MON", BillingFrequency = "Monthly", PeriodsPerYear = 12 },
            new() { Id = 2, BillingFrequencyCode = "QTR", BillingFrequency = "Quarterly", PeriodsPerYear = 4 },
            new() { Id = 3, BillingFrequencyCode = "HYR", BillingFrequency = "Half Yearly", PeriodsPerYear = 2 }
        };

        var mockQuery = entities.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery);

        var queryParams = new BillingFrequencyMasterQueryParameters
        {
            SortBy = "periodsperyear",
            SortOrder = "desc",
            PageNumber = 1,
            PageSize = 10
        };

        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(12, result.Items.First().PeriodsPerYear);
        Assert.Equal(2, result.Items.Last().PeriodsPerYear);
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_ValidDto_CreatesAndReturnsDto()
    {
        var createDto = new CreateBillingFrequencyMasterDto
        {
            BillingFrequencyCode = "BIM",
            BillingFrequency = "Bi-Monthly",
            PeriodsPerYear = 6,
            IsActive = true
        };

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<BillingFrequencyMasterEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((BillingFrequencyMasterEntity entity, CancellationToken _) =>
            {
                entity.Id = 5;
                return entity;
            });

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(5, result.Id);
        Assert.Equal("BIM", result.BillingFrequencyCode);
        Assert.Equal("Bi-Monthly", result.BillingFrequency);
        Assert.Equal(6, result.PeriodsPerYear);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<BillingFrequencyMasterEntity>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_InvalidPeriodsPerYear_ThrowsValidationException()
    {
        var createDto = new CreateBillingFrequencyMasterDto
        {
            BillingFrequencyCode = "INV",
            BillingFrequency = "Invalid",
            PeriodsPerYear = 0, // Invalid: < 1
            IsActive = true
        };

        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(
            () => _service.CreateAsync(createDto, CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_DuplicateCode_ThrowsValidationException()
    {
        var existingFreq = new List<BillingFrequencyMasterEntity>
        {
            new() { Id = 1, BillingFrequencyCode = "MON", BillingFrequency = "Monthly", PeriodsPerYear = 12 }
        }.BuildMock();

        _mockRepository.Setup(r => r.GetQueryable()).Returns(existingFreq);

        var createDto = new CreateBillingFrequencyMasterDto
        {
            BillingFrequencyCode = "mon", // Duplicate
            BillingFrequency = "Monthly New",
            PeriodsPerYear = 12,
            IsActive = true
        };

        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(
            () => _service.CreateAsync(createDto, CancellationToken.None));
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_ExistingEntity_UpdatesSuccessfully()
    {
        var updateDto = new UpdateBillingFrequencyMasterDto
        {
            BillingFrequencyCode = "MON",
            BillingFrequency = "Monthly Updated",
            PeriodsPerYear = 12,
            IsActive = true
        };

        var existingEntity = new BillingFrequencyMasterEntity
        {
            Id = 1,
            BillingFrequencyCode = "MON",
            BillingFrequency = "Monthly",
            PeriodsPerYear = 12,
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<BillingFrequencyMasterEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        Assert.NotNull(result);
        _mockRepository.Verify(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_DeactivatingWithReferences_ThrowsValidationException()
    {
        var updateDto = new UpdateBillingFrequencyMasterDto { BillingFrequencyCode = "MON", BillingFrequency = "Monthly", IsActive = false };
        var existingEntity = new BillingFrequencyMasterEntity { Id = 1, BillingFrequencyCode = "MON", BillingFrequency = "Monthly", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockReferenceValidator.Setup(r => r.ValidateReferencesAsync<BillingFrequencyMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot deactivate: referenced by Billing Period"));

        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(
            () => _service.UpdateAsync(1, updateDto, CancellationToken.None));
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_ExistingEntity_DeletesSuccessfully()
    {
        var existingEntity = new BillingFrequencyMasterEntity { Id = 1, BillingFrequencyCode = "MON", BillingFrequency = "Monthly", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.DeleteAsync(It.IsAny<BillingFrequencyMasterEntity>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _mockReferenceValidator.Setup(r => r.ValidateReferencesAsync<BillingFrequencyMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        var result = await _service.DeleteAsync(1, CancellationToken.None);

        Assert.True(result);
        _mockRepository.Verify(r => r.DeleteAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WithReferences_ThrowsValidationException()
    {
        var existingEntity = new BillingFrequencyMasterEntity { Id = 1, BillingFrequencyCode = "MON", BillingFrequency = "Monthly", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockReferenceValidator.Setup(r => r.ValidateReferencesAsync<BillingFrequencyMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot delete: referenced by Billing Period"));

        await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(
            () => _service.DeleteAsync(1, CancellationToken.None));

        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<BillingFrequencyMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion
}
