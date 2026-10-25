using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.WaterBill.Master.MeterTypeMaster;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services.WaterBill.Master.MeterTypeMaster;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.WaterBill.Master.MeterTypeMaster;

public class MeterTypeMasterServiceTests
{
    private readonly Mock<IRepository<MeterTypeMasterEntity, int>> _mockRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IReferenceValidationService> _mockReferenceValidator;
    private readonly IMapper _mapper;
    private readonly MeterTypeMasterService _service;

    public MeterTypeMasterServiceTests()
    {
        _mockRepository = new Mock<IRepository<MeterTypeMasterEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockReferenceValidator = new Mock<IReferenceValidationService>();

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        SetupExistingRows();

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.CreateMap<MeterTypeMasterEntity, MeterTypeMasterDto>();
            cfg.CreateMap<CreateMeterTypeMasterDto, MeterTypeMasterEntity>();
            cfg.CreateMap<UpdateMeterTypeMasterDto, MeterTypeMasterEntity>();
        }, NullLoggerFactory.Instance);

        _mapper = mapperConfig.CreateMapper();

        _service = new MeterTypeMasterService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mapper,
            _mockReferenceValidator.Object);
    }

    private void SetupExistingRows(params MeterTypeMasterEntity[] rows)
    {
        var mockQuery = rows.ToList().BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery);
    }

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsDto()
    {
        var entity = new MeterTypeMasterEntity
        {
            Id = 1,
            MeterTypeCode = "MT01",
            MeterType = "Digital AMR",
            Description = "Automatic Meter Reading",
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await _service.GetByIdAsync(1, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("MT01", result.MeterTypeCode);
        Assert.Equal("Digital AMR", result.MeterType);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        _mockRepository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync((MeterTypeMasterEntity?)null);

        var result = await _service.GetByIdAsync(999, CancellationToken.None);

        Assert.Null(result);
    }

    #endregion

    #region GetAllAsync Tests

    [Fact]
    public async Task GetAllAsync_ReturnsAllEntitiesWithPagination()
    {
        SetupExistingRows(
            new() { Id = 1, MeterTypeCode = "MT01", MeterType = "Digital AMR", IsActive = true },
            new() { Id = 2, MeterTypeCode = "MT02", MeterType = "Analog", IsActive = true });

        var queryParams = new MeterTypeMasterQueryParameters { PageNumber = 1, PageSize = 10 };

        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(2, result.TotalCount);
    }

    [Theory]
    [InlineData("Digital", 1)]
    [InlineData("MT02", 1)]
    [InlineData("NonExistent", 0)]
    public async Task GetAllAsync_SearchTerm_FiltersCorrectly(string searchTerm, int expectedCount)
    {
        SetupExistingRows(
            new() { Id = 1, MeterTypeCode = "MT01", MeterType = "Digital AMR", IsActive = true },
            new() { Id = 2, MeterTypeCode = "MT02", MeterType = "Analog", IsActive = true });

        var queryParams = new MeterTypeMasterQueryParameters { SearchTerm = searchTerm, PageNumber = 1, PageSize = 10 };

        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        Assert.Equal(expectedCount, result.TotalCount);
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_ValidDto_CreatesAndReturnsDto()
    {
        var createDto = new CreateMeterTypeMasterDto { MeterTypeCode = "MT01", MeterType = "Digital AMR" };

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<MeterTypeMasterEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((MeterTypeMasterEntity e, CancellationToken _) =>
            {
                e.Id = 1;
                return e;
            });

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("MT01", result.MeterTypeCode);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<MeterTypeMasterEntity>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_DuplicateCode_ThrowsValidationException()
    {
        SetupExistingRows(new MeterTypeMasterEntity { Id = 1, MeterTypeCode = "MT01", MeterType = "Digital AMR", IsActive = true });
        var createDto = new CreateMeterTypeMasterDto { MeterTypeCode = "mt01", MeterType = "Analog" };

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto, CancellationToken.None));
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<MeterTypeMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_ExistingEntity_UpdatesSuccessfully()
    {
        var existingEntity = new MeterTypeMasterEntity { Id = 1, MeterTypeCode = "MT01", MeterType = "Digital AMR", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<MeterTypeMasterEntity>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var updateDto = new UpdateMeterTypeMasterDto { MeterTypeCode = "MT01", MeterType = "Digital AMR Updated", IsActive = true };

        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        Assert.NotNull(result);
        _mockRepository.Verify(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WithDuplicateCode_ThrowsValidationException()
    {
        SetupExistingRows(
            new MeterTypeMasterEntity { Id = 1, MeterTypeCode = "MT01", MeterType = "Digital AMR", IsActive = true },
            new MeterTypeMasterEntity { Id = 2, MeterTypeCode = "MT02", MeterType = "Analog", IsActive = true });

        _mockRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new MeterTypeMasterEntity { Id = 2, MeterTypeCode = "MT02", MeterType = "Analog", IsActive = true });

        var updateDto = new UpdateMeterTypeMasterDto { MeterTypeCode = "MT01", MeterType = "Analog", IsActive = true };

        await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(2, updateDto, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_DeactivatingWithReferences_ThrowsValidationException()
    {
        var updateDto = new UpdateMeterTypeMasterDto { MeterTypeCode = "MT01", MeterType = "Digital AMR", IsActive = false };
        var existingEntity = new MeterTypeMasterEntity { Id = 1, MeterTypeCode = "MT01", MeterType = "Digital AMR", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockReferenceValidator.Setup(r => r.ValidateReferencesAsync<MeterTypeMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot deactivate: referenced elsewhere"));

        await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto, CancellationToken.None));
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_ExistingEntity_DeletesSuccessfully()
    {
        var existingEntity = new MeterTypeMasterEntity { Id = 1, MeterTypeCode = "MT01", MeterType = "Digital AMR", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.DeleteAsync(It.IsAny<MeterTypeMasterEntity>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _mockReferenceValidator.Setup(r => r.ValidateReferencesAsync<MeterTypeMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        var result = await _service.DeleteAsync(1, CancellationToken.None);

        Assert.True(result);
        _mockRepository.Verify(r => r.DeleteAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WithReferences_ThrowsValidationException()
    {
        var existingEntity = new MeterTypeMasterEntity { Id = 1, MeterTypeCode = "MT01", MeterType = "Digital AMR", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockReferenceValidator.Setup(r => r.ValidateReferencesAsync<MeterTypeMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot delete: referenced elsewhere"));

        await Assert.ThrowsAsync<ValidationException>(() => _service.DeleteAsync(1, CancellationToken.None));
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<MeterTypeMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion
}
