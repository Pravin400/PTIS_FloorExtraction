using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Moq;
using NtisPlatform.Application.DTOs.Master;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Mappings;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories;
using Xunit;

namespace NtisPlatform.Tests.Integration;

/// <summary>
/// Integration tests for AssetConditionMaster against a real <see cref="ApplicationDbContext"/> (EF Core
/// InMemory provider) instead of a mocked <c>IRepository</c>.
///
/// What this catches that mock-based tests (<c>AssetConditionMasterServiceTests</c>) can't: that the
/// GetAllAsync composite-key left joins (CategoryId + ConditionCategory discriminator, against
/// AssetCategoryMaster and InventoryItemCategoryMaster) actually execute against a real
/// IQueryable/DbContext pipeline instead of MockQueryable's LINQ-to-Objects provider.
///
/// What this does NOT cover: the InMemory provider does not translate LINQ to SQL, so it cannot
/// catch a query that fails to translate on SQL Server.
/// </summary>
[Trait("Category", "Integration")]
public class AssetConditionMasterIntegrationTests : IAsyncLifetime
{
    private ApplicationDbContext? _context;
    private AssetConditionMasterService? _service;

    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"AssetConditionMasterIntegrationTests_{Guid.NewGuid()}")
            .EnableSensitiveDataLogging()
            .Options;

        _context = new ApplicationDbContext(options);

        var config = new MapperConfiguration(cfg => cfg.AddProfile<AssetConditionMasterMappingProfile>(),
            Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);

        _service = new AssetConditionMasterService(
            new Repository<AssetConditionMasterEntity, int>(_context),
            new UnitOfWork(_context),
            config.CreateMapper(),
            new Mock<IReferenceValidationService>().Object,
            new Repository<AssetCategoryEntity, int>(_context),
            new Repository<InventoryItemCategoryEntity, int>(_context));

        await _context.Database.EnsureCreatedAsync();

        // Same shape as the seeded AMS data: Id 1 and 2 exist in both category masters.
        _context.Set<AssetCategoryEntity>().AddRange(
            new AssetCategoryEntity { Id = 1, CategoryCode = "CAT-BLDG", CategoryName = "Buildings", CreatedDate = DateTime.Now },
            new AssetCategoryEntity { Id = 2, CategoryCode = "CAT-LAND", CategoryName = "Land & Plots", CreatedDate = DateTime.Now });
        _context.Set<InventoryItemCategoryEntity>().AddRange(
            new InventoryItemCategoryEntity { Id = 1, AssetCategoryId = 3, TypeCode = "INV-FURN", TypeName = "Furniture", CreatedDate = DateTime.Now },
            new InventoryItemCategoryEntity { Id = 2, AssetCategoryId = 3, TypeCode = "INV-ELECT", TypeName = "Electronics", CreatedDate = DateTime.Now });
        await _context.SaveChangesAsync();
    }

    public async Task DisposeAsync()
    {
        if (_context != null)
        {
            await _context.Database.EnsureDeletedAsync();
            await _context.DisposeAsync();
        }
    }

    private async Task SeedConditionsAsync(params (int Id, string ConditionCategory, int CategoryId, string ConditionName)[] rows)
    {
        foreach (var (id, conditionCategory, categoryId, conditionName) in rows)
        {
            _context!.Set<AssetConditionMasterEntity>().Add(new AssetConditionMasterEntity
            {
                Id = id,
                ConditionCategory = conditionCategory,
                CategoryId = categoryId,
                ConditionName = conditionName,
                CreatedDate = DateTime.Now
            });
        }
        await _context!.SaveChangesAsync();
    }

    [Fact]
    public async Task GetAllAsync_ResolvesCategoryName_FromTableChosenByConditionCategory()
    {
        await SeedConditionsAsync(
            (1, "Asset", 1, "Excellent"),
            (2, "Asset", 2, "Good"),
            (3, "Inventory", 1, "New"),
            (4, "Inventory", 2, "Good"));

        var result = await _service!.GetAllAsync(new AssetConditionMasterQueryParameters(), CancellationToken.None);

        var byId = result.Items.ToDictionary(x => x.Id);
        Assert.Equal(4, result.TotalCount);
        Assert.Equal("Buildings", byId[1].CategoryName);
        Assert.Equal("Land & Plots", byId[2].CategoryName);
        Assert.Equal("Furniture", byId[3].CategoryName);
        Assert.Equal("Electronics", byId[4].CategoryName);
    }

    /// <summary>
    /// When CategoryId doesn't resolve in the table its ConditionCategory points at, the left joins
    /// must not drop the condition row -- CategoryName is simply left null.
    /// </summary>
    [Fact]
    public async Task GetAllAsync_UnresolvableCategoryId_ReturnsNullCategoryName()
    {
        await SeedConditionsAsync((1, "Inventory", 12345, "Orphan"));

        var result = await _service!.GetAllAsync(new AssetConditionMasterQueryParameters(), CancellationToken.None);

        var item = Assert.Single(result.Items);
        Assert.Equal(12345, item.CategoryId);
        Assert.Null(item.CategoryName);
    }

    /// <summary>
    /// CategoryName is produced by the joins, so filtering and sorting on it only work because the
    /// joins run before the generic Apply* helpers -- exercised here through the real DbContext pipeline.
    /// </summary>
    [Fact]
    public async Task GetAllAsync_FilterAndSortByCategoryName_UseResolvedName()
    {
        await SeedConditionsAsync(
            (1, "Asset", 1, "Excellent"),
            (2, "Inventory", 1, "New"),
            (3, "Inventory", 2, "Good"));

        var filtered = await _service!.GetAllAsync(
            new AssetConditionMasterQueryParameters { CategoryName = "Furn" }, CancellationToken.None);
        var sorted = await _service.GetAllAsync(
            new AssetConditionMasterQueryParameters { SortBy = "CategoryName", SortOrder = "desc" }, CancellationToken.None);

        Assert.Equal(2, Assert.Single(filtered.Items).Id);
        Assert.Equal(new[] { "Furniture", "Electronics", "Buildings" }, sorted.Items.Select(x => x.CategoryName));
    }

    /// <summary>
    /// SearchTerm runs across CategoryName (produced by the joins) and ConditionName, end to end through
    /// the real DbContext pipeline, with an unresolved row (null CategoryName) present. Note: the InMemory
    /// provider null-propagates method calls itself, so the search helper's own null guard is covered by
    /// the MockQueryable-based tests in AssetConditionMasterServiceTests / FilterExpressionBuilderTests.
    /// </summary>
    [Fact]
    public async Task GetAllAsync_SearchTerm_MatchesResolvedNameAndToleratesUnresolvedRows()
    {
        await SeedConditionsAsync(
            (1, "Asset", 1, "Excellent"),
            (2, "Inventory", 2, "Good"),
            (3, "Inventory", 12345, "Poor"));

        var byCategoryName = await _service!.GetAllAsync(
            new AssetConditionMasterQueryParameters { SearchTerm = "electro" }, CancellationToken.None);
        var byConditionName = await _service.GetAllAsync(
            new AssetConditionMasterQueryParameters { SearchTerm = "poor" }, CancellationToken.None);

        Assert.Equal(2, Assert.Single(byCategoryName.Items).Id);
        var orphan = Assert.Single(byConditionName.Items);
        Assert.Equal(3, orphan.Id);
        Assert.Null(orphan.CategoryName);
    }
}
