using AutoMapper;
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
/// Service-level tests for <see cref="AssetConditionMasterService"/> covering the
/// ConditionCategory/CategoryId/ConditionName duplicate-combination checks on both Create and
/// Update, the reference-validation gate on deactivation, and the GetAll CategoryName resolution
/// (polymorphic CategoryId joined against AssetCategoryMaster or InventoryItemCategoryMaster).
/// </summary>
public class AssetConditionMasterServiceTests
{
    private readonly Mock<IRepository<AssetConditionMasterEntity, int>> _mockRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IReferenceValidationService> _mockReferenceValidator;
    private readonly Mock<IRepository<AssetCategoryEntity, int>> _mockAssetCategoryRepository;
    private readonly Mock<IRepository<InventoryItemCategoryEntity, int>> _mockInventoryItemCategoryRepository;
    private readonly IMapper _mapper;
    private readonly AssetConditionMasterService _service;

    public AssetConditionMasterServiceTests()
    {
        _mockRepository = new Mock<IRepository<AssetConditionMasterEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockReferenceValidator = new Mock<IReferenceValidationService>();
        _mockAssetCategoryRepository = new Mock<IRepository<AssetCategoryEntity, int>>();
        _mockAssetCategoryRepository.Setup(r => r.GetQueryable()).Returns(new List<AssetCategoryEntity>().BuildMockDbSet().Object);
        _mockInventoryItemCategoryRepository = new Mock<IRepository<InventoryItemCategoryEntity, int>>();
        _mockInventoryItemCategoryRepository.Setup(r => r.GetQueryable()).Returns(new List<InventoryItemCategoryEntity>().BuildMockDbSet().Object);

        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<AssetConditionMasterMappingProfile>();
        }, Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();

        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _service = new AssetConditionMasterService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mapper,
            _mockReferenceValidator.Object,
            _mockAssetCategoryRepository.Object,
            _mockInventoryItemCategoryRepository.Object);
    }

    private void SetupExistingRows(params AssetConditionMasterEntity[] rows)
    {
        var mockQuery = rows.ToList().BuildMockDbSet();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery.Object);
    }

    // Mirrors the seeded AMS data: Id 1/2 exist in BOTH category tables with different names, which
    // is exactly why the join must also match on ConditionCategory.
    private void SetupCategoryMasters()
    {
        _mockAssetCategoryRepository.Setup(r => r.GetQueryable()).Returns(new List<AssetCategoryEntity>
        {
            new() { Id = 1, CategoryCode = "CAT-BLDG", CategoryName = "Buildings" },
            new() { Id = 2, CategoryCode = "CAT-LAND", CategoryName = "Land & Plots" },
            new() { Id = 3, CategoryCode = "CAT-MOV", CategoryName = "Movable Assets" }
        }.BuildMockDbSet().Object);

        _mockInventoryItemCategoryRepository.Setup(r => r.GetQueryable()).Returns(new List<InventoryItemCategoryEntity>
        {
            new() { Id = 1, TypeCode = "INV-FURN", TypeName = "Furniture" },
            new() { Id = 2, TypeCode = "INV-ELECT", TypeName = "Electronics" }
        }.BuildMockDbSet().Object);
    }

    private void SetupConditionsWithCategoryMasters()
    {
        SetupCategoryMasters();
        SetupExistingRows(
            new AssetConditionMasterEntity { Id = 1, ConditionCategory = "Asset", CategoryId = 1, ConditionName = "Excellent", IsActive = true },
            new AssetConditionMasterEntity { Id = 2, ConditionCategory = "Asset", CategoryId = 2, ConditionName = "Good", IsActive = true },
            new AssetConditionMasterEntity { Id = 3, ConditionCategory = "Asset", CategoryId = 3, ConditionName = "Fair", IsActive = true },
            new AssetConditionMasterEntity { Id = 4, ConditionCategory = "Inventory", CategoryId = 1, ConditionName = "New", IsActive = true },
            new AssetConditionMasterEntity { Id = 5, ConditionCategory = "Inventory", CategoryId = 2, ConditionName = "Good", IsActive = true });
    }

    #region GetAll - CategoryName Resolution

    [Fact]
    public async Task GetAllAsync_ResolvesCategoryName_FromTableChosenByConditionCategory()
    {
        SetupConditionsWithCategoryMasters();

        var result = await _service.GetAllAsync(new AssetConditionMasterQueryParameters(), CancellationToken.None);

        var byId = result.Items.ToDictionary(x => x.Id);
        Assert.Equal(5, result.TotalCount);
        Assert.Equal("Buildings", byId[1].CategoryName);
        Assert.Equal("Land & Plots", byId[2].CategoryName);
        Assert.Equal("Movable Assets", byId[3].CategoryName);
        Assert.Equal("Furniture", byId[4].CategoryName);
        Assert.Equal("Electronics", byId[5].CategoryName);
    }

    // CategoryId 1 exists in both masters -- the discriminator, not the id, decides the source.
    [Fact]
    public async Task GetAllAsync_SameCategoryIdInBothMasters_DoesNotCrossResolve()
    {
        SetupCategoryMasters();
        SetupExistingRows(
            new AssetConditionMasterEntity { Id = 1, ConditionCategory = "Asset", CategoryId = 1, ConditionName = "Good", IsActive = true },
            new AssetConditionMasterEntity { Id = 2, ConditionCategory = "Inventory", CategoryId = 1, ConditionName = "Good", IsActive = true });

        var result = await _service.GetAllAsync(new AssetConditionMasterQueryParameters(), CancellationToken.None);

        var byId = result.Items.ToDictionary(x => x.Id);
        Assert.Equal(2, result.TotalCount);
        Assert.Equal("Buildings", byId[1].CategoryName);
        Assert.Equal("Furniture", byId[2].CategoryName);
    }

    // Left joins must keep the condition row even when CategoryId has no match in the table its
    // ConditionCategory points at (orphaned id, or an unexpected discriminator value).
    [Theory]
    [InlineData("Asset", 999)]
    [InlineData("Inventory", 999)]
    [InlineData("Inventory", 3)]   // Id 3 exists only in AssetCategoryMaster
    [InlineData("Unknown", 1)]
    public async Task GetAllAsync_UnresolvableCategory_ReturnsRowWithNullCategoryName(string conditionCategory, int categoryId)
    {
        SetupCategoryMasters();
        SetupExistingRows(new AssetConditionMasterEntity { Id = 1, ConditionCategory = conditionCategory, CategoryId = categoryId, ConditionName = "Good", IsActive = true });

        var result = await _service.GetAllAsync(new AssetConditionMasterQueryParameters(), CancellationToken.None);

        var item = Assert.Single(result.Items);
        Assert.Equal(categoryId, item.CategoryId);
        Assert.Null(item.CategoryName);
    }

    // The list projection is hand-written (not AutoMapper), so guard against a field being dropped.
    [Fact]
    public async Task GetAllAsync_ProjectsAllConditionFields()
    {
        SetupCategoryMasters();
        var created = new DateTime(2026, 7, 14, 15, 43, 28);
        var updated = new DateTime(2026, 7, 15, 13, 0, 51);
        SetupExistingRows(new AssetConditionMasterEntity
        {
            Id = 7,
            ConditionCategory = "Asset",
            CategoryId = 1,
            ConditionName = "Excellent",
            Description = "Newly built with no defects",
            ConditionFactor = 1.0000m,
            DisplayOrder = 1,
            IsActive = false,
            CreatedDate = created,
            UpdatedDate = updated
        });

        var result = await _service.GetAllAsync(new AssetConditionMasterQueryParameters(), CancellationToken.None);

        var item = Assert.Single(result.Items);
        Assert.Equal(7, item.Id);
        Assert.Equal("Asset", item.ConditionCategory);
        Assert.Equal(1, item.CategoryId);
        Assert.Equal("Buildings", item.CategoryName);
        Assert.Equal("Excellent", item.ConditionName);
        Assert.Equal("Newly built with no defects", item.Description);
        Assert.Equal(1.0000m, item.ConditionFactor);
        Assert.Equal(1, item.DisplayOrder);
        Assert.False(item.IsActive);
        Assert.Equal(created, item.CreatedDate);
        Assert.Equal(updated, item.UpdatedDate);
    }

    // The Add-Asset wizard's existing filter must keep working after the join.
    [Fact]
    public async Task GetAllAsync_FilterByConditionCategoryAndCategoryId_ReturnsOnlyThatScale()
    {
        SetupConditionsWithCategoryMasters();

        var result = await _service.GetAllAsync(
            new AssetConditionMasterQueryParameters { ConditionCategory = "Inventory", CategoryId = 1 }, CancellationToken.None);

        var item = Assert.Single(result.Items);
        Assert.Equal("New", item.ConditionName);
        Assert.Equal("Furniture", item.CategoryName);
    }

    [Fact]
    public async Task GetAllAsync_FilterByCategoryName_MatchesAcrossBothMasters()
    {
        SetupConditionsWithCategoryMasters();

        // Contains filter: "ure" hits "Furniture" (Inventory); "Buildings" etc. don't match.
        var result = await _service.GetAllAsync(new AssetConditionMasterQueryParameters { CategoryName = "ure" }, CancellationToken.None);

        var item = Assert.Single(result.Items);
        Assert.Equal(4, item.Id);
    }

    [Fact]
    public async Task GetAllAsync_FilterByCategoryName_CountIgnoresPaging()
    {
        SetupConditionsWithCategoryMasters();

        // "s" hits Buildings, Land & Plots, Movable Assets, Electronics -- not Furniture.
        var result = await _service.GetAllAsync(
            new AssetConditionMasterQueryParameters { CategoryName = "s", PageNumber = 2, PageSize = 3 }, CancellationToken.None);

        Assert.Equal(4, result.TotalCount);
        Assert.Single(result.Items);
    }

    [Theory]
    [InlineData("asc", new[] { "Buildings", "Electronics", "Furniture", "Land & Plots", "Movable Assets" })]
    [InlineData("desc", new[] { "Movable Assets", "Land & Plots", "Furniture", "Electronics", "Buildings" })]
    public async Task GetAllAsync_SortByCategoryName_OrdersByResolvedName(string sortOrder, string[] expected)
    {
        SetupConditionsWithCategoryMasters();

        var result = await _service.GetAllAsync(
            new AssetConditionMasterQueryParameters { SortBy = "CategoryName", SortOrder = sortOrder }, CancellationToken.None);

        Assert.Equal(expected, result.Items.Select(x => x.CategoryName));
    }

    [Fact]
    public async Task GetAllAsync_SearchTerm_MatchesCategoryName()
    {
        SetupConditionsWithCategoryMasters();

        var result = await _service.GetAllAsync(new AssetConditionMasterQueryParameters { SearchTerm = "electro" }, CancellationToken.None);

        var item = Assert.Single(result.Items);
        Assert.Equal(5, item.Id);
    }

    [Fact]
    public async Task GetAllAsync_SearchTerm_StillMatchesConditionName()
    {
        SetupConditionsWithCategoryMasters();

        var result = await _service.GetAllAsync(new AssetConditionMasterQueryParameters { SearchTerm = "excel" }, CancellationToken.None);

        Assert.Equal("Buildings", Assert.Single(result.Items).CategoryName);
    }

    // CategoryName is [Searchable] but null for rows whose CategoryId doesn't resolve. Search must treat
    // that null as "no match" (and still try ConditionName) rather than throw from ToLower().
    [Fact]
    public async Task GetAllAsync_SearchTerm_WithUnresolvedCategoryName_MatchesOnConditionNameInsteadOfThrowing()
    {
        SetupCategoryMasters();
        SetupExistingRows(
            new AssetConditionMasterEntity { Id = 1, ConditionCategory = "Asset", CategoryId = 1, ConditionName = "Excellent", IsActive = true },
            new AssetConditionMasterEntity { Id = 2, ConditionCategory = "Inventory", CategoryId = 999, ConditionName = "Poor", IsActive = true });

        var result = await _service.GetAllAsync(new AssetConditionMasterQueryParameters { SearchTerm = "poor" }, CancellationToken.None);

        var item = Assert.Single(result.Items);
        Assert.Equal(2, item.Id);
        Assert.Null(item.CategoryName);
    }

    [Fact]
    public async Task GetAllAsync_SearchTerm_WithUnresolvedCategoryName_ExcludesRowWhenNothingMatches()
    {
        SetupCategoryMasters();
        SetupExistingRows(
            new AssetConditionMasterEntity { Id = 1, ConditionCategory = "Asset", CategoryId = 1, ConditionName = "Excellent", IsActive = true },
            new AssetConditionMasterEntity { Id = 2, ConditionCategory = "Unknown", CategoryId = 1, ConditionName = "Poor", IsActive = true });

        var result = await _service.GetAllAsync(new AssetConditionMasterQueryParameters { SearchTerm = "build" }, CancellationToken.None);

        Assert.Equal(1, Assert.Single(result.Items).Id);
        Assert.Equal(1, result.TotalCount);
    }

    [Fact]
    public async Task GetAllAsync_FilterByMarkedForDeletion_StillWorksAfterJoin()
    {
        SetupCategoryMasters();
        SetupExistingRows(
            new AssetConditionMasterEntity { Id = 1, ConditionCategory = "Asset", CategoryId = 1, ConditionName = "Live", IsActive = true },
            new AssetConditionMasterEntity { Id = 2, ConditionCategory = "Asset", CategoryId = 1, ConditionName = "Gone", IsActive = false, MarkedForDeletion = true });

        var result = await _service.GetAllAsync(new AssetConditionMasterQueryParameters { MarkedForDeletion = false }, CancellationToken.None);

        Assert.Equal("Live", Assert.Single(result.Items).ConditionName);
    }

    [Fact]
    public async Task GetAllAsync_PageSizeMinusOne_ReturnsAllRowsUnpaged()
    {
        SetupConditionsWithCategoryMasters();

        var result = await _service.GetAllAsync(new AssetConditionMasterQueryParameters { PageNumber = 3, PageSize = -1 }, CancellationToken.None);

        Assert.Equal(5, result.TotalCount);
        Assert.Equal(5, result.Items.Count());
        Assert.Equal(1, result.PageNumber);
        Assert.Equal(5, result.PageSize);
    }

    [Fact]
    public async Task GetAllAsync_EmptyTable_ReturnsEmptyResult()
    {
        SetupCategoryMasters();
        SetupExistingRows();

        var result = await _service.GetAllAsync(new AssetConditionMasterQueryParameters(), CancellationToken.None);

        Assert.Equal(0, result.TotalCount);
        Assert.Empty(result.Items);
    }

    #endregion

    #region Create - Duplicate Combination Validation

    [Fact]
    public async Task CreateAsync_WithUniqueCombination_Succeeds()
    {
        SetupExistingRows();
        var createDto = new CreateAssetConditionMasterDto { ConditionCategory = "Asset", CategoryId = 1, ConditionName = "Good" };

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Good", result.ConditionName);
    }

    [Fact]
    public async Task CreateAsync_WithDuplicateCombination_ThrowsValidationException()
    {
        SetupExistingRows(new AssetConditionMasterEntity { Id = 1, ConditionCategory = "Asset", CategoryId = 1, ConditionName = "Good", IsActive = true });
        var createDto = new CreateAssetConditionMasterDto { ConditionCategory = "Asset", CategoryId = 1, ConditionName = "Good" };

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.CreateAsync(createDto, CancellationToken.None));

        Assert.Equal("Condition Name 'Good' already exists for the selected Asset Category.", ex.Errors[nameof(createDto.ConditionName)]);
        Assert.Equal("Condition Name 'Good' already exists for the selected Asset Category.", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_WithDuplicateInventoryCondition_NamesInventoryCategoryInMessage()
    {
        SetupExistingRows(new AssetConditionMasterEntity { Id = 1, ConditionCategory = "Inventory", CategoryId = 1, ConditionName = "New", IsActive = true });
        var createDto = new CreateAssetConditionMasterDto { ConditionCategory = "Inventory", CategoryId = 1, ConditionName = "New" };

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.CreateAsync(createDto, CancellationToken.None));

        Assert.Equal("Condition Name 'New' already exists for the selected Inventory Category.", ex.Errors[nameof(createDto.ConditionName)]);
    }

    [Fact]
    public async Task CreateAsync_WithSameNameUnderDifferentCategory_Succeeds()
    {
        SetupExistingRows(new AssetConditionMasterEntity { Id = 1, ConditionCategory = "Asset", CategoryId = 1, ConditionName = "Good", IsActive = true });
        var createDto = new CreateAssetConditionMasterDto { ConditionCategory = "Inventory", CategoryId = 1, ConditionName = "Good" };

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Inventory", result.ConditionCategory);
    }

    #endregion

    #region Update - Duplicate Combination Validation (excluding self)

    [Fact]
    public async Task UpdateAsync_WithUniqueCombination_Succeeds()
    {
        var existing = new AssetConditionMasterEntity { Id = 1, ConditionCategory = "Asset", CategoryId = 1, ConditionName = "Good", IsActive = true };
        SetupExistingRows(existing);
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

        var updateDto = new UpdateAssetConditionMasterDto { ConditionCategory = "Asset", CategoryId = 1, ConditionName = "Excellent", IsActive = true };

        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Excellent", result!.ConditionName);
    }

    [Fact]
    public async Task UpdateAsync_WithCombinationClashingAgainstAnotherRecord_ThrowsValidationException()
    {
        var recordBeingUpdated = new AssetConditionMasterEntity { Id = 1, ConditionCategory = "Asset", CategoryId = 1, ConditionName = "Good", IsActive = true };
        var otherRecord = new AssetConditionMasterEntity { Id = 2, ConditionCategory = "Asset", CategoryId = 1, ConditionName = "Poor", IsActive = true };
        SetupExistingRows(recordBeingUpdated, otherRecord);
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(recordBeingUpdated);

        // Attempt to rename record 1 to record 2's (ConditionCategory, CategoryId, ConditionName) combination
        var updateDto = new UpdateAssetConditionMasterDto { ConditionCategory = "Asset", CategoryId = 1, ConditionName = "Poor", IsActive = true };

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.UpdateAsync(1, updateDto, CancellationToken.None));

        Assert.Equal("Condition Name 'Poor' already exists for the selected Asset Category.", ex.Errors[nameof(updateDto.ConditionName)]);
    }

    [Fact]
    public async Task UpdateAsync_KeepingOwnCombinationUnchanged_DoesNotThrowDuplicateException()
    {
        var existing = new AssetConditionMasterEntity { Id = 1, ConditionCategory = "Asset", CategoryId = 1, ConditionName = "Good", IsActive = true };
        SetupExistingRows(existing);
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

        // Same ConditionCategory/CategoryId/ConditionName as itself — only Description changes.
        // This also proves the duplicate query excludes the current record ID (x.Id != id).
        var updateDto = new UpdateAssetConditionMasterDto { ConditionCategory = "Asset", CategoryId = 1, ConditionName = "Good", Description = "Updated description", IsActive = true };

        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Updated description", result!.Description);
    }

    #endregion

    #region Update - Deactivation Reference Validation

    [Fact]
    public async Task UpdateAsync_DeactivatingUnreferencedRecord_Succeeds()
    {
        var existing = new AssetConditionMasterEntity { Id = 1, ConditionCategory = "Asset", CategoryId = 1, ConditionName = "Good", IsActive = true };
        SetupExistingRows(existing);
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _mockReferenceValidator
            .Setup(v => v.ValidateReferencesAsync<AssetConditionMasterEntity>(1, ReferenceValidationOperation.Deactivate, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        var updateDto = new UpdateAssetConditionMasterDto { ConditionCategory = "Asset", CategoryId = 1, ConditionName = "Good", IsActive = false };

        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.False(result!.IsActive);
        _mockReferenceValidator.Verify(
            v => v.ValidateReferencesAsync<AssetConditionMasterEntity>(1, ReferenceValidationOperation.Deactivate, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_DeactivatingReferencedRecord_ThrowsValidationException()
    {
        var existing = new AssetConditionMasterEntity { Id = 1, ConditionCategory = "Asset", CategoryId = 1, ConditionName = "Good", IsActive = true };
        SetupExistingRows(existing);
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _mockReferenceValidator
            .Setup(v => v.ValidateReferencesAsync<AssetConditionMasterEntity>(1, ReferenceValidationOperation.Deactivate, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Id", "Cannot deactivate - record is referenced by other entities"));

        var updateDto = new UpdateAssetConditionMasterDto { ConditionCategory = "Asset", CategoryId = 1, ConditionName = "Good", IsActive = false };

        await Assert.ThrowsAsync<ValidationException>(() =>
            _service.UpdateAsync(1, updateDto, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_WithCancellationToken_PropagatesTokenToRepository()
    {
        var existing = new AssetConditionMasterEntity { Id = 1, ConditionCategory = "Asset", CategoryId = 1, ConditionName = "Good", IsActive = true };
        SetupExistingRows(existing);
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

        using var cts = new CancellationTokenSource();
        var updateDto = new UpdateAssetConditionMasterDto { ConditionCategory = "Asset", CategoryId = 1, ConditionName = "Excellent", IsActive = true };

        var result = await _service.UpdateAsync(1, updateDto, cts.Token);

        Assert.NotNull(result);
        _mockRepository.Verify(r => r.GetByIdAsync(1, cts.Token), Times.Once);
    }

    #endregion
}
