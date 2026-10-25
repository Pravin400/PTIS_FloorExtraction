using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.WaterBill.Master.GeographyTypeMaster;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services.WaterBill.Master.GeographyTypeMaster;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.WaterBill.Master.GeographyTypeMaster;

public class GeographyTypeMasterServiceTests
{
    private readonly Mock<IRepository<GeographyTypeMasterEntity, int>> _mockRepository;
    private readonly Mock<IRepository<GeographyUnitEntity, int>> _mockGeographyUnitRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IReferenceValidationService> _mockReferenceValidator;
    private readonly Mock<ICurrentUserService> _mockCurrentUserService;
    private readonly IMapper _mapper;
    private readonly GeographyTypeMasterService _service;

    public GeographyTypeMasterServiceTests()
    {
        _mockRepository = new Mock<IRepository<GeographyTypeMasterEntity, int>>();
        _mockGeographyUnitRepository = new Mock<IRepository<GeographyUnitEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockReferenceValidator = new Mock<IReferenceValidationService>();
        _mockCurrentUserService = new Mock<ICurrentUserService>();
        _mockCurrentUserService.Setup(s => s.GetCurrentUserId()).Returns(42);

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        SetupExistingRows();
        SetupExistingUnits();

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.CreateMap<GeographyTypeMasterEntity, GeographyTypeMasterDto>();
            cfg.CreateMap<CreateGeographyTypeMasterDto, GeographyTypeMasterEntity>();
            cfg.CreateMap<UpdateGeographyTypeMasterDto, GeographyTypeMasterEntity>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore());
        }, NullLoggerFactory.Instance);

        _mapper = mapperConfig.CreateMapper();

        _service = new GeographyTypeMasterService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mapper,
            _mockReferenceValidator.Object,
            _mockCurrentUserService.Object,
            _mockGeographyUnitRepository.Object);
    }

    private void SetupExistingRows(params GeographyTypeMasterEntity[] rows)
    {
        var mockQuery = rows.ToList().BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery);
    }

    private void SetupExistingUnits(params GeographyUnitEntity[] rows)
    {
        var mockQuery = rows.ToList().BuildMock();
        _mockGeographyUnitRepository.Setup(r => r.GetQueryable()).Returns(mockQuery);
    }

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsDto()
    {
        var entity = new GeographyTypeMasterEntity { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await _service.GetByIdAsync(1, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("ZONE", result.GeographyTypeCode);
        Assert.Equal("Zone", result.GeographyType);
        Assert.Equal(1, result.LevelNo);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        _mockRepository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync((GeographyTypeMasterEntity?)null);

        var result = await _service.GetByIdAsync(999, CancellationToken.None);

        Assert.Null(result);
    }

    #endregion

    #region GetAllAsync Tests

    [Fact]
    public async Task GetAllAsync_ReturnsAllEntitiesWithPagination()
    {
        SetupExistingRows(
            new() { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true },
            new() { Id = 2, GeographyTypeCode = "WARD", GeographyType = "Ward", LevelNo = 2, IsActive = true });

        var queryParams = new GeographyTypeMasterQueryParameters { PageNumber = 1, PageSize = 10 };

        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        Assert.Equal(2, result.TotalCount);
    }

    [Theory]
    [InlineData("Zone", 1)]
    [InlineData("WARD", 1)]
    [InlineData("NonExistent", 0)]
    public async Task GetAllAsync_SearchTerm_FiltersCorrectly(string searchTerm, int expectedCount)
    {
        SetupExistingRows(
            new() { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true },
            new() { Id = 2, GeographyTypeCode = "WARD", GeographyType = "Ward", LevelNo = 2, IsActive = true });

        var queryParams = new GeographyTypeMasterQueryParameters { SearchTerm = searchTerm, PageNumber = 1, PageSize = 10 };

        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        Assert.Equal(expectedCount, result.TotalCount);
    }

    [Fact]
    public async Task GetAllAsync_FilterByLevelNo_ReturnsMatchingOnly()
    {
        SetupExistingRows(
            new() { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true },
            new() { Id = 2, GeographyTypeCode = "WARD", GeographyType = "Ward", LevelNo = 2, IsActive = true });

        var queryParams = new GeographyTypeMasterQueryParameters { LevelNo = 2, PageNumber = 1, PageSize = 10 };

        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        Assert.Equal(1, result.TotalCount);
        Assert.Equal("WARD", result.Items.Single().GeographyTypeCode);
    }

    [Fact]
    public async Task GetAllAsync_FilterByGeographyType_ReturnsMatchingOnly()
    {
        SetupExistingRows(
            new() { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true },
            new() { Id = 2, GeographyTypeCode = "WARD", GeographyType = "Ward", LevelNo = 2, IsActive = true });

        var queryParams = new GeographyTypeMasterQueryParameters { GeographyType = "Ward", PageNumber = 1, PageSize = 10 };

        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        Assert.Equal(1, result.TotalCount);
        Assert.Equal("WARD", result.Items.Single().GeographyTypeCode);
    }

    [Fact]
    public async Task GetAllAsync_FilterByGeographyTypeCode_ReturnsMatchingOnly()
    {
        SetupExistingRows(
            new() { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true },
            new() { Id = 2, GeographyTypeCode = "WARD", GeographyType = "Ward", LevelNo = 2, IsActive = true });

        var queryParams = new GeographyTypeMasterQueryParameters { GeographyTypeCode = "ZONE", PageNumber = 1, PageSize = 10 };

        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        Assert.Equal(1, result.TotalCount);
        Assert.Equal("ZONE", result.Items.Single().GeographyTypeCode);
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_ValidDto_CreatesAndReturnsDto()
    {
        var createDto = new CreateGeographyTypeMasterDto { GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1 };

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<GeographyTypeMasterEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((GeographyTypeMasterEntity e, CancellationToken _) =>
            {
                e.Id = 1;
                return e;
            });

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("ZONE", result.GeographyTypeCode);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<GeographyTypeMasterEntity>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_DuplicateCode_ThrowsValidationException()
    {
        SetupExistingRows(new GeographyTypeMasterEntity { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true });
        var createDto = new CreateGeographyTypeMasterDto { GeographyTypeCode = "zone", GeographyType = "Zone Duplicate", LevelNo = 2 };

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto, CancellationToken.None));
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<GeographyTypeMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_DuplicateLevelNo_ThrowsValidationException()
    {
        SetupExistingRows(new GeographyTypeMasterEntity { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true });
        var createDto = new CreateGeographyTypeMasterDto { GeographyTypeCode = "WARD", GeographyType = "Ward", LevelNo = 1 };

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto, CancellationToken.None));
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<GeographyTypeMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_StampsCreatedByFromCurrentUser()
    {
        var createDto = new CreateGeographyTypeMasterDto { GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1 };
        GeographyTypeMasterEntity? added = null;

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<GeographyTypeMasterEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((GeographyTypeMasterEntity e, CancellationToken _) =>
            {
                e.Id = 1;
                added = e;
                return e;
            });

        await _service.CreateAsync(createDto, CancellationToken.None);

        Assert.NotNull(added);
        Assert.Equal(42, added!.CreatedBy);
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_ExistingEntity_UpdatesSuccessfully()
    {
        var existingEntity = new GeographyTypeMasterEntity { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<GeographyTypeMasterEntity>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var updateDto = new UpdateGeographyTypeMasterDto { GeographyTypeCode = "ZONE", GeographyType = "Zone Updated", LevelNo = 1, IsActive = true };

        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        Assert.NotNull(result);
        _mockRepository.Verify(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WithDuplicateCode_ThrowsValidationException()
    {
        SetupExistingRows(
            new GeographyTypeMasterEntity { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true },
            new GeographyTypeMasterEntity { Id = 2, GeographyTypeCode = "WARD", GeographyType = "Ward", LevelNo = 2, IsActive = true });

        _mockRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyTypeMasterEntity { Id = 2, GeographyTypeCode = "WARD", GeographyType = "Ward", LevelNo = 2, IsActive = true });

        var updateDto = new UpdateGeographyTypeMasterDto { GeographyTypeCode = "ZONE", GeographyType = "Ward", LevelNo = 2, IsActive = true };

        await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(2, updateDto, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_WithDuplicateLevelNo_ThrowsValidationException()
    {
        SetupExistingRows(
            new GeographyTypeMasterEntity { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true },
            new GeographyTypeMasterEntity { Id = 2, GeographyTypeCode = "WARD", GeographyType = "Ward", LevelNo = 2, IsActive = true });

        _mockRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyTypeMasterEntity { Id = 2, GeographyTypeCode = "WARD", GeographyType = "Ward", LevelNo = 2, IsActive = true });

        var updateDto = new UpdateGeographyTypeMasterDto { GeographyTypeCode = "WARD", GeographyType = "Ward", LevelNo = 1, IsActive = true };

        await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(2, updateDto, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_DeactivatingWithReferences_ThrowsValidationException()
    {
        var updateDto = new UpdateGeographyTypeMasterDto { GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = false };
        var existingEntity = new GeographyTypeMasterEntity { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockReferenceValidator.Setup(r => r.ValidateReferencesAsync<GeographyTypeMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot deactivate: referenced elsewhere"));

        await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_StampsUpdatedByFromCurrentUser()
    {
        var existingEntity = new GeographyTypeMasterEntity { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<GeographyTypeMasterEntity>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var updateDto = new UpdateGeographyTypeMasterDto { GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true };

        await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        Assert.Equal(42, existingEntity.UpdatedBy);
    }

    [Fact]
    public async Task UpdateAsync_DoesNotChangeIdCreatedByOrCreatedDate()
    {
        var createdDate = new DateTime(2024, 1, 1);
        var existingEntity = new GeographyTypeMasterEntity
        {
            Id = 1,
            GeographyTypeCode = "ZONE",
            GeographyType = "Zone",
            LevelNo = 1,
            IsActive = true,
            CreatedBy = 7,
            CreatedDate = createdDate
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<GeographyTypeMasterEntity>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var updateDto = new UpdateGeographyTypeMasterDto { GeographyTypeCode = "ZONE", GeographyType = "Zone Updated", LevelNo = 1, IsActive = true };

        await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        Assert.Equal(1, existingEntity.Id);
        Assert.Equal(7, existingEntity.CreatedBy);
        Assert.Equal(createdDate, existingEntity.CreatedDate);
    }

    [Fact]
    public async Task UpdateAsync_ChangingLevelNoWhenUnitsExist_ThrowsValidationException()
    {
        var existingEntity = new GeographyTypeMasterEntity { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        SetupExistingUnits(new GeographyUnitEntity { Id = 1, GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true });

        var updateDto = new UpdateGeographyTypeMasterDto { GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 2, IsActive = true };

        await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto, CancellationToken.None));
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<GeographyTypeMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_ChangingLevelNoWhenNoUnitsExist_Succeeds()
    {
        var existingEntity = new GeographyTypeMasterEntity { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<GeographyTypeMasterEntity>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        SetupExistingUnits();

        var updateDto = new UpdateGeographyTypeMasterDto { GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 2, IsActive = true };

        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(2, result!.LevelNo);
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_ExistingEntity_DeletesSuccessfully()
    {
        var existingEntity = new GeographyTypeMasterEntity { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.DeleteAsync(It.IsAny<GeographyTypeMasterEntity>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _mockReferenceValidator.Setup(r => r.ValidateReferencesAsync<GeographyTypeMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        var result = await _service.DeleteAsync(1, CancellationToken.None);

        Assert.True(result);
        _mockRepository.Verify(r => r.DeleteAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WithReferences_ThrowsValidationException()
    {
        var existingEntity = new GeographyTypeMasterEntity { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockReferenceValidator.Setup(r => r.ValidateReferencesAsync<GeographyTypeMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot delete: referenced elsewhere"));

        await Assert.ThrowsAsync<ValidationException>(() => _service.DeleteAsync(1, CancellationToken.None));
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<GeographyTypeMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion
}
