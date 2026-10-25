using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.WaterBill.Master.ReadingSourceMaster;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services.WaterBill.Master.ReadingSourceMaster;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.WaterBill.Master.ReadingSourceMaster;

public class ReadingSourceMasterServiceTests
{
    private readonly Mock<IRepository<ReadingSourceMasterEntity, int>> _mockRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IReferenceValidationService> _mockReferenceValidator;
    private readonly IMapper _mapper;
    private readonly ReadingSourceMasterService _service;

    public ReadingSourceMasterServiceTests()
    {
        _mockRepository = new Mock<IRepository<ReadingSourceMasterEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockReferenceValidator = new Mock<IReferenceValidationService>();

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        SetupExistingRows();

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.CreateMap<ReadingSourceMasterEntity, ReadingSourceMasterDto>();
            cfg.CreateMap<CreateReadingSourceMasterDto, ReadingSourceMasterEntity>();
            cfg.CreateMap<UpdateReadingSourceMasterDto, ReadingSourceMasterEntity>();
        }, NullLoggerFactory.Instance);

        _mapper = mapperConfig.CreateMapper();

        _service = new ReadingSourceMasterService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mapper,
            _mockReferenceValidator.Object);
    }

    private void SetupExistingRows(params ReadingSourceMasterEntity[] rows)
    {
        var mockQuery = rows.ToList().BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery);
    }

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsDto()
    {
        var entity = new ReadingSourceMasterEntity { Id = 1, ReadingSourceCode = "RS01", ReadingSource = "Mobile App", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await _service.GetByIdAsync(1, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("RS01", result.ReadingSourceCode);
        Assert.Equal("Mobile App", result.ReadingSource);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        _mockRepository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync((ReadingSourceMasterEntity?)null);

        var result = await _service.GetByIdAsync(999, CancellationToken.None);

        Assert.Null(result);
    }

    #endregion

    #region GetAllAsync Tests

    [Fact]
    public async Task GetAllAsync_ReturnsAllEntitiesWithPagination()
    {
        SetupExistingRows(
            new() { Id = 1, ReadingSourceCode = "RS01", ReadingSource = "Mobile App", IsActive = true },
            new() { Id = 2, ReadingSourceCode = "RS02", ReadingSource = "Manual", IsActive = true });

        var queryParams = new ReadingSourceMasterQueryParameters { PageNumber = 1, PageSize = 10 };

        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        Assert.Equal(2, result.TotalCount);
    }

    [Theory]
    [InlineData("Mobile", 1)]
    [InlineData("RS02", 1)]
    [InlineData("NonExistent", 0)]
    public async Task GetAllAsync_SearchTerm_FiltersCorrectly(string searchTerm, int expectedCount)
    {
        SetupExistingRows(
            new() { Id = 1, ReadingSourceCode = "RS01", ReadingSource = "Mobile App", IsActive = true },
            new() { Id = 2, ReadingSourceCode = "RS02", ReadingSource = "Manual", IsActive = true });

        var queryParams = new ReadingSourceMasterQueryParameters { SearchTerm = searchTerm, PageNumber = 1, PageSize = 10 };

        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        Assert.Equal(expectedCount, result.TotalCount);
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_ValidDto_CreatesAndReturnsDto()
    {
        var createDto = new CreateReadingSourceMasterDto { ReadingSourceCode = "RS01", ReadingSource = "Mobile App" };

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<ReadingSourceMasterEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ReadingSourceMasterEntity e, CancellationToken _) =>
            {
                e.Id = 1;
                return e;
            });

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("RS01", result.ReadingSourceCode);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<ReadingSourceMasterEntity>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_DuplicateCode_ThrowsValidationException()
    {
        SetupExistingRows(new ReadingSourceMasterEntity { Id = 1, ReadingSourceCode = "RS01", ReadingSource = "Mobile App", IsActive = true });
        var createDto = new CreateReadingSourceMasterDto { ReadingSourceCode = "rs01", ReadingSource = "Manual" };

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto, CancellationToken.None));
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<ReadingSourceMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_ExistingEntity_UpdatesSuccessfully()
    {
        var existingEntity = new ReadingSourceMasterEntity { Id = 1, ReadingSourceCode = "RS01", ReadingSource = "Mobile App", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<ReadingSourceMasterEntity>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var updateDto = new UpdateReadingSourceMasterDto { ReadingSourceCode = "RS01", ReadingSource = "Mobile App Updated", IsActive = true };

        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        Assert.NotNull(result);
        _mockRepository.Verify(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WithDuplicateCode_ThrowsValidationException()
    {
        SetupExistingRows(
            new ReadingSourceMasterEntity { Id = 1, ReadingSourceCode = "RS01", ReadingSource = "Mobile App", IsActive = true },
            new ReadingSourceMasterEntity { Id = 2, ReadingSourceCode = "RS02", ReadingSource = "Manual", IsActive = true });

        _mockRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ReadingSourceMasterEntity { Id = 2, ReadingSourceCode = "RS02", ReadingSource = "Manual", IsActive = true });

        var updateDto = new UpdateReadingSourceMasterDto { ReadingSourceCode = "RS01", ReadingSource = "Manual", IsActive = true };

        await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(2, updateDto, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_DeactivatingWithReferences_ThrowsValidationException()
    {
        var updateDto = new UpdateReadingSourceMasterDto { ReadingSourceCode = "RS01", ReadingSource = "Mobile App", IsActive = false };
        var existingEntity = new ReadingSourceMasterEntity { Id = 1, ReadingSourceCode = "RS01", ReadingSource = "Mobile App", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockReferenceValidator.Setup(r => r.ValidateReferencesAsync<ReadingSourceMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot deactivate: referenced elsewhere"));

        await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto, CancellationToken.None));
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_ExistingEntity_DeletesSuccessfully()
    {
        var existingEntity = new ReadingSourceMasterEntity { Id = 1, ReadingSourceCode = "RS01", ReadingSource = "Mobile App", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.DeleteAsync(It.IsAny<ReadingSourceMasterEntity>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _mockReferenceValidator.Setup(r => r.ValidateReferencesAsync<ReadingSourceMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        var result = await _service.DeleteAsync(1, CancellationToken.None);

        Assert.True(result);
        _mockRepository.Verify(r => r.DeleteAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WithReferences_ThrowsValidationException()
    {
        var existingEntity = new ReadingSourceMasterEntity { Id = 1, ReadingSourceCode = "RS01", ReadingSource = "Mobile App", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockReferenceValidator.Setup(r => r.ValidateReferencesAsync<ReadingSourceMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot delete: referenced elsewhere"));

        await Assert.ThrowsAsync<ValidationException>(() => _service.DeleteAsync(1, CancellationToken.None));
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<ReadingSourceMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion
}
