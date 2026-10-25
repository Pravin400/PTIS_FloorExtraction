using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces.Asset_Management;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.Asset_Management;

/// <summary>
/// A throwaway SQL Server database holding just the tables
/// <see cref="ManageSubUnitsService.GetSubUnitsAllDetailsByParentIdAsync"/> reads, created from the EF
/// model, with every foreign key left out so rows can be seeded without their masters. Only runs when
/// NTIS_TEST_SQLSERVER is set (see <see cref="SqlServerFactAttribute"/>).
/// </summary>
public sealed class SubUnitsAllDetailsSqlServerFixture : IAsyncLifetime
{
    private static readonly Type[] AllDetailsEntities =
    {
        typeof(AssetMasterEntity), typeof(InventoryAssetDetailEntity), typeof(AssetDetailsEntity),
        typeof(AssetTypeOfUseMasterEntity), typeof(AssetSubTypeOfUseEntity), typeof(SubUnitsDetailsEntity),
        typeof(FloorEntity), typeof(SubFloorEntity), typeof(ConstructionTypeEntity),
        typeof(AssetRoomWiseSubmissionDetailsEntity), typeof(AssetRoomWiseMinusDataEntity),
        typeof(AssetLeaseRentDetailsEntity), typeof(MonthWiseDemandEntity)
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
            InitialCatalog = $"NtisSubUnitsAllDetailsTests_{Guid.NewGuid():N}"
        }.ConnectionString;
        // Same provider setup as the API (the model has geometry columns).
        Options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(connectionString, sql => sql.UseNetTopologySuite())
            .Options;

        await using var context = new ApplicationDbContext(Options);
        var creator = context.GetService<IRelationalDatabaseCreator>();
        await creator.CreateAsync();
        try
        {
            await CreateTablesAsync(context);
        }
        catch
        {
            await creator.DeleteAsync();
            throw;
        }

