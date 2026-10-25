using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.WaterBill.Master.GeographyUnit;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services.WaterBill.Master.GeographyUnit;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.WaterBill.Master.GeographyUnit;

public class GeographyUnitServiceTests
{
    private readonly Mock<IRepository<GeographyUnitEntity, int>> _mockRepository;
    private readonly Mock<IRepository<GeographyTypeMasterEntity, int>> _mockGeographyTypeRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IReferenceValidationService> _mockReferenceValidator;
    private readonly Mock<ICurrentUserService> _mockCurrentUserService;
    private readonly IMapper _mapper;
    private readonly GeographyUnitService _service;

    public GeographyUnitServiceTests()
    {
        _mockRepository = new Mock<IRepository<GeographyUnitEntity, int>>();
        _mockGeographyTypeRepository = new Mock<IRepository<GeographyTypeMasterEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockReferenceValidator = new Mock<IReferenceValidationService>();
        _mockCurrentUserService = new Mock<ICurrentUserService>();
        _mockCurrentUserService.Setup(s => s.GetCurrentUserId()).Returns(42);

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        SetupExistingRows();

        var activeGeographyType = new GeographyTypeMasterEntity { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true };
        _mockGeographyTypeRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(activeGeographyType);

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.CreateMap<GeographyUnitEntity, GeographyUnitDto>()
                .ForMember(d => d.GeographyTypeCode, opt => opt.MapFrom(s => s.GeographyType != null ? s.GeographyType.GeographyTypeCode : null))
                .ForMember(d => d.GeographyType, opt => opt.MapFrom(s => s.GeographyType != null ? s.GeographyType.GeographyType : null))
                .ForMember(d => d.ParentGeographyUnitName, opt => opt.MapFrom(s => s.ParentGeographyUnit != null ? s.ParentGeographyUnit.GeographyUnitName : null));
            cfg.CreateMap<CreateGeographyUnitDto, GeographyUnitEntity>();
            cfg.CreateMap<UpdateGeographyUnitDto, GeographyUnitEntity>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore());
        }, NullLoggerFactory.Instance);

        _mapper = mapperConfig.CreateMapper();

        _service = new GeographyUnitService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mapper,
            _mockReferenceValidator.Object,
            _mockGeographyTypeRepository.Object,
            _mockCurrentUserService.Object);
    }

    private void SetupExistingRows(params GeographyUnitEntity[] rows)
    {
        var mockQuery = rows.ToList().BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery);
    }

    private void SetupGeographyTypes(params GeographyTypeMasterEntity[] rows)
    {
        var mockQuery = rows.ToList().BuildMock();
        _mockGeographyTypeRepository.Setup(r => r.GetQueryable()).Returns(mockQuery);
    }

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsDto()
    {
        var geographyType = new GeographyTypeMasterEntity { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true };
        var entity = new GeographyUnitEntity
        {
            Id = 1,
            GeographyTypeId = 1,
            GeographyType = geographyType,
            GeographyUnitCode = "Z01",
            GeographyUnitName = "Zone 1",
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await _service.GetByIdAsync(1, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Z01", result.GeographyUnitCode);
        Assert.Equal("Zone 1", result.GeographyUnitName);
        Assert.Equal("ZONE", result.GeographyTypeCode);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        _mockRepository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync((GeographyUnitEntity?)null);

        var result = await _service.GetByIdAsync(999, CancellationToken.None);

        Assert.Null(result);
    }

    #endregion

    #region GetAllAsync Tests

    [Fact]
    public async Task GetAllAsync_ReturnsAllEntitiesWithPagination()
    {
        SetupExistingRows(
            new() { Id = 1, GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true },
            new() { Id = 2, GeographyTypeId = 1, GeographyUnitCode = "Z02", GeographyUnitName = "Zone 2", IsActive = true });

        var queryParams = new GeographyUnitQueryParameters { PageNumber = 1, PageSize = 10 };

        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        Assert.Equal(2, result.TotalCount);
    }

    [Theory]
    [InlineData("Zone 1", 1)]
    [InlineData("Z02", 1)]
    [InlineData("NonExistent", 0)]
    public async Task GetAllAsync_SearchTerm_FiltersCorrectly(string searchTerm, int expectedCount)
    {
        SetupExistingRows(
            new() { Id = 1, GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true },
            new() { Id = 2, GeographyTypeId = 1, GeographyUnitCode = "Z02", GeographyUnitName = "Zone 2", IsActive = true });

        var queryParams = new GeographyUnitQueryParameters { SearchTerm = searchTerm, PageNumber = 1, PageSize = 10 };

        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        Assert.Equal(expectedCount, result.TotalCount);
    }

    [Fact]
    public async Task GetAllAsync_FilterByParentGeographyUnitId_ReturnsMatchingOnly()
    {
        SetupExistingRows(
            new() { Id = 1, GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true },
            new() { Id = 2, GeographyTypeId = 1, ParentGeographyUnitId = 1, GeographyUnitCode = "W01", GeographyUnitName = "Ward 1", IsActive = true });

        var queryParams = new GeographyUnitQueryParameters { ParentGeographyUnitId = 1, PageNumber = 1, PageSize = 10 };

        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        Assert.Equal(1, result.TotalCount);
        Assert.Equal("W01", result.Items.Single().GeographyUnitCode);
    }

    [Fact]
    public async Task GetAllAsync_FilterByGeographyUnitCode_ReturnsMatchingOnly()
    {
        SetupExistingRows(
            new() { Id = 1, GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true },
            new() { Id = 2, GeographyTypeId = 1, GeographyUnitCode = "Z02", GeographyUnitName = "Zone 2", IsActive = true });

        var queryParams = new GeographyUnitQueryParameters { GeographyUnitCode = "Z02", PageNumber = 1, PageSize = 10 };

        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        Assert.Equal(1, result.TotalCount);
        Assert.Equal("Z02", result.Items.Single().GeographyUnitCode);
    }

    [Fact]
    public async Task GetAllAsync_FilterByGeographyUnitName_ReturnsMatchingOnly()
    {
        SetupExistingRows(
            new() { Id = 1, GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true },
            new() { Id = 2, GeographyTypeId = 1, GeographyUnitCode = "Z02", GeographyUnitName = "Zone 2", IsActive = true });

        var queryParams = new GeographyUnitQueryParameters { GeographyUnitName = "Zone 1", PageNumber = 1, PageSize = 10 };

        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        Assert.Equal(1, result.TotalCount);
        Assert.Equal("Z01", result.Items.Single().GeographyUnitCode);
    }

    [Theory]
    [InlineData("geographytypeid")]
    [InlineData("parentgeographyunitid")]
    public async Task GetAllAsync_SortByDeclaredSortableField_DoesNotThrow(string sortBy)
    {
        SetupExistingRows(
            new() { Id = 1, GeographyTypeId = 2, ParentGeographyUnitId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true },
            new() { Id = 2, GeographyTypeId = 1, GeographyUnitCode = "Z02", GeographyUnitName = "Zone 2", IsActive = true });

        var queryParams = new GeographyUnitQueryParameters { SortBy = sortBy, PageNumber = 1, PageSize = 10 };

        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        Assert.Equal(2, result.TotalCount);
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_ValidDto_CreatesAndReturnsDto()
    {
        var createDto = new CreateGeographyUnitDto { GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1" };

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<GeographyUnitEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((GeographyUnitEntity e, CancellationToken _) =>
            {
                e.Id = 1;
                return e;
            });

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Z01", result.GeographyUnitCode);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<GeographyUnitEntity>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_NonExistingGeographyType_ThrowsValidationException()
    {
        _mockGeographyTypeRepository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync((GeographyTypeMasterEntity?)null);
        var createDto = new CreateGeographyUnitDto { GeographyTypeId = 999, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1" };

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto, CancellationToken.None));
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<GeographyUnitEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_InactiveGeographyType_ThrowsValidationException()
    {
        _mockGeographyTypeRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyTypeMasterEntity { Id = 2, GeographyTypeCode = "WARD", GeographyType = "Ward", LevelNo = 2, IsActive = false });
        var createDto = new CreateGeographyUnitDto { GeographyTypeId = 2, ParentGeographyUnitId = 1, GeographyUnitCode = "W01", GeographyUnitName = "Ward 1" };

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto, CancellationToken.None));
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<GeographyUnitEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_TopLevelTypeWithParent_ThrowsValidationException()
    {
        // GeographyTypeId 1 (Zone) is LevelNo 1 -- top-level types must have no parent.
        var createDto = new CreateGeographyUnitDto { GeographyTypeId = 1, ParentGeographyUnitId = 5, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1" };

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto, CancellationToken.None));
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<GeographyUnitEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_NonTopLevelTypeWithoutParent_ThrowsValidationException()
    {
        _mockGeographyTypeRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyTypeMasterEntity { Id = 2, GeographyTypeCode = "WARD", GeographyType = "Ward", LevelNo = 2, IsActive = true });

        var createDto = new CreateGeographyUnitDto { GeographyTypeId = 2, ParentGeographyUnitId = null, GeographyUnitCode = "W01", GeographyUnitName = "Ward 1" };

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto, CancellationToken.None));
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<GeographyUnitEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_NonExistingParent_ThrowsValidationException()
    {
        _mockGeographyTypeRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyTypeMasterEntity { Id = 2, GeographyTypeCode = "WARD", GeographyType = "Ward", LevelNo = 2, IsActive = true });
        SetupExistingRows();

        var createDto = new CreateGeographyUnitDto { GeographyTypeId = 2, ParentGeographyUnitId = 999, GeographyUnitCode = "W01", GeographyUnitName = "Ward 1" };

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto, CancellationToken.None));
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<GeographyUnitEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_InactiveParent_ThrowsValidationException()
    {
        _mockGeographyTypeRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyTypeMasterEntity { Id = 2, GeographyTypeCode = "WARD", GeographyType = "Ward", LevelNo = 2, IsActive = true });
        var zoneType = new GeographyTypeMasterEntity { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true };
        SetupExistingRows(new GeographyUnitEntity { Id = 1, GeographyTypeId = 1, GeographyType = zoneType, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = false });

        var createDto = new CreateGeographyUnitDto { GeographyTypeId = 2, ParentGeographyUnitId = 1, GeographyUnitCode = "W01", GeographyUnitName = "Ward 1" };

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto, CancellationToken.None));
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<GeographyUnitEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_ParentFromWrongLevel_ThrowsValidationException()
    {
        // Child type is LevelNo 3 (City) but the chosen parent belongs to LevelNo 1 (Zone), not
        // LevelNo 2 (Ward) -- this must be rejected even though the parent itself exists and is active.
        _mockGeographyTypeRepository.Setup(r => r.GetByIdAsync(3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyTypeMasterEntity { Id = 3, GeographyTypeCode = "CITY", GeographyType = "City", LevelNo = 3, IsActive = true });
        var zoneType = new GeographyTypeMasterEntity { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true };
        SetupExistingRows(new GeographyUnitEntity { Id = 1, GeographyTypeId = 1, GeographyType = zoneType, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true });

        var createDto = new CreateGeographyUnitDto { GeographyTypeId = 3, ParentGeographyUnitId = 1, GeographyUnitCode = "C01", GeographyUnitName = "City 1" };

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto, CancellationToken.None));
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<GeographyUnitEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_ValidParentFromCorrectLevel_Succeeds()
    {
        _mockGeographyTypeRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyTypeMasterEntity { Id = 2, GeographyTypeCode = "WARD", GeographyType = "Ward", LevelNo = 2, IsActive = true });
        var zoneType = new GeographyTypeMasterEntity { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true };
        SetupExistingRows(new GeographyUnitEntity { Id = 1, GeographyTypeId = 1, GeographyType = zoneType, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true });
        _mockRepository.Setup(r => r.AddAsync(It.IsAny<GeographyUnitEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((GeographyUnitEntity e, CancellationToken _) =>
            {
                e.Id = 2;
                return e;
            });

        var createDto = new CreateGeographyUnitDto { GeographyTypeId = 2, ParentGeographyUnitId = 1, GeographyUnitCode = "W01", GeographyUnitName = "Ward 1" };

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        Assert.NotNull(result);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<GeographyUnitEntity>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_DuplicateCodeForSameType_ThrowsValidationException()
    {
        SetupExistingRows(new GeographyUnitEntity { Id = 1, GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true });
        var createDto = new CreateGeographyUnitDto { GeographyTypeId = 1, GeographyUnitCode = "z01", GeographyUnitName = "Zone Duplicate" };

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto, CancellationToken.None));
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<GeographyUnitEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_StampsCreatedByFromCurrentUser()
    {
        var createDto = new CreateGeographyUnitDto { GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1" };
        GeographyUnitEntity? added = null;

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<GeographyUnitEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((GeographyUnitEntity e, CancellationToken _) =>
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
        var existingEntity = new GeographyUnitEntity { Id = 1, GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<GeographyUnitEntity>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var updateDto = new UpdateGeographyUnitDto { GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1 Updated", IsActive = true };

        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        Assert.NotNull(result);
        _mockRepository.Verify(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_SelfAsParent_ThrowsValidationException()
    {
        var existingEntity = new GeographyUnitEntity { Id = 1, GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);

        var updateDto = new UpdateGeographyUnitDto { GeographyTypeId = 1, ParentGeographyUnitId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true };

        await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto, CancellationToken.None));
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<GeographyUnitEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_IndirectCycle_ThrowsValidationException()
    {
        // Hierarchy: Zone 1 (Id 1, LevelNo 1) -> Ward 1 (Id 2, LevelNo 2, parent 1) ->
        // City 1 (Id 3, LevelNo 3, parent 2). Attempting to set Zone 1's parent to City 1 would
        // create an indirect cycle (1 -> 2 -> 3 -> 1) even though City 1 is not Zone 1 itself.
        var zoneType = new GeographyTypeMasterEntity { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true };
        var wardType = new GeographyTypeMasterEntity { Id = 2, GeographyTypeCode = "WARD", GeographyType = "Ward", LevelNo = 2, IsActive = true };
        var cityType = new GeographyTypeMasterEntity { Id = 3, GeographyTypeCode = "CITY", GeographyType = "City", LevelNo = 3, IsActive = true };

        var zone = new GeographyUnitEntity { Id = 1, GeographyTypeId = 1, GeographyType = zoneType, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true };
        var ward = new GeographyUnitEntity { Id = 2, GeographyTypeId = 2, GeographyType = wardType, ParentGeographyUnitId = 1, GeographyUnitCode = "W01", GeographyUnitName = "Ward 1", IsActive = true };
        var city = new GeographyUnitEntity { Id = 3, GeographyTypeId = 3, GeographyType = cityType, ParentGeographyUnitId = 2, GeographyUnitCode = "C01", GeographyUnitName = "City 1", IsActive = true };

        SetupExistingRows(zone, ward, city);
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(zone);
        // Zone is a top-level type (LevelNo 1) so a parent is normally rejected outright; use a
        // synthetic level-2-under-city scenario instead so the cycle check itself is exercised:
        // attempt to make Ward 1's parent City 1 (its own descendant).
        _mockRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(ward);

        var updateDto = new UpdateGeographyUnitDto { GeographyTypeId = 3, ParentGeographyUnitId = 3, GeographyUnitCode = "W01", GeographyUnitName = "Ward 1", IsActive = true };

        // Re-parenting Ward 1 (Id 2) under City 1 (Id 3), while City 1's own parent is Ward 1 (Id 2),
        // would make Ward 1 a descendant of itself.
        await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(2, updateDto, CancellationToken.None));
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<GeographyUnitEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_WithDuplicateCodeForSameType_ThrowsValidationException()
    {
        SetupExistingRows(
            new GeographyUnitEntity { Id = 1, GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true },
            new GeographyUnitEntity { Id = 2, GeographyTypeId = 1, GeographyUnitCode = "Z02", GeographyUnitName = "Zone 2", IsActive = true });

        _mockRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyUnitEntity { Id = 2, GeographyTypeId = 1, GeographyUnitCode = "Z02", GeographyUnitName = "Zone 2", IsActive = true });

        var updateDto = new UpdateGeographyUnitDto { GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 2", IsActive = true };

        await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(2, updateDto, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_DeactivatingWithReferences_ThrowsValidationException()
    {
        var existingEntity = new GeographyUnitEntity { Id = 1, GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockReferenceValidator.Setup(r => r.ValidateReferencesAsync<GeographyUnitEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot deactivate: referenced elsewhere"));

        var updateDto = new UpdateGeographyUnitDto { GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = false };

        await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_StampsUpdatedByFromCurrentUser()
    {
        var existingEntity = new GeographyUnitEntity { Id = 1, GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<GeographyUnitEntity>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var updateDto = new UpdateGeographyUnitDto { GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true };

        await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        Assert.Equal(42, existingEntity.UpdatedBy);
    }

    [Fact]
    public async Task UpdateAsync_DoesNotChangeIdCreatedByOrCreatedDate()
    {
        var createdDate = new DateTime(2024, 1, 1);
        var existingEntity = new GeographyUnitEntity
        {
            Id = 1,
            GeographyTypeId = 1,
            GeographyUnitCode = "Z01",
            GeographyUnitName = "Zone 1",
            IsActive = true,
            CreatedBy = 7,
            CreatedDate = createdDate
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<GeographyUnitEntity>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var updateDto = new UpdateGeographyUnitDto { GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1 Updated", IsActive = true };

        await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        Assert.Equal(1, existingEntity.Id);
        Assert.Equal(7, existingEntity.CreatedBy);
        Assert.Equal(createdDate, existingEntity.CreatedDate);
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_ExistingEntity_DeletesSuccessfully()
    {
        var existingEntity = new GeographyUnitEntity { Id = 1, GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.DeleteAsync(It.IsAny<GeographyUnitEntity>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _mockReferenceValidator.Setup(r => r.ValidateReferencesAsync<GeographyUnitEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        var result = await _service.DeleteAsync(1, CancellationToken.None);

        Assert.True(result);
        _mockRepository.Verify(r => r.DeleteAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WithReferences_ThrowsValidationException()
    {
        var existingEntity = new GeographyUnitEntity { Id = 1, GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockReferenceValidator.Setup(r => r.ValidateReferencesAsync<GeographyUnitEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot delete: referenced elsewhere"));

        await Assert.ThrowsAsync<ValidationException>(() => _service.DeleteAsync(1, CancellationToken.None));
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<GeographyUnitEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion

    #region GetParentCandidatesAsync Tests

    [Fact]
    public async Task GetParentCandidatesAsync_TopLevelType_ReturnsEmpty()
    {
        _mockGeographyTypeRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyTypeMasterEntity { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true });

        var result = await _service.GetParentCandidatesAsync(1, CancellationToken.None);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetParentCandidatesAsync_NonExistingGeographyType_ReturnsEmpty()
    {
        _mockGeographyTypeRepository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GeographyTypeMasterEntity?)null);

        var result = await _service.GetParentCandidatesAsync(999, CancellationToken.None);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetParentCandidatesAsync_NoTypeAtLevelAbove_ReturnsEmpty()
    {
        _mockGeographyTypeRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyTypeMasterEntity { Id = 2, GeographyTypeCode = "WARD", GeographyType = "Ward", LevelNo = 2, IsActive = true });
        SetupGeographyTypes(
            new GeographyTypeMasterEntity { Id = 2, GeographyTypeCode = "WARD", GeographyType = "Ward", LevelNo = 2, IsActive = true });

        var result = await _service.GetParentCandidatesAsync(2, CancellationToken.None);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetParentCandidatesAsync_ValidType_ReturnsActiveUnitsFromParentTypeOnly()
    {
        _mockGeographyTypeRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyTypeMasterEntity { Id = 2, GeographyTypeCode = "WARD", GeographyType = "Ward", LevelNo = 2, IsActive = true });
        SetupGeographyTypes(
            new GeographyTypeMasterEntity { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true },
            new GeographyTypeMasterEntity { Id = 2, GeographyTypeCode = "WARD", GeographyType = "Ward", LevelNo = 2, IsActive = true });

        SetupExistingRows(
            new() { Id = 1, GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true },
            new() { Id = 2, GeographyTypeId = 1, GeographyUnitCode = "Z02", GeographyUnitName = "Zone 2", IsActive = false },
            new() { Id = 3, GeographyTypeId = 2, GeographyUnitCode = "W01", GeographyUnitName = "Ward 1", IsActive = true });

        var result = await _service.GetParentCandidatesAsync(2, CancellationToken.None);

        var candidate = Assert.Single(result);
        Assert.Equal(1, candidate.Id);
        Assert.Equal("Z01", candidate.GeographyUnitCode);
    }

    [Fact]
    public async Task GetParentCandidatesAsync_ExcludesInactiveAndSoftDeleted()
    {
        _mockGeographyTypeRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyTypeMasterEntity { Id = 2, GeographyTypeCode = "WARD", GeographyType = "Ward", LevelNo = 2, IsActive = true });
        SetupGeographyTypes(
            new GeographyTypeMasterEntity { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true },
            new GeographyTypeMasterEntity { Id = 2, GeographyTypeCode = "WARD", GeographyType = "Ward", LevelNo = 2, IsActive = true });

        SetupExistingRows(
            new() { Id = 1, GeographyTypeId = 1, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = false },
            new() { Id = 2, GeographyTypeId = 1, GeographyUnitCode = "Z02", GeographyUnitName = "Zone 2", IsActive = true, MarkedForDeletion = true });

        var result = await _service.GetParentCandidatesAsync(2, CancellationToken.None);

        Assert.Empty(result);
    }

    #endregion

    #region GetHierarchyTreeAsync Tests

    private static GeographyTypeMasterEntity ZoneType => new() { Id = 1, GeographyTypeCode = "ZONE", GeographyType = "Zone", LevelNo = 1, IsActive = true };
    private static GeographyTypeMasterEntity WardType => new() { Id = 2, GeographyTypeCode = "WARD", GeographyType = "Ward", LevelNo = 2, IsActive = true };

    [Fact]
    public async Task GetHierarchyTreeAsync_NoRootId_ReturnsForestOfTopLevelUnits()
    {
        var zoneType = ZoneType;
        var wardType = WardType;

        SetupExistingRows(
            new() { Id = 1, GeographyTypeId = 1, GeographyType = zoneType, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true },
            new() { Id = 2, GeographyTypeId = 1, GeographyType = zoneType, GeographyUnitCode = "Z02", GeographyUnitName = "Zone 2", IsActive = true },
            new() { Id = 3, GeographyTypeId = 2, GeographyType = wardType, ParentGeographyUnitId = 1, GeographyUnitCode = "W01", GeographyUnitName = "Ward 1", IsActive = true });

        var result = await _service.GetHierarchyTreeAsync(null, CancellationToken.None);

        Assert.Equal(2, result.Count);
        var zone1 = result.Single(x => x.Id == 1);
        Assert.Equal("Zone 1", zone1.GeographyUnitName);
        Assert.Equal("Zone", zone1.GeographyType);
        Assert.Equal(1, zone1.LevelNo);
        var child = Assert.Single(zone1.Children);
        Assert.Equal(3, child.Id);
        Assert.Equal("Ward 1", child.GeographyUnitName);
        Assert.Empty(child.Children);

        var zone2 = result.Single(x => x.Id == 2);
        Assert.Empty(zone2.Children);
    }

    [Fact]
    public async Task GetHierarchyTreeAsync_WithRootId_ReturnsOnlyThatSubtree()
    {
        var zoneType = ZoneType;
        var wardType = WardType;

        SetupExistingRows(
            new() { Id = 1, GeographyTypeId = 1, GeographyType = zoneType, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true },
            new() { Id = 2, GeographyTypeId = 1, GeographyType = zoneType, GeographyUnitCode = "Z02", GeographyUnitName = "Zone 2", IsActive = true },
            new() { Id = 3, GeographyTypeId = 2, GeographyType = wardType, ParentGeographyUnitId = 1, GeographyUnitCode = "W01", GeographyUnitName = "Ward 1", IsActive = true });

        var result = await _service.GetHierarchyTreeAsync(1, CancellationToken.None);

        var root = Assert.Single(result);
        Assert.Equal(1, root.Id);
        var child = Assert.Single(root.Children);
        Assert.Equal(3, child.Id);
    }

    [Fact]
    public async Task GetHierarchyTreeAsync_NonExistingRootId_ReturnsEmpty()
    {
        SetupExistingRows(
            new GeographyUnitEntity { Id = 1, GeographyTypeId = 1, GeographyType = ZoneType, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true });

        var result = await _service.GetHierarchyTreeAsync(999, CancellationToken.None);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetHierarchyTreeAsync_MultipleLevelsDeep_NestsChildrenRecursively()
    {
        var zoneType = ZoneType;
        var wardType = WardType;
        var cityType = new GeographyTypeMasterEntity { Id = 3, GeographyTypeCode = "CITY", GeographyType = "City", LevelNo = 3, IsActive = true };

        SetupExistingRows(
            new() { Id = 1, GeographyTypeId = 1, GeographyType = zoneType, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true },
            new() { Id = 2, GeographyTypeId = 2, GeographyType = wardType, ParentGeographyUnitId = 1, GeographyUnitCode = "W01", GeographyUnitName = "Ward 1", IsActive = true },
            new() { Id = 3, GeographyTypeId = 3, GeographyType = cityType, ParentGeographyUnitId = 2, GeographyUnitCode = "C01", GeographyUnitName = "City 1", IsActive = true });

        var result = await _service.GetHierarchyTreeAsync(null, CancellationToken.None);

        var zone = Assert.Single(result);
        var ward = Assert.Single(zone.Children);
        Assert.Equal(2, ward.Id);
        var city = Assert.Single(ward.Children);
        Assert.Equal(3, city.Id);
        Assert.Empty(city.Children);
    }

    [Fact]
    public async Task GetHierarchyTreeAsync_ExcludesInactiveAndSoftDeleted()
    {
        var zoneType = ZoneType;

        SetupExistingRows(
            new() { Id = 1, GeographyTypeId = 1, GeographyType = zoneType, GeographyUnitCode = "Z01", GeographyUnitName = "Zone 1", IsActive = true },
            new() { Id = 2, GeographyTypeId = 1, GeographyType = zoneType, GeographyUnitCode = "Z02", GeographyUnitName = "Zone 2", IsActive = false },
            new() { Id = 3, GeographyTypeId = 1, GeographyType = zoneType, GeographyUnitCode = "Z03", GeographyUnitName = "Zone 3", IsActive = true, MarkedForDeletion = true });

        var result = await _service.GetHierarchyTreeAsync(null, CancellationToken.None);

        var node = Assert.Single(result);
        Assert.Equal(1, node.Id);
    }

    [Fact]
    public async Task GetHierarchyTreeAsync_OrdersBySearchSequenceThenName()
    {
        var zoneType = ZoneType;

        SetupExistingRows(
            new() { Id = 1, GeographyTypeId = 1, GeographyType = zoneType, GeographyUnitCode = "Z02", GeographyUnitName = "Beta", SearchSequence = 2, IsActive = true },
            new() { Id = 2, GeographyTypeId = 1, GeographyType = zoneType, GeographyUnitCode = "Z01", GeographyUnitName = "Alpha", SearchSequence = 1, IsActive = true });

        var result = await _service.GetHierarchyTreeAsync(null, CancellationToken.None);

        Assert.Equal(2, result[0].Id);
        Assert.Equal(1, result[1].Id);
    }

    #endregion
}
