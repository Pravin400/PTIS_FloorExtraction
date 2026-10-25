using NtisPlatform.Application.Interfaces;
using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.Master;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Mappings;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NtisPlatform.Api.Controllers.Master;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Tests.Application;

/// <summary>
/// Comprehensive tests for AssetTypeService.
/// Tests all CRUD operations with various scenarios.
/// </summary>
public class AssetTypeServiceTests
{
    private readonly Mock<IRepository<AssetTypeEntity, int>> _mockRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IMapper> _mockMapper;
    private readonly Mock<IReferenceValidationService> _mockReferenceValidator;
    private readonly Mock<IRepository<AssetCategoryEntity, int>> _mockAssetCategoryRepository;
    private readonly AssetTypeService _service;

    public AssetTypeServiceTests()
    {
        _mockRepository = new Mock<IRepository<AssetTypeEntity, int>>();
        // Create/Update now run a TypeCode/TypeName duplicate check through GetQueryable(); default to an
        // empty async-capable set so tests that don't care about duplicates see no clash.
        _mockRepository.Setup(r => r.GetQueryable()).Returns(new List<AssetTypeEntity>().BuildMock());
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockMapper = new Mock<IMapper>();
        _mockReferenceValidator = new Mock<IReferenceValidationService>();
        _mockAssetCategoryRepository = new Mock<IRepository<AssetCategoryEntity, int>>();
        _mockAssetCategoryRepository.Setup(r => r.GetQueryable()).Returns(new List<AssetCategoryEntity>().BuildMock());

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _mockUnitOfWork
            .Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockUnitOfWork
            .Setup(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockUnitOfWork
            .Setup(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockReferenceValidator
            .Setup(v => v.ValidateReferencesAsync<AssetTypeEntity>(It.IsAny<int>(), It.IsAny<ReferenceValidationOperation>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.Models.ValidationResult.Success());

        _service = new AssetTypeService(_mockRepository.Object, _mockUnitOfWork.Object, _mockMapper.Object, _mockReferenceValidator.Object, _mockAssetCategoryRepository.Object);
    }

    private static IMapper CreateRealMapper()
    {
        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<AssetTypeMappingProfile>();
            cfg.AllowNullDestinationValues = true;
        }, NullLoggerFactory.Instance);

        // Skip validation to allow unmapped destination members (like Id)
        return mapperConfig.CreateMapper();
    }

    private static AssetTypeEntity CreateEntity(
        int id = 1,
        int AssetCategoryId = 10,
        string typeCode = "BLD",
        string typeName = "Building",
        string? typeNameLocal = null,
        string? description = null,
        bool isActive = true,
        bool markedForDeletion = false)
    {
        return new AssetTypeEntity
        {
            Id = id,
            AssetCategoryId = AssetCategoryId,
            TypeCode = typeCode,
            TypeName = typeName,
            TypeNameLocal = typeNameLocal,
            Description = description,
            IsActive = isActive,
            MarkedForDeletion = markedForDeletion,
            MarkedForDeletionDate = markedForDeletion ? DateTime.Now : null,
            CreatedBy = 1,
            UpdatedBy = 1,
            CreatedDate = DateTime.Now,
            UpdatedDate = DateTime.Now
        };
    }

    #region Constructor Tests

    [Fact]
    public void Constructor_WithValidParameters_CreatesInstance()
    {
        // Arrange & Act
        var service = new AssetTypeService(_mockRepository.Object, _mockUnitOfWork.Object, _mockMapper.Object, _mockReferenceValidator.Object, _mockAssetCategoryRepository.Object);

        // Assert
        Assert.NotNull(service);
    }

    #endregion

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsDto()
    {
        // Arrange
        var entity = CreateEntity(
            id: 1,
            AssetCategoryId: 100,
            typeName: "Vehicle",
            typeCode: "VEH");

        _mockRepository
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        _mockMapper
            .Setup(m => m.Map<AssetTypeDto>(It.IsAny<AssetTypeEntity>()))
            .Returns(new AssetTypeDto
            {
                Id = 1,
                AssetCategoryId = 100,
                TypeName = "Vehicle",
                TypeCode = "VEH",
                IsActive = true,
                CreatedBy = 1,
                UpdatedBy = 1
            });

        // Act
        var result = await _service.GetByIdAsync(1);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal(100, result.AssetCategoryId);
        Assert.Equal("Vehicle", result.TypeName);
        Assert.Equal("VEH", result.TypeCode);
        Assert.True(result.IsActive);
        Assert.Equal(1, result.CreatedBy);
        Assert.Equal(1, result.UpdatedBy);
        _mockRepository.Verify(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.GetByIdAsync(9999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetTypeEntity?)null);

        // Act
        var result = await _service.GetByIdAsync(9999);

        // Assert
        Assert.Null(result);
        _mockRepository.Verify(r => r.GetByIdAsync(9999, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetByIdAsync_ZeroId_ReturnsNull()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.GetByIdAsync(0, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetTypeEntity?)null);

        // Act
        var result = await _service.GetByIdAsync(0);

        // Assert
        Assert.Null(result);
        _mockRepository.Verify(r => r.GetByIdAsync(0, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetByIdAsync_PassesCancellationToken()
    {
        // Arrange
        var cancellationToken = new CancellationToken();
        var entity = CreateEntity(id: 1, typeName: "Test");

        _mockRepository
            .Setup(r => r.GetByIdAsync(1, cancellationToken))
            .ReturnsAsync(entity);

        _mockMapper
            .Setup(m => m.Map<AssetTypeDto>(entity))
            .Returns(new AssetTypeDto { Id = 1, TypeName = "Test" });

        // Act
        await _service.GetByIdAsync(1, cancellationToken);

        // Assert
        _mockRepository.Verify(r => r.GetByIdAsync(1, cancellationToken), Times.Once);
    }

    #endregion

    #region GetAllAsync Tests

    [Fact]
    public async Task GetAllAsync_ReturnsAllEntities()
    {
        // Arrange
        var entities = new List<AssetTypeEntity>
        {
            CreateEntity(id: 1, AssetCategoryId: 10, typeName: "Building", typeCode: "BLD"),
            CreateEntity(id: 2, AssetCategoryId: 20, typeName: "Vehicle", typeCode: "VEH")
        };

        var mockQuery = entities.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery);

        _mockAssetCategoryRepository.Setup(r => r.GetQueryable()).Returns(new List<AssetCategoryEntity>
        {
            new() { Id = 10, CategoryCode = "IMM", CategoryName = "Immovable" },
            new() { Id = 20, CategoryCode = "MOV", CategoryName = "Movable" }
        }.BuildMock());

        var service = new AssetTypeService(_mockRepository.Object, _mockUnitOfWork.Object, CreateRealMapper(), _mockReferenceValidator.Object, _mockAssetCategoryRepository.Object);

        var queryParams = new AssetTypeQueryParameters
        {
            PageNumber = 1,
            PageSize = 10,
            FilterLogic = FilterLogic.And,
            SearchTerm = null!,
            SortBy = null!
        };

        // Act
        var result = await service.GetAllAsync(queryParams, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.TotalCount);

        var items = result.Items.ToList();
        Assert.Equal(2, items.Count);
        Assert.Contains(items, x => x.TypeName == "Building" && x.TypeCode == "BLD" && x.AssetCategoryId == 10 && x.AssetCategoryName == "Immovable");
        Assert.Contains(items, x => x.TypeName == "Vehicle" && x.TypeCode == "VEH" && x.AssetCategoryId == 20 && x.AssetCategoryName == "Movable");
    }

    // AssetCategoryId is an FK to AMS.AssetCategoryMaster -- when it doesn't resolve to any row
    // (orphaned FK), the left join must not drop the AssetType row; AssetCategoryName is just null.
    [Fact]
    public async Task GetAllAsync_UnresolvableAssetCategoryId_ReturnsNullAssetCategoryName()
    {
        // Arrange
        _mockRepository.Setup(r => r.GetQueryable()).Returns(new List<AssetTypeEntity>
        {
            CreateEntity(id: 1, AssetCategoryId: 10, typeName: "Building", typeCode: "BLD"),
            CreateEntity(id: 2, AssetCategoryId: 999, typeName: "Orphan", typeCode: "ORP")
        }.BuildMock());

        _mockAssetCategoryRepository.Setup(r => r.GetQueryable()).Returns(new List<AssetCategoryEntity>
        {
            new() { Id = 10, CategoryCode = "IMM", CategoryName = "Immovable" }
        }.BuildMock());

        // Act
        var result = await _service.GetAllAsync(new AssetTypeQueryParameters { PageNumber = 1, PageSize = 10 }, CancellationToken.None);

        // Assert
        var mapped = result.Items.ToDictionary(x => x.Id);
        Assert.Equal(2, result.TotalCount);
        Assert.Equal("Immovable", mapped[1].AssetCategoryName);
        Assert.Equal(999, mapped[2].AssetCategoryId);
        Assert.Null(mapped[2].AssetCategoryName);
    }

    // The list projection is hand-written (not AutoMapper), so guard against a field being dropped.
    [Fact]
    public async Task GetAllAsync_ProjectsAllAssetTypeFields()
    {
        // Arrange
        var created = new DateTime(2026, 1, 2, 3, 4, 5);
        var updated = new DateTime(2026, 2, 3, 4, 5, 6);
        _mockRepository.Setup(r => r.GetQueryable()).Returns(new List<AssetTypeEntity>
        {
            new()
            {
                Id = 7,
                AssetCategoryId = 10,
                TypeCode = "BLD",
                TypeName = "Building",
                TypeNameLocal = "Local Building",
                Description = "Buildings",
                IsSubUnit = true,
                AllowUnitRegistration = true,
                AllowRoomRegistration = true,
                AssetWardNo = "Ward-1",
                IsActive = false,
                CreatedBy = 11,
                UpdatedBy = 12,
                CreatedDate = created,
                UpdatedDate = updated
            }
        }.BuildMock());

        _mockAssetCategoryRepository.Setup(r => r.GetQueryable()).Returns(new List<AssetCategoryEntity>
        {
            new() { Id = 10, CategoryCode = "IMM", CategoryName = "Immovable" }
        }.BuildMock());

        // Act
        var result = await _service.GetAllAsync(new AssetTypeQueryParameters { PageNumber = 1, PageSize = 10 }, CancellationToken.None);

        // Assert
        var item = Assert.Single(result.Items);
        Assert.Equal(7, item.Id);
        Assert.Equal(10, item.AssetCategoryId);
        Assert.Equal("Immovable", item.AssetCategoryName);
        Assert.Equal("BLD", item.TypeCode);
        Assert.Equal("Building", item.TypeName);
        Assert.Equal("Local Building", item.TypeNameLocal);
        Assert.Equal("Buildings", item.Description);
        Assert.True(item.IsSubUnit);
        Assert.True(item.AllowUnitRegistration);
        Assert.True(item.AllowRoomRegistration);
        Assert.Equal("Ward-1", item.AssetWardNo);
        Assert.False(item.IsActive);
        Assert.Equal(11, item.CreatedBy);
        Assert.Equal(12, item.UpdatedBy);
        Assert.Equal(created, item.CreatedDate);
        Assert.Equal(updated, item.UpdatedDate);
    }

    private void SetupAssetTypesWithAssetCategories()
    {
        // TypeNameLocal/Description are deliberately left null (both are nullable [Searchable] columns),
        // so the search tests below also prove null columns are skipped rather than throwing.
        _mockRepository.Setup(r => r.GetQueryable()).Returns(new List<AssetTypeEntity>
        {
            CreateEntity(id: 1, AssetCategoryId: 6, typeName: "Chairs", typeCode: "CHAIR"),
            CreateEntity(id: 2, AssetCategoryId: 5, typeName: "Laptops", typeCode: "LAPTOP"),
            CreateEntity(id: 3, AssetCategoryId: 5, typeName: "Phones", typeCode: "PHONE"),
            CreateEntity(id: 4, AssetCategoryId: 7, typeName: "Trucks", typeCode: "TRUCK")
        }.BuildMock());

        _mockAssetCategoryRepository.Setup(r => r.GetQueryable()).Returns(new List<AssetCategoryEntity>
        {
            new() { Id = 5, CategoryCode = "ELEC", CategoryName = "Electronics" },
            new() { Id = 6, CategoryCode = "FURN", CategoryName = "Furniture" },
            new() { Id = 7, CategoryCode = "VEH", CategoryName = "Vehicles" }
        }.BuildMock());
    }

    [Fact]
    public async Task GetAllAsync_FilterByAssetCategoryName_ReturnsRowsOfMatchingCategory()
    {
        SetupAssetTypesWithAssetCategories();

        var result = await _service.GetAllAsync(new AssetTypeQueryParameters { AssetCategoryName = "Electronics" }, CancellationToken.None);

        Assert.Equal(2, result.TotalCount);
        Assert.Equal(new[] { "LAPTOP", "PHONE" }, result.Items.Select(x => x.TypeCode));
        Assert.All(result.Items, x => Assert.Equal("Electronics", x.AssetCategoryName));
    }

    [Fact]
    public async Task GetAllAsync_FilterByAssetCategoryName_CountIgnoresPaging()
    {
        SetupAssetTypesWithAssetCategories();

        var result = await _service.GetAllAsync(
            new AssetTypeQueryParameters { AssetCategoryName = "Electronics", PageNumber = 2, PageSize = 1 }, CancellationToken.None);

        Assert.Equal(2, result.TotalCount);
        Assert.Equal("PHONE", Assert.Single(result.Items).TypeCode);
    }

    [Theory]
    [InlineData("asc", new[] { "Electronics", "Electronics", "Furniture", "Vehicles" })]
    [InlineData("desc", new[] { "Vehicles", "Furniture", "Electronics", "Electronics" })]
    public async Task GetAllAsync_SortByAssetCategoryName_OrdersByJoinedName(string sortOrder, string[] expected)
    {
        SetupAssetTypesWithAssetCategories();

        var result = await _service.GetAllAsync(
            new AssetTypeQueryParameters { SortBy = "AssetCategoryName", SortOrder = sortOrder }, CancellationToken.None);

        Assert.Equal(expected, result.Items.Select(x => x.AssetCategoryName));
    }

    [Fact]
    public async Task GetAllAsync_SearchTerm_MatchesAssetCategoryName()
    {
        SetupAssetTypesWithAssetCategories();

        var result = await _service.GetAllAsync(new AssetTypeQueryParameters { SearchTerm = "furni" }, CancellationToken.None);

        Assert.Equal("CHAIR", Assert.Single(result.Items).TypeCode);
    }

    [Fact]
    public async Task GetAllAsync_SearchTerm_StillMatchesOwnColumns()
    {
        SetupAssetTypesWithAssetCategories();

        var result = await _service.GetAllAsync(new AssetTypeQueryParameters { SearchTerm = "truck" }, CancellationToken.None);

        Assert.Equal("Vehicles", Assert.Single(result.Items).AssetCategoryName);
    }

    [Fact]
    public async Task GetAllAsync_FilterByMarkedForDeletion_StillWorksAfterJoin()
    {
        _mockRepository.Setup(r => r.GetQueryable()).Returns(new List<AssetTypeEntity>
        {
            CreateEntity(id: 1, typeName: "Live", typeCode: "LIVE"),
            CreateEntity(id: 2, typeName: "Gone", typeCode: "GONE", isActive: false, markedForDeletion: true)
        }.BuildMock());

        var result = await _service.GetAllAsync(new AssetTypeQueryParameters { MarkedForDeletion = false }, CancellationToken.None);

        Assert.Equal("LIVE", Assert.Single(result.Items).TypeCode);
    }

    [Fact]
    public async Task GetAllAsync_PageSizeMinusOne_ReturnsAllRowsUnpaged()
    {
        SetupAssetTypesWithAssetCategories();

        var result = await _service.GetAllAsync(new AssetTypeQueryParameters { PageNumber = 3, PageSize = -1 }, CancellationToken.None);

        Assert.Equal(4, result.TotalCount);
        Assert.Equal(4, result.Items.Count());
        Assert.Equal(1, result.PageNumber);
        Assert.Equal(4, result.PageSize);
    }

    [Fact]
    public async Task GetAllAsync_EmptyRepository_ReturnsEmptyResult()
    {
        // Arrange
        var entities = new List<AssetTypeEntity>();
        var mockQuery = entities.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery);

        var service = new AssetTypeService(_mockRepository.Object, _mockUnitOfWork.Object, CreateRealMapper(), _mockReferenceValidator.Object, _mockAssetCategoryRepository.Object);

        var queryParams = new AssetTypeQueryParameters
        {
            PageNumber = 1,
            PageSize = 10
        };

        // Act
        var result = await service.GetAllAsync(queryParams, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(0, result.TotalCount);
        Assert.Empty(result.Items);
    }

    [Fact]
    public async Task GetAllAsync_WithPagination_ReturnsCorrectPage()
    {
        // Arrange
        var entities = new List<AssetTypeEntity>();
        for (int i = 1; i <= 25; i++)
        {
            entities.Add(CreateEntity(
                id: i,
                AssetCategoryId: 100 + i,
                typeName: $"Asset Type {i}",
                typeCode: $"AT{i}"));
        }

        var mockQuery = entities.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery);

        var service = new AssetTypeService(_mockRepository.Object, _mockUnitOfWork.Object, CreateRealMapper(), _mockReferenceValidator.Object, _mockAssetCategoryRepository.Object);

        var queryParams = new AssetTypeQueryParameters
        {
            PageNumber = 2,
            PageSize = 10
        };

        // Act
        var result = await service.GetAllAsync(queryParams, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(25, result.TotalCount);
        Assert.Equal(10, result.Items.Count());
        Assert.Equal(2, result.PageNumber);
        Assert.Equal(10, result.PageSize);
    }

    [Fact]
    public async Task GetAllAsync_WithIsActiveFilter_ReturnsFilteredResults()
    {
        // Arrange
        var entities = new List<AssetTypeEntity>
        {
            CreateEntity(id: 1, typeName: "Building", typeCode: "BLD", isActive: true),
            CreateEntity(id: 2, typeName: "Vehicle", typeCode: "VEH", isActive: true),
            CreateEntity(id: 3, typeName: "Inactive Type", typeCode: "INA", isActive: false)
        };

        var mockQuery = entities.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery);

        var service = new AssetTypeService(_mockRepository.Object, _mockUnitOfWork.Object, CreateRealMapper(), _mockReferenceValidator.Object, _mockAssetCategoryRepository.Object);

        var queryParams = new AssetTypeQueryParameters
        {
            PageNumber = 1,
            PageSize = 10,
            IsActive = true
        };

        // Act
        var result = await service.GetAllAsync(queryParams, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.TotalCount);
        Assert.All(result.Items, item => Assert.True(item.IsActive));
    }

    [Fact]
    public async Task GetAllAsync_WithTypeNameFilter_ReturnsFilteredResults()
    {
        // Arrange
        var entities = new List<AssetTypeEntity>
        {
            CreateEntity(id: 1, typeName: "Building", typeCode: "BLD"),
            CreateEntity(id: 2, typeName: "Vehicle", typeCode: "VEH"),
            CreateEntity(id: 3, typeName: "Furniture", typeCode: "FUR")
        };

        var mockQuery = entities.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery);

        var service = new AssetTypeService(_mockRepository.Object, _mockUnitOfWork.Object, CreateRealMapper(), _mockReferenceValidator.Object, _mockAssetCategoryRepository.Object);

        var queryParams = new AssetTypeQueryParameters
        {
            PageNumber = 1,
            PageSize = 10,
            TypeName = "Vehicle"
        };

        // Act
        var result = await service.GetAllAsync(queryParams, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.TotalCount);
        Assert.Single(result.Items);
        Assert.Equal("Vehicle", result.Items.First().TypeName);
    }

    [Fact]
    public async Task GetAllAsync_WithTypeCodeFilter_ReturnsFilteredResults()
    {
        // Arrange
        var entities = new List<AssetTypeEntity>
        {
            CreateEntity(id: 1, typeName: "Building", typeCode: "BLD"),
            CreateEntity(id: 2, typeName: "Vehicle", typeCode: "VEH"),
            CreateEntity(id: 3, typeName: "Furniture", typeCode: "FUR")
        };

        var mockQuery = entities.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery);

        var service = new AssetTypeService(_mockRepository.Object, _mockUnitOfWork.Object, CreateRealMapper(), _mockReferenceValidator.Object, _mockAssetCategoryRepository.Object);

        var queryParams = new AssetTypeQueryParameters
        {
            PageNumber = 1,
            PageSize = 10,
            TypeCode = "FUR"
        };

        // Act
        var result = await service.GetAllAsync(queryParams, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.TotalCount);
        Assert.Single(result.Items);
        Assert.Equal("FUR", result.Items.First().TypeCode);
    }

    [Fact]
    public async Task GetAllAsync_PassesCancellationToken()
    {
        // Arrange
        var cancellationToken = new CancellationToken();
        var entities = new List<AssetTypeEntity>();
        var mockQuery = entities.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery);

        var service = new AssetTypeService(_mockRepository.Object, _mockUnitOfWork.Object, CreateRealMapper(), _mockReferenceValidator.Object, _mockAssetCategoryRepository.Object);

        var queryParams = new AssetTypeQueryParameters
        {
            PageNumber = 1,
            PageSize = 10
        };

        // Act
        await service.GetAllAsync(queryParams, cancellationToken);

        // Assert
        _mockRepository.Verify(r => r.GetQueryable(), Times.Once);
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_ValidDto_ReturnsCreatedDto()
    {
        // Arrange
        var createDto = new CreateAssetTypeDto
        {
            AssetCategoryId = 10,
            TypeName = "Building",
            TypeCode = "BLD",
            IsSubUnit = true,
            AllowUnitRegistration = true,
            AllowRoomRegistration = false,
            AssetWardNo = "Ward-1"
        };

        _mockMapper
            .Setup(m => m.Map<AssetTypeEntity>(It.IsAny<CreateAssetTypeDto>()))
            .Returns((CreateAssetTypeDto dto) => new AssetTypeEntity
            {
                AssetCategoryId = dto.AssetCategoryId ?? 0,
                TypeName = dto.TypeName!,
                TypeCode = dto.TypeCode!,
                CreatedBy = 1,
                CreatedDate = DateTime.Now,
                IsActive = true,
                IsSubUnit = dto.IsSubUnit,
                AllowUnitRegistration = dto.AllowUnitRegistration,
                AllowRoomRegistration = dto.AllowRoomRegistration,
                AssetWardNo = dto.AssetWardNo
            });

        _mockRepository
            .Setup(r => r.AddAsync(It.IsAny<AssetTypeEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetTypeEntity e, CancellationToken _) => e);

        _mockMapper
            .Setup(m => m.Map<AssetTypeDto>(It.IsAny<AssetTypeEntity>()))
            .Returns((AssetTypeEntity e) => new AssetTypeDto
            {
                AssetCategoryId = e.AssetCategoryId,
                TypeName = e.TypeName,
                TypeCode = e.TypeCode,
                IsActive = true,
                IsSubUnit = e.IsSubUnit,
                AllowUnitRegistration = e.AllowUnitRegistration,
                AllowRoomRegistration = e.AllowRoomRegistration,
                AssetWardNo = e.AssetWardNo
            });

        // Act
        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(10, result.AssetCategoryId);
        Assert.Equal("Building", result.TypeName);
        Assert.Equal("BLD", result.TypeCode);
        Assert.True(result.IsActive);
        Assert.True(result.IsSubUnit);
        Assert.True(result.AllowUnitRegistration);
        Assert.False(result.AllowRoomRegistration);
        Assert.Equal("Ward-1", result.AssetWardNo);

        _mockRepository.Verify(r => r.AddAsync(It.IsAny<AssetTypeEntity>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_CallsMapperWithCorrectDto()
    {
        // Arrange
        var createDto = new CreateAssetTypeDto
        {
            AssetCategoryId = 40,
            TypeName = "Furniture",
            TypeCode = "FUR",
        };

        CreateAssetTypeDto? capturedDto = null;

        _mockMapper
            .Setup(m => m.Map<AssetTypeEntity>(It.IsAny<object>()))
            .Callback<object>(dto => capturedDto = dto as CreateAssetTypeDto)
            .Returns(new AssetTypeEntity());

        _mockRepository
            .Setup(r => r.AddAsync(It.IsAny<AssetTypeEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AssetTypeEntity());

        _mockMapper
            .Setup(m => m.Map<AssetTypeDto>(It.IsAny<AssetTypeEntity>()))
            .Returns(new AssetTypeDto { TypeName = "Furniture" });

        // Act
        await _service.CreateAsync(createDto, CancellationToken.None);

        // Assert
        Assert.NotNull(capturedDto);
        Assert.Equal(40, capturedDto.AssetCategoryId);
        Assert.Equal("Furniture", capturedDto.TypeName);
        Assert.Equal("FUR", capturedDto.TypeCode);
    }

    [Fact]
    public async Task CreateAsync_PassesCancellationToken()
    {
        // Arrange
        var cancellationToken = new CancellationToken();
        var createDto = new CreateAssetTypeDto
        {
            AssetCategoryId = 10,
            TypeName = "Test Type",
            TypeCode = "TST",
        };

        _mockMapper
            .Setup(m => m.Map<AssetTypeEntity>(It.IsAny<CreateAssetTypeDto>()))
            .Returns(new AssetTypeEntity());

        _mockRepository
            .Setup(r => r.AddAsync(It.IsAny<AssetTypeEntity>(), cancellationToken))
            .ReturnsAsync(new AssetTypeEntity());

        _mockMapper
            .Setup(m => m.Map<AssetTypeDto>(It.IsAny<AssetTypeEntity>()))
            .Returns(new AssetTypeDto { TypeName = "Test Type" });

        // Act
        await _service.CreateAsync(createDto, cancellationToken);

        // Assert
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<AssetTypeEntity>(), cancellationToken), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(cancellationToken), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WithSpecialCharacters_CreatesSuccessfully()
    {
        // Arrange
        var createDto = new CreateAssetTypeDto
        {
            AssetCategoryId = 50,
            TypeName = "Plant & Machinery",
            TypeCode = "P&M",
        };

        _mockMapper
            .Setup(m => m.Map<AssetTypeEntity>(It.IsAny<CreateAssetTypeDto>()))
            .Returns(new AssetTypeEntity
            {
                AssetCategoryId = createDto.AssetCategoryId.Value, // FIX: Added .Value
                TypeName = createDto.TypeName!,
                TypeCode = createDto.TypeCode!,
                IsActive = true
            });

        _mockRepository
            .Setup(r => r.AddAsync(It.IsAny<AssetTypeEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetTypeEntity e, CancellationToken _) => e);

        _mockMapper
            .Setup(m => m.Map<AssetTypeDto>(It.IsAny<AssetTypeEntity>()))
            .Returns(new AssetTypeDto
            {
                AssetCategoryId = createDto.AssetCategoryId.Value,
                TypeName = createDto.TypeName!,
                TypeCode = createDto.TypeCode!,
            });

        // Act
        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Plant & Machinery", result.TypeName);
        Assert.Equal("P&M", result.TypeCode);
    }

    [Fact]
    public async Task CreateAsync_WithTypeNameLocal_CreatesSuccessfully()
    {
        // Arrange
        var createDto = new CreateAssetTypeDto
        {
            AssetCategoryId = 60,
            TypeCode = "VEH",
            TypeName = "Vehicle",
            TypeNameLocal = "????",
        };

        _mockMapper
            .Setup(m => m.Map<AssetTypeEntity>(It.IsAny<CreateAssetTypeDto>()))
            .Returns(new AssetTypeEntity
            {
                AssetCategoryId = createDto.AssetCategoryId.Value, // FIX: Added .Value
                TypeCode = createDto.TypeCode!,
                TypeName = createDto.TypeName!,
                TypeNameLocal = createDto.TypeNameLocal,
                IsActive = true
            });

        _mockRepository
            .Setup(r => r.AddAsync(It.IsAny<AssetTypeEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetTypeEntity e, CancellationToken _) => e);

        _mockMapper
            .Setup(m => m.Map<AssetTypeDto>(It.IsAny<AssetTypeEntity>()))
            .Returns(new AssetTypeDto
            {
                AssetCategoryId = createDto.AssetCategoryId.Value,
                TypeCode = createDto.TypeCode!,
                TypeName = createDto.TypeName!,
                TypeNameLocal = createDto.TypeNameLocal,
            });

        // Act
        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Vehicle", result.TypeName);
        Assert.Equal("????", result.TypeNameLocal);
        Assert.Equal("VEH", result.TypeCode);
    }

    [Fact]
    public async Task CreateAsync_WithAllNewFields_CreatesSuccessfully()
    {
        // Arrange
        var createDto = new CreateAssetTypeDto
        {
            AssetCategoryId = 80,
            TypeCode = "OFF",
            TypeName = "Office Furniture",
            TypeNameLocal = "???????? ???????",
            Description = "Furniture for office use",
        };

        _mockMapper
            .Setup(m => m.Map<AssetTypeEntity>(It.IsAny<CreateAssetTypeDto>()))
            .Returns(new AssetTypeEntity
            {
                AssetCategoryId = createDto.AssetCategoryId.Value, // FIX: Added .Value
                TypeCode = createDto.TypeCode!,
                TypeName = createDto.TypeName!,
                TypeNameLocal = createDto.TypeNameLocal,
                Description = createDto.Description,
                IsActive = true
            });

        _mockRepository
            .Setup(r => r.AddAsync(It.IsAny<AssetTypeEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetTypeEntity e, CancellationToken _) => e);

        _mockMapper
            .Setup(m => m.Map<AssetTypeDto>(It.IsAny<AssetTypeEntity>()))
            .Returns(new AssetTypeDto
            {
                AssetCategoryId = createDto.AssetCategoryId.Value,
                TypeCode = createDto.TypeCode!,
                TypeName = createDto.TypeName!,
                TypeNameLocal = createDto.TypeNameLocal,
            });

        // Act
        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Office Furniture", result.TypeName);
        Assert.Equal("???????? ???????", result.TypeNameLocal);
        Assert.Equal("OFF", result.TypeCode);
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_ExistingEntity_UpdatesSuccessfully()
    {
        // Arrange
        var updateDto = new UpdateAssetTypeDto
        {
            AssetCategoryId = 15,
            TypeName = "Updated Building",
            TypeCode = "UBLD",
            TypeNameLocal = "Updated Local Name",
            Description = "Updated Description",
            IsSubUnit = false,
            AllowUnitRegistration = true,
            AllowRoomRegistration = true,
            AssetWardNo = "Ward-15",
            IsActive = true
        };

        var existingEntity = CreateEntity(
            id: 1,
            AssetCategoryId: 10,
            typeName: "Old Building",
            typeCode: "OLD");

        _mockRepository
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockRepository
            .Setup(r => r.UpdateAsync(It.IsAny<AssetTypeEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockMapper
            .Setup(m => m.Map(It.IsAny<UpdateAssetTypeDto>(), It.IsAny<AssetTypeEntity>()))
            .Callback((UpdateAssetTypeDto src, AssetTypeEntity dest) =>
            {
                dest.AssetCategoryId = src.AssetCategoryId ?? dest.AssetCategoryId;
                dest.TypeName = src.TypeName!;
                dest.TypeCode = src.TypeCode!;
                dest.TypeNameLocal = src.TypeNameLocal;
                dest.Description = src.Description;
                dest.IsActive = src.IsActive;
                dest.IsSubUnit = src.IsSubUnit;
                dest.AllowUnitRegistration = src.AllowUnitRegistration;
                dest.AllowRoomRegistration = src.AllowRoomRegistration;
                dest.AssetWardNo = src.AssetWardNo;
            });

        _mockMapper
            .Setup(m => m.Map<AssetTypeDto>(It.IsAny<AssetTypeEntity>()))
            .Returns((AssetTypeEntity e) => new AssetTypeDto
            {
                Id = e.Id,
                AssetCategoryId = e.AssetCategoryId,
                TypeName = e.TypeName,
                TypeCode = e.TypeCode,
                TypeNameLocal = e.TypeNameLocal,
                Description = e.Description,
                IsActive = e.IsActive,
                IsSubUnit = e.IsSubUnit,
                AllowUnitRegistration = e.AllowUnitRegistration,
                AllowRoomRegistration = e.AllowRoomRegistration,
                AssetWardNo = e.AssetWardNo
            });

        // Act
        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal(15, result.AssetCategoryId);
        Assert.Equal("Updated Building", result.TypeName);
        Assert.Equal("UBLD", result.TypeCode);
        Assert.False(result.IsSubUnit);
        Assert.True(result.AllowUnitRegistration);
        Assert.True(result.AllowRoomRegistration);
        Assert.Equal("Ward-15", result.AssetWardNo);
        Assert.Equal("Updated Local Name", result.TypeNameLocal);
        Assert.Equal("Updated Description", result.Description);
        Assert.True(result.IsActive);

        _mockRepository.Verify(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()), Times.Once);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<AssetTypeEntity>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);

        Assert.Equal(15, existingEntity.AssetCategoryId);
        Assert.Equal("Updated Building", existingEntity.TypeName);
        Assert.Equal("UBLD", existingEntity.TypeCode);
        Assert.Equal("Updated Local Name", existingEntity.TypeNameLocal);
        Assert.Equal("Updated Description", existingEntity.Description);
        Assert.True(existingEntity.IsActive);
    }

    [Fact]
    public async Task UpdateAsync_NonExistingEntity_ReturnsNull()
    {
        // Arrange
        var updateDto = new UpdateAssetTypeDto
        {
            TypeName = "Updated Type",
            TypeCode = "UPD",
        };

        _mockRepository
            .Setup(r => r.GetByIdAsync(9999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetTypeEntity?)null);

        // Act
        var result = await _service.UpdateAsync(9999, updateDto, CancellationToken.None);

        // Assert
        Assert.Null(result);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<AssetTypeEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_WithDifferentTypeCode_UpdatesSuccessfully()
    {
        // Arrange
        var updateDto = new UpdateAssetTypeDto
        {
            TypeName = "Furniture",
            TypeCode = "FUR",
        };

        var existingEntity = CreateEntity(
            id: 3,
            AssetCategoryId: 30,
            typeName: "Old Furniture",
            typeCode: "OLDFUR");

        _mockRepository
            .Setup(r => r.GetByIdAsync(3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockRepository
            .Setup(r => r.UpdateAsync(It.IsAny<AssetTypeEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockMapper
            .Setup(m => m.Map(It.IsAny<UpdateAssetTypeDto>(), It.IsAny<AssetTypeEntity>()))
            .Callback((UpdateAssetTypeDto src, AssetTypeEntity dest) =>
            {
                dest.TypeName = src.TypeName!;
                dest.TypeCode = src.TypeCode!;
            });

        _mockMapper
            .Setup(m => m.Map<AssetTypeDto>(It.IsAny<AssetTypeEntity>()))
            .Returns((AssetTypeEntity e) => new AssetTypeDto
            {
                Id = e.Id,
                AssetCategoryId = e.AssetCategoryId,
                TypeName = e.TypeName,
                TypeCode = e.TypeCode,
            });

        // Act
        var result = await _service.UpdateAsync(3, updateDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Furniture", result.TypeName);
        Assert.Equal("FUR", result.TypeCode);
    }

    [Fact]
    public async Task UpdateAsync_PassesCancellationToken()
    {
        // Arrange
        var cancellationToken = new CancellationToken();
        var updateDto = new UpdateAssetTypeDto
        {
            TypeName = "Test Type",
            TypeCode = "TST",
        };

        var existingEntity = CreateEntity(id: 1);

        _mockRepository
            .Setup(r => r.GetByIdAsync(1, cancellationToken))
            .ReturnsAsync(existingEntity);

        _mockRepository
            .Setup(r => r.UpdateAsync(It.IsAny<AssetTypeEntity>(), cancellationToken))
            .Returns(Task.CompletedTask);

        _mockMapper
            .Setup(m => m.Map(It.IsAny<UpdateAssetTypeDto>(), It.IsAny<AssetTypeEntity>()));

        _mockMapper
            .Setup(m => m.Map<AssetTypeDto>(It.IsAny<AssetTypeEntity>()))
            .Returns(new AssetTypeDto { TypeName = "Test Type" });

        // Act
        await _service.UpdateAsync(1, updateDto, cancellationToken);

        // Assert
        _mockRepository.Verify(r => r.GetByIdAsync(1, cancellationToken), Times.Once);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<AssetTypeEntity>(), cancellationToken), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(cancellationToken), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_UpdatesOnlyProvidedFields()
    {
        // Arrange
        var updateDto = new UpdateAssetTypeDto
        {
            TypeName = "New Name",
            TypeCode = "NEW",
        };

        var existingEntity = CreateEntity(
            id: 10,
            AssetCategoryId: 99,
            typeName: "Old Name",
            typeCode: "OLD");

        _mockRepository
            .Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockRepository
            .Setup(r => r.UpdateAsync(It.IsAny<AssetTypeEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockMapper
            .Setup(m => m.Map(It.IsAny<UpdateAssetTypeDto>(), It.IsAny<AssetTypeEntity>()))
            .Callback((UpdateAssetTypeDto src, AssetTypeEntity dest) =>
            {
                dest.TypeName = src.TypeName!;
                dest.TypeCode = src.TypeCode!;
            });

        _mockMapper
            .Setup(m => m.Map<AssetTypeDto>(It.IsAny<AssetTypeEntity>()))
            .Returns((AssetTypeEntity e) => new AssetTypeDto
            {
                Id = e.Id,
                AssetCategoryId = e.AssetCategoryId,
                TypeName = e.TypeName,
                TypeCode = e.TypeCode,
                IsActive = e.IsActive,
                CreatedBy = e.CreatedBy
            });

        // Act
        var result = await _service.UpdateAsync(10, updateDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(10, result.Id);
        Assert.Equal(99, result.AssetCategoryId);
        Assert.Equal("New Name", result.TypeName);
        Assert.Equal("NEW", result.TypeCode);
        Assert.True(result.IsActive);
        Assert.Equal(1, result.CreatedBy);
    }

    [Fact]
    public async Task UpdateAsync_MultipleUpdatesOnSameEntity_LastUpdateWins()
    {
        // Arrange
        var firstUpdateDto = new UpdateAssetTypeDto
        {
            TypeName = "First Update",
            TypeCode = "FST",
        };

        var secondUpdateDto = new UpdateAssetTypeDto
        {
            TypeName = "Second Update",
            TypeCode = "SND",
        };

        var existingEntity = CreateEntity(
            id: 7,
            typeName: "Original",
            typeCode: "ORG");

        _mockRepository
            .Setup(r => r.GetByIdAsync(7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockRepository
            .Setup(r => r.UpdateAsync(It.IsAny<AssetTypeEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockMapper
            .Setup(m => m.Map(It.IsAny<UpdateAssetTypeDto>(), It.IsAny<AssetTypeEntity>()))
            .Callback((UpdateAssetTypeDto src, AssetTypeEntity dest) =>
            {
                dest.TypeName = src.TypeName!;
                dest.TypeCode = src.TypeCode!;
            });

        _mockMapper
            .Setup(m => m.Map<AssetTypeDto>(It.IsAny<AssetTypeEntity>()))
            .Returns((AssetTypeEntity e) => new AssetTypeDto
            {
                Id = e.Id,
                AssetCategoryId = e.AssetCategoryId,
                TypeName = e.TypeName,
                TypeCode = e.TypeCode,
            });

        // Act
        await _service.UpdateAsync(7, firstUpdateDto, CancellationToken.None);
        var result = await _service.UpdateAsync(7, secondUpdateDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Second Update", result.TypeName);
        Assert.Equal("SND", result.TypeCode);
    }

    [Fact]
    public async Task UpdateAsync_DeactivatingEntityWithReferences_ThrowsValidationException()
    {
        // Arrange
        var updateDto = new UpdateAssetTypeDto
        {
            TypeName = "Updated Building",
            TypeCode = "UBLD",
            IsActive = false
        };

        var existingEntity = CreateEntity(
            id: 1,
            AssetCategoryId: 10,
            typeName: "Old Building",
            typeCode: "OLD",
            isActive: true);

        _mockRepository
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockReferenceValidator
            .Setup(rv => rv.ValidateReferencesAsync<AssetTypeEntity>(1, ReferenceValidationOperation.Deactivate, It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.Models.ValidationResult.Failure("Cannot deactivate asset type with active references"));

        _mockMapper
            .Setup(m => m.Map(It.IsAny<UpdateAssetTypeDto>(), It.IsAny<AssetTypeEntity>()))
            .Callback((UpdateAssetTypeDto src, AssetTypeEntity dest) =>
            {
                dest.TypeName = src.TypeName!;
                dest.TypeCode = src.TypeCode!;
                dest.IsActive = src.IsActive;
            });

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NtisPlatform.Application.Exceptions.ValidationException>(
            () => _service.UpdateAsync(1, updateDto, CancellationToken.None));

        Assert.Contains("Cannot deactivate", exception.Message);
        _mockReferenceValidator.Verify(
            rv => rv.ValidateReferencesAsync<AssetTypeEntity>(1, ReferenceValidationOperation.Deactivate, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_DeactivatingEntityWithoutReferences_UpdatesSuccessfully()
    {
        // Arrange
        var updateDto = new UpdateAssetTypeDto
        {
            TypeName = "Updated Building",
            TypeCode = "UBLD",
            IsActive = false
        };

        var existingEntity = CreateEntity(
            id: 1,
            AssetCategoryId: 10,
            typeName: "Old Building",
            typeCode: "OLD",
            isActive: true);

        _mockRepository
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockReferenceValidator
            .Setup(rv => rv.ValidateReferencesAsync<AssetTypeEntity>(1, ReferenceValidationOperation.Deactivate, It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.Models.ValidationResult.Success());

        _mockRepository
            .Setup(r => r.UpdateAsync(It.IsAny<AssetTypeEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockMapper
            .Setup(m => m.Map(It.IsAny<UpdateAssetTypeDto>(), It.IsAny<AssetTypeEntity>()))
            .Callback((UpdateAssetTypeDto src, AssetTypeEntity dest) =>
            {
                dest.TypeName = src.TypeName!;
                dest.TypeCode = src.TypeCode!;
                dest.IsActive = src.IsActive;
            });

        _mockMapper
            .Setup(m => m.Map<AssetTypeDto>(It.IsAny<AssetTypeEntity>()))
            .Returns((AssetTypeEntity e) => new AssetTypeDto
            {
                Id = e.Id,
                AssetCategoryId = e.AssetCategoryId,
                TypeName = e.TypeName,
                TypeCode = e.TypeCode,
                IsActive = e.IsActive
            });

        // Act
        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.False(result.IsActive);
        _mockReferenceValidator.Verify(
            rv => rv.ValidateReferencesAsync<AssetTypeEntity>(1, ReferenceValidationOperation.Deactivate, It.IsAny<CancellationToken>()),
            Times.Once);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<AssetTypeEntity>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_ExistingEntity_DeletesAndReturnsTrue()
    {
        // Arrange
        int idToDelete = 1;
        var existingEntity = CreateEntity(id: idToDelete, typeName: "Type to Delete");

        _mockRepository
            .Setup(r => r.GetByIdAsync(idToDelete, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockRepository
            .Setup(r => r.DeleteAsync(It.IsAny<AssetTypeEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.DeleteAsync(idToDelete, CancellationToken.None);

        // Assert
        Assert.True(result);
        _mockRepository.Verify(r => r.GetByIdAsync(idToDelete, It.IsAny<CancellationToken>()), Times.Once);
        _mockRepository.Verify(r => r.DeleteAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_NonExistingEntity_ReturnsFalse()
    {
        // Arrange
        int idToDelete = 9999;

        _mockRepository
            .Setup(r => r.GetByIdAsync(idToDelete, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetTypeEntity?)null);

        // Act
        var result = await _service.DeleteAsync(idToDelete, CancellationToken.None);

        // Assert
        Assert.False(result);
        _mockRepository.Verify(r => r.GetByIdAsync(idToDelete, It.IsAny<CancellationToken>()), Times.Once);
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<AssetTypeEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_ZeroId_ReturnsFalse()
    {
        // Arrange
        int idToDelete = 0;

        _mockRepository
            .Setup(r => r.GetByIdAsync(idToDelete, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetTypeEntity?)null);

        // Act
        var result = await _service.DeleteAsync(idToDelete, CancellationToken.None);

        // Assert
        Assert.False(result);
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<AssetTypeEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_PassesCancellationToken()
    {
        // Arrange
        var cancellationToken = new CancellationToken();
        int idToDelete = 5;
        var existingEntity = CreateEntity(id: idToDelete);

        _mockRepository
            .Setup(r => r.GetByIdAsync(idToDelete, cancellationToken))
            .ReturnsAsync(existingEntity);

        _mockRepository
            .Setup(r => r.DeleteAsync(existingEntity, cancellationToken))
            .Returns(Task.CompletedTask);

        // Act
        await _service.DeleteAsync(idToDelete, cancellationToken);

        // Assert
        _mockRepository.Verify(r => r.GetByIdAsync(idToDelete, cancellationToken), Times.Once);
        _mockRepository.Verify(r => r.DeleteAsync(existingEntity, cancellationToken), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(cancellationToken), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_MultipleIds_DeletesCorrectEntities()
    {
        // Arrange
        var testIds = new[] { 1, 5, 10 };

        foreach (var id in testIds)
        {
            var entity = CreateEntity(id: id, typeName: $"Asset Type {id}");

            _mockRepository
                .Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(entity);

            _mockRepository
                .Setup(r => r.DeleteAsync(entity, It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _service.DeleteAsync(id, CancellationToken.None);

            // Assert
            Assert.True(result);
            _mockRepository.Verify(r => r.DeleteAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        }
    }

    [Fact]
    public async Task DeleteAsync_ActiveEntity_DeletesSuccessfully()
    {
        // Arrange
        int idToDelete = 20;
        var activeEntity = CreateEntity(id: idToDelete, typeName: "Active Type", isActive: true);

        _mockRepository
            .Setup(r => r.GetByIdAsync(idToDelete, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeEntity);

        _mockRepository
            .Setup(r => r.DeleteAsync(activeEntity, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.DeleteAsync(idToDelete, CancellationToken.None);

        // Assert
        Assert.True(result);
        _mockRepository.Verify(r => r.DeleteAsync(activeEntity, It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region Integration Tests

    [Fact]
    public async Task CreateThenGet_ReturnsCreatedEntity()
    {
        // Arrange
        var createDto = new CreateAssetTypeDto
        {
            AssetCategoryId = 10,
            TypeName = "Integration Test Type",
            TypeCode = "ITT",
        };

        var createdEntity = CreateEntity(
            id: 100,
            AssetCategoryId: createDto.AssetCategoryId.Value, // FIX: Added .Value
            typeName: createDto.TypeName!,
            typeCode: createDto.TypeCode!);

        _mockMapper
            .Setup(m => m.Map<AssetTypeEntity>(It.IsAny<CreateAssetTypeDto>()))
            .Returns(createdEntity);

        _mockRepository
            .Setup(r => r.AddAsync(It.IsAny<AssetTypeEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdEntity);

        _mockMapper
            .Setup(m => m.Map<AssetTypeDto>(It.IsAny<AssetTypeEntity>()))
            .Returns(new AssetTypeDto
            {
                Id = 100,
                AssetCategoryId = createdEntity.AssetCategoryId,
                TypeName = createdEntity.TypeName,
                TypeCode = createdEntity.TypeCode,
            });

        _mockRepository
            .Setup(r => r.GetByIdAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdEntity);

        // Act
        var createResult = await _service.CreateAsync(createDto, CancellationToken.None);
        var getResult = await _service.GetByIdAsync(100, CancellationToken.None);

        // Assert
        Assert.NotNull(createResult);
        Assert.NotNull(getResult);
        Assert.Equal(createResult.TypeName, getResult.TypeName);
        Assert.Equal(createResult.TypeCode, getResult.TypeCode);
    }

    [Fact]
    public async Task UpdateThenGet_ReturnsUpdatedEntity()
    {
        // Arrange
        var existingEntity = CreateEntity(
            id: 50,
            typeName: "Original Name",
            typeCode: "ORG");

        var updateDto = new UpdateAssetTypeDto
        {
            TypeName = "Updated Name",
            TypeCode = "UPD",
        };

        _mockRepository
            .Setup(r => r.GetByIdAsync(50, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockRepository
            .Setup(r => r.UpdateAsync(It.IsAny<AssetTypeEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockMapper
            .Setup(m => m.Map(It.IsAny<UpdateAssetTypeDto>(), It.IsAny<AssetTypeEntity>()))
            .Callback((UpdateAssetTypeDto src, AssetTypeEntity dest) =>
            {
                dest.TypeName = src.TypeName!;
                dest.TypeCode = src.TypeCode!;
            });

        _mockMapper
            .Setup(m => m.Map<AssetTypeDto>(It.IsAny<AssetTypeEntity>()))
            .Returns((AssetTypeEntity e) => new AssetTypeDto
            {
                Id = e.Id,
                AssetCategoryId = e.AssetCategoryId,
                TypeName = e.TypeName,
                TypeCode = e.TypeCode,
            });

        // Act
        var updateResult = await _service.UpdateAsync(50, updateDto, CancellationToken.None);
        var getResult = await _service.GetByIdAsync(50, CancellationToken.None);

        // Assert
        Assert.NotNull(updateResult);
        Assert.NotNull(getResult);
        Assert.Equal("Updated Name", updateResult.TypeName);
        Assert.Equal("UPD", updateResult.TypeCode);
        Assert.Equal(updateResult.TypeName, getResult.TypeName);
        Assert.Equal(updateResult.TypeCode, getResult.TypeCode);
    }

    [Fact]
    public async Task DeleteThenGet_ReturnsNull()
    {
        // Arrange
        int idToDelete = 75;
        var existingEntity = CreateEntity(id: idToDelete, typeName: "To Be Deleted");

        _mockRepository
            .Setup(r => r.GetByIdAsync(idToDelete, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockRepository
            .Setup(r => r.DeleteAsync(existingEntity, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask)
            .Callback(() =>
            {
                _mockRepository
                    .Setup(r => r.GetByIdAsync(idToDelete, It.IsAny<CancellationToken>()))
                    .ReturnsAsync((AssetTypeEntity?)null);
            });

        // Act
        var deleteResult = await _service.DeleteAsync(idToDelete, CancellationToken.None);
        var getResult = await _service.GetByIdAsync(idToDelete, CancellationToken.None);

        // Assert
        Assert.True(deleteResult);
        Assert.Null(getResult);
    }

    [Fact]
    public async Task CreateMultipleEntities_AllCreatedSuccessfully()
    {
        // Arrange
        var createDtos = new[]
        {
            new CreateAssetTypeDto { AssetCategoryId = 1, TypeName = "Type 1", TypeCode = "T1" },
            new CreateAssetTypeDto { AssetCategoryId = 2, TypeName = "Type 2", TypeCode = "T2" },
            new CreateAssetTypeDto { AssetCategoryId = 3, TypeName = "Type 3", TypeCode = "T3" }
        };

        foreach (var dto in createDtos)
        {
            var entity = new AssetTypeEntity
            {
                AssetCategoryId = dto.AssetCategoryId.Value, // FIX: Added .Value
                TypeName = dto.TypeName!,
                TypeCode = dto.TypeCode!,
            };

            _mockMapper
                .Setup(m => m.Map<AssetTypeEntity>(It.Is<CreateAssetTypeDto>(d => d.TypeName == dto.TypeName)))
                .Returns(entity);

            _mockRepository
                .Setup(r => r.AddAsync(It.Is<AssetTypeEntity>(e => e.TypeName == dto.TypeName), It.IsAny<CancellationToken>()))
                .ReturnsAsync(entity);

            _mockMapper
                .Setup(m => m.Map<AssetTypeDto>(It.Is<AssetTypeEntity>(e => e.TypeName == dto.TypeName)))
                .Returns(new AssetTypeDto
                {
                    AssetCategoryId = entity.AssetCategoryId,
                    TypeName = entity.TypeName,
                    TypeCode = entity.TypeCode,
                });
        }

        // Act
        var results = new List<AssetTypeDto>();
        foreach (var dto in createDtos)
        {
            var result = await _service.CreateAsync(dto, CancellationToken.None);
            results.Add(result);
        }

        // Assert
        Assert.Equal(3, results.Count);
        Assert.Contains(results, r => r.TypeName == "Type 1" && r.TypeCode == "T1");
        Assert.Contains(results, r => r.TypeName == "Type 2" && r.TypeCode == "T2");
        Assert.Contains(results, r => r.TypeName == "Type 3" && r.TypeCode == "T3");
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<AssetTypeEntity>(), It.IsAny<CancellationToken>()), Times.Exactly(3));
    }

    #endregion

    #region Entity Properties Coverage Test

    [Fact]
    public void TestAllProperties_ToEnsureCodeCoverage()
    {
        var entity = new AssetTypeEntity
        {
            Id = 1,
            AssetCategoryId = 2,
            TypeCode = "EQP",
            TypeName = "Equipment",
            TypeNameLocal = "Local Name",
            Description = "Description",
            AllowUnitRegistration = true,
            AllowRoomRegistration = true,
            AssetWardNo = "Ward 1",
            IsActive = true,
            MarkedForDeletion = false
        };

        Assert.Equal(1, entity.Id);
        Assert.Equal(2, entity.AssetCategoryId);
        Assert.Equal("EQP", entity.TypeCode);
        Assert.Equal("Equipment", entity.TypeName);
        Assert.Equal("Local Name", entity.TypeNameLocal);
        Assert.Equal("Description", entity.Description);
        Assert.True(entity.AllowUnitRegistration);
        Assert.True(entity.AllowRoomRegistration);
        Assert.Equal("Ward 1", entity.AssetWardNo);
        Assert.True(entity.IsActive);
        Assert.False(entity.MarkedForDeletion);
    }

    #endregion
}

public class AssetTypeControllerTests
{
    private static AssetTypeController Create(
        out Mock<IAssetTypeService> service,
        out Mock<IHardDeleteCleanupService> cleanupService,
        out Mock<IReferenceValidationService> referenceValidationService)
    {
        service = new Mock<IAssetTypeService>();
        cleanupService = new Mock<IHardDeleteCleanupService>();
        referenceValidationService = new Mock<IReferenceValidationService>();
        var logger = new Mock<ILogger<AssetTypeController>>();
        return new AssetTypeController(service.Object, cleanupService.Object, referenceValidationService.Object, logger.Object);
    }

    [Fact]
    public async Task GetAll_ReturnsOk()
    {
        var controller = Create(out var service, out _, out _);
        var query = new AssetTypeQueryParameters();
        service.Setup(s => s.GetAllAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PagedResult<AssetTypeDto>(new List<AssetTypeDto>(), 0, 1, 10));

        var result = await controller.GetAll(query, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetAll_ReturnsAssetCategoryNameInResponse()
    {
        var controller = Create(out var service, out _, out _);
        var query = new AssetTypeQueryParameters();
        service.Setup(s => s.GetAllAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PagedResult<AssetTypeDto>(
                new List<AssetTypeDto> { new() { Id = 1, AssetCategoryId = 10, AssetCategoryName = "Immovable", TypeName = "Building" } }, 1, 1, 10));

        var result = await controller.GetAll(query, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        var page = Assert.IsType<PagedResult<AssetTypeDto>>(ok.Value);
        var item = Assert.Single(page.Items);
        Assert.Equal(10, item.AssetCategoryId);
        Assert.Equal("Immovable", item.AssetCategoryName);
    }

    [Fact]
    public async Task GetById_ReturnsOk()
    {
        var controller = Create(out var service, out _, out _);
        service.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AssetTypeDto { Id = 1 });

        var result = await controller.GetById(1, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Create_ReturnsOk()
    {
        var controller = Create(out var service, out _, out _);
        var dto = new CreateAssetTypeDto { TypeName = "Equipment" };
        service.Setup(s => s.CreateAsync(dto, It.IsAny<CancellationToken>())).ReturnsAsync(new AssetTypeDto { Id = 1 });

        var result = await controller.Create(dto, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Update_ReturnsOk()
    {
        var controller = Create(out var service, out _, out _);
        var dto = new UpdateAssetTypeDto { TypeName = "Updated Equipment" };
        service.Setup(s => s.UpdateAsync(1, dto, It.IsAny<CancellationToken>())).ReturnsAsync(new AssetTypeDto { Id = 1 });

        var result = await controller.Update(1, dto, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Delete_ReturnsOk()
    {
        var controller = Create(out var service, out _, out _);
        service.Setup(s => s.DeleteAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await controller.Delete(1, CancellationToken.None);
        Assert.IsType<OkObjectResult>(result);
    }
}