        IsAvailable = true;
    }

    private static async Task CreateTablesAsync(ApplicationDbContext context)
    {
        var model = context.GetService<IDesignTimeModel>().Model;
        var tables = AllDetailsEntities
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
        {
            // Schema names come from the EF model, not user input; CREATE SCHEMA cannot take a parameter.
            var createSchemaSql = "IF SCHEMA_ID(N'" + schema + "') IS NULL EXEC(N'CREATE SCHEMA [" + schema + "]')";
            await context.Database.ExecuteSqlRawAsync(createSchemaSql);
        }
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
/// <see cref="ManageSubUnitsService.GetSubUnitsAllDetailsByParentIdAsync"/> against real SQL Server.
/// The unit tests run its queries as LINQ-to-Objects through MockQueryable, which cannot prove that
/// EF Core translates the demand GroupBy/Sum, the lease-pool and inventory subqueries, or the floor
/// master Includes. Each test seeds its own parent asset, so tests don't see each other's rows.
/// </summary>
[Trait("Category", "SqlServer")]
public class ManageSubUnitsServiceSqlServerTests : IClassFixture<SubUnitsAllDetailsSqlServerFixture>
{
    private readonly SubUnitsAllDetailsSqlServerFixture _database;

    public ManageSubUnitsServiceSqlServerTests(SubUnitsAllDetailsSqlServerFixture database)
    {
        _database = database;
    }

    private ApplicationDbContext NewContext() => new(_database.Options);

    private static ManageSubUnitsService CreateService(ApplicationDbContext context)
    {
        var photoService = new Mock<IAssetPhotoService>();
        photoService.Setup(p => p.GetLatestByAssetIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AssetPhotoEntity>());

        return new ManageSubUnitsService(
            new Repository<AssetMasterEntity, int>(context),
            new Repository<AssetLeaseRentDetailsEntity, int>(context),
            new Repository<AssetRoomWiseSubmissionDetailsEntity, int>(context),
            new Repository<SubUnitsDetailsEntity, int>(context),
            new Repository<AssetApplicationTypeEntity, int>(context),
            new Repository<AssetRoomWiseMinusDataEntity, int>(context),
            new Repository<AssetDetailsEntity, int>(context),
            new Repository<SubUnitsDetailsEntity, int>(context),
            new Repository<InventoryAssetDetailEntity, int>(context),
            new Repository<AssetTypeOfUseMasterEntity, int>(context),
            new Repository<AssetSubTypeOfUseEntity, int>(context),
            new Repository<MonthWiseDemandEntity, int>(context),
            new Mock<IAssetMasterService>().Object,
            photoService.Object,
            new Mock<IDocumentApplicationService>().Object,
            new Repository<DepartmentMasterEntity, int>(context),
            new Repository<ModuleMasterEntity, int>(context),
            new UnitOfWork(context),
            new Mock<ILogger<ManageSubUnitsService>>().Object);
    }

    private void RequireDatabase() => Assert.True(_database.IsAvailable, "The SQL Server test database was not created.");

    private static string NewKey() => Guid.NewGuid().ToString("N")[..12];

    private static async Task<AssetMasterEntity> AddAssetAsync(
        ApplicationDbContext context, string assetNo, string assetName, int? parentAssetId = null, bool markedForDeletion = false)
    {
        var asset = new AssetMasterEntity
        {
            AssetNo = assetNo,
            AssetName = assetName,
            AssetCategoryId = 1,
            AssetTypeId = 1,
            ParentAssetId = parentAssetId,
            MarkedForDeletion = markedForDeletion,
            IsActive = true,
            CreatedDate = DateTime.Now
        };
        context.Set<AssetMasterEntity>().Add(asset);
        await context.SaveChangesAsync();
        return asset;
    }

    private static async Task<AssetLeaseRentDetailsEntity> AddLeaseAsync(
        ApplicationDbContext context, int assetId, string shopNo, int? floorDetailsId, decimal rentAmount,
        string paymentFrequency, bool markedForDeletion = false)
    {
        var lease = new AssetLeaseRentDetailsEntity
        {
            AssetId = assetId,
            ShopNo = shopNo,
            FloorDetailsId = floorDetailsId,
            TenantName = $"Tenant {shopNo.Trim()}",
            TenantMobile = "9876543210",
            LeaseStartDate = new DateTime(2025, 4, 1),
            RentAmount = rentAmount,
            PaymentFrequency = paymentFrequency,
            WorkflowStatus = "Approved",
            MarkedForDeletion = markedForDeletion,
            IsActive = true,
            CreatedDate = DateTime.Now
        };
        context.Set<AssetLeaseRentDetailsEntity>().Add(lease);
        await context.SaveChangesAsync();
        return lease;
    }

    private static MonthWiseDemandEntity Demand(
        int assetId, byte month, decimal rent, decimal penalty = 0m, decimal gst = 0m, decimal paid = 0m,
        string status = "Pending")
        => new()
        {
            AssetId = assetId,
            LeaseRegistrationId = 1,
            FinanceYear = 2025,
            DemandYear = 2025,
            QuarterNo = 1,
            DemandMonth = month,
            MonthlyRentAmount = rent,
            PenaltyAmount = penalty,
            GSTAmount = gst,
            PaidAmount = paid,
            DemandStatus = status,
            IsActive = true,
            CreatedDate = DateTime.Now
        };

    [SqlServerFact]
    public async Task GetSubUnitsAllDetailsByParentIdAsync_AggregatesDemandPerUnit()
    {
        RequireDatabase();
        var key = NewKey();
        int parentId, shop1Id, shop2Id, shop3Id;

        await using (var context = NewContext())
        {
            var parent = await AddAssetAsync(context, $"MKT-{key}", "Market");
            var shop1 = await AddAssetAsync(context, $"SHOP-{key}-1", "Shop 1", parent.Id);
            var shop2 = await AddAssetAsync(context, $"SHOP-{key}-2", "Shop 2", parent.Id);
            var shop3 = await AddAssetAsync(context, $"SHOP-{key}-3", "Shop 3", parent.Id);
            (parentId, shop1Id, shop2Id, shop3Id) = (parent.Id, shop1.Id, shop2.Id, shop3.Id);

            var inactive = Demand(shop1.Id, month: 7, rent: 777m);
            context.Set<MonthWiseDemandEntity>().AddRange(
                Demand(shop1.Id, month: 4, rent: 1000m, penalty: 50m, gst: 180m, paid: 1230m, status: "Paid"),
                Demand(shop1.Id, month: 5, rent: 1000m),
                Demand(shop1.Id, month: 6, rent: 999m, status: "Cancelled"),
                inactive,
                Demand(shop2.Id, month: 4, rent: 200m, paid: 125m, status: "Partial"),
                Demand(parent.Id, month: 4, rent: 5000m)); // the parent's own demand is not a unit's
            await context.SaveChangesAsync();

            // IsActive has a DB default of 1, so a false set on insert would be dropped; update it instead.
            await context.Set<MonthWiseDemandEntity>()
                .Where(d => d.Id == inactive.Id)
                .ExecuteUpdateAsync(s => s.SetProperty(d => d.IsActive, false));
        }

        await using var read = NewContext();
        var result = await CreateService(read).GetSubUnitsAllDetailsByParentIdAsync(parentId);

        Assert.Equal(new[] { shop1Id, shop2Id, shop3Id }, result.Select(r => r.Id));

        var shop1Result = result.Single(r => r.Id == shop1Id);
        Assert.Equal(2230m, shop1Result.TotalDemand);       // 1230 + 1000; cancelled and inactive rows excluded
        Assert.Equal(1230m, shop1Result.TotalCollection);
        Assert.Equal(1000m, shop1Result.TotalArrears);
        Assert.Equal(55m, shop1Result.CollectionEfficiency);

        var shop2Result = result.Single(r => r.Id == shop2Id);
        Assert.Equal(200m, shop2Result.TotalDemand);
        Assert.Equal(125m, shop2Result.TotalCollection);
        Assert.Equal(75m, shop2Result.TotalArrears);
        Assert.Equal(62m, shop2Result.CollectionEfficiency); // 62.5 rounds half to even

        var shop3Result = result.Single(r => r.Id == shop3Id);
        Assert.Null(shop3Result.TotalDemand);
        Assert.Null(shop3Result.TotalCollection);
        Assert.Null(shop3Result.TotalArrears);
        Assert.Null(shop3Result.CollectionEfficiency);
    }

    [SqlServerFact]
    public async Task GetSubUnitsAllDetailsByParentIdAsync_RunsEveryQueryAgainstSqlServer()
    {
        RequireDatabase();
        var key = NewKey();
        int parentId, shopId, floorDetailsId, roomId, parentLeaseId, siblingLeaseId;

        await using (var context = NewContext())
        {
            var parent = await AddAssetAsync(context, $"MKT-{key}", "Market");
            var shop = await AddAssetAsync(context, $"SHOP-{key}", $"Shop {key}", parent.Id);
            var inventoryUnit = await AddAssetAsync(context, $"INV-{key}", "Fan", parent.Id);
            var deletedSibling = await AddAssetAsync(context, $"OLD-{key}", "Old shop", parent.Id, markedForDeletion: true);
            var otherParent = await AddAssetAsync(context, $"OTH-{key}", "Other market");
            var otherUnit = await AddAssetAsync(context, $"OTH-{key}-1", "Other shop", otherParent.Id);
            (parentId, shopId) = (parent.Id, shop.Id);

            context.Set<AssetDetailsEntity>().AddRange(
                new AssetDetailsEntity { AssetId = parent.Id, OrganizationId = 1, PropertyNo = $"PN-{key}" },
                new AssetDetailsEntity { AssetId = shop.Id, OrganizationId = 1, MpmsNo = $"MP-{key}" });
            context.Set<InventoryAssetDetailEntity>().Add(new InventoryAssetDetailEntity { AssetId = inventoryUnit.Id, BatchId = 1, UnitNumber = 1 });

            var floor = new FloorEntity { FloorCode = key, Description = "Ground Floor" };
            var constructionType = new ConstructionTypeEntity { ConstructionCode = key, Description = "RCC" };
            var typeOfUse = new AssetTypeOfUseMasterEntity { AssetCategoryId = 1, AssetTypeId = 1, TypeOfUseCode = key[..10], Description = "Commercial" };
            context.AddRange(floor, constructionType, typeOfUse);
            await context.SaveChangesAsync();

            var subTypeOfUse = new AssetSubTypeOfUseEntity { TypeOfUseId = typeOfUse.Id, Description = "Shop" };
            context.Add(subTypeOfUse);
            await context.SaveChangesAsync();

            var floorDetails = new SubUnitsDetailsEntity
            {
                AssetId = shop.Id,
                FloorId = floor.Id,
                ConstructionTypeId = constructionType.Id,
                TypeOfUseId = typeOfUse.Id,
                SubTypeOfUseId = subTypeOfUse.Id,
                CapitalValue = 1250000m,
                BuiltUpAreaSqMeter = 27.8709m,
                CarpetAreaSqMeter = 23.2258m,
                CVAgeFactor = 0.95m,
                CVUseFactor = 1.2m,
                IsActive = true,
                CreatedDate = DateTime.Now
            };
            context.Add(floorDetails);
            await context.SaveChangesAsync();
            floorDetailsId = floorDetails.Id;

            var room = new AssetRoomWiseSubmissionDetailsEntity { AssetId = shop.Id, SubUnitsDetailsId = floorDetails.Id, RoomNo = "1", RoomType = "Shop" };
            context.Add(room);
            await context.SaveChangesAsync();
            roomId = room.Id;
            context.Add(new AssetRoomWiseMinusDataEntity { RoomWiseSubmissionId = room.Id, Shape = "Rectangle" });

            context.Set<MonthWiseDemandEntity>().Add(Demand(shop.Id, month: 4, rent: 5500m, paid: 5500m, status: "Paid"));
            await context.SaveChangesAsync();

            // Recorded against the parent building; attached to the shop by ShopNo (case and spaces ignored).
            parentLeaseId = (await AddLeaseAsync(context, parent.Id, $"  shop-{key} ", floorDetails.Id, 5500m, "Monthly")).Id;
            // Recorded against a deleted sibling; still in the pool, attached by the shop's MpmsNo.
            siblingLeaseId = (await AddLeaseAsync(context, deletedSibling.Id, $"MP-{key}", null, 30000m, "Yearly")).Id;
            // Another building's unit and a deleted lease never reach the pool.
            await AddLeaseAsync(context, otherUnit.Id, $"SHOP-{key}", null, 9999m, "Monthly");
            await AddLeaseAsync(context, shop.Id, $"SHOP-{key}", null, 8888m, "Monthly", markedForDeletion: true);
        }

        await using var read = NewContext();
        var result = await CreateService(read).GetSubUnitsAllDetailsByParentIdAsync(parentId);

        var dto = Assert.Single(result); // inventory unit and deleted sibling are excluded
        Assert.Equal(shopId, dto.Id);
        Assert.Equal($"PN-{key}", dto.PropertyNo);
        Assert.Equal($"MP-{key}", dto.MpmsNo);
        Assert.Equal("Shop", dto.UnitType);

        var floorResult = Assert.Single(dto.FloorDetails);
        Assert.Equal(floorDetailsId, floorResult.Id);
        Assert.Equal("Ground Floor", floorResult.FloorName);
        Assert.Null(floorResult.SubFloorName);
        Assert.Equal("RCC", floorResult.ConstructionTypeName);
        Assert.Equal("Commercial", floorResult.TypeOfUseName);
        Assert.Equal("Shop", floorResult.SubTypeOfUseName);
        Assert.Equal(1250000m, dto.CapitalValue);
        Assert.Equal(27.8709m, dto.BuiltUpAreaSqMeter);
        Assert.Equal(23.2258m, dto.CarpetAreaSqMeter);
        Assert.Equal(1.14m, dto.AvgWeightedValue);

        var roomResult = Assert.Single(dto.RoomWiseDetails);
        Assert.Equal(roomId, roomResult.Id);
        Assert.Single(roomResult.MinusDetails);

        Assert.Equal(new[] { parentLeaseId, siblingLeaseId }, dto.LeaseRentDetails.Select(l => l.Id));
        Assert.True(dto.IsRented);
        Assert.Equal(5500m, dto.RentAmount);
        Assert.Equal(66000m + 30000m, dto.AnnualRevenue);

        Assert.Equal(5500m, dto.TotalDemand);
        Assert.Equal(100m, dto.CollectionEfficiency);
    }
}
