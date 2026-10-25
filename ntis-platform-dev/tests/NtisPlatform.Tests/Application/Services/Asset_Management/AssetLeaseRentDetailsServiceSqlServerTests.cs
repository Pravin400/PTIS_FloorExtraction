using AutoMapper;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Application.DTOs.Asset_Management.AssetLeaseRentDetails;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Mappings.Asset_Management;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.Asset_Management;

/// <summary>
/// A throwaway SQL Server database holding just the tables
/// <see cref="AssetLeaseRentDetailsService.GetAllAsync"/> reads, created from the EF model, with every
/// foreign key left out so rows can be seeded without their masters. Only runs when
/// NTIS_TEST_SQLSERVER is set (see <see cref="SqlServerFactAttribute"/>).
/// </summary>
public sealed class LeaseListingSqlServerFixture : IAsyncLifetime
{
    private static readonly Type[] ListingEntities =
    {
        typeof(AssetMasterEntity), typeof(AssetCategoryEntity), typeof(AssetDetailsEntity),
        typeof(InventoryAssetDetailEntity), typeof(AssetLeaseRentDetailsEntity),
        typeof(AssetPhotoEntity), typeof(DocumentBindingEntity), typeof(DocumentEntity)
    };

    public DbContextOptions<ApplicationDbContext> Options { get; private set; } = null!;
    public bool IsAvailable { get; private set; }

    public async Task InitializeAsync()
    {
        var serverConnectionString = SqlServerFactAttribute.ConnectionString;
        if (string.IsNullOrWhiteSpace(serverConnectionString))
            return;

        var connectionString = new SqlConnectionStringBuilder(serverConnectionString)
        {
            InitialCatalog = $"NtisLeaseListingTests_{Guid.NewGuid():N}"
        }.ConnectionString;
        Options = new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlServer(connectionString).Options;

        await using var context = new ApplicationDbContext(Options);
        var creator = context.GetService<IRelationalDatabaseCreator>();
        await creator.CreateAsync();
        try
        {
            await CreateListingTablesAsync(context);
        }
        catch
        {
            await creator.DeleteAsync();
            throw;
        }

        IsAvailable = true;
    }

    private static async Task CreateListingTablesAsync(ApplicationDbContext context)
    {
        var model = context.GetService<IDesignTimeModel>().Model;
        var tables = ListingEntities
            .Select(type => model.FindEntityType(type)!)
            .Select(entity => (Schema: entity.GetSchema(), Name: entity.GetTableName()!))
            .ToHashSet();

        var operations = context.GetService<IMigrationsModelDiffer>()
            .GetDifferences(null, model.GetRelationalModel())
            .Where(operation => operation switch
            {
                CreateTableOperation table => tables.Contains((table.Schema, table.Name)),
                CreateIndexOperation index => tables.Contains((index.Schema, index.Table)),
                _ => false
            })
            .ToList();

        foreach (var table in operations.OfType<CreateTableOperation>())
            table.ForeignKeys.Clear();

        foreach (var schema in tables.Select(t => t.Schema).OfType<string>().Distinct())
            await context.Database.ExecuteSqlRawAsync($"IF SCHEMA_ID(N'{schema}') IS NULL EXEC(N'CREATE SCHEMA [{schema}]')");
        foreach (var command in context.GetService<IMigrationsSqlGenerator>().Generate(operations, model))
            await context.Database.ExecuteSqlRawAsync(command.CommandText);
    }

    public async Task DisposeAsync()
    {
        if (!IsAvailable)
            return;

        await using var context = new ApplicationDbContext(Options);
        await context.Database.EnsureDeletedAsync();
    }
}

/// <summary>
/// <see cref="AssetLeaseRentDetailsService.GetAllAsync"/> against real SQL Server. Its "latest lease
/// per asset" join returns no rows under the EF InMemory provider (see
/// AssetLeaseRentDetailsServiceIntegrationTests), so the listing's filters and sorting are proven
/// here. Each test seeds its own parent asset and filters on it, so tests don't see each other's rows.
/// </summary>
[Trait("Category", "SqlServer")]
public class AssetLeaseRentDetailsServiceSqlServerTests : IClassFixture<LeaseListingSqlServerFixture>
{
    private static readonly IMapper Mapper = new MapperConfiguration(
        cfg => cfg.AddProfile<AssetLeaseRentDetailsMappingProfile>(),
        Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance).CreateMapper();

    private readonly LeaseListingSqlServerFixture _database;

    public AssetLeaseRentDetailsServiceSqlServerTests(LeaseListingSqlServerFixture database)
    {
        _database = database;
    }

    private ApplicationDbContext NewContext() => new(_database.Options);

