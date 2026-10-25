using AutoMapper;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using NtisPlatform.Application.DTOs.Master;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Mappings;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Tests.Application;

/// <summary>
/// Comprehensive tests for AssetCategoryService.
/// Tests all CRUD operations with various scenarios including validation.
/// </summary>
public class AssetCategoryServiceTests
{
    private readonly Mock<IRepository<AssetCategoryEntity, int>> _mockRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IMapper> _mockMapper;
    private readonly Mock<IReferenceValidationService> _mockReferenceValidator;
    private readonly AssetCategoryService _service;

    public AssetCategoryServiceTests()
    {
        _mockRepository = new Mock<IRepository<AssetCategoryEntity, int>>();
        // Create/Update run a CategoryCode/CategoryName duplicate check through GetQueryable(); default to an
        // empty async-capable set so tests that don't care about duplicates see no clash.
        _mockRepository.Setup(r => r.GetQueryable()).Returns(new List<AssetCategoryEntity>().BuildMock());
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockMapper = new Mock<IMapper>();
        _mockReferenceValidator = new Mock<IReferenceValidationService>();

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

        _service = new AssetCategoryService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mockMapper.Object,
            _mockReferenceValidator.Object);
    }

    private static AssetCategoryEntity CreateEntity(
        int id = 1,
        string categoryName = "Building",
        string? categoryCode = "BLD",
        string? description = "Building assets",
        bool isActive = true,
        bool markedForDeletion = false)
    {
        return new AssetCategoryEntity
        {
            Id = id,
            CategoryName = categoryName,
            CategoryCode = categoryCode,
            Description = description,
            IsActive = isActive,
            MarkedForDeletion = markedForDeletion,
            MarkedForDeletionDate = markedForDeletion ? DateTime.Now : null,
            CreatedBy = 1,
            CreatedDate = DateTime.Now,
            UpdatedBy = 1,
            UpdatedDate = DateTime.Now
        };
    }

    #region Constructor Tests

    [Fact]
    public void Constructor_WithValidParameters_CreatesInstance()
    {
        // Arrange & Act
        var service = new AssetCategoryService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mockMapper.Object,
            _mockReferenceValidator.Object);

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
            categoryName: "Vehicles",
            categoryCode: "VEH",
            description: "Vehicle assets");

        _mockRepository
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        _mockMapper
            .Setup(m => m.Map<AssetCategoryDto>(It.IsAny<AssetCategoryEntity>()))
            .Returns(new AssetCategoryDto
            {
                Id = 1,
                CategoryName = "Vehicles",
                CategoryCode = "VEH",
                Description = "Vehicle assets",
                IsActive = true
            });

        // Act
        var result = await _service.GetByIdAsync(1);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("Vehicles", result.CategoryName);
        Assert.Equal("VEH", result.CategoryCode);
        Assert.Equal("Vehicle assets", result.Description);
        Assert.True(result.IsActive);
        _mockRepository.Verify(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetCategoryEntity?)null);

        // Act
        var result = await _service.GetByIdAsync(999);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region GetAllAsync Tests

    [Fact]
    public async Task GetAllAsync_ReturnsAllEntities()
    {
        // Arrange
        var entities = new List<AssetCategoryEntity>
        {
            CreateEntity(1, "Building", "BLD", "Building assets"),
            CreateEntity(2, "Vehicle", "VEH", "Vehicle assets")
        };

        var mockQuery = entities.BuildMockDbSet();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery.Object);

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<AssetCategoryMappingProfile>();
        }, Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        IMapper mapper = mapperConfig.CreateMapper();

        var service = new AssetCategoryService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            mapper,
            _mockReferenceValidator.Object);

        var qp = new AssetCategoryQueryParameters
        {
            PageNumber = 1,
            PageSize = 10
        };

        // Act
        var result = await service.GetAllAsync(qp, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.TotalCount);

        var items = result.Items.ToList();
        Assert.Equal(2, items.Count);
        Assert.Contains(items, x => x.CategoryName == "Building");
        Assert.Contains(items, x => x.CategoryName == "Vehicle");
    }

    [Fact]
    public async Task GetAllAsync_WithActiveFilter_ReturnsOnlyActiveEntities()
    {
        // Arrange
        var entities = new List<AssetCategoryEntity>
        {
            CreateEntity(1, "Building", "BLD", isActive: true),
            CreateEntity(2, "Vehicle", "VEH", isActive: false),
            CreateEntity(3, "Equipment", "EQP", isActive: true)
        };

        var mockQuery = entities.BuildMockDbSet();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery.Object);

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<AssetCategoryMappingProfile>();
        }, Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        IMapper mapper = mapperConfig.CreateMapper();

        var service = new AssetCategoryService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            mapper,
            _mockReferenceValidator.Object);

        var qp = new AssetCategoryQueryParameters
        {
            PageNumber = 1,
            PageSize = 10,
            IsActive = true
        };

        // Act
        var result = await service.GetAllAsync(qp, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.TotalCount);
        Assert.All(result.Items, item => Assert.True(item.IsActive));
    }

    [Fact]
    public async Task GetAllAsync_WithCategoryNameFilter_ReturnsMatchingEntity()
    {
        // Arrange
        var entities = new List<AssetCategoryEntity>
        {
            CreateEntity(1, "Building", "BLD"),
            CreateEntity(2, "Vehicle", "VEH"),
            CreateEntity(3, "Equipment", "EQP")
        };

        var mockQuery = entities.BuildMockDbSet();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery.Object);

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<AssetCategoryMappingProfile>();
        }, Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        IMapper mapper = mapperConfig.CreateMapper();

        var service = new AssetCategoryService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            mapper,
            _mockReferenceValidator.Object);

        var qp = new AssetCategoryQueryParameters
        {
            PageNumber = 1,
            PageSize = 10,
            CategoryName = "Vehicle"
        };

        // Act
        var result = await service.GetAllAsync(qp, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.Items);
        Assert.Equal("Vehicle", result.Items.First().CategoryName);
    }

    private AssetCategoryService CreateServiceWithRealMapper(List<AssetCategoryEntity> entities)
    {
        _mockRepository.Setup(r => r.GetQueryable()).Returns(entities.BuildMockDbSet().Object);
        var mapper = new MapperConfiguration(cfg => cfg.AddProfile<AssetCategoryMappingProfile>(),
            Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance).CreateMapper();
        return new AssetCategoryService(_mockRepository.Object, _mockUnitOfWork.Object, mapper, _mockReferenceValidator.Object);
    }

    [Fact]
    public async Task GetAllAsync_WithBooleanFlagFilters_ReturnsMatchingEntities()
    {
        var building = CreateEntity(1, "Building", "BLD");
        building.HasFloorDetails = true;
        building.HasInventory = true;
        var land = CreateEntity(2, "Land", "LAND");
        var vehicle = CreateEntity(3, "Vehicle", "VEH");
        vehicle.IsMovable = true;
        vehicle.HasInventory = true;
        vehicle.IsInventoryMandatory = true;
        var service = CreateServiceWithRealMapper(new() { building, land, vehicle });

        var withInventory = await service.GetAllAsync(new AssetCategoryQueryParameters { HasInventory = true });
        var withoutInventory = await service.GetAllAsync(new AssetCategoryQueryParameters { HasInventory = false });
        var movableWithMandatoryInventory = await service.GetAllAsync(new AssetCategoryQueryParameters { IsMovable = true, IsInventoryMandatory = true });

        Assert.Equal(new[] { "Building", "Vehicle" }, withInventory.Items.Select(x => x.CategoryName).OrderBy(x => x));
        Assert.Equal("Land", Assert.Single(withoutInventory.Items).CategoryName);
        Assert.Equal("Vehicle", Assert.Single(movableWithMandatoryInventory.Items).CategoryName);
    }

    [Fact]
    public async Task GetAllAsync_SortByBooleanFlag_OrdersFalseBeforeTrue()
    {
        var land = CreateEntity(1, "Land", "LAND");
        land.HasLegalCompliance = true;
        var vehicle = CreateEntity(2, "Vehicle", "VEH");
        var service = CreateServiceWithRealMapper(new() { land, vehicle });

        var result = await service.GetAllAsync(new AssetCategoryQueryParameters { SortBy = nameof(AssetCategoryQueryParameters.HasLegalCompliance) });

        Assert.Equal(new[] { "Vehicle", "Land" }, result.Items.Select(x => x.CategoryName));
    }

    [Theory]
    [InlineData(nameof(AssetCategoryQueryParameters.HasLegalCompliance))]
    [InlineData(nameof(AssetCategoryQueryParameters.IsInventoryMandatory))]
    [InlineData(nameof(AssetCategoryQueryParameters.HasInventory))]
    [InlineData(nameof(AssetCategoryQueryParameters.HasFloorDetails))]
    [InlineData(nameof(AssetCategoryQueryParameters.IsMovable))]
    public void QueryParameters_FlagColumns_AreTypedBoolAndNotSearchable(string propertyName)
    {
        // SearchTerm only matches string columns, so advertising the bit columns as [Searchable] would be misleading.
        var property = typeof(AssetCategoryQueryParameters).GetProperty(propertyName)!;

        Assert.Equal(typeof(bool?), property.PropertyType);
        Assert.Null(System.Reflection.CustomAttributeExtensions.GetCustomAttribute<NtisPlatform.Application.Attributes.SearchableAttribute>(property));
        Assert.NotNull(System.Reflection.CustomAttributeExtensions.GetCustomAttribute<NtisPlatform.Application.Attributes.FilterableAttribute>(property));
        Assert.NotNull(System.Reflection.CustomAttributeExtensions.GetCustomAttribute<NtisPlatform.Application.Attributes.SortableAttribute>(property));
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_ValidDto_CreatesEntity()
    {
        // Arrange
        var createDto = new CreateAssetCategoryDto
        {
            CategoryName = "Furniture",
            CategoryCode = "FUR",
            Description = "Furniture assets",
            CreatedBy = 1
        };

        var entity = CreateEntity(
            id: 0,
            categoryName: "Furniture",
            categoryCode: "FUR",
            description: "Furniture assets");

        // Ensure validation queries (AnyAsync) use async-capable IQueryable provider
        var existingEntities = new List<AssetCategoryEntity>();
        var mockQuery = existingEntities.BuildMockDbSet();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery.Object);

        _mockMapper
            .Setup(m => m.Map<AssetCategoryEntity>(It.IsAny<CreateAssetCategoryDto>()))
            .Returns(entity);

        _mockRepository
            .Setup(r => r.AddAsync(It.IsAny<AssetCategoryEntity>(), It.IsAny<CancellationToken>()))
            .Callback<AssetCategoryEntity, CancellationToken>((e, ct) => e.Id = 1)
            .ReturnsAsync((AssetCategoryEntity e, CancellationToken ct) => e);

        _mockMapper
            .Setup(m => m.Map<AssetCategoryDto>(It.IsAny<AssetCategoryEntity>()))
            .Returns(new AssetCategoryDto
            {
                Id = 1,
                CategoryName = "Furniture",
                CategoryCode = "FUR",
                Description = "Furniture assets",
                IsActive = true
            });

        // Act
        var result = await _service.CreateAsync(createDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("Furniture", result.CategoryName);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<AssetCategoryEntity>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_ExistingEntity_UpdatesSuccessfully()
    {
        // Arrange
        var updateDto = new UpdateAssetCategoryDto
        {
            CategoryName = "Updated Building",
            CategoryCode = "UBLD",
            Description = "Updated description",
            IsActive = true,
            UpdatedBy = 1
        };

        var existingEntity = CreateEntity(1, "Building", "BLD", "Old description");

        _mockRepository
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockMapper
            .Setup(m => m.Map(It.IsAny<UpdateAssetCategoryDto>(), It.IsAny<AssetCategoryEntity>()))
            .Returns(existingEntity);

        _mockRepository
            .Setup(r => r.UpdateAsync(It.IsAny<AssetCategoryEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockMapper
            .Setup(m => m.Map<AssetCategoryDto>(It.IsAny<AssetCategoryEntity>()))
            .Returns(new AssetCategoryDto
            {
                Id = 1,
                CategoryName = "Updated Building",
                CategoryCode = "UBLD",
                Description = "Updated description",
                IsActive = true
            });

        // Act
        var result = await _service.UpdateAsync(1, updateDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Updated Building", result.CategoryName);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<AssetCategoryEntity>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_NonExistingEntity_ReturnsNull()
    {
        // Arrange
        var updateDto = new UpdateAssetCategoryDto
        {
            CategoryName = "Updated Building",
            IsActive = true,
            UpdatedBy = 1
        };

        _mockRepository
            .Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetCategoryEntity?)null);

        // Act
        var result = await _service.UpdateAsync(999, updateDto);

        // Assert
        Assert.Null(result);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<AssetCategoryEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion

    #region Deactivation Tests

    [Fact]
    public async Task UpdateAsync_DeactivateWithReferences_ThrowsValidationException()
    {
        // Arrange
        var updateDto = new UpdateAssetCategoryDto
        {
            CategoryName = "Building",
            IsActive = false, // Trying to deactivate
            UpdatedBy = 1
        };

        var existingEntity = CreateEntity(1, "Building", "BLD", isActive: true);

        _mockRepository
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockReferenceValidator
            .Setup(rv => rv.ValidateReferencesAsync<AssetCategoryEntity>(1, ReferenceValidationOperation.Deactivate, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot deactivate category with active asset types"));

        _mockMapper
            .Setup(m => m.Map(It.IsAny<UpdateAssetCategoryDto>(), It.IsAny<AssetCategoryEntity>()))
            .Returns(existingEntity)
            .Callback<UpdateAssetCategoryDto, AssetCategoryEntity>((dto, entity) => { entity.IsActive = dto.IsActive; });

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => _service.UpdateAsync(1, updateDto));

        Assert.Contains("Cannot deactivate", exception.Message);
        _mockReferenceValidator.Verify(
            rv => rv.ValidateReferencesAsync<AssetCategoryEntity>(1, ReferenceValidationOperation.Deactivate, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_DeactivateWithoutReferences_Succeeds()
    {
        // Arrange
        var updateDto = new UpdateAssetCategoryDto
        {
            CategoryName = "Building",
            IsActive = false,
            UpdatedBy = 1
        };

        var existingEntity = CreateEntity(1, "Building", "BLD", isActive: true);

        _mockRepository
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockReferenceValidator
            .Setup(rv => rv.ValidateReferencesAsync<AssetCategoryEntity>(1, ReferenceValidationOperation.Deactivate, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        _mockMapper
            .Setup(m => m.Map(It.IsAny<UpdateAssetCategoryDto>(), It.IsAny<AssetCategoryEntity>()))
            .Returns(existingEntity)
            .Callback<UpdateAssetCategoryDto, AssetCategoryEntity>((dto, entity) => { entity.IsActive = dto.IsActive; });

        _mockRepository
            .Setup(r => r.UpdateAsync(It.IsAny<AssetCategoryEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockMapper
            .Setup(m => m.Map<AssetCategoryDto>(It.IsAny<AssetCategoryEntity>()))
            .Returns(new AssetCategoryDto
            {
                Id = 1,
                CategoryName = "Building",
                IsActive = false
            });

        // Act
        var result = await _service.UpdateAsync(1, updateDto);

        // Assert
        Assert.NotNull(result);
        Assert.False(result.IsActive);
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_WithReferences_ThrowsValidationException()
    {
        // Arrange
        var entity = CreateEntity(1, "Building", "BLD");

        _mockRepository
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        _mockReferenceValidator
            .Setup(rv => rv.ValidateReferencesAsync<AssetCategoryEntity>(1, ReferenceValidationOperation.Delete, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot delete category with existing asset types"));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => _service.DeleteAsync(1));

        Assert.Contains("Cannot delete", exception.Message);
        _mockReferenceValidator.Verify(
            rv => rv.ValidateReferencesAsync<AssetCategoryEntity>(1, ReferenceValidationOperation.Delete, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WithoutReferences_MarksForDeletion()
    {
        // Arrange
        var entity = CreateEntity(1, "Building", "BLD");

        _mockRepository
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        _mockReferenceValidator
            .Setup(rv => rv.ValidateReferencesAsync<AssetCategoryEntity>(1, ReferenceValidationOperation.Delete, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        _mockRepository
            .Setup(r => r.DeleteAsync(It.IsAny<AssetCategoryEntity>(), It.IsAny<CancellationToken>()))
            .Callback<AssetCategoryEntity, CancellationToken>((e, ct) =>
            {
                if (e is IHardDeletable hardDeletable)
                {
                    hardDeletable.MarkedForDeletion = true;
                    hardDeletable.MarkedForDeletionDate = DateTime.Now;
                }
            })
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.DeleteAsync(1);

        // Assert
        Assert.True(result);
        Assert.True(entity.MarkedForDeletion);
        Assert.NotNull(entity.MarkedForDeletionDate);
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<AssetCategoryEntity>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_NonExistingEntity_ReturnsFalse()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AssetCategoryEntity?)null);

        // Act
        var result = await _service.DeleteAsync(999);

        // Assert
        Assert.False(result);
    }

    #endregion
}
