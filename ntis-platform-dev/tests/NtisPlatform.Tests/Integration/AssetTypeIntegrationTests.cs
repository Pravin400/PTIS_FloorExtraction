using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Moq;
using NtisPlatform.Application.DTOs.Master;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Mappings;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories;
using Xunit;

namespace NtisPlatform.Tests.Integration;

/// <summary>
/// Integration tests for AssetType against a real <see cref="ApplicationDbContext"/> (EF Core
/// InMemory provider) instead of a mocked <c>IRepository</c>.
///
/// What this catches that mock-based tests (<c>AssetTypeServiceTests</c>) can't: that the
/// GetAllAsync join query (GroupJoin/DefaultIfEmpty against AssetCategoryMaster) actually executes
/// against a real IQueryable/DbContext pipeline instead of MockQueryable's LINQ-to-Objects provider.
///
/// What this does NOT cover: the InMemory provider does not translate LINQ to SQL, so it cannot
/// catch a query that fails to translate on SQL Server.
/// </summary>
[Trait("Category", "Integration")]
public class AssetTypeIntegrationTests : IAsyncLifetime
{
    private ApplicationDbContext? _context;
    private AssetTypeService? _service;

    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"AssetTypeIntegrationTests_{Guid.NewGuid()}")
            .EnableSensitiveDataLogging()
            .Options;

        _context = new ApplicationDbContext(options);

        var config = new MapperConfiguration(cfg => cfg.AddProfile<AssetTypeMappingProfile>(),
            Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);

        var referenceValidator = new Mock<IReferenceValidationService>();
        referenceValidator
            .Setup(x => x.ValidateReferencesAsync<AssetTypeEntity>(It.IsAny<int>(), It.IsAny<ReferenceValidationOperation>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.Models.ValidationResult.Success());

        _service = new AssetTypeService(
            new Repository<AssetTypeEntity, int>(_context),
            new UnitOfWork(_context),
            config.CreateMapper(),
            referenceValidator.Object,
            new Repository<AssetCategoryEntity, int>(_context));

        await _context.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        if (_context != null)
        {
            await _context.Database.EnsureDeletedAsync();
            await _context.DisposeAsync();
        }
    }

    private static AssetTypeEntity NewAssetType(int id, int assetCategoryId, string code, string name) => new()
    {
        Id = id,
        AssetCategoryId = assetCategoryId,
        TypeCode = code,
        TypeName = name,
        CreatedDate = DateTime.Now
    };

    [Fact]
    public async Task GetAllAsync_PopulatesAssetCategoryName_FromReferencedAssetCategory()
    {
        _context!.Set<AssetCategoryEntity>().Add(
            new AssetCategoryEntity { Id = 5, CategoryCode = "IMM", CategoryName = "Immovable", CreatedDate = DateTime.Now });
        _context.Set<AssetTypeEntity>().Add(NewAssetType(1, 5, "BLD", "Building"));
        await _context.SaveChangesAsync();

        var result = await _service!.GetAllAsync(new AssetTypeQueryParameters { PageNumber = 1, PageSize = 10 }, CancellationToken.None);

        var item = Assert.Single(result.Items);
        Assert.Equal(5, item.AssetCategoryId);
        Assert.Equal("Immovable", item.AssetCategoryName);
    }

    /// <summary>
    /// When AssetCategoryId doesn't resolve to any row (orphaned FK), the left join must not drop
    /// the AssetType row -- AssetCategoryName is simply left null.
    /// </summary>
    [Fact]
    public async Task GetAllAsync_UnresolvableAssetCategoryId_ReturnsNullAssetCategoryName()
    {
        _context!.Set<AssetTypeEntity>().Add(NewAssetType(1, 12345, "ORP", "Orphan"));
        await _context.SaveChangesAsync();

        var result = await _service!.GetAllAsync(new AssetTypeQueryParameters { PageNumber = 1, PageSize = 10 }, CancellationToken.None);

        var item = Assert.Single(result.Items);
        Assert.Equal(12345, item.AssetCategoryId);
        Assert.Null(item.AssetCategoryName);
    }

    /// <summary>
    /// AssetCategoryName is produced by the join, so filtering and sorting on it only work because the
    /// join runs before the generic Apply* helpers -- exercised here through the real DbContext pipeline.
    /// </summary>
    [Fact]
    public async Task GetAllAsync_FilterAndSortByAssetCategoryName_UseJoinedName()
    {
        _context!.Set<AssetCategoryEntity>().AddRange(
            new AssetCategoryEntity { Id = 5, CategoryCode = "ELEC", CategoryName = "Electronics", CreatedDate = DateTime.Now },
            new AssetCategoryEntity { Id = 6, CategoryCode = "FURN", CategoryName = "Furniture", CreatedDate = DateTime.Now });
        _context.Set<AssetTypeEntity>().AddRange(
            NewAssetType(1, 6, "CHAIR", "Chairs"),
            NewAssetType(2, 5, "LAPTOP", "Laptops"),
            NewAssetType(3, 5, "PHONE", "Phones"));
        await _context.SaveChangesAsync();

        var filtered = await _service!.GetAllAsync(
            new AssetTypeQueryParameters { AssetCategoryName = "Electronics" }, CancellationToken.None);
        var sorted = await _service.GetAllAsync(
            new AssetTypeQueryParameters { SortBy = "AssetCategoryName", SortOrder = "desc" }, CancellationToken.None);

        Assert.Equal(2, filtered.TotalCount);
        Assert.All(filtered.Items, x => Assert.Equal("Electronics", x.AssetCategoryName));
        Assert.Equal("Furniture", sorted.Items.First().AssetCategoryName);
    }
}