    private static AssetLeaseRentDetailsService CreateService(ApplicationDbContext context) => new(
        new Repository<AssetLeaseRentDetailsEntity, int>(context), new UnitOfWork(context), Mapper,
        new Repository<AssetMasterEntity, int>(context),
        new Repository<AssetRoomWiseSubmissionDetailsEntity, int>(context),
        new Repository<LeaseRentRegistrationHistoryEntity, int>(context),
        new Repository<ModuleMasterEntity, int>(context),
        new Repository<DocumentEntity, int>(context),
        new Repository<DocumentBindingEntity, int>(context),
        new Repository<InventoryAssetDetailEntity, int>(context),
        new Repository<UserRoleAllocationEntity, int>(context),
        new UserAccessRepository(context),
        new Mock<IReferenceValidationService>().Object,
        new Mock<IDocumentService>().Object,
        new Mock<IFileStorageService>().Object,
        new Repository<AssetPhotoEntity, int>(context),
        new ConfigurationBuilder().Build(),
        new Mock<ILogger<AssetLeaseRentDetailsService>>().Object);

    private void RequireDatabase() => Assert.True(_database.IsAvailable, "The SQL Server test database was not created.");

    /// <summary>A parent asset with one leased shop under it per tenant mobile; returns the parent's id.</summary>
    private async Task<int> SeedLeasedShopsAsync(params string[] tenantMobiles)
    {
        await using var context = NewContext();
        var key = Guid.NewGuid().ToString("N")[..12];

        var category = new AssetCategoryEntity { CategoryCode = key, CategoryName = $"Shops {key}", IsMovable = false, IsActive = true };
        context.Set<AssetCategoryEntity>().Add(category);
        await context.SaveChangesAsync();

        var parent = new AssetMasterEntity
        {
            AssetNo = $"MKT-{key}", AssetName = "Market", AssetCategoryId = category.Id, AssetTypeId = 1,
            IsActive = true, CreatedDate = DateTime.Now
        };
        context.Set<AssetMasterEntity>().Add(parent);
        await context.SaveChangesAsync();

        for (var i = 0; i < tenantMobiles.Length; i++)
        {
            var shop = new AssetMasterEntity
            {
                AssetNo = $"SHP-{key}-{i}", AssetName = $"Shop {i}", AssetCategoryId = category.Id, AssetTypeId = 1,
                ParentAssetId = parent.Id, IsActive = true, CreatedDate = DateTime.Now
            };
            context.Set<AssetMasterEntity>().Add(shop);
            await context.SaveChangesAsync();

            context.Set<AssetLeaseRentDetailsEntity>().Add(new AssetLeaseRentDetailsEntity
            {
                AssetId = shop.Id,
                TenantName = $"Tenant {i}",
                TenantMobile = tenantMobiles[i],
                LeaseStartDate = new DateTime(2026, 4, 1),
                WorkflowStatus = "Approved",
                IsActive = true,
                CreatedDate = DateTime.Now
            });
        }
        await context.SaveChangesAsync();
        return parent.Id;
    }

    [SqlServerFact]
    public async Task GetAllAsync_FiltersByPartOfTheTenantMobile()
    {
        RequireDatabase();
        var parentId = await SeedLeasedShopsAsync("9876543210", "9123456789", "9988776655");

        await using var context = NewContext();
        var result = await CreateService(context).GetAllAsync(
            new AssetLeaseRentDetailsQueryParameters { ParentAssetId = parentId, TenantMobile = "43210" });

        var lease = Assert.Single(result.Items);
        Assert.Equal("9876543210", lease.TenantMobile);
        Assert.Equal(1, result.TotalCount);
    }

    [SqlServerFact]
    public async Task GetAllAsync_SortsByTenantMobile_InBothDirections()
    {
        RequireDatabase();
        var parentId = await SeedLeasedShopsAsync("9876543210", "9123456789", "9988776655");

        await using var context = NewContext();
        var service = CreateService(context);
        var ascending = await service.GetAllAsync(
            new AssetLeaseRentDetailsQueryParameters { ParentAssetId = parentId, SortBy = "TenantMobile", SortOrder = "asc" });
        var descending = await service.GetAllAsync(
            new AssetLeaseRentDetailsQueryParameters { ParentAssetId = parentId, SortBy = "tenantmobile", SortOrder = "desc" });

        Assert.Equal(new[] { "9123456789", "9876543210", "9988776655" }, ascending.Items.Select(l => l.TenantMobile));
        Assert.Equal(new[] { "9988776655", "9876543210", "9123456789" }, descending.Items.Select(l => l.TenantMobile));
    }
}
