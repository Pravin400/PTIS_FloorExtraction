using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.WaterBill.Master.MeterTestStatusMaster;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services.WaterBill.Master.MeterTestStatusMaster;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.WaterBill.Master.MeterTestStatusMaster;

public class MeterTestStatusMasterServiceTests
{
    private readonly Mock<IRepository<MeterTestStatusMasterEntity, int>> _mockRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IReferenceValidationService> _mockReferenceValidator;
    private readonly IMapper _mapper;
    private readonly MeterTestStatusMasterService _service;

    public MeterTestStatusMasterServiceTests()
    {
        _mockRepository = new Mock<IRepository<MeterTestStatusMasterEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockReferenceValidator = new Mock<IReferenceValidationService>();

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        SetupExistingRows();

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.CreateMap<MeterTestStatusMasterEntity, MeterTestStatusMasterDto>();
            cfg.CreateMap<CreateMeterTestStatusMasterDto, MeterTestStatusMasterEntity>();
            cfg.CreateMap<UpdateMeterTestStatusMasterDto, MeterTestStatusMasterEntity>();
        }, NullLoggerFactory.Instance);

        _mapper = mapperConfig.CreateMapper();

        _service = new MeterTestStatusMasterService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mapper,
            _mockReferenceValidator.Object);
    }

    private void SetupExistingRows(params MeterTestStatusMasterEntity[] rows)
    {
        var mockQuery = rows.ToList().BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery);
    }

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsDto()
    {
        var entity = new MeterTestStatusMasterEntity { Id = 1, MeterTestStatusCode = "MTS01", MeterTestStatus = "Passed", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await _service.GetByIdAsync(1, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("MTS01", result.MeterTestStatusCode);
        Assert.Equal("Passed", result.MeterTestStatus);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        _mockRepository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync((MeterTestStatusMasterEntity?)null);

        var result = await _service.GetByIdAsync(999, CancellationToken.None);

        Assert.Null(result);
    }

    #endregion

    #region GetAllAsync Tests

    [Fact]
    public async Task GetAllAsync_ReturnsAllEntitiesWithPagination()
    {
        SetupExistingRows(
            new() { Id = 1, MeterTestStatusCode = "MTS01", MeterTestStatus = "Passed", IsActive = true },
            new() { Id = 2, MeterTestStatusCode = "MTS02", MeterTestStatus = "Failed", IsActive = true });

        var queryParams = new MeterTestStatusMasterQueryParameters { PageNumber = 1, PageSize = 10 };

        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        Assert.Equal(2, result.TotalCount);
    }

    [Theory]
    [InlineData("Passed", 1)]
    [InlineData("MTS02", 1)]
    [InlineData("NonExistent", 0)]
    public async Task GetAllAsync_SearchTerm_FiltersCorrectly(string searchTerm, int expectedCount)
    {
        SetupExistingRows(
            new() { Id = 1, MeterTestStatusCode = "MTS01", MeterTestStatus = "Passed", IsActive = true },
            new() { Id = 2, MeterTestStatusCode = "MTS02", MeterTestStatus = "Failed", IsActive = true });

        var queryParams = new MeterTestStatusMasterQueryParameters { SearchTerm = searchTerm, PageNumber = 1, PageSize = 10 };

        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        Assert.Equal(expectedCount, result.TotalCount);
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_ValidDto_CreatesAndReturnsDto()
    {
        var createDto = new CreateMeterTestStatusMasterDto { MeterTestStatusCode = "MTS01", MeterTestStatus = "Passed" };

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<MeterTestStatusMasterEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((MeterTestStatusMasterEntity e, CancellationToken _) =>
            {
                e.Id = 1;
                return e;
            });

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("MTS01", result.MeterTestStatusCode);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<MeterTestStatusMasterEntity>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_DuplicateCode_ThrowsValidationException()
    {
        SetupExistingRows(new MeterTestStatusMasterEntity { Id = 1, MeterTestStatusCode = "MTS01", MeterTestStatus = "Passed", IsActive = true });
        var createDto = new CreateMeterTestStatusMasterDto { MeterTestStatusCode = "mts01", MeterTestStatus = "Failed" };

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto, CancellationToken.None));
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<MeterTestStatusMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_ExistingEntity_UpdatesSuccessfully()
    {
        var existingEntity = new MeterTestStatusMasterEntity { Id = 1, MeterTestStatusCode = "MTS01", MeterTestStatus = "Passed", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<MeterTestStatusMasterEntity>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var updateDto = new UpdateMeterTestStatusMasterDto { MeterTestStatusCode = "MTS01", MeterTestStatus = "Passed Updated", IsActive = true };

        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        Assert.NotNull(result);
        _mockRepository.Verify(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WithDuplicateCode_ThrowsValidationException()
    {
        SetupExistingRows(
            new MeterTestStatusMasterEntity { Id = 1, MeterTestStatusCode = "MTS01", MeterTestStatus = "Passed", IsActive = true },
            new MeterTestStatusMasterEntity { Id = 2, MeterTestStatusCode = "MTS02", MeterTestStatus = "Failed", IsActive = true });

        _mockRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new MeterTestStatusMasterEntity { Id = 2, MeterTestStatusCode = "MTS02", MeterTestStatus = "Failed", IsActive = true });

        var updateDto = new UpdateMeterTestStatusMasterDto { MeterTestStatusCode = "MTS01", MeterTestStatus = "Failed", IsActive = true };

        await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(2, updateDto, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_DeactivatingWithReferences_ThrowsValidationException()
    {
        var updateDto = new UpdateMeterTestStatusMasterDto { MeterTestStatusCode = "MTS01", MeterTestStatus = "Passed", IsActive = false };
        var existingEntity = new MeterTestStatusMasterEntity { Id = 1, MeterTestStatusCode = "MTS01", MeterTestStatus = "Passed", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockReferenceValidator.Setup(r => r.ValidateReferencesAsync<MeterTestStatusMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot deactivate: referenced elsewhere"));

        await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto, CancellationToken.None));
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_ExistingEntity_DeletesSuccessfully()
    {
        var existingEntity = new MeterTestStatusMasterEntity { Id = 1, MeterTestStatusCode = "MTS01", MeterTestStatus = "Passed", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.DeleteAsync(It.IsAny<MeterTestStatusMasterEntity>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _mockReferenceValidator.Setup(r => r.ValidateReferencesAsync<MeterTestStatusMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        var result = await _service.DeleteAsync(1, CancellationToken.None);

        Assert.True(result);
        _mockRepository.Verify(r => r.DeleteAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WithReferences_ThrowsValidationException()
    {
        var existingEntity = new MeterTestStatusMasterEntity { Id = 1, MeterTestStatusCode = "MTS01", MeterTestStatus = "Passed", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockReferenceValidator.Setup(r => r.ValidateReferencesAsync<MeterTestStatusMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot delete: referenced elsewhere"));

        await Assert.ThrowsAsync<ValidationException>(() => _service.DeleteAsync(1, CancellationToken.None));
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<MeterTestStatusMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion
}
